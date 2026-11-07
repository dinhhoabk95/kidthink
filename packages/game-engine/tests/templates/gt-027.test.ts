import { describe, expect, it } from "vitest";
import { deriveLogicSpace } from "#src/layout/constants";
import { findHitEntity } from "#src/layout/hit-test";
import { computeStageZones } from "#src/layout/stage-zones";
import { GT027_FIXTURES } from "#src/templates/GT-027/fixtures";
import { GT027Session } from "#src/templates/GT-027/session";

describe("GT-027 — đổi luật phân loại trên bề mặt web (BR-E027, BR-PNR-02)", () => {
  const fixture = GT027_FIXTURES[0];
  if (!fixture) {
    throw new Error("Fixture GT-027 not found");
  }
  const { content, difficulty } = fixture;

  function buildStageSession(): GT027Session {
    const session = new GT027Session(content, difficulty, 1);
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
    expect(view.entities).toHaveLength(content.items.length);

    for (const entity of view.entities) {
      expect(entity.spokenLabel).toBeDefined();
      expect(findHitEntity(view.entities, entity.x, entity.y)?.id).toBe(
        entity.id
      );
    }
  });

  it("getHintTargetIndex ưu tiên phần tử hợp lệ chưa được chọn", () => {
    const session = buildStageSession();
    const firstHint = session.getHintTargetIndex();
    expect(firstHint).not.toBeNull();
    const firstSlot = session.slots[firstHint ?? 0];
    if (!firstSlot) {
      throw new Error("Missing first hinted slot");
    }

    session.dispatch({
      type: "tap",
      x: firstSlot.x,
      y: firstSlot.y,
      timeMs: 10,
    });

    const secondHint = session.getHintTargetIndex();
    expect(secondHint).not.toBeNull();
  });
});
