import { getByGlyph } from "@mindkid/emoji";
import {
  formatNumberWord,
  formatSpokenLabel,
} from "@mindkid/shared/preschool-terminology";

/** Hình dạng asset tối thiểu mà phép tìm từ khoá cần (`assetSchema`). */
export type KeywordAsset =
  | {
      readonly kind: "emoji";
      readonly ref: string;
      readonly audio_path?: string;
    }
  | {
      readonly kind: "text";
      readonly text: string;
      readonly audio_path?: string;
    }
  | {
      readonly kind: "image";
      readonly path: string;
      readonly audio_path?: string;
    };

export interface AssetLabels {
  glyph?: string;
  label?: string;
  spokenLabel?: string;
  spokenAudioPath?: string;
}

const MAX_KEYWORD_CACHE_SIZE = 512;
const emojiKeywordCache = new Map<string, string | undefined>();
const textKeywordCache = new Map<string, string | undefined>();
const assetLabelsCache = new WeakMap<KeywordAsset, AssetLabels>();
const plainAssetLabelsCache = new Map<string, AssetLabels>();
const EMPTY_ASSET_LABELS: AssetLabels = Object.freeze({});

function getPlainAssetKey(asset: KeywordAsset): string | undefined {
  if (asset.audio_path !== undefined) {
    return undefined;
  }
  if (asset.kind === "emoji") {
    return `e:${asset.ref}`;
  }
  if (asset.kind === "text") {
    return `t:${asset.text}`;
  }
  return undefined;
}

function buildAssetLabels(asset: KeywordAsset): AssetLabels {
  const spokenLabel = spokenKeywordForAsset(asset);
  if (asset.kind === "emoji") {
    return {
      glyph: asset.ref,
      label: asset.ref,
      spokenLabel,
      spokenAudioPath: asset.audio_path,
    };
  }
  if (asset.kind === "text") {
    return {
      label: asset.text,
      spokenLabel,
      spokenAudioPath: asset.audio_path,
    };
  }
  return EMPTY_ASSET_LABELS;
}

/**
 * Chữ hiện trên thẻ và từ khoá đọc được của nó (`spokenLabel`) — dùng chung
 * cho các engine có vật minh hoạ đọc tên khi chạm (Task #273, #275 S5, `BR-PNR-02`).
 */
export function resolveAssetLabels(asset: KeywordAsset): AssetLabels {
  const cached = assetLabelsCache.get(asset);
  if (cached !== undefined) {
    return cached;
  }
  const plainKey = getPlainAssetKey(asset);
  if (plainKey !== undefined) {
    const plainCached = plainAssetLabelsCache.get(plainKey);
    if (plainCached !== undefined) {
      assetLabelsCache.set(asset, plainCached);
      return plainCached;
    }
  }
  const resolved = buildAssetLabels(asset);
  assetLabelsCache.set(asset, resolved);
  if (plainKey !== undefined) {
    if (plainAssetLabelsCache.size >= MAX_KEYWORD_CACHE_SIZE) {
      plainAssetLabelsCache.clear();
    }
    plainAssetLabelsCache.set(plainKey, resolved);
  }
  return resolved;
}

/** Phần chỉ-để-nghe của nhãn vật: bỏ `label` chữ để canvas/view không còn chữ phải đọc (`BR-ENG-10`). */
export type AssetSpeech = Omit<AssetLabels, "label">;

export function resolveAssetSpeech(asset: KeywordAsset): AssetSpeech {
  const { glyph, spokenLabel, spokenAudioPath } = resolveAssetLabels(asset);
  return { glyph, spokenLabel, spokenAudioPath };
}

const GRAPHEMES = new Intl.Segmenter("vi", { granularity: "grapheme" });

/** Keycap: chữ số + (VS16) + U+20E3, lặp một hoặc nhiều lần — `1️⃣5️⃣`. */
const KEYCAP_SEQUENCE = /^(?:[0-9]️?⃣)+$/u;
const KEYCAP_MARKS = /️?⃣/gu;
const VARIATION_SELECTOR = /️/gu;
const SINGLE_LATIN_LETTER = /^[a-z]$/i;

/** Chữ cái Latin trong ô vuông đen, `🅰` (U+1F170) tới `🆉` (U+1F189). */
const NEGATIVE_SQUARED_A = 0x1_f1_70;
const NEGATIVE_SQUARED_Z = 0x1_f1_89;
/** Chữ cái Regional Indicator `🇦` (U+1F1E6) tới `🇿` (U+1F1FF). */
const REGIONAL_INDICATOR_A = 0x1_f1_e6;
const REGIONAL_INDICATOR_Z = 0x1_f1_ff;
const LOWERCASE_A = 0x61;

/** `👨‍…` / `👩‍…` — nghề có giới tính, catalog cấm (`catalog-integrity`). */
const GENDERED_PERSON_PREFIX = /^[\u{1F468}\u{1F469}]‍/u;
const GENDER_SIGN_SUFFIX = /‍[♀♂]️?$/u;
const NEUTRAL_PERSON_PREFIX = "\u{1F9D1}‍";

/**
 * Bảng tên tiếng Việt mầm non cho các emoji trong corpus kỹ năng chưa nằm
 * trong `@mindkid/emoji` (đảm bảo chạm vào hình luôn đọc được từ khoá).
 */
const CORPUS_GLYPH_FALLBACK_NAMES: Readonly<Record<string, string>> = {
  "🪵": "Khúc gỗ",
  "🗝️": "Chìa khóa cổ",
  "🗝": "Chìa khóa cổ",
  "🗼": "Ngọn tháp",
  "☕": "Tách trà",
  "🔮": "Quả cầu pha lê",
  "🍯": "Hũ mật ong",
  "🏰": "Lâu đài",
  "👣": "Dấu chân",
  "⛩️": "Cổng vòm",
  "⛩": "Cổng vòm",
  "🚦": "Đèn giao thông",
  "🪭": "Chiếc quạt xếp",
  "📢": "Loa phóng thanh",
  "🦌": "Con hươu",
  "🛌": "Giường ngủ",
  "🪹": "Tổ chim trống",
  "🩷": "Trái tim hồng",
  "🧭": "La bàn",
  "🪺": "Tổ chim",
  "🚶": "Người đi bộ",
  "🚧": "Rào chắn",
  "🗺️": "Bản đồ",
  "🗺": "Bản đồ",
  "🚨": "Đèn báo động",
  "🫧": "Bong bóng xà phòng",
  "🤫": "Giữ im lặng",
  "🫛": "Đậu Hà Lan",
  "🎖️": "Huy chương",
  "🎖": "Huy chương",
  "🧪": "Ống nghiệm",
  "🗄️": "Tủ ngăn kéo",
  "🗄": "Tủ ngăn kéo",
  "🏛️": "Tòa nhà cổ",
  "🏛": "Tòa nhà cổ",
  "📍": "Đinh ghim",
  "🕳️": "Cái hố",
  "🕳": "Cái hố",
  "🕹️": "Cần gạt",
  "🕹": "Cần gạt",
  "💦": "Giọt nước",
  "🐾": "Dấu chân thú",
  "🍶": "Bình nước",
  "♨️": "Hơi nước ấm",
  "♨": "Hơi nước ấm",
  "🐉": "Con rồng",
  "🏥": "Bệnh viện",
  "⛔": "Biển cấm vào",
  "💮": "Bông hoa trắng",
  "👛": "Chiếc ví nhỏ",
  "🕡": "Đồng hồ sáu giờ rưỡi",
  "🕢": "Đồng hồ bảy giờ rưỡi",
  "🕥": "Đồng hồ mười giờ rưỡi",
  "🦨": "Chồn hôi",
  "🖖": "Bàn tay",
  "🛡️": "Chiếc khiên",
  "🛡": "Chiếc khiên",
  "🍮": "Bánh flan",
  "😸": "Mèo cười",
  "⚗️": "Bình thí nghiệm",
  "⚗": "Bình thí nghiệm",
  "🛝": "Cầu trượt",
  "🏪": "Cửa hàng",
  "⚠️": "Biển cảnh báo",
  "⚠": "Biển cảnh báo",
  "✉️": "Phong bì",
  "✉": "Phong bì",
  "🪧": "Tấm bảng",
  "🏈": "Bóng bầu dục",
  "🔄": "Vòng xoay",
  "🤚": "Bàn tay",
  "🥾": "Đôi ủng",
  "☸️": "Bánh lái",
  "☸": "Bánh lái",
  "🎡": "Vòng đu quay",
  "🚫": "Biển cấm",
  "📜": "Cuộn giấy",
  "☎️": "Điện thoại",
  "☎": "Điện thoại",
  "📣": "Cái loa",
  "🪕": "Đàn gẩy",
  "🩰": "Giày múa",
  "🫗": "Rót nước",
  "🪮": "Cái lược",
  "🛍️": "Túi mua sắm",
  "🛍": "Túi mua sắm",
  "🥡": "Hộp giấy",
  "🧂": "Lọ muối",
  "🛕": "Ngôi chùa",
  "🏯": "Thành cổ",
  "🥟": "Bánh xếp",
  "🍧": "Ly đá bào",
  "🪢": "Dây thừng",
  "🔪": "Con dao",
  "🔌": "Phích cắm điện",
  "🧑‍🤝‍🧑": "Nắm tay nhau",
  "🧗": "Leo núi",
  "👩‍🎨": "Họa sĩ",
  "🧑‍🎨": "Họa sĩ",
  "👨‍🎨": "Họa sĩ",
  "📱": "Điện thoại cảm ứng",
  "🖥️": "Máy tính bàn",
  "🖥": "Máy tính bàn",
  "🖱️": "Chuột máy tính",
  "🖱": "Chuột máy tính",
  "○": "Hình tròn",
  "🔝": "Phía trên",
  "🙅": "Khoanh tay lắc đầu",
  "🗣️": "Đang nói",
  "🗣": "Đang nói",
  "💬": "Lời nói",
  "🔈": "Loa nhỏ",
  "🔊": "Loa to",
  "🚻": "Nhà vệ sinh",
  "🥖": "Bánh mì dài",
  "↕️": "Mũi tên lên xuống",
  "↕": "Mũi tên lên xuống",
  "❔": "Dấu chấm hỏi",
  "🙌": "Vỗ tay reo hò",
  "🏹": "Cung tên",
  "🥋": "Võ phục",
  "💈": "Cây cột sọc",
  "📉": "Đường xiên xuống",
  "➰": "Nét khuyết đơn",
  "➿": "Nét khuyết kép",
  "📛": "Bảng tên",
  "💌": "Thiệp hồng",
  "💤": "Ngủ say",
  // Đồ vật & ký ức "Tuổi thơ Việt × Giấy Gỗ Mộc"
  "🪁": "Cánh diều",
  "🏮": "Đèn lồng",
  "🪷": "Hoa sen",
  "🎋": "Cành trúc",
  "🎍": "Khóm tre",
  "🥁": "Cái trống",
  "🪈": "Ống sáo trúc",
  "🌾": "Bông lúa",
  "🐃": "Con trâu",
  "👒": "Chiếc nón",
  "🥮": "Bánh trung thu",
  "🧧": "Bao lì xì",
  "🫖": "Ấm trà gốm",
  "🍵": "Chén trà ấm",
  "🪇": "Lục lạc gỗ",
  "🧺": "Cái rổ tre",
  "🥣": "Cái bát gốm",
  "🥢": "Đôi đũa tre",
};

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
  if (neutral !== glyph) {
    const neutralName = getByGlyph(neutral)?.name;
    if (neutralName) {
      return neutralName;
    }
  }
  return (
    CORPUS_GLYPH_FALLBACK_NAMES[glyph] ??
    CORPUS_GLYPH_FALLBACK_NAMES[glyph.replace(VARIATION_SELECTOR, "")]
  );
}

function negativeSquaredLetter(glyph: string): string | undefined {
  const bare = glyph.replace(VARIATION_SELECTOR, "");
  const code = bare.codePointAt(0);
  if (code === undefined || [...bare].length !== 1) {
    return undefined;
  }
  if (code >= NEGATIVE_SQUARED_A && code <= NEGATIVE_SQUARED_Z) {
    return String.fromCodePoint(LOWERCASE_A + (code - NEGATIVE_SQUARED_A));
  }
  if (code >= REGIONAL_INDICATOR_A && code <= REGIONAL_INDICATOR_Z) {
    return String.fromCodePoint(LOWERCASE_A + (code - REGIONAL_INDICATOR_A));
  }
  return undefined;
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

function computeEmojiKeyword(ref: string): string | undefined {
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

function emojiKeyword(ref: string): string | undefined {
  if (emojiKeywordCache.has(ref)) {
    return emojiKeywordCache.get(ref);
  }
  const resolved = computeEmojiKeyword(ref);
  if (emojiKeywordCache.size >= MAX_KEYWORD_CACHE_SIZE) {
    emojiKeywordCache.clear();
  }
  emojiKeywordCache.set(ref, resolved);
  return resolved;
}

function textKeyword(text: string): string | undefined {
  if (textKeywordCache.has(text)) {
    return textKeywordCache.get(text);
  }
  const resolved = formatSpokenLabel(text);
  if (textKeywordCache.size >= MAX_KEYWORD_CACHE_SIZE) {
    textKeywordCache.clear();
  }
  textKeywordCache.set(text, resolved);
  return resolved;
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
    return textKeyword(asset.text);
  }
  return undefined;
}
