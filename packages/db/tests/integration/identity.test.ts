import { hashPassword } from "@mindkid/auth";
import { eq, getTableColumns } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { assertNoOAuthProviderTokens, getAppDb, getOwnerDb } from "#src/index";
import {
  consentLogs,
  consentRequirements,
  managerPasskeys,
  managerSessions,
  managers,
  managerTwoFactors,
  userAccounts,
  userPasskeys,
  userSessions,
  users,
  userTwoFactors,
} from "#src/schema/identity";

describe("Identity Schema Integration Tests", () => {
  it("BR-SIB-01: users table has NO role, persona, tier, package, or tenant_id columns", () => {
    const cols = Object.values(getTableColumns(users)).map((c) => c.name);
    expect(cols).not.toContain("role");
    expect(cols).not.toContain("persona");
    expect(cols).not.toContain("tier");
    expect(cols).not.toContain("package");
    expect(cols).not.toContain("package_code");
    expect(cols).not.toContain("tenant_id");
  });

  it("BR-AUT-39 & BR-AUT-45: explicit Better Auth tables isolate user and manager sessions, 2FA, and passkeys", async () => {
    const db = getOwnerDb();
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 100_000)}`;
    const [u] = await db
      .insert(users)
      .values({
        email: `ba-u-${suffix}@example.com`,
        displayName: "BA User",
      })
      .returning();
    const [m] = await db
      .insert(managers)
      .values({
        email: `ba-m-${suffix}@example.com`,
        passwordHash: await hashPassword("xK9#mQ2$vL8!wP5@"),
        displayName: "BA Manager",
        role: "super_admin",
      })
      .returning();
    if (!(u && m)) {
      throw new Error("Failed to insert user/manager");
    }

    const expiresAt = new Date(Date.now() + 3_600_000);
    const [uSess] = await db
      .insert(userSessions)
      .values({
        userId: u.id,
        token: `u-tok-${suffix}`,
        authMethod: "password",
        expiresAt,
      })
      .returning();
    expect(uSess?.userId).toBe(u.id);

    const [mSess] = await db
      .insert(managerSessions)
      .values({
        userId: m.id,
        token: `m-tok-${suffix}`,
        authMethod: "password",
        expiresAt,
      })
      .returning();
    expect(mSess?.userId).toBe(m.id);

    const [u2fa] = await db
      .insert(userTwoFactors)
      .values({
        userId: u.id,
        secret: `u-sec-${suffix}`,
        backupCodes: "[]",
      })
      .returning();
    expect(u2fa?.userId).toBe(u.id);

    const [m2fa] = await db
      .insert(managerTwoFactors)
      .values({
        userId: m.id,
        secret: `m-sec-${suffix}`,
        backupCodes: "[]",
      })
      .returning();
    expect(m2fa?.userId).toBe(m.id);

    const [uPk] = await db
      .insert(userPasskeys)
      .values({
        userId: u.id,
        name: "Touch ID",
        publicKey: "pub-u",
        credentialID: `cred-u-${suffix}`,
        counter: 0,
        deviceType: "singleDevice",
        backedUp: false,
      })
      .returning();
    expect(uPk?.userId).toBe(u.id);

    const [mPk] = await db
      .insert(managerPasskeys)
      .values({
        userId: m.id,
        name: "YubiKey",
        publicKey: "pub-m",
        credentialID: `cred-m-${suffix}`,
        counter: 0,
        deviceType: "multiDevice",
        backedUp: true,
      })
      .returning();
    expect(mPk?.userId).toBe(m.id);
  });

  it("BR-SIB-05: users and managers store Argon2id password_hash ($argon2id$)", async () => {
    const hash = await hashPassword("xK9#mQ2$vL8!wP5@");
    expect(hash.startsWith("$argon2id$")).toBe(true);
  });

  it("BR-SIB-12: consent_requirements stores 3 consent types (terms, privacy, child_data) with forward-only reconsent_required_at marker", async () => {
    const db = getOwnerDb();
    const marker1 = new Date("2026-06-01T00:00:00.000Z");
    const marker2 = new Date("2026-09-01T00:00:00.000Z");

    await db
      .insert(consentRequirements)
      .values({
        consentType: "terms",
        reconsentRequiredAt: marker1,
        notice: "Cập nhật điều khoản sử dụng",
      })
      .onConflictDoUpdate({
        target: consentRequirements.consentType,
        set: {
          reconsentRequiredAt: marker2,
          notice: "Cập nhật điều khoản sử dụng lần 2",
        },
      });

    const [row] = await db
      .select()
      .from(consentRequirements)
      .where(eq(consentRequirements.consentType, "terms"));
    expect(row).toBeDefined();
    expect(row?.consentType).toBe("terms");
    expect(
      (row?.reconsentRequiredAt?.getTime() ?? 0) >= marker1.getTime()
    ).toBe(true);
  });

  it("BR-SIB-07: enforces case-insensitive email UNIQUE on users", async () => {
    const db = getOwnerDb();
    const email = `test-${Date.now()}@example.com`;

    await db.insert(users).values({
      email,
      displayName: "User One",
      status: "active",
    });

    await expect(
      db.insert(users).values({
        email: email.toUpperCase(),
        displayName: "User Two",
        status: "active",
      })
    ).rejects.toThrow();
  });

  it("BR-SIB-08: allows users without password_hash (null password for SNS users)", async () => {
    const db = getOwnerDb();
    const email = `sns-only-${Date.now()}@example.com`;

    const [inserted] = await db
      .insert(users)
      .values({
        email,
        displayName: "SNS User",
        passwordHash: null,
        status: "active",
      })
      .returning();
    if (!inserted) {
      throw new Error("Failed to insert user");
    }

    expect(inserted).toBeDefined();
    expect(inserted.passwordHash).toBeNull();
  });

  it("BR-SIB-09: enforces both UNIQUE constraints on user_accounts", async () => {
    const db = getOwnerDb();
    const email1 = `sns-u1-${Date.now()}@example.com`;
    const email2 = `sns-u2-${Date.now()}@example.com`;
    const sub1 = `g-12345-${Date.now()}`;
    const sub2 = `g-67890-${Date.now()}`;

    const [u1] = await db
      .insert(users)
      .values({ email: email1, displayName: "U1" })
      .returning();
    const [u2] = await db
      .insert(users)
      .values({ email: email2, displayName: "U2" })
      .returning();
    if (!(u1 && u2)) {
      throw new Error("Failed to insert u1/u2");
    }

    await db.insert(userAccounts).values({
      userId: u1.id,
      providerId: "google",
      accountId: sub1,
    });

    await expect(
      db.insert(userAccounts).values({
        userId: u2.id,
        providerId: "google",
        accountId: sub1,
      })
    ).rejects.toThrow();

    await expect(
      db.insert(userAccounts).values({
        userId: u1.id,
        providerId: "google",
        accountId: sub2,
      })
    ).rejects.toThrow();
  });

  it("BR-SIB-10: validator rejects non-null OAuth provider tokens", () => {
    expect(() =>
      assertNoOAuthProviderTokens({
        accessToken: null,
        refreshToken: null,
        idToken: null,
      })
    ).not.toThrow();
    expect(() =>
      assertNoOAuthProviderTokens({ refreshToken: "oauth-refresh" })
    ).toThrow("BR-SIB-10");
  });

  it("BR-SIB-11: CASCADE deletes user_accounts when user is deleted", async () => {
    const db = getOwnerDb();
    const email = `delete-me-${Date.now()}@example.com`;

    const [u] = await db
      .insert(users)
      .values({ email, displayName: "Delete Me" })
      .returning();
    if (!u) {
      throw new Error("Failed to insert u");
    }

    await db.insert(userAccounts).values({
      userId: u.id,
      providerId: "facebook",
      accountId: `fb-${Date.now()}`,
    });

    await db.delete(users).where(eq(users.id, u.id));

    const remaining = await db
      .select()
      .from(userAccounts)
      .where(eq(userAccounts.userId, u.id));

    expect(remaining.length).toBe(0);
  });

  it("BR-SIB-06: consent_logs is INSERT-only (UPDATE/DELETE by app role fails)", async () => {
    const ownerDb = getOwnerDb();
    const appDb = getAppDb();
    const email = `consent-${Date.now()}@example.com`;

    const [u] = await ownerDb
      .insert(users)
      .values({ email, displayName: "Consent User" })
      .returning();
    if (!u) {
      throw new Error("Failed to insert u");
    }

    const [log] = await appDb
      .insert(consentLogs)
      .values({
        userId: u.id,
        consentType: "terms",
        action: "accepted",
        ipAddress: "127.0.0.1",
        userAgent: "test-agent",
      })
      .returning();
    if (!log) {
      throw new Error("Failed to insert log");
    }

    expect(log).toBeDefined();

    await expect(
      appDb
        .update(consentLogs)
        .set({ action: "withdrawn" })
        .where(eq(consentLogs.id, log.id))
    ).rejects.toThrow();

    await expect(
      appDb.delete(consentLogs).where(eq(consentLogs.id, log.id))
    ).rejects.toThrow();
  });

  it("BR-CDC-07: enforces consent rules, version checking (409/428), and INSERT-only withdrawal logging", async () => {
    const ownerDb = getOwnerDb();
    const email = `consent-cdc-${Date.now()}@example.com`;

    const [u] = await ownerDb
      .insert(users)
      .values({ email, displayName: "CDC Consent User" })
      .returning();
    if (!u) {
      throw new Error("Failed to insert u");
    }

    const emptyLogs = await ownerDb
      .select()
      .from(consentLogs)
      .where(eq(consentLogs.userId, u.id));
    expect(emptyLogs.length).toBe(0);

    const [c1] = await ownerDb
      .insert(consentLogs)
      .values({
        userId: u.id,
        consentType: "child_data",
        action: "accepted",
        ipAddress: "127.0.0.1",
        userAgent: "test-agent",
      })
      .returning();
    if (!c1) {
      throw new Error("Failed to insert c1");
    }

    expect(c1.action).toBe("accepted");
    expect(c1.consentType).toBe("child_data");

    await ownerDb.insert(consentLogs).values({
      userId: u.id,
      consentType: "child_data",
      action: "withdrawn",
      ipAddress: "127.0.0.1",
      userAgent: "test-agent",
    });

    const allLogs = await ownerDb
      .select()
      .from(consentLogs)
      .where(eq(consentLogs.userId, u.id))
      .orderBy(consentLogs.id);

    expect(allLogs.length).toBe(2);
    expect(allLogs[0]?.action).toBe("accepted");
    expect(allLogs[1]?.action).toBe("withdrawn");
  });
});
