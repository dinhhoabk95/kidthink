import { IncomingMessage, ServerResponse } from "node:http";
import { Socket } from "node:net";
import {
  hashPassword,
  InMemoryRedisClient,
  MfaAttemptGuard,
  setAuthRedisClient,
} from "@mindkid/auth";
import { hashRateLimitIdentifier } from "@mindkid/cache";
import { getOwnerDb, USER_STATUS, userAccounts, users } from "@mindkid/db";
import { resolveRateLimitRouteClass } from "@mindkid/shared";
import { createEvent, type H3Event } from "h3";
import { beforeEach, describe, expect, it } from "vitest";
import userReauthHandler from "#server/api/users/auth/reauth.post";
import {
  getUserAuth,
  resetBetterAuthInstancesForTests,
} from "#server/utils/better-auth";

function collectCookie(res: Response): string {
  return res.headers
    .getSetCookie()
    .map((raw) => raw.split(";")[0]?.trim() ?? "")
    .filter((pair) => pair.length > 0 && !pair.endsWith("="))
    .join("; ");
}

describe("Security Remediation Slice S3 — Better Auth Architecture", () => {
  let redis: InMemoryRedisClient;

  beforeEach(() => {
    redis = new InMemoryRedisClient();
    setAuthRedisClient(redis);
    resetBetterAuthInstancesForTests();
  });

  it("[H-01] resolveRateLimitRouteClass classifies sensitive /api/users/* and /api/auth/* routes", () => {
    expect(resolveRateLimitRouteClass("/api/users/password", "POST")).toEqual({
      mode: "middleware",
      className: "auth:login",
    });
    expect(resolveRateLimitRouteClass("/api/users/email", "POST")).toEqual({
      mode: "middleware",
      className: "auth:login",
    });
    expect(
      resolveRateLimitRouteClass("/api/auth/users/two-factor/disable", "POST")
    ).toEqual({
      mode: "middleware",
      className: "auth:mfa",
    });
    expect(
      resolveRateLimitRouteClass(
        "/api/auth/users/two-factor/verify-totp",
        "POST"
      )
    ).toEqual({
      mode: "middleware",
      className: "auth:mfa",
    });
    expect(
      resolveRateLimitRouteClass("/api/users/account/delete", "POST")
    ).toEqual({
      mode: "middleware",
      className: "auth:login",
    });
    expect(
      resolveRateLimitRouteClass("/api/users/parent-gate/verify", "POST")
    ).toEqual({
      mode: "middleware",
      className: "auth:mfa",
    });
  });

  it("[M-06] hashRateLimitIdentifier uses env secret when no explicit secret is passed", () => {
    const prevSecret = process.env.RATE_LIMIT_HMAC_SECRET;
    process.env.RATE_LIMIT_HMAC_SECRET = "custom-env-rate-limit-secret-1";
    const hashA = hashRateLimitIdentifier("parent@example.com");
    process.env.RATE_LIMIT_HMAC_SECRET = "custom-env-rate-limit-secret-2";
    const hashB = hashRateLimitIdentifier("parent@example.com");
    if (prevSecret === undefined) {
      delete process.env.RATE_LIMIT_HMAC_SECRET;
    } else {
      process.env.RATE_LIMIT_HMAC_SECRET = prevSecret;
    }
    expect(hashA).not.toBe(hashB);
  });

  it("[H-02] MfaAttemptGuard allows retries up to 4 failures and locks on 5th failure", async () => {
    const guard = new MfaAttemptGuard(redis);
    await guard.assertNotLocked("manager", 77);
    expect(await guard.recordFailure("manager", 77)).toEqual({ locked: false });
    expect(await guard.recordFailure("manager", 77)).toEqual({ locked: false });
    expect(await guard.recordFailure("manager", 77)).toEqual({ locked: false });
    expect(await guard.recordFailure("manager", 77)).toEqual({ locked: false });
    await guard.assertNotLocked("manager", 77);

    expect(await guard.recordFailure("manager", 77)).toEqual({ locked: true });
    await expect(guard.assertNotLocked("manager", 77)).rejects.toMatchObject({
      code: "MFA_LOCKED",
      status: 429,
    });
  });

  it("[H-04] User reauth rejects social method and requires TOTP when 2FA is enabled", async () => {
    const db = getOwnerDb();
    const buildReauthEvent = (
      userId: number,
      displayName: string,
      body: Record<string, string>
    ): H3Event => {
      const socket = new Socket();
      Object.defineProperty(socket, "remoteAddress", { value: "127.0.0.1" });
      const req = new IncomingMessage(socket);
      req.method = "POST";
      req.url = "/api/users/auth/reauth";
      req.headers = {
        host: "localhost:3000",
        origin: "http://localhost:3000",
        "sec-fetch-site": "same-origin",
      };
      const res = new ServerResponse(req);
      const event = createEvent(req, res);
      event.context.user = {
        user_id: userId,
        display_name: displayName,
        session_id: "999",
      };
      event.context.body = body;
      return event;
    };

    const email = `oauth-reauth-${Date.now()}-${Math.floor(Math.random() * 100_000)}@mindkid.test`;
    const [oauthUser] = await db
      .insert(users)
      .values({
        email,
        passwordHash: null,
        displayName: "OAuth Only Parent",
        status: USER_STATUS.ACTIVE,
      })
      .returning({ id: users.id });
    if (!oauthUser) {
      throw new Error("Expected oauth user");
    }

    await db.insert(userAccounts).values({
      userId: oauthUser.id,
      providerId: "google",
      accountId: `google-sub-${oauthUser.id}`,
    });

    await expect(
      userReauthHandler(
        buildReauthEvent(oauthUser.id, "OAuth Only Parent", {
          method: "social",
          provider: "google",
        })
      )
    ).rejects.toMatchObject({
      statusCode: 401,
      code: "INVALID_CREDENTIALS",
    });

    const mfaPassword = "StrongPassword123!";
    const mfaEmail = `mfa-reauth-${Date.now()}-${Math.floor(Math.random() * 100_000)}@mindkid.test`;
    const mfaPasswordHash = await hashPassword(mfaPassword);
    const [mfaUser] = await db
      .insert(users)
      .values({
        email: mfaEmail,
        passwordHash: mfaPasswordHash,
        displayName: "2FA Enabled Parent",
        status: USER_STATUS.ACTIVE,
        twoFactorEnabled: true,
      })
      .returning({ id: users.id });
    if (!mfaUser) {
      throw new Error("Expected 2FA user");
    }

    await expect(
      userReauthHandler(
        buildReauthEvent(mfaUser.id, "2FA Enabled Parent", {
          password: mfaPassword,
        })
      )
    ).rejects.toMatchObject({
      statusCode: 401,
      code: "INVALID_CREDENTIALS",
    });

    await expect(
      userReauthHandler(
        buildReauthEvent(mfaUser.id, "2FA Enabled Parent", {
          method: "password",
          password: mfaPassword,
        })
      )
    ).rejects.toMatchObject({
      statusCode: 401,
      code: "INVALID_CREDENTIALS",
    });
  });

  it("[M-03] Single-device sign-out revokes only the current device, keeping other devices active", async () => {
    const email = `multi-dev-${Date.now()}-${Math.floor(Math.random() * 100_000)}@mindkid.test`;
    const password = "StrongPassword123!";

    await getUserAuth().handler(
      new Request("http://localhost:3000/api/auth/users/sign-up/email", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({
          name: "Multi Device Parent",
          email,
          password,
          accept_terms: true,
          accept_privacy: true,
        }),
      })
    );

    const loginA = await getUserAuth().handler(
      new Request("http://localhost:3000/api/auth/users/sign-in/email", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
          "user-agent": "Device-A",
        },
        body: JSON.stringify({ email, password }),
      })
    );
    const loginB = await getUserAuth().handler(
      new Request("http://localhost:3000/api/auth/users/sign-in/email", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
          "user-agent": "Device-B",
        },
        body: JSON.stringify({ email, password }),
      })
    );

    const cookieA = collectCookie(loginA);
    const cookieB = collectCookie(loginB);

    const signOutA = await getUserAuth().handler(
      new Request("http://localhost:3000/api/auth/users/sign-out", {
        method: "POST",
        headers: {
          origin: "http://localhost:3000",
          cookie: cookieA,
        },
      })
    );
    expect(signOutA.status).toBe(200);

    const sessA = await getUserAuth().api.getSession({
      headers: new Headers({ cookie: cookieA }),
    });
    const sessB = await getUserAuth().api.getSession({
      headers: new Headers({ cookie: cookieB }),
    });

    expect(sessA).toBeNull();
    expect(sessB?.user?.email).toBe(email);
  });
});
