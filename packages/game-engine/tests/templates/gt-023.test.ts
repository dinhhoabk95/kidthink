import { describe, expect, it } from "vitest";
import { deriveLogicSpace } from "#src/layout/constants";
import { TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import { computeStageZones } from "#src/layout/stage-zones";
import { GT023_FIXTURES } from "#src/templates/GT-023/fixtures";
import { GT023Session } from "#src/templates/GT-023/session";

describe("GT-023 — dung sai chạm, kéo thả / chạm-chạm và nhãn đọc (BR-E023)", () => {
  const fixture = GT023_FIXTURES[0];
  if (!fixture) {
    throw new Error("Fixture GT-023 not found");
  }
  const { content, difficulty } = fixture;

  function buildStageSession(): GT023Session {
    const session = new GT023Session(content, difficulty, 1);
    const space = deriveLogicSpace(964, 628);
    const cssPerLogic = 964 / space.w;
    const zones = computeStageZones({
      logicW: space.w,
      logicH: space.h,
      ageBand: "4-5",
      cssPerLogic,
      needsTray: session.needsTray,
      trayItems: session.trayItemCount,
      trayLabels: session.trayHasLabels,
      needsCommit: session.needsCommit,
    });
    session.prepareRound(
      "4-5",
      space,
      zones.stage,
      zones.tray ?? undefined,
      cssPerLogic
    );
    return session;
  }

  it("chạm lệch tâm trong dung sai 24px (TAP_TOLERANCE_PX) vào mảnh nguồn rồi mỏ neo vẫn lắp đúng", () => {
    const session = buildStageSession();
    const anchor0 = content.anchors[0];
    if (!anchor0) {
      throw new Error("Thiếu anchor 0");
    }
    const partIdx = content.parts.findIndex(
      (p) => p.part_id === anchor0.accepted_part_id
    );
    const sourceSlot = session.sourceSlots[partIdx];
    const targetSlot = session.targetSlots[0];
    if (!(sourceSlot && targetSlot)) {
      throw new Error("Thiếu sourceSlot hoặc targetSlot");
    }

    const srcOffset = sourceSlot.hitW / 2 + TAP_TOLERANCE_PX - 4;
    session.dispatch({
      type: "tap",
      x: sourceSlot.x + srcOffset,
      y: sourceSlot.y,
      timeMs: 10,
    });
    expect(session.getStagedItemId()).toBe(anchor0.accepted_part_id);

    const res = session.dispatch({
      type: "tap",
      x: targetSlot.x,
      y: targetSlot.y + TAP_TOLERANCE_PX,
      timeMs: 20,
    });
    expect(res?.valid).toBe(true);
    expect(session.getPlacements().get(anchor0.anchor_id)).toBe(
      anchor0.accepted_part_id
    );
  });

  it("chạm ra ngoài mọi slot bị nuốt, không tính là chạm sai (BR-ETS-02)", () => {
    const session = buildStageSession();

    const verdict = session.dispatch({
      type: "tap",
      x: -5000,
      y: -5000,
      timeMs: 0,
    });
    expect(verdict).toEqual({ valid: false, feedback: "none" });
  });

  it("getView() trả về ID duy nhất và spokenLabel cho mỏ neo cùng mảnh ghép", () => {
    const session = buildStageSession();
    const view = session.getView();
    const ids = view.entities.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);

    const sourceEntities = view.entities.filter((e) => e.role === "source");
    expect(sourceEntities.length).toBe(content.parts.length);
    for (const entity of sourceEntities) {
      expect(entity.spokenLabel).toBeDefined();
    }
  });
});
