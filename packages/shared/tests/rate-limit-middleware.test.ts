import { beforeEach, describe, expect, it } from "vitest";
import { clearInMemoryBuckets } from "../../cache/src/index.js";
import { enforceTwoAxisRateLimit } from "../src/rate-limit-middleware.js";

describe("Two-Axis Rate Limiter Middleware (Task 8 / BR-RTL-01..07)", () => {
  beforeEach(() => {
    clearInMemoryBuckets();
  });

  it("Ca âm BR-RTL-01 Axis 1 (IP): 50 requests from 1 IP for 50 emails blocks IP on 21st request", async () => {
    const ip = "192.168.1.100";
    // Limit for auth:login IP is 20
    for (let i = 1; i <= 20; i++) {
      const res = await enforceTwoAxisRateLimit({
        routeClass: "auth:login",
        remoteIp: ip,
        accountIdentifier: `user_${i}@example.com`,
      });
      expect(res.statusCode).toBe(200);
    }

    // 21st request from same IP -> 429
    const resBlocked = await enforceTwoAxisRateLimit({
      routeClass: "auth:login",
      remoteIp: ip,
      accountIdentifier: "user_21@example.com",
    });
    expect(resBlocked.statusCode).toBe(429);
    expect(resBlocked.headers?.["Retry-After"]).toBeDefined();
    expect(resBlocked.body?.code).toBe("RATE_LIMITED");
  });

  it("Ca âm BR-RTL-01 Axis 2 (Account): 10 requests for 1 email across 10 IPs blocks account on 6th request", async () => {
    const targetEmail = "victim@example.com";
    // Limit for auth:login Account is 5
    for (let i = 1; i <= 5; i++) {
      const res = await enforceTwoAxisRateLimit({
        routeClass: "auth:login",
        remoteIp: `10.0.0.${i}`,
        accountIdentifier: targetEmail,
      });
      expect(res.statusCode).toBe(200);
    }

    // 6th request for same email from new IP -> 429
    const resBlocked = await enforceTwoAxisRateLimit({
      routeClass: "auth:login",
      remoteIp: "10.0.0.99",
      accountIdentifier: targetEmail,
    });
    expect(resBlocked.statusCode).toBe(429);
    expect(resBlocked.body?.code).toBe("RATE_LIMITED");
  });

  it("BR-RTL-07: 429 error response body for registered and unregistered email is identical", async () => {
    // Fill up bucket for email
    const regEmail = "registered@example.com";
    const unregEmail = "unregistered@example.com";

    for (let i = 0; i < 5; i++) {
      await enforceTwoAxisRateLimit({
        routeClass: "auth:login",
        remoteIp: `172.16.0.${i}`,
        accountIdentifier: regEmail,
      });
      await enforceTwoAxisRateLimit({
        routeClass: "auth:login",
        remoteIp: `172.16.1.${i}`,
        accountIdentifier: unregEmail,
      });
    }

    const regRes = await enforceTwoAxisRateLimit({
      routeClass: "auth:login",
      remoteIp: "172.16.0.99",
      accountIdentifier: regEmail,
    });
    const unregRes = await enforceTwoAxisRateLimit({
      routeClass: "auth:login",
      remoteIp: "172.16.1.99",
      accountIdentifier: unregEmail,
    });

    expect(regRes.body).toEqual(unregRes.body);
  });
});
