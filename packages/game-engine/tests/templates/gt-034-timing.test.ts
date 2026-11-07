import { describe, expect, it } from "vitest";
import { GT034_FIXTURES } from "#src/templates/GT-034/fixtures";
import { GT034Session } from "#src/templates/GT-034/session";

/**
 * Task #313 Phase 3 — GT-034: không chấm từng bước lúc gõ (`BR-E034-06`),
 * chấm nhịp gõ theo dung sai của band (`BR-E034-07`), mẫu hình chỉ hiện khi
 * hết lượt nghe (`BR-E034-08`). Fixture 0: trống, xèng, trống, xèng ở 80 BPM
 * (một phách 750 ms, dung sai band 5-6 là 160 ms).
 */
const found = GT034_FIXTURES[0];
if (!found) {
  throw new Error("Thiếu fixture");
}
const f = found;
const BEAT_MS = 750;

function build(): GT034Session {
  const session = new GT034Session(f.content, f.difficulty);
  session.prepareRound("5-6");
  return session;
}

function tapInstrument(session: GT034Session, id: string, timeMs: number) {
  const e = session.getView().entities.find((v) => v.id === id);
  if (!e) {
    throw new Error(`Thiếu nhạc cụ ${id}`);
  }
  return session.dispatch({ type: "tap", x: e.x, y: e.y, timeMs });
}

const RIGHT = ["drum", "cymbal", "drum", "cymbal"];

function playRight(
  session: GT034Session,
  startMs: number,
  gapMs: number
): ReturnType<typeof tapInstrument> {
  let last: ReturnType<typeof tapInstrument>;
  RIGHT.forEach((id, i) => {
    last = tapInstrument(session, id, startMs + i * gapMs);
  });
  return last;
}

describe("GT-034 — không chấm từng bước lúc gõ (BR-E034-06)", () => {
  it("gõ nhầm nhạc cụ ở giữa vẫn là một bước, không báo sai", () => {
    const session = build();
    const verdict = tapInstrument(session, "cymbal", 0);
    expect(verdict).toEqual({ valid: true, feedback: "none" });
    expect(session.userSteps).toEqual(["cymbal"]);
  });

  it("gõ đủ chuỗi sai nội dung: báo nhẹ ở bước cuối, chuỗi giữ nguyên, mẫu phát lại", () => {
    const session = build();
    for (const [i, id] of ["cymbal", "cymbal", "drum"].entries()) {
      tapInstrument(session, id, i * BEAT_MS);
    }
    const verdict = tapInstrument(session, "drum", 3 * BEAT_MS);
    expect(verdict?.valid).toBe(false);
    expect(verdict?.feedback).toBe("amber_soft");
    expect(session.userSteps).toHaveLength(4);
    expect(session.replaysUsed).toBe(1);
    expect(session.checkWinCondition()).toBe(false);
  });

  it("ô bước đã gõ không tô trạng thái đúng trước khi chuỗi chốt", () => {
    const session = build();
    tapInstrument(session, "cymbal", 0);
    const step = session.getView().entities.find((e) => e.id === "step_0");
    expect(step?.state).not.toBe("correct");
  });
});

describe("GT-034 — chấm nhịp gõ (BR-E034-07)", () => {
  it("đúng nội dung và đúng nhịp trong dung sai: thắng", () => {
    const session = build();
    const verdict = playRight(session, 1000, BEAT_MS + 100);
    expect(verdict?.valid).toBe(true);
    expect(session.checkWinCondition()).toBe(true);
  });

  it("đúng nội dung nhưng gõ dồn quá dung sai: không thắng, xoá dải, phát lại mẫu", () => {
    const session = build();
    const verdict = playRight(session, 1000, 100);
    expect(verdict?.valid).toBe(false);
    expect(verdict?.feedback).toBe("amber_soft");
    expect(session.checkWinCondition()).toBe(false);
    expect(session.userSteps).toEqual([]);
    expect(session.replaysUsed).toBe(1);
  });

  it("trượt nhịp ba lần liên tiếp thì bỏ chấm nhịp, lần sau đúng nội dung là thắng", () => {
    const session = build();
    for (let attempt = 0; attempt < 3; attempt++) {
      playRight(session, 1000 + attempt * 10_000, 100);
      expect(session.checkWinCondition()).toBe(false);
    }
    const verdict = playRight(session, 100_000, 100);
    expect(verdict?.valid).toBe(true);
    expect(session.checkWinCondition()).toBe(true);
  });

  it("hành động không mang thời gian (lối chạm thay thế) không bị chấm nhịp", () => {
    const session = build();
    for (const id of RIGHT) {
      session.commit({ type: "tap_instrument", data: { instrument_id: id } });
    }
    expect(session.checkWinCondition()).toBe(true);
  });

  it("chuỗi khớp nội dung không tự thắng qua checkWinCondition khi nhịp lệch", () => {
    const session = build();
    playRight(session, 0, 50);
    expect(session.checkWinCondition()).toBe(false);
  });
});

describe("GT-034 — mẫu hình chỉ hiện khi hết lượt nghe (BR-E034-08)", () => {
  it("lúc đầu ô bước trống không in nhạc cụ của mẫu", () => {
    const session = build();
    session.setupEntities();
    expect(session.showVisualPattern).toBe(false);
  });

  it("nghe hết replay_limit lần thì mẫu hiện bằng hình", () => {
    const session = build();
    session.setupEntities();
    const limit = f.difficulty.replay_limit ?? 3;
    for (let i = 0; i < limit; i++) {
      session.commit({ type: "play_pattern", data: {} });
      session.update(60_000);
    }
    expect(session.showVisualPattern).toBe(true);
    expect(session.canCommit()).toBe(false);
  });
});
