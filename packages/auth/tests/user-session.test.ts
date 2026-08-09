import { describe, expect, it } from "vitest";
import type { UserTokenPayload } from "../src/contracts";
import { createWebUserToken, verifyWebUserToken } from "../src/user-session";

const TEST_SECRET = "super-secret-key-at-least-32-chars-long!!";
const WRONG_SECRET = "wrong-secret-key-at-least-32-chars-long!!";

const validUser: UserTokenPayload = {
  user_id: 101,
  display_name: "Phụ huynh An",
  session_id: "session-user-123",
  refresh_token_version: 1,
  active_child_id: 301,
};

describe("User Session JWT token lifecycle", () => {
  it("creates and verifies valid user JWT access token", async () => {
    const token = await createWebUserToken({
      payload: validUser,
      secret: TEST_SECRET,
    });

    expect(typeof token).toBe("string");

    const verified = await verifyWebUserToken({
      token,
      secret: TEST_SECRET,
    });

    expect(verified).toEqual(validUser);
  });

  it("fails verification with wrong secret", async () => {
    const token = await createWebUserToken({
      payload: validUser,
      secret: TEST_SECRET,
    });

    await expect(
      verifyWebUserToken({ token, secret: WRONG_SECRET })
    ).rejects.toThrowError(
      expect.objectContaining({ code: "UNAUTHENTICATED", status: 401 })
    );
  });

  it("fails verification with wrong audience (e.g. admin audience)", async () => {
    const token = await createWebUserToken({
      payload: validUser,
      secret: TEST_SECRET,
      audience: "kidthink-admin",
    });

    await expect(
      verifyWebUserToken({ token, secret: TEST_SECRET })
    ).rejects.toThrowError(
      expect.objectContaining({ code: "UNAUTHENTICATED", status: 401 })
    );
  });

  it("fails token creation if payload contains prohibited fields (role, package, etc)", async () => {
    const invalidPayload = {
      ...validUser,
      role: "admin",
    } as unknown as UserTokenPayload;

    await expect(
      createWebUserToken({
        payload: invalidPayload,
        secret: TEST_SECRET,
      })
    ).rejects.toThrowError(
      expect.objectContaining({ code: "UNAUTHENTICATED", status: 401 })
    );
  });

  it("fails verification if token is tampered with", async () => {
    const token = await createWebUserToken({
      payload: validUser,
      secret: TEST_SECRET,
    });
    const tampered = `${token.slice(0, token.length - 5)}abcde`;

    await expect(
      verifyWebUserToken({ token: tampered, secret: TEST_SECRET })
    ).rejects.toThrowError(
      expect.objectContaining({ code: "UNAUTHENTICATED", status: 401 })
    );
  });

  it("fails verification if token is expired", async () => {
    const token = await createWebUserToken({
      payload: validUser,
      secret: TEST_SECRET,
      expiresInSeconds: -10, // expired 10s ago
    });

    await expect(
      verifyWebUserToken({ token, secret: TEST_SECRET })
    ).rejects.toThrowError(
      expect.objectContaining({ code: "UNAUTHENTICATED", status: 401 })
    );
  });
});
