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

/**
 * Kho từ ngắn hơn yêu cầu là **lỗi dữ liệu**, không phải điều kiện runtime —
 * nên nó ném, Cấm — NEVER độn thầm.
 *
 * Bản cũ độn từ một danh sách hoa quả cố định. Vì mọi chủ đề chỉ có 5 danh từ
 * còn generator xin 6–10, nhánh độn là đường đi **mặc định**: cả 21 file sinh
 * ra đều dính emoji lạc chủ đề (một level `school` chứa 🍎🍌🥕🍓🍇) trong khi
 * `gen-levels.ts` vẫn đóng dấu `theme_tag: "school"` lên nó. Tệ hơn, danh sách
 * độn dùng **glyph thô** ở `emoji_ref` trong khi registry tra theo mã `EMJ-*`,
 * nên mọi mục độn đều `not_found` lúc render.
 */
export function getNouns(
  vocab: ThemeVocabulary,
  minCount = 6
): VocabularyEntry[] {
  const result = [...(vocab?.nouns || [])];
  if (result.length < minCount) {
    throw new Error(
      `Chủ đề '${vocab?.theme ?? "?"}' thiếu danh từ: có ${result.length}, cần ${minCount}. ` +
        "Bổ sung vào CONTENT_THEMES thay vì độn từ ngoài chủ đề."
    );
  }
  return result;
}
