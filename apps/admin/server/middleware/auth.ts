import {
  type ManagerTokenPayload,
  verifyAdminManagerToken,
} from "@kidthink/auth";
import { defineEventHandler, getCookie, getHeader } from "h3";
import { useRuntimeConfig } from "#imports";

declare module "h3" {
  interface H3EventContext {
    user?: undefined;
    manager?: ManagerTokenPayload;
  }
}

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
    const { adminJwtSecret } = useRuntimeConfig(event);
    const payload = await verifyAdminManagerToken({
      token,
      secret: adminJwtSecret,
    });
    event.context.manager = payload;
  } catch {
    event.context.manager = undefined;
  }
});
