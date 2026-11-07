import { describe, expect, it } from "vitest";
import { deriveLogicSpace } from "#src/layout/constants";
import { findHitEntity } from "#src/layout/hit-test";
import { computeStageZones } from "#src/layout/stage-zones";
import { GT029_FIXTURES } from "#src/templates/GT-029/fixtures";
import { GT029Session } from "#src/templates/GT-029/session";

describe("GT-029 — bớt khỏi tập hợp trên bề mặt web (BR-E029, BR-PNR-02)", () => {
  const fixture = GT029_FIXTURES[0];
  if (!fixture) {
    throw new Error("Fixture GT-029 not found");
  }
  const { content, difficulty } = fixture;

  function buildStageSession(): GT029Session {
    const session = new GT029Session(content, difficulty, 1);
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

  it("getView().entities có spokenLabel cho vật thể và thẻ số đáp án, khớp vùng chạm findHitEntity", () => {
    const session = buildStageSession();
    const initialEntities = session.getView().entities;
    expect(initialEntities).toHaveLength(content.initial_items.length);

    for (const entity of initialEntities) {
      expect(entity.spokenLabel).toBeDefined();
      expect(findHitEntity(initialEntities, entity.x, entity.y)?.id).toBe(
        entity.id
      );
    }

    // Bớt đủ số lượng yêu cầu để hiện các thẻ số đáp án
    for (let i = 0; i < content.remove_count; i++) {
      const target = initialEntities[i];
      if (!target) {
        throw new Error(`Missing item ${i}`);
      }
      const res = session.dispatch({
        type: "tap",
        x: target.x,
        y: target.y,
        timeMs: i * 10,
      });
      expect(res?.valid).toBe(true);
    }

    const afterRemoveEntities = session.getView().entities;
    const optionEntities = afterRemoveEntities.filter(
      (e) => e.role === "target"
    );
    expect(optionEntities).toHaveLength(content.answer_options.length);

    for (const optEntity of optionEntities) {
      expect(optEntity.spokenLabel).toBeDefined();
      expect(optEntity.hitShape).toBe("square");
      expect(
        findHitEntity(afterRemoveEntities, optEntity.x, optEntity.y)?.id
      ).toBe(optEntity.id);
    }
  });
});
