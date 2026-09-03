import {
  AppError,
  getBrowserSessionService,
  InMemoryRedisClient,
  setAuthRedisClient,
} from "@mindkid/auth";
import {
  createEvent,
  getResponseHeader,
  type H3Event,
  type SessionConfig,
  useSession,
} from "h3";
import { beforeEach, describe, expect, it, vi } from "vitest";
import authMiddleware from "#server/middleware/auth";
import { assertManagerSameOriginRequest } from "#server/utils/admin-auth-runtime";
import {
  getManagerSessionConfig,
  getUserSessionConfig,
} from "#server/utils/session-runtime";

/**
 * `#imports` mặc định trỏ vào mock WeakMap của `apps/web/tests/mock-imports.ts`:
 * nó lưu phiên theo tham chiếu event và **không bao giờ đọc cookie**. Test viết
 * trên mock đó sẽ xanh kể cả khi middleware không parse được cookie nào — đúng
 * rủi ro plan Task #104 nêu. Ở file này, `#imports` được nối vào phiên h3 thật
 * để mọi ca dưới đây đi qua một header `Cookie`.
 */
vi.mock("#imports", async () => {
  const h3 = await import("h3");
  const runtime = await import("#server/utils/session-runtime");

  return {
    getUserSession: async (event: H3Event) =>
      (await h3.useSession(event, runtime.getUserSessionConfig())).data,
    setUserSession: async (
      event: H3Event,
      data: Record<string, unknown>,
      config?: SessionConfig
    ) => {
      const session = await h3.useSession(
        event,
        config || runtime.getUserSessionConfig()
      );
      await session.update(data);
    },
    clearUserSession: async (event: H3Event, config?: SessionConfig) => {
      const session = await h3.useSession(
        event,
        config || runtime.getUserSessionConfig()
      );
      await session.clear();
    },
  };
});

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

/** Phát một cookie phiên thật rồi trả về giá trị dùng cho header `Cookie`. */
async function issueSessionCookie(
  config: SessionConfig,
  sessionToken: string
): Promise<string> {
  const response = createResponse();
  const event = createEvent(
    { method: "GET", url: "/", headers: {} } as never,
    response as never
  );
  const session = await useSession(event, config);
  await session.update({ secure: { session_token: sessionToken } });

  const header = getResponseHeader(event, "set-cookie");
  const value = Array.isArray(header) ? header[0] : header;
  return String(value).split(";", 1)[0];
}

describe("web auth middleware", () => {
  beforeEach(() => {
    setAuthRedisClient(new InMemoryRedisClient());
  });

  it("resolves a manager session from the manager cookie on manager routes", async () => {
    const created = await getBrowserSessionService().create({
      namespace: "manager",
      accountId: 7,
      displayName: "Quản trị viên",
      role: "super_admin",
    });
    const event = createRequest("/api/managers/dashboard", {
      cookie: await issueSessionCookie(
        getManagerSessionConfig(),
        created.sessionToken
      ),
    });

    await authMiddleware(event);

    expect(event.context.manager).toMatchObject({
      manager_id: 7,
      role: "super_admin",
    });
    expect(event.context.user).toBeUndefined();
  });

  it("ignores a valid user cookie on a manager route", async () => {
    const created = await getBrowserSessionService().create({
      namespace: "user",
      accountId: 8,
      displayName: "User 8",
    });
    const event = createRequest("/api/managers/dashboard", {
      cookie: await issueSessionCookie(
        getUserSessionConfig(),
        created.sessionToken
      ),
    });

    await authMiddleware(event);

    expect(event.context.manager).toBeUndefined();
    expect(event.context.user).toBeUndefined();
  });

  it("rejects a user token presented inside the manager cookie", async () => {
    const created = await getBrowserSessionService().create({
      namespace: "user",
      accountId: 8,
      displayName: "User 8",
    });
    const event = createRequest("/api/managers/dashboard", {
      cookie: await issueSessionCookie(
        getManagerSessionConfig(),
        created.sessionToken
      ),
    });

    await authMiddleware(event);

    expect(event.context.manager).toBeUndefined();
    expect(event.context.user).toBeUndefined();
  });

  it("resolves the user session from the user cookie on user routes", async () => {
    const created = await getBrowserSessionService().create({
      namespace: "user",
      accountId: 9,
      displayName: "User 9",
    });
    const event = createRequest("/api/users/dashboard", {
      cookie: await issueSessionCookie(
        getUserSessionConfig(),
        created.sessionToken
      ),
    });

    await authMiddleware(event);

    expect(event.context.user).toMatchObject({ user_id: 9 });
    expect(event.context.manager).toBeUndefined();
  });

  // BR-SLK-01: liên kết OAuth chạy trên route guest nhưng vẫn cần danh tính
  // user, nên namespace user phải phủ cả `/api/guest/**`.
  it("resolves the user session on a guest route that requires identity", async () => {
    const created = await getBrowserSessionService().create({
      namespace: "user",
      accountId: 11,
      displayName: "User 11",
    });
    const event = createRequest(
      "/api/guest/auth/oauth/google/start?intent=link",
      {
        cookie: await issueSessionCookie(
          getUserSessionConfig(),
          created.sessionToken
        ),
      }
    );

    await authMiddleware(event);

    expect(event.context.user).toMatchObject({ user_id: 11 });
    expect(event.context.manager).toBeUndefined();
  });

  it("resolves nothing outside the API surface", async () => {
    const created = await getBrowserSessionService().create({
      namespace: "user",
      accountId: 12,
      displayName: "User 12",
    });
    const event = createRequest("/hoc-tap", {
      cookie: await issueSessionCookie(
        getUserSessionConfig(),
        created.sessionToken
      ),
    });

    await authMiddleware(event);

    expect(event.context.user).toBeUndefined();
    expect(event.context.manager).toBeUndefined();
  });

  it("refuses a Bearer token on a browser endpoint", async () => {
    const created = await getBrowserSessionService().create({
      namespace: "user",
      accountId: 13,
      displayName: "User 13",
    });
    const event = createRequest("/api/users/dashboard", {
      authorization: "Bearer some-token",
      cookie: await issueSessionCookie(
        getUserSessionConfig(),
        created.sessionToken
      ),
    });

    await authMiddleware(event);

    expect(event.context.user).toBeUndefined();
    expect(event.context.manager).toBeUndefined();
  });

  it("transparently auto-restores user session from remember cookie when session cookie is absent or expired", async () => {
    const created = await getBrowserSessionService().create({
      namespace: "user",
      accountId: 14,
      displayName: "Remember User",
      rememberMe: true,
    });

    expect(created.rememberToken).toBeDefined();

    // Request has NO session cookie, but HAS tm_u_remember cookie
    const event = createRequest("/api/users/profile", {
      cookie: `tm_u_remember=${created.rememberToken}`,
    });

    await authMiddleware(event);

    expect(event.context.user).toBeDefined();
    expect(event.context.user?.user_id).toBe(14);
    expect(event.context.user?.display_name).toBe("Remember User");
  });

  it("transparently auto-restores manager session from remember cookie when session cookie is absent or expired", async () => {
    const created = await getBrowserSessionService().create({
      namespace: "manager",
      accountId: 15,
      displayName: "Remember Manager",
      role: "content_reviewer",
      rememberMe: true,
    });

    expect(created.rememberToken).toBeDefined();

    // Request has NO session cookie, but HAS tm_m_remember cookie
    const event = createRequest("/api/managers/content", {
      cookie: `tm_m_remember=${created.rememberToken}`,
    });

    await authMiddleware(event);

    expect(event.context.manager).toBeDefined();
    expect(event.context.manager?.manager_id).toBe(15);
    expect(event.context.manager?.role).toBe("content_reviewer");
  });
});

// BR-ARB-05: allowlist origin là thứ chặn admin origin lạ, không phải middleware.
describe("manager origin policy", () => {
  function originRequest(origin: string): H3Event {
    return createRequest("/api/guest/auth/managers/login", {
      host: "localhost:3000",
      origin,
      "sec-fetch-site": "same-site",
    });
  }

  it("accepts an origin from NUXT_ALLOWED_ORIGINS", () => {
    expect(() =>
      assertManagerSameOriginRequest(originRequest("http://localhost:3001"))
    ).not.toThrow();
  });

  it("rejects an origin outside the allowlist with CSRF_INVALID", () => {
    let thrown: unknown;
    try {
      assertManagerSameOriginRequest(originRequest("http://evil.test"));
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AppError);
    expect((thrown as AppError).code).toBe("CSRF_INVALID");
  });

  it("rejects a cross-site fetch regardless of origin", () => {
    const event = createRequest("/api/guest/auth/managers/login", {
      host: "localhost:3000",
      origin: "http://localhost:3001",
      "sec-fetch-site": "cross-site",
    });

    expect(() => assertManagerSameOriginRequest(event)).toThrow();
  });
});
