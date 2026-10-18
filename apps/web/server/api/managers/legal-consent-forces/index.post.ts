import {
  auditLogs,
  consentLogs,
  consentRequirements,
  getOwnerDb,
  users,
} from "@mindkid/db";
import { ConsentRequirementChangedError } from "@mindkid/errors/account";
import { ValidationError } from "@mindkid/errors/common";
import { and, eq, ne, sql } from "drizzle-orm";
import { defineEventHandler, getHeader, readBody, setResponseStatus } from "h3";
import { z } from "zod";
import { requireSuperAdminSession } from "#server/utils/admin-auth-runtime";
import { getVerifiedRemoteIp } from "#server/utils/auth-runtime";
import { bumpGlobalConsentEpoch } from "#server/utils/consent-guard";
import { requireReauth } from "#server/utils/reauth-runtime";

const ForceReconsentSchema = z
  .object({
    consent_type: z.enum(["terms", "privacy", "child_data"]),
    notice: z.string().min(20).max(500),
    reason: z.string().min(20).max(500),
    expected_requirement_at: z.string().nullable().optional(),
    confirm_deployed: z.literal(true),
    confirm_all_users: z.literal(true),
  })
  .strict();

type ForceReconsentInput = z.input<typeof ForceReconsentSchema>;

export default defineEventHandler(async (event) => {
  const superAdminSession = requireSuperAdminSession(event);
  const managerId = Number(superAdminSession.manager_id);

  // Require superadmin reauth ≤ 5 min (BR-LCA-01)
  requireReauth(event);

  const eventBody = (event.context as { body?: ForceReconsentInput })?.body;
  const rawBody =
    eventBody || ((await readBody(event)) as ForceReconsentInput) || {};

  const parsed = ForceReconsentSchema.safeParse(rawBody);
  if (!parsed.success) {
    throw new ValidationError("Dữ liệu yêu cầu tái đồng ý không hợp lệ.");
  }

  const {
    consent_type: consentType,
    notice,
    reason,
    expected_requirement_at: expectedRequirementAt,
  } = parsed.data;

  let expectedMarkerIso: string | null = null;
  if (
    typeof expectedRequirementAt === "string" &&
    expectedRequirementAt.trim().length > 0
  ) {
    const parsedExpectedDate = new Date(expectedRequirementAt);
    if (Number.isNaN(parsedExpectedDate.getTime())) {
      throw new ValidationError("Mốc yêu cầu dự kiến không hợp lệ.");
    }
    expectedMarkerIso = parsedExpectedDate.toISOString();
  }

  const ipAddress = getVerifiedRemoteIp(event);
  const userAgent = getHeader(event, "user-agent") || "unknown";

  const db = getOwnerDb();

  // In single transaction: lock & compare marker, advance DB marker, insert audit_logs, and count affected users
  const result = await db.transaction(async (tx) => {
    await tx
      .insert(consentRequirements)
      .values({ consentType })
      .onConflictDoNothing({ target: consentRequirements.consentType });

    const [currentReq] = await tx
      .select()
      .from(consentRequirements)
      .where(eq(consentRequirements.consentType, consentType))
      .for("update");

    const currentMarkerIso = currentReq?.reconsentRequiredAt
      ? currentReq.reconsentRequiredAt.toISOString()
      : null;

    if (currentMarkerIso !== expectedMarkerIso) {
      throw new ConsentRequirementChangedError();
    }

    const [updatedReq] = await tx
      .update(consentRequirements)
      .set({
        reconsentRequiredAt: sql`GREATEST(clock_timestamp(), COALESCE(${consentRequirements.reconsentRequiredAt} + interval '1 millisecond', clock_timestamp()))`,
        notice,
        updatedAt: sql`clock_timestamp()`,
      })
      .where(eq(consentRequirements.consentType, consentType))
      .returning({
        reconsentRequiredAt: consentRequirements.reconsentRequiredAt,
        updatedAt: consentRequirements.updatedAt,
      });

    const newMarkerDate = updatedReq?.reconsentRequiredAt ?? new Date();
    const newMarkerIso = newMarkerDate.toISOString();

    await tx.insert(auditLogs).values({
      actorType: "manager",
      actorId: managerId,
      action: "legal_reconsent_forced",
      entityType: "consent_requirement",
      entityId: consentType,
      beforeData: {
        consent_type: consentType,
        reconsent_required_at: currentMarkerIso,
        notice: currentReq?.notice ?? null,
      },
      afterData: {
        consent_type: consentType,
        reconsent_required_at: newMarkerIso,
        notice,
      },
      reason,
      ipAddress,
      userAgent,
      createdAt: updatedReq?.updatedAt ?? newMarkerDate,
    });

    const [countRow] = await tx
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(users)
      .where(
        and(
          ne(users.status, "deleted"),
          sql`NOT EXISTS (
            SELECT 1 FROM (
              SELECT ${consentLogs.action} AS action, ${consentLogs.createdAt} AS created_at
              FROM ${consentLogs}
              WHERE ${consentLogs.userId} = ${users.id}
                AND ${consentLogs.consentType} = ${consentType}
              ORDER BY ${consentLogs.createdAt} DESC, ${consentLogs.id} DESC
              LIMIT 1
            ) latest
            WHERE latest.action = 'accepted'
              AND latest.created_at >= ${newMarkerIso}::timestamptz
          )`
        )
      );

    return {
      requirementAtIso: newMarkerIso,
      affectedUserCount: Number(countRow?.count ?? 0),
    };
  });

  await bumpGlobalConsentEpoch();

  setResponseStatus(event, 201);
  return {
    consent_type: consentType,
    requirement_at: result.requirementAtIso,
    reconsent_required_at: result.requirementAtIso,
    affected_user_count: result.affectedUserCount,
    notice,
  };
});
