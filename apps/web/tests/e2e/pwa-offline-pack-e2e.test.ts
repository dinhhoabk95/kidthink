import fs from "node:fs";
import path from "node:path";
import { ApiError } from "@mindkid/errors/client";
import {
  canPromptPwaInstall,
  isOfflinePackLeaseValid,
  OFFLINE_PACK_CACHE_NAME,
  validateStorageQuotaForPack,
} from "@mindkid/shared";
import { describe, expect, it, vi } from "vitest";
import {
  CLEAR_OFFLINE_PACKS_MESSAGE_TYPE,
  clearOfflinePackClientData,
  SESSION_ASSETS_CACHE_NAME,
  shouldPurgeOfflinePacksOnError,
} from "~/composables/use-offline-pack";

describe("PWA Install & Offline Curriculum Pack E2E Verification (BR-PWA, BR-OCP, BR-OFF)", () => {
  function getPublicPath(file: string): string {
    return path.resolve(import.meta.dirname, "../../public", file);
  }

  describe("Manifest Contract & Configuration (BR-PWA-04)", () => {
    it("manifest.webmanifest exists and defines standalone display, /me start_url, and icons", () => {
      const manifestPath = getPublicPath("manifest.webmanifest");
      expect(fs.existsSync(manifestPath)).toBe(true);

      const content = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      expect(content.name).toBe("MindKid");
      expect(content.short_name).toBe("MindKid");
      expect(content.start_url).toBe("/me"); // BR-PWA-04: start_url is adult surface
      expect(content.display).toBe("standalone");
      expect(content.scope).toBe("/");
      expect(content.icons.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Service Worker Cache Storage & Safety Isolation (BR-OFF-07, BR-OCP-03, BR-OCP-05, D-P5OFF-C)", () => {
    it("sw.js defines offline pack cache, isolates API routes, and handles CLEAR_OFFLINE_PACKS message", () => {
      const swPath = getPublicPath("sw.js");
      expect(fs.existsSync(swPath)).toBe(true);

      const swContent = fs.readFileSync(swPath, "utf-8");
      expect(swContent).toContain("mindkid-offline-pack-v1");
      expect(swContent).toContain('url.pathname.startsWith("/api/")');
      expect(swContent).toContain("fetch(event.request)");
      expect(swContent).toContain("CACHE_SHELL");
      expect(swContent).toContain("clients.claim()");
      expect(swContent).toContain("CLEAR_OFFLINE_PACKS");
      expect(swContent).toContain("caches.delete(CACHE_OFFLINE_PACK)");
    });
  });

  describe("Install Prompt Lifecycle & Surface Gating (BR-PWA-01..05)", () => {
    it("BR-PWA-01 & BR-PWA-02: strictly prohibits install prompts on child surfaces (/play)", () => {
      const isAllowed = canPromptPwaInstall({
        isAdultSurface: false,
        childCount: 1,
        completedSessionCount: 10,
        installState: { dismissed_count: 0, last_dismissed_at: null },
        isStandalone: false,
      });
      expect(isAllowed).toBe(false);
    });

    it("BR-PWA-03: requires ≥1 child profile and ≥3 completed sessions on adult surface (/me)", () => {
      // 0 children -> false
      expect(
        canPromptPwaInstall({
          isAdultSurface: true,
          childCount: 0,
          completedSessionCount: 5,
          installState: { dismissed_count: 0, last_dismissed_at: null },
          isStandalone: false,
        })
      ).toBe(false);

      // 2 sessions -> false
      expect(
        canPromptPwaInstall({
          isAdultSurface: true,
          childCount: 1,
          completedSessionCount: 2,
          installState: { dismissed_count: 0, last_dismissed_at: null },
          isStandalone: false,
        })
      ).toBe(false);

      // 1 child, 3 sessions -> true
      expect(
        canPromptPwaInstall({
          isAdultSurface: true,
          childCount: 1,
          completedSessionCount: 3,
          installState: { dismissed_count: 0, last_dismissed_at: null },
          isStandalone: false,
        })
      ).toBe(true);
    });

    it("BR-PWA-05: terminates prompt invitations after 2 dismissals", () => {
      expect(
        canPromptPwaInstall({
          isAdultSurface: true,
          childCount: 2,
          completedSessionCount: 10,
          installState: {
            dismissed_count: 2,
            last_dismissed_at: new Date().toISOString(),
          },
          isStandalone: false,
        })
      ).toBe(false);
    });
  });

  describe("Offline Pack Lease & Storage Quota Bounds (BR-OCP-01, BR-OCP-07)", () => {
    it("BR-OCP-01: validates lease token validity within 7 days", () => {
      const now = new Date("2026-08-16T08:00:00Z");
      const active7DaysLease = new Date(
        now.getTime() + 7 * 24 * 60 * 60 * 1000
      ).toISOString();
      const expiredLease = new Date(now.getTime() - 1000).toISOString();

      expect(isOfflinePackLeaseValid(active7DaysLease, now)).toBe(true);
      expect(isOfflinePackLeaseValid(expiredLease, now)).toBe(false);
    });

    it("BR-OCP-07: preflights storage budget requiring 50 MB buffer headroom", () => {
      const packSizeBytes = 25 * 1024 * 1024; // 25 MB
      const result = validateStorageQuotaForPack({
        packSizeBytes,
        availableStorageBytes: 80 * 1024 * 1024, // 80 MB available (needs 75 MB)
      });
      expect(result.sufficient).toBe(true);
      expect(result.requiredWithBufferBytes).toBe(75 * 1024 * 1024);
    });
  });

  describe("Offline Pack Cleanup on Logout or Entitlement Revocation (BR-OCP-05)", () => {
    it("BR-OCP-05 (ca âm): xoá sạch CacheStorage (caches.has === false), IndexedDB store và gửi postMessage tới Service Worker khi đăng xuất", async () => {
      const activeCaches = new Set<string>([
        OFFLINE_PACK_CACHE_NAME,
        SESSION_ASSETS_CACHE_NAME,
        "shell-v1",
      ]);
      const cachesMock = {
        has: (name: string) => Promise.resolve(activeCaches.has(name)),
        delete: (name: string) => {
          const existed = activeCaches.delete(name);
          return Promise.resolve(existed);
        },
      };

      let storedEventsCount = 4;
      const indexedDbStorageMock = {
        clear: () => {
          storedEventsCount = 0;
          return Promise.resolve();
        },
      };

      const postMessageMock = vi.fn();
      const swContainerMock = {
        controller: {
          postMessage: postMessageMock,
        },
      };

      expect(await cachesMock.has(OFFLINE_PACK_CACHE_NAME)).toBe(true);
      expect(storedEventsCount).toBe(4);

      const result = await clearOfflinePackClientData({
        reason: "logout",
        cachesApi: cachesMock,
        indexedDbStorage: indexedDbStorageMock,
        serviceWorkerContainer: swContainerMock,
      });

      expect(result).toEqual({
        cacheDeleted: true,
        indexedDbCleared: true,
        serviceWorkerNotified: true,
      });
      expect(await cachesMock.has(OFFLINE_PACK_CACHE_NAME)).toBe(false);
      expect(await cachesMock.has(SESSION_ASSETS_CACHE_NAME)).toBe(false);
      expect(await cachesMock.has("shell-v1")).toBe(true);
      expect(storedEventsCount).toBe(0);
      expect(postMessageMock).toHaveBeenCalledWith({
        type: CLEAR_OFFLINE_PACKS_MESSAGE_TYPE,
        reason: "logout",
      });
    });

    it("BR-OCP-05 (ca âm): phát hiện lỗi thu hồi quyền lợi (403 ENTITLEMENT_REQUIRED / TIER_LOCKED) và hết phiên (401 UNAUTHENTICATED) để kích hoạt dọn gói offline", () => {
      const revokedErr = new ApiError({
        code: "ENTITLEMENT_REQUIRED",
        statusCode: 403,
        message: "Quyền lợi gói học đã bị thu hồi",
      });
      const unauthErr = new ApiError({
        code: "UNAUTHENTICATED",
        statusCode: 401,
        message: "Phiên đăng nhập đã hết hạn",
      });
      const validationErr = new ApiError({
        code: "VALIDATION_FAILED",
        statusCode: 422,
        message: "Tuần không hợp lệ",
      });

      expect(shouldPurgeOfflinePacksOnError(revokedErr)).toBe(true);
      expect(shouldPurgeOfflinePacksOnError(unauthErr)).toBe(true);
      expect(shouldPurgeOfflinePacksOnError(validationErr)).toBe(false);
      expect(shouldPurgeOfflinePacksOnError(null)).toBe(false);
    });
  });
});
