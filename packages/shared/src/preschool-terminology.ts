/**
 * Chuẩn hoá ngôn ngữ, thuật ngữ âm thanh & hiển thị cho trẻ mầm non 3–6 tuổi.
 *
 * Quy tắc sư phạm mầm non Việt Nam:
 * - Số học: có từ loại "Số" ("Số ba", "số ba") thay vì cộc lốc "ba".
 * - Hình học: có từ loại "Hình" ("Hình tròn", "hình tròn") thay vì "tròn", "Tròn đỏ".
 * - Không gian: có giới từ định hướng ("Bên trái", "Ở trên", "Phía trước").
 * - Chữ cái: có từ loại "Chữ" ("Chữ a", "chữ a").
 * - Không lặp từ khi ghép câu ("các hình tròn", CẤM "các hình hình tròn", CẤM "các hình số ba").
 */

const NUMBER_WORDS: Readonly<Record<string, string>> = {
  "0": "không",
  "1": "một",
  "2": "hai",
  "3": "ba",
  "4": "bốn",
  "5": "năm",
  "6": "sáu",
  "7": "bảy",
  "8": "tám",
  "9": "chín",
  "10": "mười",
  "11": "mười một",
  "12": "mười hai",
  "13": "mười ba",
  "14": "mười bốn",
  "15": "mười lăm",
  "16": "mười sáu",
  "17": "mười bảy",
  "18": "mười tám",
  "19": "mười chín",
  "20": "hai mươi",
};

const VIETNAMESE_NUMBERS = new Set([
  "không",
  "một",
  "hai",
  "ba",
  "bốn",
  "năm",
  "sáu",
  "bảy",
  "tám",
  "chín",
  "mười",
  "mười một",
  "mười hai",
  "mười ba",
  "mười bốn",
  "mười lăm",
  "mười sáu",
  "mười bảy",
  "mười tám",
  "mười chín",
  "hai mươi",
]);

const SHAPE_WORDS = new Set([
  "tròn",
  "vuông",
  "tam giác",
  "chữ nhật",
  "thoi",
  "bầu dục",
  "oval",
  "ngôi sao",
  "trái tim",
  "tim",
  "ngũ giác",
  "lục giác",
  "hình thang",
  "kim cương",
]);

const SPATIAL_MAP: Readonly<Record<string, string>> = {
  trái: "bên trái",
  phải: "bên phải",
  trên: "ở trên",
  dưới: "ở dưới",
  trước: "phía trước",
  sau: "phía sau",
  trong: "bên trong",
  ngoài: "bên ngoài",
  giữa: "ở giữa",
  góc: "trong góc",
};

const DIGITS_ONLY_RE = /^\d+$/;
const SO_NUMBER_RE = /^số\s+\d+$/i;
const SO_WORD_RE = /^số\s+[a-zà-ỹ\s]+$/i;
const SINGLE_LETTER_RE = /^[a-zA-Zà-ỹÀ-Ỹ]$/;

export interface TerminologyOptions {
  readonly value?: number;
  readonly glyph?: string;
  readonly kind?: string;
}

/**
 * Kiểm tra một chuỗi hoặc asset có phải là số học hay không.
 */
export function isNumberEntity(
  label: string,
  opts?: TerminologyOptions
): boolean {
  if (opts?.value !== undefined) {
    return true;
  }
  if (opts?.glyph && DIGITS_ONLY_RE.test(opts.glyph.trim())) {
    return true;
  }
  const clean = label.trim().toLowerCase();
  if (SO_NUMBER_RE.test(clean) || SO_WORD_RE.test(clean)) {
    return true;
  }
  if (DIGITS_ONLY_RE.test(clean)) {
    return true;
  }
  return VIETNAMESE_NUMBERS.has(clean);
}

/**
 * Kiểm tra một chuỗi có phải là hình học hay không.
 */
export function isShapeEntity(label: string): boolean {
  const clean = label.trim().toLowerCase();
  if (clean.startsWith("hình ")) {
    return true;
  }
  for (const s of SHAPE_WORDS) {
    if (clean === s || clean.startsWith(`${s} `)) {
      return true;
    }
  }
  return false;
}

/**
 * Kiểm tra một chuỗi có phải là chữ cái hay không.
 */
export function isLetterEntity(
  label: string,
  opts?: TerminologyOptions
): boolean {
  const clean = label.trim().toLowerCase();
  if (clean.startsWith("chữ ") || clean.startsWith("chữ cái ")) {
    return true;
  }
  if (opts?.glyph && SINGLE_LETTER_RE.test(opts.glyph.trim())) {
    return true;
  }
  return SINGLE_LETTER_RE.test(clean);
}

function formatNumberDisplay(
  raw: string,
  lower: string,
  opts?: TerminologyOptions
): string {
  if (lower.startsWith("số ")) {
    const rest = raw.slice(3).trim();
    return `Số ${rest}`;
  }
  if (DIGITS_ONLY_RE.test(raw)) {
    const word = NUMBER_WORDS[raw] ?? raw;
    return `Số ${word}`;
  }
  if (VIETNAMESE_NUMBERS.has(lower)) {
    return `Số ${lower}`;
  }
  if (opts?.value !== undefined) {
    const word = NUMBER_WORDS[String(opts.value)] ?? String(opts.value);
    return `Số ${word}`;
  }
  return `Số ${raw}`;
}

function formatShapeDisplay(raw: string, lower: string): string {
  if (lower.startsWith("hình ")) {
    const rest = raw.slice(5).trim();
    return `Hình ${rest}`;
  }
  return `Hình ${raw.toLowerCase()}`;
}

function formatLetterDisplay(raw: string, lower: string): string {
  if (lower.startsWith("chữ ")) {
    const rest = raw.slice(4).trim();
    return `Chữ ${rest}`;
  }
  return `Chữ ${raw}`;
}

/**
 * Sinh nhãn hiển thị trực quan (Display Label) cho thẻ, tiêu đề:
 * Ví dụ: "Số ba", "Hình tròn", "Chữ a", "Bên trái", "Quả táo"
 */
export function formatDisplayLabel(
  label: string,
  opts?: TerminologyOptions
): string {
  const raw = label.trim();
  const lower = raw.toLowerCase();

  // 1. Số học
  if (isNumberEntity(raw, opts)) {
    return formatNumberDisplay(raw, lower, opts);
  }

  // 2. Hình học
  if (isShapeEntity(raw)) {
    return formatShapeDisplay(raw, lower);
  }

  // 3. Phương hướng không gian
  if (SPATIAL_MAP[lower]) {
    const term = SPATIAL_MAP[lower];
    return term.charAt(0).toUpperCase() + term.slice(1);
  }

  // 4. Chữ cái
  if (isLetterEntity(raw, opts)) {
    return formatLetterDisplay(raw, lower);
  }

  // 5. Viết hoa chữ đầu tự nhiên
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

/**
 * Sinh nhãn phát âm (Spoken Label) cho TTS hoặc mô hình đọc theo:
 * Ví dụ: "Số ba", "Hình tròn đỏ", "Chữ a"
 */
export function formatSpokenLabel(
  label: string,
  opts?: TerminologyOptions
): string {
  return formatDisplayLabel(label, opts);
}

/**
 * Sinh nhãn lồng trong câu lệnh (Prompt Label - chữ thường):
 * Ví dụ: "số ba", "hình tròn", "chữ a", "bên trái"
 */
export function formatPromptLabel(
  label: string,
  opts?: TerminologyOptions
): string {
  const display = formatDisplayLabel(label, opts);
  return display.toLowerCase();
}

/**
 * Xử lý danh từ số nhiều tự nhiên, tuyệt đối không lặp từ "hình":
 * - "hình tròn" -> "các hình tròn" (không phải "các hình hình tròn")
 * - "số ba" -> "tất cả số ba" (không phải "các hình số ba")
 * - "quả táo" -> "các quả táo"
 */
export function formatPluralNoun(
  label: string,
  opts?: TerminologyOptions
): string {
  const promptLabel = formatPromptLabel(label, opts);

  if (promptLabel.startsWith("hình ")) {
    return `các ${promptLabel}`;
  }
  if (promptLabel.startsWith("số ")) {
    return `tất cả ${promptLabel}`;
  }
  if (promptLabel.startsWith("chữ ")) {
    return `tất cả ${promptLabel}`;
  }
  if (
    promptLabel.startsWith("con ") ||
    promptLabel.startsWith("quả ") ||
    promptLabel.startsWith("cái ") ||
    promptLabel.startsWith("chiếc ")
  ) {
    return `các ${promptLabel.slice(4).trim()}`;
  }
  return `các ${promptLabel}`;
}

/**
 * Sinh câu lệnh / câu hỏi sư phạm chuẩn mầm non:
 */
export function formatChildPrompt(
  action: "select" | "touch" | "find" | "recall" | "present" | "echo",
  label: string,
  opts?: TerminologyOptions
): string {
  const promptLabel = formatPromptLabel(label, opts);
  const spokenLabel = formatSpokenLabel(label, opts);

  switch (action) {
    case "present":
      return `Đây là ${promptLabel}`;
    case "echo":
      return `Bé nói theo cô nhé: ${spokenLabel}`;
    case "select":
      return `Bé hãy chọn ${promptLabel} nhé!`;
    case "touch":
      return `Bé hãy chạm vào ${promptLabel} nhé!`;
    case "find":
      return `Bé hãy tìm ${promptLabel} nhé!`;
    case "recall":
      return `Đâu là ${promptLabel}?`;
    default:
      return `Bé hãy chọn ${promptLabel} nhé!`;
  }
}
