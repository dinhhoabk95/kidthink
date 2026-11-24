import { deleteCached, getCached, setCached } from "@mindkid/cache";

export const GUEST_SEO_EPOCH_KEY = "guest:seo:epoch:v1";
const LEGACY_HOME_CACHE_KEY = "guest:home:data:v1";
const EPOCH_CACHE_TTL_SECONDS = 30 * 86_400;
const EPOCH_MEMORY_TTL_MS = 2000;
const MAX_CURSOR_CACHE_LENGTH = 120;

export const GUEST_SEO_TTL = {
  SHORT: 300,
  MEDIUM: 600,
  LONG: 3600,
} as const;

export type QueryPrimitive = string | number | boolean | null | undefined;
export type QueryValueInput =
  | QueryPrimitive
  | readonly string[]
  | string[]
  | readonly QueryPrimitive[];
export type QueryRecordInput = Readonly<Record<string, QueryValueInput>>;

export interface GuestSeoCacheOptions<T> {
  readonly namespace: string;
  readonly key: string;
  readonly ttlSeconds: number;
  readonly bypass?: boolean;
  readonly fetcher: () => Promise<T>;
}

interface EpochMemorySnapshot {
  readonly value: number;
  readonly expiresAtMs: number;
}

const isVitestRuntime =
  process.env.NODE_ENV === "test" || Boolean(process.env.VITEST);

let cacheEnabledInTests = false;
let epochMemoryCache: EpochMemorySnapshot | null = null;
let lastEpochValue = 0;

export function setGuestSeoCacheEnabledInTests(enabled: boolean): void {
  cacheEnabledInTests = enabled;
}

export function resetGuestSeoEpochMemoryCache(): void {
  epochMemoryCache = null;
}

function normalizeQueryEntryValue(raw: QueryValueInput): string {
  if (raw === null || raw === undefined) {
    return "";
  }
  if (Array.isArray(raw)) {
    return raw
      .map((item) =>
        item === null || item === undefined ? "" : String(item).trim()
      )
      .filter(Boolean)
      .join(",");
  }
  return String(raw).trim();
}

export function normalizeQueryRecord(
  query: QueryRecordInput
): QueryRecordInput {
  const normalized: Record<string, QueryValueInput> = {};
  for (const key of Object.keys(query)) {
    const raw = query[key];
    if (raw === null || raw === undefined) {
      continue;
    }
    if (typeof raw === "string") {
      const trimmed = raw.trim();
      if (trimmed.length > 0) {
        normalized[key] = trimmed;
      }
      continue;
    }
    if (Array.isArray(raw)) {
      const trimmedItems = raw
        .map((item) =>
          item === null || item === undefined ? "" : String(item).trim()
        )
        .filter((item) => item.length > 0);
      if (trimmedItems.length > 0) {
        normalized[key] = trimmedItems;
      }
      continue;
    }
    normalized[key] = raw;
  }
  return normalized;
}

export function buildCanonicalQueryCacheKey(query: QueryRecordInput): string {
  const keys = Object.keys(query).sort();
  const pairs: string[] = [];

  for (const key of keys) {
    const normalized = normalizeQueryEntryValue(query[key]);
    if (normalized.length > 0) {
      pairs.push(
        `${encodeURIComponent(key)}=${encodeURIComponent(normalized)}`
      );
    }
  }

  return pairs.length > 0 ? pairs.join("&") : "default";
}

export function hasUncacheableSearchQuery(query: QueryRecordInput): boolean {
  const keyword = normalizeQueryEntryValue(query.q);
  if (keyword.length > 0) {
    return true;
  }
  const cursor = normalizeQueryEntryValue(query.cursor);
  return cursor.length > MAX_CURSOR_CACHE_LENGTH;
}

export async function getGuestSeoEpoch(): Promise<number> {
  const now = Date.now();
  if (epochMemoryCache && epochMemoryCache.expiresAtMs > now) {
    return epochMemoryCache.value;
  }

  try {
    const stored = await getCached<number>(GUEST_SEO_EPOCH_KEY);
    const resolved =
      typeof stored === "number" && Number.isFinite(stored) ? stored : 0;
    epochMemoryCache = {
      value: resolved,
      expiresAtMs: now + EPOCH_MEMORY_TTL_MS,
    };
    return resolved;
  } catch {
    return 0;
  }
}

export async function invalidateGuestSeoCache(): Promise<number> {
  const now = Date.now();
  const nextEpoch = now > lastEpochValue ? now : lastEpochValue + 1;
  lastEpochValue = nextEpoch;
  epochMemoryCache = {
    value: nextEpoch,
    expiresAtMs: now + EPOCH_MEMORY_TTL_MS,
  };

  try {
    await Promise.all([
      setCached<number>(
        GUEST_SEO_EPOCH_KEY,
        nextEpoch,
        EPOCH_CACHE_TTL_SECONDS
      ),
      deleteCached(LEGACY_HOME_CACHE_KEY),
    ]);
  } catch {
    // Không chặn luồng chính nếu Valkey tạm gián đoạn
  }

  return nextEpoch;
}

export async function withGuestSeoCache<T>(
  options: GuestSeoCacheOptions<T>
): Promise<T> {
  const shouldBypass =
    Boolean(options.bypass) || (isVitestRuntime && !cacheEnabledInTests);
  if (shouldBypass) {
    return options.fetcher();
  }

  const epoch = await getGuestSeoEpoch();
  const fullKey = `guest:seo:v1:e${epoch}:${options.namespace}:${options.key}`;

  try {
    const cached = await getCached<T>(fullKey);
    if (cached !== null) {
      return cached;
    }
  } catch {
    // Valkey lỗi đọc -> fallback thẳng về DB
  }

  const fresh = await options.fetcher();

  try {
    await setCached<T>(fullKey, fresh, options.ttlSeconds);
  } catch {
    // Valkey lỗi ghi -> không chặn kết quả trả về
  }

  return fresh;
}
