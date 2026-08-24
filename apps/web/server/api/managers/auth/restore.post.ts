import { getBrowserSessionService } from "@mindkid/auth";
import { defineEventHandler, type H3Event } from "h3";
import { setUserSession } from "#imports";
import {
  getManagerRememberCookie,
  setManagerRememberCookie,
  validateManagerCsrf,
} from "#server/utils/admin-auth-runtime";
import { getManagerSessionConfig } from "#server/utils/session-runtime";

export async function handleRestore(event: H3Event) {
  validateManagerCsrf(event);
  const rememberToken = getManagerRememberCookie(event);
  const restored = await getBrowserSessionService().restore({
    namespace: "manager",
    rememberToken,
  });

  await setUserSession(
    event,
    { secure: { session_token: restored.sessionToken } },
    getManagerSessionConfig()
  );
  setManagerRememberCookie(event, restored.rememberToken);

  return {
    success: true,
    manager: restored.manager,
  };
}

export default defineEventHandler((event) => handleRestore(event));
