import { getOwnerDb, saveLibraryItem } from "@kidthink/db";
import { defineEventHandler, readBody, setResponseStatus } from "h3";
import { z } from "zod";
import {
  requireWebUserSession,
  respondToUserAuthError,
} from "../../../utils/auth-runtime.ts";

const SaveLibraryItemSchema = z.object({
  entity_type: z.enum(["game_level", "lesson", "curriculum", "activity"]),
  entity_id: z.coerce.number().positive(),
  collection_id: z.coerce.number().positive().optional().nullable(),
  note: z.string().max(500).optional().nullable(),
});

export default defineEventHandler(async (event) => {
  try {
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
  } catch (error) {
    return respondToUserAuthError(event, error);
  }
});
