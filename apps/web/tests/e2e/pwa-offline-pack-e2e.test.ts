import fs from "node:fs";
import path from "node:path";
import {
  canPromptPwaInstall,
  isOfflinePackLeaseValid,
  validateStorageQuotaForPack,
} from "@kidthink/shared";
import { describe, expect, it } from "vitest";

describe("PWA Install & Offline Curriculum Pack E2E Verification (BR-PWA, BR-OCP, BR-OFF)", () => {
  function getPublicPath(file: string): string {
    return path.resolve(import.meta.dirname, "../../public", file);
  }

  describe("Manifest Contract & Configuration (BR-PWA-04)", () => {
    it("manifest.webmanifest exists and defines standalone display, /me start_url, and icons", () => {
      const manifestPath = getPublicPath("manifest.webmanifest");
      expect(fs.existsSync(manifestPath)).toBe(true);

      const content = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      expect(content.name).toBe("KidThink");
      expect(content.short_name).toBe("KidThink");
      expect(content.start_url).toBe("/me"); // BR-PWA-04: start_url is adult surface
      expect(content.display).toBe("standalone");
      expect(content.scope).toBe("/");
      expect(content.icons.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Service Worker Cache Storage & Safety Isolation (BR-OFF-07, BR-OCP-03, D-P5OFF-C)", () => {
    it("sw.js defines offline pack cache and isolates API routes from unintentional caching", () => {
      const swPath = getPublicPath("sw.js");
      expect(fs.existsSync(swPath)).toBe(true);

      const swContent = fs.readFileSync(swPath, "utf-8");
      expect(swContent).toContain("kidthink-offline-pack-v1");
      expect(swContent).toContain('url.pathname.startsWith("/api/")');
      expect(swContent).toContain("fetch(event.request)");
      expect(swContent).toContain("CACHE_SHELL");
      expect(swContent).toContain("clients.claim()");
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
});
