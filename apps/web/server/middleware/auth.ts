import type { ManagerTokenPayload, UserTokenPayload } from "@mindkid/auth";
import { defineEventHandler, getHeader, getRequestURL } from "h3";
import {
  resolveBetterAuthManagerSession,
  resolveBetterAuthUserSession,
} from "#server/utils/better-auth";

declare module "h3" {
  interface H3EventContext {
    user?: UserTokenPayload;
    manager?: ManagerTokenPayload;
  }
}

const BEARER_HEADER_PREFIX = /^bearer\s+/i;

function isAuthMountPath(path: string): boolean {
  return path.startsWith("/api/auth/");
}

function isManagerApiPath(path: string): boolean {
  return path === "/api/managers" || path.startsWith("/api/managers/");
}

function isUserOrGuestApiPath(path: string): boolean {
  if (isAuthMountPath(path) || isManagerApiPath(path)) {
    return false;
  }
  return path === "/api" || path.startsWith("/api/");
}

export default defineEventHandler(async (event) => {
  const pathname = getRequestURL(event).pathname;
  const authHeader = getHeader(event, "authorization");
  if (authHeader && BEARER_HEADER_PREFIX.test(authHeader)) {
    return;
  }

  if (isManagerApiPath(pathname)) {
    await resolveBetterAuthManagerSession(event);
    return;
  }

  if (isUserOrGuestApiPath(pathname)) {
    await resolveBetterAuthUserSession(event);
  }
});
