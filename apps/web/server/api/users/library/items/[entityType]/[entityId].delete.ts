import { getOwnerDb } from "@mindkid/db";
import { ValidationError } from "@mindkid/errors/common";
import { defineEventHandler, getRouterParam } from "h3";
import { removeLibraryItem } from "#server/services/index.js";
import { requireWebUserSession } from "#server/utils/auth-runtime";

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const userId = Number(user.user_id);
  const db = getOwnerDb();

  const entityType = getRouterParam(event, "entityType");
  const entityIdStr = getRouterParam(event, "entityId");

  if (!(entityType && entityIdStr)) {
    throw new ValidationError("VALIDATION_FAILED");
  }

  const validTypes = ["game_level", "lesson", "curriculum", "activity"];
  if (!validTypes.includes(entityType)) {
    throw new ValidationError("INVALID_ENTITY_TYPE");
  }

  const entityId = Number(entityIdStr);
  if (Number.isNaN(entityId) || entityId <= 0) {
    throw new ValidationError("INVALID_ENTITY_ID");
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
