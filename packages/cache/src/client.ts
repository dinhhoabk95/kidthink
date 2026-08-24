import { requireEnv } from "@mindkid/config";
import { Redis } from "ioredis";

let client: Redis | undefined;

export function getClient(): Redis {
  if (!client) {
    client = new Redis(requireEnv("VALKEY_URL"), {
      connectTimeout: 2000,
      commandTimeout: 2000,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
    });
    client.on("error", () => {
      /* noop */
    });
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
    });
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
