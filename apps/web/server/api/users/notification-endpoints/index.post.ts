import { ValidationError } from "@mindkid/errors/common";
import { defineEventHandler } from "h3";
import { z } from "zod";
import { registerUserNotificationEndpoint } from "#server/services/notification-service";
import { requireWebUserSession } from "#server/utils/auth-runtime";
import { readRequestBody } from "#server/utils/request-body";

const endpointRegistrationSchema = z
  .object({
    provider: z.literal("fcm_web", {
      error: "Provider phải là fcm_web",
    }),
    client_installation_id: z
      .string()
      .uuid({ message: "client_installation_id phải là UUID hợp lệ" }),
    token: z
      .string()
      .min(10, { message: "Token quá ngắn hoặc không hợp lệ" })
      .max(4096, { message: "Token vượt quá độ dài tối đa cho phép" }),
  })
  .strict();

export default defineEventHandler(async (event) => {
  const user = requireWebUserSession(event);
  const userId = Number(user.user_id);
  const body = await readRequestBody(event);
  const parsed = endpointRegistrationSchema.safeParse(body);

  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message);
  }

  return await registerUserNotificationEndpoint(userId, {
    provider: parsed.data.provider,
    clientInstallationId: parsed.data.client_installation_id,
    token: parsed.data.token,
  });
});
