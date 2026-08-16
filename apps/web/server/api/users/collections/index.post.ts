import { createCollection, getOwnerDb } from "@kidthink/db";
import { defineEventHandler, readBody, setResponseStatus } from "h3";
import { z } from "zod";
import {
  requireWebUserSession,
  respondToUserAuthError,
} from "../../../utils/auth-runtime.ts";

const CreateCollectionSchema = z.object({
  name: z.string().min(1, "Tên bộ sưu tập không được để trống").max(100),
});

export default defineEventHandler(async (event) => {
  try {
    const user = await requireWebUserSession(event);
    const userId = Number(user.user_id);
    const db = getOwnerDb();

    const body = await readBody(event);
    const parsed = CreateCollectionSchema.parse(body);

    const created = await createCollection(db, userId, parsed.name);

    setResponseStatus(event, 201);
    return {
      success: true,
      collection: {
        id: created.id,
        name: created.name,
        position: created.position,
        created_at: created.createdAt.toISOString(),
      },
    };
  } catch (error) {
    return respondToUserAuthError(event, error);
  }
});
