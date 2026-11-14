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
const MAX_SVG_BYTES = 4500;
const MAX_WEBP_BYTES = 35_000;
const MIN_BORDER_CONTRAST = 3.0;
const MIN_LIGHT_SPRITE_BORDER_CONTRAST = 4.0;
const LEADING_SLASH_RE = /^\//;
const SVG_SHAPE_TAG_RE = /<(?:path|circle|ellipse|rect|polygon|g)\b[^>]*>/g;
const STROKE_COLOR_RE = /\bstroke="(#[0-9a-fA-F]{6})"/;
const STROKE_WIDTH_RE = /\bstroke-width="([^"]+)"/;
const OPACITY_ATTR_RE = /\b(?:stroke-opacity|opacity)=/;

const EXPECTED_SLUGS: ReadonlyArray<readonly [string, string]> = [
  // Core PoC (27)
  ["🍎", "apple"],
  ["🍌", "banana"],
  ["🍊", "orange"],
  ["🍓", "strawberry"],
  ["🍉", "watermelon"],
  ["🍇", "grapes"],
  ["🥕", "carrot"],
  ["🌽", "corn"],
  ["🧁", "cupcake"],
  ["🐟", "fish"],
  ["🐰", "rabbit"],
  ["🐻", "bear"],
  ["🐱", "cat"],
  ["🐶", "dog"],
  ["🦆", "duck"],
  ["🐸", "frog"],
  ["🦋", "butterfly"],
  ["🐢", "turtle"],
  ["🔴", "red-circle"],
  ["🟦", "blue-square"],
  ["🟥", "red-square"],
  ["🔺", "red-triangle"],
  ["⭐", "star"],
  ["🌻", "sunflower"],
  ["🎈", "balloon"],
  ["🚗", "car"],
  ["⚽", "soccer-ball"],

  // 1. Động vật & 12 Avatar bé (23)
  ["🦊", "fox"],
  ["🐼", "panda"],
  ["🦁", "lion"],
  ["🐯", "tiger"],
  ["🐨", "koala"],
  ["🐧", "penguin"],
  ["🦉", "owl"],
  ["🐘", "elephant"],
  ["🐮", "cow"],
  ["🐦", "bird"],
  ["🐔", "hen"],
  ["🐷", "pig"],
  ["🐑", "sheep"],
  ["🐒", "monkey"],
  ["🦒", "giraffe"],
  ["🐝", "bee"],
  ["🐞", "ladybug"],
  ["🐛", "caterpillar"],
  ["🐜", "ant"],
  ["🐌", "snail"],
  ["🦀", "crab"],
  ["🐠", "tropical-fish"],
  ["🐬", "dolphin"],

  // 2. Trái cây, Rau củ & Thực phẩm (12)
  ["🍒", "cherry"],
  ["🍐", "pear"],
  ["🍋", "lemon"],
  ["🍑", "peach"],
  ["🍍", "pineapple"],
  ["🥭", "mango"],
  ["🍅", "tomato"],
  ["🍄", "mushroom"],
  ["🍬", "candy"],
  ["🍪", "cookie"],
  ["🥚", "egg"],
  ["🥛", "milk"],

  // 3. Thiên nhiên, Hoa lá & Thời tiết (16)
  ["🌸", "cherry-blossom"],
  ["🌹", "rose"],
  ["🌷", "tulip"],
  ["🌳", "tree"],
  ["🌱", "seedling"],
  ["🍃", "fluttering-leaf"],
  ["🌿", "herb"],
  ["🍀", "four-leaf-clover"],
  ["☀️", "sun"],
  ["🌙", "crescent-moon"],
  ["🌟", "glowing-star"],
  ["☁️", "cloud"],
  ["🌧️", "rain-cloud"],
  ["🌈", "rainbow"],
  ["💧", "droplet"],
  ["❄️", "snowflake"],

  // 4. Phương tiện giao thông (7)
  ["🚂", "locomotive"],
  ["🚌", "bus"],
  ["🚒", "fire-engine"],
  ["🚲", "bicycle"],
  ["✈️", "airplane"],
  ["⛵", "sailboat"],
  ["🚀", "rocket"],

  // 5. Trường học, Nghệ thuật, Đồ chơi & 6 Năng lực C1–C6 (20)
  ["🔢", "input-numbers"],
  ["📐", "triangular-ruler"],
  ["🧩", "puzzle-piece"],
  ["🔍", "magnifying-glass"],
  ["💬", "speech-balloon"],
  ["🎯", "bullseye"],
  ["🎮", "video-game"],
  ["🎲", "game-die"],
  ["🖐️", "hand-splayed"],
  ["✏️", "pencil"],
  ["🖍️", "crayon"],
  ["📏", "straight-ruler"],
  ["✂️", "scissors"],
  ["📖", "open-book"],
  ["🎒", "backpack"],
  ["🔔", "bell"],
  ["🎨", "palette"],
  ["🧸", "teddy-bear"],
  ["🎁", "gift"],
  ["🥁", "drum"],

  // 6. Hình khối gỗ Montessori, Mũi tên & Đồ vật quen thuộc (15)
  ["🎸", "guitar"],
  ["🏀", "basketball"],
  ["🔵", "blue-circle"],
  ["🟢", "green-circle"],
  ["⚫", "black-circle"],
  ["⚪", "white-circle"],
  ["❤️", "red-heart"],
  ["💎", "gem"],
  ["🪙", "coin"],
  ["⬆️", "up-arrow"],
  ["➡️", "right-arrow"],
  ["🏠", "house"],
  ["🧱", "brick"],
  ["📦", "package-box"],
  ["💡", "light-bulb"],
];

const HERO_EMOJIS = new Set([
  "🍎",
  "🐟",
  "🐰",
  "🐻",
  "🦊",
  "🐼",
  "🦁",
  "🐯",
  "🐨",
  "🐧",
  "🦉",
  "🐘",
  "🐮",
  "🍒",
  "🌸",
  "☀️",
]);

const LIGHT_SILHOUETTE_SLUGS = new Set([
  "rabbit",
  "panda",
  "sheep",
  "cow",
  "koala",
  "hen",
  "pig",
  "milk",
  "egg",
  "cloud",
  "rain-cloud",
  "white-circle",
  "speech-balloon",
  "snowflake",
  "cherry-blossom",
  "sun",
  "game-die",
  "open-book",
]);

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
  it("registers exactly 120 custom sprites with unique slugs", () => {
    expect(EXPECTED_SLUGS).toHaveLength(120);
    expect(CUSTOM_EMOJI_SPRITES.size).toBe(120);
    expect(listCustomEmojiSprites()).toHaveLength(120);

    const seenSlugs = new Set<string>();
    for (const [emoji, slug] of EXPECTED_SLUGS) {
      expect(seenSlugs.has(slug)).toBe(false);
      seenSlugs.add(slug);

      const meta = resolveCustomEmojiSprite(emoji);
      expect(meta).not.toBeNull();
      expect(meta?.slug).toBe(slug);
      expect(meta?.svgPath).toBe(`/sprites/emoji/${slug}.svg`);
      expect(meta?.nameVi.length).toBeGreaterThan(0);
      expect(hasCustomEmojiSprite(emoji)).toBe(true);
    }
  });

  it("assigns tier hero_webp to all 16 hero sprites and vector_craft to the 104 others", () => {
    expect(HERO_EMOJIS.size).toBe(16);
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

    expect(heroCount).toBe(16);
    expect(vectorCount).toBe(104);
  });

  it("normalizes NFC and strips variation selector U+FE0F in both directions", () => {
    const vs16Pairs: ReadonlyArray<readonly [string, string, string]> = [
      ["⭐", "⭐️", "star"],
      ["☀️", "☀", "sun"],
      ["☁️", "☁", "cloud"],
      ["❄️", "❄", "snowflake"],
      ["✈️", "✈", "airplane"],
      ["⛵", "⛵\uFE0F", "sailboat"],
      ["✏️", "✏", "pencil"],
      ["❤️", "❤", "red-heart"],
      ["⬆️", "⬆", "up-arrow"],
      ["➡️", "➡", "right-arrow"],
    ];

    for (const [a, b, slug] of vs16Pairs) {
      const metaA = resolveCustomEmojiSprite(a);
      const metaB = resolveCustomEmojiSprite(b);
      expect(metaA?.slug).toBe(slug);
      expect(metaB).toEqual(metaA);
      expect(hasCustomEmojiSprite(a)).toBe(true);
      expect(hasCustomEmojiSprite(b)).toBe(true);
    }
  });

  it("returns null or false for empty or unsupported inputs", () => {
    expect(resolveCustomEmojiSprite("")).toBeNull();
    expect(resolveCustomEmojiSprite("🛸")).toBeNull();
    expect(resolveCustomEmojiSprite("🦖")).toBeNull();
    expect(resolveCustomEmojiSprite("apple")).toBeNull();
    expect(hasCustomEmojiSprite("")).toBe(false);
    expect(hasCustomEmojiSprite("🛸")).toBe(false);
  });

  it("verifies all 120 SVG files exist on disk, stay < 4,500 B, and avoid #000000", () => {
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

  it("enforces BR-A11-02 silhouette border contrast >= 3.0:1 (>= 4.0:1 on light items) against #ffffff & #FFFBF2", () => {
    for (const meta of listCustomEmojiSprites()) {
      const relativeSvg = meta.svgPath.replace(LEADING_SLASH_RE, "");
      const absSvg = resolve(PUBLIC_ROOT, relativeSvg);
      const content = readFileSync(absSvg, "utf8");
      const borderColors = extractSilhouetteBorderColors(content);

      expect(borderColors.length).toBeGreaterThan(0);

      const threshold = LIGHT_SILHOUETTE_SLUGS.has(meta.slug)
        ? MIN_LIGHT_SPRITE_BORDER_CONTRAST
        : MIN_BORDER_CONTRAST;

      for (const hex of borderColors) {
        expect(contrastRatio(hex, "#ffffff")).toBeGreaterThanOrEqual(threshold);
        expect(contrastRatio(hex, "#FFFBF2")).toBeGreaterThanOrEqual(threshold);
      }
    }
  });

  it("verifies all 16 Tier-3 Hero WebP assets exist on disk, measure 360x360, and stay < 35 KB", () => {
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

      const buf = readFileSync(absWebp);
      expect(buf.subarray(0, 4).toString("ascii")).toBe("RIFF");
      expect(buf.subarray(8, 12).toString("ascii")).toBe("WEBP");

      const dims = readWebpDimensions(buf);
      expect(dims.width).toBe(360);
      expect(dims.height).toBe(360);
    }
  });
});
