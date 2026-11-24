import { describe, expect, it } from "vitest";
import type { GameDetailResponse } from "~/composables/use-game-detail-seo";
import type { CatalogResponse } from "~/composables/use-games-catalog-page";
import { trimCatalogPayload, trimGameDetailPayload } from "~/utils/seo-payload";

describe("seo-payload — gọt gọn __NUXT_DATA__ cho các trang SEO công khai", () => {
  it("trimCatalogPayload loại bỏ trường thừa trên từng thẻ nhưng giữ đủ metadata hiển thị & facets", () => {
    const rawPayload = {
      items: [
        {
          id: 101,
          entity_id: 101,
          code: "GL-C1-CNT-CARD-0001",
          title: "Đếm số táo đỏ",
          description: "Mô tả dài không hiển thị trên thẻ danh mục...",
          instruction:
            "Hướng dẫn giọng đọc không hiển thị trên thẻ danh mục...",
          thumbnail_emoji: "🍎",
          theme_id: "farm",
          competency: "C1",
          age_band: "3-4",
          age_min: 3,
          age_max: 4,
          difficulty: 1,
          access_tier: "free" as const,
          status: "published",
          locked: false,
          cta: {
            action: "play",
            text: "Cho bé chơi ngay",
            href: "/play/GL-C1-CNT-CARD-0001",
          },
        },
      ],
      total: 1,
      facets: {
        total: 1,
        competency: { C1: 1 },
        age_band: { "3-4": 1 },
        age: { "3": 1, "4": 1 },
        access_tier: { free: 1 },
        strand: { "C1.CNT": 1 },
      },
      next_cursor: null,
    };

    const trimmed: CatalogResponse = trimCatalogPayload(rawPayload);

    expect(trimmed.total).toBe(1);
    expect(trimmed.next_cursor).toBeNull();
    expect(trimmed.facets.competency.C1).toBe(1);
    expect(trimmed.items).toHaveLength(1);
    expect(trimmed.items[0]).toEqual({
      code: "GL-C1-CNT-CARD-0001",
      title: "Đếm số táo đỏ",
      thumbnail_emoji: "🍎",
      competency: "C1",
      age_band: "3-4",
      difficulty: 1,
      access_tier: "free",
      locked: false,
      cta: {
        action: "play",
        text: "Cho bé chơi ngay",
        href: "/play/GL-C1-CNT-CARD-0001",
      },
    });
    expect("description" in (trimmed.items[0] ?? {})).toBe(false);
    expect("instruction" in (trimmed.items[0] ?? {})).toBe(false);
  });

  it("trimGameDetailPayload cắt bỏ dữ liệu rounds nặng khỏi SSR payload trang chi tiết /games/[code] nhưng giữ trọn SEO & UI", () => {
    const rawDetail: GameDetailResponse & {
      rounds: Array<{
        round_index: number;
        instruction?: string | null;
        content_pack?: Record<string, string>;
      }>;
    } = {
      code: "GL-C1-CNT-CARD-0001",
      title: "Đếm số táo đỏ",
      description: "Giúp trẻ nhận biết số lượng trong phạm vi 5.",
      competency: "C1",
      strand_code: "C1.CNT",
      strand_name: "Đếm và số lượng",
      age_min: 3,
      age_max: 4,
      age_band: "3-4",
      difficulty: 2,
      theme_id: "farm",
      template_code: "GT-001",
      template_name: "Đếm thẻ",
      mechanic_type: "tap",
      access_tier: "free",
      locked: false,
      scoring: { mode: "rounds" },
      rounds: [
        {
          round_index: 1,
          instruction: "Bé hãy chạm vào 3 quả táo",
          content_pack: { heavy_json: "x".repeat(2000) },
        },
      ],
      cta: {
        action: "play",
        text: "Cho bé chơi ngay",
        href: "/play/GL-C1-CNT-CARD-0001",
      },
      preview_images: ["/images/previews/game-preview-1.webp"],
      related_games: [
        {
          code: "GL-C1-CNT-CARD-0002",
          title: "Đếm cam vàng",
          access_tier: "free",
          locked: false,
          age_band: "3-4",
          emoji: "🍊",
        },
      ],
      thumbnail_emoji: "🍎",
    };

    const trimmed = trimGameDetailPayload(rawDetail);

    expect(trimmed.code).toBe("GL-C1-CNT-CARD-0001");
    expect(trimmed.title).toBe("Đếm số táo đỏ");
    expect(trimmed.strand_code).toBe("C1.CNT");
    expect(trimmed.rounds).toEqual([]);
    expect(trimmed.related_games).toHaveLength(1);
    expect(JSON.stringify(trimmed).length).toBeLessThan(
      JSON.stringify(rawDetail).length - 1500
    );
  });
});
