import { z } from "zod";
import { createCollection } from "#server/services/index.js";
import { defineApiRoute } from "#server/utils/define-api-route";

const CreateCollectionSchema = z.object({
  name: z.string().min(1, "Tên bộ sưu tập không được để trống").max(100),
});

export default defineApiRoute({
  auth: "user",
  body: CreateCollectionSchema,
  status: 201,
  async handler({ auth, body }) {
    const created = await createCollection(Number(auth.user_id), body.name);

    return {
      success: true,
      collection: {
        id: created.id,
        name: created.name,
        position: created.position,
        created_at: created.created_at,
      },
    };
  },
});
