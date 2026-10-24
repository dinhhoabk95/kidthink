import { beforeEach, describe, expect, it, vi } from "vitest";

interface FakeUser {
  id: number;
  status: string;
  purgeAt: Date | null;
  passwordHash: string | null;
}

const state: { user: FakeUser } = {
  user: {
    id: 5,
    status: "deleted",
    purgeAt: new Date(Date.now() + 86_400_000),
    passwordHash: "hash",
  },
};

const cancelSpy = vi.hoisted(() => vi.fn());

vi.mock("@mindkid/auth", () => ({
  verifyPassword: (plain: string) => Promise.resolve(plain === "good-pass"),
}));
vi.mock("@mindkid/db", () => ({
  cancelUserDeletion: cancelSpy,
  getOwnerDb: () => ({
    select: () => ({
      from: () => ({
        where: () => ({ limit: () => Promise.resolve([state.user]) }),
      }),
    }),
  }),
  users: { id: "id", email: "email", status: "status", purgeAt: "purge_at" },
}));

import handler from "#server/api/users/account/delete/cancel.post";

function event(body: Record<string, string>) {
  return { context: { body }, node: { req: { headers: {} }, res: {} } };
}

describe("UC-027 BR-003: huỷ xoá không phiên phải xác minh", () => {
  beforeEach(() => {
    cancelSpy.mockClear();
    state.user.status = "deleted";
    state.user.purgeAt = new Date(Date.now() + 86_400_000);
    state.user.passwordHash = "hash";
  });

  it("thiếu mật khẩu: từ chối, không khôi phục", async () => {
    await expect(
      handler(event({ email: "a@b.vn" }) as never)
    ).rejects.toMatchObject({ statusCode: 401 });
    expect(cancelSpy).not.toHaveBeenCalled();
  });

  it("sai mật khẩu: từ chối", async () => {
    await expect(
      handler(event({ email: "a@b.vn", password: "nope" }) as never)
    ).rejects.toMatchObject({ statusCode: 401 });
    expect(cancelSpy).not.toHaveBeenCalled();
  });

  it("tài khoản không có mật khẩu: không được bỏ qua xác thực", async () => {
    state.user.passwordHash = null;
    await expect(
      handler(event({ email: "a@b.vn", password: "good-pass" }) as never)
    ).rejects.toMatchObject({ statusCode: 401 });
    expect(cancelSpy).not.toHaveBeenCalled();
  });

  it("tài khoản đang suspended: từ chối 403 ACCOUNT_SUSPENDED, không được tự mở khoá", async () => {
    state.user.status = "suspended";
    await expect(
      handler(event({ email: "a@b.vn", password: "good-pass" }) as never)
    ).rejects.toMatchObject({ statusCode: 403, code: "ACCOUNT_SUSPENDED" });
    expect(cancelSpy).not.toHaveBeenCalled();
  });

  it("tài khoản đang active hoặc pending_verification: từ chối 409 INVALID_STATUS_TRANSITION", async () => {
    state.user.status = "active";
    await expect(
      handler(event({ email: "a@b.vn", password: "good-pass" }) as never)
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "INVALID_STATUS_TRANSITION",
    });
    expect(cancelSpy).not.toHaveBeenCalled();
  });

  it("tài khoản deleted nhưng purge_at là null (đã purge xong): từ chối 410 ACCOUNT_PURGED", async () => {
    state.user.status = "deleted";
    state.user.purgeAt = null;
    await expect(
      handler(event({ email: "a@b.vn", password: "good-pass" }) as never)
    ).rejects.toMatchObject({ statusCode: 410, code: "ACCOUNT_PURGED" });
    expect(cancelSpy).not.toHaveBeenCalled();
  });

  it("đúng mật khẩu: khôi phục", async () => {
    const res = await handler(
      event({ email: "a@b.vn", password: "good-pass" }) as never
    );
    expect(res.status).toBe("active");
    expect(cancelSpy).toHaveBeenCalledTimes(1);
  });
});
