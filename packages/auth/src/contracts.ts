import { appError } from "./errors";

export type ManagerRole = "super_admin" | "content_reviewer";

export interface UserTokenPayload {
  readonly user_id: number;
  readonly display_name: string;
  readonly session_id: string;
  readonly refresh_token_version: number;
  readonly active_child_id?: number;
}

export interface ManagerTokenPayload {
  readonly manager_id: number;
  readonly display_name: string;
  readonly session_id: string;
  readonly refresh_token_version: number;
  readonly role: ManagerRole;
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

export interface AuthEvent {
  readonly context: {
    readonly user?: UserTokenPayload;
    readonly manager?: ManagerTokenPayload;
  };
}

export function createAuthContext(context: AuthContext): AuthContext {
  const hasUser = context.user !== undefined;
  const hasManager = context.manager !== undefined;

  if (hasUser === hasManager) {
    if (hasUser) {
      throw appError("UNAUTHENTICATED");
    }
    return {};
  }

  if (context.user) {
    return { user: context.user };
  }

  if (context.manager) {
    return { manager: context.manager };
  }

  return {};
}

export function requireUserAuth(event: AuthEvent): UserTokenPayload {
  if (event.context.manager || !event.context.user) {
    throw appError("UNAUTHENTICATED");
  }

  return event.context.user;
}

export function requireManagerAuth(event: AuthEvent): ManagerTokenPayload {
  if (event.context.user || !event.context.manager) {
    throw appError("UNAUTHENTICATED");
  }

  return event.context.manager;
}

export function requireRole(event: AuthEvent, role: ManagerRole): void {
  const manager = requireManagerAuth(event);
  const isAllowed = manager.role === "super_admin" || manager.role === role;

  if (!isAllowed) {
    throw appError("INSUFFICIENT_ROLE");
  }
}
