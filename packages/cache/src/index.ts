export * from "./client.js";
export * from "./token-bucket.js";

import { isCloudflareRuntime } from "@mindkid/config";
import { getClient, getCloudflareCachePort } from "./client.js";

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

export async function getCached<T>(key: string): Promise<T | null> {
  let val: string | null;
  if (isCloudflareRuntime()) {
    const port = getCloudflareCachePort();
    if (!port) {
      return null;
    }
    val = await port.get(key);
  } else {
    val = await getClient().get(key);
  }

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
  if (isCloudflareRuntime()) {
    const port = getCloudflareCachePort();
    if (port) {
      await port.set(key, stringValue, ttlSeconds);
    }
    return;
  }
  await getClient().set(key, stringValue, "EX", ttlSeconds);
}

export async function deleteCached(key: string): Promise<void> {
  if (isCloudflareRuntime()) {
    const port = getCloudflareCachePort();
    if (port) {
      await port.del(key);
    }
    return;
  }
  await getClient().del(key);
}

export async function getUserEntitlementsCache(
  userId: number
): Promise<string[] | null> {
  const key = `${USER_ENTITLEMENTS_CACHE_PREFIX}${userId}`;
  if (isCloudflareRuntime()) {
    const port = getCloudflareCachePort();
    if (!port) {
      return null;
    }
    return parseStringArrayJson(await port.get(key));
  }
  return parseStringArrayJson(await getClient().get(key));
}

export async function setUserEntitlementsCache(
  userId: number,
  keys: readonly string[],
  ttlSeconds = DEFAULT_USER_ENTITLEMENTS_TTL_SECONDS
): Promise<void> {
  const cacheKey = `${USER_ENTITLEMENTS_CACHE_PREFIX}${userId}`;
  const serialized = JSON.stringify(keys);
  if (isCloudflareRuntime()) {
    const port = getCloudflareCachePort();
    if (port) {
      await port.set(cacheKey, serialized, ttlSeconds);
    }
    return;
  }
  await getClient().set(cacheKey, serialized, "EX", ttlSeconds);
}

export async function invalidateUserEntitlementsCache(
  userId: number
): Promise<void> {
  const cacheKey = `${USER_ENTITLEMENTS_CACHE_PREFIX}${userId}`;
  if (isCloudflareRuntime()) {
    const port = getCloudflareCachePort();
    if (port) {
      await port.del(cacheKey);
    }
    return;
  }
  await getClient().del(cacheKey);
}

export async function flushKvCachePrefixes(
  prefixes: readonly string[]
): Promise<number> {
  if (prefixes.length === 0) {
    return 0;
  }
  if (isCloudflareRuntime()) {
    const port = getCloudflareCachePort();
    if (!port?.deleteByPrefix) {
      return 0;
    }
    let deleted = 0;
    for (const prefix of prefixes) {
      deleted += await port.deleteByPrefix(prefix);
    }
    return deleted;
  }

  const client = getClient();
  let deleted = 0;
  for (const prefix of prefixes) {
    let cursor = "0";
    do {
      const [nextCursor, keys] = await client.scan(
        cursor,
        "MATCH",
        `${prefix}*`,
        "COUNT",
        100
      );
      cursor = nextCursor;
      if (keys.length > 0) {
        deleted += await client.del(...keys);
      }
    } while (cursor !== "0");
  }
  return deleted;
}
