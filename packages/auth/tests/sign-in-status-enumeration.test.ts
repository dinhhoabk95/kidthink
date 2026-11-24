import { describe, expect, it } from "vitest";
import { hashPassword, InMemoryRedisClient } from "#src/index";
import { handleManagerSignInBefore } from "#src/manager-better-auth";
import { handleUserSignInBefore } from "#src/user-auth-helpers";

const GOOD_PASSWORD = "MatKhauDung-12345";
const BAD_PASSWORD = "MatKhauSai-12345";

async function rejectionCode(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
  } catch (error) {
    const body = (error as { body?: { code?: string } }).body;
    return body?.code ?? "NO_CODE";
  }
  return "RESOLVED";
}

describe("BR-LGN-13 — sign-in không lộ trạng thái tài khoản khi chưa chứng minh mật khẩu", () => {
  it("user suspended/deleted: sai mật khẩu → INVALID_CREDENTIALS, đúng mật khẩu → trạng thái", async () => {
    const passwordHash = await hashPassword(GOOD_PASSWORD);
    for (const [status, expected] of [
      ["suspended", "ACCOUNT_SUSPENDED"],
      ["deleted", "ACCOUNT_DELETED"],
    ] as const) {
      const callbacks = {
        getUserStatusByEmail: () =>
          Promise.resolve({
            id: 1,
            status,
            purgeAt: null,
            hasPassword: true,
            passwordHash,
          }),
      };
      const redis = new InMemoryRedisClient();
      const wrong = handleUserSignInBefore(
        { email: "a@b.com", password: BAD_PASSWORD },
        "127.0.0.1",
        callbacks,
        redis
      );
      expect(await rejectionCode(wrong), status).toBe("INVALID_CREDENTIALS");
      const right = handleUserSignInBefore(
        { email: "a@b.com", password: GOOD_PASSWORD },
        "127.0.0.1",
        callbacks,
        redis
      );
      expect(await rejectionCode(right), status).toBe(expected);
    }
  });

  it("manager inactive: sai mật khẩu → INVALID_CREDENTIALS, đúng mật khẩu → ACCOUNT_SUSPENDED", async () => {
    const passwordHash = await hashPassword(GOOD_PASSWORD);
    const callbacks = {
      getManagerStatusByEmail: () =>
        Promise.resolve({
          id: 1,
          isActive: false,
          role: "super_admin",
          passwordHash,
        }),
    };
    const redis = new InMemoryRedisClient();
    const wrong = handleManagerSignInBefore(
      { email: "m@b.com", password: BAD_PASSWORD },
      "127.0.0.1",
      "ua",
      callbacks,
      redis
    );
    expect(await rejectionCode(wrong)).toBe("INVALID_CREDENTIALS");
    const right = handleManagerSignInBefore(
      { email: "m@b.com", password: GOOD_PASSWORD },
      "127.0.0.1",
      "ua",
      callbacks,
      redis
    );
    expect(await rejectionCode(right)).toBe("ACCOUNT_SUSPENDED");
  });
});
