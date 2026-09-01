import type { Rng } from "#src/rng/types";
import type { ThemeVocabulary, VocabularyEntry } from "./types.js";

export const VALID_GENERATOR_THEMES: readonly string[] = [
  "school",
  "farm",
  "home",
  "animal",
  "nature",
  "ocean",
  "food",
  "vehicle",
  "art",
  "space",
  "family",
  "body",
  "weather",
  "festival",
] as const;

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

export function getNouns(
  vocab: ThemeVocabulary,
  minCount = 6
): VocabularyEntry[] {
  const result = [...(vocab?.nouns || [])];
  if (result.length < minCount) {
    throw new Error(
      `Chủ đề '${vocab?.theme ?? "?"}' thiếu danh từ: có ${result.length}, cần ${minCount}. ` +
        "Bổ sung vào registry chủ đề thay vì độn từ ngoài chủ đề."
    );
  }
  return result;
}
