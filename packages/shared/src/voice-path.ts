export const TEACHER_VOICE_PROFILE = "teacher-v1" as const;

const ZERO_WIDTH_RE = /(?:\u200B|\u200C|\u200D|\uFEFF)/g;
const MULTI_SPACE_RE = /\s+/g;
const SO_KHONG_WORD_RE = /(?<![\p{L}\p{N}_])số\s+không(?![\p{L}\p{N}_])/giu;
const SO_ZERO_DIGIT_RE = /(?<![\p{L}\p{N}_])số\s+0(?![\p{L}\p{N}_])/giu;
const TRAILING_DOTS_RE = /\.+$/g;
const ECHO_CUE_RE = /bé nói theo cô nhé\s*:/giu;
const PAREN_RATIO_RE = /\(\s*(\d{1,3})\s*\/\s*(\d{1,3})\s*\)/g;
const BARE_RATIO_RE = /(?<![/\d])(\d{1,3})\s*\/\s*(\d{1,3})(?![/\d])/g;
const DIGIT_HYPHEN_DIGIT_RE = /(\d)\s*-\s*(\d)/g;
const SPACED_HYPHEN_RE = /\s+-\s+/g;
const MATH_OPERATOR_RE = /(?<=^|[\s\d?])([+−×÷=><])(?=$|[\s\d?.,!])/g;
const STANDALONE_CARDINAL_RE = /\b\d{1,3}\b/g;
const SPACE_BEFORE_PUNCT_RE = /\s+([,.?!;:])/g;
const PUNCT_TIGHT_SPACING_RE = /([,:;])\s*/g;
const LEADING_COMMA_RE = /^,\s*/;
const DUPLICATE_COMMA_RE = /,\s*,+/g;

const TWO_POW_32 = 4_294_967_296;
const UINT32_MAX = 4_294_967_295;

const POW2: readonly number[] = Array.from(
  { length: 33 },
  (_, index) => 2 ** index
);

interface ByteBitwiseTables {
  readonly xor: Uint8Array;
  readonly and: Uint8Array;
}

function buildByteBitwiseTables(): ByteBitwiseTables {
  const xor = new Uint8Array(65_536);
  const and = new Uint8Array(65_536);
  for (let x = 0; x < 256; x++) {
    const halfX = Math.floor(x / 2);
    const bitX = x % 2;
    for (let y = 0; y < 256; y++) {
      const halfY = Math.floor(y / 2);
      const bitY = y % 2;
      const prevIdx = halfX * 256 + halfY;
      const idx = x * 256 + y;
      xor[idx] = (xor[prevIdx] ?? 0) * 2 + ((bitX + bitY) % 2);
      and[idx] = (and[prevIdx] ?? 0) * 2 + bitX * bitY;
    }
  }
  return { xor, and };
}

const BYTE_TABLES = buildByteBitwiseTables();

const SHA256_INIT: readonly number[] = [
  0x6a_09_e6_67, 0xbb_67_ae_85, 0x3c_6e_f3_72, 0xa5_4f_f5_3a, 0x51_0e_52_7f,
  0x9b_05_68_8c, 0x1f_83_d9_ab, 0x5b_e0_cd_19,
];

const SHA256_K: readonly number[] = [
  0x42_8a_2f_98, 0x71_37_44_91, 0xb5_c0_fb_cf, 0xe9_b5_db_a5, 0x39_56_c2_5b,
  0x59_f1_11_f1, 0x92_3f_82_a4, 0xab_1c_5e_d5, 0xd8_07_aa_98, 0x12_83_5b_01,
  0x24_31_85_be, 0x55_0c_7d_c3, 0x72_be_5d_74, 0x80_de_b1_fe, 0x9b_dc_06_a7,
  0xc1_9b_f1_74, 0xe4_9b_69_c1, 0xef_be_47_86, 0x0f_c1_9d_c6, 0x24_0c_a1_cc,
  0x2d_e9_2c_6f, 0x4a_74_84_aa, 0x5c_b0_a9_dc, 0x76_f9_88_da, 0x98_3e_51_52,
  0xa8_31_c6_6d, 0xb0_03_27_c8, 0xbf_59_7f_c7, 0xc6_e0_0b_f3, 0xd5_a7_91_47,
  0x06_ca_63_51, 0x14_29_29_67, 0x27_b7_0a_85, 0x2e_1b_21_38, 0x4d_2c_6d_fc,
  0x53_38_0d_13, 0x65_0a_73_54, 0x76_6a_0a_bb, 0x81_c2_c9_2e, 0x92_72_2c_85,
  0xa2_bf_e8_a1, 0xa8_1a_66_4b, 0xc2_4b_8b_70, 0xc7_6c_51_a3, 0xd1_92_e8_19,
  0xd6_99_06_24, 0xf4_0e_35_85, 0x10_6a_a0_70, 0x19_a4_c1_16, 0x1e_37_6c_08,
  0x27_48_77_4c, 0x34_b0_bc_b5, 0x39_1c_0c_b3, 0x4e_d8_aa_4a, 0x5b_9c_ca_4f,
  0x68_2e_6f_f3, 0x74_8f_82_ee, 0x78_a5_63_6f, 0x84_c8_78_14, 0x8c_c7_02_08,
  0x90_be_ff_fa, 0xa4_50_6c_eb, 0xbe_f9_a3_f7, 0xc6_71_78_f2,
];

const VIETNAMESE_DIGITS: readonly string[] = [
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
];

const SINGLE_TONE_GLYPH_MAP: Readonly<Record<string, string>> = {
  "—": "Thanh ngang",
  ˋ: "Dấu huyền",
  ˊ: "Dấu sắc",
  "﹒": "Dấu nặng",
  ʾ: "Dấu hỏi",
  "\u0309": "Dấu hỏi",
  "˜": "Dấu ngã",
};

const MATH_SYMBOL_SPOKEN_MAP: Readonly<Record<string, string>> = {
  "+": " cộng ",
  "−": " trừ ",
  "×": " nhân ",
  "÷": " chia ",
  "=": " bằng ",
  ">": " lớn hơn ",
  "<": " bé hơn ",
};

function applyByteTable32(table: Uint8Array, a: number, b: number): number {
  const a0 = a % 256;
  const b0 = b % 256;
  const a1 = Math.floor(a / 256) % 256;
  const b1 = Math.floor(b / 256) % 256;
  const a2 = Math.floor(a / 65_536) % 256;
  const b2 = Math.floor(b / 65_536) % 256;
  const a3 = Math.floor(a / 16_777_216);
  const b3 = Math.floor(b / 16_777_216);
  return (
    (table[a3 * 256 + b3] ?? 0) * 16_777_216 +
    (table[a2 * 256 + b2] ?? 0) * 65_536 +
    (table[a1 * 256 + b1] ?? 0) * 256 +
    (table[a0 * 256 + b0] ?? 0)
  );
}

function xor32(a: number, b: number): number {
  return applyByteTable32(BYTE_TABLES.xor, a, b);
}

function and32(a: number, b: number): number {
  return applyByteTable32(BYTE_TABLES.and, a, b);
}

function rotr32(x: number, bits: number): number {
  const divisor = POW2[bits] ?? 1;
  const multiplier = POW2[32 - bits] ?? 1;
  return (x % divisor) * multiplier + Math.floor(x / divisor);
}

function shr32(x: number, bits: number): number {
  const divisor = POW2[bits] ?? 1;
  return Math.floor(x / divisor);
}

function padSha256Message(bytes: Uint8Array): DataView {
  const msgLen = bytes.length;
  const totalLen = Math.ceil((msgLen + 9) / 64) * 64;
  const padded = new Uint8Array(totalLen);
  padded.set(bytes);
  padded[msgLen] = 0x80;

  const bitLen = msgLen * 8;
  const highBits = Math.floor(bitLen / TWO_POW_32);
  const lowBits = bitLen % TWO_POW_32;
  const view = new DataView(padded.buffer);
  view.setUint32(totalLen - 8, highBits, false);
  view.setUint32(totalLen - 4, lowBits, false);
  return view;
}

function expandMessageSchedule(
  view: DataView,
  blockOffset: number,
  schedule: Uint32Array
): void {
  for (let i = 0; i < 16; i++) {
    schedule[i] = view.getUint32(blockOffset + i * 4, false);
  }
  for (let i = 16; i < 64; i++) {
    const w15 = schedule[i - 15] ?? 0;
    const w2 = schedule[i - 2] ?? 0;
    const s0 = xor32(xor32(rotr32(w15, 7), rotr32(w15, 18)), shr32(w15, 3));
    const s1 = xor32(xor32(rotr32(w2, 17), rotr32(w2, 19)), shr32(w2, 10));
    schedule[i] =
      ((schedule[i - 16] ?? 0) + s0 + (schedule[i - 7] ?? 0) + s1) % TWO_POW_32;
  }
}

function compressSha256Block(state: Uint32Array, schedule: Uint32Array): void {
  let a = state[0] ?? 0;
  let b = state[1] ?? 0;
  let c = state[2] ?? 0;
  let d = state[3] ?? 0;
  let e = state[4] ?? 0;
  let f = state[5] ?? 0;
  let g = state[6] ?? 0;
  let h = state[7] ?? 0;

  for (let i = 0; i < 64; i++) {
    const sigma1 = xor32(xor32(rotr32(e, 6), rotr32(e, 11)), rotr32(e, 25));
    const ch = xor32(and32(e, f), and32(UINT32_MAX - e, g));
    const temp1 =
      (h + sigma1 + ch + (SHA256_K[i] ?? 0) + (schedule[i] ?? 0)) % TWO_POW_32;
    const sigma0 = xor32(xor32(rotr32(a, 2), rotr32(a, 13)), rotr32(a, 22));
    const maj = xor32(xor32(and32(a, b), and32(a, c)), and32(b, c));
    const temp2 = (sigma0 + maj) % TWO_POW_32;

    h = g;
    g = f;
    f = e;
    e = (d + temp1) % TWO_POW_32;
    d = c;
    c = b;
    b = a;
    a = (temp1 + temp2) % TWO_POW_32;
  }

  state[0] = ((state[0] ?? 0) + a) % TWO_POW_32;
  state[1] = ((state[1] ?? 0) + b) % TWO_POW_32;
  state[2] = ((state[2] ?? 0) + c) % TWO_POW_32;
  state[3] = ((state[3] ?? 0) + d) % TWO_POW_32;
  state[4] = ((state[4] ?? 0) + e) % TWO_POW_32;
  state[5] = ((state[5] ?? 0) + f) % TWO_POW_32;
  state[6] = ((state[6] ?? 0) + g) % TWO_POW_32;
  state[7] = ((state[7] ?? 0) + h) % TWO_POW_32;
}

export function sha256HexSync(input: string): string {
  const bytes = new TextEncoder().encode(input);
  const view = padSha256Message(bytes);
  const state = new Uint32Array(SHA256_INIT);
  const schedule = new Uint32Array(64);

  for (let offset = 0; offset < view.byteLength; offset += 64) {
    expandMessageSchedule(view, offset, schedule);
    compressSha256Block(state, schedule);
  }

  let hex = "";
  for (let i = 0; i < 8; i++) {
    hex += (state[i] ?? 0).toString(16).padStart(8, "0");
  }
  return hex;
}

export function normalizeVoiceLookupKey(raw: string): string {
  const cleaned = raw
    .normalize("NFC")
    .replace(ZERO_WIDTH_RE, "")
    .trim()
    .replace(MULTI_SPACE_RE, " ")
    .replace(SO_KHONG_WORD_RE, "số 0")
    .replace(TRAILING_DOTS_RE, "")
    .trim();
  return cleaned.toLowerCase();
}

export function computeVoiceHash(
  text: string,
  profile: string = TEACHER_VOICE_PROFILE
): string {
  const key = normalizeVoiceLookupKey(text);
  if (key.length === 0) {
    return "";
  }
  return sha256HexSync(`${profile}:${key}`).slice(0, 16);
}

export function resolveTeacherVoicePath(
  text: string,
  profile: string = TEACHER_VOICE_PROFILE
): string | null {
  const hash = computeVoiceHash(text, profile);
  if (hash.length === 0) {
    return null;
  }
  return `/audio/voice/${profile}/${hash.slice(0, 2)}/${hash}.mp3`;
}

function formatTwoDigitVietnamese(n: number): string {
  const tens = Math.floor(n / 10);
  const units = n % 10;
  if (tens === 1) {
    if (units === 0) {
      return "mười";
    }
    if (units === 5) {
      return "mười lăm";
    }
    return `mười ${VIETNAMESE_DIGITS[units] ?? ""}`;
  }

  const tensPrefix = `${VIETNAMESE_DIGITS[tens] ?? ""} mươi`;
  if (units === 0) {
    return tensPrefix;
  }
  if (units === 1) {
    return `${tensPrefix} mốt`;
  }
  if (units === 4) {
    return `${tensPrefix} tư`;
  }
  if (units === 5) {
    return `${tensPrefix} lăm`;
  }
  return `${tensPrefix} ${VIETNAMESE_DIGITS[units] ?? ""}`;
}

export function formatVietnameseCardinal(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > 999) {
    return String(n);
  }
  if (n < 10) {
    return VIETNAMESE_DIGITS[n] ?? String(n);
  }
  if (n < 100) {
    return formatTwoDigitVietnamese(n);
  }

  const hundreds = Math.floor(n / 100);
  const remainder = n % 100;
  const hundredsPrefix = `${VIETNAMESE_DIGITS[hundreds] ?? ""} trăm`;
  if (remainder === 0) {
    return hundredsPrefix;
  }
  if (remainder < 10) {
    return `${hundredsPrefix} linh ${VIETNAMESE_DIGITS[remainder] ?? ""}`;
  }
  return `${hundredsPrefix} ${formatTwoDigitVietnamese(remainder)}`;
}

function formatProgressRatio(numerator: string, denominator: string): string {
  const left = formatVietnameseCardinal(Number(numerator));
  const right = formatVietnameseCardinal(Number(denominator));
  return `, ${left} trên ${right}`;
}

export function toSpokenVietnameseScript(raw: string): string {
  const normalized = raw.normalize("NFC").replace(ZERO_WIDTH_RE, "").trim();
  if (normalized.length === 0) {
    return "";
  }
  const singleGlyph = SINGLE_TONE_GLYPH_MAP[normalized];
  if (singleGlyph !== undefined) {
    return singleGlyph;
  }

  const transformed = normalized
    .replace(ECHO_CUE_RE, (match) =>
      match.startsWith("B") ? "Bé nói theo cô nhé, " : "bé nói theo cô nhé, "
    )
    .replace(PAREN_RATIO_RE, (_, num: string, den: string) =>
      formatProgressRatio(num, den)
    )
    .replace(BARE_RATIO_RE, (_, num: string, den: string) =>
      formatProgressRatio(num, den)
    )
    .replace(DIGIT_HYPHEN_DIGIT_RE, "$1 trừ $2")
    .replace(SPACED_HYPHEN_RE, " trừ ")
    .replace(
      MATH_OPERATOR_RE,
      (symbol) => MATH_SYMBOL_SPOKEN_MAP[symbol] ?? symbol
    )
    .replace(SO_ZERO_DIGIT_RE, "số không")
    .replace(STANDALONE_CARDINAL_RE, (digits) =>
      formatVietnameseCardinal(Number(digits))
    );

  return transformed
    .replace(SPACE_BEFORE_PUNCT_RE, "$1")
    .replace(DUPLICATE_COMMA_RE, ",")
    .replace(PUNCT_TIGHT_SPACING_RE, "$1 ")
    .replace(LEADING_COMMA_RE, "")
    .replace(MULTI_SPACE_RE, " ")
    .trim();
}
