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

  it("chuỗi demo L3: tối đa ba thẻ đầu liền nhau, thẻ i vào ô i của hàng lệnh", () => {
    const session = build();
    const seq = session.getHintDemoSequence(3);
    expect(seq).not.toBeNull();
    expect(seq?.length).toBe(3);
    expect(seq?.map((s) => s.to)).toEqual([GRID, GRID + 1, GRID + 2]);
    // Bước đầu trùng đúng đích L3 một thẻ.
    expect(seq?.[0]).toEqual({ from: GRID + MAX, to: GRID });
    // Nguồn luôn là một thẻ trong khay.
    for (const step of seq ?? []) {
      expect(step.from).toBeGreaterThanOrEqual(GRID + MAX);
    }
  });

  it("chuỗi demo L3 bỏ qua tiền tố đã xếp: bắt đầu từ ô trống kế tiếp", () => {
    const session = build();
    session.commit({ type: "add_command", data: { command: "forward" } });
    const seq = session.getHintDemoSequence(3);
    expect(seq?.[0]?.to).toBe(GRID + 1);
    expect(seq?.map((s) => s.to)).toEqual(
      (seq ?? []).map((_, i) => GRID + 1 + i)
    );
    const hint = session.getHintTargetForLevel(3);
    if (hint?.kind !== "slot") {
      throw new Error("L3 phải trỏ vào một slot");
    }
    expect(seq?.[0]).toEqual({ from: hint.index, to: GRID + 1 });
  });

  it("hàng lệnh lệch lời giải thì không có chuỗi demo (không dẫn trẻ sai thêm)", () => {
    const session = build();
    // Lời giải bắt đầu bằng `forward`; xếp `turn_left` trước là nền sai.
    session.commit({ type: "add_command", data: { command: "turn_left" } });
    expect(session.getHintDemoSequence(3)).toBeNull();
  });

  it("chuỗi demo chỉ ở L3; L1/L2, đang chạy, hết bước thì null", () => {
    const session = build();
    expect(session.getHintDemoSequence(1)).toBeNull();
    expect(session.getHintDemoSequence(2)).toBeNull();
    session.commit({ type: "add_command", data: { command: "forward" } });
    session.commit({ type: "run_program", data: {} });
    expect(session.getHintDemoSequence(3)).toBeNull();
  });
});
