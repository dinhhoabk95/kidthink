/**
 * @kidthink/emoji — Query Functions
 * Category/group/theme query and random selection.
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
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
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
 * Get total number of emoji entries.
 */
export function getTotalEmojiCount(): number {
  return ALL_EMOJIS.length;
}

/**
 * Get the EMJ-<slug> code for an emoji entry.
 */
export function getEmojiCode(entry: EmojiEntry): string {
  if (entry.code) {
    return entry.code;
  }
  // keywords[0] is the English term — the merge in the data files keeps
  // English first so EMJ-<slug> codes stay byte-identical.
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

/**
 * Get an emoji entry by code (EMJ-<slug>).
 */
export function getByCode(code: string): EmojiEntry | null {
  return (
    ALL_EMOJIS.find((e) => e.code === code || getEmojiCode(e) === code) ?? null
  );
}

/**
 * Validates if an emoji code exists in the registry.
 */
export function isValidRef(code: string): boolean {
  return getByCode(code) !== null;
}
