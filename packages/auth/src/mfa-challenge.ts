import type { ManagerRole } from "./contracts";
import { appError } from "./errors";
import {
  type AuthNamespace,
  generateTokenHex,
  type MinimalRedisClient,
  sha256,
} from "./redis-session-store";

export interface MfaChallengePayload {
  readonly accountId: number;
  readonly displayName: string;
  readonly role?: ManagerRole;
  readonly rememberMe?: boolean;
  readonly ipAddress?: string;
  readonly createdAt: number;
}

export interface CreateMfaChallengeInput {
  readonly namespace: AuthNamespace;
  readonly accountId: number;
  readonly displayName: string;
  readonly role?: ManagerRole;
  readonly rememberMe?: boolean;
  readonly ipAddress?: string;
  readonly now?: Date;
}

export interface CreatedMfaChallengeOutput {
  readonly challengeToken: string;
  readonly expiresAt: Date;
}

export const MFA_CHALLENGE_TTL_SECONDS = 300; // 5 minutes

export class MfaChallengeService {
  private readonly redis: MinimalRedisClient;

  constructor(redis: MinimalRedisClient) {
    this.redis = redis;
  }

  private challengeKey(namespace: AuthNamespace, digest: string): string {
    return `auth:v1:${namespace}:mfa_challenge:${digest}`;
  }

  async createChallenge(
    input: CreateMfaChallengeInput
  ): Promise<CreatedMfaChallengeOutput> {
    try {
      const challengeToken = generateTokenHex(32); // 256-bit
      const digest = sha256(challengeToken);
      const nowMs = input.now ? input.now.getTime() : Date.now();
      const expiresAtMs = nowMs + MFA_CHALLENGE_TTL_SECONDS * 1000;

      const payload: MfaChallengePayload = {
        accountId: input.accountId,
        displayName: input.displayName,
        role: input.role,
        rememberMe: input.rememberMe,
        ipAddress: input.ipAddress,
        createdAt: nowMs,
      };

      await this.redis.set(
        this.challengeKey(input.namespace, digest),
        JSON.stringify(payload),
        "EX",
        MFA_CHALLENGE_TTL_SECONDS
      );

      return {
        challengeToken,
        expiresAt: new Date(expiresAtMs),
      };
    } catch (err) {
      if (err instanceof Error && err.name === "AppError") {
        throw err;
      }
      throw appError("SERVICE_UNAVAILABLE");
    }
  }

  async consumeChallenge(
    namespace: AuthNamespace,
    challengeToken: string
  ): Promise<MfaChallengePayload> {
    try {
      if (!challengeToken || typeof challengeToken !== "string") {
        throw appError("TOKEN_EXPIRED");
      }

      const digest = sha256(challengeToken);
      const key = this.challengeKey(namespace, digest);
      const raw = await this.redis.get(key);

      if (!raw) {
        throw appError("TOKEN_EXPIRED");
      }

      // Atomic one-time consume: delete immediately!
      await this.redis.del(key);

      const payload: MfaChallengePayload = JSON.parse(raw);
      if (Date.now() - payload.createdAt >= MFA_CHALLENGE_TTL_SECONDS * 1000) {
        throw appError("TOKEN_EXPIRED");
      }

      return payload;
    } catch (err) {
      if (err instanceof Error && err.name === "AppError") {
        throw err;
      }
      throw appError("SERVICE_UNAVAILABLE");
    }
  }
}
