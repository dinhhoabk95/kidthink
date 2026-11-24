import { ValidationError } from "@mindkid/errors/common";
import { defineEventHandler } from "h3";
import { z } from "zod";
import { updateUserProfile } from "#server/services/identity-service";
import { requireWebUserSession } from "#server/utils/auth-runtime";
import { readBodyWithLimit } from "#server/utils/request-body";

const ProfileUpdateSchema = z
  .object({
    display_name: z.string().trim().min(2).max(60),
  })
  .strict();

export default defineEventHandler(async (event) => {
  const userSession = await requireWebUserSession(event);
  const userId = Number(userSession.user_id);

  const rawBody = await readBodyWithLimit(event);
  const parsed = ProfileUpdateSchema.safeParse(rawBody);
  if (!parsed.success) {
    throw new ValidationError("Tên hiển thị không hợp lệ (1–60 ký tự).");
  }

  return await updateUserProfile(userId, parsed.data.display_name);
});
