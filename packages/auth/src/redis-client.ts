import { Redis } from "ioredis";
import {
  type BrowserSessionService,
  DefaultBrowserSessionService,
} from "./browser-session";
import {
  InMemoryRedisClient,
  type MinimalRedisClient,
} from "./redis-session-store";

let authRedisClient: MinimalRedisClient | undefined;
let browserSessionService: BrowserSessionService | undefined;

export function getAuthRedisClient(): MinimalRedisClient {
  if (!authRedisClient) {
    const url = process.env.VALKEY_URL;
    if (url) {
      const client = new Redis(url, {
        connectTimeout: 2000,
        commandTimeout: 2000,
        maxRetriesPerRequest: 1,
        retryStrategy: () => null,
      });
      client.on("error", () => {
        /* fail-closed handled per operation */
      });
      authRedisClient = client;
    } else {
      authRedisClient = new InMemoryRedisClient();
    }
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
