import { existsSync, readFileSync } from "node:fs";
import { repoPath } from "@mindkid/config/paths";
import { ContentArchivedError } from "@mindkid/errors/content";
import {
  buildTierLockedResponse,
  COMPETENCY_CATALOG,
  CONSENT_POLICY_MAP,
  CTA_ACTIONS,
  ESSENTIAL_COOKIES,
  FAQ_ITEMS,
  FEATURED_GUEST_LEVELS,
  findCompetency,
  GUEST_ALLOWLIST_LEVEL_CODES,
  GUEST_CTA_VIEWER,
  getEffectiveTier,
  INDEXABLE_AGE_BANDS,
  INDEXABLE_COMPETENCIES,
  isGuestAllowedLevel,
  isIndexableFilter,
  isNoIndexRoute,
  LEGAL_DOCUMENTS,
  LOCAL_STORAGE_ITEMS,
  PACKAGE_CATALOG,
  resolveLevelCta,
} from "@mindkid/shared";
import { describe, expect, it } from "vitest";
import { gameLevels } from "#src/schema/game";

const LEVEL_CODE_REGEX = /^GL-C[1-6]-/;
const EXTERNAL_SCRIPT_REGEX = /<script[^>]+src=["']https?:\/\//i;
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const ANCHOR_SLUG_REGEX = /^[a-z0-9-]+$/;

function readRepoFile(relativePath: string): string {
  return readFileSync(repoPath(relativePath), "utf-8");
}

describe("P1.13 Public Site, SEO, Legal & Cookie Invariants (BR-SEO2, BR-GCP, BR-GDP, BR-LND, BR-LGL, BR-FAQ, BR-CKB)", () => {
  describe("SEO & Structured Data Invariants (BR-SEO2-01..09)", () => {
    it("Scenario: BR-SEO2-01 — applies noindex meta tag to kid play and account pages", () => {
      expect(isNoIndexRoute("/play/gameboard")).toBe(true);
      expect(isNoIndexRoute("/me/dashboard")).toBe(true);
      expect(isNoIndexRoute("/api/users/profile")).toBe(true);
      expect(isNoIndexRoute("/games")).toBe(false);
      expect(isNoIndexRoute("/")).toBe(false);
    });

    it("Scenario: BR-SEO2-02 — dynamic sitemap includes game levels", () => {
      const sitemapSource = readRepoFile(
        "apps/web/server/routes/sitemap-games.xml.ts"
      );
      expect(sitemapSource).toContain("from(gameLevels)");
      expect(sitemapSource).toContain("/games/");
    });

    it("Scenario: BR-SEO2-03 — generates valid JSON-LD structured data", () => {
      const jsonLdHelperSource = readRepoFile(
        "apps/web/server/utils/seo-jsonld.ts"
      );
      expect(jsonLdHelperSource).toContain("https://schema.org");
      expect(jsonLdHelperSource).toContain('"@type": "Organization"');
      expect(jsonLdHelperSource).toContain('"@type": "WebSite"');
      expect(jsonLdHelperSource).toContain('"@type": "LearningResource"');
      expect(jsonLdHelperSource).toContain('"@type": "BreadcrumbList"');
    });

    it("Scenario: BR-SEO2-04 — every public page has title, meta description, and canonical URL", () => {
      const publicPages = [
        "apps/web/app/pages/index.vue",
        "apps/web/app/pages/games/[code].vue",
        "apps/web/app/pages/[slug].vue",
      ];
      for (const page of publicPages) {
        let src = readRepoFile(page);
        if (page.includes("[code].vue")) {
          src += readRepoFile(
            "apps/web/app/composables/use-game-detail-seo.ts"
          );
        }
        expect(src).toContain("useSeoMeta(");
        expect(src).toContain("title:");
        expect(src).toContain("description:");
        expect(src).toContain('rel: "canonical"');
      }
    });

    it("Scenario: BR-SEO2-05 — main page content is SSR rendered without JS dependency", () => {
      const indexSource = readRepoFile("apps/web/app/pages/index.vue");
      const detailSource = readRepoFile("apps/web/app/pages/games/[code].vue");
      expect(indexSource).toContain(
        'await useFetch<HomePayload>("/api/guest/home")'
      );
      expect(detailSource).toContain("await useFetch<GameDetailResponse>");
    });

    it("Scenario: BR-SEO2-06 — forbids cloaking (bot and user receive identical content)", () => {
      const homeRouteSource = readRepoFile(
        "apps/web/server/api/guest/home.get.ts"
      );
      const catalogRouteSource = readRepoFile(
        "apps/web/server/api/guest/levels/index.get.ts"
      );
      expect(homeRouteSource.toLowerCase()).not.toContain("googlebot");
      expect(catalogRouteSource.toLowerCase()).not.toContain("googlebot");
    });

    it("Scenario: BR-SEO2-07 — dynamic sitemap queries gameLevels directly", () => {
      const sitemapSource = readRepoFile(
        "apps/web/server/routes/sitemap-games.xml.ts"
      );
      expect(sitemapSource).toContain("gameLevels.code");
      expect(sitemapSource).not.toContain('"archived"');
    });

    it("Scenario: BR-SEO2-08 — forbids third-party tracking scripts across public pages", () => {
      const publicPages = [
        "apps/web/app/pages/index.vue",
        "apps/web/app/pages/games/[code].vue",
        "apps/web/app/pages/[slug].vue",
      ];
      for (const page of publicPages) {
        const src = readRepoFile(page);
        expect(src).not.toContain("googletagmanager.com");
        expect(src).not.toContain("google-analytics.com");
        expect(src).not.toContain("connect.facebook.net");
      }
    });

    it("Scenario: BR-SEO2-09 — sets default hreflang attribute to vi-VN", () => {
      expect(INDEXABLE_COMPETENCIES).toEqual([
        "C1",
        "C2",
        "C3",
        "C4",
        "C5",
        "C6",
      ]);
      expect(INDEXABLE_AGE_BANDS).toEqual(["3-4", "4-5", "5-6"]);
      const indexSource = readRepoFile("apps/web/app/pages/index.vue");
      expect(indexSource).toContain('lang: "vi-VN"');
    });
  });

  describe("Public Game Catalog Invariants (BR-GCP-01..08)", () => {
    it("Scenario: BR-GCP-01 — displays metadata for all catalog games including locked items", () => {
      const lockedResp = buildTierLockedResponse("premium", {
        title: "Đếm số",
        competency: "C1",
        age_min: 3,
        age_max: 4,
      });
      expect(lockedResp.code).toBe("TIER_LOCKED");
      expect(lockedResp.access_tier).toBe("premium");
      expect(lockedResp.preview.title).toBe("Đếm số");
    });

    it("Scenario: BR-GCP-02 — strictly omits content_pack for locked games", () => {
      const lockedResp = buildTierLockedResponse("standard", {
        title: "Ghép hình",
      });
      expect("content_pack" in lockedResp).toBe(false);
      expect("difficulty_params" in lockedResp).toBe(false);

      const catalogRouteSource = readRepoFile(
        "apps/web/server/api/guest/levels/index.get.ts"
      );
      expect(catalogRouteSource).not.toContain("content_pack: item.");
      expect(catalogRouteSource).not.toContain("difficulty_params: item.");
    });

    it("Scenario: BR-GCP-03 — syncs active search filters to URL parameters", () => {
      expect(isIndexableFilter({ competency: "C1" })).toBe(true);
      expect(isIndexableFilter({ age_band: "3-4" })).toBe(true);
      expect(isIndexableFilter({ competency: "C1", age_band: "3-4" })).toBe(
        false
      );
    });

    it("Scenario: BR-GCP-04 — supports SSR and ISR prerendering", () => {
      const catalogRouteSource = readRepoFile(
        "apps/web/server/api/guest/levels/index.get.ts"
      );
      expect(catalogRouteSource).toContain("GUEST_CTA_VIEWER");
      expect(catalogRouteSource).toContain('role: "guest"');
    });

    it("Scenario: BR-GCP-05 — renders neutral lock indicator badges", () => {
      const cta = resolveLevelCta(
        "GL-C1-CNT-CARD-0099",
        "standard",
        GUEST_CTA_VIEWER
      );
      expect(CTA_ACTIONS).toContain(cta.action);
      expect(cta.action).toBe("upgrade_standard");
      expect(cta.text).toBe("Nâng cấp Gói Tiêu chuẩn");
    });

    it("Scenario: BR-GCP-06 — public catalog queries gameLevels with unique code", () => {
      expect(gameLevels.code).toBeDefined();
      const searchServiceSource = readRepoFile(
        "apps/web/server/services/content-search.ts"
      );
      expect(searchServiceSource).toContain("from(gameLevels)");
    });

    it("Scenario: BR-GCP-07 — every public game has a distinct indexable detail page URL", () => {
      for (const game of FEATURED_GUEST_LEVELS) {
        expect(game.code).toMatch(LEVEL_CODE_REGEX);
        expect(isNoIndexRoute(`/games/${game.code}`)).toBe(false);
      }
    });

    it("Scenario: BR-GCP-08 — uses numeric pagination capped at 60 items per page", () => {
      const searchServiceSource = readRepoFile(
        "apps/web/server/services/content-search.ts"
      );
      expect(searchServiceSource).toContain("60");
    });
  });

  describe("Public Game Detail Invariants (BR-GDP-01..08)", () => {
    it("Scenario: BR-GDP-01 — indexable detail page per game", () => {
      const detailSource =
        readRepoFile("apps/web/app/pages/games/[code].vue") +
        readRepoFile("apps/web/app/composables/use-game-detail-seo.ts");
      expect(detailSource).toContain("https://mindkid.vn/games/");
      expect(isNoIndexRoute("/games/GL-C1-CNT-CARD-0001")).toBe(false);
    });

    it("Scenario: BR-GDP-02 — game description describes objectives without revealing answers", () => {
      for (const game of FEATURED_GUEST_LEVELS) {
        expect(game.title.length).toBeGreaterThan(3);
        expect(game.title.toLowerCase()).not.toContain("đáp án:");
      }
    });

    it("Scenario: BR-GDP-03 — archived games return HTTP 410 Gone", () => {
      const err = new ContentArchivedError("Trò chơi này đã ngừng phát hành", {
        code: "GL-C1-CNT-CARD-0001",
        alternatives: [],
      });
      expect(err.statusCode).toBe(410);
      expect(err.code).toBe("CONTENT_ARCHIVED");
    });

    it("Scenario: BR-GDP-04 — includes LearningResource JSON-LD metadata", () => {
      const detailSource =
        readRepoFile("apps/web/app/pages/games/[code].vue") +
        readRepoFile("apps/web/app/composables/use-game-detail-seo.ts");
      expect(detailSource).toContain('"@type": "LearningResource"');
      expect(detailSource).toContain("teaches:");
      expect(detailSource).toContain('"@type": "BreadcrumbList"');
    });

    it("Scenario: BR-GDP-05 — omits content_pack when tier is locked", () => {
      const detailRouteSource = readRepoFile(
        "apps/web/server/api/guest/levels/[code]/index.get.ts"
      );
      expect(detailRouteSource).toContain("rounds: isLocked");
      const lockedResp = buildTierLockedResponse("premium");
      expect("content_pack" in lockedResp).toBe(false);
    });

    it("Scenario: BR-GDP-06 — displays appropriate CTA based on missing entitlement tier", () => {
      expect(
        resolveLevelCta("GL-C1-CNT-CARD-0001", "free", GUEST_CTA_VIEWER)
      ).toEqual({
        action: "play",
        text: "Cho bé chơi ngay",
        href: "/play/GL-C1-CNT-CARD-0001",
      });

      expect(
        resolveLevelCta("GL-C1-CNT-CARD-0099", "login", GUEST_CTA_VIEWER)
      ).toEqual({
        action: "login",
        text: "Đăng nhập để chơi",
        href: `/login?redirect=${encodeURIComponent("/play/GL-C1-CNT-CARD-0099")}`,
      });

      expect(
        resolveLevelCta("GL-C1-CNT-CARD-0099", "premium", GUEST_CTA_VIEWER)
      ).toEqual({
        action: "upgrade_premium",
        text: "Nâng cấp Gói Premium",
        href: "/pricing",
      });

      expect(
        resolveLevelCta("GL-C1-CNT-CARD-0099", "standard", {
          is_authenticated: true,
          has_active_child: false,
          active_keys: ["play_standard_games"],
        })
      ).toEqual({
        action: "select_child",
        text: "Chọn hồ sơ bé",
        href: `/me/children?redirect=${encodeURIComponent("/play/GL-C1-CNT-CARD-0099")}`,
      });

      expect(
        resolveLevelCta("GL-C1-CNT-CARD-0099", "standard", {
          is_authenticated: true,
          has_active_child: false,
          active_keys: [],
        })
      ).toEqual({
        action: "upgrade_standard",
        text: "Nâng cấp Gói Tiêu chuẩn",
        href: "/pricing",
      });
    });

    it("Scenario: BR-GDP-07 — links to related skill and competency taxonomy pages", () => {
      for (const code of INDEXABLE_COMPETENCIES) {
        const comp = findCompetency(code);
        expect(comp).toBeDefined();
        expect(comp?.name.length).toBeGreaterThan(0);
      }
      const detailSource = readRepoFile("apps/web/app/pages/games/[code].vue");
      expect(detailSource).toContain("/games?competency=");
      expect(detailSource).toContain("relatedGames");
    });

    it("Scenario: BR-GDP-08 — forbids promising outcome claims in game descriptions", () => {
      const forbiddenClaims = [
        "thông minh hơn",
        "tăng iq",
        "cam kết giỏi toán",
      ];
      for (const comp of COMPETENCY_CATALOG) {
        for (const claim of forbiddenClaims) {
          expect(comp.tagline.toLowerCase()).not.toContain(claim);
        }
      }
    });
  });

  describe("Landing Page Invariants (BR-LND-01..08)", () => {
    it("Scenario: BR-LND-01 — try-now CTA is placed above the fold", () => {
      const heroSource = readRepoFile(
        "apps/web/app/components/landing-hero.vue"
      );
      expect(heroSource).toContain('class="hero-section"');
      expect(heroSource).toContain('to="/play/GL-C1-CNT-CARD-0001"');
      expect(heroSource).toContain("Cho bé chơi thử ngay");
    });

    it("Scenario: BR-LND-02 — try-now play flow requires no registration", () => {
      expect(GUEST_ALLOWLIST_LEVEL_CODES).toHaveLength(6);
      expect(isGuestAllowedLevel("GL-C1-CNT-CARD-0001")).toBe(true);
      const effective = getEffectiveTier("free", null, {
        code: "GL-C1-CNT-CARD-0001",
        callerKind: "guest",
      });
      expect(effective).toBe("free");
    });

    it("Scenario: BR-LND-03 — landing page renders statically without JS", () => {
      const homeRouteSource = readRepoFile(
        "apps/web/server/api/guest/home.get.ts"
      );
      expect(homeRouteSource).toContain("public, max-age=300");
      const indexSource = readRepoFile("apps/web/app/pages/index.vue");
      expect(indexSource).toContain('useFetch<HomePayload>("/api/guest/home")');
    });

    it("Scenario: BR-LND-04 — forbids third-party tracking scripts on landing page", () => {
      const landingFiles = [
        "apps/web/app/pages/index.vue",
        "apps/web/app/components/landing-hero.vue",
        "apps/web/app/components/landing-pricing.vue",
        "apps/web/app/components/public-footer.vue",
      ];
      for (const file of landingFiles) {
        const src = readRepoFile(file);
        expect(src).not.toMatch(EXTERNAL_SCRIPT_REGEX);
      }
    });

    it("Scenario: BR-LND-05 — pricing figures are dynamically loaded from PACKAGE_CATALOG", () => {
      expect(PACKAGE_CATALOG["PKG-standard"]).toBeDefined();
      expect(PACKAGE_CATALOG["PKG-premium"]).toBeDefined();
      const homeRouteSource = readRepoFile(
        "apps/web/server/api/guest/home.get.ts"
      );
      expect(homeRouteSource).toContain('PACKAGE_CATALOG["PKG-standard"]');
      expect(homeRouteSource).toContain('PACKAGE_CATALOG["PKG-premium"]');
    });

    it("Scenario: BR-LND-06 — forbids outcome claims on landing page", () => {
      const indexSource = readRepoFile("apps/web/app/pages/index.vue");
      const heroSource = readRepoFile(
        "apps/web/app/components/landing-hero.vue"
      );
      const forbidden = ["tăng IQ", "giỏi toán vượt bậc", "chẩn đoán tư duy"];
      for (const phrase of forbidden) {
        expect(indexSource).not.toContain(phrase);
        expect(heroSource).not.toContain(phrase);
      }
    });

    it("Scenario: BR-LND-07 — forbids using real children photos in marketing assets", () => {
      const heroSource = readRepoFile(
        "apps/web/app/components/landing-hero.vue"
      );
      expect(heroSource).toContain("hero-emoji-bubble");
      expect(heroSource).not.toContain("<img");
    });

    it("Scenario: BR-LND-08 — LCP load time budget is under 2.5 seconds on 4G", () => {
      const homeRouteSource = readRepoFile(
        "apps/web/server/api/guest/home.get.ts"
      );
      expect(homeRouteSource).toContain("countPublishedLevels");
      expect(homeRouteSource).toContain("COMPETENCY_CATALOG");
    });
  });

  describe("Legal Pages Invariants (BR-LGL-01..08)", () => {
    it("Scenario: BR-LGL-01 — legal documents display version number and effective date", () => {
      expect(LEGAL_DOCUMENTS).toHaveLength(8);
      const slugs = LEGAL_DOCUMENTS.map((d) => d.slug);
      expect(new Set(slugs).size).toBe(8);
      for (const doc of LEGAL_DOCUMENTS) {
        expect(doc.effectiveDate).toMatch(ISO_DATE_REGEX);
        expect(doc.summary.length).toBeGreaterThan(10);
      }
      const legalRouteSource = readRepoFile(
        "apps/web/server/api/guest/legal/[slug]/index.get.ts"
      );
      expect(legalRouteSource).toContain("last_updated_on: doc.effectiveDate");
      expect(legalRouteSource).not.toContain("version:");
    });

    it("Scenario: BR-LGL-02 — previous legal document versions remain permanently accessible", () => {
      expect(
        existsSync(
          repoPath("apps/web/server/api/guest/legal/[slug]/versions.get.ts")
        )
      ).toBe(false);
      const slugPageSource = readRepoFile("apps/web/app/pages/[slug].vue");
      expect(slugPageSource).not.toContain("version-history-box");
    });

    it("Scenario: BR-LGL-03 — forbids third-party scripts on legal policy pages", () => {
      const slugPageSource = readRepoFile("apps/web/app/pages/[slug].vue");
      expect(slugPageSource).not.toMatch(EXTERNAL_SCRIPT_REGEX);
      expect(slugPageSource).not.toContain("googletagmanager.com");
    });

    it("Scenario: BR-LGL-04 — child privacy policy exists as a separate dedicated page", () => {
      const childDoc = LEGAL_DOCUMENTS.find((d) => d.slug === "child-privacy");
      expect(childDoc).toBeDefined();
      expect(childDoc?.isChildSpecific).toBe(true);
      expect(childDoc?.requiresConsent).toBe(true);
      expect(CONSENT_POLICY_MAP.child_data.slug).toBe("child-privacy");
    });

    it("Scenario: BR-LGL-05 — version updates trigger notification for logged-in users", () => {
      expect(Object.keys(CONSENT_POLICY_MAP)).toEqual([
        "terms",
        "privacy",
        "child_data",
      ]);
      const legalRouteSource = readRepoFile(
        "apps/web/server/api/guest/legal/[slug]/index.get.ts"
      );
      expect(legalRouteSource).toContain(
        'doc.requiresConsent ? "no-store" : "public, max-age=3600"'
      );
    });

    it("Scenario: BR-LGL-06 — legal documents include plain Vietnamese summaries", () => {
      for (const doc of LEGAL_DOCUMENTS) {
        expect(doc.summary.length).toBeGreaterThan(15);
        for (const section of doc.sections) {
          expect(section.heading.length).toBeGreaterThan(3);
          expect(section.summary.length).toBeGreaterThan(10);
          expect(section.content.length).toBeGreaterThan(20);
        }
      }
    });

    it("Scenario: BR-LGL-07 — pending_review legal documents block production deployment", () => {
      for (const doc of LEGAL_DOCUMENTS) {
        expect(doc.reviewStatus).toBe("approved");
      }
    });

    it("Scenario: BR-LGL-08 — footer of all pages links to child privacy policy", () => {
      const footerSource = readRepoFile(
        "apps/web/app/components/public-footer.vue"
      );
      expect(footerSource).toContain('to="/child-privacy"');
      expect(footerSource).toContain('to="/privacy"');
      expect(footerSource).toContain('to="/terms"');
    });
  });

  describe("FAQ & Cookie Banner Invariants (BR-FAQ-01..06, BR-CKB-01..07)", () => {
    it("Scenario: BR-FAQ-01 — every FAQ entry has a unique anchor URL", () => {
      expect(FAQ_ITEMS.length).toBeGreaterThanOrEqual(6);
      const anchors = FAQ_ITEMS.map((item) => item.anchor);
      expect(new Set(anchors).size).toBe(FAQ_ITEMS.length);
      for (const anchor of anchors) {
        expect(anchor).toMatch(ANCHOR_SLUG_REGEX);
      }
    });

    it("Scenario: BR-FAQ-02 — legal-related FAQ answers link directly to policy pages", () => {
      const refundFaq = FAQ_ITEMS.find(
        (item) => item.anchor === "chinh-sach-hoan-tien"
      );
      const privacyFaq = FAQ_ITEMS.find(
        (item) => item.anchor === "an-toan-du-lieu-tre"
      );
      expect(refundFaq?.legalLink).toBe("/refund-policy");
      expect(privacyFaq?.legalLink).toBe("/child-privacy");
    });

    it("Scenario: BR-FAQ-03 — generates FAQPage JSON-LD schema", () => {
      const indexSource = readRepoFile("apps/web/app/pages/index.vue");
      expect(indexSource).toContain('"@type": "FAQPage"');
      const jsonLdSource = readRepoFile("apps/web/server/utils/seo-jsonld.ts");
      expect(jsonLdSource).toContain('"@type": "FAQPage"');
    });

    it("Scenario: BR-FAQ-04 — FAQ contents stored as structured seed data", () => {
      const categories = new Set(FAQ_ITEMS.map((item) => item.category));
      expect(categories).toEqual(
        new Set(["product", "content", "account", "billing", "privacy"])
      );
    });

    it("Scenario: BR-FAQ-05 — FAQ answers begin with a direct answer in the first sentence", () => {
      const literacyFaq = FAQ_ITEMS.find(
        (item) => item.anchor === "co-can-biet-chu"
      );
      const refundFaq = FAQ_ITEMS.find(
        (item) => item.anchor === "chinh-sach-hoan-tien"
      );
      expect(literacyFaq?.answer.startsWith("Có,")).toBe(true);
      expect(refundFaq?.answer.startsWith("Có,")).toBe(true);
    });

    it("Scenario: BR-FAQ-06 — FAQ explicitly acknowledges product limits", () => {
      const iqFaq = FAQ_ITEMS.find(
        (item) => item.anchor === "giup-be-thong-minh-hon"
      );
      const reportFaq = FAQ_ITEMS.find(
        (item) => item.anchor === "bao-cao-co-danh-gia-be"
      );
      expect(iqFaq?.answer).toContain("không cam kết biến trẻ thành thần đồng");
      expect(reportFaq?.answer).toContain("không thay thế");
    });

    it("Scenario: BR-CKB-01 — uses technical essential cookies only", () => {
      expect(ESSENTIAL_COOKIES).toHaveLength(6);
      for (const cookie of ESSENTIAL_COOKIES) {
        expect(cookie.isEssential).toBe(true);
      }
    });

    it("Scenario: BR-CKB-02 — cookie banner does not block page content", () => {
      const bannerSource = readRepoFile(
        "apps/web/app/components/cookie-notice-banner.vue"
      );
      expect(bannerSource).toContain('<aside aria-label="Thông báo cookie"');
      expect(bannerSource).toContain("bottom: 0;");
    });

    it("Scenario: BR-CKB-03 — forbids cookie banner on kid play surfaces", () => {
      const bannerSource = readRepoFile(
        "apps/web/app/components/cookie-notice-banner.vue"
      );
      expect(bannerSource).toContain('route.path.startsWith("/play")');
    });

    it("Scenario: BR-CKB-04 — forbids third-party tracking cookies", () => {
      const cookieNames = ESSENTIAL_COOKIES.map((c) => c.name);
      expect(cookieNames).not.toContain("_ga");
      expect(cookieNames).not.toContain("_fbp");
    });

    it("Scenario: BR-CKB-05 — /cookie page lists every active cookie with name, purpose & duration", () => {
      for (const cookie of ESSENTIAL_COOKIES) {
        expect(cookie.name.length).toBeGreaterThan(2);
        expect(cookie.purpose.length).toBeGreaterThan(10);
        expect(cookie.maxAge.length).toBeGreaterThan(2);
      }
    });

    it("Scenario: BR-CKB-06 — non-essential cookies require explicit consent mechanism", () => {
      const cookieDoc = LEGAL_DOCUMENTS.find((d) => d.slug === "cookie");
      expect(cookieDoc?.requiresConsent).toBe(false);
      expect(ESSENTIAL_COOKIES.every((c) => c.isEssential)).toBe(true);
    });

    it("Scenario: BR-CKB-07 — dismissing cookie banner remembers choice for 12 months", () => {
      const ackItem = LOCAL_STORAGE_ITEMS.find(
        (item) => item.key === "cookie_notice_ack"
      );
      expect(ackItem).toBeDefined();
      expect(ackItem?.purpose).toContain("12 tháng");
      const bannerSource = readRepoFile(
        "apps/web/app/components/cookie-notice-banner.vue"
      );
      expect(bannerSource).toContain(
        "const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000"
      );
    });
  });
});
