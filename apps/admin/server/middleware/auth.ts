import {
  type ManagerTokenPayload,
  verifyAdminManagerToken,
} from "@kidthink/auth";
import { defineEventHandler, getCookie, getHeader } from "h3";

declare module "h3" {
  interface H3EventContext {
    user?: undefined;
    manager?: ManagerTokenPayload;
  }
}

const ADMIN_JWT_SECRET =
  process.env.KIDTHINK_ADMIN_JWT_SECRET ||
  "dev-admin-jwt-secret-must-be-at-least-32-chars-long!!";

export default defineEventHandler(async (event) => {
  const tokenFromCookie = getCookie(event, "kidthink-manager-access");
  const authHeader = getHeader(event, "authorization");
  const tokenFromHeader = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : undefined;

  const token = tokenFromCookie || tokenFromHeader;

  event.context.user = undefined;

  if (!token) {
    event.context.manager = undefined;
    return;
  }

  try {
    const payload = await verifyAdminManagerToken({
      token,
      secret: ADMIN_JWT_SECRET,
    });
    event.context.manager = payload;
  } catch {
    event.context.manager = undefined;
  }
});
