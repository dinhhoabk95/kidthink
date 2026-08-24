import {
  getBrowserSessionService,
  type ManagerTokenPayload,
  type UserTokenPayload,
} from "@mindkid/auth";
import { defineEventHandler, getHeader } from "h3";
import { getUserSession } from "#imports";
import {
  getManagerSession,
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

async function resolveUserSession(event: Parameters<typeof getUserSession>[0]) {
  const session = await getUserSession(event);
  const token = session.secure?.session_token;
  if (typeof token !== "string" || token.length === 0) {
    return undefined;
  }

  const authContext = await getBrowserSessionService().resolve("user", token);
  return authContext?.user;
}

async function resolveManagerSession(
  event: Parameters<typeof getUserSession>[0]
) {
  if (!getManagerSessionToken(event)) {
    return undefined;
  }

  const session = await getManagerSession(event);
  const token = session.data.secure?.session_token;
  if (typeof token !== "string" || token.length === 0) {
    return undefined;
  }

  const authContext = await getBrowserSessionService().resolve(
    "manager",
    token
  );
  return authContext?.manager;
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
