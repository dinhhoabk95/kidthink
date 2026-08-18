import type { UserTokenPayload } from "@mindkid/auth";
import { defineEventHandler, getHeader } from "h3";
import { getUserSession } from "#imports";

declare module "h3" {
  interface H3EventContext {
    user?: UserTokenPayload;
    manager?: undefined;
  }
}

export default defineEventHandler(async (event) => {
  event.context.manager = undefined;

  // BR-AUT-36: Reject Bearer token / Authorization header on browser endpoints
  const authHeader = getHeader(event, "authorization");
  if (authHeader?.startsWith("Bearer ")) {
    event.context.user = undefined;
    return;
  }

  try {
    const session = await getUserSession(event);
    if (session?.user) {
      event.context.user = session.user as UserTokenPayload;
    } else {
      event.context.user = undefined;
    }
  } catch {
    event.context.user = undefined;
  }
});
