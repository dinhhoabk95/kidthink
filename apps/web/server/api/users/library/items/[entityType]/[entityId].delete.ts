import { ValidationError } from "@mindkid/errors/common";
import { getRouterParam } from "h3";
import { removeLibraryItem } from "#server/services/index.js";
import { defineApiRoute } from "#server/utils/define-api-route";

export default defineApiRoute({
  auth: "user",
  async handler({ event, auth }) {
    const entityType = getRouterParam(event, "entityType");
    const entityIdStr = getRouterParam(event, "entityId");

    if (!(entityType && entityIdStr)) {
      throw new ValidationError("VALIDATION_FAILED");
    }

    if (entityType !== "game_level" && entityType !== "curriculum") {
      throw new ValidationError("INVALID_ENTITY_TYPE");
    }

    const entityId = Number(entityIdStr);
    if (Number.isNaN(entityId) || entityId <= 0) {
      throw new ValidationError("INVALID_ENTITY_ID");
    }

    await removeLibraryItem({
      userId: Number(auth.user_id),
      entityType,
      entityId,
    });

    return {
      success: true,
      message: "Đã xoá mục khỏi thư viện cá nhân.",
    };
  },
});
