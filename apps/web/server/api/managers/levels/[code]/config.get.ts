import { gameLevels, getOwnerDb } from "@mindkid/db";
import { and, desc, eq } from "drizzle-orm";
import { createError, defineEventHandler, getQuery, getRouterParam } from "h3";
import { requireManagerSession } from "../../../../utils/admin-auth-runtime.js";
import { deliverGameConfig } from "../../../../utils/game-config-runtime.js";
import { issuePreviewToken } from "../../../../utils/preview-token.js";

export default defineEventHandler(async (event) => {
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

  // Deliver game config in manager preview mode
  const config = await deliverGameConfig(event, code, {
    caller: {
      kind: "user",
      account_id: manager.id,
      role: "manager",
    },
    version,
    isManagerPreview: true,
  });

  const db = getOwnerDb();
  const managerId = manager.manager_id || manager.id || 1;

  const [level] = await db
    .select({ id: gameLevels.id, contentVersion: gameLevels.contentVersion })
    .from(gameLevels)
    .where(
      version === undefined
        ? eq(gameLevels.code, code)
        : and(eq(gameLevels.code, code), eq(gameLevels.contentVersion, version))
    )
    .orderBy(desc(gameLevels.contentVersion))
    .limit(1);

  const previewToken = level
    ? issuePreviewToken({
        entityType: "game_level",
        id: level.id,
        version: level.contentVersion,
        managerId,
      })
    : undefined;

  return {
    ...config,
    preview_token: previewToken,
  };
});
