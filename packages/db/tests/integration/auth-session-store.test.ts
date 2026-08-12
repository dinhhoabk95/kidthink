import {
  createRefreshToken,
  hashRefreshToken,
  RefreshService,
} from "@kidthink/auth";
import { and, eq } from "drizzle-orm";
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

const USER_SECRET = "postgres-refresh-test-secret-at-least-32-bytes";

async function createUserSession(label: string) {
  const db = getOwnerDb();
  const [user] = await db
    .insert(users)
    .values({
      email: `refresh-${label}-${Date.now()}@example.com`,
      displayName: `User ${label}`,
      status: "active",
    })
    .returning();
  const [session] = await db
    .insert(activeSessions)
    .values({
      accountType: "user",
      accountId: user.id,
      refreshTokenHash: `placeholder-${label}-${Date.now()}`,
      authMethod: "password",
      expiresAt: new Date(Date.now() + 86_400_000),
    })
    .returning();
  const refreshToken = createRefreshToken({
    namespace: "user",
    sessionId: String(session.id),
    refreshTokenVersion: user.refreshTokenVersion,
    secret: USER_SECRET,
  });
  await db
    .update(activeSessions)
    .set({ refreshTokenHash: hashRefreshToken(refreshToken) })
    .where(eq(activeSessions.id, session.id));

  return { user, session, refreshToken };
}

describe("PostgresSessionStore", () => {
  beforeEach(async () => {
    await truncateAllTestTables();
  });

  it("BR-AUT-04: serializes concurrent rotation so one succeeds and reuse revokes the account", async () => {
    const fixture = await createUserSession("concurrent");
    const service = new RefreshService(new PostgresSessionStore(getAppSql()), {
      namespace: "user",
      jwtSecret: USER_SECRET,
    });

    const attempts = await Promise.allSettled([
      service.rotateRefreshToken({ refreshToken: fixture.refreshToken }),
      service.rotateRefreshToken({ refreshToken: fixture.refreshToken }),
    ]);

    expect(
      attempts.filter((result) => result.status === "fulfilled")
    ).toHaveLength(1);
    expect(
      attempts.filter((result) => result.status === "rejected")
    ).toHaveLength(1);

    const db = getOwnerDb();
    const remaining = await db
      .select()
      .from(activeSessions)
      .where(
        and(
          eq(activeSessions.accountType, "user"),
          eq(activeSessions.accountId, fixture.user.id)
        )
      );
    const [reloadedUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, fixture.user.id));
    expect(remaining).toHaveLength(0);
    expect(reloadedUser.refreshTokenVersion).toBe(1);
  });

  it("BR-AUT-05: logout-all increments version and never deletes another account's session", async () => {
    const target = await createUserSession("logout-all-target");
    const other = await createUserSession("logout-all-other");
    const store = new PostgresSessionStore(getAppSql());

    await store.revokeAll({ account_type: "user", account_id: target.user.id });

    const db = getOwnerDb();
    const [targetUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, target.user.id));
    const remainingTarget = await db
      .select()
      .from(activeSessions)
      .where(eq(activeSessions.accountId, target.user.id));
    const remainingOther = await db
      .select()
      .from(activeSessions)
      .where(eq(activeSessions.accountId, other.user.id));
    expect(targetUser.refreshTokenVersion).toBe(1);
    expect(remainingTarget).toHaveLength(0);
    expect(remainingOther).toHaveLength(1);
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
