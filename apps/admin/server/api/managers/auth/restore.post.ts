import { getBrowserSessionService } from "@kidthink/auth";
import { defineEventHandler, type H3Event } from "h3";
import { setUserSession } from "#imports";
import {
  getManagerRememberCookie,
  respondToManagerAuthError,
  setManagerRememberCookie,
  validateManagerCsrf,
} from "../../../../utils/admin-auth-runtime.js";

export async function handleRestore(event: H3Event) {
  try {
    validateManagerCsrf(event);
    const rememberToken = getManagerRememberCookie(event);

    const service = getBrowserSessionService();
    const restored = await service.restore({
      namespace: "manager",
      rememberToken,
    });

    await setUserSession(event, {
      secure: {
        session_token: restored.sessionToken,
      },
    });

    setManagerRememberCookie(event, restored.rememberToken);

    return {
      success: true,
      manager: restored.manager,
    };
  } catch (error) {
    return respondToManagerAuthError(event, error);
  }
}

export default defineEventHandler((event) => handleRestore(event));
