import { existsSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { REPO_ROOT } from "@mindkid/config/paths";
import { describe, expect, it } from "vitest";
import {
  CUSTOM_EMOJI_SPRITES,
  hasCustomEmojiSprite,
  listCustomEmojiSprites,
  resolveCustomEmojiSprite,
} from "#src/index";

const PUBLIC_ROOT = join(REPO_ROOT, "packages/ui/public");
const MAX_SVG_BYTES = 4608;
const MAX_WEBP_BYTES = 51_200;
const LEADING_SLASH_RE = /^\//;

const EXPECTED_SLUGS: ReadonlyArray<readonly [string, string]> = [
  // Trái cây & Đồ ăn (9)
  ["🍎", "apple"],
  ["🍌", "banana"],
  ["🍊", "orange"],
  ["🍓", "strawberry"],
  ["🍉", "watermelon"],
  ["🍇", "grapes"],
  ["🥕", "carrot"],
  ["🌽", "corn"],
  ["🧁", "cupcake"],
  // Động vật đáng yêu (9)
  ["🐟", "fish"],
  ["🐰", "rabbit"],
  ["🐻", "bear"],
  ["🐱", "cat"],
  ["🐶", "dog"],
  ["🦆", "duck"],
  ["🐸", "frog"],
  ["🦋", "butterfly"],
  ["🐢", "turtle"],
  // Hình học khối gỗ 3D & Ngôi sao (5)
  ["🔴", "red-circle"],
  ["🟦", "blue-square"],
  ["🟥", "red-square"],
  ["🔺", "red-triangle"],
  ["⭐", "star"],
  // Đồ vật & Thiên nhiên (4)
  ["🌻", "sunflower"],
  ["🎈", "balloon"],
  ["🚗", "car"],
  ["⚽", "soccer-ball"],
];

const HERO_EMOJIS = new Set(["🍎", "🐟", "🐰", "🐻"]);

describe("@mindkid/emoji custom sprites registry", () => {
  it("registers exactly 27 custom sprites covering PoC fixtures", () => {
    expect(CUSTOM_EMOJI_SPRITES.size).toBe(27);
    expect(listCustomEmojiSprites()).toHaveLength(27);

    for (const [emoji, slug] of EXPECTED_SLUGS) {
      const meta = resolveCustomEmojiSprite(emoji);
      expect(meta).not.toBeNull();
      expect(meta?.slug).toBe(slug);
      expect(meta?.svgPath).toBe(`/sprites/emoji/${slug}.svg`);
      expect(meta?.nameVi.length).toBeGreaterThan(0);
      expect(hasCustomEmojiSprite(emoji)).toBe(true);
    }
  });

  it("assigns tier hero_webp to the 4 hero sprites and vector_craft to the rest", () => {
    for (const meta of listCustomEmojiSprites()) {
      if (HERO_EMOJIS.has(meta.emoji)) {
        expect(meta.tier).toBe("hero_webp");
        expect(meta.heroWebpPath).toBe(`/sprites/hero/${meta.slug}.webp`);
      } else {
        expect(meta.tier).toBe("vector_craft");
        expect(meta.heroWebpPath).toBeUndefined();
      }
    }
  });

  it("normalizes NFC and strips variation selector U+FE0F during lookup", () => {
    const starPlain = resolveCustomEmojiSprite("⭐");
    const starWithVs16 = resolveCustomEmojiSprite("⭐️");
    expect(starPlain).not.toBeNull();
    expect(starWithVs16).toEqual(starPlain);
    expect(hasCustomEmojiSprite("⭐️")).toBe(true);

    const appleWithVs16 = resolveCustomEmojiSprite("🍎\uFE0F");
    expect(appleWithVs16?.slug).toBe("apple");
  });

  it("returns null or false for empty or unsupported inputs", () => {
    expect(resolveCustomEmojiSprite("")).toBeNull();
    expect(resolveCustomEmojiSprite("🚀")).toBeNull();
    expect(resolveCustomEmojiSprite("apple")).toBeNull();
    expect(hasCustomEmojiSprite("")).toBe(false);
    expect(hasCustomEmojiSprite("🚀")).toBe(false);
  });

  it("verifies all 27 SVG files exist on disk, stay < 4.5 KB, and avoid #000000", () => {
    for (const meta of listCustomEmojiSprites()) {
      const relativeSvg = meta.svgPath.replace(LEADING_SLASH_RE, "");
      const absSvg = resolve(PUBLIC_ROOT, relativeSvg);
      expect(existsSync(absSvg)).toBe(true);

      const stat = statSync(absSvg);
      expect(stat.size).toBeGreaterThan(200);
      expect(stat.size).toBeLessThan(MAX_SVG_BYTES);

      const content = readFileSync(absSvg, "utf8");
      expect(content).toContain('viewBox="0 0 120 120"');
      expect(content).toContain("<svg");
      expect(content).toContain("</svg>");
      expect(content.toLowerCase()).not.toContain("#000000");
    }
  });

  it("verifies all 4 Tier-3 Hero WebP assets exist on disk and stay < 50 KB", () => {
    for (const emoji of HERO_EMOJIS) {
      const meta = resolveCustomEmojiSprite(emoji);
      expect(meta?.heroWebpPath).toBeDefined();
      const relativeWebp = (meta?.heroWebpPath ?? "").replace(
        LEADING_SLASH_RE,
        ""
      );
      const absWebp = resolve(PUBLIC_ROOT, relativeWebp);
      expect(existsSync(absWebp)).toBe(true);

      const stat = statSync(absWebp);
      expect(stat.size).toBeGreaterThan(1000);
      expect(stat.size).toBeLessThan(MAX_WEBP_BYTES);

      const header = readFileSync(absWebp).subarray(0, 12);
      expect(header.subarray(0, 4).toString("ascii")).toBe("RIFF");
      expect(header.subarray(8, 12).toString("ascii")).toBe("WEBP");
    }
  });
});
