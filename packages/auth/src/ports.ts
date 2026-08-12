import type { ManagerRole } from "./contracts";

export type AccountType = "user" | "manager";
export type AuthMethod = "password" | "social";
export type ReauthMethod = AuthMethod | "totp";

export interface AccountReference {
  readonly account_type: AccountType;
  readonly account_id: number;
}

interface BaseSessionRecord extends AccountReference {
  readonly session_id: string;
  readonly refresh_token_hash: string;
  readonly refresh_token_version: number;
  readonly auth_method: AuthMethod;
  readonly reauth_at: Date | null;
  readonly expires_at: Date;
}

export interface UserSessionRecord extends BaseSessionRecord {
  readonly account_type: "user";
  readonly display_name: string;
}

export interface ManagerSessionRecord extends BaseSessionRecord {
  readonly account_type: "manager";
  readonly display_name: string;
  readonly role: ManagerRole;
}

export type SessionRecord = UserSessionRecord | ManagerSessionRecord;

export interface RotateSessionInput {
  readonly session_id: string;
  readonly account_type: AccountType;
  readonly refresh_token_version: number;
  readonly current_refresh_token_hash: string;
  readonly next_refresh_token_hash: string;
  readonly next_expires_at: Date;
  readonly used_at: Date;
}

export type RotateSessionResult =
  | { readonly outcome: "rotated"; readonly session: SessionRecord }
  | { readonly outcome: "reused" | "revoked" }
  | { readonly outcome: "not_found" };

export interface SessionStorePort {
  createSession?(input: {
    account_type: AccountType;
    account_id: number;
    refresh_token_hash: string;
    device_label?: string;
    ip_address?: string;
    auth_method: AuthMethod;
    expires_at: Date;
  }): Promise<{ session_id: string }>;
  updateSessionTokenHash?(
    sessionId: string,
    refreshTokenHash: string
  ): Promise<void>;
  rotate(input: RotateSessionInput): Promise<RotateSessionResult>;
  revokeSession(sessionId: string, account: AccountReference): Promise<void>;
  /** Atomically increments refresh_token_version and deletes all sessions. */
  revokeAll(account: AccountReference): Promise<void>;
  getReauthState(
    sessionId: string,
    account: AccountReference
  ): Promise<{ readonly reauth_at: Date | null } | null>;
  markReauthenticated(
    sessionId: string,
    account: AccountReference,
    at: Date
  ): Promise<void>;
}

export interface ReauthMethodAvailabilityPort {
  getAvailableMethods(
    account: AccountReference
  ): Promise<readonly ReauthMethod[]>;
}

export type RateLimitAxis = "ip" | "account";

export interface RateLimitDecision {
  readonly allowed: boolean;
  readonly retry_after_seconds?: number;
}

export interface RateLimitPort {
  consume(axis: RateLimitAxis, key: string): Promise<RateLimitDecision>;
}

export type AuthAuditEvent =
  | {
      readonly type: "session_created" | "session_revoked";
      readonly account: AccountReference;
      readonly session_id: string;
    }
  | {
      readonly type: "manager_role_denied";
      readonly manager_id: number;
      readonly actual_role: ManagerRole;
      readonly required_role: ManagerRole;
    };

export interface AuditPort {
  record(event: AuthAuditEvent): Promise<void>;
}

export interface ChildOwnershipPort {
  isOwnedByUser(userId: number, childId: number): Promise<boolean>;
}

export interface EntitlementPort {
  hasEntitlement(userId: number, key: string): Promise<boolean>;
}
