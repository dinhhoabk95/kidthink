import { describe, expect, it } from "vitest";
import { GT034_FIXTURES } from "#src/templates/GT-034/fixtures";
import { GT034Session } from "#src/templates/GT-034/session";

/**
 * Task #313 — GT-034 `N5`: `L1` ô bước kế sáng · `L2` nhạc cụ đúng nháy ·
 * `L3` mẫu phát lại nửa tốc độ kèm ô bước sáng, lặp (`BR-E034-10`).
 * Fixture 0: trống, xèng, trống, xèng ở 80 BPM (một phách 750 ms).
 */
const found = GT034_FIXTURES[0];
if (!found) {
  throw new Error("Thiếu fixture");
}
const f = found;
const HALF_BEAT_MS = 1500;
const PATTERN_LEN = f.content.target_pattern.length;

function build(): GT034Session {
  const session = new GT034Session(f.content, f.difficulty);
  session.prepareRound("5-6");
  return session;
}

describe("GT-034 — thang hint L1/L2/L3 (BR-E034-10)", () => {
  it("L1: chỉ ô bước kế sáng, chưa chỉ nhạc cụ", () => {
    const session = build();
    expect(session.getHintTargetForLevel(1)).toEqual({
      kind: "region",
      ids: ["step_0"],
    });
  });

  it("L1 sau một bước gõ: ô bước thứ hai", () => {
    const session = build();
    const drum = session.getView().entities.find((e) => e.id === "drum");
    if (!drum) {
      throw new Error("Thiếu trống");
    }
    session.dispatch({ type: "tap", x: drum.x, y: drum.y, timeMs: 0 });
    expect(session.getHintTargetForLevel(1)).toEqual({
      kind: "region",
      ids: ["step_1"],
    });
  });

  it("L2: nhạc cụ đúng của bước kế nháy", () => {
    const session = build();
    const hint = session.getHintTargetForLevel(2);
    const drumIdx = f.content.instruments.findIndex(
      (i) => i.instrument_id === "drum"
    );
    expect(hint).toEqual({ kind: "slot", index: PATTERN_LEN + drumIdx });
    expect(session.getHintPlaybackIndex()).toBeNull();
  });

  it("L3: mẫu phát nửa tốc độ, ô bước sáng lần lượt rồi lặp", () => {
    const session = build();
    session.getHintTargetForLevel(3);
    expect(session.getHintPlaybackIndex()).toBe(0);
    session.update(HALF_BEAT_MS - 1);
    expect(session.getHintPlaybackIndex()).toBe(0);
    session.update(1);
    expect(session.getHintPlaybackIndex()).toBe(1);
    session.update(HALF_BEAT_MS * (PATTERN_LEN - 2));
    expect(session.getHintPlaybackIndex()).toBe(PATTERN_LEN - 1);
    // Nghỉ một phách giữa hai vòng rồi lặp lại từ bước đầu.
    session.update(HALF_BEAT_MS);
    expect(session.getHintPlaybackIndex()).toBeNull();
    session.update(HALF_BEAT_MS);
    expect(session.getHintPlaybackIndex()).toBe(0);
    const lit = session
      .getView()
      .entities.filter(
        (e) => e.id.startsWith("step_") && e.state === "selected"
      );
    expect(lit.map((e) => e.id)).toEqual(["step_0"]);
  });

  it("L3 không dùng lượt nghe lại và không khoá nhập", () => {
    const session = build();
    session.getHintTargetForLevel(3);
    expect(session.replaysUsed).toBe(0);
    expect(session.canCommit()).toBe(true);
  });

  it("gõ một bước thì phát gợi ý dừng", () => {
    const session = build();
    session.getHintTargetForLevel(3);
    const drum = session.getView().entities.find((e) => e.id === "drum");
    if (!drum) {
      throw new Error("Thiếu trống");
    }
    session.dispatch({ type: "tap", x: drum.x, y: drum.y, timeMs: 0 });
    expect(session.getHintPlaybackIndex()).toBeNull();
  });

  it("hạ về L2 thì phát gợi ý dừng", () => {
    const session = build();
    session.getHintTargetForLevel(3);
    session.getHintTargetForLevel(2);
    expect(session.getHintPlaybackIndex()).toBeNull();
  });
});

describe("GT-034 — trợ giúp về L0 thì mẫu gợi ý thôi phát lặp", () => {
  it("L3 đang phát, onHintCleared: không còn ô sáng của mẫu gợi ý", () => {
    const session = build();
    session.getHintTargetForLevel(3);
    expect(session.getHintPlaybackIndex()).toBe(0);
    session.onHintCleared();
    expect(session.getHintPlaybackIndex()).toBeNull();
    session.update(HALF_BEAT_MS);
    expect(session.getHintPlaybackIndex()).toBeNull();
  });
});
