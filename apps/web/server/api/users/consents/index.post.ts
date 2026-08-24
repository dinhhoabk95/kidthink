import { appError } from "@mindkid/auth";
import {
  childProfiles,
  consentLogs,
  consentRequirements,
  getOwnerDb,
} from "@mindkid/db";
import { and, eq } from "drizzle-orm";
import {
  createError,
  defineEventHandler,
  getHeader,
  readBody,
  setResponseStatus,
} from "h3";
import { z } from "zod";

import {
  assertRequestBodySize,
  getVerifiedRemoteIp,
  requireWebUserSession,
} from "#server/utils/auth-runtime";

const SubmitConsentSchema = z
  .object({
    consent_type: z.enum(["terms", "privacy", "child_data"]),
    requirement_at: z.string().nullable().optional(),
    accept: z.literal(true),
  })
  .strict();

export default defineEventHandler(async (event) => {
  assertRequestBodySize(event, 8 * 1024);
  const userSession = await requireWebUserSession(event);
  const userId = Number(userSession.user_id);

  const eventBody = (event.context as { body?: Record<string, unknown> })?.body;
  const rawBody =
    eventBody || ((await readBody(event)) as Record<string, unknown>) || {};

  const parsed = SubmitConsentSchema.safeParse(rawBody);
  if (!parsed.success) {
    throw createError({
      statusCode: 422,
      statusMessage: "VALIDATION_FAILED",
      data: {
        code: "VALIDATION_FAILED",
        message: "Dữ liệu đồng ý không hợp lệ.",
      },
    });
  }

  const { consent_type: consentType, requirement_at: clientReqAt } =
    parsed.data;

  const ipAddress = getVerifiedRemoteIp(event);
  const userAgent = getHeader(event, "user-agent") || "unknown";
  const now = new Date();

  const db = getOwnerDb();

  const result = await db.transaction(async (tx) => {
    // Lock requirement row for update to ensure atomic marker check (BR-CSM-09, D-QY)
    const [req] = await tx
      .select()
      .from(consentRequirements)
      .where(eq(consentRequirements.consentType, consentType))
      .for("update");

    const dbMarker = req?.reconsentRequiredAt
      ? req.reconsentRequiredAt.toISOString()
      : null;

    // Verify requirement_at matches current DB marker
    const clientMarkerNorm = clientReqAt
      ? new Date(clientReqAt).toISOString()
      : null;

    if (dbMarker !== clientMarkerNorm) {
      throw appError("CONSENT_REQUIREMENT_CHANGED");
    }

    // BR-CSM-01 & BR-CSM-07: INSERT-only into consent_logs
    await tx.insert(consentLogs).values({
      userId,
      consentType,
      action: "accepted",
      ipAddress,
      userAgent,
      createdAt: now,
    });

    // BR-CSM-08: If re-consenting to child_data within 30 days, restore archived child profiles
    if (consentType === "child_data") {
      await tx
        .update(childProfiles)
        .set({
          status: "active",
          purgeAt: null,
          updatedAt: now,
        })
        .where(
          and(
            eq(childProfiles.userId, userId),
            eq(childProfiles.status, "archived")
          )
        );
    }

    return {
      consent_type: consentType,
      accepted_at: now.toISOString(),
      status: "active" as const,
    };
  });

  setResponseStatus(event, 201);
  return result;
});
