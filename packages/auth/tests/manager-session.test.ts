import { decodeJwt } from "jose";
import { describe, expect, it } from "vitest";
import type { ManagerTokenPayload, UserTokenPayload } from "../src/contracts";
import {
  createAdminManagerToken,
  KIDTHINK_ADMIN_ISSUER,
  KIDTHINK_MANAGER_AUDIENCE,
  verifyAdminManagerToken,
} from "../src/manager-session";
import { createWebUserToken } from "../src/user-session";

const ADMIN_SECRET = "super-secret-admin-key-at-least-32-chars-long!!";
const WRONG_SECRET = "wrong-secret-admin-key-at-least-32-chars-long!!";

const validManager: ManagerTokenPayload = {
  manager_id: 201,
  display_name: "Biên tập viên Bình",
  session_id: "session-mgr-123",
  refresh_token_version: 1,
  role: "content_reviewer",
};

describe("Manager Session JWT token lifecycle", () => {
  it("creates and verifies valid manager JWT access token", async () => {
    const token = await createAdminManagerToken({
      payload: validManager,
      secret: ADMIN_SECRET,
    });

    expect(typeof token).toBe("string");

    const verified = await verifyAdminManagerToken({
      token,
      secret: ADMIN_SECRET,
    });

    expect(verified).toEqual(validManager);
    expect(decodeJwt(token)).toMatchObject({
      aud: KIDTHINK_MANAGER_AUDIENCE,
      iss: KIDTHINK_ADMIN_ISSUER,
    });
  });

  it("accepts refresh_token_version zero from a newly-created manager", async () => {
    const payload = { ...validManager, refresh_token_version: 0 };
    const token = await createAdminManagerToken({
      payload,
      secret: ADMIN_SECRET,
    });

    await expect(
      verifyAdminManagerToken({ token, secret: ADMIN_SECRET })
    ).resolves.toEqual(payload);
  });

  it("fails closed when a signing or verification secret is shorter than 32 UTF-8 bytes", async () => {
    await expect(
      createAdminManagerToken({ payload: validManager, secret: "too-short" })
    ).rejects.toThrowError(
      expect.objectContaining({ code: "UNAUTHENTICATED", status: 401 })
    );

    const token = await createAdminManagerToken({
      payload: validManager,
      secret: ADMIN_SECRET,
    });
    await expect(
      verifyAdminManagerToken({ token, secret: "too-short" })
    ).rejects.toThrowError(
      expect.objectContaining({ code: "UNAUTHENTICATED", status: 401 })
    );
  });

  it("fails verification with wrong secret", async () => {
    const token = await createAdminManagerToken({
      payload: validManager,
      secret: ADMIN_SECRET,
    });

    await expect(
      verifyAdminManagerToken({ token, secret: WRONG_SECRET })
    ).rejects.toThrowError(
      expect.objectContaining({ code: "UNAUTHENTICATED", status: 401 })
    );
  });

  it("fails verification for a canonical User token even when the secret is shared accidentally", async () => {
    const user: UserTokenPayload = {
      user_id: 101,
      display_name: "Người dùng An",
      session_id: "user-session-101",
      refresh_token_version: 0,
    };
    const token = await createWebUserToken({
      payload: user,
      secret: ADMIN_SECRET,
    });

    await expect(
      verifyAdminManagerToken({ token, secret: ADMIN_SECRET })
    ).rejects.toThrowError(
      expect.objectContaining({ code: "UNAUTHENTICATED", status: 401 })
    );
  });

  it("fails verification if token contains active_child_id or user_id", async () => {
    const invalidPayload = {
      ...validManager,
      active_child_id: 10,
    } as unknown as ManagerTokenPayload;

    await expect(
      createAdminManagerToken({
        payload: invalidPayload,
        secret: ADMIN_SECRET,
      })
    ).rejects.toThrowError(
      expect.objectContaining({ code: "UNAUTHENTICATED", status: 401 })
    );
  });

  it("fails verification if role is missing or invalid", async () => {
    const invalidRolePayload = {
      ...validManager,
      role: "unknown_role",
    } as unknown as ManagerTokenPayload;

    await expect(
      createAdminManagerToken({
        payload: invalidRolePayload,
        secret: ADMIN_SECRET,
      })
    ).rejects.toThrowError(
      expect.objectContaining({ code: "UNAUTHENTICATED", status: 401 })
    );
  });
});
