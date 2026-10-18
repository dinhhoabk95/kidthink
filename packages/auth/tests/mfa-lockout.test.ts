import { MfaLockedError, TokenExpiredError } from "@mindkid/errors/auth";
import { describe, expect, it } from "vitest";
import {
  InMemoryRedisClient,
  MFA_LOCK_SECONDS,
  MFA_MAX_FAILURES,
  MfaAttemptGuard,
  MfaChallengeService,
} from "#src/index";

describe("UC-052 BR-013 khoá 5 lần sai / 15 phút", () => {
  it("hằng số khớp UC", () => {
    expect(MFA_MAX_FAILURES).toBe(5);
    expect(MFA_LOCK_SECONDS).toBe(900);
  });

  it("4 lần sai chưa khoá, lần thứ 5 khoá và assertNotLocked ném MfaLockedError", async () => {
    const guard = new MfaAttemptGuard(new InMemoryRedisClient());
    for (let i = 1; i <= 4; i++) {
      expect(await guard.recordFailure("user", 7)).toEqual({ locked: false });
      await guard.assertNotLocked("user", 7);
    }
    expect(await guard.recordFailure("user", 7)).toEqual({ locked: true });
    await expect(guard.assertNotLocked("user", 7)).rejects.toBeInstanceOf(
      MfaLockedError
    );
  });

  it("khoá tính theo tài khoản và namespace", async () => {
    const guard = new MfaAttemptGuard(new InMemoryRedisClient());
    for (let i = 0; i < 5; i++) {
      await guard.recordFailure("user", 1);
    }
    await expect(guard.assertNotLocked("user", 2)).resolves.toBeUndefined();
    await expect(guard.assertNotLocked("manager", 1)).resolves.toBeUndefined();
  });

  it("thành công xoá bộ đếm: 4 sai + reset + 4 sai vẫn chưa khoá", async () => {
    const guard = new MfaAttemptGuard(new InMemoryRedisClient());
    for (let i = 0; i < 4; i++) {
      await guard.recordFailure("user", 1);
    }
    await guard.reset("user", 1);
    for (let i = 0; i < 4; i++) {
      expect(await guard.recordFailure("user", 1)).toEqual({ locked: false });
    }
  });

  it("khoá hết sau 15 phút", async () => {
    const guard = new MfaAttemptGuard(new InMemoryRedisClient());
    const t0 = new Date("2026-10-14T08:00:00Z");
    for (let i = 0; i < 5; i++) {
      await guard.recordFailure("user", 1, t0);
    }
    await expect(
      guard.assertNotLocked("user", 1, new Date(t0.getTime() + 899_000))
    ).rejects.toBeInstanceOf(MfaLockedError);
    await expect(
      guard.assertNotLocked("user", 1, new Date(t0.getTime() + 901_000))
    ).resolves.toBeUndefined();
  });
});

describe("UC-052 A1 peekChallenge giữ thử thách để nhập lại mã", () => {
  it("peek không tiêu thụ; consume xong thì peek ném TokenExpiredError", async () => {
    const service = new MfaChallengeService(new InMemoryRedisClient());
    const created = await service.createChallenge({
      namespace: "user",
      accountId: 3,
      displayName: "U",
    });
    const first = await service.peekChallenge("user", created.challengeToken);
    const second = await service.peekChallenge("user", created.challengeToken);
    expect(first.accountId).toBe(3);
    expect(second.accountId).toBe(3);
    await service.consumeChallenge("user", created.challengeToken);
    await expect(
      service.peekChallenge("user", created.challengeToken)
    ).rejects.toBeInstanceOf(TokenExpiredError);
  });
});
