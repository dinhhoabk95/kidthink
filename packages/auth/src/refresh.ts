import { createHash, randomBytes } from "node:crypto";
import type { ManagerRole } from "./contracts";
import { appError } from "./errors";
import {
  createAdminManagerToken,
  KIDTHINK_ADMIN_AUDIENCE,
} from "./manager-session";
import type { SessionStorePort } from "./ports";
import { createWebUserToken } from "./user-session";

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateOpaqueRefreshToken(): string {
  return randomBytes(32).toString("hex");
}

export interface RefreshServiceOptions {
  readonly jwtSecret: string;
  readonly jwtAudience: string;
  readonly refreshTtlSeconds?: number;
}

export interface RotateTokenInput {
  readonly sessionId: string;
  readonly currentRefreshToken: string;
  readonly displayName: string;
  readonly activeChildId?: number;
  readonly role?: ManagerRole;
}

export interface RotateTokenResult {
  readonly accessToken: string;
  readonly nextRefreshToken: string;
}

export class RefreshService {
  private readonly store: SessionStorePort;
  private readonly options: RefreshServiceOptions;

  constructor(store: SessionStorePort, options: RefreshServiceOptions) {
    this.store = store;
    this.options = options;
  }

  async rotateRefreshToken(
    input: RotateTokenInput
  ): Promise<RotateTokenResult> {
    const currentHash = hashRefreshToken(input.currentRefreshToken);
    const nextRefreshToken = generateOpaqueRefreshToken();
    const nextHash = hashRefreshToken(nextRefreshToken);

    const ttlSeconds =
      this.options.refreshTtlSeconds ??
      (this.options.jwtAudience === KIDTHINK_ADMIN_AUDIENCE
        ? 24 * 60 * 60 // 24 hours for manager
        : 7 * 24 * 60 * 60); // 7 days for user

    const nextExpiresAt = new Date(Date.now() + ttlSeconds * 1000);

    const result = await this.store.rotate({
      session_id: input.sessionId,
      current_refresh_token_hash: currentHash,
      next_refresh_token_hash: nextHash,
      next_expires_at: nextExpiresAt,
      used_at: new Date(),
    });

    if (result.outcome === "reused") {
      await this.store.revokeAll(result.account);
      throw appError("SESSION_REVOKED");
    }

    if (result.outcome === "not_found") {
      throw appError("SESSION_REVOKED");
    }

    const session = result.session;
    let accessToken: string;

    if (session.account_type === "manager") {
      if (!input.role) {
        throw appError("UNAUTHENTICATED");
      }
      accessToken = await createAdminManagerToken({
        payload: {
          manager_id: session.account_id,
          display_name: input.displayName,
          session_id: session.session_id,
          refresh_token_version: session.refresh_token_version,
          role: input.role,
        },
        secret: this.options.jwtSecret,
        audience: this.options.jwtAudience,
      });
    } else {
      accessToken = await createWebUserToken({
        payload: {
          user_id: session.account_id,
          display_name: input.displayName,
          session_id: session.session_id,
          refresh_token_version: session.refresh_token_version,
          ...(input.activeChildId === undefined
            ? {}
            : { active_child_id: input.activeChildId }),
        },
        secret: this.options.jwtSecret,
        audience: this.options.jwtAudience,
      });
    }

    return {
      accessToken,
      nextRefreshToken,
    };
  }

  async revokeSession(sessionId: string): Promise<void> {
    await this.store.revokeSession(sessionId);
  }

  async logoutAll(
    accountType: "user" | "manager",
    accountId: number
  ): Promise<void> {
    await this.store.revokeAll({
      account_type: accountType,
      account_id: accountId,
    });
  }
}
