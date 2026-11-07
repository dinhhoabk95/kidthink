import { describe, expect, it } from "vitest";
import { GT035_FIXTURES } from "#src/templates/GT-035/fixtures";
import { GT035_STEP_MS, GT035Session } from "#src/templates/GT-035/session";

/**
 * Task #313 — GT-035: nút dừng giữa lúc robot đang chạy (`BR-E035-13`).
 * Fixture 0: lưới 3x3, start (0,0) hướng phải, đích (2,2).
 */
const found = GT035_FIXTURES[0];
if (!found) {
  throw new Error("Thiếu fixture");
}
const f = found;
const WIN = ["forward", "forward", "turn_right", "forward", "forward"];

function running(): GT035Session {
  const session = new GT035Session(f.content, f.difficulty);
  session.prepareRound("5-6");
  for (const command of WIN) {
    session.commit({ type: "add_command", data: { command } });
  }
  session.dispatch({ type: "commit", timeMs: 1 });
  return session;
}

describe("GT-035 — nút dừng giữa lúc chạy (BR-E035-13)", () => {
  it("nút ở vùng hành động là ▶ lúc soạn, thành ■ và bấm được lúc robot chạy", () => {
    const session = new GT035Session(f.content, f.difficulty);
    session.prepareRound("5-6");
    expect(session.commitIcon).toBe("play");
    for (const command of WIN) {
      session.commit({ type: "add_command", data: { command } });
    }
    expect(session.commitIcon).toBe("play");
    session.dispatch({ type: "commit", timeMs: 1 });
    expect(session.isExecuting).toBe(true);
    expect(session.commitIcon).toBe("stop");
    expect(session.canCommit()).toBe(true);
  });

  it("bấm dừng: robot về start, hàng lệnh giữ nguyên, không tính sai", () => {
    const session = running();
    session.update(GT035_STEP_MS * 2);
    expect(session.robotState.col).toBe(2);
    const verdict = session.dispatch({ type: "commit", timeMs: 2 });
    expect(verdict).toEqual({ valid: true, feedback: "none" });
    expect(session.isExecuting).toBe(false);
    expect(session.robotState).toMatchObject({ col: 0, row: 0 });
    expect(session.activeExecutingStep).toBeNull();
    expect(session.queueSystem.commandCount).toBe(WIN.length);
    expect(session.checkWinCondition()).toBe(false);
    expect(session.mascotMood()).toBeNull();
    const names = session.getTelemetry().events.map((e) => e.event_name);
    expect(names).not.toContain("program_failed");
    expect(names).toContain("program_stopped");
    expect(session.commitIcon).toBe("play");
  });

  it("sau khi dừng vẫn chạy lại và thắng như thường", () => {
    const session = running();
    session.update(GT035_STEP_MS);
    session.dispatch({ type: "commit", timeMs: 2 });
    session.dispatch({ type: "commit", timeMs: 3 });
    expect(session.isExecuting).toBe(true);
    for (let i = 0; i < 20; i++) {
      session.update(GT035_STEP_MS);
    }
    expect(session.checkWinCondition()).toBe(true);
  });

  it("đang chạy chỉ nhận cử chỉ dừng; chạm thẻ lệnh không soạn được", () => {
    const session = running();
    const palette = session.getView().entities.find((e) => e.role === "source");
    if (!palette) {
      throw new Error("Thiếu thẻ lệnh");
    }
    expect(
      session.toAction({ type: "tap", x: palette.x, y: palette.y, timeMs: 2 })
    ).toBeNull();
    expect(session.toAction({ type: "commit", timeMs: 3 })).toEqual({
      type: "stop_program",
      data: {},
    });
  });

  it("đang chạy thì gợi ý không trỏ vào nút", () => {
    const session = running();
    expect(session.getHintTarget()).toBeNull();
  });
});
