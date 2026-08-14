import { AppError, appError } from "@kidthink/auth";
import { childProfiles, consentLogs, getOwnerDb } from "@kidthink/db";
import { CONSENT_POLICY_MAP, type ConsentType } from "@kidthink/shared";
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
  respondToUserAuthError,
} from "../../../utils/auth-runtime.js";

const SubmitConsentSchema = z
  .object({
    consent_type: z.enum(["terms", "privacy", "child_data"]),
    policy_version: z.string().min(1).max(20),
  })
  .strict();

export default defineEventHandler(async (event) => {
  try {
    assertRequestBodySize(event, 8 * 1024);
    const userSession = await requireWebUserSession(event);
    const userId = Number(userSession.user_id);

    const eventBody = (event.context as { body?: Record<string, unknown> })
      ?.body;
    const rawBody =
      eventBody || ((await readBody(event)) as Record<string, unknown>) || {};

    const parsed = SubmitConsentSchema.safeParse(rawBody);
    if (!parsed.success) {
      setResponseStatus(event, 422);
      throw createError({
        statusCode: 422,
        statusMessage: "VALIDATION_FAILED",
        data: {
          code: "VALIDATION_FAILED",
          message: "Dữ liệu đồng ý không hợp lệ.",
        },
      });
    }

    const { consent_type: consentType, policy_version: policyVersion } =
      parsed.data;
    const meta = CONSENT_POLICY_MAP[consentType as ConsentType];

    // Check version matches current policy version (BR-CSM-01)
    if (policyVersion !== meta.currentVersion) {
      throw appError("CONSENT_VERSION_STALE");
    }

    const ipAddress = getVerifiedRemoteIp(event);
    const userAgent = getHeader(event, "user-agent") || "unknown";
    const now = new Date();

    const db = getOwnerDb();

    // BR-CSM-01 & BR-CSM-07: INSERT-only into consent_logs with metadata
    await db.insert(consentLogs).values({
      userId,
      consentType,
      policyVersion,
      ipAddress,
      userAgent,
      createdAt: now,
    });

    // BR-CSM-08: If re-consenting to child_data within 30 days, restore archived child profiles
    if (consentType === "child_data") {
      await db
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
        )
        .catch(() => null);
    }

    setResponseStatus(event, 201);
    return {
      ok: true,
      consent_type: consentType,
      policy_version: policyVersion,
      agreed_at: now.toISOString(),
    };
  } catch (err: unknown) {
    if (err instanceof AppError) {
      setResponseStatus(event, err.status);
      throw createError({
        statusCode: err.status,
        statusMessage: err.code,
        data: err.toResponse(),
      });
    }
    return respondToUserAuthError(event, err);
  }
});
