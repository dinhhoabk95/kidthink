/**
 * Payment & Entitlement Configuration Constants
 * (Single Source of Truth across services, workers, and tests)
 */
export const SOFT_UNLOCK_DAYS = 3;
export const ORDER_PENDING_TTL_HOURS = 48;
export const PROOF_SIGNED_URL_TTL_MINUTES = 15;
export const PROOF_MAX_IMAGE_SIZE_BYTES = 1_572_864; // 1,5 MB — D1 giới hạn ~2 MB/dòng (BR-IMG-14)
export const PROOF_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export const MAX_BONUS_DAYS = 30;
export const MIN_ADMIN_NOTE_LENGTH = 10;
export const ORDER_LIST_PAGE_LIMIT_MAX = 100;
