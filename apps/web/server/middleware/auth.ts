import { type UserTokenPayload, verifyWebUserToken } from "@kidthink/auth";
import { defineEventHandler, getCookie, getHeader } from "h3";
import { useRuntimeConfig } from "#imports";

declare module "h3" {
  interface H3EventContext {
    user?: UserTokenPayload;
    manager?: undefined;
  }
}

export default defineEventHandler(async (event) => {
  const tokenFromCookie = getCookie(event, "kidthink-user-access");
  const authHeader = getHeader(event, "authorization");
  const tokenFromHeader = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : undefined;

  const token = tokenFromCookie || tokenFromHeader;

  event.context.manager = undefined;

  if (!token) {
    event.context.user = undefined;
    return;
  }

  try {
    const { webJwtSecret } = useRuntimeConfig(event);
    const payload = await verifyWebUserToken({
      token,
      secret: webJwtSecret,
    });
    event.context.user = payload;
  } catch {
    event.context.user = undefined;
  }
});
