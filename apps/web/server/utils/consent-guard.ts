import { deleteCached, getCached, setCached } from "@mindkid/cache";
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

export interface CachedConsentRecord {
  terms: boolean;
  privacy: boolean;
  epoch: number;
}

export const CONSENT_CACHE_TTL_SECONDS = 300;
export const GLOBAL_CONSENT_EPOCH_CACHE_KEY = "consent:global:epoch";

export async function getGlobalConsentEpoch(): Promise<number> {
  try {
    const epoch = await getCached<number>(GLOBAL_CONSENT_EPOCH_CACHE_KEY);
    return typeof epoch === "number" ? epoch : 0;
  } catch {
    return 0;
  }
}

export async function bumpGlobalConsentEpoch(): Promise<number> {
  const newEpoch = Date.now();
  try {
    await setCached<number>(
      GLOBAL_CONSENT_EPOCH_CACHE_KEY,
      newEpoch,
      30 * 86_400
    );
  } catch {
    // Non-blocking
  }
  return newEpoch;
}

export function getConsentCacheKey(userId: number): string {
  return `user:consent:${userId}`;
}

export async function invalidateUserConsentCache(
  userId: number
): Promise<void> {
  const cacheKey = getConsentCacheKey(userId);
  try {
    await deleteCached(cacheKey);
  } catch {
    // Non-blocking cache delete failure
  }
}

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
 * Uses Valkey cache with 300s TTL and falls back to parallel DB queries.
 */
export async function assertUserTermsAndPrivacyConsent(
  userId: number
): Promise<void> {
  const cacheKey = getConsentCacheKey(userId);
  const currentEpoch = await getGlobalConsentEpoch();
  try {
    const cached = await getCached<CachedConsentRecord>(cacheKey);
    if (cached?.terms && cached.privacy && cached.epoch === currentEpoch) {
      return;
    }
  } catch {
    // Non-blocking cache read failure
  }

  await Promise.all([
    requireConsentActive(userId, "terms"),
    requireConsentActive(userId, "privacy"),
  ]);

  try {
    await setCached<CachedConsentRecord>(
      cacheKey,
      { terms: true, privacy: true, epoch: currentEpoch },
      CONSENT_CACHE_TTL_SECONDS
    );
  } catch {
    // Non-blocking cache write failure
  }
}
