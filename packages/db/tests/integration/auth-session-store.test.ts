import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import {
  getAppSql,
  getOwnerDb,
  PostgresReauthMethodAvailability,
  PostgresSessionStore,
} from "../../src/index.ts";
import {
  activeSessions,
  managers,
  mfaSettings,
  socialIdentities,
  users,
} from "../../src/schema/identity.ts";
import { truncateAllTestTables } from "../global-setup.ts";

async function createUserFixture(label: string) {
  const db = getOwnerDb();
  const [user] = await db
    .insert(users)
    .values({
      email: `device-sess-${label}-${Date.now()}@example.com`,
      displayName: `User ${label}`,
      status: "active",
    })
    .returning();
  return user;
}

describe("PostgresSessionStore (Metadata Only under Task #85)", () => {
  beforeEach(async () => {
    await truncateAllTestTables();
  });

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

    expect(row.deviceId).toBe("dev_phone_101");
    expect(row.remembered).toBe(true);
    expect(row.revokedAt).toBeNull();
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

    expect(reloadedUser.sessionVersion).toBe(1);
    expect(row.revokedAt).not.toBeNull();
  });

  it("BR-AUT-14: resolves User reauth methods from password, linked SNS and confirmed TOTP state", async () => {
    const db = getOwnerDb();
    const [user] = await db
      .insert(users)
      .values({
        email: `reauth-user-${Date.now()}@example.com`,
        displayName: "SNS và TOTP User",
        passwordHash: null,
        status: "active",
      })
      .returning();
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
    const [manager] = await db
      .insert(managers)
      .values({
        email: `reauth-manager-${Date.now()}@example.com`,
        displayName: "Manager MFA",
        passwordHash: "local-test-argon-placeholder",
        role: "content_reviewer",
        mfaEnabled: true,
      })
      .returning();
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
