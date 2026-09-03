import { getOwnerDb } from "@mindkid/db";
import { defineEventHandler, readBody, setResponseStatus } from "h3";
import { z } from "zod";
import { saveLibraryItem } from "#server/services/index.js";
import { requireWebUserSession } from "#server/utils/auth-runtime";

const SaveLibraryItemSchema = z.object({
  entity_type: z.enum(["game_level", "lesson", "curriculum", "activity"]),
  entity_id: z.coerce.number().positive(),
  collection_id: z.coerce.number().positive().optional().nullable(),
  note: z.string().max(500).optional().nullable(),
});

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const userId = Number(user.user_id);
  const db = getOwnerDb();

  const body = await readBody(event);
  const parsed = SaveLibraryItemSchema.parse(body);

  const saved = await saveLibraryItem(db, {
    userId,
    entityType: parsed.entity_type,
    entityId: parsed.entity_id,
    collectionId: parsed.collection_id,
    note: parsed.note,
  });

  if (!saved) {
    throw createError({
      statusCode: 500,
      statusMessage: "SAVE_FAILED",
      message: "Lưu mục thư viện thất bại",
    });
  }

  setResponseStatus(event, 201);
  return {
    success: true,
    item: {
      entity_type: saved.entityType,
      entity_id: saved.entityId,
      collection_id: saved.collectionId,
      note: saved.note,
      created_at: saved.createdAt.toISOString(),
    },
  };
});
