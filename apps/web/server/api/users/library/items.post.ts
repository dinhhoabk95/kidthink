import { InternalError } from "@mindkid/errors/common";
import { z } from "zod";
import { saveLibraryItem } from "#server/services/index.js";
import { defineApiRoute } from "#server/utils/define-api-route";

const SaveLibraryItemSchema = z
  .object({
    entity_type: z.enum(["game_level", "curriculum"]),
    entity_id: z.coerce.number().positive().optional(),
    code: z.string().trim().min(1).max(100).optional(),
    collection_id: z.coerce.number().positive().optional().nullable(),
    note: z.string().max(500).optional().nullable(),
  })
  .refine(
    (data) => data.entity_id !== undefined || Boolean(data.code),
    "Cần cung cấp entity_id hoặc code của nội dung cần lưu"
  );

export default defineApiRoute({
  auth: "user",
  body: SaveLibraryItemSchema,
  status: 201,
  async handler({ auth, body }) {
    const saved = await saveLibraryItem({
      userId: Number(auth.user_id),
      entityType: body.entity_type,
      entityId: body.entity_id,
      code: body.code,
      collectionId: body.collection_id,
      note: body.note,
    });

    if (!saved) {
      throw new InternalError("Lưu mục thư viện thất bại");
    }

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
  },
});
