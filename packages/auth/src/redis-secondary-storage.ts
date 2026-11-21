import { createHash, randomBytes } from "node:crypto";
import { isAppError } from "@mindkid/errors/base";
import { ServiceUnavailableError } from "@mindkid/errors/common";
import type { SecondaryStorage } from "better-auth";
import type { AuthInstanceNamespace } from "./hmac-secret.js";

export interface MinimalRedisClient {
  get(key: string): Promise<string | null>;
  getdel?(key: string): Promise<string | null>;
  set(
    key: string,
    value: string,
    expiryMode?: "EX",
    time?: number
  ): Promise<string | null>;
  del(...keys: string[]): Promise<number>;
  incr(key: string): Promise<number>;
  expire?(key: string, seconds: number): Promise<number>;
}

interface StoredEntry {
  value: string;
  expiresAtMs: number | null;
}

export class InMemoryRedisClient implements MinimalRedisClient {
  private readonly store = new Map<string, StoredEntry>();
  private shouldFail = false;

  setFailMode(fail: boolean): void {
    this.shouldFail = fail;
  }

  private assertHealthy(): void {
    if (this.shouldFail) {
      throw new Error("Simulated Redis connection outage");
    }
  }

  private readValid(key: string): StoredEntry | null {
    const entry = this.store.get(key);
    if (!entry) {
      return null;
    }
    if (entry.expiresAtMs !== null && Date.now() >= entry.expiresAtMs) {
      this.store.delete(key);
      return null;
    }
    return entry;
  }

  get(key: string): Promise<string | null> {
    this.assertHealthy();
    return Promise.resolve(this.readValid(key)?.value ?? null);
  }

  getdel(key: string): Promise<string | null> {
    this.assertHealthy();
    const existing = this.readValid(key);
    if (!existing) {
      return Promise.resolve(null);
    }
    this.store.delete(key);
    return Promise.resolve(existing.value);
  }

  set(
    key: string,
    value: string,
    expiryMode?: "EX",
    time?: number
  ): Promise<string | null> {
    this.assertHealthy();
    const expiresAtMs =
      expiryMode === "EX" && typeof time === "number" && time > 0
        ? Date.now() + time * 1000
        : null;
    this.store.set(key, { value, expiresAtMs });
    return Promise.resolve("OK");
  }

  del(...keys: string[]): Promise<number> {
    this.assertHealthy();
    let count = 0;
    for (const key of keys) {
      if (this.store.delete(key)) {
        count++;
      }
    }
    return Promise.resolve(count);
  }

  incr(key: string): Promise<number> {
    this.assertHealthy();
    const existing = this.readValid(key);
    const current = existing ? Number.parseInt(existing.value, 10) || 0 : 0;
    const next = current + 1;
    this.store.set(key, {
      value: String(next),
      expiresAtMs: existing?.expiresAtMs ?? null,
    });
    return Promise.resolve(next);
  }

  expire(key: string, seconds: number): Promise<number> {
    this.assertHealthy();
    const existing = this.readValid(key);
    if (!existing) {
      return Promise.resolve(0);
    }
    this.store.set(key, {
      value: existing.value,
      expiresAtMs: Date.now() + seconds * 1000,
    });
    return Promise.resolve(1);
  }
}

export function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export function generateTokenHex(byteLength = 16): string {
  return randomBytes(byteLength).toString("hex");
}

export function buildAuthSentinelKey(
  namespace: AuthInstanceNamespace,
  nonce: string
): string {
  return `ba:v1:${namespace}:sentinel:${nonce}`;
}

function rethrowFailClosed(err: Error | object | string | null): never {
  if (isAppError(err)) {
    throw err;
  }
  throw new ServiceUnavailableError();
}

export function createRedisSecondaryStorage(
  redis: MinimalRedisClient,
  namespace: AuthInstanceNamespace
): SecondaryStorage {
  const prefix = `ba:v1:${namespace}:`;

  return {
    async get(key: string): Promise<string | null> {
      try {
        return await redis.get(`${prefix}${key}`);
      } catch (err) {
        rethrowFailClosed(err as Error);
      }
    },

    async set(key: string, value: string, ttl?: number): Promise<void> {
      try {
        if (typeof ttl === "number" && ttl > 0) {
          await redis.set(`${prefix}${key}`, value, "EX", Math.ceil(ttl));
          return;
        }
        await redis.set(`${prefix}${key}`, value);
      } catch (err) {
        rethrowFailClosed(err as Error);
      }
    },

    async delete(key: string): Promise<void> {
      try {
        await redis.del(`${prefix}${key}`);
      } catch (err) {
        rethrowFailClosed(err as Error);
      }
    },

    async getAndDelete(key: string): Promise<string | null> {
      const fullKey = `${prefix}${key}`;
      try {
        if (typeof redis.getdel === "function") {
          return await redis.getdel(fullKey);
        }
        const current = await redis.get(fullKey);
        if (current === null) {
          return null;
        }
        const removed = await redis.del(fullKey);
        return removed > 0 ? current : null;
      } catch (err) {
        return rethrowFailClosed(err as Error);
      }
    },

    async increment(key: string, ttl: number): Promise<number> {
      const fullKey = `${prefix}${key}`;
      try {
        const nextCount = await redis.incr(fullKey);
        if (nextCount === 1 && ttl > 0) {
          const seconds = Math.ceil(ttl);
          if (typeof redis.expire === "function") {
            await redis.expire(fullKey, seconds);
          } else {
            await redis.set(fullKey, String(nextCount), "EX", seconds);
          }
        }
        return nextCount;
      } catch (err) {
        return rethrowFailClosed(err as Error);
      }
    },
  };
}

export const SOCIAL_SIGNUP_CONSENT_COOKIE = "tm_ba_signup_consent";
export const SOCIAL_SIGNUP_CONSENT_TTL_SECONDS = 300;

export interface SocialSignupConsentPayload {
  readonly termsRequirementAt: string | null;
  readonly privacyRequirementAt: string | null;
  readonly ipAddress: string;
  readonly userAgent: string;
}

interface StoredSocialSignupConsentRecord extends SocialSignupConsentPayload {
  readonly createdAt: string;
}

function consentTicketKey(rawToken: string): string {
  return `ba:v1:user:social_consent:${sha256Hex(rawToken)}`;
}

export async function createSocialSignupConsentTicket(
  redis: MinimalRedisClient,
  payload: SocialSignupConsentPayload
): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const record: StoredSocialSignupConsentRecord = {
    ...payload,
    createdAt: new Date().toISOString(),
  };
  try {
    await redis.set(
      consentTicketKey(token),
      JSON.stringify(record),
      "EX",
      SOCIAL_SIGNUP_CONSENT_TTL_SECONDS
    );
    return token;
  } catch (err) {
    return rethrowFailClosed(err as Error);
  }
}

export async function consumeSocialSignupConsentTicket(
  redis: MinimalRedisClient,
  token: string | null | undefined
): Promise<SocialSignupConsentPayload | null> {
  if (!token || typeof token !== "string") {
    return null;
  }
  const key = consentTicketKey(token);
  try {
    const raw = await redis.get(key);
    if (!raw) {
      return null;
    }
    await redis.del(key);
    const parsed = JSON.parse(raw) as StoredSocialSignupConsentRecord;
    return {
      termsRequirementAt: parsed.termsRequirementAt,
      privacyRequirementAt: parsed.privacyRequirementAt,
      ipAddress: parsed.ipAddress,
      userAgent: parsed.userAgent,
    };
  } catch (err) {
    return rethrowFailClosed(err as Error);
  }
}
