import { IncomingMessage, ServerResponse } from "node:http";
import { Socket } from "node:net";
import type { UserTokenPayload } from "@mindkid/auth";
import { USER_STATUS, type UserStatus } from "@mindkid/db";
import { createEvent, type H3Event } from "h3";
import { beforeEach, describe, expect, it, vi } from "vitest";

interface FakeUser {
  id: number;
  status: UserStatus;
  purgeAt: Date | null;
  passwordHash: string | null;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
}

interface FakeTwoFactor {
  secret: string;
  verified: boolean;
}

const state: { user: FakeUser; twoFactor: FakeTwoFactor | null } = {
  user: {
    id: 5,
    status: USER_STATUS.DELETED,
    purgeAt: new Date(Date.now() + 86_400_000),
    passwordHash: "hash",
    emailVerified: true,
    twoFactorEnabled: false,
  },
  twoFactor: null,
};

const cancelSpy = vi.hoisted(() =>
  vi.fn(() =>
    Promise.resolve({
      status: USER_STATUS.ACTIVE,
    })
  )
);

vi.mock("@mindkid/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@mindkid/auth")>();
  return {
    ...actual,
    verifyPassword: (plain: string) => Promise.resolve(plain === "good-pass"),
  };
});

vi.mock("#server/utils/repositories", () => ({
  useOwnerRepositories: () => ({
    users: {
      findForAuthByEmail: () => Promise.resolve(state.user),
      findForAuthById: () => Promise.resolve(state.user),
      findByEmail: () => Promise.resolve(state.user),
      findById: () => Promise.resolve(state.user),
      cancelDeletion: cancelSpy,
    },
    authAccounts: {
      findUserCredentialAccount: () => Promise.resolve(null),
      findUserCredentialAccountForAuth: () => Promise.resolve(null),
      findUserTwoFactorForAuth: () => Promise.resolve(state.twoFactor),
    },
    entitlements: {
      listActiveForUser: () => Promise.resolve([]),
    },
  }),
}));

import handler from "#server/api/users/account/delete/cancel.post";

function buildCancelEvent(
  body: Record<string, string>,
  sessionUser?: UserTokenPayload
): H3Event {
  const socket = new Socket();
  Object.defineProperty(socket, "remoteAddress", { value: "127.0.0.1" });
  const req = new IncomingMessage(socket);
  req.method = "POST";
  req.url = "/api/users/account/delete/cancel";
  req.headers = {
    host: "localhost:3000",
    origin: "http://localhost:3000",
    "sec-fetch-site": "same-origin",
  };
  const res = new ServerResponse(req);
  const event = createEvent(req, res);
  event.context.body = body;
  if (sessionUser) {
    event.context.user = sessionUser;
  }
  return event;
}

const sessionUser: UserTokenPayload = {
  user_id: 5,
  display_name: "Parent Test",
  session_id: "sess_5",
};

describe("UC-027 BR-003: huỷ xoá phải xác minh và chống status oracle", () => {
  beforeEach(() => {
    cancelSpy.mockClear();
    state.user.status = USER_STATUS.DELETED;
    state.user.purgeAt = new Date(Date.now() + 86_400_000);
    state.user.passwordHash = "hash";
    state.user.emailVerified = true;
    state.user.twoFactorEnabled = false;
    state.twoFactor = null;
  });

  it("unauthenticated thiếu mật khẩu: từ chối 401 INVALID_CREDENTIALS, không khôi phục", async () => {
    await expect(
      handler(buildCancelEvent({ email: "a@b.vn" }))
    ).rejects.toMatchObject({
      statusCode: 401,
      code: "INVALID_CREDENTIALS",
    });
    expect(cancelSpy).not.toHaveBeenCalled();
  });

  it("unauthenticated sai mật khẩu: từ chối 401 INVALID_CREDENTIALS", async () => {
    await expect(
      handler(buildCancelEvent({ email: "a@b.vn", password: "nope" }))
    ).rejects.toMatchObject({
      statusCode: 401,
      code: "INVALID_CREDENTIALS",
    });
    expect(cancelSpy).not.toHaveBeenCalled();
  });

  it("unauthenticated tài khoản không có mật khẩu: không được bỏ qua xác thực", async () => {
    state.user.passwordHash = null;
    await expect(
      handler(buildCancelEvent({ email: "a@b.vn", password: "good-pass" }))
    ).rejects.toMatchObject({
      statusCode: 401,
      code: "INVALID_CREDENTIALS",
    });
    expect(cancelSpy).not.toHaveBeenCalled();
  });

  it("unauthenticated tài khoản bật 2FA nhưng thiếu TOTP: từ chối 401 INVALID_CREDENTIALS", async () => {
    state.user.twoFactorEnabled = true;
    state.twoFactor = {
      secret: "JBSWY3DPEHPK3PXP",
      verified: true,
    };
    await expect(
      handler(buildCancelEvent({ email: "a@b.vn", password: "good-pass" }))
    ).rejects.toMatchObject({
      statusCode: 401,
      code: "INVALID_CREDENTIALS",
    });
    expect(cancelSpy).not.toHaveBeenCalled();
  });

  it("unauthenticated tài khoản suspended: trả 401 INVALID_CREDENTIALS (chống oracle trạng thái)", async () => {
    state.user.status = USER_STATUS.SUSPENDED;
    await expect(
      handler(buildCancelEvent({ email: "a@b.vn", password: "good-pass" }))
    ).rejects.toMatchObject({
      statusCode: 401,
      code: "INVALID_CREDENTIALS",
    });
    expect(cancelSpy).not.toHaveBeenCalled();
  });

  it("unauthenticated tài khoản active: trả 401 INVALID_CREDENTIALS (chống oracle trạng thái)", async () => {
    state.user.status = USER_STATUS.ACTIVE;
    await expect(
      handler(buildCancelEvent({ email: "a@b.vn", password: "good-pass" }))
    ).rejects.toMatchObject({
      statusCode: 401,
      code: "INVALID_CREDENTIALS",
    });
    expect(cancelSpy).not.toHaveBeenCalled();
  });

  it("unauthenticated tài khoản deleted nhưng purge_at là null: trả 401 INVALID_CREDENTIALS (chống oracle trạng thái)", async () => {
    state.user.status = USER_STATUS.DELETED;
    state.user.purgeAt = null;
    await expect(
      handler(buildCancelEvent({ email: "a@b.vn", password: "good-pass" }))
    ).rejects.toMatchObject({
      statusCode: 401,
      code: "INVALID_CREDENTIALS",
    });
    expect(cancelSpy).not.toHaveBeenCalled();
  });

  it("unauthenticated đúng mật khẩu: khôi phục", async () => {
    const res = await handler(
      buildCancelEvent({ email: "a@b.vn", password: "good-pass" })
    );
    expect(res.status).toBe("active");
    expect(cancelSpy).toHaveBeenCalledTimes(1);
  });

  it("authenticated tài khoản đang suspended: từ chối 403 ACCOUNT_SUSPENDED, không được tự mở khoá", async () => {
    state.user.status = USER_STATUS.SUSPENDED;
    await expect(
      handler(buildCancelEvent({}, sessionUser))
    ).rejects.toMatchObject({
      statusCode: 403,
      code: "ACCOUNT_SUSPENDED",
    });
    expect(cancelSpy).not.toHaveBeenCalled();
  });

  it("authenticated tài khoản đang active hoặc pending_verification: từ chối 409 INVALID_STATUS_TRANSITION", async () => {
    state.user.status = USER_STATUS.ACTIVE;
    await expect(
      handler(buildCancelEvent({}, sessionUser))
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "INVALID_STATUS_TRANSITION",
    });
    expect(cancelSpy).not.toHaveBeenCalled();
  });

  it("authenticated tài khoản deleted nhưng purge_at là null: từ chối 410 ACCOUNT_PURGED", async () => {
    state.user.status = USER_STATUS.DELETED;
    state.user.purgeAt = null;
    await expect(
      handler(buildCancelEvent({}, sessionUser))
    ).rejects.toMatchObject({
      statusCode: 410,
      code: "ACCOUNT_PURGED",
    });
    expect(cancelSpy).not.toHaveBeenCalled();
  });

  it("authenticated tài khoản pending deletion: khôi phục thành công", async () => {
    const res = await handler(buildCancelEvent({}, sessionUser));
    expect(res.status).toBe("active");
    expect(cancelSpy).toHaveBeenCalledTimes(1);
  });
});
