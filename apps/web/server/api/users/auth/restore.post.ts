import { getBrowserSessionService } from "@mindkid/auth";
import { defineEventHandler, type H3Event } from "h3";
import {
  getUserRememberCookie,
  setUserRememberCookie,
  validateUserCsrf,
} from "#server/utils/auth-runtime";

export async function handleRestore(event: H3Event) {
  validateUserCsrf(event);
  const rememberToken = getUserRememberCookie(event);

  const service = getBrowserSessionService();
  const restored = await service.restore({
    namespace: "user",
    rememberToken,
  });

  await setUserSession(event, {
    secure: {
      session_token: restored.sessionToken,
    },
  });

  setUserRememberCookie(event, restored.rememberToken);

  return {
    success: true,
    user: restored.user,
  };
}

export default defineEventHandler((event) => handleRestore(event));
