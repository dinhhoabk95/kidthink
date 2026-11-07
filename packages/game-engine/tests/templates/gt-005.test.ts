import { describe, expect, it } from "vitest";
import { DEFAULT_LOGIC_SPACE } from "#src/layout/constants";
import { TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import { computeStageZones } from "#src/layout/stage-zones";
import { GT005_FIXTURES } from "#src/templates/GT-005/fixtures";
import { GT005Session } from "#src/templates/GT-005/session";

function getFixture() {
  const fixture = GT005_FIXTURES[0];
  if (!fixture) {
    throw new Error("Missing GT-005 fixture");
  }
  return fixture;
}

describe("GT-005 — ghép cặp (pair-match): hit-test, spokenLabel, unique id", () => {
  const fixture = getFixture();

  function buildStageSession(): GT005Session {
    const zones = computeStageZones({
      logicW: DEFAULT_LOGIC_SPACE.w,
      logicH: DEFAULT_LOGIC_SPACE.h,
      ageBand: "4-5",
      cssPerLogic: 1,
      needsTray: false,
      needsCommit: false,
    });
    const session = new GT005Session(
      fixture.content,
      { ...fixture.difficulty, shuffle_sides: false },
      1
    );
    session.prepareRound("4-5", DEFAULT_LOGIC_SPACE, zones.stage);
    return session;
  }

  it("chạm lệch mép trong dung sai TAP_TOLERANCE_PX (24px) vẫn chọn được thẻ nguồn và ghép với thẻ đích", () => {
    const session = buildStageSession();
    const leftSlot = session.sourceSlots[0];
    const rightSlot = session.targetSlots[0];
    if (!(leftSlot && rightSlot)) {
      throw new Error("Missing source or target slot");
    }

    const tapLeftOffset = leftSlot.hitH / 2 + TAP_TOLERANCE_PX - 4;
    const stageAct = session.toAction({
      type: "tap",
      x: leftSlot.x,
      y: leftSlot.y - tapLeftOffset,
      timeMs: 0,
    });
    expect(stageAct).toBeNull();
    expect(session.getStagedLeftId()).toBe(
      fixture.content.pairs[0]?.left.item_id
    );

    const tapRightOffset = rightSlot.hitH / 2 + TAP_TOLERANCE_PX - 4;
    const matchAct = session.toAction({
      type: "tap",
      x: rightSlot.x,
      y: rightSlot.y - tapRightOffset,
      timeMs: 10,
    });
    expect(matchAct).toEqual({
      type: "match_pair",
      data: {
        left_item_id: fixture.content.pairs[0]?.left.item_id,
        right_item_id: fixture.content.pairs[0]?.right.item_id,
      },
    });
  });

  it("chạm ngoài mọi thẻ bị nuốt (feedback none, không tính sai)", () => {
    const session = buildStageSession();
    const verdict = session.dispatch({
      type: "tap",
      x: -5000,
      y: -5000,
      timeMs: 0,
    });
    expect(verdict?.feedback).toBe("none");
    expect(verdict?.valid).toBe(false);
  });

  it("getView() gán spokenLabel tiếng Việt cho mọi thực thể và giữ id duy nhất ngay cả khi left.item_id === right.item_id (dạng DB)", () => {
    const dbStyleContent = {
      ...fixture.content,
      pairs: fixture.content.pairs.map((p, idx) => ({
        pair_id: p.pair_id,
        left: { ...p.left, item_id: `n${idx + 1}` },
        right: { ...p.right, item_id: `n${idx + 1}` },
      })),
    };
    const zones = computeStageZones({
      logicW: DEFAULT_LOGIC_SPACE.w,
      logicH: DEFAULT_LOGIC_SPACE.h,
      ageBand: "4-5",
      cssPerLogic: 1,
      needsTray: false,
      needsCommit: false,
    });
    const session = new GT005Session(
      dbStyleContent,
      { ...fixture.difficulty, shuffle_sides: false },
      1
    );
    session.prepareRound("4-5", DEFAULT_LOGIC_SPACE, zones.stage);

    const view = session.getView();
    const ids = view.entities.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const entity of view.entities) {
      expect(entity.spokenLabel).toBeTruthy();
    }
  });
});
