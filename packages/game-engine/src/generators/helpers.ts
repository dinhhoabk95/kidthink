import type { Rng } from "#src/rng/types";
import type {
  ContrastVocabulary,
  ThemeVocabulary,
  VocabularyEntry,
} from "./types.js";

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

/**
 * Vốn từ chủ đề tương phản cho engine phân loại. Thiếu thì ném: lấy vật nhiễu
 * từ chính chủ đề cho ra tiêu chí không nhị phân (`GT-002.md` §14).
 */
export function getContrast(
  vocab: ThemeVocabulary,
  minCount: number
): ContrastVocabulary {
  const contrast = vocab.contrast;
  if (!contrast || contrast.nouns.length < minCount) {
    throw new Error(
      `Chủ đề '${vocab.theme}' thiếu vốn từ tương phản: cần ${minCount} danh từ ở \`contrast\`.`
    );
  }
  return contrast;
}

const KEYCAP_TEN = "🔟";

/** Emoji keycap cho số 0..10 — có trong danh mục `number-symbol` của `@mindkid/emoji`. */
export function numberKeycap(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > 10) {
    throw new Error(`numberKeycap(): ${n} ngoài khoảng 0..10`);
  }
  return n === 10 ? KEYCAP_TEN : `${n}\uFE0F\u20E3`;
}

export interface NumericOption {
  option_id: string;
  value: number;
  is_correct: boolean;
}

/** Phương án số: đáp án + nhiễu trong ±3 (không vượt `maxValue`), đã xáo. */
export function generateNumericOptions(
  correctValue: number,
  optionCount: number,
  rng: Rng,
  maxValue: number
): NumericOption[] {
  const candidates: number[] = [];
  for (
    let v = Math.max(1, correctValue - 3);
    v <= Math.min(maxValue, correctValue + 3);
    v++
  ) {
    if (v !== correctValue) {
      candidates.push(v);
    }
  }
  for (let v = 1; candidates.length < optionCount - 1; v++) {
    if (v !== correctValue && !candidates.includes(v)) {
      candidates.push(v);
    }
  }
  const list: NumericOption[] = [
    { option_id: `opt_${correctValue}`, value: correctValue, is_correct: true },
    ...sampleUnique(rng, candidates, optionCount - 1).map((value) => ({
      option_id: `opt_${value}`,
      value,
      is_correct: false,
    })),
  ];
  return sampleUnique(rng, list, list.length);
}
