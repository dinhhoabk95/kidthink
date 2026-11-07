import { describe, expect, it } from "vitest";
import { GT036_FIXTURES } from "#src/templates/GT-036/fixtures";
import {
  GT036_LIGHT_STEP_MS,
  GT036Session,
} from "#src/templates/GT-036/session";

/**
 * Task #313 Phase 3 — GT-036: quy luật phải có ≥2 loại phần tử (`BR-E036-06`),
 * dải không có luật chỉ là lời mời làm tiếp chứ không phải sai (`BR-E036-07`),
 * lời hiện sau khi chốt không in mã thô của phần tử (`BR-E036-08`).
 */
const found = GT036_FIXTURES[0]; // sao/trăng, dải 6, lặp ≥3
if (!found) {
  throw new Error("Thiếu fixture");
}
const f = found;

function build(): GT036Session {
  const session = new GT036Session(f.content, f.difficulty);
  session.prepareRound("5-6");
  return session;
}

function fill(session: GT036Session, ids: readonly string[]): void {
  ids.forEach((elementId, slotIndex) => {
    session.commit({ type: "place_element", data: { slotIndex, elementId } });
  });
}

describe("GT-036 — một loại lặp lại không phải quy luật (BR-E036-06)", () => {
  it("cả dải một loại (AAAAAA) chốt không thắng", () => {
    const session = build();
    fill(session, ["star", "star", "star", "star", "star", "star"]);
    session.dispatch({ type: "commit", timeMs: 1 });
    expect(session.checkWinCondition()).toBe(false);
    expect(session.detectedRule?.detected).toBe(false);
  });

  it("hai loại xen kẽ chốt thì thắng", () => {
    const session = build();
    fill(session, ["star", "moon", "star", "moon", "star", "moon"]);
    session.dispatch({ type: "commit", timeMs: 1 });
    expect(session.checkWinCondition()).toBe(true);
  });

  it("mô-típ ba phần tử có hai loại (AAB AAB) cũng đạt khi đủ lặp", () => {
    const session = new GT036Session(
      { ...f.content, min_repetitions: 2 },
      { ...f.difficulty, min_repetitions: 2 }
    );
    session.prepareRound("5-6");
    fill(session, ["star", "star", "moon", "star", "star", "moon"]);
    session.dispatch({ type: "commit", timeMs: 1 });
    expect(session.checkWinCondition()).toBe(true);
  });
});

describe("GT-036 — dải chưa có luật là lời mời, không phải lỗi (BR-E036-07)", () => {
  it("chốt không có luật: phán quyết im, không tính sai, ô đã đặt sáng lên mời làm tiếp", () => {
    const session = build();
    fill(session, ["star", "star", "star", "star", "star", "star"]);
    const verdict = session.dispatch({ type: "commit", timeMs: 1 });
    expect(verdict).toEqual({ valid: true, feedback: "none" });
    // Các ô sáng lần lượt (BR-E036-11): chờ đủ nhịp để cả dải đã sáng.
    session.update(GT036_LIGHT_STEP_MS * 10);
    const placed = session
      .getView()
      .entities.filter((e) => e.id.startsWith("track_") && e.glyph);
    expect(placed.length).toBeGreaterThan(0);
    for (const e of placed) {
      expect(e.state).toBe("active");
    }
  });

  it("sửa dải rồi chốt lại thì thắng, lời mời tắt khi đặt thêm", () => {
    const session = build();
    fill(session, ["star", "star", "star", "star", "star", "star"]);
    session.dispatch({ type: "commit", timeMs: 1 });
    fill(session, ["star", "moon", "star", "moon", "star", "moon"]);
    const states = session
      .getView()
      .entities.filter((e) => e.id.startsWith("track_"))
      .map((e) => e.state);
    expect(states).not.toContain("active");
    session.dispatch({ type: "commit", timeMs: 2 });
    expect(session.checkWinCondition()).toBe(true);
  });
});

describe("GT-036 — lời sau khi chốt không in mã thô (BR-E036-08)", () => {
  it("lời hiện không chứa element_id hay ngoặc vuông", () => {
    const session = build();
    fill(session, ["star", "moon", "star", "moon", "star", "moon"]);
    session.dispatch({ type: "commit", timeMs: 1 });
    const text = session.ruleOverlayText();
    expect(text).not.toBeNull();
    expect(text).not.toContain("star");
    expect(text).not.toContain("moon");
    expect(text).not.toContain("[");
  });
});
