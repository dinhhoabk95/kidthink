import { describe, expect, it } from "vitest";
import {
  createRefreshToken,
  hashRefreshToken,
  verifyRefreshToken,
} from "../src/refresh";

const USER_SECRET = "user-refresh-envelope-secret-32-bytes-minimum";
const MANAGER_SECRET = "manager-refresh-envelope-secret-32-bytes-minimum";
const REFRESH_ENVELOPE = /^v1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

describe("MAC-bound refresh envelope", () => {
  it("round-trips only the canonical namespace, sid, version and a 32-byte nonce", () => {
    const token = createRefreshToken({
      namespace: "user",
      sessionId: "session_123",
      refreshTokenVersion: 0,
      secret: USER_SECRET,
    });

    expect(token).toMatch(REFRESH_ENVELOPE);
    expect(verifyRefreshToken(token, "user", USER_SECRET)).toMatchObject({
      namespace: "user",
      sessionId: "session_123",
      refreshTokenVersion: 0,
    });
    expect(hashRefreshToken(token)).toHaveLength(64);
    expect(hashRefreshToken(token)).not.toContain("session_123");
  });

  it("rejects a tampered sid before any store lookup can trust it", () => {
    const token = createRefreshToken({
      namespace: "user",
      sessionId: "session_safe",
      refreshTokenVersion: 3,
      secret: USER_SECRET,
    });
    const [, encodedPayload, mac] = token.split(".");
    const payload = JSON.parse(
      Buffer.from(encodedPayload ?? "", "base64url").toString("utf8")
    ) as Record<string, unknown>;
    const tamperedPayload = Buffer.from(
      JSON.stringify({ ...payload, sid: "session_victim" })
    ).toString("base64url");

    expect(() =>
      verifyRefreshToken(`v1.${tamperedPayload}.${mac}`, "user", USER_SECRET)
    ).toThrowError(
      expect.objectContaining({ code: "SESSION_REVOKED", status: 401 })
    );
  });

  it("rejects the wrong namespace, wrong secret, malformed input and a short secret", () => {
    const token = createRefreshToken({
      namespace: "user",
      sessionId: "session_123",
      refreshTokenVersion: 1,
      secret: USER_SECRET,
    });

    for (const verify of [
      () => verifyRefreshToken(token, "manager", USER_SECRET),
      () => verifyRefreshToken(token, "user", MANAGER_SECRET),
      () => verifyRefreshToken("not-an-envelope", "user", USER_SECRET),
      () => verifyRefreshToken(token, "user", "short"),
    ]) {
      expect(verify).toThrowError(
        expect.objectContaining({ code: "SESSION_REVOKED", status: 401 })
      );
    }

    expect(() =>
      createRefreshToken({
        namespace: "user",
        sessionId: "session_123",
        refreshTokenVersion: 1,
        secret: "short",
      })
    ).toThrowError(
      expect.objectContaining({ code: "UNAUTHENTICATED", status: 401 })
    );
  });
});
