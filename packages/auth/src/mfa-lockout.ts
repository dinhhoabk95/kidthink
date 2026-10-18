import { MfaLockedError } from "@mindkid/errors/auth";
import { isAppError } from "@mindkid/errors/base";
import { ServiceUnavailableError } from "@mindkid/errors/common";
import type { AuthNamespace, MinimalRedisClient } from "./redis-session-store";

/** UC-052 BR-013: sai mã 5 lần thì khoá 15 phút. */
export const MFA_MAX_FAILURES = 5;
export const MFA_LOCK_SECONDS = 900;

export interface MfaFailureResult {
  readonly locked: boolean;
}

/**
 * Bộ đếm sai mã xác thực hai lớp theo tài khoản, lưu ở Redis. Cửa sổ đếm neo ở
 * lần sai đầu tiên và hết sau `MFA_LOCK_SECONDS`; lần sai thứ 5 đặt khoá.
 */
export class MfaAttemptGuard {
  private readonly redis: MinimalRedisClient;

  constructor(redis: MinimalRedisClient) {
    this.redis = redis;
  }

  private failKey(namespace: AuthNamespace, accountId: number): string {
    return `auth:v1:${namespace}:mfa_fail:${accountId}`;
  }

  private lockKey(namespace: AuthNamespace, accountId: number): string {
    return `auth:v1:${namespace}:mfa_lock:${accountId}`;
  }

  async assertNotLocked(
    namespace: AuthNamespace,
    accountId: number,
    now: Date = new Date()
  ): Promise<void> {
    try {
      const raw = await this.redis.get(this.lockKey(namespace, accountId));
      const unlockAt = raw === null ? Number.NaN : Number.parseInt(raw, 10);
      if (!Number.isNaN(unlockAt) && unlockAt > now.getTime()) {
        throw new MfaLockedError({
          retry_after_s: Math.ceil((unlockAt - now.getTime()) / 1000),
        });
      }
    } catch (err) {
      if (isAppError(err)) {
        throw err;
      }
      throw new ServiceUnavailableError();
    }
  }

  async recordFailure(
    namespace: AuthNamespace,
    accountId: number,
    now: Date = new Date()
  ): Promise<MfaFailureResult> {
    try {
      const key = this.failKey(namespace, accountId);
      const count = await this.redis.incr(key);
      if (count === 1) {
        await this.redis.set(key, "1", "EX", MFA_LOCK_SECONDS);
      }
      if (count < MFA_MAX_FAILURES) {
        return { locked: false };
      }
      await this.redis.set(
        this.lockKey(namespace, accountId),
        String(now.getTime() + MFA_LOCK_SECONDS * 1000),
        "EX",
        MFA_LOCK_SECONDS
      );
      await this.redis.del(key);
      return { locked: true };
    } catch (err) {
      if (isAppError(err)) {
        throw err;
      }
      throw new ServiceUnavailableError();
    }
  }

  async reset(namespace: AuthNamespace, accountId: number): Promise<void> {
    try {
      await this.redis.del(this.failKey(namespace, accountId));
    } catch (err) {
      if (isAppError(err)) {
        throw err;
      }
      throw new ServiceUnavailableError();
    }
  }
}
