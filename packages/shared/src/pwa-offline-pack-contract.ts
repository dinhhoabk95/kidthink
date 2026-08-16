import { z } from "zod";

// ============================================================================
// 1. PWA Manifest & Install Prompt Invariants (BR-PWA)
// ============================================================================

export const PWA_MIN_COMPLETED_SESSIONS = 3;
export const PWA_MIN_CHILD_PROFILES = 1;
export const PWA_DISMISS_COOLDOWN_DAYS = 30;
export const PWA_MAX_DISMISSALS = 2;

export const PwaInstallStateSchema = z.object({
  dismissed_count: z.number().int().min(0),
  last_dismissed_at: z.string().datetime().nullable(),
});

export type PwaInstallState = z.infer<typeof PwaInstallStateSchema>;

export function canPromptPwaInstall(params: {
  isAdultSurface: boolean;
  childCount: number;
  completedSessionCount: number;
  installState: PwaInstallState;
  isStandalone: boolean;
  now?: Date;
}): boolean {
  // BR-PWA-01 & BR-PWA-02: NEVER prompt on kid surface or non-adult surface
  if (!params.isAdultSurface) {
    return false;
  }

  // Already installed in standalone mode
  if (params.isStandalone) {
    return false;
  }

  // BR-PWA-05: 2 dismissals = never prompt again
  if (params.installState.dismissed_count >= PWA_MAX_DISMISSALS) {
    return false;
  }

  // 30-day cooldown if dismissed once
  if (
    params.installState.dismissed_count > 0 &&
    params.installState.last_dismissed_at
  ) {
    const nowTime = params.now ? params.now.getTime() : Date.now();
    const lastDismissedTime = new Date(
      params.installState.last_dismissed_at
    ).getTime();
    const daysSinceDismiss =
      (nowTime - lastDismissedTime) / (1000 * 60 * 60 * 24);
    if (daysSinceDismiss < PWA_DISMISS_COOLDOWN_DAYS) {
      return false;
    }
  }

  // BR-PWA-03: Prompt only after real usage (≥1 child profile & ≥3 sessions)
  return (
    params.childCount >= PWA_MIN_CHILD_PROFILES &&
    params.completedSessionCount >= PWA_MIN_COMPLETED_SESSIONS
  );
}

// ============================================================================
// 2. Offline Curriculum Pack & Integrity Contracts (BR-OCP)
// ============================================================================

export const OFFLINE_PACK_CACHE_NAME = "kidthink-offline-pack-v1";
export const OFFLINE_PACK_MAX_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB max per pack

export const OfflineSyncEventItemSchema = z.object({
  session_uuid: z.string().uuid(),
  seq: z.number().int().min(1),
  event_name: z.string().min(1),
  occurred_at_ms: z.number().int().nonnegative().optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
  client_timestamp: z.string().optional(),
});

export type OfflineSyncEventItem = z.infer<typeof OfflineSyncEventItemSchema>;

export const OfflineSyncRequestSchema = z.object({
  events: z.array(OfflineSyncEventItemSchema).min(1).max(200),
});

export type OfflineSyncRequest = z.infer<typeof OfflineSyncRequestSchema>;

export const OfflineSyncResponseSchema = z.object({
  synced_count: z.number().int().min(0),
  duplicates_skipped: z.number().int().min(0),
});

export type OfflineSyncResponse = z.infer<typeof OfflineSyncResponseSchema>;

export interface StorageQuotaEstimate {
  quotaBytes: number;
  usageBytes: number;
  availableBytes: number;
}

export function validateStorageQuotaForPack(params: {
  packSizeBytes: number;
  availableStorageBytes: number;
  warningBufferMb?: number;
}): { sufficient: boolean; requiredWithBufferBytes: number } {
  const bufferMb = params.warningBufferMb ?? 50;
  const bufferBytes = bufferMb * 1024 * 1024;
  const requiredWithBufferBytes = params.packSizeBytes + bufferBytes;
  const sufficient = params.availableStorageBytes >= requiredWithBufferBytes;
  return { sufficient, requiredWithBufferBytes };
}
