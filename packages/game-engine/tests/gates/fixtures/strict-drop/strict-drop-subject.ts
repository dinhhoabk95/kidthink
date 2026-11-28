import type { ActionResult, GameAction, Gesture } from "#src/index";

/** Đích thả giả: chỉ nhận lần thả trúng đúng tâm (toạ độ nguyên) — mẫu vi phạm `BR-ENG-19`. */
export const STRICT_TARGET = { x: 200, y: 300 } as const;

const OK: ActionResult = { valid: true, feedback: "none" };
const REJECTED: ActionResult = { valid: false, feedback: "none" };

export const strictDropSubject = {
  toAction(g: Gesture): GameAction | null {
    return g.type === "drop" &&
      g.toX === STRICT_TARGET.x &&
      g.toY === STRICT_TARGET.y
      ? { type: "place_item", data: { slot_id: "s" } }
      : null;
  },
  validateAction(_a: GameAction): ActionResult {
    return OK;
  },
};

/** Đích thả dễ dãi: nhận mọi điểm trong hộp quanh tâm — mẫu đúng. */
export const lenientDropSubject = {
  toAction(g: Gesture): GameAction | null {
    return g.type === "drop" &&
      Math.abs(g.toX - STRICT_TARGET.x) <= 80 &&
      Math.abs(g.toY - STRICT_TARGET.y) <= 80
      ? { type: "place_item", data: { slot_id: "s" } }
      : null;
  },
  validateAction(a: GameAction): ActionResult {
    return a.type === "place_item" ? OK : REJECTED;
  },
};
