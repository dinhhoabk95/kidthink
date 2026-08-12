import {
  AppError,
  appError,
  type ManagerTokenPayload,
  verifyAdminManagerToken,
} from "@kidthink/auth";
import {
  createError,
  getCookie,
  getHeader,
  type H3Event,
  setResponseStatus,
} from "h3";
import { getWebJwtSecret } from "./auth-runtime.js";

export function getAdminJwtSecret(event: H3Event): string {
  if (process.env.ADMIN_JWT_SECRET) {
    return process.env.ADMIN_JWT_SECRET;
  }
  return getWebJwtSecret(event);
}

export async function requireManagerSession(
  event: H3Event
): Promise<ManagerTokenPayload> {
  if (event.context?.manager) {
    return event.context.manager as ManagerTokenPayload;
  }

  const authHeader = getHeader(event, "authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : undefined;

  const cookieToken = getCookie(event, "kidthink_admin_token");
  const token = bearerToken || cookieToken;

  if (!token) {
    throw appError("UNAUTHENTICATED");
  }

  try {
    const secret = getAdminJwtSecret(event);
    const manager = await verifyAdminManagerToken({ token, secret });
    event.context.manager = manager;
    return manager;
  } catch (_err) {
    throw appError("UNAUTHENTICATED");
  }
}

export async function requireSuperAdminSession(
  event: H3Event
): Promise<ManagerTokenPayload> {
  const manager = await requireManagerSession(event);
  if (manager.role !== "super_admin") {
    throw appError("INSUFFICIENT_ROLE");
  }
  return manager;
}

export function respondToManagerAuthError(
  event: H3Event,
  error: unknown
): never {
  if (error instanceof AppError) {
    if (event?.node?.res) {
      setResponseStatus(event, error.status);
    }
    throw createError({
      statusCode: error.status,
      statusMessage: error.message,
      data: error.toResponse(),
    });
  }
  throw error as Error;
}
