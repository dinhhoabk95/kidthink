import { describe, expect, it } from "vitest";
import { GT035_FIXTURES } from "#src/templates/GT-035/fixtures";
import { GT035Session } from "#src/templates/GT-035/session";

/**
 * Task #313 — GT-035 `N5`: `L1` ô kế tiếp trên đường hợp lệ sáng · `L2` thẻ lệnh
 * tương ứng nháy trong khay · `L3` kéo thẻ vào hàng lệnh (`BR-E035-12`).
 * Fixture 0: lưới 3x3, start (0,0) hướng phải, đích (2,2).
 */
const found = GT035_FIXTURES[0];
if (!found) {
  throw new Error("Thiếu fixture");
}
const f = found;
const GRID = f.content.grid.rows * f.content.grid.cols;
const MAX = f.difficulty.max_commands ?? 8;

function build(): GT035Session {
  const session = new GT035Session(f.content, f.difficulty);
  session.prepareRound("5-6");
  return session;
}

describe("GT-035 — thang hint L1/L2/L3 (BR-E035-12)", () => {
  it("L1: chỉ ô lưới kế tiếp robot sẽ bước vào, chưa chỉ thẻ lệnh", () => {
    const session = build();
    expect(session.getHintTargetForLevel(1)).toEqual({
      kind: "region",
      ids: ["grid_cell_1"],
    });
  });

  it("L1 sau một lệnh đi thẳng: ô kế vẫn nằm trên đường hợp lệ", () => {
    const session = build();
    session.commit({ type: "add_command", data: { command: "forward" } });
    expect(session.getHintTargetForLevel(1)).toEqual({
      kind: "region",
      ids: ["grid_cell_2"],
    });
  });

  it("L2: thẻ lệnh đúng nháy trong khay, chưa có đích kéo", () => {
    const session = build();
    const hint = session.getHintTargetForLevel(2);
    expect(hint).toEqual({ kind: "slot", index: GRID + MAX });
  });

  it("L3: kéo thẻ đúng vào ô trống kế tiếp của hàng lệnh", () => {
    const session = build();
    expect(session.getHintTargetForLevel(3)).toEqual({
      kind: "slot",
      index: GRID + MAX,
      toIndex: GRID,
    });
  });

  it("đang chạy hoặc đã thắng thì không có hint", () => {
    const session = build();
    session.commit({ type: "add_command", data: { command: "forward" } });
    session.commit({ type: "run_program", data: {} });
    expect(session.getHintTargetForLevel(1)).toBeNull();
  });
});
