import { requireValkeyUrl } from "@mindkid/config";
import { Redis } from "ioredis";

let client: Redis | undefined;

export function getClient(): Redis {
  if (!client) {
    const instance = new Redis(requireValkeyUrl(), {
      connectTimeout: 2000,
      commandTimeout: 2000,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
    });
    instance.on("error", () => {
      /* noop */
    });
    instance.on("end", () => {
      if (client === instance) {
        client = undefined;
      }
    });
    client = instance;
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
