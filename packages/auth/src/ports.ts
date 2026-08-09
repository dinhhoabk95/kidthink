import type { ManagerRole } from "./contracts";

export type AccountType = "user" | "manager";
export type AuthMethod = "password" | "social";

export interface AccountReference {
  readonly account_type: AccountType;
  readonly account_id: number;
}

export interface SessionRecord extends AccountReference {
  readonly session_id: string;
  readonly refresh_token_hash: string;
  readonly refresh_token_version: number;
  readonly auth_method: AuthMethod;
  readonly reauth_at: Date | null;
  readonly expires_at: Date;
}

export interface RotateSessionInput {
  readonly session_id: string;
  readonly current_refresh_token_hash: string;
  readonly next_refresh_token_hash: string;
  readonly next_expires_at: Date;
  readonly used_at: Date;
}

export type RotateSessionResult =
  | { readonly outcome: "rotated"; readonly session: SessionRecord }
  | { readonly outcome: "reused"; readonly account: AccountReference }
  | { readonly outcome: "not_found" };

export interface SessionStorePort {
  findByRefreshTokenHash(hash: string): Promise<SessionRecord | null>;
  rotate(input: RotateSessionInput): Promise<RotateSessionResult>;
  revokeSession(sessionId: string): Promise<void>;
  revokeAll(account: AccountReference): Promise<void>;
  markReauthenticated(sessionId: string, at: Date): Promise<void>;
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
