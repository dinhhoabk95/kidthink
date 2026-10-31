import { requireValkeyUrl } from "@mindkid/config";
import { Redis } from "ioredis";

let client: Redis | undefined;
const disconnectListeners = new Set<() => void>();

export function onClientDisconnect(listener: () => void): void {
  disconnectListeners.add(listener);
}

function notifyDisconnectListeners(): void {
  for (const listener of disconnectListeners) {
    listener();
  }
}

const isTestEnv =
  process.env.NODE_ENV === "test" || Boolean(process.env.VITEST);

function resolveRetryStrategy(times: number): number | null {
  if (isTestEnv) {
    return null;
  }
  return times > 10 ? null : Math.min(times * 100, 2000);
}

export function getClient(): Redis {
  if (!client) {
    const instance = new Redis(requireValkeyUrl(), {
      connectTimeout: 2000,
      commandTimeout: 2000,
      maxRetriesPerRequest: 1,
      retryStrategy: resolveRetryStrategy,
    });
    instance.on("error", () => {
      /* noop */
    });
    instance.on("end", () => {
      if (client === instance) {
        client = undefined;
      }
      notifyDisconnectListeners();
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

  let timer: NodeJS.Timeout | undefined;
  try {
    const res = await Promise.race([
      c.ping(),
      new Promise<string>((_, reject) => {
        timer = setTimeout(() => reject(new Error("Timeout")), 2000);
      }),
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
  } finally {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
  }
}

export function disconnect(): void {
  if (client) {
    client.disconnect();
    client = undefined;
    notifyDisconnectListeners();
  }
}
