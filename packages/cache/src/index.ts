import { Redis } from "ioredis";

export * from "./token-bucket.js";

let client: Redis | undefined;

function getClient() {
  if (!client) {
    client = new Redis(process.env.VALKEY_URL || "redis://localhost:6380", {
      connectTimeout: 2000,
      commandTimeout: 2000,
      maxRetriesPerRequest: 1, // Fail fast for ping
      retryStrategy: (_times) => {
        // Don't retry if we are just checking ping and want it to fail fast
        return null;
      },
    });
    client.on("error", () => {
      /* noop */
    }); // Prevent unhandled error events
  }
  return client;
}

export async function ping(urlOverride?: string): Promise<boolean> {
  const c = urlOverride
    ? new Redis(urlOverride, {
        connectTimeout: 2000,
        commandTimeout: 2000,
        maxRetriesPerRequest: 0,
        retryStrategy: () => null,
      })
    : getClient();

  if (urlOverride) {
    c.on("error", () => {
      /* noop */
    }); // Prevent unhandled error events
  }

  try {
    const res = await Promise.race([
      c.ping(),
      new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 2000)
      ),
    ]);

    if (urlOverride) {
      c.disconnect();
    }
    return res === "PONG";
  } catch (_error) {
    if (urlOverride) {
      c.disconnect();
    }
    return false;
  }
}

export function disconnect(): void {
  if (client) {
    client.disconnect();
    client = undefined;
  }
}

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
