import { appError } from "@kidthink/auth";
import { consentLogs, getOwnerDb } from "@kidthink/db";
import { CONSENT_POLICY_MAP, type ConsentType } from "@kidthink/shared";
import { and, desc, eq, or } from "drizzle-orm";

/**
 * BR-CSM-04 & D-II: Guard attached ONLY to child profile creation route,
 * verifying that the user has consented to the current policy version.
 * Read routes (reports, dashboard, history) are strictly NOT blocked by this guard.
 */
export async function requireCurrentConsent(
  userId: number,
  type: ConsentType = "child_data"
): Promise<void> {
  const db = getOwnerDb();
  const meta = CONSENT_POLICY_MAP[type];

  const [latestLog] = await db
    .select()
    .from(consentLogs)
    .where(
      and(
        eq(consentLogs.userId, userId),
        type === "child_data"
          ? or(
              eq(consentLogs.consentType, "child_data"),
              eq(consentLogs.consentType, "child_data_withdrawn")
            )
          : eq(consentLogs.consentType, type)
      )
    )
    .orderBy(desc(consentLogs.createdAt))
    .limit(1);

  if (!latestLog || latestLog.consentType === "child_data_withdrawn") {
    throw appError("CONSENT_REQUIRED");
  }

  if (latestLog.policyVersion !== meta.currentVersion) {
    throw appError("CONSENT_REQUIRED", {
      reason:
        "Chính sách đã cập nhật phiên bản mới. Vui lòng xem và đồng ý trước khi tạo hồ sơ trẻ.",
      stale_version: latestLog.policyVersion,
      current_version: meta.currentVersion,
    });
  }
}
