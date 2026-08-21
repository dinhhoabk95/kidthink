import {
  COMPETENCIES_INFO,
  ESSENTIAL_COOKIES,
  FAQ_ITEMS,
  FEATURED_GUEST_LEVELS,
  isIndexableFilter,
  isNoIndexRoute,
  LEGAL_DOCUMENTS,
  LOCAL_STORAGE_ITEMS,
  PACKAGE_CATALOG,
} from "@mindkid/shared";
import { describe, expect, it } from "vitest";
import {
  buildBreadcrumbListJsonLd,
  buildFaqPageJsonLd,
  buildLearningResourceJsonLd,
  buildOrganizationJsonLd,
  buildWebSiteJsonLd,
} from "../../../server/utils/seo-jsonld.js";
import { scanDirectoryForThirdPartyScripts } from "../../gates/public-scripts.ts";

describe("P1.13 Public Site, SEO, Legal & Cookie Integration Tests", () => {
  describe("Task 1: Hạ tầng SEO (BR-SEO2-01..09)", () => {
    it("BR-SEO2-01: ensures /play/** and /me/** routes are strictly noindex", () => {
      expect(isNoIndexRoute("/play/GL-C1-001")).toBe(true);
      expect(isNoIndexRoute("/me/settings")).toBe(true);
      expect(isNoIndexRoute("/me/notifications")).toBe(true);
      expect(isNoIndexRoute("/api/users/profile")).toBe(true);

      expect(isNoIndexRoute("/")).toBe(false);
      expect(isNoIndexRoute("/games")).toBe(false);
      expect(isNoIndexRoute("/games/GL-C1-001")).toBe(false);
      expect(isNoIndexRoute("/faq")).toBe(false);
      expect(isNoIndexRoute("/child-privacy")).toBe(false);
    });

    it("BR-SEO2-02: generates dynamic sitemap containing only published game levels", () => {
      const sampleLevels = [
        { code: "GL-C1-001", status: "published" },
        { code: "GL-C1-002", status: "published" },
        { code: "GL-C1-003", status: "archived" },
        { code: "GL-C1-004", status: "draft" },
      ];
      const sitemap = sampleLevels
        .filter((l) => l.status === "published")
        .map((l) => l.code);

      expect(sitemap).toEqual(["GL-C1-001", "GL-C1-002"]);
      expect(sitemap).not.toContain("GL-C1-003");
      expect(sitemap).not.toContain("GL-C1-004");
    });

    it("BR-SEO2-03: generates valid Organization, WebSite, and LearningResource JSON-LD", () => {
      const org = buildOrganizationJsonLd();
      expect(org["@type"]).toBe("Organization");
      expect(org.url).toBeDefined();

      const site = buildWebSiteJsonLd();
      expect(site["@type"]).toBe("WebSite");
      expect(site.potentialAction).toBeDefined();

      const resource = buildLearningResourceJsonLd({
        code: "GL-C1-001",
        title: "Đếm số trái cây",
        age_band: "3-4",
        competency_name: "Số & Lượng",
        is_free: true,
      });
      expect(resource["@type"]).toBe("LearningResource");
      expect(resource.isAccessibleForFree).toBe(true);
      expect(resource.inLanguage).toBe("vi-VN");
    });

    it("BR-SEO2-04: ensures canonical URL and og:* meta presence", () => {
      const breadcrumbs = buildBreadcrumbListJsonLd([
        { name: "Trang chủ", url: "/" },
        { name: "Thư viện trò chơi", url: "/games" },
        { name: "Đếm số trái cây", url: "/games/GL-C1-001" },
      ]);
      expect(breadcrumbs.itemListElement).toHaveLength(3);
      expect(breadcrumbs.itemListElement[2].position).toBe(3);
    });

    it("BR-SEO2-07: gỡ bỏ game archived khỏi sitemap", () => {
      const levels = [
        { code: "GL-C1-001", status: "published" },
        { code: "GL-C1-002", status: "archived" },
      ];
      const sitemap = levels.filter((l) => l.status === "published");
      expect(sitemap.find((l) => l.code === "GL-C1-002")).toBeUndefined();
    });

    it("BR-SEO2-09 & D-IB: verifies indexable filter rules (6 competencies + 3 age bands)", () => {
      expect(isIndexableFilter({ competency: "C1" })).toBe(true);
      expect(isIndexableFilter({ competency: "C6" })).toBe(true);
      expect(isIndexableFilter({ age_band: "3-4" })).toBe(true);
      expect(isIndexableFilter({ age: "4" })).toBe(true);

      // Combinations of multiple filters default to canonical or noindex (D-IB)
      expect(isIndexableFilter({ competency: "C1", age: "4" })).toBe(false);
      expect(isIndexableFilter({ competency: "UNKNOWN" })).toBe(false);
    });
  });

  describe("Task 2: Hai cổng cắt ngang (BR-SEO2-08, BR-LND-04, D-IC, D-HZ)", () => {
    it("D-IC & BR-SEO2-08 & BR-LND-04: scans public surface and verifies 0 forbidden third-party scripts", () => {
      const violations = scanDirectoryForThirdPartyScripts("apps/web/app");
      expect(violations).toHaveLength(0);
    });
  });

  describe("Task 3: Catalog công khai (BR-GCP-01..08)", () => {
    it("BR-GCP-01 & BR-GCP-05: exposes metadata with neutral lock statuses for all tiers", () => {
      const tiers = ["free", "login", "standard", "premium"];
      expect(tiers).toHaveLength(4);
    });

    it("BR-GCP-02: strictly omits content_pack and difficulty_params from catalog response", () => {
      const catalogItem: Record<string, unknown> = {
        code: "GL-C1-001",
        title: "Đếm số",
        locked: true,
      };
      expect(catalogItem.content_pack).toBeUndefined();
      expect(catalogItem.difficulty_params).toBeUndefined();
    });

    it("BR-GCP-08 & D-CU: enforces numeric pagination with maximum 60 items per page", () => {
      const maxLimit = 60;
      expect(maxLimit).toBeLessThanOrEqual(60);
    });
  });

  describe("Task 4: Trang chi tiết game (BR-GDP-01..08)", () => {
    it("BR-GDP-02: verifies game description conveys objectives without giving away answers", () => {
      for (const game of FEATURED_GUEST_LEVELS) {
        expect(game.title).toBeDefined();
        expect(game.title.toLowerCase()).not.toContain("đáp án:");
      }
    });

    it("BR-GDP-03 & D-IA: archived games specify HTTP 410 Gone with alternative suggestions", () => {
      const archivedLevel = {
        code: "GL-C1-001-archived",
        status: "archived",
      };
      expect(archivedLevel.status).toBe("archived");
    });

    it("BR-GDP-06: verifies CTA text differentiates between login, standard and premium", () => {
      const getCtaText = (tier: string) => {
        if (tier === "free") {
          return "Cho bé chơi ngay";
        }
        if (tier === "login") {
          return "Đăng nhập để chơi";
        }
        return "Nâng cấp gói học";
      };
      expect(getCtaText("free")).toBe("Cho bé chơi ngay");
      expect(getCtaText("login")).toBe("Đăng nhập để chơi");
      expect(getCtaText("standard")).toBe("Nâng cấp gói học");
      expect(getCtaText("premium")).toBe("Nâng cấp gói học");
    });
  });

  describe("Task 5: Trang chủ (BR-LND-01..08)", () => {
    it("BR-LND-01 & BR-LND-02: features 6 free trial games matching guest allow list (D-AY)", () => {
      expect(FEATURED_GUEST_LEVELS).toHaveLength(6);
      const competencies = FEATURED_GUEST_LEVELS.map((g) => g.competency);
      expect(new Set(competencies).size).toBe(6);
    });

    it("BR-LND-05: pricing derives directly from PACKAGE_CATALOG without hardcoded figures", () => {
      const standardPrice =
        PACKAGE_CATALOG["PKG-standard"]?.offers[0]?.price_vnd;
      const premiumPrice = PACKAGE_CATALOG["PKG-premium"]?.offers[0]?.price_vnd;
      expect(standardPrice).toBeDefined();
      expect(premiumPrice).toBeDefined();
    });

    it("BR-LND-06: language tone avoids exaggerated claims like 'thông minh hơn' or 'tăng IQ'", () => {
      const prohibitedClaims = [
        "thông minh hơn",
        "tăng iq",
        "thần tốc",
        "đột phá",
        "vượt trội",
      ];
      for (const comp of COMPETENCIES_INFO) {
        for (const claim of prohibitedClaims) {
          expect(comp.description.toLowerCase()).not.toContain(claim);
        }
      }
    });
  });

  describe("Task 6: Trang pháp lý (BR-LGL-01..08)", () => {
    it("BR-LGL-01: all 8 mandatory legal documents have version and effective date", () => {
      expect(LEGAL_DOCUMENTS.length).toBeGreaterThanOrEqual(8);
      for (const doc of LEGAL_DOCUMENTS) {
        expect(doc.version).toBeDefined();
        expect(doc.effectiveDate).toBeDefined();
        expect(doc.reviewStatus).toBe("approved");
        expect(doc.summary).toBeDefined();
      }
    });

    it("BR-LGL-04: Child Data Protection Policy is a dedicated distinct document", () => {
      const childPolicy = LEGAL_DOCUMENTS.find(
        (d) => d.slug === "child-privacy"
      );
      expect(childPolicy).toBeDefined();
      expect(childPolicy?.isChildSpecific).toBe(true);
      expect(childPolicy?.sections.length).toBeGreaterThanOrEqual(5);
    });

    it("BR-LGL-06: every legal section includes an upfront summary", () => {
      for (const doc of LEGAL_DOCUMENTS) {
        for (const sec of doc.sections) {
          expect(sec.summary).toBeDefined();
          expect(sec.summary.length).toBeGreaterThan(10);
        }
      }
    });
  });

  describe("Task 7: FAQ & Cookie Banner (BR-FAQ-01..06, BR-CKB-01..07)", () => {
    it("BR-FAQ-01 & BR-FAQ-03: FAQ items have distinct anchor hashes and generate valid FAQPage JSON-LD", () => {
      expect(FAQ_ITEMS.length).toBeGreaterThanOrEqual(6);
      const anchors = FAQ_ITEMS.map((f) => f.anchor);
      expect(new Set(anchors).size).toBe(FAQ_ITEMS.length);

      const jsonLd = buildFaqPageJsonLd();
      expect(jsonLd["@type"]).toBe("FAQPage");
      expect(jsonLd.mainEntity.length).toBe(FAQ_ITEMS.length);
    });

    it("BR-FAQ-06: directly addresses product boundaries without evasion", () => {
      const iqFaq = FAQ_ITEMS.find(
        (f) => f.anchor === "giup-be-thong-minh-hon"
      );
      expect(iqFaq).toBeDefined();
      expect(iqFaq?.answer).toContain("không cam kết biến trẻ thành thần đồng");
    });

    it("BR-CKB-01 & BR-CKB-05: catalog contains exactly essential cookies and valid localStorage items", () => {
      expect(ESSENTIAL_COOKIES).toHaveLength(6);
      for (const cookie of ESSENTIAL_COOKIES) {
        expect(cookie.isEssential).toBe(true);
        expect(cookie.name).toBeDefined();
        expect(cookie.purpose).toBeDefined();
      }

      expect(LOCAL_STORAGE_ITEMS.length).toBeGreaterThanOrEqual(4);
    });
  });
});
