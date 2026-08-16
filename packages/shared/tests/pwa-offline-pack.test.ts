import { describe, expect, it } from "vitest";
import {
  canPromptPwaInstall,
  isOfflinePackLeaseValid,
  OfflineCurriculumPackManifestSchema,
  OfflineSyncRequestSchema,
  PWA_DISMISS_COOLDOWN_DAYS,
  PWA_MAX_DISMISSALS,
  PWA_MIN_CHILD_PROFILES,
  PWA_MIN_COMPLETED_SESSIONS,
  type PwaInstallState,
  validateStorageQuotaForPack,
} from "../src/index.js";

describe("PWA Install & Offline Pack Contract (BR-PWA, BR-OCP, BR-OFF)", () => {
  describe("PWA Install Rules (BR-PWA-01..05)", () => {
    const baseState: PwaInstallState = {
      dismissed_count: 0,
      last_dismissed_at: null,
    };

    it("BR-PWA-01 & BR-PWA-02: denies install prompt on kid surface (/play) or non-adult surface", () => {
      const allowed = canPromptPwaInstall({
        isAdultSurface: false,
        childCount: 1,
        completedSessionCount: 5,
        installState: baseState,
        isStandalone: false,
      });
      expect(allowed).toBe(false);
    });

    it("denies install prompt if already running in standalone mode", () => {
      const allowed = canPromptPwaInstall({
        isAdultSurface: true,
        childCount: 1,
        completedSessionCount: 5,
        installState: baseState,
        isStandalone: true,
      });
      expect(allowed).toBe(false);
    });

    it("BR-PWA-03: denies install prompt if user has < 1 child profile or < 3 completed sessions", () => {
      // 0 children, 5 sessions
      expect(
        canPromptPwaInstall({
          isAdultSurface: true,
          childCount: 0,
          completedSessionCount: 5,
          installState: baseState,
          isStandalone: false,
        })
      ).toBe(false);

      // 1 child, 2 sessions
      expect(
        canPromptPwaInstall({
          isAdultSurface: true,
          childCount: 1,
          completedSessionCount: 2,
          installState: baseState,
          isStandalone: false,
        })
      ).toBe(false);

      // 1 child, 3 sessions -> allowed!
      expect(
        canPromptPwaInstall({
          isAdultSurface: true,
          childCount: PWA_MIN_CHILD_PROFILES,
          completedSessionCount: PWA_MIN_COMPLETED_SESSIONS,
          installState: baseState,
          isStandalone: false,
        })
      ).toBe(true);
    });

    it("BR-PWA-05: denies install prompt after 2 dismissals", () => {
      const dismissedTwice: PwaInstallState = {
        dismissed_count: PWA_MAX_DISMISSALS,
        last_dismissed_at: new Date(
          Date.now() - 40 * 24 * 60 * 60 * 1000
        ).toISOString(),
      };

      const allowed = canPromptPwaInstall({
        isAdultSurface: true,
        childCount: 2,
        completedSessionCount: 10,
        installState: dismissedTwice,
        isStandalone: false,
      });
      expect(allowed).toBe(false);
    });

    it("enforces 30-day cooldown if dismissed once", () => {
      const now = new Date("2026-08-16T12:00:00Z");

      // 10 days ago (within 30 days) -> denied
      const dismissedRecently: PwaInstallState = {
        dismissed_count: 1,
        last_dismissed_at: new Date(
          now.getTime() - 10 * 24 * 60 * 60 * 1000
        ).toISOString(),
      };
      expect(
        canPromptPwaInstall({
          isAdultSurface: true,
          childCount: 1,
          completedSessionCount: 5,
          installState: dismissedRecently,
          isStandalone: false,
          now,
        })
      ).toBe(false);

      // 35 days ago (> 30 days) -> allowed
      const dismissedLongAgo: PwaInstallState = {
        dismissed_count: 1,
        last_dismissed_at: new Date(
          now.getTime() - (PWA_DISMISS_COOLDOWN_DAYS + 5) * 24 * 60 * 60 * 1000
        ).toISOString(),
      };
      expect(
        canPromptPwaInstall({
          isAdultSurface: true,
          childCount: 1,
          completedSessionCount: 5,
          installState: dismissedLongAgo,
          isStandalone: false,
          now,
        })
      ).toBe(true);
    });
  });

  describe("Offline Pack Lease & Storage Rules (BR-OCP-01..07)", () => {
    it("BR-OCP-01: verifies offline pack lease validity", () => {
      const now = new Date("2026-08-16T12:00:00Z");
      const validFuture = new Date(
        now.getTime() + 7 * 24 * 60 * 60 * 1000
      ).toISOString();
      const expiredPast = new Date(
        now.getTime() - 1 * 24 * 60 * 60 * 1000
      ).toISOString();

      expect(isOfflinePackLeaseValid(validFuture, now)).toBe(true);
      expect(isOfflinePackLeaseValid(expiredPast, now)).toBe(false);
    });

    it("BR-OCP-07: validates storage quota with buffer requirement", () => {
      const packSize = 25 * 1024 * 1024; // 25 MB
      const buffer = 50 * 1024 * 1024; // 50 MB

      // Only 60 MB available (needs 75 MB) -> insufficient
      const res1 = validateStorageQuotaForPack({
        packSizeBytes: packSize,
        availableStorageBytes: 60 * 1024 * 1024,
      });
      expect(res1.sufficient).toBe(false);
      expect(res1.requiredWithBufferBytes).toBe(packSize + buffer);

      // 100 MB available -> sufficient
      const res2 = validateStorageQuotaForPack({
        packSizeBytes: packSize,
        availableStorageBytes: 100 * 1024 * 1024,
      });
      expect(res2.sufficient).toBe(true);
    });

    it("BR-OCP-04: validates offline pack manifest schema with checksums", () => {
      const validManifest = {
        pack_id: "PACK-CUR-001-W03",
        curriculum_code: "CUR-001",
        week_number: 3,
        content_version: 1,
        lease_token: "lease_token_abcdef1234567890",
        lease_expires_at: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
        total_size_bytes: 25_000_000,
        assets: [
          {
            path: "/configs/gl-c1-01.json",
            size_bytes: 12_000,
            sha256:
              "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
          },
          {
            path: "/images/apple.webp",
            size_bytes: 45_000,
            sha256:
              "ca978112ca1bbdcafac231b39a23dc4da7860819c1ccb23b5ed5e260bf5a9e3f",
          },
        ],
        manifest_checksum_sha256:
          "5891b5b522d5df086d0ff0b110fbd9d21bb4fc7163af34d08286a2e846f6be03",
      };

      const parsed =
        OfflineCurriculumPackManifestSchema.safeParse(validManifest);
      expect(parsed.success).toBe(true);
    });

    it("validates offline sync request schema with valid sessions", () => {
      const validSyncPayload = {
        events: [
          {
            session_uuid: "7b4df498-8422-487a-8f5b-51ba28bbcb37",
            seq: 1,
            event_name: "game_started",
            occurred_at_ms: 120,
            payload: { template_code: "D1_COUNT" },
          },
          {
            session_uuid: "7b4df498-8422-487a-8f5b-51ba28bbcb37",
            seq: 2,
            event_name: "answer_correct",
            occurred_at_ms: 3500,
            payload: { round_index: 0 },
          },
        ],
      };

      const parsed = OfflineSyncRequestSchema.safeParse(validSyncPayload);
      expect(parsed.success).toBe(true);
    });
  });
});
