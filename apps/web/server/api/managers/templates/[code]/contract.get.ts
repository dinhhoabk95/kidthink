import {
  exportTemplateContracts,
  getGameTemplate,
} from "@kidthink/game-engine";
import { createError, defineEventHandler, getRouterParam } from "h3";
import {
  requireManagerSession,
  respondToManagerAuthError,
} from "../../../../utils/admin-auth-runtime.js";

export default defineEventHandler(async (event) => {
  try {
    await requireManagerSession(event);

    const code = getRouterParam(event, "code");
    if (!(code && getGameTemplate(code))) {
      throw createError({
        statusCode: 422,
        statusMessage: "TEMPLATE_NOT_SUPPORTED",
        message: `Template ${code} is not supported`,
      });
    }

    const exported = exportTemplateContracts(code);
    return exported;
  } catch (err) {
    if ((err as { statusCode?: number })?.statusCode === 422) {
      throw err;
    }
    return respondToManagerAuthError(event, err);
  }
});
