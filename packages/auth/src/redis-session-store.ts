import crypto from "node:crypto";
import type {
  AuthContext,
  ManagerRole,
  ManagerTokenPayload,
  UserTokenPayload,
} from "./contracts";
import { appError } from "./errors";
import type { AccountReference } from "./ports";

export type AuthNamespace = "user" | "manager";

export interface SessionData {
  readonly accountId: number;
  readonly displayName: string;
  readonly role?: ManagerRole;
  readonly deviceId: string;
  readonly createdAt: number;
  readonly expiresAt: number;
  readonly activeChildId?: number;
}

export interface RememberData {
  readonly accountId: number;
  readonly verifierHash: string;
  readonly previousVerifierHash?: string;
  readonly previousVerifierExpiresAt?: number;
  readonly deviceId: string;
  readonly createdAt: number;
  readonly absoluteExpiresAt: number;
  readonly role?: ManagerRole;
  readonly displayName: string;
}

export interface CreateSessionOptions {
  readonly namespace: AuthNamespace;
  readonly accountId: number;
  readonly displayName: string;
  readonly role?: ManagerRole;
  readonly rememberMe?: boolean;
  readonly deviceId?: string;
  readonly activeChildId?: number;
  readonly now?: Date;
}

export interface CreatedSessionOutput {
  readonly sessionId: string;
  readonly sessionToken: string;
  readonly rememberToken?: string;
  readonly expiresAt: Date;
  readonly deviceId: string;
}

export interface RestoreOptions {
  readonly namespace: AuthNamespace;
  readonly rememberToken: string;
  readonly now?: Date;
}

export interface RestoredSessionOutput {
  readonly sessionToken: string;
  readonly rememberToken: string;
  readonly expiresAt: Date;
  readonly user?: UserTokenPayload;
  readonly manager?: ManagerTokenPayload;
}

export const SESSION_TTL_SECONDS = 3600; // 1 hour absolute
export const REMEMBER_MAX_TTL_SECONDS = 365 * 24 * 3600; // 365 days absolute

export function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function generateTokenHex(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

export interface MinimalRedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ...args: unknown[]): Promise<unknown>;
  del(...keys: string[]): Promise<number>;
  sadd(key: string, ...members: string[]): Promise<number>;
  srem(key: string, ...members: string[]): Promise<number>;
  smembers(key: string): Promise<string[]>;
  incr(key: string): Promise<number>;
}

export class InMemoryRedisClient implements MinimalRedisClient {
  private readonly kv = new Map<
    string,
    { value: string; expiresAt?: number }
  >();
  private readonly sets = new Map<string, Set<string>>();

  private isExpired(key: string): boolean {
    const item = this.kv.get(key);
    if (!item) {
      return false;
    }
    if (item.expiresAt !== undefined && item.expiresAt <= Date.now()) {
      this.kv.delete(key);
      return true;
    }
    return false;
  }

  get(key: string): Promise<string | null> {
    if (this.isExpired(key)) {
      return Promise.resolve(null);
    }
    return Promise.resolve(this.kv.get(key)?.value ?? null);
  }

  set(key: string, value: string, ...args: unknown[]): Promise<unknown> {
    let ttlMs: number | undefined;
    for (let i = 0; i < args.length; i++) {
      if (args[i] === "EX" && typeof args[i + 1] === "number") {
        ttlMs = (args[i + 1] as number) * 1000;
      } else if (args[i] === "PX" && typeof args[i + 1] === "number") {
        ttlMs = args[i + 1] as number;
      }
    }
    this.kv.set(key, {
      value,
      expiresAt: ttlMs === undefined ? undefined : Date.now() + ttlMs,
    });
    return Promise.resolve("OK");
  }

  del(...keys: string[]): Promise<number> {
    let count = 0;
    for (const key of keys) {
      if (this.kv.delete(key)) {
        count++;
      }
      if (this.sets.delete(key)) {
        count++;
      }
    }
    return Promise.resolve(count);
  }

  sadd(key: string, ...members: string[]): Promise<number> {
    let set = this.sets.get(key);
    if (!set) {
      set = new Set();
      this.sets.set(key, set);
    }
    let added = 0;
    for (const m of members) {
      if (!set.has(m)) {
        set.add(m);
        added++;
      }
    }
    return Promise.resolve(added);
  }

  srem(key: string, ...members: string[]): Promise<number> {
    const set = this.sets.get(key);
    if (!set) {
      return Promise.resolve(0);
    }
    let removed = 0;
    for (const m of members) {
      if (set.delete(m)) {
        removed++;
      }
    }
    return Promise.resolve(removed);
  }

  smembers(key: string): Promise<string[]> {
    const set = this.sets.get(key);
    return Promise.resolve(set ? Array.from(set) : []);
  }

  async incr(key: string): Promise<number> {
    const val = await this.get(key);
    const num = val ? Number.parseInt(val, 10) + 1 : 1;
    await this.set(key, num.toString());
    return num;
  }
}

export class RedisSessionStore {
  private readonly redis: MinimalRedisClient;

  constructor(redis: MinimalRedisClient) {
    this.redis = redis;
  }

  private sessionKey(namespace: AuthNamespace, digest: string): string {
    return `auth:v1:${namespace}:session:${digest}`;
  }

  private rememberKey(namespace: AuthNamespace, digest: string): string {
    return `auth:v1:${namespace}:remember:${digest}`;
  }

  private devicePointerKey(namespace: AuthNamespace, deviceId: string): string {
    return `auth:v1:${namespace}:device:${deviceId}`;
  }

  private accountDevicesKey(
    namespace: AuthNamespace,
    accountId: number
  ): string {
    return `auth:v1:${namespace}:account_devices:${accountId}`;
  }

  private accountGenKey(namespace: AuthNamespace, accountId: number): string {
    return `auth:v1:${namespace}:account_gen:${accountId}`;
  }

  async createSession(
    options: CreateSessionOptions
  ): Promise<CreatedSessionOutput> {
    try {
      const now = options.now ? options.now.getTime() : Date.now();
      const expiresAtMs = now + SESSION_TTL_SECONDS * 1000;
      const deviceId = options.deviceId ?? `dev_${generateTokenHex(16)}`;

      const sessionToken = generateTokenHex(32); // 256-bit
      const sessionDigest = sha256(sessionToken);

      const sessionData: SessionData = {
        accountId: options.accountId,
        displayName: options.displayName,
        role: options.role,
        deviceId,
        createdAt: now,
        expiresAt: expiresAtMs,
        activeChildId: options.activeChildId,
      };

      await this.redis.set(
        this.sessionKey(options.namespace, sessionDigest),
        JSON.stringify(sessionData),
        "EX",
        SESSION_TTL_SECONDS
      );

      let rememberToken: string | undefined;
      let selectorDigest: string | undefined;

      if (options.rememberMe) {
        const selector = generateTokenHex(32);
        const verifier = generateTokenHex(32);
        selectorDigest = sha256(selector);
        const verifierHash = sha256(verifier);

        const absoluteExpiresAt = now + REMEMBER_MAX_TTL_SECONDS * 1000;
        const rememberData: RememberData = {
          accountId: options.accountId,
          verifierHash,
          deviceId,
          createdAt: now,
          absoluteExpiresAt,
          role: options.role,
          displayName: options.displayName,
        };

        await this.redis.set(
          this.rememberKey(options.namespace, selectorDigest),
          JSON.stringify(rememberData),
          "EX",
          REMEMBER_MAX_TTL_SECONDS
        );

        rememberToken = `${selector}:${verifier}`;
      } else {
        const existingPtr = await this.redis.get(
          this.devicePointerKey(options.namespace, deviceId)
        );
        if (existingPtr) {
          try {
            const parsed = JSON.parse(existingPtr);
            selectorDigest = parsed.selectorDigest;
          } catch {
            // ignore
          }
        }
      }

      await this.redis.sadd(
        this.accountDevicesKey(options.namespace, options.accountId),
        deviceId
      );

      await this.redis.set(
        this.devicePointerKey(options.namespace, deviceId),
        JSON.stringify({ sessionDigest, selectorDigest }),
        "EX",
        REMEMBER_MAX_TTL_SECONDS
      );

      return {
        sessionId: sessionDigest,
        sessionToken,
        rememberToken,
        expiresAt: new Date(expiresAtMs),
        deviceId,
      };
    } catch (err) {
      if (err instanceof Error && err.name === "AppError") {
        throw err;
      }
      throw appError("SERVICE_UNAVAILABLE");
    }
  }

  async resolveSession(
    namespace: AuthNamespace,
    rawToken: string,
    now?: Date
  ): Promise<AuthContext | null> {
    try {
      if (!rawToken || typeof rawToken !== "string") {
        return null;
      }
      const digest = sha256(rawToken);
      const raw = await this.redis.get(this.sessionKey(namespace, digest));
      if (!raw) {
        return null;
      }

      const data: SessionData = JSON.parse(raw);
      const currentMs = now ? now.getTime() : Date.now();
      if (currentMs >= data.expiresAt) {
        await this.redis.del(this.sessionKey(namespace, digest));
        return null;
      }

      if (namespace === "user") {
        return {
          user: {
            user_id: data.accountId,
            display_name: data.displayName,
            session_id: digest,
            active_child_db_id: data.activeChildId,
          },
        };
      }

      if (namespace === "manager") {
        return {
          manager: {
            manager_id: data.accountId,
            display_name: data.displayName,
            session_id: digest,
            role: data.role ?? "content_reviewer",
          },
        };
      }

      return null;
    } catch (err) {
      if (err instanceof Error && err.name === "AppError") {
        throw err;
      }
      throw appError("SERVICE_UNAVAILABLE");
    }
  }

  private async validateAndRotateVerifier(
    namespace: AuthNamespace,
    rememberKey: string,
    rememberData: RememberData,
    verifier: string,
    rawRememberToken: string,
    now: number
  ): Promise<string> {
    const verifierHash = sha256(verifier);
    const isCurrent = verifierHash === rememberData.verifierHash;
    const isGrace =
      !isCurrent &&
      rememberData.previousVerifierHash !== undefined &&
      verifierHash === rememberData.previousVerifierHash &&
      now < (rememberData.previousVerifierExpiresAt ?? 0);

    if (!(isCurrent || isGrace)) {
      await this.redis.del(rememberKey);
      await this.revokeAll({
        account_type: namespace,
        account_id: rememberData.accountId,
      });
      throw appError("SESSION_REVOKED");
    }

    if (!isCurrent) {
      return rawRememberToken;
    }

    const nextVerifier = generateTokenHex(32);
    const updatedRememberData: RememberData = {
      ...rememberData,
      verifierHash: sha256(nextVerifier),
      previousVerifierHash: rememberData.verifierHash,
      previousVerifierExpiresAt: now + 60_000,
    };

    const remainingTtlSeconds = Math.max(
      1,
      Math.floor((rememberData.absoluteExpiresAt - now) / 1000)
    );

    await this.redis.set(
      rememberKey,
      JSON.stringify(updatedRememberData),
      "EX",
      remainingTtlSeconds
    );

    const selector = rawRememberToken.split(":")[0];
    return `${selector}:${nextVerifier}`;
  }

  async restoreRemember(
    options: RestoreOptions
  ): Promise<RestoredSessionOutput> {
    try {
      const parts = options.rememberToken.split(":");
      if (parts.length !== 2 || !parts[0] || !parts[1]) {
        throw appError("SESSION_REVOKED");
      }

      const [selector, verifier] = parts;
      const selectorDigest = sha256(selector);
      const rememberKey = this.rememberKey(options.namespace, selectorDigest);

      const raw = await this.redis.get(rememberKey);
      if (!raw) {
        throw appError("SESSION_REVOKED");
      }

      const rememberData: RememberData = JSON.parse(raw);
      const now = options.now ? options.now.getTime() : Date.now();

      if (now >= rememberData.absoluteExpiresAt) {
        await this.redis.del(rememberKey);
        throw appError("SESSION_REVOKED");
      }

      const nextRememberToken = await this.validateAndRotateVerifier(
        options.namespace,
        rememberKey,
        rememberData,
        verifier,
        options.rememberToken,
        now
      );

      const created = await this.createSession({
        namespace: options.namespace,
        accountId: rememberData.accountId,
        displayName: rememberData.displayName,
        role: rememberData.role,
        deviceId: rememberData.deviceId,
        now: options.now,
      });

      if (options.namespace === "user") {
        return {
          sessionToken: created.sessionToken,
          rememberToken: nextRememberToken,
          expiresAt: created.expiresAt,
          user: {
            user_id: rememberData.accountId,
            display_name: rememberData.displayName,
            session_id: created.sessionId,
          },
        };
      }

      return {
        sessionToken: created.sessionToken,
        rememberToken: nextRememberToken,
        expiresAt: created.expiresAt,
        manager: {
          manager_id: rememberData.accountId,
          display_name: rememberData.displayName,
          session_id: created.sessionId,
          role: rememberData.role ?? "content_reviewer",
        },
      };
    } catch (err) {
      if (err instanceof Error && err.name === "AppError") {
        throw err;
      }
      throw appError("SERVICE_UNAVAILABLE");
    }
  }

  async revokeDevice(
    namespace: AuthNamespace,
    accountId: number,
    deviceId: string
  ): Promise<void> {
    try {
      const devPtrKey = this.devicePointerKey(namespace, deviceId);
      const rawPtr = await this.redis.get(devPtrKey);
      if (rawPtr) {
        const { sessionDigest, selectorDigest } = JSON.parse(rawPtr);
        if (sessionDigest) {
          await this.redis.del(this.sessionKey(namespace, sessionDigest));
        }
        if (selectorDigest) {
          await this.redis.del(this.rememberKey(namespace, selectorDigest));
        }
        await this.redis.del(devPtrKey);
      }
      await this.redis.srem(
        this.accountDevicesKey(namespace, accountId),
        deviceId
      );
    } catch (err) {
      if (err instanceof Error && err.name === "AppError") {
        throw err;
      }
      throw appError("SERVICE_UNAVAILABLE");
    }
  }

  async revokeAll(account: AccountReference): Promise<void> {
    try {
      const namespace = account.account_type as AuthNamespace;
      const deviceIds = await this.redis.smembers(
        this.accountDevicesKey(namespace, account.account_id)
      );
      for (const deviceId of deviceIds) {
        await this.revokeDevice(namespace, account.account_id, deviceId);
      }
      await this.redis.del(
        this.accountDevicesKey(namespace, account.account_id)
      );
      await this.redis.incr(this.accountGenKey(namespace, account.account_id));
    } catch (err) {
      if (err instanceof Error && err.name === "AppError") {
        throw err;
      }
      throw appError("SERVICE_UNAVAILABLE");
    }
  }
}
