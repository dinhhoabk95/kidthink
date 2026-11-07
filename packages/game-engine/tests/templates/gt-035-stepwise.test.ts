import { describe, expect, it } from "vitest";
import type { ActionResult } from "#src/game-session";
import { GT035_FIXTURES } from "#src/templates/GT-035/fixtures";
import { GT035_STEP_MS, GT035Session } from "#src/templates/GT-035/session";

/**
 * Task #313 Phase 3 — GT-035: robot đi từng lệnh có nhịp (`BR-E035-08`),
 * soạn lệnh không báo đúng sai (`BR-E035-01`), chạy hụt thì robot dừng nơi
 * hụt rồi về đầu có phản hồi, hàng lệnh giữ nguyên (`BR-E035-09`).
 */
const found = GT035_FIXTURES[0]; // lưới 3x3, start (0,0) hướng phải, đích (2,2)
if (!found) {
  throw new Error("Thiếu fixture");
}
const f = found;

function build(): GT035Session {
  const session = new GT035Session(f.content, f.difficulty);
  session.prepareRound("5-6");
  return session;
}

function add(session: GT035Session, ...cmds: string[]): void {
  for (const command of cmds) {
    session.commit({ type: "add_command", data: { command } });
  }
}

/** Đi từng nhịp tới khi có phán quyết hoặc hết lượt chạy. */
function runToVerdict(session: GT035Session): ActionResult | null {
  for (let i = 0; i < 60; i++) {
    const verdict = session.update(GT035_STEP_MS);
    if (verdict && verdict.feedback !== "none") {
      return verdict;
    }
  }
  return null;
}

// forward, forward (tới (2,0)), turn_right, forward, forward (tới (2,2))
const WIN = ["forward", "forward", "turn_right", "forward", "forward"];

describe("GT-035 — robot chạy từng lệnh có nhịp (BR-E035-08)", () => {
  it("bấm chạy chỉ bắt đầu: robot chưa đi, chưa có phán quyết, chưa thắng", () => {
    const session = build();
    add(session, ...WIN);
    const verdict = session.dispatch({ type: "commit", timeMs: 1 });
    expect(verdict).toEqual({ valid: true, feedback: "none" });
    expect(session.isExecuting).toBe(true);
    expect(session.robotState.col).toBe(0);
    expect(session.checkWinCondition()).toBe(false);
  });

  it("mỗi nhịp robot đi đúng một lệnh và thẻ đang chạy sáng lên", () => {
    const session = build();
    add(session, ...WIN);
    session.dispatch({ type: "commit", timeMs: 1 });
    session.update(GT035_STEP_MS);
    expect(session.robotState.col).toBe(1);
    expect(session.activeExecutingStep).toBe(0);
    expect(
      session.getView().entities.find((e) => e.id === "queue_0")?.state
    ).toBe("active");
    session.update(GT035_STEP_MS);
    expect(session.robotState.col).toBe(2);
    expect(session.activeExecutingStep).toBe(1);
  });

  it("chạy tới đích thì thắng ngay ở update(), không cần cử chỉ", () => {
    const session = build();
    add(session, ...WIN);
    session.dispatch({ type: "commit", timeMs: 1 });
    const verdict = runToVerdict(session);
    expect(verdict?.valid).toBe(true);
    expect(session.checkWinCondition()).toBe(true);
    expect(session.robotState).toMatchObject({ col: 2, row: 2 });
  });

  it("không nhận cử chỉ soạn lệnh khi đang chạy", () => {
    const session = build();
    add(session, ...WIN);
    session.dispatch({ type: "commit", timeMs: 1 });
    const palette = session.getView().entities.find((e) => e.role === "source");
    if (!palette) {
      throw new Error("Thiếu thẻ lệnh");
    }
    expect(
      session.toAction({ type: "tap", x: palette.x, y: palette.y, timeMs: 2 })
    ).toBeNull();
  });
});

describe("GT-035 — soạn lệnh không báo đúng sai (BR-E035-01)", () => {
  it("thêm và gỡ lệnh trả phán quyết im, robot vẫn ở start", () => {
    const session = build();
    const added = session.validateAction({
      type: "add_command",
      data: { command: "forward" },
    });
    expect(added).toEqual({ valid: true, feedback: "none" });
    add(session, "forward", "forward", "forward");
    const removed = session.validateAction({
      type: "remove_command",
      data: { index: 0 },
    });
    expect(removed).toEqual({ valid: true, feedback: "none" });
    expect(session.robotState).toMatchObject({ col: 0, row: 0 });
  });

  it("nhân vật xoay đầu theo lệnh xoay vừa thêm", () => {
    const session = build();
    expect(session.getDisplayFacing()).toBe("right");
    add(session, "turn_right");
    expect(session.getDisplayFacing()).toBe("down");
    session.commit({ type: "remove_command", data: { index: 0 } });
    expect(session.getDisplayFacing()).toBe("right");
  });
});

describe("GT-035 — chạy hụt có phản hồi, hàng lệnh giữ nguyên (BR-E035-09)", () => {
  it("đâm ra ngoài lưới: robot dừng nơi hụt một nhịp, báo hổ phách, rồi về start", () => {
    const session = build();
    add(session, "forward", "forward", "forward");
    session.dispatch({ type: "commit", timeMs: 1 });
    const verdict = runToVerdict(session);
    expect(verdict?.valid).toBe(false);
    expect(verdict?.feedback).toBe("amber_soft");
    // Dừng ở ô cuối trong lưới, chưa về ngay.
    expect(session.robotState.col).toBe(2);
    expect(session.isExecuting).toBe(true);
    session.update(GT035_STEP_MS);
    expect(session.robotState).toMatchObject({ col: 0, row: 0 });
    expect(session.isExecuting).toBe(false);
    expect(session.queueSystem.commandCount).toBe(3);
    expect(session.checkWinCondition()).toBe(false);
  });

  it("hàng đầy mà chạy hụt: không tự xoá lệnh nào", () => {
    const session = build();
    add(
      session,
      "turn_left",
      "turn_left",
      "turn_left",
      "turn_left",
      "turn_left",
      "turn_left"
    );
    expect(session.queueSystem.isFull).toBe(true);
    session.dispatch({ type: "commit", timeMs: 1 });
    runToVerdict(session);
    session.update(GT035_STEP_MS);
    expect(session.queueSystem.commandCount).toBe(6);
  });

  it("chạy hụt rồi sửa hàng lệnh và chạy lại thì thắng", () => {
    const session = build();
    add(session, "forward", "forward", "forward");
    session.dispatch({ type: "commit", timeMs: 1 });
    runToVerdict(session);
    session.update(GT035_STEP_MS);
    session.commit({ type: "remove_command", data: { index: 2 } });
    add(session, "turn_right", "forward", "forward");
    session.dispatch({ type: "commit", timeMs: 2 });
    expect(runToVerdict(session)?.valid).toBe(true);
    expect(session.checkWinCondition()).toBe(true);
  });
});
