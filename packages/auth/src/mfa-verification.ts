import { MfaInvalidCodeError, MfaLockedError } from "@mindkid/errors/auth";
import { type MfaChallengePayload, MfaChallengeService } from "./mfa-challenge";
import { MFA_LOCK_SECONDS, MfaAttemptGuard } from "./mfa-lockout";
import type { AuthNamespace, MinimalRedisClient } from "./redis-session-store";

export interface CompleteMfaChallengeInput {
  readonly redis: MinimalRedisClient;
  readonly namespace: AuthNamespace;
  readonly challengeToken: string;
  /** Trả true nếu mã đúng; lỗi hệ thống (giải mã thất bại) phải ném, không trả false. */
  readonly verify: (payload: MfaChallengePayload) => Promise<boolean>;
  readonly now?: Date;
}

/**
 * Thử thách xác thực hai lớp với khoá sai mã (UC-052 A1, A2, BR-013).
 * Sai mã không tiêu thụ thử thách để nhập lại; sai lần thứ 5 khoá tài khoản
 * 15 phút và huỷ thử thách; đúng mã mới tiêu thụ thử thách và xoá bộ đếm.
 */
export async function completeMfaChallenge(
  input: CompleteMfaChallengeInput
): Promise<MfaChallengePayload> {
  const challenges = new MfaChallengeService(input.redis);
  const guard = new MfaAttemptGuard(input.redis);
  const { namespace, challengeToken } = input;

  const payload = await challenges.peekChallenge(namespace, challengeToken);
  await guard.assertNotLocked(namespace, payload.accountId, input.now);

  if (!(await input.verify(payload))) {
    const { locked } = await guard.recordFailure(
      namespace,
      payload.accountId,
      input.now
    );
    if (locked) {
      await challenges.consumeChallenge(namespace, challengeToken);
      throw new MfaLockedError({ retry_after_s: MFA_LOCK_SECONDS });
    }
    throw new MfaInvalidCodeError();
  }

  await challenges.consumeChallenge(namespace, challengeToken);
  await guard.reset(namespace, payload.accountId);
  return payload;
}
