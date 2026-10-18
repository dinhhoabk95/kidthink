import {
  MfaInvalidCodeError,
  MfaLockedError,
  TokenExpiredError,
} from "@mindkid/errors/auth";
import { describe, expect, it } from "vitest";
import {
  completeMfaChallenge,
  InMemoryRedisClient,
  MfaChallengeService,
} from "#src/index";

async function setup(): Promise<{
  redis: InMemoryRedisClient;
  token: string;
}> {
  const redis = new InMemoryRedisClient();
  const created = await new MfaChallengeService(redis).createChallenge({
    namespace: "user",
    accountId: 9,
    displayName: "U",
  });
  return { redis, token: created.challengeToken };
}

describe("UC-052 A1/A2: sai mã giữ thử thách, 5 lần sai khoá 15 phút", () => {
  it("sai mã rồi nhập lại đúng vẫn qua, không cần đăng nhập lại", async () => {
    const { redis, token } = await setup();
    const call = (ok: boolean) =>
      completeMfaChallenge({
        redis,
        namespace: "user",
        challengeToken: token,
        verify: () => Promise.resolve(ok),
      });
    await expect(call(false)).rejects.toBeInstanceOf(MfaInvalidCodeError);
    await expect(call(false)).rejects.toBeInstanceOf(MfaInvalidCodeError);
    const payload = await call(true);
    expect(payload.accountId).toBe(9);
    // thử thách chỉ dùng một lần
    await expect(call(true)).rejects.toBeInstanceOf(TokenExpiredError);
  });

  it("lần sai thứ 5 ném MfaLockedError, mã đúng sau đó vẫn bị từ chối bằng thử thách mới", async () => {
    const { redis, token } = await setup();
    let verifyCalls = 0;
    const attempt = (ok: boolean) =>
      completeMfaChallenge({
        redis,
        namespace: "user",
        challengeToken: token,
        verify: () => {
          verifyCalls += 1;
          return Promise.resolve(ok);
        },
      });
    for (let i = 0; i < 4; i++) {
      await expect(attempt(false)).rejects.toBeInstanceOf(MfaInvalidCodeError);
    }
    await expect(attempt(false)).rejects.toBeInstanceOf(MfaLockedError);

    const fresh = await new MfaChallengeService(redis).createChallenge({
      namespace: "user",
      accountId: 9,
      displayName: "U",
    });
    const before = verifyCalls;
    await expect(
      completeMfaChallenge({
        redis,
        namespace: "user",
        challengeToken: fresh.challengeToken,
        verify: () => {
          verifyCalls += 1;
          return Promise.resolve(true);
        },
      })
    ).rejects.toBeInstanceOf(MfaLockedError);
    expect(verifyCalls).toBe(before);
  });

  it("lỗi hệ thống từ verify không bị tính là sai mã", async () => {
    const { redis, token } = await setup();
    for (let i = 0; i < 6; i++) {
      await expect(
        completeMfaChallenge({
          redis,
          namespace: "user",
          challengeToken: token,
          verify: () => Promise.reject(new Error("decrypt failed")),
        })
      ).rejects.toThrow("decrypt failed");
    }
    await expect(
      completeMfaChallenge({
        redis,
        namespace: "user",
        challengeToken: token,
        verify: () => Promise.resolve(true),
      })
    ).resolves.toBeDefined();
  });
});
