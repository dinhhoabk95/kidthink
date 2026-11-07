import { describe, expect, it } from "vitest";
import type { Gesture } from "#src/interaction";
import { DEFAULT_LOGIC_SPACE } from "#src/layout/constants";
import { computeStageZones } from "#src/layout/stage-zones";
import { GT009_FIXTURES } from "#src/templates/GT-009/fixtures";
import { GT009Session } from "#src/templates/GT-009/session";

/**
 * Task #313 Phase 3 — GT-009: trẻ tự loại trừ (úp thẻ) rồi bấm chốt; engine
 * không loại thay trẻ (`BR-E009-05`).
 */
function fixtureAt(index: number) {
  const f = GT009_FIXTURES[index];
  if (!f) {
    throw new Error("Missing GT-009 fixture");
  }
  return f;
}

function buildSession(index = 1): GT009Session {
  const f = fixtureAt(index);
  const zones = computeStageZones({
    logicW: DEFAULT_LOGIC_SPACE.w,
    logicH: DEFAULT_LOGIC_SPACE.h,
    ageBand: "4-5",
    cssPerLogic: 1,
    needsTray: false,
    needsCommit: true,
  });
  const session = new GT009Session(f.content, f.difficulty, 1);
  session.prepareRound("4-5", DEFAULT_LOGIC_SPACE, zones.stage);
  return session;
}

function tap(session: GT009Session, id: string): Gesture {
  const e = session.getView().entities.find((x) => x.id === id);
  if (!e) {
    throw new Error(`Thiếu entity ${id}`);
  }
  return { type: "tap", x: e.x, y: e.y, timeMs: 0 };
}

const COMMIT: Gesture = { type: "commit", timeMs: 0 };

describe("GT-009 — trẻ tự loại trừ rồi chốt (BR-E009-05)", () => {
  it("chạm manh mối chỉ đọc lại: không ứng viên nào bị loại thay trẻ", () => {
    const session = buildSession();
    session.dispatch(tap(session, "k1"));
    expect(session.getRevealedClueIds()).toEqual(["k1"]);
    expect(session.getEliminatedIds()).toEqual([]);
    const names = session.getTelemetry().events.map((e) => e.event_name);
    expect(names).not.toContain("candidate_eliminated");
  });

  it("chạm ứng viên úp nó, chạm lần nữa phục hồi; không báo sai, không thắng", () => {
    const session = buildSession();
    const verdict = session.dispatch(tap(session, "c5"));
    expect(verdict?.valid).toBe(true);
    expect(session.getEliminatedIds()).toEqual(["c5"]);
    expect(session.checkWinCondition()).toBe(false);
    session.dispatch(tap(session, "c5"));
    expect(session.getEliminatedIds()).toEqual([]);
  });

  it("nút chốt chỉ sáng khi còn đúng một ứng viên chưa úp", () => {
    const session = buildSession();
    expect(session.needsCommit).toBe(true);
    expect(session.canCommit()).toBe(false);
    expect(session.dispatch(COMMIT)?.valid).toBe(false);
    for (const id of ["c1", "c2", "c5", "c6"]) {
      session.dispatch(tap(session, id));
    }
    expect(session.canCommit()).toBe(true);
  });

  it("úp hết ứng viên sai rồi chốt thì thắng", () => {
    const session = buildSession();
    for (const id of ["c1", "c2", "c5", "c6"]) {
      session.dispatch(tap(session, id));
    }
    session.dispatch(COMMIT);
    expect(session.checkWinCondition()).toBe(true);
  });

  it("chốt sai: ứng viên đã úp giữ nguyên, không thắng", () => {
    const session = buildSession();
    for (const id of ["c1", "c2", "c4", "c5"]) {
      session.dispatch(tap(session, id));
    }
    session.dispatch(COMMIT); // còn c6 — sai
    expect(session.checkWinCondition()).toBe(false);
    expect([...session.getEliminatedIds()].sort()).toEqual([
      "c1",
      "c2",
      "c4",
      "c5",
    ]);
  });

  it("gợi ý trỏ vào ứng viên sai chưa úp, hết thì để nút chốt", () => {
    const session = buildSession();
    const wrongIdx = session.getHintTargetIndex();
    expect(wrongIdx).not.toBeNull();
    for (const id of ["c1", "c2", "c5", "c6"]) {
      session.dispatch(tap(session, id));
    }
    expect(session.getHintTargetIndex()).toBeNull();
    expect(session.getHintTarget()).toEqual({ kind: "action" });
  });
});
