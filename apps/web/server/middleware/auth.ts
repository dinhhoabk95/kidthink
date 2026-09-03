import {
  getBrowserSessionService,
  type ManagerTokenPayload,
  type UserTokenPayload,
} from "@mindkid/auth";
import { defineEventHandler, getCookie, getHeader, type H3Event } from "h3";
import {
  clearManagerRememberCookie,
  setManagerRememberCookie,
} from "#server/utils/admin-auth-runtime";
import {
  clearUserRememberCookie,
  MANAGER_REMEMBER_COOKIE,
  setUserRememberCookie,
  USER_REMEMBER_COOKIE,
} from "#server/utils/auth-runtime";
import {
  getManagerSession,
  getManagerSessionConfig,
  getManagerSessionToken,
} from "#server/utils/session-runtime";

declare module "h3" {
  interface H3EventContext {
    user?: UserTokenPayload;
    manager?: ManagerTokenPayload;
  }
}

function isManagerApiPath(path: string): boolean {
  return path === "/api/managers" || path.startsWith("/api/managers/");
}

// BR-ARB-06 + BR-SLK-01: the user namespace owns every API path the manager
// namespace does not. Guest routes keep the caller's identity (OAuth account
// linking needs it), while page and asset requests resolve nothing at all.
function isUserApiPath(path: string): boolean {
  if (isManagerApiPath(path)) {
    return false;
  }
  return path === "/api" || path.startsWith("/api/");
}

async function resolveUserSession(event: H3Event) {
  const session = await getUserSession(event);
  const secure = session.secure as { session_token?: string } | undefined;
  const token = secure?.session_token;
  if (typeof token === "string" && token.length > 0) {
    const authContext = await getBrowserSessionService().resolve("user", token);
    if (authContext?.user) {
      return authContext.user;
    }
  }

  // Session expired or missing. Auto-refresh session if remember token is present (Laravel-style)
  const rememberToken = getCookie(event, USER_REMEMBER_COOKIE);
  if (typeof rememberToken === "string" && rememberToken.length > 0) {
    try {
      const restored = await getBrowserSessionService().restore({
        namespace: "user",
        rememberToken,
      });
      if (restored?.user) {
        await setUserSession(event, {
          secure: { session_token: restored.sessionToken },
        });
        setUserRememberCookie(event, restored.rememberToken);
        return restored.user;
      }
    } catch {
      clearUserRememberCookie(event);
    }
  }

  return undefined;
}

async function resolveManagerSession(event: H3Event) {
  const managerSessionToken = getManagerSessionToken(event);
  if (managerSessionToken) {
    const session = await getManagerSession(event);
    const secure = session.data.secure as
      | { session_token?: string }
      | undefined;
    const token = secure?.session_token;
    if (typeof token === "string" && token.length > 0) {
      const authContext = await getBrowserSessionService().resolve(
        "manager",
        token
      );
      if (authContext?.manager) {
        return authContext.manager;
      }
    }
  }

  // Manager session expired or missing. Auto-refresh session if remember token is present (Laravel-style)
  const rememberToken = getCookie(event, MANAGER_REMEMBER_COOKIE);
  if (typeof rememberToken === "string" && rememberToken.length > 0) {
    try {
      const restored = await getBrowserSessionService().restore({
        namespace: "manager",
        rememberToken,
      });
      if (restored?.manager) {
        await setUserSession(
          event,
          { secure: { session_token: restored.sessionToken } },
          getManagerSessionConfig()
        );
        setManagerRememberCookie(event, restored.rememberToken);
        return restored.manager;
      }
    } catch {
      clearManagerRememberCookie(event);
    }
  }

  return undefined;
}

export default defineEventHandler(async (event) => {
  event.context.user = undefined;
  event.context.manager = undefined;

  // BR-AUT-36: Reject Bearer token / Authorization header on browser endpoints
  const authHeader = getHeader(event, "authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return;
  }

  try {
    if (isManagerApiPath(event.path)) {
      event.context.manager = await resolveManagerSession(event);
      return;
    }

    if (isUserApiPath(event.path)) {
      event.context.user = await resolveUserSession(event);
    }
  } catch {
    event.context.user = undefined;
    event.context.manager = undefined;
  }
});
