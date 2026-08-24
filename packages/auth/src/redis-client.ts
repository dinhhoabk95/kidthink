import { requireEnv } from "@mindkid/config";
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
    const client = new Redis(requireEnv("VALKEY_URL"), {
      connectTimeout: 2000,
      commandTimeout: 2000,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
    });
    client.on("error", () => {
      /* fail-closed handled per operation */
    });
    authRedisClient = client;
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
