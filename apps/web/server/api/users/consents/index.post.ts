import {
  childProfiles,
  consentLogs,
  consentRequirements,
  entitlements,
  getOwnerDb,
} from "@mindkid/db";
import { ConsentRequirementChangedError } from "@mindkid/errors/account";
import { ValidationError } from "@mindkid/errors/common";
import { and, asc, count, eq, gt, inArray, isNull, or, sql } from "drizzle-orm";
import { defineEventHandler, getHeader, readBody, setResponseStatus } from "h3";
import { z } from "zod";

import {
  getVerifiedRemoteIp,
  requireWebUserSession,
} from "#server/utils/auth-runtime";
import { invalidateUserConsentCache } from "#server/utils/consent-guard";

const SubmitConsentSchema = z
  .object({
    consent_type: z.enum(["terms", "privacy", "child_data"]),
    requirement_at: z.string().nullable().optional(),
    accept: z.literal(true),
  })
  .strict();

type RawConsentBody =
  | Record<string, string | number | boolean | null | undefined>
  | null
  | undefined;

type ConsentTx = Parameters<
  Parameters<ReturnType<typeof getOwnerDb>["transaction"]>[0]
>[0];

async function restoreArchivedChildrenOnConsent(
  tx: ConsentTx,
  userId: number
): Promise<void> {
  let maxAllowedChildren = 1;
  const activeEntitlements = await tx
    .select({ key: entitlements.entitlementKey })
    .from(entitlements)
    .where(
      and(
        eq(entitlements.userId, userId),
        eq(entitlements.status, "active"),
        or(
          isNull(entitlements.expiresAt),
          gt(entitlements.expiresAt, new Date())
        )
      )
    );
  const keys = new Set(activeEntitlements.map((row) => row.key));
  if (keys.has("play_premium_games")) {
    maxAllowedChildren = 5;
  } else if (keys.has("play_standard_games")) {
    maxAllowedChildren = 3;
  }

  const [activeChildRow] = await tx
    .select({ value: count() })
    .from(childProfiles)
    .where(
      and(eq(childProfiles.userId, userId), eq(childProfiles.status, "active"))
    );
  const activeCount = Number(activeChildRow?.value ?? 0);
  const remainingSlots = Math.max(0, maxAllowedChildren - activeCount);
  if (remainingSlots <= 0) {
    return;
  }

  const archivedChildren = await tx
    .select({ id: childProfiles.id })
    .from(childProfiles)
    .where(
      and(
        eq(childProfiles.userId, userId),
        eq(childProfiles.status, "archived")
      )
    )
    .orderBy(
      sql`case when ${childProfiles.purgeAt} is not null then 0 else 1 end`,
      asc(childProfiles.id)
    )
    .limit(remainingSlots);

  const idsToRestore = archivedChildren.map((c) => c.id);
  if (idsToRestore.length > 0) {
    await tx
      .update(childProfiles)
      .set({
        status: "active",
        purgeAt: null,
        updatedAt: sql`clock_timestamp()`,
      })
      .where(
        and(
          eq(childProfiles.userId, userId),
          inArray(childProfiles.id, idsToRestore)
        )
      );
  }
}

export default defineEventHandler(async (event) => {
  const userSession = requireWebUserSession(event);
  const userId = Number(userSession.user_id);

  const eventBody = (event.context as { body?: RawConsentBody })?.body;
  const rawBody: RawConsentBody =
    eventBody ||
    (await readBody<RawConsentBody>(event).catch(() => null)) ||
    {};

  const parsed = SubmitConsentSchema.safeParse(rawBody);
  if (!parsed.success) {
    throw new ValidationError("Dữ liệu đồng ý không hợp lệ.");
  }

  const { consent_type: consentType, requirement_at: clientReqAt } =
    parsed.data;

  const ipAddress = getVerifiedRemoteIp(event);
  const userAgent = getHeader(event, "user-agent") || "unknown";

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
      throw new ConsentRequirementChangedError();
    }

    // BR-CSM-01 & BR-CSM-07: INSERT-only into consent_logs
    const [inserted] = await tx
      .insert(consentLogs)
      .values({
        userId,
        consentType,
        action: "accepted",
        ipAddress,
        userAgent,
        createdAt: sql`clock_timestamp()`,
      })
      .returning({ createdAt: consentLogs.createdAt });

    // BR-CSM-08: If re-consenting to child_data within 30 days, restore archived child profiles up to quota
    if (consentType === "child_data") {
      await restoreArchivedChildrenOnConsent(tx, userId);
    }

    const acceptedAt = (inserted?.createdAt ?? new Date()).toISOString();

    return {
      consent_type: consentType,
      accepted_at: acceptedAt,
      status: "active" as const,
    };
  });

  await invalidateUserConsentCache(userId);

  setResponseStatus(event, 201);
  return result;
});
