import { createRng as createEngineRng } from "@mindkid/game-engine";
import type { DatasetAsset, DatasetItem } from "@mindkid/shared";
import {
  isChildSafePrompt as checkSafePrompt,
  sanitizeChildPrompt as cleanChildPrompt,
  countPromptWords as countWords,
  resolvePreschoolAgeGroup as mapPreschoolAgeGroup,
  type PreschoolAgeGroup,
  pickAgeBandPrompt as selectAgeBandPrompt,
} from "#src/inventories/koguma-pedagogy";
import {
  resolveThemeContainers as mapThemeContainers,
  type VnContainerPair,
} from "#src/inventories/vn-preschool-culture";

export function countPromptWords(text: string): number {
  return countWords(text);
}

export function isChildSafePrompt(
  text: string,
  options?: { readonly forbidConjunctionVa?: boolean }
): boolean {
  return checkSafePrompt(text, options);
}

export function resolvePreschoolAgeGroup(band?: string): PreschoolAgeGroup {
  return mapPreschoolAgeGroup(band);
}

export function pickAgeBandPrompt(
  band: string | undefined,
  prompts: Readonly<Record<PreschoolAgeGroup, string>>,
  fallback: string,
  options?: { readonly forbidConjunctionVa?: boolean }
): string {
  return selectAgeBandPrompt(band, prompts, fallback, options);
}

export function sanitizeChildPrompt(
  candidate: string,
  fallback: string,
  options?: { readonly forbidConjunctionVa?: boolean }
): string {
  return cleanChildPrompt(candidate, fallback, options);
}

export function resolveThemeContainers(theme?: string): VnContainerPair {
  return mapThemeContainers(theme);
}

export function createRng(seed: number): ReturnType<typeof createEngineRng> {
  return createEngineRng(seed);
}

/**
 * Deterministic Fisher-Yates shuffle using an Rng instance.
 */
export function shuffleDeterministic<T>(
  items: readonly T[],
  rng: ReturnType<typeof createRng>
): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = rng.nextInt(i + 1);
    const temp = result[i];
    const target = result[j];
    if (temp !== undefined && target !== undefined) {
      result[i] = target;
      result[j] = temp;
    }
  }
  return result;
}

export function safeGetItem<T>(arr: readonly T[], idx: number): T {
  const item = arr[idx];
  if (item === undefined) {
    throw new Error(`[BR-SDS-05] Không tìm thấy phần tử tại index ${idx}`);
  }
  return item;
}

/**
 * Resolves a DatasetItem into an Asset, prioritizing glyph (text) if preferGlyph is true,
 * otherwise image/emoji, fallback to label text.
 */
export function resolveItemAsset(
  item: DatasetItem,
  preferGlyph = true
): DatasetAsset {
  if (preferGlyph && item.glyph) {
    return { kind: "text", text: item.glyph };
  }
  if (item.image) {
    return item.image;
  }
  if (item.glyph) {
    return { kind: "text", text: item.glyph };
  }
  return { kind: "text", text: item.label };
}

export type KeywordAsset = DatasetAsset & { readonly audio_path?: string };

/**
 * Asset của item, mang theo mp3 tên vật có sẵn trong dataset (`audio_path`).
 * Chạm lại hình minh hoạ phát mp3 này trước TTS (`play-narration.md` §7,
 * Task #274). Ảnh không có từ khoá đọc được nên không mang mp3.
 */
export function keywordAsset(item: DatasetItem): KeywordAsset {
  const asset = resolveItemAsset(item, true);
  if (asset.kind === "image" || !item.audio_path) {
    return asset;
  }
  return { ...asset, audio_path: item.audio_path };
}

/**
 * Khóa định danh của asset để kiểm tra tính phân biệt được và trùng lặp.
 */
export function assetKey(asset: DatasetAsset): string {
  if (asset.kind === "text") {
    return `text:${asset.text}`;
  }
  if (asset.kind === "emoji") {
    return `emoji:${asset.ref}`;
  }
  if (asset.kind === "image") {
    return `image:${asset.path}`;
  }
  return JSON.stringify(asset);
}

const VARIATION_SELECTOR_16 = /️/gu;

/**
 * Khoá **nhìn thấy** của asset: `text:"🍎"` và `emoji:"🍎"` hiện ra giống hệt nhau
 * trên màn nên cùng khoá (bỏ cả VS16). Dùng khi luật nói về cái trẻ nhìn thấy —
 * hai thẻ "giống nhau", đích khác vật nhặt — thay cho `assetKey` (khoá dữ liệu).
 */
export function visualAssetKey(asset: DatasetAsset): string {
  if (asset.kind === "image") {
    return `image:${asset.path}`;
  }
  const shown = asset.kind === "text" ? asset.text : asset.ref;
  return `shown:${shown.replace(VARIATION_SELECTOR_16, "").trim()}`;
}

const GRAPHEMES = new Intl.Segmenter("vi", { granularity: "grapheme" });
const LETTER_OR_DIGIT = /[\p{L}\p{N}]/u;
const DIGIT = /\p{N}/u;

/**
 * Chuỗi là đúng **một** hình (một grapheme) và không phải chữ/số. `allowLetters`
 * nhận thêm một chữ cái đơn ("a") — vẫn là một vật để đếm, khác chữ số "7" là
 * một con số đọc lên được.
 */
export function isSingleObjectText(
  text: string,
  allowLetters = false
): boolean {
  const t = text.trim();
  return (
    t.length > 0 &&
    [...GRAPHEMES.segment(t)].length === 1 &&
    !(allowLetters ? DIGIT : LETTER_OR_DIGIT).test(t)
  );
}

function singleObjectImage(item: DatasetItem): DatasetAsset | null {
  const img = item.image;
  if (img?.kind === "image") {
    return img;
  }
  if (img?.kind === "emoji" && isSingleObjectText(img.ref)) {
    return img;
  }
  if (img?.kind === "text" && isSingleObjectText(img.text)) {
    return { kind: "emoji", ref: img.text.trim() };
  }
  return null;
}

export interface SingleObjectToken {
  readonly item: DatasetItem;
  readonly asset: DatasetAsset;
}

/**
 * Vật đếm: một vật đơn để trẻ đếm từng cái (`BR-E028-13`, `BR-E012-10`). Ưu
 * tiên glyph một-vật ("🍎", giữ `text` để khái niệm hiện ra, `BR-SDS-03`), rồi
 * ảnh một-vật; `preferred` được xét trước các vật khác. Không có thì `null`.
 */
export function pickSingleObjectToken(
  items: readonly DatasetItem[],
  preferred?: DatasetItem,
  allowLetters = false
): SingleObjectToken | null {
  const ordered = preferred
    ? [preferred, ...items.filter((i) => i !== preferred)]
    : [...items];
  const singleObjectGlyph = (item: DatasetItem): DatasetAsset | null =>
    item.glyph && isSingleObjectText(item.glyph, allowLetters)
      ? { kind: "text", text: item.glyph.trim() }
      : null;
  for (const pick of [singleObjectGlyph, singleObjectImage]) {
    for (const item of ordered) {
      const asset = pick(item);
      if (asset) {
        return { item, asset };
      }
    }
  }
  return null;
}

const DIGITS_ONLY = /^\p{N}+$/u;
const SINGLE_LETTER = /^\p{L}$/u;

/**
 * Tên của thứ **hiện trên màn**: asset là chữ số "1" thì gọi "số 1", chữ "a"
 * thì "chữ a"; còn lại là `label` của vật. Đề gọi tên thứ trẻ nhìn thấy, không
 * gọi tên vật minh hoạ đã bị glyph che (`BR-E018-08`).
 */
export function shownName(item: DatasetItem, asset: DatasetAsset): string {
  if (asset.kind !== "text") {
    return item.label;
  }
  const t = asset.text.trim();
  if (DIGITS_ONLY.test(t)) {
    return `số ${t}`;
  }
  if (SINGLE_LETTER.test(t)) {
    return `chữ ${t}`;
  }
  return item.label;
}
