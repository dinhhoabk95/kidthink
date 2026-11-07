import { describe, expect, it } from "vitest";
import { deriveLogicSpace } from "#src/layout/constants";
import { computeStageZones } from "#src/layout/stage-zones";
import { GT024_FIXTURES } from "#src/templates/GT-024/fixtures";
import { GT024Session } from "#src/templates/GT-024/session";

describe("GT-024 — nối điểm qua tap, stroke và drop trên bề mặt web (BR-E024)", () => {
  const fixture = GT024_FIXTURES[0];
  if (!fixture) {
    throw new Error("Fixture GT-024 not found");
  }
  const { content, difficulty } = fixture;

  function buildStageSession(): {
    session: GT024Session;
    actionCenter: { x: number; y: number };
  } {
    const session = new GT024Session(content, difficulty, 1);
    const space = deriveLogicSpace(964, 628);
    const cssPerLogic = 964 / space.w;
    const zones = computeStageZones({
      logicW: space.w,
      logicH: space.h,
      ageBand: "5-6",
      cssPerLogic,
      needsTray: false,
      needsCommit: true,
    });
    session.prepareRound("5-6", space, zones.stage, undefined, cssPerLogic);
    return {
      session,
      actionCenter: {
        x: zones.action.x + zones.action.w / 2,
        y: zones.action.y + zones.action.h / 2,
      },
    };
  }

  it("hỗ trợ cử chỉ drop (kéo thả trên canvas web) đi qua waypoint mục tiêu trong stage", () => {
    const { session, actionCenter } = buildStageSession();
    const wp0 = session.getView().entities[0];
    const wp1 = session.getView().entities[1];
    if (!(wp0 && wp1)) {
      throw new Error("Thiếu waypoint 0 hoặc 1");
    }

    // Kéo từ ngoài stage (vùng action) vào waypoint bị từ chối
    const dropFromOutside = session.toAction({
      type: "drop",
      fromX: actionCenter.x,
      fromY: actionCenter.y,
      toX: wp0.x,
      toY: wp0.y,
      timeMs: 10,
    });
    expect(dropFromOutside).toBeNull();

    // Chạm mở đầu ở wp0
    const res0 = session.dispatch({
      type: "tap",
      x: wp0.x,
      y: wp0.y,
      timeMs: 20,
    });
    expect(res0?.valid).toBe(true);
    expect(session.traceSystem.getCurrentOrderIndex()).toBe(1);

    // Kéo (drop) từ wp0 tới wp1 trên canvas web
    const res1 = session.dispatch({
      type: "drop",
      fromX: wp0.x,
      fromY: wp0.y,
      toX: wp1.x,
      toY: wp1.y,
      timeMs: 30,
    });
    expect(res1?.valid).toBe(true);
    expect(session.traceSystem.getCurrentOrderIndex()).toBe(2);
  });

  it("chạm ra ngoài waypoint bị nuốt, không tính là chạm sai (BR-ETS-02)", () => {
    const { session } = buildStageSession();

    const verdict = session.dispatch({
      type: "tap",
      x: -5000,
      y: -5000,
      timeMs: 0,
    });
    expect(verdict).toEqual({ valid: false, feedback: "none" });
  });

  it("getView() trả về ID duy nhất và spokenLabel cho các điểm mốc có nhãn", () => {
    const { session } = buildStageSession();
    const view = session.getView();
    const ids = view.entities.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);

    const firstEntity = view.entities[0];
    expect(firstEntity?.label).toBe(content.waypoints[0]?.label);
    if (content.waypoints[0]?.label) {
      expect(firstEntity?.spokenLabel).toBeDefined();
    }
  });
});
