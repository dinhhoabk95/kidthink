import { describe, expect, it } from "vitest";
import { touchFloorOf } from "#src/layout/touch-floor";
import { GT013_FIXTURES } from "#src/templates/GT-013/fixtures";
import { GT013Session } from "#src/templates/GT-013/session";
import {
  canvasBoxOf,
  placeRound,
  SHELL_VIEWPORTS,
} from "./layout/helpers/shell-frame.ts";

/**
 * `BR-ENG-19` ở mê cung: nét vẽ/thả chấp nhận khi ngón nằm trong ô hành lang nở thêm
 * ½ sàn chạm, và hút về tâm hành lang gần nhất.
 */
function setup() {
  const fx = GT013_FIXTURES[0];
  if (!fx) {
    throw new Error("Thiếu fixture GT-013");
  }
  const session = new GT013Session(fx.content, fx.difficulty);
  session.setupEntities();
  const viewport = SHELL_VIEWPORTS[0] ?? { name: "", w: 360, h: 640 };
  const round = placeRound(
    session,
    "3-4",
    canvasBoxOf(viewport, "3-4", "play")
  );
  const floor = touchFloorOf("3-4") / round.scale;
  return { session, slots: session.slots, floor };
}

describe("GT-013 — thả/vẽ dễ dãi (BR-ENG-19)", () => {
  it("điểm thả ở ô cạnh hành lang chưa tới nửa sàn chạm hút về ô hành lang", () => {
    const { session, slots, floor } = setup();
    const head = slots[0];
    const next = slots[3]; // ô (1,0): đi được từ (0,0), tường chặn phía đông
    if (!(head && next)) {
      throw new Error("Thiếu slot");
    }
    const base = session.toAction({
      type: "drop",
      fromX: head.x,
      fromY: head.y,
      toX: next.x,
      toY: next.y,
      timeMs: 0,
    });
    expect(base).toEqual({ type: "draw_step", data: { row: 1, col: 0 } });
    // Lọt sang ô (1,1) (bị tường chặn) nhưng cách mép ô (1,0) chỉ 0,3 sàn chạm.
    const spill = {
      x: next.x + next.w / 2 + 0.3 * floor,
      y: next.y,
    };
    expect(
      session.toAction({
        type: "drop",
        fromX: head.x,
        fromY: head.y,
        toX: spill.x,
        toY: spill.y,
        timeMs: 0,
      })
    ).toEqual(base);
  });

  it("ca âm: thả cách mép ô hành lang hơn nửa sàn chạm thì không hút", () => {
    const { session, slots, floor } = setup();
    const head = slots[0];
    const next = slots[3];
    if (!(head && next)) {
      throw new Error("Thiếu slot");
    }
    const far = { x: next.x + next.w / 2 + 0.8 * floor, y: next.y };
    expect(
      session.toAction({
        type: "drop",
        fromX: head.x,
        fromY: head.y,
        toX: far.x,
        toY: far.y,
        timeMs: 0,
      })
    ).not.toEqual({ type: "draw_step", data: { row: 1, col: 0 } });
  });
});
