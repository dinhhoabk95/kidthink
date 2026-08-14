// Mock implementation of #imports (nuxt-auth-utils and Nitro auto-imports) for Vitest
import type { H3Event } from "h3";

interface AuthError extends Error {
  statusCode: number;
}

function createAuthError(message: string, statusCode: number): AuthError {
  const err = new Error(message) as AuthError;
  err.statusCode = statusCode;
  return err;
}

const sessions = new WeakMap<H3Event, Record<string, unknown>>();

export function setUserSession(
  event: H3Event,
  data: Record<string, unknown>
): Promise<void> {
  sessions.set(event, data);
  if (event.context) {
    event.context.userSession = data;
  }
  return Promise.resolve();
}

export function getUserSession(
  event: H3Event
): Promise<Record<string, unknown>> {
  return Promise.resolve(
    sessions.get(event) ||
      (event.context?.userSession as Record<string, unknown>) ||
      {}
  );
}

export function clearUserSession(event: H3Event): Promise<void> {
  sessions.delete(event);
  if (event.context) {
    event.context.userSession = undefined;
  }
  return Promise.resolve();
}

export async function requireUserSession(
  event: H3Event
): Promise<Record<string, unknown>> {
  const session = await getUserSession(event);
  if (!session?.user) {
    throw createAuthError("UNAUTHORIZED", 401);
  }
  return session;
}

export async function requireManagerSession(
  event: H3Event
): Promise<Record<string, unknown>> {
  const session = await getUserSession(event);
  const user = session?.user as Record<string, unknown> | undefined;
  if (!(session?.manager || user?.manager_id)) {
    throw createAuthError("UNAUTHORIZED", 401);
  }
  return session;
}

export async function requireSuperAdminSession(
  event: H3Event
): Promise<Record<string, unknown>> {
  const session = await getUserSession(event);
  const user = session?.user as Record<string, unknown> | undefined;
  const manager = session?.manager as Record<string, unknown> | undefined;
  const role = manager?.role || user?.role;
  if (!(manager || user?.manager_id)) {
    throw createAuthError("UNAUTHORIZED", 401);
  }
  if (role !== "super_admin") {
    throw createAuthError("INSUFFICIENT_ROLE", 403);
  }
  return session;
}
