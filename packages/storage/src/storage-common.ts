import { requireFirstEnv } from "@mindkid/config";

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

/** Trần số mục của driver in-memory (chống OOM ở dev/test). */
export const MAX_IN_MEMORY_STORE_ENTRIES = 200;

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
