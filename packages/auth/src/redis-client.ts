import { requireValkeyUrl } from "@mindkid/config";
import { Redis } from "ioredis";
import {
  type BrowserSessionService,
  DefaultBrowserSessionService,
} from "./browser-session";
import type { MinimalRedisClient } from "./redis-session-store";

let authRedisClient: MinimalRedisClient | undefined;
let browserSessionService: BrowserSessionService | undefined;

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
    const created: MinimalRedisClient = client;
    client.on("end", () => {
      if (authRedisClient === created) {
        authRedisClient = undefined;
        browserSessionService = undefined;
      }
    });
    authRedisClient = created;
    return created;
  }
  return authRedisClient;
}

export function setAuthRedisClient(client: MinimalRedisClient): void {
  authRedisClient = client;
  browserSessionService = undefined;
}

export function getBrowserSessionService(): BrowserSessionService {
  if (!browserSessionService) {
    browserSessionService = new DefaultBrowserSessionService(
      getAuthRedisClient()
    );
  }
  return browserSessionService;
}
