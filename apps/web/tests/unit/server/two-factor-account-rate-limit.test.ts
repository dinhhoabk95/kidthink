import { RateLimitedError } from "@mindkid/errors/common";
import { describe, expect, it } from "vitest";
import {
  buildManagerAuthCallbacks,
  buildUserAuthCallbacks,
} from "#server/utils/better-auth-callbacks";

const MFA_ACCOUNT_LIMIT = 5;

function uniqueIp(): string {
  return `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;
}

describe("BR-RTL-01 — auth:mfa trục account (2FA verify)", () => {
  it("user: account thứ 6 trong cửa sổ bị 429 dù mỗi lần đến từ một IP khác", async () => {
    const callbacks = buildUserAuthCallbacks(() => Promise.resolve(null));
    const identifier = `user:${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const call = (ipAddress: string) =>
      callbacks.enforceRateLimit?.({
        routeClass: "auth:mfa",
        ipAddress,
        identifier,
        skipIpCheck: true,
      });
    for (let i = 0; i < MFA_ACCOUNT_LIMIT; i++) {
      await call(uniqueIp());
    }
    await expect(call(uniqueIp())).rejects.toBeInstanceOf(RateLimitedError);
  });

  it("manager: dùng cùng lớp auth:mfa, không rơi về auth:login", async () => {
    const callbacks = buildManagerAuthCallbacks(() => Promise.resolve(null));
    const identifier = `manager:${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const call = () =>
      callbacks.enforceRateLimit?.({
        routeClass: "auth:mfa",
        ipAddress: uniqueIp(),
        identifier,
        skipIpCheck: true,
      });
    for (let i = 0; i < MFA_ACCOUNT_LIMIT; i++) {
      await call();
    }
    await expect(call()).rejects.toBeInstanceOf(RateLimitedError);
  });
});
