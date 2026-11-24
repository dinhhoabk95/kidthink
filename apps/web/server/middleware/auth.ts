import type { ManagerTokenPayload, UserTokenPayload } from "@mindkid/auth";
import { canonicalizeRequestPath } from "@mindkid/shared";
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
  return path === "/api/auth" || path.startsWith("/api/auth/");
}

function isUserAuthMountPath(path: string): boolean {
  return path === "/api/auth/users" || path.startsWith("/api/auth/users/");
}

function isManagerAuthMountPath(path: string): boolean {
  return (
    path === "/api/auth/managers" || path.startsWith("/api/auth/managers/")
  );
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
  const pathname = canonicalizeRequestPath(
    event.path || getRequestURL(event).pathname
  );
  const authHeader = getHeader(event, "authorization");
  if (authHeader && BEARER_HEADER_PREFIX.test(authHeader)) {
    return;
  }

  const cookieHeader = getHeader(event, "cookie");
  if (isUserAuthMountPath(pathname)) {
    if (cookieHeader?.includes("mindkid-user")) {
      await resolveBetterAuthUserSession(event);
    }
    return;
  }

  if (isManagerAuthMountPath(pathname)) {
    if (cookieHeader?.includes("mindkid-manager")) {
      await resolveBetterAuthManagerSession(event);
    }
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
