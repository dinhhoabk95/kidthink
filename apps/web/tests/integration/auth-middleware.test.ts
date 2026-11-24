import {
  InMemoryRedisClient,
  REMEMBER_MAX_TTL_SECONDS,
  SESSION_DEFAULT_TTL_SECONDS,
  setAuthRedisClient,
} from "@mindkid/auth";
import { getOwnerDb, managers, users } from "@mindkid/db";
import { MfaEnrollmentRequiredError } from "@mindkid/errors/auth";
import { AppError } from "@mindkid/errors/base";
import { eq } from "drizzle-orm";
import { createEvent, type H3Event } from "h3";
import { beforeEach, describe, expect, it } from "vitest";
import authMiddleware from "#server/middleware/auth";
import { assertSameOriginRequest } from "#server/utils/auth-runtime";
import {
  getManagerAuth,
  getUserAuth,
  resetBetterAuthInstancesForTests,
} from "#server/utils/better-auth";

function createResponse() {
  const headers = new Map<string, string | string[]>();
  return {
    headersSent: false,
    writableEnded: false,
    getHeader(name: string) {
      return headers.get(name.toLowerCase());
    },
    setHeader(name: string, value: string | string[]) {
      headers.set(name.toLowerCase(), value);
    },
    removeHeader(name: string) {
      headers.delete(name.toLowerCase());
    },
    appendHeader(name: string, value: string) {
      const current = headers.get(name.toLowerCase());
      headers.set(
        name.toLowerCase(),
        current
          ? [...(Array.isArray(current) ? current : [current]), value]
          : value
      );
    },
  };
}

function createRequest(
  path: string,
  headers: Record<string, string> = {}
): H3Event {
  return createEvent(
    { method: "GET", url: path, headers } as never,
    createResponse() as never
  );
}

function collectCookieHeader(res: Response): string {
  return res.headers
    .getSetCookie()
    .map((raw) => raw.split(";")[0]?.trim() ?? "")
    .filter((pair) => pair.length > 0 && !pair.endsWith("="))
    .join("; ");
}

async function signUpTestUser(
  tag: string,
  rememberMe = false
): Promise<{ userId: number; cookie: string; rawSetCookies: string[] }> {
  const email = `mw-user-${tag}-${Date.now()}-${Math.floor(Math.random() * 100_000)}@mindkid.test`;
  const password = "StrongUserPass123!";
  const signUpRes = await getUserAuth().handler(
    new Request("http://localhost:3000/api/auth/users/sign-up/email", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
      },
      body: JSON.stringify({
        name: `User ${tag}`,
        email,
        password,
        accept_terms: true,
        accept_privacy: true,
      }),
    })
  );
  expect(signUpRes.status).toBe(200);

  const [userRow] = await getOwnerDb()
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email));
  if (!userRow) {
    throw new Error("Expected created user");
  }

  const signInRes = await getUserAuth().handler(
    new Request("http://localhost:3000/api/auth/users/sign-in/email", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
      },
      body: JSON.stringify({ email, password, rememberMe }),
    })
  );
  expect(signInRes.status).toBe(200);

  return {
    userId: userRow.id,
    cookie: collectCookieHeader(signInRes),
    rawSetCookies: signInRes.headers.getSetCookie(),
  };
}

async function signInTestManager(
  tag: string,
  role: "super_admin" = "super_admin",
  rememberMe = false
): Promise<{ managerId: number; cookie: string }> {
  const db = getOwnerDb();
  const email = `mw-mgr-${tag}-${Date.now()}-${Math.floor(Math.random() * 100_000)}@mindkid.test`;
  const password = "StrongAdminPass123!";
  const ctx = await getManagerAuth().$context;
  const passwordHash = await ctx.password.hash(password);

  const [mgr] = await db
    .insert(managers)
    .values({
      email,
      passwordHash,
      displayName: `Manager ${tag}`,
      role,
      isActive: true,
      mfaEnabled: false,
    })
    .returning({ id: managers.id });
  if (!mgr) {
    throw new Error("Expected created manager");
  }

  await ctx.internalAdapter.linkAccount({
    userId: String(mgr.id),
    providerId: "credential",
    accountId: String(mgr.id),
    password: passwordHash,
  });

  const signInRes = await getManagerAuth().handler(
    new Request("http://localhost:3000/api/auth/managers/sign-in/email", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
      },
      body: JSON.stringify({ email, password, rememberMe }),
    })
  );
  expect(signInRes.status).toBe(200);

  return {
    managerId: mgr.id,
    cookie: collectCookieHeader(signInRes),
  };
}

describe("web auth middleware — Dual Better Auth Instances", () => {
  beforeEach(() => {
    setAuthRedisClient(new InMemoryRedisClient());
    resetBetterAuthInstancesForTests();
  });

  it("resolves a manager session from mindkid-manager cookie on /api/managers/** routes", async () => {
    const { managerId, cookie } = await signInTestManager("m1");
    const event = createRequest("/api/managers/dashboard", { cookie });

    // BR-ADA-01: manager chưa bật MFA có phiên nhưng bị chặn ở `/api/managers/**`.
    await expect(authMiddleware(event)).rejects.toBeInstanceOf(
      MfaEnrollmentRequiredError
    );

    expect(event.context.manager).toMatchObject({
      manager_id: managerId,
      role: "super_admin",
    });
    expect(event.context.user).toBeUndefined();
  });

  it("BR-ADA-01: manager chưa bật MFA vẫn qua allowlist reauth", async () => {
    const { managerId, cookie } = await signInTestManager("m-reauth");
    const event = createRequest("/api/managers/auth/reauth", { cookie });

    await authMiddleware(event);

    expect(event.context.manager).toMatchObject({ manager_id: managerId });
  });

  it("ignores a valid user cookie on a manager route", async () => {
    const { cookie } = await signUpTestUser("u-on-mgr");
    const event = createRequest("/api/managers/dashboard", { cookie });

    await authMiddleware(event);

    expect(event.context.manager).toBeUndefined();
    expect(event.context.user).toBeUndefined();
  });

  it("rejects a user token value forged inside mindkid-manager.session_token", async () => {
    const { cookie } = await signUpTestUser("forged-prefix");
    const forgedCookie = cookie.replace(
      "mindkid-user.session_token=",
      "mindkid-manager.session_token="
    );
    const event = createRequest("/api/managers/dashboard", {
      cookie: forgedCookie,
    });

    await authMiddleware(event);

    expect(event.context.manager).toBeUndefined();
    expect(event.context.user).toBeUndefined();
  });

  it("resolves the user session from mindkid-user cookie on /api/users/** and /api/guest/** routes", async () => {
    const { userId, cookie } = await signUpTestUser("u-routes");

    const userEvent = createRequest("/api/users/dashboard", { cookie });
    await authMiddleware(userEvent);
    expect(userEvent.context.user).toMatchObject({ user_id: userId });
    expect(userEvent.context.manager).toBeUndefined();

    const guestEvent = createRequest("/api/guest/levels/GL-C1-CNT-CARD-0001", {
      cookie,
    });
    await authMiddleware(guestEvent);
    expect(guestEvent.context.user).toMatchObject({ user_id: userId });
    expect(guestEvent.context.manager).toBeUndefined();
  });

  it("resolves nothing outside the /api/ surface", async () => {
    const { cookie } = await signUpTestUser("non-api");
    const event = createRequest("/hoc-tap", { cookie });

    await authMiddleware(event);

    expect(event.context.user).toBeUndefined();
    expect(event.context.manager).toBeUndefined();
  });

  it("refuses an Authorization Bearer header on browser endpoints", async () => {
    const { cookie } = await signUpTestUser("bearer");
    const event = createRequest("/api/users/dashboard", {
      authorization: "Bearer some-token",
      cookie,
    });

    await authMiddleware(event);

    expect(event.context.user).toBeUndefined();
    expect(event.context.manager).toBeUndefined();
  });

  it("refuses an Authorization Bearer header on every cookie-session surface (BR-AUT-25)", async () => {
    const { cookie: userCookie } = await signUpTestUser("bearer-all");
    const { cookie: managerCookie } = await signInTestManager("bearer-all");
    const cases: readonly (readonly [string, string])[] = [
      ["/api/guest/levels", userCookie],
      ["/api/managers/dashboard", managerCookie],
      ["/api/auth/users/get-session", userCookie],
      ["/api/auth/managers/get-session", managerCookie],
    ];

    for (const [path, cookie] of cases) {
      const event = createRequest(path, {
        authorization: "Bearer some-token",
        cookie,
      });
      await authMiddleware(event);
      expect(event.context.user, path).toBeUndefined();
      expect(event.context.manager, path).toBeUndefined();
    }
  });

  it("applies 1h session TTL when rememberMe=false and 365d TTL when rememberMe=true", async () => {
    const shortLived = await signUpTestUser("short-ttl", false);
    const longLived = await signUpTestUser("long-ttl", true);

    expect(shortLived.cookie).toContain("mindkid-user.session_token=");
    expect(longLived.cookie).toContain("mindkid-user.session_token=");
    expect(SESSION_DEFAULT_TTL_SECONDS).toBe(3600);
    expect(REMEMBER_MAX_TTL_SECONDS).toBe(365 * 24 * 60 * 60);
  });
});

describe("manager origin policy", () => {
  function originRequest(origin: string): H3Event {
    return createRequest("/api/auth/managers/sign-in/email", {
      host: "localhost:3000",
      origin,
      "sec-fetch-site": "same-site",
    });
  }

  it("accepts an origin from NUXT_ALLOWED_ORIGINS", () => {
    expect(() =>
      assertSameOriginRequest(originRequest("http://localhost:3001"))
    ).not.toThrow();
  });

  it("rejects an origin outside the allowlist with CSRF_INVALID", () => {
    let thrown: Error | null = null;
    try {
      assertSameOriginRequest(originRequest("http://evil.test"));
    } catch (error) {
      thrown = error as Error;
    }

    expect(thrown).toBeInstanceOf(AppError);
    expect((thrown as AppError).code).toBe("CSRF_INVALID");
  });

  it("rejects a cross-site fetch regardless of origin", () => {
    const event = createRequest("/api/auth/managers/sign-in/email", {
      host: "localhost:3000",
      origin: "http://localhost:3001",
      "sec-fetch-site": "cross-site",
    });

    expect(() => assertSameOriginRequest(event)).toThrow();
  });
});
