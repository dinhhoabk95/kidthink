/**
 * Luật nội dung của các khuôn GT-005 / GT-025 / GT-026 / GT-030 (Task #321 đợt 3).
 * Mỗi hàm trả danh sách vi phạm (mảng chuỗi tiếng Việt); bộ dựng ném lỗi khi mảng khác rỗng.
 * Spec: `BR-E005-06`, `BR-E025-08`, `BR-E026-13/14`, `BR-E030-13`.
 */

export interface RuleAsset {
  readonly kind: "text" | "emoji" | "image";
  readonly text?: string;
  readonly ref?: string;
  readonly path?: string;
}

const VS16_REGEX = /️/gu;
const KEYCAP_REGEX = /⃣/gu;
const DIGITS_REGEX = /^\d+$/u;
const SEGMENTER = new Intl.Segmenter("vi", { granularity: "grapheme" });

function shownOf(asset: RuleAsset): string {
  if (asset.kind === "image") {
    return asset.path ?? "";
  }
  const raw = asset.kind === "text" ? (asset.text ?? "") : (asset.ref ?? "");
  return raw.replace(VS16_REGEX, "").replace(KEYCAP_REGEX, "").trim();
}

function graphemesOf(shown: string): string[] {
  return Array.from(SEGMENTER.segment(shown), (s) => s.segment);
}

/** Số lần lặp của cùng một biểu tượng (`🦆🦆🦆` → 3). Không phải nhóm lặp → undefined. */
export function repeatGroupCount(asset: RuleAsset): number | undefined {
  if (asset.kind === "image") {
    return undefined;
  }
  const shown = shownOf(asset);
  if (DIGITS_REGEX.test(shown)) {
    return undefined;
  }
  const parts = graphemesOf(shown);
  const first = parts[0];
  if (parts.length > 1 && parts.every((p) => p === first)) {
    return parts.length;
  }
  return undefined;
}

function numeralOf(asset: RuleAsset): number | undefined {
  if (asset.kind === "image") {
    return undefined;
  }
  const shown = shownOf(asset);
  return DIGITS_REGEX.test(shown) ? Number(shown) : undefined;
}

/**
 * BR-E005-06: nếu một vế là nhóm lặp (k > 1 biểu tượng) thì vế kia phải cùng lượng k
 * (nhóm lặp k hoặc chữ số k). Vế đơn lẻ so với nhóm lặp là lệch lượng.
 */
export function pairQuantityViolations(
  pairId: string,
  left: RuleAsset,
  right: RuleAsset
): string[] {
  const lg = repeatGroupCount(left);
  const rg = repeatGroupCount(right);
  if (lg === undefined && rg === undefined) {
    return [];
  }
  const lq = lg ?? numeralOf(left) ?? 1;
  const rq = rg ?? numeralOf(right) ?? 1;
  return lq === rq
    ? []
    : [`[BR-E005-06] Cặp ${pairId}: hai vế lệch lượng (${lq} so với ${rq})`];
}

/**
 * BR-E025-08: một điểm khác là cùng một vật, chỉ khác số lượng
 * (vế này là một biểu tượng, vế kia là nhóm lặp của chính biểu tượng đó),
 * hoặc hai chữ số cùng bộ. Hai vật khác hẳn là vi phạm.
 */
export function spotDiffKindViolations(
  diffId: string,
  left: RuleAsset,
  right: RuleAsset
): string[] {
  const l = shownOf(left);
  const r = shownOf(right);
  if (l === r) {
    return [`[BR-E025-08] Điểm khác ${diffId}: hai vế giống hệt nhau`];
  }
  if (DIGITS_REGEX.test(l) && DIGITS_REGEX.test(r)) {
    return [];
  }
  const lBase = graphemesOf(l)[0];
  const rBase = graphemesOf(r)[0];
  const lCount = repeatGroupCount(left) ?? 1;
  const rCount = repeatGroupCount(right) ?? 1;
  const sameObject = lBase !== undefined && lBase === rBase;
  if (sameObject && lCount !== rCount) {
    return [];
  }
  return [
    `[BR-E025-08] Điểm khác ${diffId}: "${l}" và "${r}" không cùng loại (phải cùng một vật, khác số lượng)`,
  ];
}

export const GT026_GO_RATIO_MIN = 0.7;
export const GT026_GO_RATIO_MAX = 0.8;

export interface TrialKind {
  readonly kind: "go" | "nogo";
}

/** BR-E026-14: tỉ lệ lượt `go` phải nằm trong [0,70 ; 0,80]. */
export function goRatioViolations(
  label: string,
  trials: readonly TrialKind[]
): string[] {
  if (trials.length === 0) {
    return [`[BR-E026-14] ${label}: không có lượt nào`];
  }
  const ratio = trials.filter((t) => t.kind === "go").length / trials.length;
  const eps = 1e-9;
  return ratio + eps < GT026_GO_RATIO_MIN || ratio - eps > GT026_GO_RATIO_MAX
    ? [
        `[BR-E026-14] ${label}: tỉ lệ go ${ratio.toFixed(2)} ngoài khoảng ${GT026_GO_RATIO_MIN}–${GT026_GO_RATIO_MAX}`,
      ]
    : [];
}

/** Số `nogo` để tỉ lệ go thuộc khoảng; undefined nếu không có. */
export function nogoCountFor(total: number): number | undefined {
  for (let nogo = 1; nogo < total; nogo++) {
    const ratio = (total - nogo) / total;
    if (
      ratio >= GT026_GO_RATIO_MIN - 1e-9 &&
      ratio <= GT026_GO_RATIO_MAX + 1e-9
    ) {
      return nogo;
    }
  }
  return undefined;
}

export interface RoleUse {
  readonly level: string;
  readonly goLabel: string;
  readonly nogoLabel: string;
}

/** BR-E026-13: một nhãn vật chỉ mang một vai trong toàn corpus; go khác nogo trong từng level. */
export function roleConflictViolations(uses: readonly RoleUse[]): string[] {
  const out: string[] = [];
  const roleOf = new Map<string, { role: "go" | "nogo"; level: string }>();
  const note = (label: string, role: "go" | "nogo", level: string): void => {
    const seen = roleOf.get(label);
    if (!seen) {
      roleOf.set(label, { role, level });
    } else if (seen.role !== role) {
      out.push(
        `[BR-E026-13] "${label}" vừa ${seen.role} (${seen.level}) vừa ${role} (${level})`
      );
    }
  };
  for (const u of uses) {
    if (u.goLabel === u.nogoLabel) {
      out.push(`[BR-E026-13] ${u.level}: go và nogo cùng nhãn "${u.goLabel}"`);
    }
    note(u.goLabel, "go", u.level);
    note(u.nogoLabel, "nogo", u.level);
  }
  return out;
}

/** BR-E030-13: nhãn đơn vị không chứa từ lạ/ghép số. */
export const GT030_FORBIDDEN_UNIT_WORDS: readonly string[] = [
  "gang",
  "sải",
  "tấc",
  "lần",
];

const WHITESPACE_REGEX = /\s+/u;

export function unitLabelViolations(label: string): string[] {
  const words = label.toLowerCase().split(WHITESPACE_REGEX);
  const hit = GT030_FORBIDDEN_UNIT_WORDS.filter((w) => words.includes(w));
  return hit.length === 0
    ? []
    : [`[BR-E030-13] Nhãn đơn vị "${label}" chứa từ lạ: ${hit.join(", ")}`];
}
