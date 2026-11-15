import { existsSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { REPO_ROOT } from "@mindkid/config/paths";
import { describe, expect, it } from "vitest";
import {
  ALL_EMOJIS,
  CUSTOM_EMOJI_SPRITES,
  hasCustomEmojiSprite,
  listCustomEmojiSprites,
  resolveCustomEmojiSprite,
} from "#src/index";

const PUBLIC_ROOT = join(REPO_ROOT, "packages/ui/public");
const TOTAL_SPRITES = 915;
const TOTAL_HERO_SPRITES = 40;
const TOTAL_VECTOR_SPRITES = 875;
const TOTAL_CATALOG_EMOJIS = 791;
const MIN_SVG_BYTES = 200;
const MAX_SVG_BYTES = 4500;
const MIN_WEBP_BYTES = 1000;
const MAX_WEBP_BYTES = 35_000;
const MIN_BORDER_CONTRAST = 3.0;
const MIN_LIGHT_SPRITE_BORDER_CONTRAST = 4.0;
const LEADING_SLASH_RE = /^\//;
const WHITESPACE_SPLIT_RE = /\s+/;
const KEBAB_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SVG_SHAPE_TAG_RE = /<(?:path|circle|ellipse|rect|polygon|g)\b[^>]*>/g;
const STROKE_COLOR_RE = /\bstroke="(#[0-9a-fA-F]{6})"/;
const STROKE_WIDTH_RE = /\bstroke-width="([^"]+)"/;
const OPACITY_ATTR_RE = /\b(?:stroke-opacity|opacity)=/;

const HERO_EMOJIS = new Set(
  `
  🍎 🐟 🐰 🐻 🦊 🐼 🦁 🐯 🐨 🐧 🦉 🐘 🐮 🍒 🌸 ☀️
  🐣 🍩 🍰 🪷 🐳 🍦 🤖 🐙 🧧 🐉 🍕 🥮 🐃 🦚 🦖 🧑‍🚀
  🐻‍❄️ 🦛 🇻🇳 🍔 🎪 🧜 👸 🌞
`
    .trim()
    .split(WHITESPACE_SPLIT_RE)
);

const LIGHT_SILHOUETTE_SLUGS = new Set(
  `
  rabbit panda sheep cow koala hen pig milk egg cloud rain-cloud white-circle
  speech-balloon snowflake cherry-blossom sun game-die open-book ice-cube
  bunny-rabbit goat dairy-cow hatching-chick yellow-circle soap yellow-square
  lotus plate-cutlery hot-cup paper-sheet mouse ice-cream seashell sparkles
  ambulance daisy-blossom peace-dove candle fried-egg snow-mountain toothbrush
  clipboard envelope zebra baby-chick swan snowman soap-bubbles full-moon
  yellow-heart science-flask bullet-train white-square rice-ball speedboat
  woman-chef thermometer flowing-hourglass capsule-pill guiding-cane memo-pad
  cute-mouse-face commuter-train astronaut woman-scientist polar-bear
  white-goose silver-haired-elder white-lab-coat
  smiling-full-moon bowling-pins ice-skate tabbed-pages flip-calendar
  tear-off-calendar garlic-bulb light-rail monorail minibus front-police-car
  motor-yacht cruise-ship cloudy-sun snow-cloud snowy-snowman smiling-sun
`
    .trim()
    .split(WHITESPACE_SPLIT_RE)
);

function srgbToLinear(channel: number): number {
  const normalized = channel / 255;
  return normalized <= 0.039_28
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string): number {
  const r = srgbToLinear(Number.parseInt(hex.slice(1, 3), 16));
  const g = srgbToLinear(Number.parseInt(hex.slice(3, 5), 16));
  const b = srgbToLinear(Number.parseInt(hex.slice(5, 7), 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(hexA: string, hexB: string): number {
  const lumA = relativeLuminance(hexA);
  const lumB = relativeLuminance(hexB);
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

function extractSilhouetteBorderColors(svgContent: string): string[] {
  const colors: string[] = [];
  const matches = svgContent.matchAll(SVG_SHAPE_TAG_RE);
  for (const match of matches) {
    const tag = match[0];
    if (OPACITY_ATTR_RE.test(tag)) {
      continue;
    }
    const widthMatch = STROKE_WIDTH_RE.exec(tag);
    const colorMatch = STROKE_COLOR_RE.exec(tag);
    if (!(widthMatch && colorMatch)) {
      continue;
    }
    const width = Number.parseFloat(widthMatch[1] ?? "0");
    const color = colorMatch[1];
    if (width >= 3.2 && color) {
      colors.push(color);
    }
  }
  return colors;
}

function readWebpDimensions(buffer: Buffer): { width: number; height: number } {
  const chunkType = buffer.subarray(12, 16).toString("ascii");
  if (chunkType === "VP8X") {
    const width = 1 + buffer.readUIntLE(24, 3);
    const height = 1 + buffer.readUIntLE(27, 3);
    return { width, height };
  }
  if (chunkType === "VP8L") {
    const bits = buffer.readUInt32LE(21);
    const width = (bits % 16_384) + 1;
    const height = (Math.floor(bits / 16_384) % 16_384) + 1;
    return { width, height };
  }
  const width = buffer.readUInt16LE(26) % 16_384;
  const height = buffer.readUInt16LE(28) % 16_384;
  return { width, height };
}

describe("@mindkid/emoji custom sprites registry", () => {
  it("registers exactly 915 custom sprites with unique kebab-case slugs", () => {
    expect(CUSTOM_EMOJI_SPRITES.size).toBe(TOTAL_SPRITES);
    const listed = listCustomEmojiSprites();
    expect(listed).toHaveLength(TOTAL_SPRITES);

    const seenSlugs = new Set<string>();
    const seenEmojis = new Set<string>();

    for (const entry of listed) {
      expect(
        KEBAB_SLUG_RE.test(entry.slug),
        `invalid slug: ${entry.slug}`
      ).toBe(true);
      expect(seenSlugs.has(entry.slug), `duplicate slug: ${entry.slug}`).toBe(
        false
      );
      seenSlugs.add(entry.slug);

      const nfcEmoji = entry.emoji.normalize("NFC");
      expect(
        seenEmojis.has(nfcEmoji),
        `duplicate emoji: ${entry.emoji} (${entry.slug})`
      ).toBe(false);
      seenEmojis.add(nfcEmoji);

      expect(entry.svgPath).toBe(`/sprites/emoji/${entry.slug}.svg`);
      expect(entry.nameVi.trim().length).toBeGreaterThan(0);

      const resolved = resolveCustomEmojiSprite(entry.emoji);
      expect(resolved).toEqual(entry);
      expect(hasCustomEmojiSprite(entry.emoji)).toBe(true);
    }
  });

  it("enforces permanent 100% custom sprite coverage across all 791 ALL_EMOJIS entries", () => {
    expect(ALL_EMOJIS).toHaveLength(TOTAL_CATALOG_EMOJIS);
    for (const entry of ALL_EMOJIS) {
      expect(
        hasCustomEmojiSprite(entry.emoji),
        `uncovered catalog emoji: ${entry.emoji} (${entry.name})`
      ).toBe(true);
    }
  });

  it("assigns tier hero_webp to all 40 hero sprites and vector_craft to the 875 others", () => {
    expect(HERO_EMOJIS.size).toBe(TOTAL_HERO_SPRITES);
    let heroCount = 0;
    let vectorCount = 0;

    for (const meta of listCustomEmojiSprites()) {
      if (HERO_EMOJIS.has(meta.emoji)) {
        heroCount += 1;
        expect(meta.tier).toBe("hero_webp");
        expect(meta.heroWebpPath).toBe(`/sprites/hero/${meta.slug}.webp`);
      } else {
        vectorCount += 1;
        expect(meta.tier).toBe("vector_craft");
        expect(meta.heroWebpPath).toBeUndefined();
      }
    }

    expect(heroCount).toBe(TOTAL_HERO_SPRITES);
    expect(vectorCount).toBe(TOTAL_VECTOR_SPRITES);
  });

  it("normalizes NFC and strips variation selector U+FE0F in both directions", () => {
    const vs16Specs = [
      "⭐|⭐️|star",
      "☀️|☀|sun",
      "☁️|☁|cloud",
      "❄️|❄|snowflake",
      "✈️|✈|airplane",
      "⛵|⛵\uFE0F|sailboat",
      "✏️|✏|pencil",
      "❤️|❤|red-heart",
      "⬆️|⬆|up-arrow",
      "➡️|➡|right-arrow",
      "⚙️|⚙|gear",
      "🗝️|🗝|old-key",
      "⬇️|⬇|down-arrow",
      "⬅️|⬅|left-arrow",
      "☂️|☂|umbrella",
      "🖼️|🖼|framed-picture",
      "🕊️|🕊|peace-dove",
      "✉️|✉|envelope",
      "🛡️|🛡|shield",
      "⚗️|⚗|science-flask",
      "⚠️|⚠|caution-sign",
      "☸️|☸|helm-wheel",
      "🌡️|🌡|thermometer",
      "🏖️|🏖|sunny-beach",
      "☝️|☝|index-up-hand",
      "🌪️|🌪|wind-tornado",
      "🖊️|🖊|fountain-pen",
      "↩️|↩|curve-left-arrow",
      "↪️|↪|curve-right-arrow",
      "🏍️|🏍|motorbike",
      "⏱️|⏱|stopwatch",
      "⛸️|⛸|ice-skate",
      "⛏️|⛏|pickaxe",
      "🌶️|🌶|chili-pepper",
      "🛩️|🛩|propeller-plane",
      "🛳️|🛳|cruise-ship",
      "☃️|☃|snowy-snowman",
      "🕵️|🕵|detective",
    ];

    for (const spec of vs16Specs) {
      const [a = "", b = "", slug = ""] = spec.split("|");
      const metaA = resolveCustomEmojiSprite(a);
      const metaB = resolveCustomEmojiSprite(b);
      expect(metaA?.slug).toBe(slug);
      expect(metaB).toEqual(metaA);
      expect(hasCustomEmojiSprite(a)).toBe(true);
      expect(hasCustomEmojiSprite(b)).toBe(true);
    }
    expect(resolveCustomEmojiSprite("🧑‍🚒")?.slug).toBe("young-firefighter");
    expect(resolveCustomEmojiSprite("🕵️")?.slug).toBe("detective");
    expect(resolveCustomEmojiSprite("🕵")?.slug).toBe("detective");
  });

  it("returns null or false for empty or unsupported inputs", () => {
    expect(resolveCustomEmojiSprite("")).toBeNull();
    expect(resolveCustomEmojiSprite("🧿")).toBeNull();
    expect(resolveCustomEmojiSprite("🪬")).toBeNull();
    expect(resolveCustomEmojiSprite("apple")).toBeNull();
    expect(hasCustomEmojiSprite("")).toBe(false);
    expect(hasCustomEmojiSprite("🧿")).toBe(false);
    expect(hasCustomEmojiSprite("🪬")).toBe(false);
    expect(hasCustomEmojiSprite("🧜")).toBe(true);
    expect(hasCustomEmojiSprite("👸")).toBe(true);
    expect(hasCustomEmojiSprite("🌞")).toBe(true);
  });

  it("verifies all 915 SVG files exist on disk, stay < 4,500 B, and avoid #000000", () => {
    for (const meta of listCustomEmojiSprites()) {
      const relativeSvg = meta.svgPath.replace(LEADING_SLASH_RE, "");
      const absSvg = resolve(PUBLIC_ROOT, relativeSvg);
      expect(existsSync(absSvg), `missing SVG: ${meta.slug}`).toBe(true);

      const stat = statSync(absSvg);
      expect(stat.size, `SVG too small: ${meta.slug}`).toBeGreaterThan(
        MIN_SVG_BYTES
      );
      expect(stat.size, `SVG too large: ${meta.slug}`).toBeLessThan(
        MAX_SVG_BYTES
      );

      const content = readFileSync(absSvg, "utf8");
      expect(content).toContain('viewBox="0 0 120 120"');
      expect(content).toContain("<svg");
      expect(content).toContain("</svg>");
      expect(content.toLowerCase()).not.toContain("#000000");
    }
  });

  it("enforces BR-A11-02 silhouette border contrast >= 3.0:1 (>= 4.0:1 on light items) against #ffffff & #FFFBF2", () => {
    for (const meta of listCustomEmojiSprites()) {
      const relativeSvg = meta.svgPath.replace(LEADING_SLASH_RE, "");
      const absSvg = resolve(PUBLIC_ROOT, relativeSvg);
      const content = readFileSync(absSvg, "utf8");
      const borderColors = extractSilhouetteBorderColors(content);

      expect(
        borderColors.length,
        `no qualifying border stroke in ${meta.slug}.svg`
      ).toBeGreaterThan(0);

      const threshold = LIGHT_SILHOUETTE_SLUGS.has(meta.slug)
        ? MIN_LIGHT_SPRITE_BORDER_CONTRAST
        : MIN_BORDER_CONTRAST;

      for (const hex of borderColors) {
        expect(
          contrastRatio(hex, "#ffffff"),
          `low white contrast in ${meta.slug}.svg (${hex})`
        ).toBeGreaterThanOrEqual(threshold);
        expect(
          contrastRatio(hex, "#FFFBF2"),
          `low warm contrast in ${meta.slug}.svg (${hex})`
        ).toBeGreaterThanOrEqual(threshold);
      }
    }
  });

  it("verifies all 40 Tier-3 Hero WebP assets exist on disk, measure 360x360, and stay < 35 KB", () => {
    for (const emoji of HERO_EMOJIS) {
      const meta = resolveCustomEmojiSprite(emoji);
      expect(meta?.heroWebpPath).toBeDefined();
      const relativeWebp = (meta?.heroWebpPath ?? "").replace(
        LEADING_SLASH_RE,
        ""
      );
      const absWebp = resolve(PUBLIC_ROOT, relativeWebp);
      expect(existsSync(absWebp), `missing WebP: ${meta?.slug}`).toBe(true);

      const stat = statSync(absWebp);
      expect(stat.size).toBeGreaterThan(MIN_WEBP_BYTES);
      expect(stat.size).toBeLessThan(MAX_WEBP_BYTES);

      const buf = readFileSync(absWebp);
      expect(buf.subarray(0, 4).toString("ascii")).toBe("RIFF");
      expect(buf.subarray(8, 12).toString("ascii")).toBe("WEBP");

      const dims = readWebpDimensions(buf);
      expect(dims.width).toBe(360);
      expect(dims.height).toBe(360);
    }
  });
});
