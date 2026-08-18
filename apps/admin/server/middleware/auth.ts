import type { ManagerTokenPayload } from "@mindkid/auth";
import { defineEventHandler, getHeader } from "h3";
import { getUserSession } from "#imports";

declare module "h3" {
  interface H3EventContext {
    user?: undefined;
    manager?: ManagerTokenPayload;
  }
}

export default defineEventHandler(async (event) => {
  event.context.user = undefined;

  // BR-AUT-36: Reject Bearer token / Authorization header on admin endpoints
  const authHeader = getHeader(event, "authorization");
  if (authHeader?.startsWith("Bearer ")) {
    event.context.manager = undefined;
    return;
  }

  try {
    const session = await getUserSession(event);
    if (session?.manager) {
      event.context.manager = session.manager as ManagerTokenPayload;
    } else {
      event.context.manager = undefined;
    }
  } catch {
    event.context.manager = undefined;
  }
});
