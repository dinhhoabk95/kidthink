import { type AppError, isAppError } from "@mindkid/errors/base";
import { ServiceUnavailableError } from "@mindkid/errors/common";
import type { SecondaryStorage } from "better-auth";
import { APIError, isAPIError } from "better-auth/api";

type BetterAuthStatusName =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "UNPROCESSABLE_ENTITY"
  | "PRECONDITION_REQUIRED"
  | "TOO_MANY_REQUESTS"
  | "INTERNAL_SERVER_ERROR"
  | "SERVICE_UNAVAILABLE";

function mapHttpStatusToBetterAuth(status: number): BetterAuthStatusName {
  switch (status) {
    case 400:
      return "BAD_REQUEST";
    case 401:
      return "UNAUTHORIZED";
    case 403:
      return "FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    case 409:
      return "CONFLICT";
    case 422:
      return "UNPROCESSABLE_ENTITY";
    case 428:
      return "PRECONDITION_REQUIRED";
    case 429:
      return "TOO_MANY_REQUESTS";
    case 503:
      return "SERVICE_UNAVAILABLE";
    default:
      return "INTERNAL_SERVER_ERROR";
  }
}

export function appErrorToBetterAuthError(err: AppError): APIError {
  const statusName = mapHttpStatusToBetterAuth(err.status);
  const payload = err.toResponse();
  return new APIError(statusName, {
    code: payload.code,
    message: payload.message,
    ...(payload.details === undefined ? {} : { details: payload.details }),
  });
}

export function rethrowAsBetterAuthError(
  err: Error | object | string | null
): never {
  if (isAPIError(err)) {
    throw err;
  }
  if (isAppError(err)) {
    throw appErrorToBetterAuthError(err);
  }
  throw err;
}

export async function runBetterAuthCallback<T>(
  fn: () => Promise<T>
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    return rethrowAsBetterAuthError(err as Error);
  }
}

function normalizeSecondaryValue(
  raw: string | object | number | boolean | null | undefined
): string | null {
  if (raw === null || raw === undefined) {
    return null;
  }
  return typeof raw === "string" ? raw : JSON.stringify(raw);
}

export function wrapSecondaryStorageForBetterAuth(
  storage: SecondaryStorage
): SecondaryStorage {
  const rethrowStorageFailure = (
    err: Error | object | string | null
  ): never => {
    if (isAPIError(err)) {
      throw err;
    }
    if (isAppError(err)) {
      throw appErrorToBetterAuthError(err);
    }
    throw appErrorToBetterAuthError(new ServiceUnavailableError());
  };

  return {
    async get(key: string): Promise<string | null> {
      try {
        const raw = (await storage.get(key)) as
          | string
          | object
          | number
          | boolean
          | null
          | undefined;
        return normalizeSecondaryValue(raw);
      } catch (err) {
        return rethrowStorageFailure(err as Error);
      }
    },
    async set(key: string, value: string, ttl?: number): Promise<void> {
      try {
        await storage.set(key, value, ttl);
      } catch (err) {
        rethrowStorageFailure(err as Error);
      }
    },
    async delete(key: string): Promise<void> {
      try {
        await storage.delete(key);
      } catch (err) {
        rethrowStorageFailure(err as Error);
      }
    },
    async getAndDelete(key: string): Promise<string | null> {
      try {
        if (typeof storage.getAndDelete === "function") {
          const raw = (await storage.getAndDelete(key)) as
            | string
            | object
            | number
            | boolean
            | null
            | undefined;
          return normalizeSecondaryValue(raw);
        }
        const raw = (await storage.get(key)) as
          | string
          | object
          | number
          | boolean
          | null
          | undefined;
        const normalized = normalizeSecondaryValue(raw);
        if (normalized !== null) {
          await storage.delete(key);
        }
        return normalized;
      } catch (err) {
        return rethrowStorageFailure(err as Error);
      }
    },
    async increment(key: string, ttl: number): Promise<number> {
      try {
        return await storage.increment(key, ttl);
      } catch (err) {
        return rethrowStorageFailure(err as Error);
      }
    },
  };
}

interface TtlEntry<V> {
  readonly value: V;
  readonly expiresAtMs: number;
}

export class BoundedTtlMap<V> {
  private readonly entries = new Map<string, TtlEntry<V>>();
  private readonly ttlMs: number;
  private readonly maxEntries: number;

  constructor(ttlMs: number, maxEntries = 2048) {
    this.ttlMs = ttlMs;
    this.maxEntries = maxEntries;
  }

  private prune(nowMs: number): void {
    for (const [key, entry] of this.entries) {
      if (nowMs >= entry.expiresAtMs) {
        this.entries.delete(key);
      }
    }
    while (this.entries.size > this.maxEntries) {
      const oldestKey = this.entries.keys().next().value;
      if (oldestKey === undefined) {
        break;
      }
      this.entries.delete(oldestKey);
    }
  }

  set(key: string, value: V, nowMs = Date.now()): void {
    this.prune(nowMs);
    this.entries.delete(key);
    this.entries.set(key, { value, expiresAtMs: nowMs + this.ttlMs });
  }

  consume(key: string, nowMs = Date.now()): V | undefined {
    const entry = this.entries.get(key);
    if (!entry) {
      return undefined;
    }
    this.entries.delete(key);
    if (nowMs >= entry.expiresAtMs) {
      return undefined;
    }
    return entry.value;
  }
}

const MAX_AGE_ATTR_PATTERN = /;\s*Max-Age=\d+/gi;

export function alignSessionCookieMaxAge(
  headers: Headers | undefined,
  cookiePrefix: string,
  ttlSeconds: number
): void {
  if (!headers || ttlSeconds <= 0) {
    return;
  }
  const plainPrefix = `${cookiePrefix}.session_token=`;
  const securePrefix = `__Secure-${cookiePrefix}.session_token=`;
  const setCookies =
    typeof headers.getSetCookie === "function" ? headers.getSetCookie() : [];
  if (setCookies.length === 0) {
    return;
  }

  let changed = false;
  const updated = setCookies.map((entry) => {
    if (
      !(entry.startsWith(plainPrefix) || entry.startsWith(securePrefix)) ||
      entry.includes("Max-Age=0")
    ) {
      return entry;
    }
    changed = true;
    const stripped = entry.replace(MAX_AGE_ATTR_PATTERN, "");
    return `${stripped}; Max-Age=${ttlSeconds}`;
  });

  if (!changed) {
    return;
  }
  headers.delete("set-cookie");
  for (const cookieLine of updated) {
    headers.append("set-cookie", cookieLine);
  }
}
