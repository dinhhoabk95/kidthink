import { gameLevels, getOwnerDb, transitionContent } from "@kidthink/db";
import { and, eq } from "drizzle-orm";
import { createError, defineEventHandler, getRouterParam } from "h3";
import {
  requireManagerSession,
  respondToManagerAuthError,
} from "../../../../../utils/admin-auth-runtime.js";

export default defineEventHandler(async (event) => {
  try {
    const manager = await requireManagerSession(event);

    const code = getRouterParam(event, "code");
    const versionParam = getRouterParam(event, "version");

    if (!(code && versionParam)) {
      throw createError({ statusCode: 404, statusMessage: "NOT_FOUND" });
    }

    const version = Number(versionParam);
    const db = getOwnerDb();

    const [level] = await db
      .select()
      .from(gameLevels)
      .where(
        and(eq(gameLevels.code, code), eq(gameLevels.contentVersion, version))
      );

    if (!level) {
      throw createError({
        statusCode: 404,
        statusMessage: "LEVEL_NOT_FOUND",
        message: `Level ${code} v${version} not found`,
      });
    }

    const res = await transitionContent({
      entityType: "game_level",
      entityDbId: level.id,
      toStatus: "in_review",
      actorManagerId: manager.id,
      actorRole: manager.role,
      expectedVersion: version,
    });

    return res;
  } catch (err) {
    return respondToManagerAuthError(event, err);
  }
});
