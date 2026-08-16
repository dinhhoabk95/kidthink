import {
  encryptTotpSecret,
  generateTotpCode,
  generateTotpSecret,
  hashPassword,
  hashRecoveryCode,
} from "@kidthink/auth";
import {
  activeSessions,
  auditLogs,
  getOwnerDb,
  managers,
  mfaRecoveryCodes,
  mfaSettings,
} from "@kidthink/db";

import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import loginHandler from "../../../server/api/guest/auth/managers/login.post";
import mfaHandler from "../../../server/api/guest/auth/managers/mfa.post";

describe("Task 2 & 3 — Manager Login & MFA Handler (BR-ADA-01..08)", () => {
  it("Task 2: correct password returns 428 MFA_REQUIRED + challenge without creating active_session", async () => {
    const db = getOwnerDb();
    const testEmail = `admin_login_test_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}@tinimath.test`;
    const passwordHash = await hashPassword("AdminSecret123!");

    const [manager] = await db
      .insert(managers)
      .values({
        email: testEmail,
        passwordHash,
        displayName: "Test Admin",
        role: "super_admin",
        mfaEnabled: true,
      })
      .returning();

    const event = {
      method: "POST",
      node: { req: {}, res: {} },
      context: {},
      _body: {
        email: testEmail,
        password: "AdminSecret123!",
      },
    } as any;

    const res = await loginHandler(event);
    expect(res).toBeDefined();
    expect(res.status).toBe("MFA_REQUIRED");
    expect(res.challenge).toBeDefined();

    // Verify NO active_sessions created yet
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

  it("Task 2: wrong password returns 401 INVALID_CREDENTIALS + audits manager_login_failed", async () => {
    const db = getOwnerDb();
    const testEmail = `admin_wrong_pass_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}@tinimath.test`;
    const passwordHash = await hashPassword("AdminSecret123!");

    await db.insert(managers).values({
      email: testEmail,
      passwordHash,
      displayName: "Wrong Pass Admin",
      role: "super_admin",
    });

    const event = {
      method: "POST",
      node: { req: {}, res: {} },
      context: {},
      _body: {
        email: testEmail,
        password: "WrongPassword!",
      },
    } as any;

    try {
      await loginHandler(event);
      expect.fail("Should have thrown 401");
    } catch (err: any) {
      expect(err.statusCode || err.status).toBe(401);
    }

    // Verify audit log for manager_login_failed
    const logs = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.action, "manager_login_failed"));
    expect(logs.length).toBeGreaterThan(0);
  });

  it("Task 3: valid TOTP code completes login without JSON tokens + audits manager_login", async () => {
    const db = getOwnerDb();
    const testEmail = `admin_mfa_success_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}@tinimath.test`;
    const passwordHash = await hashPassword("AdminSecret123!");
    const secret = generateTotpSecret();

    const [manager] = await db
      .insert(managers)
      .values({
        email: testEmail,
        passwordHash,
        displayName: "MFA Success Admin",
        role: "super_admin",
        mfaEnabled: true,
      })
      .returning();

    await db.insert(mfaSettings).values({
      accountType: "manager",
      accountId: manager.id,
      secretEncrypted: encryptTotpSecret(
        secret,
        process.env.NUXT_ADMIN_JWT_SECRET ??
          "kidthink-dev-secret-kidthink-dev-secret-32bytes"
      ),
      confirmedAt: new Date(),
    });

    // Step 1: Login to get challenge
    const loginEvent = {
      method: "POST",
      node: { req: {}, res: {} },
      context: {},
      _body: { email: testEmail, password: "AdminSecret123!" },
    } as any;
    const loginRes = await loginHandler(loginEvent);

    // Step 2: MFA submit
    const totpCode = generateTotpCode(secret);
    const mfaEvent = {
      method: "POST",
      node: { req: {}, res: {} },
      context: {},
      _body: {
        challenge: loginRes.challenge,
        code: totpCode,
      },
    } as any;

    const mfaRes = await mfaHandler(mfaEvent);
    expect(mfaRes.status).toBe("ok");
    expect(mfaRes.access_token).toBeUndefined();

    // Verify active_sessions row created
    const sessions = await db
      .select()
      .from(activeSessions)
      .where(eq(activeSessions.accountId, manager.id));
    expect(sessions.length).toBeGreaterThan(0);

    // Verify audit log manager_login created
    const logs = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.action, "manager_login"));
    expect(logs.some((l) => l.entityId === manager.id.toString())).toBe(true);
  });

  it("Task 3: valid single-use recovery code completes login and marks code used", async () => {
    const db = getOwnerDb();
    const testEmail = `admin_recovery_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}@tinimath.test`;
    const passwordHash = await hashPassword("AdminSecret123!");
    const recoveryCode = "ABCD-1234-EFGH";
    const codeHash = hashRecoveryCode(recoveryCode);

    const [manager] = await db
      .insert(managers)
      .values({
        email: testEmail,
        passwordHash,
        displayName: "Recovery Admin",
        role: "super_admin",
        mfaEnabled: true,
      })
      .returning();

    const [recRow] = await db
      .insert(mfaRecoveryCodes)
      .values({
        accountType: "manager",
        accountId: manager.id,
        codeHash,
      })
      .returning();

    // Login
    const loginRes = await loginHandler({
      method: "POST",
      node: { req: {}, res: {} },
      context: {},
      _body: { email: testEmail, password: "AdminSecret123!" },
    } as any);

    // MFA submit recovery code
    const mfaRes = await mfaHandler({
      method: "POST",
      node: { req: {}, res: {} },
      context: {},
      _body: {
        challenge: loginRes.challenge,
        code: recoveryCode,
      },
    } as any);

    expect(mfaRes.status).toBe("ok");

    // Verify recovery code marked as used
    const [updatedRec] = await db
      .select()
      .from(mfaRecoveryCodes)
      .where(eq(mfaRecoveryCodes.id, recRow.id));
    expect(updatedRec.usedAt).not.toBeNull();
  });
});
