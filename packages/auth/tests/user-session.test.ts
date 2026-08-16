import { decodeJwt } from "jose";
import { describe, expect, it } from "vitest";
import type { ManagerTokenPayload, UserTokenPayload } from "../src/contracts";
import { createAdminManagerToken } from "../src/manager-session";
import {
  createWebUserToken,
  KIDTHINK_USER_AUDIENCE,
  KIDTHINK_WEB_ISSUER,
  verifyWebUserToken,
} from "../src/user-session";

const TEST_SECRET = "super-secret-key-at-least-32-chars-long!!";
const WRONG_SECRET = "wrong-secret-key-at-least-32-chars-long!!";

const validUser: UserTokenPayload = {
  user_id: 101,
  display_name: "Người dùng An",
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
    expect(decodeJwt(token)).toMatchObject({
      aud: KIDTHINK_USER_AUDIENCE,
      iss: KIDTHINK_WEB_ISSUER,
    });
  });

  it("accepts refresh_token_version zero from a newly-created account", async () => {
    const payload = { ...validUser, refresh_token_version: 0 };
    const token = await createWebUserToken({ payload, secret: TEST_SECRET });

    await expect(
      verifyWebUserToken({ token, secret: TEST_SECRET })
    ).resolves.toEqual(payload);
  });

  it("fails closed when a signing or verification secret is shorter than 32 UTF-8 bytes", async () => {
    await expect(
      createWebUserToken({ payload: validUser, secret: "too-short" })
    ).rejects.toThrowError(
      expect.objectContaining({ code: "UNAUTHENTICATED", status: 401 })
    );

    const token = await createWebUserToken({
      payload: validUser,
      secret: TEST_SECRET,
    });
    await expect(
      verifyWebUserToken({ token, secret: "too-short" })
    ).rejects.toThrowError(
      expect.objectContaining({ code: "UNAUTHENTICATED", status: 401 })
    );
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

  it("fails verification for a canonical Manager token even when the secret is shared accidentally", async () => {
    const manager: ManagerTokenPayload = {
      manager_id: 201,
      display_name: "Quản trị viên Bình",
      session_id: "manager-session-201",
      refresh_token_version: 0,
      role: "content_reviewer",
    };
    const token = await createAdminManagerToken({
      payload: manager,
      secret: TEST_SECRET,
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
