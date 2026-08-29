import type { Rng } from "#src/rng/types";
import type { ThemeVocabulary, VocabularyEntry } from "./types.js";

export function sampleUnique<T>(rng: Rng, array: T[], count: number): T[] {
  if (count <= 0 || array.length === 0) {
    return [];
  }
  const copy = [...array];
  const result: T[] = [];
  const take = Math.min(count, copy.length);
  for (let i = 0; i < take; i++) {
    const idx = rng.nextInt(copy.length);
    const item = copy[idx];
    if (item !== undefined) {
      result.push(item);
      copy.splice(idx, 1);
    }
  }
  return result;
}

export function pickOne<T>(rng: Rng, array: T[]): T {
  if (array.length === 0) {
    throw new Error("Cannot pick from empty array");
  }
  const idx = rng.nextInt(array.length);
  const item = array[idx];
  if (item === undefined) {
    throw new Error("Element at selected index is undefined");
  }
  return item;
}

const FALLBACK_NOUNS: VocabularyEntry[] = [
  { emoji_ref: "🍎", label_vi: "Táo" },
  { emoji_ref: "🍌", label_vi: "Chuối" },
  { emoji_ref: "🥕", label_vi: "Cà rốt" },
  { emoji_ref: "🍓", label_vi: "Dâu tây" },
  { emoji_ref: "🍇", label_vi: "Nho" },
  { emoji_ref: "🍉", label_vi: "Dưa hấu" },
  { emoji_ref: "🐱", label_vi: "Mèo" },
  { emoji_ref: "🐶", label_vi: "Chó" },
  { emoji_ref: "⭐", label_vi: "Ngôi sao" },
  { emoji_ref: "🚗", label_vi: "Ô tô" },
  { emoji_ref: "🎈", label_vi: "Bóng bay" },
  { emoji_ref: "🎁", label_vi: "Hộp quà" },
];

export function getNouns(
  vocab: ThemeVocabulary,
  minCount = 6
): VocabularyEntry[] {
  const result = [...(vocab?.nouns || [])];
  if (result.length < minCount) {
    for (const fb of FALLBACK_NOUNS) {
      if (!result.some((r) => r.emoji_ref === fb.emoji_ref)) {
        result.push(fb);
      }
      if (result.length >= minCount) {
        break;
      }
    }
  }
  return result;
}
