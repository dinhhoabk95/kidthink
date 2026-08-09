import { describe, expect, it } from "vitest";
import type { ManagerTokenPayload } from "../src/contracts";
import {
  createAdminManagerToken,
  verifyAdminManagerToken,
} from "../src/manager-session";

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

  it("fails verification with wrong audience (e.g. web audience)", async () => {
    const token = await createAdminManagerToken({
      payload: validManager,
      secret: ADMIN_SECRET,
      audience: "kidthink-web",
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
