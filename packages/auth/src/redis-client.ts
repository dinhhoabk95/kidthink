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

let overrideRedisClient: MinimalRedisClient | undefined;
let registeredDoPort: AuthCoordinatorRpcPort | undefined;

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

export function registerAuthCoordinatorPort(
  port: AuthCoordinatorRpcPort | undefined
): void {
  registeredDoPort = port;
}

function resolveActiveClient(): MinimalRedisClient {
  if (overrideRedisClient) {
    return overrideRedisClient;
  }
  const activeDoPort = registeredDoPort;
  if (activeDoPort) {
    return createDurableObjectRedisClient(activeDoPort);
  }
  // BR-AUT-31: không fallback sang file/memory/DB. Cloudflare nối `AuthCoordinatorDO`;
  // dev/test nối `AuthCoordinatorEngine` chạy trên SQLite (`@mindkid/local-runtime`, D15).
  throw new Error("Auth coordinator port is not registered (BR-AUT-31).");
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
