import { getOwnerDb, notificationEndpoints } from "@mindkid/db";
import { encryptFcmToken } from "@mindkid/notification";
import { and, eq } from "drizzle-orm";
import { createError, defineEventHandler, readBody } from "h3";
import { z } from "zod";

import { requireWebUserSession } from "../../../utils/auth-runtime.js";

const endpointRegistrationSchema = z.object({
  provider: z.literal("fcm_web", {
    errorMap: () => ({ message: "Provider phải là fcm_web" }),
  }),
  client_installation_id: z
    .string()
    .uuid({ message: "client_installation_id phải là UUID hợp lệ" }),
  token: z.string().min(10, { message: "Token quá ngắn hoặc không hợp lệ" }),
});

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const userId = Number(user.user_id);
  const body =
    (await readBody(event).catch(() => null)) ||
    event._body ||
    event.context?.body ||
    {};
  const parsed = endpointRegistrationSchema.safeParse(body);

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "INVALID_ENDPOINT_PAYLOAD",
      data: {
        code: "INVALID_ENDPOINT_PAYLOAD",
        message: parsed.error.issues[0]?.message,
      },
    });
  }

  const {
    provider,
    client_installation_id: installationId,
    token,
  } = parsed.data;

  // Encrypt token and get HMAC fingerprint
  const { tokenEncrypted, tokenFingerprint } = encryptFcmToken(token);

  const db = getOwnerDb();

  // Check if endpoint exists for (userId, installationId)
  const [existing] = await db
    .select()
    .from(notificationEndpoints)
    .where(
      and(
        eq(notificationEndpoints.userId, userId),
        eq(notificationEndpoints.clientInstallationId, installationId)
      )
    );

  let resultEndpoint = existing;

  if (existing) {
    // Rotate / update token
    const [updated] = await db
      .update(notificationEndpoints)
      .set({
        tokenEncrypted,
        tokenFingerprint,
        status: "active",
        lastSeenAt: new Date(),
        invalidatedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(notificationEndpoints.id, existing.id))
      .returning();

    resultEndpoint = updated;
  } else {
    // Create new endpoint
    const [created] = await db
      .insert(notificationEndpoints)
      .values({
        userId,
        provider,
        clientInstallationId: installationId,
        tokenEncrypted,
        tokenFingerprint,
        status: "active",
        lastSeenAt: new Date(),
      })
      .returning();

    resultEndpoint = created;
  }

  // BR-BPS-04: Token is NEVER echoed back in response
  return {
    uuid: resultEndpoint.uuid,
    provider: resultEndpoint.provider,
    status: resultEndpoint.status,
  };
});
