import { requireValkeyUrl } from "@mindkid/config";
import { Redis } from "ioredis";
import type { MinimalRedisClient } from "./redis-secondary-storage.js";

let authRedisClient: MinimalRedisClient | undefined;

export function getAuthRedisClient(): MinimalRedisClient {
  if (!authRedisClient) {
    const client = new Redis(requireValkeyUrl(), {
      connectTimeout: 2000,
      commandTimeout: 2000,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
    });
    client.on("error", () => {
      /* fail-closed handled per operation */
    });
    const created: MinimalRedisClient = {
      get: (key) => client.get(key),
      getdel: (key) => client.getdel(key),
      set: (key, value, expiryMode, time) =>
        expiryMode === "EX" && typeof time === "number"
          ? client.set(key, value, "EX", time)
          : client.set(key, value),
      del: (...keys) => client.del(...keys),
      incr: (key) => client.incr(key),
      expire: (key, seconds) => client.expire(key, seconds),
    };
    client.on("end", () => {
      if (authRedisClient === created) {
        authRedisClient = undefined;
      }
    });
    authRedisClient = created;
    return created;
  }
  return authRedisClient;
}

export function setAuthRedisClient(client: MinimalRedisClient): void {
  authRedisClient = client;
}
