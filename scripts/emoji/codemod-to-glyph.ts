import fs from "node:fs";
import path from "node:path";
import { repoPath } from "@mindkid/config/paths";
import { ALL_EMOJIS } from "../../packages/emoji/src/registry";

function computeEmojiCode(entry: { keywords: string[]; name: string }): string {
  const primaryKeyword = entry.keywords[0] || entry.name;
  const slug = primaryKeyword
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `EMJ-${slug}`;
}

// 1. Build initial code to glyph map from current ALL_EMOJIS
const CODE_TO_GLYPH = new Map<string, string>();

for (const entry of ALL_EMOJIS) {
  const code = computeEmojiCode(entry);
  if (!CODE_TO_GLYPH.has(code)) {
    CODE_TO_GLYPH.set(code, entry.emoji);
  }
}

// 2. Add manual mapping for codes from corpus / slug variants
const MANUAL_OVERRIDES: Record<string, string> = {
  "EMJ-coin": "🪙",
  "EMJ-yarn": "🧶",
  "EMJ-apple": "🍎",
  "EMJ-red-apple": "🍎",
  "EMJ-green-apple": "🍏",
  "EMJ-banana": "🍌",
  "EMJ-orange": "🍊",
  "EMJ-lemon": "🍋",
  "EMJ-lime": "🍋‍🟩",
  "EMJ-watermelon": "🍉",
  "EMJ-grapes": "🍇",
  "EMJ-grape": "🍇",
  "EMJ-strawberry": "🍓",
  "EMJ-blueberries": "🫐",
  "EMJ-peach": "🍑",
  "EMJ-mango": "🥭",
  "EMJ-pineapple": "🍍",
  "EMJ-coconut": "🥥",
  "EMJ-kiwi-fruit": "🥝",
  "EMJ-pear": "🍐",
  "EMJ-melon": "🍈",
  "EMJ-cherries": "🍒",
  "EMJ-olive": "🫒",
  "EMJ-avocado": "🥑",
  "EMJ-carrot": "🥕",
  "EMJ-broccoli": "🥦",
  "EMJ-corn": "🌽",
  "EMJ-ear-of-corn": "🌽",
  "EMJ-tomato": "🍅",
  "EMJ-eggplant": "🍆",
  "EMJ-potato": "🥔",
  "EMJ-cucumber": "🥒",
  "EMJ-hot-pepper": "🌶️",
  "EMJ-bell-pepper": "🫑",
  "EMJ-onion": "🧅",
  "EMJ-garlic": "🧄",
  "EMJ-mushroom": "🍄",
  "EMJ-peanuts": "🥜",
  "EMJ-chestnut": "🌰",
  "EMJ-dog": "🐶",
  "EMJ-cat": "🐱",
  "EMJ-mouse": "🐭",
  "EMJ-hamster": "🐹",
  "EMJ-rabbit": "🐰",
  "EMJ-fox": "🦊",
  "EMJ-bear": "🐻",
  "EMJ-panda": "🐼",
  "EMJ-koala": "🐨",
  "EMJ-tiger": "🐯",
  "EMJ-lion": "🦁",
  "EMJ-cow": "🐮",
  "EMJ-pig": "🐷",
  "EMJ-frog": "🐸",
  "EMJ-monkey": "🐵",
  "EMJ-chicken": "🐔",
  "EMJ-rooster": "🐓",
  "EMJ-hatching-chick": "🐣",
  "EMJ-baby-chick": "🐤",
  "EMJ-bird": "🐦",
  "EMJ-penguin": "🐧",
  "EMJ-duck": "🦆",
  "EMJ-owl": "🦉",
  "EMJ-fish": "🐟",
  "EMJ-tropical-fish": "🐠",
  "EMJ-blowfish": "🐡",
  "EMJ-shark": "🦈",
  "EMJ-octopus": "🐙",
  "EMJ-spiral-shell": "🐚",
  "EMJ-crab": "🦀",
  "EMJ-shrimp": "🦐",
  "EMJ-squid": "🦑",
  "EMJ-butterfly": "🦋",
  "EMJ-snail": "🐌",
  "EMJ-caterpillar": "🐛",
  "EMJ-ant": "🐜",
  "EMJ-honeybee": "🐝",
  "EMJ-beetle": "🪲",
  "EMJ-lady-beetle": "🐞",
  "EMJ-star": "⭐",
  "EMJ-glowing-star": "🌟",
  "EMJ-sparkles": "✨",
  "EMJ-red-circle": "🔴",
  "EMJ-blue-circle": "🔵",
  "EMJ-yellow-circle": "🟡",
  "EMJ-green-circle": "🟢",
  "EMJ-purple-circle": "🟣",
  "EMJ-brown-circle": "🟤",
  "EMJ-black-circle": "⚫",
  "EMJ-white-circle": "⚪",
  "EMJ-red-square": "🟥",
  "EMJ-blue-square": "🟦",
  "EMJ-yellow-square": "🟨",
  "EMJ-green-square": "🟩",
  "EMJ-purple-square": "🟪",
  "EMJ-brown-square": "🟫",
  "EMJ-black-large-square": "⬛",
  "EMJ-white-large-square": "⬜",
  "EMJ-red-triangle-pointed-up": "🔺",
  "EMJ-red-triangle-pointed-down": "🔻",
  "EMJ-diamond-with-a-dot": "💠",
  "EMJ-large-orange-diamond": "🔶",
  "EMJ-large-blue-diamond": "🔷",
  "EMJ-small-orange-diamond": "🔸",
  "EMJ-small-blue-diamond": "🔹",
  "EMJ-sun": "☀️",
  "EMJ-sun-behind-cloud": "⛅",
  "EMJ-cloud": "☁️",
  "EMJ-cloud-with-rain": "🌧️",
  "EMJ-cloud-with-lightning": "🌩️",
  "EMJ-snowflake": "❄️",
  "EMJ-rainbow": "🌈",
  "EMJ-crescent-moon": "🌙",
  "EMJ-ringed-planet": "🪐",
  "EMJ-rocket": "🚀",
  "EMJ-automobile": "🚗",
  "EMJ-taxi": "🚕",
  "EMJ-bus": "🚌",
  "EMJ-ambulance": "🚑",
  "EMJ-fire-engine": "🚒",
  "EMJ-police-car": "🚓",
  "EMJ-bicycle": "🚲",
  "EMJ-airplane": "✈️",
  "EMJ-helicopter": "🚁",
  "EMJ-sailboat": "⛵",
  "EMJ-speedboat": "🚤",
  "EMJ-locomotive": "🚂",
  "EMJ-seedling": "🌱",
  "EMJ-evergreen-tree": "🌲",
  "EMJ-deciduous-tree": "🌳",
  "EMJ-tree": "🌳",
  "EMJ-palm-tree": "🌴",
  "EMJ-tulip": "🌷",
  "EMJ-rose": "🌹",
  "EMJ-sunflower": "🌻",
  "EMJ-hibiscus": "🌺",
  "EMJ-cherry-blossom": "🌸",
  "EMJ-flower": "🌸",
  "EMJ-four-leaf-clover": "🍀",
  "EMJ-soccer-ball": "⚽",
  "EMJ-basketball": "🏀",
  "EMJ-tennis": "🎾",
  "EMJ-ball": "⚽",
  "EMJ-books": "📚",
  "EMJ-book": "📖",
  "EMJ-pencil": "✏️",
  "EMJ-crayon": "🖍️",
  "EMJ-backpack": "🎒",
  "EMJ-school-bag": "🎒",
  "EMJ-graduation-cap": "🎓",
  "EMJ-artist-palette": "🎨",
  "EMJ-palette": "🎨",
  "EMJ-musical-note": "🎵",
  "EMJ-bell": "🔔",
  "EMJ-trophy": "🏆",
  "EMJ-sports-medal": "🏅",
  "EMJ-first-quarter-moon": "🌓",
  "EMJ-full-moon": "🌕",
  "EMJ-barn": "🏚️",
  "EMJ-hut": "🛖",
  "EMJ-battery": "🔋",
  "EMJ-satellite": "🛰️",
  "EMJ-gem": "💎",
  "EMJ-wrapped-gift": "🎁",
  "EMJ-teacup-without-handle": "🍵",
  "EMJ-radio-button": "🔘",
  "EMJ-arrow-up": "⬆️",
  "EMJ-arrow-left": "⬅️",
  "EMJ-arrow-right": "➡️",
  "EMJ-arrow-down": "⬇️",
  "EMJ-repeat": "🔁",
  "EMJ-robot": "🤖",
  "EMJ-sparkling-heart": "💖",
  "EMJ-lock": "🔒",
  "EMJ-cymbal": "🥁",
  "EMJ-gong": "🔔",
  "EMJ-apple-red": "🍎",
  "EMJ-turtle": "🐢",
  "EMJ-rice-paddy": "🌾",
};

for (const [code, glyph] of Object.entries(MANUAL_OVERRIDES)) {
  CODE_TO_GLYPH.set(code, glyph);
}

const SKIP_DIRS = new Set([
  "node_modules",
  "dist",
  ".nuxt",
  ".output",
  ".git",
  ".turbo",
  "coverage",
]);

function walk(dir: string, out: string[]): string[] {
  if (!fs.existsSync(dir)) {
    return out;
  }
  for (const name of fs.readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) {
      continue;
    }
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      walk(full, out);
    } else if (
      name.endsWith(".ts") ||
      name.endsWith(".vue") ||
      name.endsWith(".json")
    ) {
      out.push(full);
    }
  }
  return out;
}

export function runCodemod(isWrite: boolean): void {
  const dirs = [repoPath("packages"), repoPath("apps")];

  const files: string[] = [];
  for (const d of dirs) {
    walk(d, files);
  }

  let totalReplacements = 0;
  let filesChanged = 0;
  const unresolvedCodes = new Map<string, number>();

  const quotedEmojiRegex = /(["'`])(EMJ-[a-zA-Z0-9_-]+)\1/g;

  for (const file of files) {
    if (file.includes("scripts/emoji") || file.includes("fix-emoji-refs.ts")) {
      continue;
    }

    const originalContent = fs.readFileSync(file, "utf-8");
    let fileHits = 0;

    const newContent = originalContent.replace(
      quotedEmojiRegex,
      (match, quote, code) => {
        if (
          code.includes("nonexistent") ||
          code.includes("fake") ||
          code.includes("khong-ton-tai") ||
          code === "EMJ-123" ||
          code === "EMJ-a" ||
          code === "EMJ-ab" ||
          code === "EMJ-Apple" ||
          code === "EMJ-noun-" ||
          code === "EMJ-01" ||
          code === "EMJ-04" ||
          code === "EMJ-09" ||
          code === "EMJ-non-existent-fabricated-ref"
        ) {
          return match;
        }

        const glyph = CODE_TO_GLYPH.get(code);
        if (!glyph) {
          unresolvedCodes.set(code, (unresolvedCodes.get(code) ?? 0) + 1);
          return match;
        }

        fileHits++;
        totalReplacements++;
        return `${quote}${glyph}${quote}`;
      }
    );

    if (fileHits > 0) {
      filesChanged++;
      const _relPath = path.relative(repoPath(""), file);
      if (isWrite) {
        fs.writeFileSync(file, newContent, "utf-8");
      }
    }
  }

  console.log("\n================================");
  console.log(
    `Total replaced: ${totalReplacements} refs in ${filesChanged} files`
  );
  if (unresolvedCodes.size > 0) {
    console.warn(`Unresolved codes (${unresolvedCodes.size}):`);
    for (const [c, count] of unresolvedCodes) {
      console.warn(`  - ${c}: ${count} times`);
    }
  }
  console.log(
    isWrite ? "✅ Write complete!" : "ℹ️  Run with --write to apply changes"
  );
}

if (process.argv[1]?.endsWith("codemod-to-glyph.ts")) {
  const isWrite = process.argv.includes("--write");
  runCodemod(isWrite);
}
