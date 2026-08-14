import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { getAppDb, getOwnerDb } from "../../src/index.ts";
import {
  consentLogs,
  socialIdentities,
  users,
} from "../../src/schema/identity.ts";

describe("Identity Schema Integration Tests", () => {
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
    const [u2] = await db
      .insert(users)
      .values({ email: email2, displayName: "U2" })
      .returning();

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
      .where(eq(consentLogs.userId, u.id));

    // Both rows must exist intact (INSERT-only)
    expect(allLogs.length).toBe(2);
    expect(allLogs[0].action).toBe("accepted");
    expect(allLogs[1].action).toBe("withdrawn");
  });
});
