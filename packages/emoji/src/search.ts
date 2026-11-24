/**
 * @mindkid/emoji — Search
 * Fuzzy search qua name và keywords (lazy pre-indexed, không dấu + có dấu).
 */

import { ALL_EMOJIS } from "#src/registry";
import type { EmojiEntry } from "#src/types";

const DIACRITICS_RE = /[\u0300-\u036f]/g;
const VIETNAMESE_D_RE = /[đĐ]/g;

const DEFAULT_SEARCH_LIMIT = 50;
const SCORE_EXACT_NAME = 100;
const SCORE_EXACT_GLYPH = 100;
const SCORE_EXACT_KEYWORD = 90;
const SCORE_PARTIAL_NAME = 80;
const SCORE_PARTIAL_KEYWORD = 60;

interface IndexedEmojiEntry {
  readonly entry: EmojiEntry;
  readonly normalizedKeywords: readonly string[];
  readonly normalizedName: string;
}

let searchIndexCache: readonly IndexedEmojiEntry[] | null = null;

function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(DIACRITICS_RE, "")
    .replace(VIETNAMESE_D_RE, "d");
}

function getSearchIndex(): readonly IndexedEmojiEntry[] {
  if (!searchIndexCache) {
    searchIndexCache = ALL_EMOJIS.map((entry) => ({
      entry,
      normalizedName: normalizeSearchText(entry.name),
      normalizedKeywords: entry.keywords.map(normalizeSearchText),
    }));
  }
  return searchIndexCache;
}

function scoreKeywords(
  normalizedKeywords: readonly string[],
  normalizedQuery: string
): number {
  let best = 0;
  for (const keyword of normalizedKeywords) {
    if (keyword === normalizedQuery) {
      return SCORE_EXACT_KEYWORD;
    }
    if (keyword.includes(normalizedQuery)) {
      best = SCORE_PARTIAL_KEYWORD;
    }
  }
  return best;
}

function scoreIndexedEntry(
  indexed: IndexedEmojiEntry,
  normalizedQuery: string,
  trimmedQuery: string
): number {
  if (indexed.normalizedName === normalizedQuery) {
    return SCORE_EXACT_NAME;
  }
  if (indexed.normalizedName.includes(normalizedQuery)) {
    return SCORE_PARTIAL_NAME;
  }

  const keywordScore = scoreKeywords(
    indexed.normalizedKeywords,
    normalizedQuery
  );
  if (keywordScore > 0) {
    return keywordScore;
  }

  return indexed.entry.emoji === trimmedQuery ? SCORE_EXACT_GLYPH : 0;
}

export function searchEmoji(
  query: string,
  limit = DEFAULT_SEARCH_LIMIT
): EmojiEntry[] {
  if (!query) {
    return [];
  }
  const trimmed = query.trim();
  if (trimmed.length === 0) {
    return [];
  }

  const normalizedQuery = normalizeSearchText(trimmed);
  const matched: Array<{ entry: EmojiEntry; score: number }> = [];

  for (const indexed of getSearchIndex()) {
    const score = scoreIndexedEntry(indexed, normalizedQuery, trimmed);
    if (score > 0) {
      matched.push({ entry: indexed.entry, score });
    }
  }

  return matched
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.entry);
}
