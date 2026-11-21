import {
  generateTotpCode,
  InMemoryRedisClient,
  setAuthRedisClient,
} from "@mindkid/auth";
import { getOwnerDb, managers, managerTwoFactors } from "@mindkid/db";
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

async function createLoggedInManager(tag: string) {
  const db = getOwnerDb();
  const email = `admin_enroll_${tag}_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}@tinimath.test`;
  const password = "AdminSecret123!";
  const ctx = await getManagerAuth().$context;
  const passwordHash = await ctx.password.hash(password);

  const [manager] = await db
    .insert(managers)
    .values({
      email,
      passwordHash,
      displayName: `Enroll Admin ${tag}`,
      role: "super_admin",
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

  const loginRes = await getManagerAuth().handler(
    new Request("http://localhost:3000/api/auth/managers/sign-in/email", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
      },
      body: JSON.stringify({ email, password }),
    })
  );
  return {
    manager,
    password,
    cookie: collectCookie(loginRes),
  };
}

describe("Manager MFA Enrollment Flow via Better Auth twoFactor Plugin (BR-MME-01..07)", () => {
  beforeEach(() => {
    setAuthRedisClient(new InMemoryRedisClient());
    resetBetterAuthInstancesForTests();
  });

  it("Scenario 1: enabling 2FA requires valid current password", async () => {
    const { cookie } = await createLoggedInManager("wrong-pwd");

    const res = await getManagerAuth().handler(
      new Request("http://localhost:3000/api/auth/managers/two-factor/enable", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
          cookie,
        },
        body: JSON.stringify({ password: "WrongPassword!" }),
      })
    );
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it("Scenario 2: two-factor/enable keeps mfaEnabled false until verify-totp succeeds", async () => {
    const db = getOwnerDb();
    const { manager, password, cookie } =
      await createLoggedInManager("unconfirmed");

    const enableRes = await getManagerAuth().handler(
      new Request("http://localhost:3000/api/auth/managers/two-factor/enable", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
          cookie,
        },
        body: JSON.stringify({ password }),
      })
    );
    expect(enableRes.status).toBe(200);
    const enablePayload = (await enableRes.json()) as {
      totpURI: string;
      backupCodes: string[];
    };
    expect(enablePayload.totpURI).toContain("otpauth://");
    expect(enablePayload.backupCodes).toHaveLength(10);

    const [beforeVerify] = await db
      .select()
      .from(managers)
      .where(eq(managers.id, manager.id));
    expect(beforeVerify?.mfaEnabled).toBe(false);

    // Wrong code fails and keeps mfaEnabled false
    const wrongVerify = await getManagerAuth().handler(
      new Request(
        "http://localhost:3000/api/auth/managers/two-factor/verify-totp",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: "http://localhost:3000",
            cookie,
          },
          body: JSON.stringify({ code: "000000" }),
        }
      )
    );
    expect(wrongVerify.status).toBeGreaterThanOrEqual(400);

    const [afterWrong] = await db
      .select()
      .from(managers)
      .where(eq(managers.id, manager.id));
    expect(afterWrong?.mfaEnabled).toBe(false);

    // Valid TOTP code flips mfaEnabled = true and persists encrypted secret in manager_two_factors
    const secret =
      new URL(enablePayload.totpURI).searchParams.get("secret") ?? "";
    const okVerify = await getManagerAuth().handler(
      new Request(
        "http://localhost:3000/api/auth/managers/two-factor/verify-totp",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: "http://localhost:3000",
            cookie,
          },
          body: JSON.stringify({ code: generateTotpCode(secret) }),
        }
      )
    );
    expect(okVerify.status).toBe(200);

    const [afterOk] = await db
      .select()
      .from(managers)
      .where(eq(managers.id, manager.id));
    expect(afterOk?.mfaEnabled).toBe(true);

    const [tfRow] = await db
      .select()
      .from(managerTwoFactors)
      .where(eq(managerTwoFactors.userId, manager.id));
    expect(tfRow).toBeDefined();
    expect(tfRow?.secret).not.toBe(secret);
  });
});
