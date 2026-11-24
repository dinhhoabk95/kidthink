import { hashPassword } from "@mindkid/auth";
import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { AUTH_METHOD, getOwnerDb, MANAGER_ROLE, USER_STATUS } from "#src/index";
import {
  managerAccounts,
  managerSessions,
  managers,
  managerTwoFactors,
  userAccounts,
  userSessions,
  users,
  userTwoFactors,
} from "#src/schema/identity";

describe("Better Auth Session & Account Tables Integration (Task #319)", () => {
  it("stores multi-device user_sessions and tracks reauthAt timestamp", async () => {
    const db = getOwnerDb();
    const suffix = `${Date.now()}-${Math.floor(100_000 + Math.random() * 899_999)}`;
    const [user] = await db
      .insert(users)
      .values({
        email: `ba-sess-${suffix}@example.com`,
        displayName: "Session User",
        emailVerified: true,
        status: USER_STATUS.ACTIVE,
      })
      .returning();
    if (!user) {
      throw new Error("Failed to insert user");
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 3_600_000);
    const [sess] = await db
      .insert(userSessions)
      .values({
        userId: user.id,
        token: `tok-${suffix}`,
        ipAddress: "127.0.0.1",
        userAgent: "Chrome / macOS",
        authMethod: AUTH_METHOD.PASSWORD,
        reauthAt: now,
        expiresAt,
      })
      .returning();

    expect(sess?.userId).toBe(user.id);
    expect(sess?.authMethod).toBe(AUTH_METHOD.PASSWORD);
    expect(sess?.reauthAt).not.toBeNull();
  });

  it("supports revoking all sessions for a user and incrementing session_version", async () => {
    const db = getOwnerDb();
    const suffix = `${Date.now()}-${Math.floor(100_000 + Math.random() * 899_999)}`;
    const [user] = await db
      .insert(users)
      .values({
        email: `ba-revoke-${suffix}@example.com`,
        displayName: "Revoke User",
        emailVerified: true,
        status: USER_STATUS.ACTIVE,
      })
      .returning();
    if (!user) {
      throw new Error("Failed to insert user");
    }

    await db.insert(userSessions).values([
      {
        userId: user.id,
        token: `tok-1-${suffix}`,
        expiresAt: new Date(Date.now() + 3_600_000),
      },
      {
        userId: user.id,
        token: `tok-2-${suffix}`,
        expiresAt: new Date(Date.now() + 3_600_000),
      },
    ]);

    await db.delete(userSessions).where(eq(userSessions.userId, user.id));
    await db
      .update(users)
      .set({ sessionVersion: user.sessionVersion + 1 })
      .where(eq(users.id, user.id));

    const remaining = await db
      .select()
      .from(userSessions)
      .where(eq(userSessions.userId, user.id));
    const [reloaded] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id));

    expect(remaining.length).toBe(0);
    expect(reloaded?.sessionVersion).toBe(1);
  });

  it("BR-AUT-14: persists user credential/social accounts and TOTP state cleanly", async () => {
    const db = getOwnerDb();
    const suffix = `${Date.now()}-${Math.floor(100_000 + Math.random() * 899_999)}`;
    const [user] = await db
      .insert(users)
      .values({
        email: `ba-methods-${suffix}@example.com`,
        displayName: "SNS & TOTP User",
        passwordHash: null,
        twoFactorEnabled: true,
        status: USER_STATUS.ACTIVE,
      })
      .returning();
    if (!user) {
      throw new Error("Failed to insert user");
    }

    await db.insert(userAccounts).values({
      userId: user.id,
      providerId: "google",
      accountId: `google-${suffix}`,
    });
    await db.insert(userTwoFactors).values({
      userId: user.id,
      secret: "encrypted-totp-secret",
      backupCodes: "[]",
    });

    const accounts = await db
      .select()
      .from(userAccounts)
      .where(eq(userAccounts.userId, user.id));
    const [tf] = await db
      .select()
      .from(userTwoFactors)
      .where(eq(userTwoFactors.userId, user.id));

    expect(accounts.map((a) => a.providerId)).toEqual(["google"]);
    expect(tf?.secret).toBe("encrypted-totp-secret");
  });

  it("BR-AUT-15: Manager stores credential account and TOTP in isolated manager_* tables", async () => {
    const db = getOwnerDb();
    const suffix = `${Date.now()}-${Math.floor(100_000 + Math.random() * 899_999)}`;
    const hash = await hashPassword("xK9#mQ2$vL8!wP5@");
    const [manager] = await db
      .insert(managers)
      .values({
        email: `ba-mgr-${suffix}@example.com`,
        displayName: "Manager MFA",
        passwordHash: hash,
        role: MANAGER_ROLE.SUPER_ADMIN,
        mfaEnabled: true,
      })
      .returning();
    if (!manager) {
      throw new Error("Failed to insert manager");
    }

    await db.insert(managerAccounts).values({
      userId: manager.id,
      providerId: "credential",
      accountId: String(manager.id),
      password: hash,
    });
    await db.insert(managerTwoFactors).values({
      userId: manager.id,
      secret: "encrypted-mgr-totp",
      backupCodes: "[]",
    });
    await db.insert(managerSessions).values({
      userId: manager.id,
      token: `mgr-tok-${suffix}`,
      expiresAt: new Date(Date.now() + 3_600_000),
    });

    const [cred] = await db
      .select()
      .from(managerAccounts)
      .where(
        and(
          eq(managerAccounts.userId, manager.id),
          eq(managerAccounts.providerId, "credential")
        )
      );
    expect(cred?.password?.startsWith("pbkdf2$")).toBe(true);
  });
});
