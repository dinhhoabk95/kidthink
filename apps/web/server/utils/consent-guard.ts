import { consentLogs, consentRequirements, getOwnerDb } from "@mindkid/db";
import { ConsentRequiredError } from "@mindkid/errors/account";
import type { ConsentType } from "@mindkid/shared";
import { and, desc, eq } from "drizzle-orm";

/**
 * Closed allow-list of exempt paths when terms or privacy requires re-consent (D-QX, BR-CSM-05).
 * All other /api/users/** routes must return 428 CONSENT_REQUIRED.
 */
const EXEMPT_PATH_PREFIXES = [
  "/api/guest/",
  "/api/managers/",
  "/api/users/consents",
  "/api/users/auth/reauth",
  "/api/users/auth/logout",
  "/api/users/auth/logout-all",
  "/api/users/auth/me",
  "/api/users/auth/session",
  "/api/users/data-export",
  "/api/users/account/delete",
];

const CONSENT_NAMES: Record<ConsentType, string> = {
  terms: "điều khoản dịch vụ",
  privacy: "chính sách quyền riêng tư",
  child_data: "chính sách bảo vệ dữ liệu trẻ em",
};

export function isAllowedConsentExemptPath(pathname: string): boolean {
  return EXEMPT_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix)
  );
}

/**
 * Verifies that the user has an active consent for the given type.
 * Throws 428 CONSENT_REQUIRED if missing, withdrawn, or older than the requirement marker.
 */
export async function requireConsentActive(
  userId: number,
  type: ConsentType
): Promise<void> {
  const db = getOwnerDb();

  const [latestLog, req] = await Promise.all([
    db
      .select()
      .from(consentLogs)
      .where(
        and(eq(consentLogs.userId, userId), eq(consentLogs.consentType, type))
      )
      .orderBy(desc(consentLogs.createdAt), desc(consentLogs.id))
      .limit(1)
      .then((rows) => rows[0]),
    db
      .select()
      .from(consentRequirements)
      .where(eq(consentRequirements.consentType, type))
      .limit(1)
      .then((rows) => rows[0]),
  ]);

  if (!latestLog || latestLog.action === "withdrawn") {
    const consentName = CONSENT_NAMES[type] || "văn bản pháp lý";
    throw new ConsentRequiredError({
      reason: `Chưa đồng ý với ${consentName}.`,
      consent_type: type,
    });
  }

  if (
    req?.reconsentRequiredAt &&
    latestLog.createdAt.getTime() < req.reconsentRequiredAt.getTime()
  ) {
    throw new ConsentRequiredError({
      reason: "Chính sách đã cập nhật yêu cầu tái đồng ý.",
      consent_type: type,
      requirement_at: req.reconsentRequiredAt.toISOString(),
      notice: req.notice,
    });
  }
}

/** Alias for backward compatibility */
export async function requireCurrentConsent(
  userId: number,
  type: ConsentType = "child_data"
): Promise<void> {
  await requireConsentActive(userId, type);
}

/**
 * Verifies both terms and privacy consents are active.
 */
export async function assertUserTermsAndPrivacyConsent(
  userId: number
): Promise<void> {
  await requireConsentActive(userId, "terms");
  await requireConsentActive(userId, "privacy");
}
