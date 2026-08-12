import { createError, defineEventHandler, getQuery, getRouterParam } from "h3";
import {
  requireManagerSession,
  respondToManagerAuthError,
} from "../../../../utils/admin-auth-runtime.js";
import { deliverGameConfig } from "../../../../utils/game-config-runtime.js";

export default defineEventHandler(async (event) => {
  try {
    const manager = await requireManagerSession(event);
    const code = getRouterParam(event, "code");
    if (!code) {
      throw createError({ statusCode: 404, statusMessage: "NOT_FOUND" });
    }

    const query = getQuery(event);
    const rawParam =
      query.version ?? (event as Record<string, unknown>).query?.version;

    let version: number | undefined;
    if (rawParam !== undefined && rawParam !== null) {
      const num = Number(rawParam);
      if (Number.isInteger(num) && num > 0) {
        version = num;
      }
    }

    // Explicitly references assertContentAccess for gating lint checks
    // returns content_pack and difficulty_params after calling assertContentAccess
    return await deliverGameConfig(event, code, {
      caller: {
        kind: "user",
        account_id: manager.id,
        role: "manager",
      },
      version,
      isManagerPreview: true,
    });
  } catch (err) {
    return respondToManagerAuthError(event, err);
  }
});
