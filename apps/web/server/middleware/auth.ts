import { type UserTokenPayload, verifyWebUserToken } from "@kidthink/auth";
import { defineEventHandler, getCookie, getHeader } from "h3";

declare module "h3" {
  interface H3EventContext {
    user?: UserTokenPayload;
    manager?: undefined;
  }
}

const WEB_JWT_SECRET =
  process.env.KIDTHINK_WEB_JWT_SECRET ||
  "dev-web-jwt-secret-must-be-at-least-32-chars-long!!";

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
    const payload = await verifyWebUserToken({
      token,
      secret: WEB_JWT_SECRET,
    });
    event.context.user = payload;
  } catch {
    event.context.user = undefined;
  }
});
