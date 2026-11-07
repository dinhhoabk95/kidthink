import { describe, expect, it } from "vitest";
import { deriveLogicSpace } from "#src/layout/constants";
import { findHitEntity } from "#src/layout/hit-test";
import { computeStageZones } from "#src/layout/stage-zones";
import { GT025_FIXTURES } from "#src/templates/GT-025/fixtures";
import { GT025Session } from "#src/templates/GT-025/session";

describe("GT-025 — tìm điểm khác nhau trên bề mặt web (BR-E025, BR-PNR-02)", () => {
  const fixture = GT025_FIXTURES[0];
  if (!fixture) {
    throw new Error("Fixture GT-025 not found");
  }
  const { content, difficulty } = fixture;

  function buildStageSession(): GT025Session {
    const session = new GT025Session(content, difficulty, 1);
    const space = deriveLogicSpace(964, 628);
    const cssPerLogic = 964 / space.w;
    const zones = computeStageZones({
      logicW: space.w,
      logicH: space.h,
      ageBand: "4-5",
      cssPerLogic,
      needsTray: false,
      needsCommit: false,
    });
    session.prepareRound("4-5", space, zones.stage, undefined, cssPerLogic);
    return session;
  }

  it("getView().entities có spokenLabel tiếng Việt và khớp vùng chạm findHitEntity", () => {
    const session = buildStageSession();
    const view = session.getView();
    expect(view.entities.length).toBe(
      content.left_objects.length + content.right_objects.length
    );

    for (const entity of view.entities) {
      expect(entity.spokenLabel).toBeDefined();
      const hit = findHitEntity(view.entities, entity.x, entity.y);
      expect(hit?.id).toBe(entity.id);
    }
  });

  it("chạm đúng tất cả điểm khác nhau trên cả hai bên hoàn thành vòng chơi", () => {
    const session = buildStageSession();
    const entities = session.getView().entities;

    for (const diff of content.differences) {
      const target = entities.find((e) => e.id === diff.right_id);
      if (!target) {
        throw new Error(`Missing target ${diff.right_id}`);
      }
      const verdict = session.dispatch({
        type: "tap",
        x: target.x,
        y: target.y,
        timeMs: 100,
      });
      expect(verdict?.valid).toBe(true);
    }

    expect(session.checkWinCondition()).toBe(true);
  });

  it("chạm ra ngoài đối tượng bị nuốt, không tính là chạm sai (BR-ETS-02)", () => {
    const session = buildStageSession();
    const verdict = session.dispatch({
      type: "tap",
      x: -5000,
      y: -5000,
      timeMs: 0,
    });
    expect(verdict).toEqual({ valid: false, feedback: "none" });
  });
});
