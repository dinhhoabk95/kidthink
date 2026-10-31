import { requireFirstEnv } from "@mindkid/config";

export const EXTENSION_REGEX = /\.[a-zA-Z0-9]+$/;
export const TRAILING_SLASHES_REGEX = /\/+$/;
const LEADING_SLASHES_REGEX = /^\/+/;

function hasControlCharacter(str: string): boolean {
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if ((code >= 0 && code <= 31) || code === 127) {
      return true;
    }
  }
  return false;
}

// In-memory store for local testing/dev when S3 is not configured (capped to prevent OOM)
export const MAX_IN_MEMORY_STORE_ENTRIES = 200;

export const inMemoryPrivateStore = new Map<
  string,
  { body: Buffer | Uint8Array; contentType: string; createdAt: Date }
>();

export const inMemoryPublicStore = new Map<
  string,
  { body: Buffer | Uint8Array; contentType: string; createdAt: Date }
>();

export function sanitizeRelativeStoragePath(rawPath: string): string {
  const trimmed = rawPath.replace(LEADING_SLASHES_REGEX, "");
  if (
    trimmed.includes("..") ||
    trimmed.includes("\\") ||
    hasControlCharacter(trimmed)
  ) {
    throw new Error("BR-IMG-05: Unsafe path traversal characters in key");
  }
  return trimmed;
}

export const assertSafeStorageKey = sanitizeRelativeStoragePath;

export function setBoundedStoreEntry(
  store: Map<
    string,
    { body: Buffer | Uint8Array; contentType: string; createdAt: Date }
  >,
  key: string,
  entry: { body: Buffer | Uint8Array; contentType: string; createdAt: Date }
): void {
  if (!store.has(key) && store.size >= MAX_IN_MEMORY_STORE_ENTRIES) {
    const oldestKey = store.keys().next().value;
    if (oldestKey !== undefined) {
      store.delete(oldestKey);
    }
  }
  store.set(key, entry);
}

/**
 * Key used to sign private asset URLs (BR-ENV-03).
 */
export function assetSigningSecret(): string {
  return requireFirstEnv(
    ["STORAGE_SIGNING_SECRET"],
    "Set STORAGE_SIGNING_SECRET in the env file of every process that serves assets."
  );
}

/** Public base address for asset URLs; falls back only to another contract variable. */
export function assetBaseUrl(): string {
  return requireFirstEnv(["STORAGE_BASE_URL", "SITE_URL"]);
}
