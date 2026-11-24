import {
  generateTotpCode,
  InMemoryRedisClient,
  setAuthRedisClient,
} from "@mindkid/auth";
import {
  auditLogs,
  getOwnerDb,
  MANAGER_ROLE,
  managerSessions,
  managers,
} from "@mindkid/db";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import {
  getManagerAuth,
  resetBetterAuthInstancesForTests,
} from "#server/utils/better-auth";

function collectCookie(res: Response): string {
  return res.headers
    .getSetCookie()
    .map((raw) => raw.split(";")[0]?.trim() ?? "")
    .filter((pair) => pair.length > 0 && !pair.endsWith("="))
    .join("; ");
}

async function seedManagerWithPassword(
  tag: string,
  password = "AdminSecret123!"
) {
  const db = getOwnerDb();
  const email = `admin_${tag}_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}@tinimath.test`;
  const ctx = await getManagerAuth().$context;
  const passwordHash = await ctx.password.hash(password);

  const [manager] = await db
    .insert(managers)
    .values({
      email,
      passwordHash,
      displayName: `Admin ${tag}`,
      role: MANAGER_ROLE.SUPER_ADMIN,
      isActive: true,
      mfaEnabled: false,
    })
    .returning();
  if (!manager) {
    throw new Error("Expected manager");
  }

  await ctx.internalAdapter.linkAccount({
    userId: String(manager.id),
    providerId: "credential",
    accountId: String(manager.id),
    password: passwordHash,
  });

  return { manager, email, password };
}

describe("Manager Better Auth Login & 2FA Handler (BR-ADA-01..08)", () => {
  beforeEach(() => {
    setAuthRedisClient(new InMemoryRedisClient());
    resetBetterAuthInstancesForTests();
  });

  it("BR-ADA-03: blocks public sign-up on manager Better Auth instance with 403", async () => {
    const res = await getManagerAuth().handler(
      new Request("http://localhost:3000/api/auth/managers/sign-up/email", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({
          name: "Rogue Admin",
          email: "rogue@tinimath.test",
          password: "AdminSecret123!",
        }),
      })
    );
    expect(res.status).toBe(403);
  });

  it("BR-ADA-01: manager without MFA logs in directly, creates manager_sessions row, and audits manager_login", async () => {
    const db = getOwnerDb();
    const { manager, email, password } =
      await seedManagerWithPassword("direct");

    const res = await getManagerAuth().handler(
      new Request("http://localhost:3000/api/auth/managers/sign-in/email", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({ email, password, rememberMe: true }),
      })
    );
    expect(res.status).toBe(200);

    const sessions = await db
      .select()
      .from(managerSessions)
      .where(eq(managerSessions.userId, manager.id));
    expect(sessions.length).toBeGreaterThan(0);

    const logs = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.action, "manager_login"));
    expect(logs.some((l) => l.entityId === manager.id.toString())).toBe(true);
  });

  it("wrong password returns 401 and audits manager_login_failed for unknown email", async () => {
    const db = getOwnerDb();
    const missingEmail = `missing_admin_${Date.now()}@tinimath.test`;

    const res = await getManagerAuth().handler(
      new Request("http://localhost:3000/api/auth/managers/sign-in/email", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({
          email: missingEmail,
          password: "WrongPassword!",
        }),
      })
    );
    expect(res.status).toBe(401);

    const logs = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.action, "manager_login_failed"));
    expect(logs.length).toBeGreaterThan(0);
  });

  it("enables TOTP + backup codes, requires 2FA on next login, and verifies both TOTP and single-use backup code", async () => {
    const db = getOwnerDb();
    const { manager, email, password } = await seedManagerWithPassword("mfa");

    // 1. Initial login to enable 2FA
    const initLogin = await getManagerAuth().handler(
      new Request("http://localhost:3000/api/auth/managers/sign-in/email", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({ email, password }),
      })
    );
    const sessionCookie = collectCookie(initLogin);

    const enableRes = await getManagerAuth().handler(
      new Request("http://localhost:3000/api/auth/managers/two-factor/enable", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
          cookie: sessionCookie,
        },
        body: JSON.stringify({ password }),
      })
    );
    expect(enableRes.status).toBe(200);
    const enableData = (await enableRes.json()) as {
      totpURI: string;
      backupCodes: string[];
    };
    const secret = new URL(enableData.totpURI).searchParams.get("secret") ?? "";
    expect(secret.length).toBeGreaterThan(10);
    expect(enableData.backupCodes).toHaveLength(10);

    const confirmRes = await getManagerAuth().handler(
      new Request(
        "http://localhost:3000/api/auth/managers/two-factor/verify-totp",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: "http://localhost:3000",
            cookie: sessionCookie,
          },
          body: JSON.stringify({ code: generateTotpCode(secret) }),
        }
      )
    );
    expect(confirmRes.status).toBe(200);
    const rotatedSessionCookie = collectCookie(confirmRes) || sessionCookie;

    // Sign out initial session
    await getManagerAuth().handler(
      new Request("http://localhost:3000/api/auth/managers/sign-out", {
        method: "POST",
        headers: {
          origin: "http://localhost:3000",
          cookie: rotatedSessionCookie,
        },
      })
    );

    // 2. Password sign-in now returns twoFactorRedirect without creating an active session yet
    const step1 = await getManagerAuth().handler(
      new Request("http://localhost:3000/api/auth/managers/sign-in/email", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({ email, password }),
      })
    );
    expect(step1.status).toBe(200);
    const step1Body = (await step1.json()) as { twoFactorRedirect?: boolean };
    expect(step1Body.twoFactorRedirect).toBe(true);
    const twoFactorCookie = collectCookie(step1);

    const pendingSessions = await db
      .select()
      .from(managerSessions)
      .where(eq(managerSessions.userId, manager.id));
    expect(pendingSessions).toHaveLength(0);

    // 3. Complete login using single-use backup code
    const firstBackup = enableData.backupCodes[0] ?? "";
    const backupVerify = await getManagerAuth().handler(
      new Request(
        "http://localhost:3000/api/auth/managers/two-factor/verify-backup-code",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: "http://localhost:3000",
            cookie: twoFactorCookie,
          },
          body: JSON.stringify({ code: firstBackup }),
        }
      )
    );
    expect(backupVerify.status).toBe(200);

    const afterSessions = await db
      .select()
      .from(managerSessions)
      .where(eq(managerSessions.userId, manager.id));
    expect(afterSessions.length).toBeGreaterThan(0);
  });
});
