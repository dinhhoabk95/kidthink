import { auditLogs, consentRequirements, getOwnerDb } from "@mindkid/db";
import { ValidationError } from "@mindkid/errors/common";
import { defineEventHandler, getHeader, readBody } from "h3";
import { z } from "zod";
import {
  assertManagerRequestBodySize,
  getManagerRemoteIp,
  requireSuperAdminSession,
} from "#server/utils/admin-auth-runtime";

import { requireReauth } from "#server/utils/reauth-runtime";

const ForceReconsentSchema = z
  .object({
    consent_type: z.enum(["terms", "privacy", "child_data"]),
    notice: z.string().min(20).max(500),
    reason: z.string().min(20).max(500),
    expected_requirement_at: z.string().nullable().optional(),
    confirm_deployed: z.boolean().optional(),
    confirm_all_users: z.boolean().optional(),
  })
  .strict();

export default defineEventHandler(async (event) => {
  assertManagerRequestBodySize(event, 8 * 1024);
  const superAdminSession = requireSuperAdminSession(event);
  const managerId = Number(superAdminSession.manager_id);

  // Require superadmin reauth ≤ 5 min
  requireReauth(event);

  const eventBody = (event.context as { body?: Record<string, unknown> })?.body;
  const rawBody =
    eventBody || ((await readBody(event)) as Record<string, unknown>) || {};

  const parsed = ForceReconsentSchema.safeParse(rawBody);
  if (!parsed.success) {
    throw new ValidationError("Dữ liệu yêu cầu tái đồng ý không hợp lệ.");
  }

  const { consent_type: consentType, notice, reason } = parsed.data;

  const ipAddress = getManagerRemoteIp(event);
  const userAgent = getHeader(event, "user-agent") || "unknown";
  const now = new Date();

  const db = getOwnerDb();

  // In single transaction: update consent_requirements & insert audit_logs
  await db.transaction(async (tx) => {
    await tx
      .insert(consentRequirements)
      .values({
        consentType,
        reconsentRequiredAt: now,
        notice,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: consentRequirements.consentType,
        set: {
          reconsentRequiredAt: now,
          notice,
          updatedAt: now,
        },
      });

    await tx.insert(auditLogs).values({
      actorType: "manager",
      actorId: managerId,
      action: "legal_reconsent_forced",
      entityType: "consent_requirement",
      entityId: consentType,
      afterData: {
        consent_type: consentType,
        notice,
      },
      reason,
      ipAddress,
      userAgent,
      createdAt: now,
    });
  });

  return {
    consent_type: consentType,
    reconsent_required_at: now.toISOString(),
    notice,
  };
});
