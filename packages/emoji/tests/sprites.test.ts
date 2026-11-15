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
const WHITESPACE_SPLIT_RE = /\s+/;
const SVG_SHAPE_TAG_RE = /<(?:path|circle|ellipse|rect|polygon|g)\b[^>]*>/g;
const STROKE_COLOR_RE = /\bstroke="(#[0-9a-fA-F]{6})"/;
const STROKE_WIDTH_RE = /\bstroke-width="([^"]+)"/;
const OPACITY_ATTR_RE = /\b(?:stroke-opacity|opacity)=/;

const EXPECTED_CATALOG_SPEC = `
  🍎:apple 🍌:banana 🍊:orange 🍓:strawberry 🍉:watermelon 🍇:grapes
  🥕:carrot 🌽:corn 🧁:cupcake 🐟:fish 🐰:rabbit 🐻:bear 🐱:cat 🐶:dog
  🦆:duck 🐸:frog 🦋:butterfly 🐢:turtle 🔴:red-circle 🟦:blue-square
  🟥:red-square 🔺:red-triangle ⭐:star 🌻:sunflower 🎈:balloon 🚗:car
  ⚽:soccer-ball 🦊:fox 🐼:panda 🦁:lion 🐯:tiger 🐨:koala 🐧:penguin
  🦉:owl 🐘:elephant 🐮:cow 🐦:bird 🐔:hen 🐷:pig 🐑:sheep 🐒:monkey
  🦒:giraffe 🐝:bee 🐞:ladybug 🐛:caterpillar 🐜:ant 🐌:snail 🦀:crab
  🐠:tropical-fish 🐬:dolphin 🍒:cherry 🍐:pear 🍋:lemon 🍑:peach
  🍍:pineapple 🥭:mango 🍅:tomato 🍄:mushroom 🍬:candy 🍪:cookie 🥚:egg
  🥛:milk 🌸:cherry-blossom 🌹:rose 🌷:tulip 🌳:tree 🌱:seedling
  🍃:fluttering-leaf 🌿:herb 🍀:four-leaf-clover ☀️:sun 🌙:crescent-moon
  🌟:glowing-star ☁️:cloud 🌧️:rain-cloud 🌈:rainbow 💧:droplet
  ❄️:snowflake 🚂:locomotive 🚌:bus 🚒:fire-engine 🚲:bicycle ✈️:airplane
  ⛵:sailboat 🚀:rocket 🔢:input-numbers 📐:triangular-ruler
  🧩:puzzle-piece 🔍:magnifying-glass 💬:speech-balloon 🎯:bullseye
  🎮:video-game 🎲:game-die 🖐️:hand-splayed ✏️:pencil 🖍️:crayon
  📏:straight-ruler ✂️:scissors 📖:open-book 🎒:backpack 🔔:bell
  🎨:palette 🧸:teddy-bear 🎁:gift 🥁:drum 🎸:guitar 🏀:basketball
  🔵:blue-circle 🟢:green-circle ⚫:black-circle ⚪:white-circle
  ❤️:red-heart 💎:gem 🪙:coin ⬆️:up-arrow ➡️:right-arrow 🏠:house 🧱:brick
  📦:package-box 💡:light-bulb 🪨:rock 🥣:bowl-spoon ⚙️:gear 🪵:wood-log
  🗝️:old-key 🏡:house-garden 🧊:ice-cube ⏰:alarm-clock 🪑:chair 🧶:yarn
  🥄:spoon 🧺:basket 📎:paperclip 🦗:cricket 🗼:tokyo-tower 🪁:kite
  ⬇️:down-arrow 👟:sneaker ☂️:umbrella 👶:baby 📓:notebook 🔑:key
  🐕:pet-dog ⬅️:left-arrow 🚩:red-flag 🧢:billed-cap 🐍:snake
  🐇:bunny-rabbit 🐐:goat 🎺:trumpet 🛏️:bed 🚪:door 🐄:dairy-cow
  🟧:orange-square 🏫:school 🔒:padlock 🐣:hatching-chick 🍩:doughnut
  🌾:rice-sheaf 🟡:yellow-circle 📚:books ✋:raised-hand 🧼:soap 👨:father
  🚚:delivery-truck 🌲:pine-tree 🥐:croissant 🟩:green-square 🍲:stew-pot
  🍰:shortcake 🔶:orange-diamond 🥫:canned-food 👀:eyes 🐿️:squirrel
  🐥:front-chick 🚁:helicopter 📕:red-book 🏢:office-building
  🍞:bread-loaf 🟨:yellow-square 🪷:lotus 🐈:house-cat 🔮:crystal-ball
  🌊:ocean-wave 🐳:spouting-whale 🌉:night-bridge 🖼️:framed-picture
  🍽️:plate-cutlery 🛑:stop-sign ☕:hot-cup 👒:sun-hat 🧣:scarf
  📄:paper-sheet 👩:mother 👵:grandmother 🧒:child 🖌️:paintbrush
  📗:green-book 🐁:mouse 🎃:pumpkin 🚛:lorry-truck 🥤:straw-cup
  🐴:horse-face 🍦:ice-cream 🔷:blue-diamond 🤖:robot 🐙:octopus
  🐚:seashell 🪀:yo-yo 🍂:fallen-leaf 🏮:red-lantern 🏃:runner
  🐵:monkey-face 🚢:ship 🎻:violin 🎵:music-note 🍯:honey-pot 🚜:tractor
  🐋:humpback-whale 🫛:pea-pod 🪴:potted-plant 🌰:chestnut 🔘:round-button
  🏰:castle ⛩️:torii-gate ⚓:anchor 👣:footprints 🛋️:sofa-couch
  🚿:shower-head 🥦:broccoli ✨:sparkles 👧:girl 👩‍🏫:teacher 🚑:ambulance
  📌:pushpin 📘:blue-book 🛶:canoe 🕷️:spider 🫙:glass-jar 🐓:rooster
  🍭:lollipop 🪹:empty-nest 🌼:daisy-blossom 🐎:galloping-horse 👑:crown
  🩷:pink-heart 🔋:battery ⚡:lightning-bolt 🪜:ladder 🚦:traffic-light
  🪟:window 🌍:earth-globe 🕊️:peace-dove 🕯️:candle 🗺️:world-map
  👏:clapping-hands 🎹:piano-keys 🧥:warm-coat 💨:wind-gust
  🟣:purple-circle 🪭:folding-fan 🎋:bamboo-branch 🍜:pho-bowl
  👴:grandfather 👦:boy 🍳:fried-egg 👨‍🚒:firefighter 🛵:scooter-bike
  🏔️:snow-mountain 🐆:leopard 🍆:eggplant 🦌:deer 🍏:green-apple
  🟪:purple-square 🫖:teapot 🔩:nut-bolt 🧽:sponge 🪥:toothbrush
  🛌:sleeping-bed 📋:clipboard 🔟:number-ten 💠:diamond-flower ✉️:envelope
  🦓:zebra 🚃:train-car 🐤:baby-chick 🦢:swan 🚙:suv-car ☄️:comet
  🗄️:filing-cabinet 🏛️:museum-hall 🛞:wheel 🧭:compass 🪺:egg-nest
  🕳️:burrow-hole 〰️:wavy-line 🚶:walking-kid 🦜:parrot 🚧:road-barrier
  🪞:mirror 🚰:water-tap 👕:t-shirt 🫘:beans 🪼:jellyfish 🕹️:joystick
  🚨:beacon-light ⛄:snowman 🌅:ocean-sunrise 🫧:soap-bubbles 🤫:quiet-face
  🪇:maracas 🪈:bamboo-flute 🔥:campfire-flame 🟤:brown-circle
  ♨️:steam-swirl 🌕:full-moon 🌌:starry-galaxy 🩺:stethoscope 🧑‍🌾:farmer
  👮:police-officer 🙇:polite-bow 🤝:handshake 🙋:hand-up-kid 👂:ear
  📢:megaphone ⬛:dark-square 🥒:cucumber 🦔:hedgehog 🍈:melon
  🎖️:star-medal 🌴:palm-tree 🌄:mountain-sunrise 🍱:bento-box
  🌇:city-sunset 🧃:juice-box 🚓:police-car 💖:sparkling-heart
  💛:yellow-heart 🛡️:shield 🎂:birthday-cake 🌀:spiral-swirl
  ⚗️:science-flask ⛺:camping-tent 🛴:kick-scooter 🚄:bullet-train
  📺:television 🥔:potato 📍:round-pin 🧦:socks 🏆:trophy
`;

const EXPECTED_SLUGS: ReadonlyArray<readonly [string, string]> =
  EXPECTED_CATALOG_SPEC.trim()
    .split(WHITESPACE_SPLIT_RE)
    .map((entry) => {
      const sep = entry.indexOf(":");
      return [entry.slice(0, sep), entry.slice(sep + 1)] as const;
    });

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
  "🐣",
  "🍩",
  "🍰",
  "🪷",
  "🐳",
  "🍦",
  "🤖",
  "🐙",
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
  "ice-cube",
  "bunny-rabbit",
  "goat",
  "dairy-cow",
  "hatching-chick",
  "yellow-circle",
  "soap",
  "yellow-square",
  "lotus",
  "plate-cutlery",
  "hot-cup",
  "paper-sheet",
  "mouse",
  "ice-cream",
  "seashell",
  "sparkles",
  "ambulance",
  "daisy-blossom",
  "peace-dove",
  "candle",
  "fried-egg",
  "snow-mountain",
  "toothbrush",
  "clipboard",
  "envelope",
  "zebra",
  "baby-chick",
  "swan",
  "snowman",
  "soap-bubbles",
  "full-moon",
  "yellow-heart",
  "science-flask",
  "bullet-train",
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
  it("registers exactly 350 custom sprites with unique slugs", () => {
    expect(EXPECTED_SLUGS).toHaveLength(350);
    expect(CUSTOM_EMOJI_SPRITES.size).toBe(350);
    const listed = listCustomEmojiSprites();
    expect(listed).toHaveLength(350);

    const seenSlugs = new Set<string>();
    for (const [index, [emoji, slug]] of EXPECTED_SLUGS.entries()) {
      expect(seenSlugs.has(slug)).toBe(false);
      seenSlugs.add(slug);

      expect(listed[index]?.emoji).toBe(emoji);
      expect(listed[index]?.slug).toBe(slug);

      const meta = resolveCustomEmojiSprite(emoji);
      expect(meta).not.toBeNull();
      expect(meta?.slug).toBe(slug);
      expect(meta?.svgPath).toBe(`/sprites/emoji/${slug}.svg`);
      expect(meta?.nameVi.length).toBeGreaterThan(0);
      expect(hasCustomEmojiSprite(emoji)).toBe(true);
    }
  });

  it("assigns tier hero_webp to all 24 hero sprites and vector_craft to the 326 others", () => {
    expect(HERO_EMOJIS.size).toBe(24);
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

    expect(heroCount).toBe(24);
    expect(vectorCount).toBe(326);
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
      "🛏️|🛏|bed",
      "🐿️|🐿|squirrel",
      "🖼️|🖼|framed-picture",
      "🍽️|🍽|plate-cutlery",
      "🖌️|🖌|paintbrush",
      "🕊️|🕊|peace-dove",
      "🕯️|🕯|candle",
      "🏔️|🏔|snow-mountain",
      "☄️|☄|comet",
      "🎖️|🎖|star-medal",
      "✉️|✉|envelope",
      "🕹️|🕹|joystick",
      "♨️|♨|steam-swirl",
      "🛡️|🛡|shield",
      "⚗️|⚗|science-flask",
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
  });

  it("returns null or false for empty or unsupported inputs", () => {
    expect(resolveCustomEmojiSprite("")).toBeNull();
    expect(resolveCustomEmojiSprite("🛸")).toBeNull();
    expect(resolveCustomEmojiSprite("🦖")).toBeNull();
    expect(resolveCustomEmojiSprite("apple")).toBeNull();
    expect(hasCustomEmojiSprite("")).toBe(false);
    expect(hasCustomEmojiSprite("🛸")).toBe(false);
  });

  it("verifies all 350 SVG files exist on disk, stay < 4,500 B, and avoid #000000", () => {
    for (const meta of listCustomEmojiSprites()) {
      const relativeSvg = meta.svgPath.replace(LEADING_SLASH_RE, "");
      const absSvg = resolve(PUBLIC_ROOT, relativeSvg);
      expect(existsSync(absSvg), `missing SVG: ${meta.slug}`).toBe(true);

      const stat = statSync(absSvg);
      expect(stat.size, `SVG too small: ${meta.slug}`).toBeGreaterThan(200);
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

  it("verifies all 24 Tier-3 Hero WebP assets exist on disk, measure 360x360, and stay < 35 KB", () => {
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
