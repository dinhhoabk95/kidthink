import { describe, expect, it } from "vitest";
import { DEFAULT_LOGIC_SPACE } from "#src/layout/constants";
import { TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import { computeStageZones } from "#src/layout/stage-zones";
import { GT008_FIXTURES } from "#src/templates/GT-008/fixtures";
import { GT008Session } from "#src/templates/GT-008/session";

function getFixture() {
  const fixture = GT008_FIXTURES[0];
  if (!fixture) {
    throw new Error("Missing GT-008 fixture");
  }
  return fixture;
}

describe("GT-008 — kéo vào ô chứa (drag-to-slot): hit-test, spokenLabel, retry state", () => {
  const fixture = getFixture();

  function buildSession(): GT008Session {
    const zones = computeStageZones({
      logicW: DEFAULT_LOGIC_SPACE.w,
      logicH: DEFAULT_LOGIC_SPACE.h,
      ageBand: "4-5",
      cssPerLogic: 1,
      needsTray: true,
      needsCommit: false,
    });
    const session = new GT008Session(fixture.content, fixture.difficulty, 1);
    session.prepareRound(
      "4-5",
      DEFAULT_LOGIC_SPACE,
      zones.stage,
      zones.tray ?? undefined
    );
    return session;
  }

  it("chạm lệch mép trong dung sai TAP_TOLERANCE_PX (24px) chọn được vật nguồn và đặt vào ô đích", () => {
    const session = buildSession();
    const slot0 = fixture.content.slots[0];
    if (!slot0) {
      throw new Error("Missing slot 0");
    }
    const itemIdx = fixture.content.items.findIndex(
      (it) => it.item_id === slot0.expected_item_id
    );
    const sourceSlot = session.sourceSlots[itemIdx];
    const targetSlot = session.targetSlots[0];
    if (!(sourceSlot && targetSlot)) {
      throw new Error("Missing source or target slot");
    }

    const srcOffset = sourceSlot.hitH / 2 + TAP_TOLERANCE_PX - 4;
    expect(
      session.toAction({
        type: "tap",
        x: sourceSlot.x,
        y: sourceSlot.y + srcOffset,
        timeMs: 0,
      })
    ).toBeNull();
    expect(session.getStagedItemId()).toBe(slot0.expected_item_id);

    const dstOffset = targetSlot.hitH / 2 + TAP_TOLERANCE_PX - 4;
    const action = session.toAction({
      type: "tap",
      x: targetSlot.x,
      y: targetSlot.y + dstOffset,
      timeMs: 10,
    });
    expect(action).toEqual({
      type: "place_item",
      data: { item_id: slot0.expected_item_id, slot_id: slot0.slot_id },
    });
  });

  it("chạm ngoài mọi thẻ bị nuốt (feedback none, không tính sai)", () => {
    const session = buildSession();
    const verdict = session.dispatch({
      type: "tap",
      x: -5000,
      y: -5000,
      timeMs: 0,
    });
    expect(verdict?.feedback).toBe("none");
    expect(verdict?.valid).toBe(false);
  });

  it("getView() gán spokenLabel tiếng Việt và giữ id duy nhất cho toàn bộ thực thể", () => {
    const session = buildSession();
    const view = session.getView();
    const ids = view.entities.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const entity of view.entities) {
      expect(entity.spokenLabel).toBeTruthy();
    }
  });
});
