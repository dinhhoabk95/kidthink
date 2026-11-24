import type { GT000ToneMark } from "@mindkid/game-engine/contracts";
import type { DatasetItem } from "@mindkid/shared";

const LABEL_PREFIX_RE =
  /^(?:từ|tiếng|câu|chữ\s+ghép|chữ\s+cái|chữ|vần|âm\s+đầu|âm|dấu|thanh)\s+/i;
const TOKEN_SPLIT_RE = /[\s\-·,/()]+/;

const HUYEN_RE = /[àằầèềìòồờùừỳ]/i;
const SAC_RE = /[áắấéếíóốớúứý]/i;
const HOI_RE = /[ảẳẩẻểỉỏổởủửỷ]/i;
const NGA_RE = /[ãẵẫẽễĩõỗỡũữỹ]/i;
const NANG_RE = /[ạặậẹệịọộợụựỵ]/i;

const VIETNAMESE_ONSETS: readonly string[] = [
  "ngh",
  "ch",
  "gh",
  "gi",
  "kh",
  "ng",
  "nh",
  "ph",
  "qu",
  "th",
  "tr",
  "b",
  "c",
  "d",
  "đ",
  "g",
  "h",
  "k",
  "l",
  "m",
  "n",
  "p",
  "r",
  "s",
  "t",
  "v",
  "x",
];

function stripLinguisticPrefix(raw: string): string {
  const trimmed = raw.trim();
  const stripped = trimmed.replace(LABEL_PREFIX_RE, "").trim();
  return stripped.length > 0 ? stripped : trimmed;
}

export function detectVietnameseToneMark(text: string): GT000ToneMark {
  if (SAC_RE.test(text)) {
    return "sac";
  }
  if (HUYEN_RE.test(text)) {
    return "huyen";
  }
  if (HOI_RE.test(text)) {
    return "hoi";
  }
  if (NGA_RE.test(text)) {
    return "nga";
  }
  if (NANG_RE.test(text)) {
    return "nang";
  }
  return "ngang";
}

export function extractVietnameseSyllables(
  item: DatasetItem
): string[] | undefined {
  const source = item.glyph
    ? item.glyph.trim()
    : stripLinguisticPrefix(item.label);
  const tokens = source
    .split(TOKEN_SPLIT_RE)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
  if (tokens.length === 0) {
    return undefined;
  }
  return tokens.slice(0, 6);
}

function splitSingleVietnameseSyllable(word: string): string[] {
  const lower = word.toLowerCase();
  for (const onset of VIETNAMESE_ONSETS) {
    if (lower.startsWith(onset) && word.length > onset.length) {
      const head = word.slice(0, onset.length);
      const rime = word.slice(onset.length);
      if (rime.length > 0) {
        return [head, rime];
      }
    }
  }
  return [word];
}

export function buildWordPhonicsParts(
  item: DatasetItem,
  skillCode: string
): string[] {
  const syllables = extractVietnameseSyllables(item) ?? [item.label.trim()];
  if (syllables.length >= 2) {
    return syllables.slice(0, 6);
  }
  const single = syllables[0] ?? item.label.trim();
  const shouldSplitOnsetRime =
    skillCode.startsWith("C5.PHO.04") ||
    skillCode.startsWith("C5.PHO.05") ||
    skillCode.startsWith("C5.PHO.06") ||
    skillCode.startsWith("C5.PHO.07") ||
    skillCode.startsWith("C5.WRD.") ||
    skillCode.startsWith("C5.RHY.");

  if (shouldSplitOnsetRime && single.length >= 2) {
    return splitSingleVietnameseSyllable(single);
  }
  return [single.slice(0, 24) || "a"];
}
