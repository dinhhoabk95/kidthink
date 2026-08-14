export * from "./client.js";
export * from "./token-bucket.js";

import { getClient } from "./client.js";

export async function getCached<T>(key: string): Promise<T | null> {
  const c = getClient();
  const val = await c.get(key);
  if (!val) {
    return null;
  }
  try {
    return JSON.parse(val) as T;
  } catch {
    return val as unknown as T;
  }
}

export async function setCached<T>(
  key: string,
  value: T,
  ttlSeconds: number
): Promise<void> {
  const c = getClient();
  const stringValue = typeof value === "string" ? value : JSON.stringify(value);
  await c.set(key, stringValue, "EX", ttlSeconds);
}
