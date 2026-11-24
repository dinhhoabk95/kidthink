/**
 * @mindkid/emoji — Query Functions
 * Category/group/theme query, glyph lookup and random selection.
 */

import { ALL_CATEGORIES } from "#src/constants";
import { buildGlyphLookupMap, resolveFromGlyphMap } from "#src/glyph-utils";
import {
  ALL_EMOJIS,
  CURRICULUM_EMOJI_MAP,
  EMOJI_CATEGORIES,
  GROUP_EMOJI_MAP,
} from "#src/registry";
import type {
  CurriculumTheme,
  EmojiCategory,
  EmojiEntry,
  EmojiGroup,
} from "#src/types";

let glyphMapCache: ReadonlyMap<string, EmojiEntry> | null = null;

function getGlyphMap(): ReadonlyMap<string, EmojiEntry> {
  if (!glyphMapCache) {
    glyphMapCache = buildGlyphLookupMap(ALL_EMOJIS, (entry) => entry.emoji);
  }
  return glyphMapCache;
}

export function getEmojisByCategory(category: EmojiCategory): EmojiEntry[] {
  return EMOJI_CATEGORIES[category] ?? [];
}

export function getEmojisByGroup(group: EmojiGroup): EmojiEntry[] {
  return GROUP_EMOJI_MAP[group] ?? [];
}

export function getEmojisByCurriculumTheme(
  theme: CurriculumTheme
): EmojiEntry[] {
  return CURRICULUM_EMOJI_MAP[theme] ?? [];
}

export function getRandomEmojis(
  category: EmojiCategory | undefined,
  count: number
): EmojiEntry[] {
  const pool = category ? (EMOJI_CATEGORIES[category] ?? []) : ALL_EMOJIS;

  if (pool.length === 0 || count <= 0) {
    return [];
  }
  if (count >= pool.length) {
    return [...pool];
  }

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

export function getAllCategories(): EmojiCategory[] {
  return [...ALL_CATEGORIES];
}

export function getTotalEmojiCount(): number {
  return ALL_EMOJIS.length;
}

export function getByGlyph(glyph: string): EmojiEntry | null {
  return resolveFromGlyphMap(getGlyphMap(), glyph);
}

export function isInCatalog(glyph: string): boolean {
  return getByGlyph(glyph) !== null;
}
