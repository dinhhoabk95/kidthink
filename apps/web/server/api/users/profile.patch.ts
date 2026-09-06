import { getOwnerDb, users } from "@mindkid/db";
import { NotFoundError, ValidationError } from "@mindkid/errors/common";
import { eq } from "drizzle-orm";
import { defineEventHandler, readBody } from "h3";
import { z } from "zod";

import {
  assertRequestBodySize,
  requireWebUserSession,
} from "#server/utils/auth-runtime";

const ProfileUpdateSchema = z
  .object({
    display_name: z.string().trim().min(2).max(60),
  })
  .strict();

export default defineEventHandler(async (event) => {
  assertRequestBodySize(event, 8 * 1024);
  const userSession = await requireWebUserSession(event);
  const userId = Number(userSession.user_id);

  const eventBody = (event.context as { body?: Record<string, unknown> })?.body;
  const rawBody =
    eventBody || ((await readBody(event)) as Record<string, unknown>) || {};

  const parsed = ProfileUpdateSchema.safeParse(rawBody);
  if (!parsed.success) {
    throw new ValidationError("Tên hiển thị không hợp lệ (1–60 ký tự).");
  }

  const db = getOwnerDb();
  const [updated] = await db
    .update(users)
    .set({
      displayName: parsed.data.display_name,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();

  if (!updated) {
    throw new NotFoundError("NOT_FOUND");
  }

  return {
    display_name: updated.displayName,
  };
});
