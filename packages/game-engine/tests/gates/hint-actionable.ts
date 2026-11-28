import type { EngineView, Gesture } from "#src/index";
import type {
  HintDemoStep,
  HintLevel,
  HintTarget,
} from "#src/systems/hint-ladder";

/**
 * Task #321 — gợi ý luôn trỏ vào thứ bấm được (`BR-SCF-14`). Người chơi theo
 * gợi ý: lấy `getHintTarget()`, đổi thành đúng gesture bề mặt web phát ra (chạm
 * vật / kéo nguồn→đích / bấm nút chốt), dispatch, rồi đo xem view có đổi không.
 */

/** Phần session mà bộ chơi theo gợi ý cần; `TemplateGameSession` thoả sẵn. */
export interface HintPlayable {
  checkWinCondition(): boolean;
  dispatch(gesture: Gesture): unknown;
  getHintTarget(): HintTarget | null;
  getView?(): EngineView;
  update?(deltaMs: number): void;
  getHintDestinationIndex?(): number | null;
  getHintDestinationPoint?(): { readonly x: number; readonly y: number } | null;
  getHintDemoSequence?(level: HintLevel): readonly HintDemoStep[] | null;
}

export interface HintRun {
  readonly won: boolean;
  /** Số bước theo gợi ý mà view không đổi. */
  readonly noopSteps: number;
  /** Số bước no-op liên tiếp dài nhất. */
  readonly maxConsecutiveNoop: number;
  readonly steps: number;
}

export const MAX_HINT_STEPS = 80;
const GESTURE_SPACING_MS = 800;
const WAIT_MS = 6000;
const MAX_WAITS = 40;

function hintGesture(
  session: HintPlayable,
  target: HintTarget,
  t: number
): Gesture | null {
  if (target.kind === "action") {
    return { type: "commit", timeMs: t };
  }
  const entities = session.getView?.().entities ?? [];
  if (target.kind === "region") {
    const hit = entities.find((e) => target.ids.includes(e.id));
    return hit ? { type: "tap", x: hit.x, y: hit.y, timeMs: t } : null;
  }
  const from = entities.find((e) => e.slotIndex === target.index);
  if (!from) {
    return null;
  }
  if (target.toIndex === undefined) {
    return { type: "tap", x: from.x, y: from.y, timeMs: t };
  }
  // Như `core.ts` `resolveGhostHand`: đích nằm trong slot dài (mặt đồng hồ GT-016)
  // thì bàn tay ma kéo tới điểm chính xác session chỉ, không phải tâm slot.
  const point =
    target.toIndex === session.getHintDestinationIndex?.()
      ? session.getHintDestinationPoint?.()
      : null;
  const to = point ?? entities.find((e) => e.slotIndex === target.toIndex);
  return to
    ? {
        type: "drop",
        fromX: from.x,
        fromY: from.y,
        toX: to.x,
        toY: to.y,
        timeMs: t,
      }
    : null;
}

function fingerprint(session: HintPlayable): string {
  return JSON.stringify([
    session.checkWinCondition(),
    (session.getView?.().entities ?? []).map((e) => [
      e.state,
      e.label,
      e.x,
      e.y,
    ]),
    session.getHintTarget(),
    // Trạng thái chỉ hiện trên canvas (vd góc xoay GT-019) không nằm trong view;
    // bàn tay ma mức 3 dựng từ chính trạng thái đó nên dùng làm dấu vết.
    session.getHintDemoSequence?.(3) ?? null,
  ]);
}

/** Chơi theo `getHintTarget()` tới khi thắng hoặc hết `MAX_HINT_STEPS`. */
export function playByHint(session: HintPlayable): HintRun {
  let noopSteps = 0;
  let consecutive = 0;
  let maxConsecutive = 0;
  let waits = 0;
  let steps = 0;
  const record = (progressed: boolean): void => {
    if (progressed) {
      consecutive = 0;
      return;
    }
    noopSteps++;
    consecutive++;
    maxConsecutive = Math.max(maxConsecutive, consecutive);
  };
  // Gợi ý chỉ hiện sau `hint_after_ms` (>= vài giây), tức sau màn mở đầu/trình
  // diễn của engine (vd rót GT-032); bộ chơi bắt đầu từ lúc đó.
  session.update?.(WAIT_MS);
  while (steps < MAX_HINT_STEPS && !session.checkWinCondition()) {
    const t = steps * GESTURE_SPACING_MS;
    steps++;
    // Shell gọi `update()` mỗi khung: giữa hai cử chỉ của trẻ thời gian vẫn trôi
    // (vd màn trình diễn rót GT-032 chặn chạm cho tới khi chạy hết).
    session.update?.(GESTURE_SPACING_MS);
    const target = session.getHintTarget();
    const gesture = target ? hintGesture(session, target, t) : null;
    if (!gesture) {
      // Không có gợi ý để theo: trẻ chờ, shell vẫn gọi `update()`.
      if (waits >= MAX_WAITS) {
        record(false);
        continue;
      }
      waits++;
      const before = fingerprint(session);
      session.update?.(WAIT_MS);
      record(fingerprint(session) !== before);
      continue;
    }
    const before = fingerprint(session);
    session.dispatch(gesture);
    record(fingerprint(session) !== before);
  }
  return {
    won: session.checkWinCondition(),
    noopSteps,
    maxConsecutiveNoop: maxConsecutive,
    steps,
  };
}

/** Vi phạm: ≥ 2 bước no-op liên tiếp, hoặc không thắng trong `MAX_HINT_STEPS`. */
export function violatesHintActionable(run: HintRun): boolean {
  return run.maxConsecutiveNoop >= 2 || !run.won;
}
