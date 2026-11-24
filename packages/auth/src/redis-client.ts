import { AsyncLocalStorage } from "node:async_hooks";
import {
  getAuthStoreDriverKind,
  isCloudflareRuntime,
  requireValkeyUrl,
} from "@mindkid/config";
import type { MinimalRedisClient } from "./redis-secondary-storage.js";

export interface AuthCoordinatorRpcPort {
  kvGet(key: string): Promise<string | null>;
  kvGetDel(key: string): Promise<string | null>;
  kvSet(
    key: string,
    value: string,
    ttlSeconds?: number
  ): Promise<string | null>;
  kvDel(keys: readonly string[]): Promise<number>;
  kvIncr(key: string): Promise<number>;
  kvExpire(key: string, seconds: number): Promise<number>;
  readonly kvDeleteByPrefix?: (prefix: string) => Promise<number>;
}

const doPortAls = new AsyncLocalStorage<AuthCoordinatorRpcPort | undefined>();
let overrideRedisClient: MinimalRedisClient | undefined;
let registeredDoPort: AuthCoordinatorRpcPort | undefined;
let lazyIoRedisClient: MinimalRedisClient | undefined;

const REDIS_GLOB_CHARS_PATTERN = /[*?[\]\\]/g;

function escapeRedisGlob(prefix: string): string {
  return prefix.replace(REDIS_GLOB_CHARS_PATTERN, (ch) => `\\${ch}`);
}

export function createDurableObjectRedisClient(
  port: AuthCoordinatorRpcPort
): MinimalRedisClient {
  return {
    get: (key) => port.kvGet(key),
    getdel: (key) => port.kvGetDel(key),
    set: (key, value, expiryMode, time) =>
      port.kvSet(
        key,
        value,
        expiryMode === "EX" && typeof time === "number" ? time : undefined
      ),
    del: (...keys) => port.kvDel(keys),
    incr: (key) => port.kvIncr(key),
    expire: (key, seconds) => port.kvExpire(key, seconds),
    deleteByPrefix: (prefix) =>
      port.kvDeleteByPrefix
        ? port.kvDeleteByPrefix(prefix)
        : Promise.resolve(0),
  };
}

export function enterAuthCoordinatorPort(
  port: AuthCoordinatorRpcPort | undefined
): void {
  doPortAls.enterWith(port);
}

export function registerAuthCoordinatorPort(
  port: AuthCoordinatorRpcPort | undefined
): void {
  registeredDoPort = port;
}

function createLazyIoRedisClient(): MinimalRedisClient {
  type IoRedisInstance = import("ioredis").Redis;
  let innerPromise: Promise<IoRedisInstance> | undefined;

  function ensureRedis(): Promise<IoRedisInstance> {
    if (!innerPromise) {
      innerPromise = import("ioredis").then(({ Redis }) => {
        const instance = new Redis(requireValkeyUrl(), {
          connectTimeout: 2000,
          commandTimeout: 2000,
          maxRetriesPerRequest: 1,
          retryStrategy: () => null,
        });
        instance.on("error", () => {
          /* fail-closed handled per operation */
        });
        instance.on("end", () => {
          innerPromise = undefined;
          lazyIoRedisClient = undefined;
        });
        return instance;
      });
    }
    return innerPromise;
  }

  return {
    get: async (key) => (await ensureRedis()).get(key),
    getdel: async (key) => (await ensureRedis()).getdel(key),
    set: async (key, value, expiryMode, time) => {
      const c = await ensureRedis();
      return expiryMode === "EX" && typeof time === "number"
        ? c.set(key, value, "EX", time)
        : c.set(key, value);
    },
    del: async (...keys) => (await ensureRedis()).del(...keys),
    incr: async (key) => (await ensureRedis()).incr(key),
    expire: async (key, seconds) => (await ensureRedis()).expire(key, seconds),
    deleteByPrefix: async (prefix) => {
      const c = await ensureRedis();
      const pattern = `${escapeRedisGlob(prefix)}*`;
      let cursor = "0";
      let deleted = 0;
      do {
        const [nextCursor, keys] = await c.scan(
          cursor,
          "MATCH",
          pattern,
          "COUNT",
          100
        );
        cursor = nextCursor;
        if (keys.length > 0) {
          deleted += await c.del(...keys);
        }
      } while (cursor !== "0");
      return deleted;
    },
  };
}

function resolveActiveClient(): MinimalRedisClient {
  if (overrideRedisClient) {
    return overrideRedisClient;
  }
  const activeDoPort = doPortAls.getStore() ?? registeredDoPort;
  if (activeDoPort) {
    return createDurableObjectRedisClient(activeDoPort);
  }
  if (isCloudflareRuntime() || getAuthStoreDriverKind() === "do") {
    throw new Error(
      "Auth Coordinator Durable Object port is not available in Cloudflare runtime."
    );
  }
  if (!lazyIoRedisClient) {
    lazyIoRedisClient = createLazyIoRedisClient();
  }
  return lazyIoRedisClient;
}

const dynamicAuthRedisClient: MinimalRedisClient = {
  get: (key) => resolveActiveClient().get(key),
  getdel: (key) => {
    const client = resolveActiveClient();
    if (typeof client.getdel === "function") {
      return client.getdel(key);
    }
    return client.get(key).then(async (value) => {
      if (value === null) {
        return null;
      }
      const removed = await client.del(key);
      return removed > 0 ? value : null;
    });
  },
  set: (key, value, expiryMode, time) =>
    resolveActiveClient().set(key, value, expiryMode, time),
  del: (...keys) => resolveActiveClient().del(...keys),
  incr: (key) => resolveActiveClient().incr(key),
  expire: (key, seconds) => {
    const client = resolveActiveClient();
    return typeof client.expire === "function"
      ? client.expire(key, seconds)
      : Promise.resolve(0);
  },
  deleteByPrefix: (prefix) => {
    const client = resolveActiveClient();
    return typeof client.deleteByPrefix === "function"
      ? client.deleteByPrefix(prefix)
      : Promise.resolve(0);
  },
};

export function getAuthRedisClient(): MinimalRedisClient {
  return dynamicAuthRedisClient;
}

export function setAuthRedisClient(
  client: MinimalRedisClient | undefined
): void {
  overrideRedisClient = client;
}
