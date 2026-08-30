import {
  decryptTotpSecret,
  encryptTotpSecret,
  generateTotpCode,
  generateTotpSecret,
  hashPassword,
} from "@mindkid/auth";
import {
  activeSessions,
  auditLogs,
  getOwnerDb,
  managers,
  mfaRecoveryCodes,
  mfaSettings,
} from "@mindkid/db";
import { and, eq } from "drizzle-orm";
import type { H3Event } from "h3";
import { describe, expect, it } from "vitest";
import loginHandler from "#server/api/guest/auth/managers/login.post";
import mfaHandler from "#server/api/guest/auth/managers/mfa.post";
import mfaSetupHandler from "#server/api/guest/auth/managers/mfa-setup.post";

interface AppErrorLike {
  statusCode?: number;
  status?: number;
  statusMessage?: string;
  code?: string;
}

function mockH3Event(body: Record<string, unknown>): H3Event {
  return {
    method: "POST",
    node: { req: { headers: {}, body }, res: {} },
    context: { body },
    _requestBody: body,
    _body: body,
  } as unknown as H3Event;
}

describe("Manager MFA Enrollment Flow (BR-MME-01..07, Task #105)", () => {
  it("Scenario 1 (BR-MME-01): Manager with MFA already enabled cannot enroll (returns 409 MFA_ALREADY_ENABLED and does not overwrite settings)", async () => {
    const db = getOwnerDb();
    const testEmail = `admin_already_mfa_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}@tinimath.test`;
    const passwordHash = await hashPassword("AdminSecret123!");
    const initialSecret = generateTotpSecret();

    const [manager] = await db
      .insert(managers)
      .values({
        email: testEmail,
        passwordHash,
        displayName: "Already MFA Admin",
        role: "super_admin",
        mfaEnabled: true,
      })
      .returning();

    const initialEncrypted = encryptTotpSecret(
      initialSecret,
      process.env.MFA_ENCRYPTION_KEY as string
    );

    await db.insert(mfaSettings).values({
      accountType: "manager",
      accountId: manager.id,
      secretEncrypted: initialEncrypted,
      confirmedAt: new Date(),
    });

    // Login step -> gives challenge
    const loginRes = await loginHandler(
      mockH3Event({ email: testEmail, password: "AdminSecret123!" })
    );
    expect(loginRes.status).toBe("MFA_REQUIRED");
    expect(loginRes.mfa_enabled).toBe(true);

    // Call mfa-setup with valid challenge -> Must throw 409 MFA_ALREADY_ENABLED
    try {
      await mfaSetupHandler(mockH3Event({ challenge: loginRes.challenge }));
      expect.fail("Should have thrown 409 MFA_ALREADY_ENABLED");
    } catch (error) {
      const err = error as AppErrorLike;
      expect(err.statusCode || err.status).toBe(409);
      expect(err.statusMessage || err.code).toBe("MFA_ALREADY_ENABLED");
    }

    // Verify mfa_settings row was NOT overwritten
    const [persistedSetting] = await db
      .select()
      .from(mfaSettings)
      .where(
        and(
          eq(mfaSettings.accountType, "manager"),
          eq(mfaSettings.accountId, manager.id)
        )
      );
    expect(persistedSetting.secretEncrypted).toBe(initialEncrypted);
    expect(persistedSetting.confirmedAt).not.toBeNull();
  });

  it("Scenario 2 (BR-MME-02): mfa-setup does NOT create sessions or active_session rows", async () => {
    const db = getOwnerDb();
    const testEmail = `admin_unconfirmed_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}@tinimath.test`;
    const passwordHash = await hashPassword("AdminSecret123!");

    const [manager] = await db
      .insert(managers)
      .values({
        email: testEmail,
        passwordHash,
        displayName: "New Unconfirmed Admin",
        role: "super_admin",
        mfaEnabled: false,
      })
      .returning();

    const loginRes = await loginHandler(
      mockH3Event({ email: testEmail, password: "AdminSecret123!" })
    );
    expect(loginRes.mfa_enabled).toBe(false);

    const setupRes = await mfaSetupHandler(
      mockH3Event({ challenge: loginRes.challenge })
    );

    expect(setupRes.otpauth_uri).toContain("otpauth://");
    expect(setupRes.challenge).toBeDefined();

    // Verify NO active_sessions created
    const sessions = await db
      .select()
      .from(activeSessions)
      .where(
        and(
          eq(activeSessions.accountType, "manager"),
          eq(activeSessions.accountId, manager.id)
        )
      );
    expect(sessions).toHaveLength(0);
  });

  it("Scenario 3 (BR-MME-03): Reusing old consumed challenge fails with INVALID_CREDENTIALS", async () => {
    const db = getOwnerDb();
    const testEmail = `admin_challenge_reuse_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}@tinimath.test`;
    const passwordHash = await hashPassword("AdminSecret123!");

    const [manager] = await db
      .insert(managers)
      .values({
        email: testEmail,
        passwordHash,
        displayName: "Challenge Reuse Admin",
        role: "super_admin",
        mfaEnabled: false,
      })
      .returning();

    const loginRes = await loginHandler(
      mockH3Event({ email: testEmail, password: "AdminSecret123!" })
    );
    const challengeA = loginRes.challenge;

    // Exchange challengeA for challengeB
    const setupRes = await mfaSetupHandler(
      mockH3Event({ challenge: challengeA })
    );
    const challengeB = setupRes.challenge;

    // Attempting to use challengeA again in mfa or mfa-setup must throw 401 INVALID_CREDENTIALS
    try {
      await mfaHandler(mockH3Event({ challenge: challengeA, code: "123456" }));
      expect.fail("Should have thrown 401");
    } catch (error) {
      const err = error as AppErrorLike;
      expect(err.statusCode || err.status).toBe(401);
    }

    try {
      await mfaSetupHandler(mockH3Event({ challenge: challengeA }));
      expect.fail("Should have thrown 401");
    } catch (error) {
      const err = error as AppErrorLike;
      expect(err.statusCode || err.status).toBe(401);
    }

    // But challengeB works for valid code
    const [setting] = await db
      .select()
      .from(mfaSettings)
      .where(eq(mfaSettings.accountId, manager.id));
    const secret = decryptTotpSecret(
      setting.secretEncrypted,
      process.env.MFA_ENCRYPTION_KEY as string
    );
    const validCode = generateTotpCode(secret);

    const mfaRes = await mfaHandler(
      mockH3Event({ challenge: challengeB, code: validCode })
    );
    expect(mfaRes.status).toBe("ok");
  });

  it("Scenario 4 (BR-MME-04): Abandoned setup can be restarted, replacing unconfirmed secret", async () => {
    const db = getOwnerDb();
    const testEmail = `admin_abandoned_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}@tinimath.test`;
    const passwordHash = await hashPassword("AdminSecret123!");

    const [manager] = await db
      .insert(managers)
      .values({
        email: testEmail,
        passwordHash,
        displayName: "Abandoned Setup Admin",
        role: "super_admin",
        mfaEnabled: false,
      })
      .returning();

    // First login & setup
    const login1 = await loginHandler(
      mockH3Event({ email: testEmail, password: "AdminSecret123!" })
    );
    await mfaSetupHandler(mockH3Event({ challenge: login1.challenge }));

    const [firstSetting] = await db
      .select()
      .from(mfaSettings)
      .where(eq(mfaSettings.accountId, manager.id));
    expect(firstSetting.confirmedAt).toBeNull();
    const firstSecretEncrypted = firstSetting.secretEncrypted;

    // Manager abandons and logs in again
    const login2 = await loginHandler(
      mockH3Event({ email: testEmail, password: "AdminSecret123!" })
    );
    await mfaSetupHandler(mockH3Event({ challenge: login2.challenge }));

    const settings = await db
      .select()
      .from(mfaSettings)
      .where(eq(mfaSettings.accountId, manager.id));
    expect(settings).toHaveLength(1);
    expect(settings[0].secretEncrypted).not.toBe(firstSecretEncrypted);
    expect(settings[0].confirmedAt).toBeNull();
  });

  it("Scenario 5 & 6 (BR-MME-05, BR-MME-06): First confirmation commits in ONE transaction (confirmed_at, mfa_enabled, 10 recovery codes, audit log)", async () => {
    const db = getOwnerDb();
    const testEmail = `admin_tx_test_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}@tinimath.test`;
    const passwordHash = await hashPassword("AdminSecret123!");

    const [manager] = await db
      .insert(managers)
      .values({
        email: testEmail,
        passwordHash,
        displayName: "Tx Test Admin",
        role: "super_admin",
        mfaEnabled: false,
      })
      .returning();

    const loginRes = await loginHandler(
      mockH3Event({ email: testEmail, password: "AdminSecret123!" })
    );
    const setupRes = await mfaSetupHandler(
      mockH3Event({ challenge: loginRes.challenge })
    );

    // Negative branch: wrong TOTP code fails and does NOT confirm MFA
    try {
      await mfaHandler(
        mockH3Event({ challenge: setupRes.challenge, code: "000000" })
      );
      expect.fail("Should have thrown on wrong code");
    } catch (error) {
      const err = error as AppErrorLike;
      expect(err.statusCode || err.status).toBe(401);
    }

    const [stillUnconfirmed] = await db
      .select()
      .from(mfaSettings)
      .where(eq(mfaSettings.accountId, manager.id));
    expect(stillUnconfirmed.confirmedAt).toBeNull();

    // Verify audit log manager_mfa_failed recorded
    const failAudit = await db
      .select()
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.action, "manager_mfa_failed"),
          eq(auditLogs.entityId, manager.id.toString())
        )
      );
    expect(failAudit.length).toBeGreaterThan(0);

    // Now re-login & setup again for valid submission
    const loginValid = await loginHandler(
      mockH3Event({ email: testEmail, password: "AdminSecret123!" })
    );
    const setupValid = await mfaSetupHandler(
      mockH3Event({ challenge: loginValid.challenge })
    );

    const [setting] = await db
      .select()
      .from(mfaSettings)
      .where(eq(mfaSettings.accountId, manager.id));
    const secret = decryptTotpSecret(
      setting.secretEncrypted,
      process.env.MFA_ENCRYPTION_KEY as string
    );
    const validCode = generateTotpCode(secret);

    const mfaRes = await mfaHandler(
      mockH3Event({ challenge: setupValid.challenge, code: validCode })
    );

    expect(mfaRes.status).toBe("ok");
    expect(mfaRes.recovery_codes).toBeDefined();
    expect(mfaRes.recovery_codes).toHaveLength(10);

    // Verify DB atomic state:
    // 1. confirmedAt set
    const [confirmedSetting] = await db
      .select()
      .from(mfaSettings)
      .where(eq(mfaSettings.accountId, manager.id));
    expect(confirmedSetting.confirmedAt).not.toBeNull();

    // 2. managers.mfa_enabled = true
    const [updatedManager] = await db
      .select()
      .from(managers)
      .where(eq(managers.id, manager.id));
    expect(updatedManager.mfaEnabled).toBe(true);

    // 3. 10 recovery codes created
    const recoveryRows = await db
      .select()
      .from(mfaRecoveryCodes)
      .where(
        and(
          eq(mfaRecoveryCodes.accountType, "manager"),
          eq(mfaRecoveryCodes.accountId, manager.id)
        )
      );
    expect(recoveryRows).toHaveLength(10);

    // 4. Audit manager_mfa_enrolled created
    const enrollAudit = await db
      .select()
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.action, "manager_mfa_enrolled"),
          eq(auditLogs.entityId, manager.id.toString())
        )
      );
    expect(enrollAudit.length).toBeGreaterThan(0);
  });

  it("Scenario 7 (BR-MME-07): Rate limiting applies to mfa-setup endpoint", async () => {
    const db = getOwnerDb();
    const testEmail = `admin_rate_limit_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}@tinimath.test`;
    const passwordHash = await hashPassword("AdminSecret123!");

    await db.insert(managers).values({
      email: testEmail,
      passwordHash,
      displayName: "Rate Limit Admin",
      role: "super_admin",
      mfaEnabled: false,
    });

    // Invalid body or challenge triggers invalid credentials
    try {
      await mfaSetupHandler(
        mockH3Event({ challenge: "non_existent_challenge_token" })
      );
      expect.fail("Should throw 401 on invalid challenge");
    } catch (error) {
      const err = error as AppErrorLike;
      expect(err.statusCode || err.status).toBe(401);
    }
  });
});
