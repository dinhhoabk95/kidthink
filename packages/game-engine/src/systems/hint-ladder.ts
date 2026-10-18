/**
 * Bậc thang gợi ý theo cấp (`L1` / `L2` / `L3`) — Task #301 (N5).
 *
 * `L1` định hướng vùng chú ý (`region`), `L2` thu hẹp mối liên hệ (`region`),
 * chỉ `L3` mới chỉ trực tiếp vào phương án đúng (`slot` hoặc `action`).
 */

export type HintLevel = 1 | 2 | 3;

export type HintTarget =
  | { readonly kind: "slot"; readonly index: number }
  | { readonly kind: "action" }
  | { readonly kind: "region"; readonly ids: readonly string[] };

/**
 * Danh sách template cài bậc thang gợi ý thông qua bộ giải trung tâm
 * (để tránh đụng chạm trực tiếp file `session.ts` đang khoá).
 */
export const EXTERNAL_HINT_LADDER_TEMPLATES: readonly string[] = [
  "GT-032",
] as const;

interface GT032CupCandidate {
  readonly cup_id: string;
  readonly capacity_units: number;
  readonly fill_units: number;
}

interface GT032ContentCandidate {
  readonly question_type: string;
  readonly cups: readonly GT032CupCandidate[];
}

export interface SteppedHintSessionCandidate {
  readonly content: object | string | number | boolean | null | undefined;
  checkWinCondition(): boolean;
  getHintTarget(): HintTarget | null;
}

function isGT032ContentCandidate(
  content: SteppedHintSessionCandidate["content"]
): content is GT032ContentCandidate {
  if (typeof content !== "object" || content === null) {
    return false;
  }
  if (!("question_type" in content && "cups" in content)) {
    return false;
  }
  const qType = Reflect.get(content, "question_type");
  const cups = Reflect.get(content, "cups");
  if (typeof qType !== "string" || !Array.isArray(cups)) {
    return false;
  }
  return cups.every(
    (item) =>
      typeof item === "object" &&
      item !== null &&
      typeof Reflect.get(item, "cup_id") === "string" &&
      typeof Reflect.get(item, "fill_units") === "number"
  );
}

/**
 * Giải mục tiêu gợi ý theo bậc cho các session đăng ký ở tầng hệ thống (`GT-032`).
 * Trả `undefined` khi session không thuộc nhóm này để rơi về `getHintTarget()`.
 */
export function resolveSteppedHintTarget(
  session: SteppedHintSessionCandidate,
  level: HintLevel
): HintTarget | null | undefined {
  if (!isGT032ContentCandidate(session.content)) {
    return undefined;
  }
  if (session.checkWinCondition()) {
    return null;
  }
  const cups = session.content.cups;
  if (level === 1) {
    return {
      kind: "region",
      ids: ["cup-unit-ticks", ...cups.map((c) => `${c.cup_id}:ticks`)],
    };
  }
  if (level === 2) {
    return {
      kind: "region",
      ids: ["cup-unit-counts", ...cups.map((c) => `${c.cup_id}:count`)],
    };
  }
  return session.getHintTarget();
}
