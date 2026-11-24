import {
  InsufficientRoleError,
  UnauthenticatedError,
} from "@mindkid/errors/auth";

export type ManagerRole = "super_admin" | "content_reviewer";

export interface UserTokenPayload {
  readonly user_id: number;
  readonly uuid?: string;
  readonly email?: string;
  readonly status?: string;
  readonly email_verified?: boolean;
  readonly two_factor_enabled?: boolean;
  readonly display_name: string;
  readonly session_id: string;
  readonly session_token?: string;
  readonly active_child_db_id?: number;
  readonly created_at?: Date;
  readonly reauth_at?: Date;
}

export interface ManagerTokenPayload {
  readonly manager_id: number;
  readonly uuid?: string;
  readonly email?: string;
  readonly mfa_enabled?: boolean;
  readonly display_name: string;
  readonly session_id: string;
  readonly session_token?: string;
  readonly role: ManagerRole;
  readonly created_at?: Date;
  readonly reauth_at?: Date;
}

export interface UserAuthContext {
  readonly user: UserTokenPayload;
  readonly manager?: never;
}

export interface ManagerAuthContext {
  readonly user?: never;
  readonly manager: ManagerTokenPayload;
}

export interface GuestAuthContext {
  readonly user?: undefined;
  readonly manager?: undefined;
}

export type AuthContext =
  | UserAuthContext
  | ManagerAuthContext
  | GuestAuthContext;

export interface AuthEventContextShape {
  user?: UserTokenPayload;
  manager?: ManagerTokenPayload;
}

export interface AuthEvent {
  readonly context: AuthContext | AuthEventContextShape;
}

export function requireUserAuth(event: AuthEvent): UserTokenPayload {
  if (event.context.manager || !event.context.user) {
    throw new UnauthenticatedError();
  }

  return event.context.user;
}

export function requireManagerAuth(event: AuthEvent): ManagerTokenPayload {
  if (event.context.user || !event.context.manager) {
    throw new UnauthenticatedError();
  }

  return event.context.manager;
}

export function requireRole(event: AuthEvent, role: ManagerRole): void {
  const manager = requireManagerAuth(event);
  const isAllowed = manager.role === "super_admin" || manager.role === role;

  if (!isAllowed) {
    throw new InsufficientRoleError();
  }
}
