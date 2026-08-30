import { EMOJI_REF_PATTERN } from "@mindkid/game-engine";
import { describe, expect, it } from "vitest";
import { ALL_SEED_LEVELS } from "#src/seed-content/index";
import { RAW_GLYPH_LEVEL_FIXTURE } from "./fixtures/emoji-ref-negative.ts";

/**
 * Bậc thang nợ `emoji_ref` — `BR-CTR-08`.
 *
 * `packages/emoji/src/query.ts:getByCode` chỉ tra theo mã `EMJ-<slug>`, nên một
 * glyph thô trong `content_pack` resolve ra `not_found` lúc render: trẻ thấy ô
 * trống. Contract vẫn nhận chuỗi bất kỳ (xem `shared-fields.ts`) vì fixture của
 * 27 template chưa dọn, nên nếu không có phép đo này thì nợ vô hình.
 *
 * Task 162 đưa corpus về **0**: 239 `ref` đổi sang mã, 15 emoji còn thiếu bổ
 * sung vào registry. Số chỉ được GIẢM — và nó đã ở đáy, nên phép kiểm này giờ
 * là hàng rào chống tái phát.
 */
const MAX_LEVELS_WITH_RAW_GLYPH = 0;

/** 0 glyph thô riêng biệt trong corpus (đo 2026-08-30, sau task 162). */
const MAX_DISTINCT_RAW_GLYPHS = 0;

interface GlyphScan {
  count: number;
  glyphs: Set<string>;
}

function collectBadRefs(value: unknown, out: Set<string>): void {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectBadRefs(item, out);
    }
    return;
  }
  if (!value || typeof value !== "object") {
    return;
  }
  for (const [key, inner] of Object.entries(value as Record<string, unknown>)) {
    const isRefField = key === "ref" || key === "emoji_ref";
    if (isRefField && typeof inner === "string") {
      if (!EMOJI_REF_PATTERN.test(inner)) {
        out.add(inner);
      }
    } else {
      collectBadRefs(inner, out);
    }
  }
}

function scan(levels: { content_pack: unknown }[]): GlyphScan {
  let count = 0;
  const glyphs = new Set<string>();
  for (const level of levels) {
    const found = new Set<string>();
    collectBadRefs(level.content_pack, found);
    if (found.size > 0) {
      count++;
      for (const glyph of found) {
        glyphs.add(glyph);
      }
    }
  }
  return { count, glyphs };
}

describe("Nợ emoji_ref trong corpus seed (BR-CTR-08)", () => {
  const { count, glyphs } = scan(ALL_SEED_LEVELS);

  it("bậc thang chỉ đi xuống", () => {
    expect(count).toBeLessThanOrEqual(MAX_LEVELS_WITH_RAW_GLYPH);
  });

  it("số đo hiện tại được ghi lại, không phải ước lượng", () => {
    expect(count).toBe(MAX_LEVELS_WITH_RAW_GLYPH);
    expect(ALL_SEED_LEVELS.length).toBeGreaterThan(count);
  });

  it("bậc thang glyph riêng biệt chỉ đi xuống", () => {
    expect(glyphs.size).toBeLessThanOrEqual(MAX_DISTINCT_RAW_GLYPHS);
  });

  it("số glyph riêng biệt hiện tại được ghi lại", () => {
    expect(glyphs.size).toBe(MAX_DISTINCT_RAW_GLYPHS);
  });

  it("ca âm: một level dùng glyph thô bị bắt", () => {
    const dirty = scan([RAW_GLYPH_LEVEL_FIXTURE]);
    expect(dirty.count).toBe(1);
    expect([...dirty.glyphs]).toEqual(["🍎"]);
  });

  it("ca âm: mã EMJ hợp lệ không bị tính là nợ", () => {
    const clean = scan([
      { content_pack: { asset: { kind: "emoji", ref: "EMJ-apple" } } },
    ]);
    expect(clean.count).toBe(0);
  });
});
