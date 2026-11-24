import { RateLimitedError } from "@mindkid/errors/common";
import { describe, expect, it } from "vitest";
import { InMemoryRedisClient, MfaAttemptGuard } from "#src/index";
import { handleTwoFactorVerifyBeforeHook } from "#src/user-auth-helpers";

const TF_COOKIE = "mindkid-user.two_factor";
const SIGNED_IDENTIFIER = "tf-identifier";

type HookCtx = Parameters<typeof handleTwoFactorVerifyBeforeHook>[0]["ctx"];

function pendingCtx(accountId: number): HookCtx {
  return {
    headers: new Headers({ cookie: `${TF_COOKIE}=raw-cookie` }),
    getSignedCookie: () => Promise.resolve(SIGNED_IDENTIFIER),
    context: {
      secret: "test-secret",
      createAuthCookie: () => ({ name: TF_COOKIE, attributes: {} }),
      internalAdapter: {
        findVerificationValue: (id: string) =>
          Promise.resolve(
            id === SIGNED_IDENTIFIER ? { value: String(accountId) } : null
          ),
      },
    },
  } as never;
}

function runHook(
  ctx: HookCtx,
  enforceAccountRateLimit: (accountId: number) => Promise<void>
): Promise<void> {
  const redis = new InMemoryRedisClient();
  return handleTwoFactorVerifyBeforeHook({
    ctx,
    path: "/two-factor/verify-totp",
    namespace: "user",
    redis,
    mfaGuard: new MfaAttemptGuard(redis),
    pendingAuthAccountByCtx: new WeakMap(),
    pendingMfaActivationByCtx: new WeakMap(),
    enforceAccountRateLimit,
  });
}

describe("BR-RTL-01 — verify 2FA có trục account ngoài trục IP", () => {
  it("challenge 2FA đang chờ: gọi trục account với account id suy từ challenge", async () => {
    const seen: number[] = [];
    await runHook(pendingCtx(42), (id) => {
      seen.push(id);
      return Promise.resolve();
    });
    expect(seen).toEqual([42]);
  });

  it("ca âm: vượt hạn mức account thì hook ném RateLimitedError, không cho verify", async () => {
    await expect(
      runHook(pendingCtx(42), () =>
        Promise.reject(new RateLimitedError({ retry_after_s: 60 }))
      )
    ).rejects.toBeInstanceOf(RateLimitedError);
  });

  it("challenge hỏng (không ra account) thì không đếm vào account nào", async () => {
    const seen: number[] = [];
    const ctx = pendingCtx(0);
    await runHook(ctx, (id) => {
      seen.push(id);
      return Promise.resolve();
    });
    expect(seen).toEqual([]);
  });
});
