import fs from "node:fs";
import path from "node:path";
import { repoPath } from "@mindkid/config/paths";
import { ALL_EMOJIS } from "@mindkid/emoji";

// 1. Build map code -> entry from current ALL_EMOJIS
const CODE_TO_ENTRY = new Map<string, (typeof ALL_EMOJIS)[number]>();
for (const entry of ALL_EMOJIS) {
  const slug = `EMJ-${entry.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  if (!CODE_TO_ENTRY.has(slug)) {
    CODE_TO_ENTRY.set(slug, entry);
  }
}

// Known mappings for the ~50 codes in corpus that were missing or had slug variations
export const MANUAL_CODE_MAP: Record<string, string> = {
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
  "EMJ-palm-tree": "🌴",
  "EMJ-tulip": "🌷",
  "EMJ-rose": "🌹",
  "EMJ-sunflower": "🌻",
  "EMJ-hibiscus": "🌺",
  "EMJ-cherry-blossom": "🌸",
  "EMJ-four-leaf-clover": "🍀",
  "EMJ-soccer-ball": "⚽",
  "EMJ-basketball": "🏀",
  "EMJ-tennis": "🎾",
  "EMJ-books": "📚",
  "EMJ-pencil": "✏️",
  "EMJ-crayon": "🖍️",
  "EMJ-backpack": "🎒",
  "EMJ-graduation-cap": "🎓",
  "EMJ-artist-palette": "🎨",
  "EMJ-musical-note": "🎵",
  "EMJ-bell": "🔔",
  "EMJ-trophy": "🏆",
  "EMJ-sports-medal": "🏅",
  "EMJ-first-quarter-moon": "🌓",
  "EMJ-full-moon": "🌕",
  "EMJ-barn": "🏚️",
  "EMJ-battery": "🔋",
  "EMJ-satellite": "🛰️",
  "EMJ-nonexistent-999": "❓",
};

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

function resolveGlyphForCode(code: string): string | null {
  const entry = CODE_TO_ENTRY.get(code);
  if (entry) {
    return entry.emoji;
  }
  return MANUAL_CODE_MAP[code] ?? null;
}

function recordCodeMatch(
  uniqueCodes: Map<
    string,
    { count: number; files: string[]; resolvedGlyph: string | null }
  >,
  code: string,
  relFile: string
): void {
  let info = uniqueCodes.get(code);
  if (!info) {
    info = { count: 0, files: [], resolvedGlyph: resolveGlyphForCode(code) };
    uniqueCodes.set(code, info);
  }
  info.count++;
  if (!info.files.includes(relFile)) {
    info.files.push(relFile);
  }
}

export function auditEmojiRefs(): {
  totalMatches: number;
  uniqueCodes: Map<
    string,
    { count: number; files: string[]; resolvedGlyph: string | null }
  >;
  unresolvedCount: number;
} {
  const dirsToScan = [repoPath("packages"), repoPath("apps")];
  const files: string[] = [];
  for (const d of dirsToScan) {
    walk(d, files);
  }

  const codeRegex = /EMJ-[a-zA-Z0-9_-]+/g;
  const uniqueCodes = new Map<
    string,
    { count: number; files: string[]; resolvedGlyph: string | null }
  >();
  let totalMatches = 0;

  for (const file of files) {
    if (file.includes("scripts/emoji") || file.includes("fix-emoji-refs.ts")) {
      continue;
    }
    const content = fs.readFileSync(file, "utf-8");
    const matches = content.match(codeRegex);
    if (!matches) {
      continue;
    }

    const relFile = path.relative(repoPath(""), file);
    for (const code of matches) {
      totalMatches++;
      recordCodeMatch(uniqueCodes, code, relFile);
    }
  }

  let unresolvedCount = 0;
  for (const [_code, info] of uniqueCodes.entries()) {
    if (!info.resolvedGlyph) {
      unresolvedCount++;
    }
  }

  return { totalMatches, uniqueCodes, unresolvedCount };
}

if (process.argv[1]?.endsWith("audit-refs.ts")) {
  const result = auditEmojiRefs();
  console.log("\n=== EMOJI REF AUDIT REPORT ===");
  console.log(`Total EMJ-* occurrences: ${result.totalMatches}`);
  console.log(`Unique EMJ-* codes: ${result.uniqueCodes.size}`);
  console.log(`Unresolved codes: ${result.unresolvedCount}`);

  if (result.unresolvedCount > 0) {
    console.error(`\n❌ UNRESOLVED CODES (${result.unresolvedCount}):`);
    for (const [code, info] of result.uniqueCodes.entries()) {
      if (!info.resolvedGlyph) {
        console.error(
          `  - ${code} (${info.count} times in ${info.files.length} files: ${info.files.slice(0, 3).join(", ")}...)`
        );
      }
    }
    process.exit(1);
  } else {
    console.log(
      `\n✅ All ${result.uniqueCodes.size} codes resolve to UTF-8 glyphs!`
    );
    process.exit(0);
  }
}
