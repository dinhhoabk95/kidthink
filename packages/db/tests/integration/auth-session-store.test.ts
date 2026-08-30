import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
  getAppSql,
  getOwnerDb,
  PostgresReauthMethodAvailability,
  PostgresSessionStore,
} from "#src/index";
import {
  activeSessions,
  managers,
  mfaSettings,
  socialIdentities,
  users,
} from "#src/schema/identity";

async function createUserFixture(label: string) {
  const db = getOwnerDb();
  while (true) {
    const email = `device-sess-${label}-${Math.floor(100_000 + Math.random() * 899_999)}-${Date.now()}@example.com`;
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (!existing) {
      const [user] = await db
        .insert(users)
        .values({
          email,
          displayName: `User ${label}`,
          status: "active",
        })
        .returning();
      if (!user) {
        throw new Error("Failed to insert user");
      }
      return user;
    }
  }
}

describe("PostgresSessionStore (Metadata Only under Task #85)", () => {
  it("records session device metadata without raw tokens or hashes", async () => {
    const user = await createUserFixture("meta");
    const store = new PostgresSessionStore(getAppSql());

    const created = await store.recordSession({
      account_type: "user",
      account_id: user.id,
      device_id: "dev_phone_101",
      remembered: true,
      device_label: "Chrome / macOS",
      ip_address: "127.0.0.1",
      auth_method: "password",
      expires_at: new Date(Date.now() + 3_600_000),
    });

    expect(created.id).toBeGreaterThan(0);

    const db = getOwnerDb();
    const [row] = await db
      .select()
      .from(activeSessions)
      .where(eq(activeSessions.id, created.id));

    expect(row?.deviceId).toBe("dev_phone_101");
    expect(row?.remembered).toBe(true);
    expect(row?.revokedAt).toBeNull();
  });

  it("marks all sessions revoked and increments session_version", async () => {
    const user = await createUserFixture("logout-all");
    const store = new PostgresSessionStore(getAppSql());

    await store.recordSession({
      account_type: "user",
      account_id: user.id,
      device_id: "dev_1",
      remembered: false,
      auth_method: "password",
      expires_at: new Date(Date.now() + 3_600_000),
    });

    await store.markAllRevoked({ account_type: "user", account_id: user.id });

    const db = getOwnerDb();
    const [reloadedUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id));

    const [row] = await db
      .select()
      .from(activeSessions)
      .where(eq(activeSessions.accountId, user.id));

    expect(reloadedUser?.sessionVersion).toBe(1);
    expect(row?.revokedAt).not.toBeNull();
  });

  it("BR-AUT-14: resolves User reauth methods from password, linked SNS and confirmed TOTP state", async () => {
    const db = getOwnerDb();
    let user: typeof users.$inferSelect | undefined;
    while (!user) {
      const email = `reauth-user-${Math.floor(100_000 + Math.random() * 899_999)}-${Date.now()}@example.com`;
      const [existing] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      if (!existing) {
        [user] = await db
          .insert(users)
          .values({
            email,
            displayName: "SNS và TOTP User",
            passwordHash: null,
            status: "active",
          })
          .returning();
      }
    }
    if (!user) {
      throw new Error("Failed to insert user");
    }

    await db.insert(socialIdentities).values({
      userId: user.id,
      provider: "google",
      providerUserId: `reauth-google-${Date.now()}`,
    });
    await db.insert(mfaSettings).values({
      accountType: "user",
      accountId: user.id,
      secretEncrypted: "local-test-ciphertext",
      confirmedAt: new Date(),
    });

    const availability = new PostgresReauthMethodAvailability(getAppSql());
    await expect(
      availability.getAvailableMethods({
        account_type: "user",
        account_id: user.id,
      })
    ).resolves.toEqual(["social", "totp"]);
  });

  it("BR-AUT-15: Manager reauth exposes password/TOTP and never social", async () => {
    const db = getOwnerDb();
    let manager: typeof managers.$inferSelect | undefined;
    while (!manager) {
      const email = `reauth-manager-${Math.floor(100_000 + Math.random() * 899_999)}-${Date.now()}@example.com`;
      const [existing] = await db
        .select({ id: managers.id })
        .from(managers)
        .where(eq(managers.email, email))
        .limit(1);
      if (!existing) {
        [manager] = await db
          .insert(managers)
          .values({
            email,
            displayName: "Manager MFA",
            passwordHash: "local-test-argon-placeholder",
            role: "content_reviewer",
            mfaEnabled: true,
          })
          .returning();
      }
    }
    if (!manager) {
      throw new Error("Failed to insert manager");
    }

    await db.insert(mfaSettings).values({
      accountType: "manager",
      accountId: manager.id,
      secretEncrypted: "local-test-ciphertext",
      confirmedAt: new Date(),
    });

    const availability = new PostgresReauthMethodAvailability(getAppSql());
    await expect(
      availability.getAvailableMethods({
        account_type: "manager",
        account_id: manager.id,
      })
    ).resolves.toEqual(["password", "totp"]);
  });
});
