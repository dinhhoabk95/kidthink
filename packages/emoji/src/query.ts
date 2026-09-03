/**
 * @mindkid/emoji — Query Functions
 * Category/group/theme query, glyph lookup and random selection.
 */

import {
  ALL_EMOJIS,
  CURRICULUM_EMOJI_MAP,
  EMOJI_CATEGORIES,
  GROUP_EMOJI_MAP,
} from "./registry";
import type {
  CurriculumTheme,
  EmojiCategory,
  EmojiEntry,
  EmojiGroup,
} from "./types";

/**
 * Strip variation selector 16 (\uFE0F) for normalization comparison.
 */
function stripVS16(str: string): string {
  return str.replace(/\uFE0F/g, "");
}

// Fast lookup map for glyph -> EmojiEntry
const GLYPH_MAP = new Map<string, EmojiEntry>();
for (const entry of ALL_EMOJIS) {
  const nfc = entry.emoji.normalize("NFC");
  GLYPH_MAP.set(nfc, entry);
  const stripped = stripVS16(nfc);
  if (!GLYPH_MAP.has(stripped)) {
    GLYPH_MAP.set(stripped, entry);
  }
}

/**
 * Get all emoji entries for a specific category.
 */
export function getEmojisByCategory(category: EmojiCategory): EmojiEntry[] {
  return EMOJI_CATEGORIES[category] ?? [];
}

/**
 * Get all emoji entries for a specific group.
 */
export function getEmojisByGroup(group: EmojiGroup): EmojiEntry[] {
  return GROUP_EMOJI_MAP[group] ?? [];
}

/**
 * Get all emoji entries for a specific curriculum theme.
 */
export function getEmojisByCurriculumTheme(
  theme: CurriculumTheme
): EmojiEntry[] {
  return CURRICULUM_EMOJI_MAP[theme] ?? [];
}

/**
 * Get random emoji entries from a specific category or from all emojis.
 * Returns unique (non-duplicate) entries.
 *
 * @param category - Category to pick from (omit for all emojis)
 * @param count - Number of random emojis to return
 * @returns Array of unique random emoji entries
 */
export function getRandomEmojis(
  category: EmojiCategory | undefined,
  count: number
): EmojiEntry[] {
  const pool = category ? (EMOJI_CATEGORIES[category] ?? []) : ALL_EMOJIS;

  if (pool.length === 0) {
    return [];
  }
  if (count >= pool.length) {
    return [...pool];
  }

  // Fisher-Yates shuffle on a copy, take first `count`
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const itemI = shuffled[i];
    const itemJ = shuffled[j];
    if (itemI !== undefined && itemJ !== undefined) {
      shuffled[i] = itemJ;
      shuffled[j] = itemI;
    }
  }
  return shuffled.slice(0, count);
}

/**
 * Get all available categories.
 */
export function getAllCategories(): EmojiCategory[] {
  return Object.keys(EMOJI_CATEGORIES) as EmojiCategory[];
}

/**
 * Get total number of distinct emoji entries.
 */
export function getTotalEmojiCount(): number {
  return ALL_EMOJIS.length;
}

/**
 * Get an emoji entry by its UTF-8 glyph.
 * Normalizes input to NFC and matches both with and without VS16 (U+FE0F).
 */
export function getByGlyph(glyph: string): EmojiEntry | null {
  if (!glyph) {
    return null;
  }
  const normalized = glyph.normalize("NFC");
  return (
    GLYPH_MAP.get(normalized) ?? GLYPH_MAP.get(stripVS16(normalized)) ?? null
  );
}

/**
 * Check if a glyph exists in the curated catalog.
 */
export function isInCatalog(glyph: string): boolean {
  return getByGlyph(glyph) !== null;
}
