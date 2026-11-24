import { UnauthenticatedError } from "@mindkid/errors/auth";
import type { H3Event } from "h3";
import { defineEventHandler, readBody } from "h3";
import { z } from "zod";
import {
  cancelAccountDeletion,
  verifyCancelDeletionCredentials,
} from "#server/services/account-lifecycle-service";
import { enforceTwoAxisRateLimit } from "#server/utils/auth-runtime";

const CancelDeletionSchema = z
  .object({
    email: z.string().trim().email().optional(),
    password: z.string().optional(),
    totp: z.string().min(6).max(16).optional(),
  })
  .strict();

async function resolveTargetUserId(event: H3Event): Promise<number> {
  const sessionUserId = (event.context as { user?: { user_id?: number } })?.user
    ?.user_id;

  if (sessionUserId) {
    await enforceTwoAxisRateLimit(event, "auth:login", `u:${sessionUserId}`);
    return Number(sessionUserId);
  }

  const eventBody = (event.context as { body?: Record<string, string> })?.body;
  const rawBody =
    eventBody || (await readBody<Record<string, string>>(event)) || {};
  const parsed = CancelDeletionSchema.safeParse(rawBody);
  let normalizedEmail: string | undefined;
  if (parsed.success && parsed.data.email) {
    normalizedEmail = parsed.data.email.trim().toLowerCase();
  } else if (
    typeof rawBody.email === "string" &&
    rawBody.email.trim().length > 0
  ) {
    normalizedEmail = rawBody.email.trim().toLowerCase();
  }

  await enforceTwoAxisRateLimit(event, "auth:login", normalizedEmail);

  if (!(parsed.success && parsed.data.email)) {
    throw new UnauthenticatedError(
      "Cần đăng nhập hoặc cung cấp thông tin tài khoản để huỷ yêu cầu xoá."
    );
  }

  return await verifyCancelDeletionCredentials(
    parsed.data.email,
    parsed.data.password,
    parsed.data.totp
  );
}

export default defineEventHandler(async (event) => {
  const targetUserId = await resolveTargetUserId(event);
  return await cancelAccountDeletion(targetUserId);
});
