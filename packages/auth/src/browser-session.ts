import type { AuthContext, ManagerRole } from "./contracts";
import type { AccountReference } from "./ports";
import {
  type AuthNamespace,
  type CreatedSessionOutput,
  type MinimalRedisClient,
  RedisSessionStore,
  type RestoredSessionOutput,
} from "./redis-session-store";

export interface CreateBrowserSessionInput {
  readonly namespace: AuthNamespace;
  readonly accountId: number;
  readonly displayName: string;
  readonly role?: ManagerRole;
  readonly rememberMe?: boolean;
  readonly deviceId?: string;
  readonly ipAddress?: string;
  readonly activeChildId?: number;
  readonly now?: Date;
}

export interface RestoreRememberSessionInput {
  readonly namespace: AuthNamespace;
  readonly rememberToken: string;
  readonly ipAddress?: string;
  readonly now?: Date;
}

export interface RevokeDeviceInput {
  readonly namespace: AuthNamespace;
  readonly accountId: number;
  readonly deviceId: string;
}

export interface BrowserSessionService {
  create(input: CreateBrowserSessionInput): Promise<CreatedSessionOutput>;
  resolve(
    namespace: AuthNamespace,
    rawToken: string
  ): Promise<AuthContext | null>;
  restore(input: RestoreRememberSessionInput): Promise<RestoredSessionOutput>;
  revokeDevice(input: RevokeDeviceInput): Promise<void>;
  revokeAll(account: AccountReference): Promise<void>;
}

export class DefaultBrowserSessionService implements BrowserSessionService {
  private readonly store: RedisSessionStore;

  constructor(redis: MinimalRedisClient) {
    this.store = new RedisSessionStore(redis);
  }

  create(input: CreateBrowserSessionInput): Promise<CreatedSessionOutput> {
    return this.store.createSession({
      namespace: input.namespace,
      accountId: input.accountId,
      displayName: input.displayName,
      role: input.role,
      rememberMe: input.rememberMe,
      deviceId: input.deviceId,
      activeChildId: input.activeChildId,
      now: input.now,
    });
  }

  resolve(
    namespace: AuthNamespace,
    rawToken: string
  ): Promise<AuthContext | null> {
    return this.store.resolveSession(namespace, rawToken);
  }

  restore(input: RestoreRememberSessionInput): Promise<RestoredSessionOutput> {
    return this.store.restoreRemember({
      namespace: input.namespace,
      rememberToken: input.rememberToken,
      now: input.now,
    });
  }

  revokeDevice(input: RevokeDeviceInput): Promise<void> {
    return this.store.revokeDevice(
      input.namespace,
      input.accountId,
      input.deviceId
    );
  }

  revokeAll(account: AccountReference): Promise<void> {
    return this.store.revokeAll(account);
  }
}
