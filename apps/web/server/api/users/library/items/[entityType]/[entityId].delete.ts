import { getOwnerDb, removeLibraryItem } from "@mindkid/db";
import {
  createError,
  defineEventHandler,
  getRouterParam,
  setResponseStatus,
} from "h3";
import { requireWebUserSession } from "#server/utils/auth-runtime";

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const userId = Number(user.user_id);
  const db = getOwnerDb();

  const entityType = getRouterParam(event, "entityType");
  const entityIdStr = getRouterParam(event, "entityId");

  if (!(entityType && entityIdStr)) {
    setResponseStatus(event, 400);
    throw createError({
      statusCode: 400,
      statusMessage: "VALIDATION_FAILED",
    });
  }

  const validTypes = ["game_level", "lesson", "curriculum", "activity"];
  if (!validTypes.includes(entityType)) {
    setResponseStatus(event, 400);
    throw createError({
      statusCode: 400,
      statusMessage: "INVALID_ENTITY_TYPE",
    });
  }

  const entityId = Number(entityIdStr);
  if (Number.isNaN(entityId) || entityId <= 0) {
    setResponseStatus(event, 400);
    throw createError({
      statusCode: 400,
      statusMessage: "INVALID_ENTITY_ID",
    });
  }

  await removeLibraryItem(db, {
    userId,
    entityType: entityType as
      | "game_level"
      | "lesson"
      | "curriculum"
      | "activity",
    entityId,
  });

  return {
    success: true,
    message: "Đã xoá mục khỏi thư viện cá nhân.",
  };
});
