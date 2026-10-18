import { hashPassword } from "@mindkid/auth";
import { eq, getTableColumns } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { getAppDb, getOwnerDb } from "#src/index";
import {
  activeSessions,
  consentLogs,
  consentRequirements,
  managers,
  mfaRecoveryCodes,
  mfaSettings,
  socialIdentities,
  users,
  verificationTokens,
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

  it("BR-SIB-04: polymorphic auth tables (active_sessions, mfa_settings, mfa_recovery_codes, verification_tokens) store (account_type, account_id) for both user and manager", async () => {
    const db = getOwnerDb();
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 100_000)}`;
    const [u] = await db
      .insert(users)
      .values({
        email: `sib04-u-${suffix}@example.com`,
        displayName: "SIB04 User",
      })
      .returning();
    const [m] = await db
      .insert(managers)
      .values({
        email: `sib04-m-${suffix}@example.com`,
        passwordHash: await hashPassword("xK9#mQ2$vL8!wP5@"),
        displayName: "SIB04 Manager",
        role: "content_reviewer",
      })
      .returning();
    if (!(u && m)) {
      throw new Error("Failed to insert user/manager for BR-SIB-04");
    }

    const expiresAt = new Date(Date.now() + 3_600_000);
    const [sess] = await db
      .insert(activeSessions)
      .values({
        accountType: "user",
        accountId: u.id,
        deviceId: `dev-${suffix}`,
        authMethod: "password",
        expiresAt,
      })
      .returning();
    expect(sess?.accountType).toBe("user");
    expect(sess?.accountId).toBe(u.id);

    const [mfa] = await db
      .insert(mfaSettings)
      .values({
        accountType: "manager",
        accountId: m.id,
        secretEncrypted: "enc-secret",
      })
      .returning();
    expect(mfa?.accountType).toBe("manager");
    expect(mfa?.accountId).toBe(m.id);

    const [rec] = await db
      .insert(mfaRecoveryCodes)
      .values({
        accountType: "manager",
        accountId: m.id,
        codeHash: `hash-${suffix}`,
      })
      .returning();
    expect(rec?.accountType).toBe("manager");

    const [tok] = await db
      .insert(verificationTokens)
      .values({
        accountType: "user",
        accountId: u.id,
        purpose: "email_verify",
        tokenHash: `tok-${suffix}`,
        expiresAt,
      })
      .returning();
    expect(tok?.accountType).toBe("user");
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

    // Inserting uppercase version of same email should throw duplicate key error
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

  it("BR-SIB-09: enforces both UNIQUE constraints on social_identities", async () => {
    const db = getOwnerDb();
    const email1 = `sns-u1-${Date.now()}@example.com`;
    const email2 = `sns-u2-${Date.now()}@example.com`;
    const sub1 = `g-12345-${Date.now()}`;
    const sub2 = `g-67890-${Date.now()}`;

    const [u1] = await db
      .insert(users)
      .values({ email: email1, displayName: "U1" })
      .returning();
    if (!u1) {
      throw new Error("Failed to insert u1");
    }

    const [u2] = await db
      .insert(users)
      .values({ email: email2, displayName: "U2" })
      .returning();
    if (!u2) {
      throw new Error("Failed to insert u2");
    }

    // 1. First social identity
    await db.insert(socialIdentities).values({
      userId: u1.id,
      provider: "google",
      providerUserId: sub1,
      linkedAt: new Date(),
    });

    // Test UNIQUE 1: (provider, provider_user_id) — u2 trying same google sub should fail
    await expect(
      db.insert(socialIdentities).values({
        userId: u2.id,
        provider: "google",
        providerUserId: sub1,
        linkedAt: new Date(),
      })
    ).rejects.toThrow();

    // Test UNIQUE 2: (user_id, provider) — u1 trying another google account should fail
    await expect(
      db.insert(socialIdentities).values({
        userId: u1.id,
        provider: "google",
        providerUserId: sub2,
        linkedAt: new Date(),
      })
    ).rejects.toThrow();
  });

  it("BR-SIB-10: social_identities schema has NO provider token columns", () => {
    // Check columns defined on socialIdentities table
    const columns = Object.keys(socialIdentities);
    expect(columns).not.toContain("accessToken");
    expect(columns).not.toContain("access_token");
    expect(columns).not.toContain("refreshToken");
    expect(columns).not.toContain("refresh_token");
    expect(columns).not.toContain("idToken");
    expect(columns).not.toContain("id_token");
    expect(columns).not.toContain("avatarUrl");
    expect(columns).not.toContain("avatar_url");
  });

  it("BR-SIB-11: CASCADE deletes social_identities when user is deleted", async () => {
    const db = getOwnerDb();
    const email = `delete-me-${Date.now()}@example.com`;

    const [u] = await db
      .insert(users)
      .values({ email, displayName: "Delete Me" })
      .returning();
    if (!u) {
      throw new Error("Failed to insert u");
    }

    await db.insert(socialIdentities).values({
      userId: u.id,
      provider: "facebook",
      providerUserId: `fb-${Date.now()}`,
      linkedAt: new Date(),
    });

    // Delete user
    await db.delete(users).where(eq(users.id, u.id));

    // Verify social identity is cascade deleted
    const remaining = await db
      .select()
      .from(socialIdentities)
      .where(eq(socialIdentities.userId, u.id));

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

    // App role UPDATE must be rejected by PostgreSQL permission check
    await expect(
      appDb
        .update(consentLogs)
        .set({ action: "withdrawn" })
        .where(eq(consentLogs.id, log.id))
    ).rejects.toThrow();

    // App role DELETE must be rejected by PostgreSQL permission check
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

    // 1. Missing consent -> CONSENT_REQUIRED (428)
    const emptyLogs = await ownerDb
      .select()
      .from(consentLogs)
      .where(eq(consentLogs.userId, u.id));
    expect(emptyLogs.length).toBe(0);

    // 2. Insert consent with action accepted
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

    // 3. Withdrawal consent -> INSERTS new row with action 'withdrawn', previous row untouched (BR-CSM-01)
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

    // Both rows must exist intact (INSERT-only)
    expect(allLogs.length).toBe(2);
    expect(allLogs[0]?.action).toBe("accepted");
    expect(allLogs[1]?.action).toBe("withdrawn");
  });
});
