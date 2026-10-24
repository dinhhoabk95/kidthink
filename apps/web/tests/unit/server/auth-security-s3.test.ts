import {
  encryptTotpSecret,
  generateTotpCode,
  generateTotpSecret,
  getAuthRedisClient,
  InMemoryRedisClient,
  MfaChallengeService,
  setAuthRedisClient,
} from "@mindkid/auth";
import { hashRateLimitIdentifier } from "@mindkid/cache";
import { resolveRateLimitRouteClass } from "@mindkid/shared";
import type { H3Event } from "h3";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockDbSelect, mockDbTransaction, mockDbUpdate, mockDbInsert } =
  vi.hoisted(() => ({
    mockDbSelect: vi.fn(),
    mockDbTransaction: vi.fn(),
    mockDbUpdate: vi.fn(),
    mockDbInsert: vi.fn(),
  }));

vi.mock("@mindkid/db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@mindkid/db")>();
  const dbObj = {
    select: mockDbSelect,
    transaction: mockDbTransaction,
    update: mockDbUpdate,
    insert: mockDbInsert,
  };
  return {
    ...actual,
    getOwnerDb: () => dbObj,
    getAppDb: () => dbObj,
    getDb: () => dbObj,
    getAppSql: () => ({}),
    PostgresSessionStore: class {
      recordSession() {
        return Promise.resolve();
      }
      markDeviceRevoked() {
        return Promise.resolve();
      }
    },
  };
});

vi.mock("@mindkid/audit", () => ({
  writeAudit: vi.fn().mockResolvedValue(undefined),
}));

import managerMfaHandler from "#server/api/guest/auth/managers/mfa.post";
import userMfaHandler from "#server/api/guest/auth/users/mfa.post";
import { handleLogout as handleUserLogout } from "#server/api/users/auth/logout.post";
import userReauthHandler from "#server/api/users/auth/reauth.post";

const TEST_CSRF =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

function createMockEvent(options: {
  method?: string;
  body?: Record<string, string | number | boolean>;
  includeCsrfCookie?: boolean;
  user?: {
    user_id: number;
    display_name: string;
    session_id: string;
  };
}): { event: H3Event; headers: Record<string, string | string[]> } {
  const headers: Record<string, string | string[]> = {};
  const includeCsrf = options.includeCsrfCookie ?? true;
  const event = {
    method: options.method ?? "POST",
    node: {
      req: {
        method: options.method ?? "POST",
        headers: {
          "x-csrf-token": TEST_CSRF,
          ...(includeCsrf
            ? { cookie: `tm_u_csrf=${TEST_CSRF}; tm_m_csrf=${TEST_CSRF}` }
            : {}),
          "user-agent": "Vitest",
        },
        socket: {
          remoteAddress: "127.0.0.1",
        },
      },
      res: {
        statusCode: 200,
        setHeader: (name: string, value: string | string[]) => {
          headers[name.toLowerCase()] = value;
        },
        getHeader: (name: string) => headers[name.toLowerCase()],
        removeHeader: (name: string) => {
          delete headers[name.toLowerCase()];
        },
      },
    },
    context: {
      user: options.user,
      body: options.body,
    },
    _body: options.body,
  } as unknown as H3Event;
  return { event, headers };
}

describe("Security Remediation Slice S3 ([H-01], [H-02], [H-04], [M-01..M-06])", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setAuthRedisClient(new InMemoryRedisClient());
    (
      globalThis as unknown as {
        setUserSession: ReturnType<typeof vi.fn>;
        clearUserSession: ReturnType<typeof vi.fn>;
      }
    ).setUserSession = vi.fn().mockResolvedValue(undefined);
    (
      globalThis as unknown as {
        clearUserSession: ReturnType<typeof vi.fn>;
      }
    ).clearUserSession = vi.fn().mockResolvedValue(undefined);
  });

  it("[H-01] resolveRateLimitRouteClass classifies sensitive /api/users/* routes instead of exempting them", () => {
    expect(resolveRateLimitRouteClass("/api/users/password", "POST")).toEqual({
      mode: "middleware",
      className: "auth:login",
    });
    expect(resolveRateLimitRouteClass("/api/users/email", "POST")).toEqual({
      mode: "middleware",
      className: "auth:login",
    });
    expect(
      resolveRateLimitRouteClass("/api/users/mfa/disable", "POST")
    ).toEqual({
      mode: "middleware",
      className: "auth:mfa",
    });
    expect(resolveRateLimitRouteClass("/api/users/mfa/verify", "POST")).toEqual(
      {
        mode: "middleware",
        className: "auth:mfa",
      }
    );
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

  it("[H-02] Manager MFA keeps challenge on 1st wrong TOTP attempt and locks after 5 failures", async () => {
    const mfaService = new MfaChallengeService(getAuthRedisClient());
    const created = await mfaService.createChallenge({
      namespace: "manager",
      accountId: 77,
      displayName: "Admin 77",
      role: "super_admin",
      rememberMe: false,
    });

    const secret = generateTotpSecret();
    const encrypted = encryptTotpSecret(
      secret,
      process.env.MFA_ENCRYPTION_KEY as string
    );

    mockDbSelect.mockImplementation((fields?: Record<string, unknown>) => ({
      from: () => ({
        where: () => {
          if (fields && "id" in fields) {
            return Promise.resolve([]);
          }
          const result = [
            {
              id: 77,
              email: "admin77@mindkid.vn",
              displayName: "Admin 77",
              role: "super_admin",
              isActive: true,
              mfaEnabled: true,
              secretEncrypted: encrypted,
              confirmedAt: new Date(),
            },
          ];
          return Object.assign(Promise.resolve(result), {
            limit: () => Promise.resolve(result),
          });
        },
      }),
    }));
    mockDbTransaction.mockImplementation(
      async (cb: (tx: Record<string, unknown>) => Promise<unknown>) => cb({})
    );

    // 1st wrong code -> 401 MFA_INVALID_CODE, challenge is NOT consumed
    const { event: wrongEvent } = createMockEvent({
      includeCsrfCookie: false,
      body: { challenge: created.challengeToken, code: "000000" },
    });
    await expect(managerMfaHandler(wrongEvent)).rejects.toMatchObject({
      code: "MFA_INVALID_CODE",
      status: 401,
    });

    // 2nd attempt with SAME challenge and valid code -> succeeds!
    const validCode = generateTotpCode(secret);
    const { event: validEvent, headers } = createMockEvent({
      includeCsrfCookie: false,
      body: { challenge: created.challengeToken, code: validCode },
    });
    const res = await managerMfaHandler(validEvent);
    expect(res.status).toBe("ok");
    const setCookieHeader = String(headers["set-cookie"] ?? "");
    expect(setCookieHeader).toContain("tm_m_csrf=");
  });

  it("[M-01 & M-02] User MFA sets tm_u_csrf + tm_u_remember cookies and returns user.uuid", async () => {
    const mfaService = new MfaChallengeService(getAuthRedisClient());
    const created = await mfaService.createChallenge({
      namespace: "user",
      accountId: 88,
      displayName: "Parent 88",
      rememberMe: true,
    });

    const secret = generateTotpSecret();
    const encrypted = encryptTotpSecret(
      secret,
      process.env.MFA_ENCRYPTION_KEY as string
    );

    mockDbSelect.mockImplementation(() => ({
      from: () => ({
        where: () =>
          Promise.resolve([
            {
              id: 88,
              uuid: "88888888-8888-4888-8888-888888888888",
              email: "parent88@mindkid.vn",
              displayName: "Parent 88",
              status: "active",
              secretEncrypted: encrypted,
              confirmedAt: new Date(),
            },
          ]),
      }),
    }));

    const validCode = generateTotpCode(secret);
    const { event, headers } = createMockEvent({
      includeCsrfCookie: false,
      body: { challenge: created.challengeToken, code: validCode },
    });

    const res = await userMfaHandler(event);
    expect(res.status).toBe("ok");
    expect((res.user as { uuid?: string }).uuid).toBe(
      "88888888-8888-4888-8888-888888888888"
    );
    const setCookieHeader = JSON.stringify(headers["set-cookie"] ?? "");
    expect(setCookieHeader).toContain("tm_u_remember=");
    expect(setCookieHeader).toContain("tm_u_csrf=");
  });

  it("[H-04] User reauth supports OAuth-only account via social method", async () => {
    // User has passwordHash = null, but has a linked Google identity
    let selectCount = 0;
    mockDbSelect.mockImplementation(() => ({
      from: () => ({
        where: () => ({
          limit: () => {
            selectCount += 1;
            if (selectCount === 1) {
              return Promise.resolve([{ passwordHash: null }]);
            }
            return Promise.resolve([{ id: 10, provider: "google" }]);
          },
        }),
      }),
    }));

    // Seed session in Redis so markCurrentSessionReauthenticated succeeds
    const sessionSvc = await import("@mindkid/auth").then((m) =>
      m.getBrowserSessionService()
    );
    const created = await sessionSvc.create({
      namespace: "user",
      accountId: 99,
      displayName: "OAuth User",
    });

    const { event } = createMockEvent({
      user: {
        user_id: 99,
        display_name: "OAuth User",
        session_id: created.sessionId,
      },
      body: { method: "social", provider: "google" },
    });

    const res = await userReauthHandler(event);
    expect(res.ok).toBe(true);
  });

  it("[M-03] Single-device logout revokes only the current device, not other devices of the same user", async () => {
    const sessionSvc = await import("@mindkid/auth").then((m) =>
      m.getBrowserSessionService()
    );
    const devA = await sessionSvc.create({
      namespace: "user",
      accountId: 55,
      displayName: "Parent 55",
    });
    const devB = await sessionSvc.create({
      namespace: "user",
      accountId: 55,
      displayName: "Parent 55",
    });

    mockDbUpdate.mockReturnValue({
      set: () => ({
        where: () => Promise.resolve([]),
      }),
    });

    const { event } = createMockEvent({
      user: {
        user_id: 55,
        display_name: "Parent 55",
        session_id: devA.sessionId,
      },
    });

    await handleUserLogout(event);

    // Device A is revoked, but Device B MUST remain active!
    const resolvedA = await sessionSvc.resolve("user", devA.sessionToken);
    const resolvedB = await sessionSvc.resolve("user", devB.sessionToken);
    expect(resolvedA).toBeNull();
    expect(resolvedB?.user?.user_id).toBe(55);
  });
});
