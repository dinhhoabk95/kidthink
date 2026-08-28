import { AppError } from "@mindkid/auth";
import { RATE_LIMIT_CONFIGS, type RouteClassName } from "@mindkid/shared";
import { createEvent, type H3Event } from "h3";
import { afterEach, describe, expect, it } from "vitest";
import rateLimitMiddleware from "#server/middleware/rate-limit";
import { getVerifiedRemoteIp } from "#server/utils/auth-runtime";

function createResponse() {
  const headers = new Map<string, string | string[]>();
  return {
    headersSent: false,
    writableEnded: false,
    getHeader: (name: string) => headers.get(name.toLowerCase()),
    setHeader: (name: string, value: string | string[]) => {
      headers.set(name.toLowerCase(), value);
    },
    removeHeader: (name: string) => headers.delete(name.toLowerCase()),
    getHeaders: () => Object.fromEntries(headers),
    end: () => undefined,
  };
}

function makeEvent(options: {
  path: string;
  method?: string;
  ip?: string;
  headers?: Record<string, string>;
  userId?: number;
  managerId?: number;
}): H3Event {
  const req = {
    method: options.method ?? "GET",
    url: options.path,
    headers: { host: "mindkid.test", ...(options.headers ?? {}) },
    socket: { remoteAddress: options.ip ?? "198.51.100.7" },
  };
  const event = createEvent(
    req as never,
    createResponse() as never
  ) as unknown as H3Event;
  event.context.user = options.userId
    ? ({ user_id: options.userId } as never)
    : undefined;
  event.context.manager = options.managerId
    ? ({ manager_id: options.managerId } as never)
    : undefined;
  return event;
}

/** Gọi middleware `count` lần trên cùng một IP, trả lỗi đầu tiên nếu có. */
async function callUntilRejected(options: {
  path: string;
  method: string;
  ip: string;
  attempts: number;
}): Promise<{ rejectedAt: number | null; error: unknown }> {
  for (let attempt = 1; attempt <= options.attempts; attempt++) {
    try {
      await rateLimitMiddleware(
        makeEvent({
          path: options.path,
          method: options.method,
          ip: options.ip,
        })
      );
    } catch (error) {
      return { rejectedAt: attempt, error };
    }
  }
  return { rejectedAt: null, error: null };
}

const NEWLY_WIRED: ReadonlyArray<{
  className: RouteClassName;
  path: string;
  method: string;
}> = [
  { className: "export:data", path: "/api/users/data-export", method: "GET" },
  { className: "payment:create", path: "/api/users/orders", method: "POST" },
  {
    className: "payment:proof",
    path: "/api/users/orders/o-1/proof",
    method: "POST",
  },
  { className: "upload:image", path: "/api/managers/images", method: "POST" },
  {
    className: "auth:refresh",
    path: "/api/users/auth/restore",
    method: "POST",
  },
  { className: "search", path: "/api/users/ai/search", method: "GET" },
  {
    className: "play:events",
    path: "/api/users/play-sessions/s-1/events",
    method: "POST",
  },
  { className: "read:public", path: "/api/guest/home", method: "GET" },
  { className: "managers:*", path: "/api/managers/dashboard", method: "GET" },
];

describe("rate-limit middleware — BR-RTL-01/03/10", () => {
  let counter = 0;
  const nextIp = () => `203.0.113.${(counter++ % 250) + 1}`;

  it.each(NEWLY_WIRED)(
    "$className returns 429 with Retry-After once the IP axis is spent",
    async ({ className, path, method }) => {
      const limit = RATE_LIMIT_CONFIGS[className].ipLimit;
      const ip = `${nextIp()}:${className}`;

      const { rejectedAt, error } = await callUntilRejected({
        path,
        method,
        ip,
        attempts: limit + 1,
      });

      expect(rejectedAt).toBe(limit + 1);
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe("RATE_LIMITED");
      expect((error as AppError).status).toBe(429);
      expect((error as AppError).details).toMatchObject({
        retry_after_s: expect.any(Number),
      });
    }
  );

  it("stays out of the way for auth routes that limit themselves", async () => {
    const ip = nextIp();
    for (let i = 0; i < 40; i++) {
      await expect(
        rateLimitMiddleware(
          makeEvent({ path: "/api/guest/auth/users/login", method: "POST", ip })
        )
      ).resolves.toBeUndefined();
    }
  });

  it("leaves provider webhooks alone (signature is their gate)", async () => {
    const ip = nextIp();
    for (let i = 0; i < 40; i++) {
      await expect(
        rateLimitMiddleware(
          makeEvent({
            path: "/api/guest/webhooks/ses-sns",
            method: "POST",
            ip,
          })
        )
      ).resolves.toBeUndefined();
    }
  });

  it("account axis is separate from the IP axis", async () => {
    // `payment:create` cho 5 lượt mỗi account, 20 mỗi IP. Đổi IP mỗi lần thì
    // trục IP không bao giờ cạn — lượt thứ 6 phải rớt vì trục account.
    const userId = 987_654;
    let rejected = 0;
    for (let attempt = 1; attempt <= 6; attempt++) {
      try {
        await rateLimitMiddleware(
          makeEvent({
            path: "/api/users/orders",
            method: "POST",
            ip: `${nextIp()}:acct-axis`,
            userId,
          })
        );
      } catch {
        rejected = attempt;
        break;
      }
    }
    expect(rejected).toBe(
      RATE_LIMIT_CONFIGS["payment:create"].accountLimit + 1
    );
  });
});

describe("getVerifiedRemoteIp — BR-RTL-04/11", () => {
  const original = process.env.TRUSTED_PROXY_IPS;
  afterEach(() => {
    if (original === undefined) {
      process.env.TRUSTED_PROXY_IPS = undefined;
      delete process.env.TRUSTED_PROXY_IPS;
    } else {
      process.env.TRUSTED_PROXY_IPS = original;
    }
  });

  it("reads X-Real-IP when the peer is a configured trusted proxy", () => {
    process.env.TRUSTED_PROXY_IPS = "127.0.0.1,::1";
    const event = makeEvent({
      path: "/api/guest/home",
      ip: "127.0.0.1",
      headers: { "x-real-ip": "203.0.113.9" },
    });
    expect(getVerifiedRemoteIp(event)).toBe("203.0.113.9");
  });

  it("normalizes the IPv4-mapped form nginx hands over", () => {
    process.env.TRUSTED_PROXY_IPS = "127.0.0.1";
    const event = makeEvent({
      path: "/api/guest/home",
      ip: "::ffff:127.0.0.1",
      headers: { "x-real-ip": "203.0.113.9" },
    });
    expect(getVerifiedRemoteIp(event)).toBe("203.0.113.9");
  });

  it("negative — ignores X-Real-IP from an untrusted peer", () => {
    process.env.TRUSTED_PROXY_IPS = "127.0.0.1";
    const event = makeEvent({
      path: "/api/guest/home",
      ip: "198.51.100.4",
      headers: { "x-real-ip": "203.0.113.9" },
    });
    expect(getVerifiedRemoteIp(event)).toBe("198.51.100.4");
  });

  it("negative — never reads raw X-Forwarded-For", () => {
    process.env.TRUSTED_PROXY_IPS = "127.0.0.1";
    const event = makeEvent({
      path: "/api/guest/home",
      ip: "127.0.0.1",
      headers: { "x-forwarded-for": "203.0.113.9, 10.0.0.1" },
    });
    expect(getVerifiedRemoteIp(event)).toBe("127.0.0.1");
  });

  it("falls back to the socket address when the trusted proxy sends no header", () => {
    process.env.TRUSTED_PROXY_IPS = "127.0.0.1";
    const event = makeEvent({ path: "/api/guest/home", ip: "127.0.0.1" });
    expect(getVerifiedRemoteIp(event)).toBe("127.0.0.1");
  });
});
