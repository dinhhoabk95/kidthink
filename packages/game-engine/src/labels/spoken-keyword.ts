import { getByGlyph } from "@mindkid/emoji";
import {
  formatNumberWord,
  formatSpokenLabel,
} from "@mindkid/shared/preschool-terminology";

/** Hình dạng asset tối thiểu mà phép tìm từ khoá cần (`assetSchema`). */
export type KeywordAsset =
  | { readonly kind: "emoji"; readonly ref: string }
  | { readonly kind: "text"; readonly text: string }
  | { readonly kind: "image"; readonly path: string };

const GRAPHEMES = new Intl.Segmenter("vi", { granularity: "grapheme" });

/** Keycap: chữ số + (VS16) + U+20E3, lặp một hoặc nhiều lần — `1️⃣5️⃣`. */
const KEYCAP_SEQUENCE = /^(?:[0-9]️?⃣)+$/u;
const KEYCAP_MARKS = /️?⃣/gu;
const VARIATION_SELECTOR = /️/gu;
const SINGLE_LATIN_LETTER = /^[a-z]$/i;

/** Chữ cái Latin trong ô vuông đen, `🅰` (U+1F170) tới `🆉` (U+1F189). */
const NEGATIVE_SQUARED_A = 0x1_f1_70;
const NEGATIVE_SQUARED_Z = 0x1_f1_89;
const LOWERCASE_A = 0x61;

/** `👨‍…` / `👩‍…` — nghề có giới tính, catalog cấm (`catalog-integrity`). */
const GENDERED_PERSON_PREFIX = /^[\u{1F468}\u{1F469}]‍/u;
const GENDER_SIGN_SUFFIX = /‍[♀♂]️?$/u;
const NEUTRAL_PERSON_PREFIX = "\u{1F9D1}‍";

/**
 * Tên tiếng Việt của một glyph. Glyph nghề có giới tính (`👨‍⚕️`, `💂‍♂️`) bị
 * catalog cấm nhưng corpus vẫn dùng — tra sang bản trung tính (`🧑‍⚕️`, `💂`).
 */
function lookupGlyphName(glyph: string): string | undefined {
  const direct = getByGlyph(glyph)?.name;
  if (direct) {
    return direct;
  }
  const neutral = glyph
    .replace(GENDERED_PERSON_PREFIX, NEUTRAL_PERSON_PREFIX)
    .replace(GENDER_SIGN_SUFFIX, "");
  return neutral === glyph ? undefined : getByGlyph(neutral)?.name;
}

function negativeSquaredLetter(glyph: string): string | undefined {
  const bare = glyph.replace(VARIATION_SELECTOR, "");
  const code = bare.codePointAt(0);
  if (
    code === undefined ||
    [...bare].length !== 1 ||
    code < NEGATIVE_SQUARED_A ||
    code > NEGATIVE_SQUARED_Z
  ) {
    return undefined;
  }
  return String.fromCodePoint(LOWERCASE_A + (code - NEGATIVE_SQUARED_A));
}

/** Nhiều bản của cùng một emoji có tên (`🍎🍎🍎`) → "ba quả táo". */
function repeatedGlyphPhrase(glyph: string): string | undefined {
  const parts = [...GRAPHEMES.segment(glyph)].map((p) => p.segment);
  const [first] = parts;
  if (!first || parts.length < 2 || parts.some((p) => p !== first)) {
    return undefined;
  }
  const name = lookupGlyphName(first);
  if (!name) {
    return undefined;
  }
  return `${formatNumberWord(parts.length)} ${name.charAt(0).toLowerCase()}${name.slice(1)}`;
}

function emojiKeyword(ref: string): string | undefined {
  const named = lookupGlyphName(ref);
  if (named) {
    return formatSpokenLabel(named);
  }
  if (KEYCAP_SEQUENCE.test(ref)) {
    return formatSpokenLabel(ref.replace(KEYCAP_MARKS, ""));
  }
  const letter = negativeSquaredLetter(ref);
  if (letter) {
    return formatSpokenLabel(letter);
  }
  if (SINGLE_LATIN_LETTER.test(ref)) {
    return formatSpokenLabel(ref.toLowerCase());
  }
  return repeatedGlyphPhrase(ref);
}

/**
 * Từ khoá đọc lại khi trẻ chạm vào một hình minh hoạ (Task #274 S7,
 * `BR-PNR-02`). Trả `undefined` khi không dựng được tên đọc được — Cấm —
 * NEVER trả glyph thô: TTS tiếng Việt đọc nó bằng tên tiếng Anh hoặc im lặng.
 */
export function spokenKeywordForAsset(asset: KeywordAsset): string | undefined {
  if (asset.kind === "emoji") {
    return emojiKeyword(asset.ref);
  }
  if (asset.kind === "text") {
    return formatSpokenLabel(asset.text);
  }
  return undefined;
}
