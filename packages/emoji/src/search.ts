/**
 * @kidthink/emoji — Search
 * Fuzzy search qua name_vi, keywords_vi, keywords_en.
 * Case-insensitive, diacritics-insensitive (không cần dấu).
 */

import { ALL_EMOJIS } from "./registry";
import type { EmojiEntry } from "./types";

/**
 * Normalize text for diacritics-insensitive search.
 * Removes Vietnamese diacritical marks and converts to lowercase.
 */
function normalize(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      // Handle Vietnamese special characters that NFD doesn't decompose
      .replace(/đ/g, "d")
      .replace(/Đ/g, "d")
  );
}

/**
 * Search emoji by query string.
 * Searches across name_vi, keywords_vi, and keywords_en.
 * Case-insensitive and diacritics-tolerant.
 *
 * @param query - Search query (Vietnamese or English)
 * @param limit - Maximum number of results (default: 50)
 * @returns Matching emoji entries sorted by relevance
 */
export function searchEmoji(query: string, limit = 50): EmojiEntry[] {
  if (!query) {
    return [];
  }
  const trimmed = query.trim();
  if (trimmed.length === 0) {
    return [];
  }

  const normalizedQuery = normalize(trimmed);
  const results: Array<{ entry: EmojiEntry; score: number }> = [];

  for (const entry of ALL_EMOJIS) {
    const score = scoreEntry(entry, normalizedQuery, trimmed);
    if (score > 0) {
      results.push({ entry, score });
    }
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.entry);
}

/**
 * Score a keyword list: exact match wins immediately, partial match is the
 * fallback. Mirrors the priority order documented on {@link scoreEntry}.
 */
function scoreKeywords(
  keywords: readonly string[],
  normalizedQuery: string,
  normalizeKeyword: (keyword: string) => string,
  exactScore: number,
  partialScore: number
): number {
  let best = 0;
  for (const keyword of keywords) {
    const normalizedKeyword = normalizeKeyword(keyword);
    if (normalizedKeyword === normalizedQuery) {
      return exactScore;
    }
    if (normalizedKeyword.includes(normalizedQuery)) {
      best = partialScore;
    }
  }
  return best;
}

/**
 * Relevance score for one entry. Higher wins.
 *
 * name exact 100 · vi keyword exact 90 · name partial 80 · en keyword exact 70
 * · vi keyword partial 60 · en keyword partial 40 · emoji character 100 · 0 = no match
 */
function scoreEntry(
  entry: EmojiEntry,
  normalizedQuery: string,
  trimmedQuery: string
): number {
  const normalizedName = normalize(entry.name_vi);
  if (normalizedName === normalizedQuery) {
    return 100;
  }
  if (normalizedName.includes(normalizedQuery)) {
    return 80;
  }

  const viScore = scoreKeywords(
    entry.keywords_vi,
    normalizedQuery,
    normalize,
    90,
    60
  );
  if (viScore > 0) {
    return viScore;
  }

  const enScore = scoreKeywords(
    entry.keywords_en,
    normalizedQuery,
    (keyword) => keyword.toLowerCase(),
    70,
    40
  );
  if (enScore > 0) {
    return enScore;
  }

  return entry.emoji === trimmedQuery ? 100 : 0;
}
