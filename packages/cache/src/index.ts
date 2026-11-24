export * from "./client.js";
export * from "./coordinator-engine.js";
export * from "./token-bucket.js";

import { getCachePort } from "./client.js";

export const USER_ENTITLEMENTS_CACHE_PREFIX = "user:entitlements:";
const DEFAULT_USER_ENTITLEMENTS_TTL_SECONDS = 300;

function parseStringArrayJson(raw: string | null): string[] | null {
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as
      | string[]
      | string
      | number
      | boolean
      | object
      | null;
    if (!Array.isArray(parsed)) {
      return null;
    }
    const result: string[] = [];
    for (const item of parsed) {
      if (typeof item !== "string") {
        return null;
      }
      result.push(item);
    }
    return result;
  } catch {
    return null;
  }
}

/**
 * Cache được phép trượt (`rate-limiting.md`: cache miss không phải lỗi), nên thiếu port
 * thì đọc trả `null`, ghi/xoá bỏ qua — đúng hành vi trên Cloudflare trước D15. Khác
 * `checkRateLimit` và auth store: hai nơi đó đóng-khi-lỗi (`BR-RTL-12`, `BR-AUT-31`).
 */
export async function getCached<T>(key: string): Promise<T | null> {
  const val = (await getCachePort()?.get(key)) ?? null;
  if (!val) {
    return null;
  }
  try {
    return JSON.parse(val) as T;
  } catch {
    return val as T & string;
  }
}

export async function setCached<T>(
  key: string,
  value: T,
  ttlSeconds: number
): Promise<void> {
  const stringValue = typeof value === "string" ? value : JSON.stringify(value);
  await getCachePort()?.set(key, stringValue, ttlSeconds);
}

export async function deleteCached(key: string): Promise<void> {
  await getCachePort()?.del(key);
}

export async function getUserEntitlementsCache(
  userId: number
): Promise<string[] | null> {
  const key = `${USER_ENTITLEMENTS_CACHE_PREFIX}${userId}`;
  return parseStringArrayJson((await getCachePort()?.get(key)) ?? null);
}

export async function setUserEntitlementsCache(
  userId: number,
  keys: readonly string[],
  ttlSeconds = DEFAULT_USER_ENTITLEMENTS_TTL_SECONDS
): Promise<void> {
  const cacheKey = `${USER_ENTITLEMENTS_CACHE_PREFIX}${userId}`;
  await getCachePort()?.set(cacheKey, JSON.stringify(keys), ttlSeconds);
}

export async function invalidateUserEntitlementsCache(
  userId: number
): Promise<void> {
  await getCachePort()?.del(`${USER_ENTITLEMENTS_CACHE_PREFIX}${userId}`);
}

export async function flushKvCachePrefixes(
  prefixes: readonly string[]
): Promise<number> {
  const port = getCachePort();
  if (prefixes.length === 0 || !port?.deleteByPrefix) {
    return 0;
  }
  let deleted = 0;
  for (const prefix of prefixes) {
    deleted += await port.deleteByPrefix(prefix);
  }
  return deleted;
}
