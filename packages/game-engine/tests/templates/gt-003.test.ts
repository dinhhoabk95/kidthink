import { describe, expect, it } from "vitest";
import { ACTION_IGNORED } from "#src/game-session";
import { TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import { computeStageZones } from "#src/layout/stage-zones";
import { GT003_FIXTURES } from "#src/templates/GT-003/fixtures";
import { GT003Session } from "#src/templates/GT-003/session";

function getFirstFixture() {
  const fixture = GT003_FIXTURES[0];
  if (!fixture) {
    throw new Error("GT003_FIXTURES[0] must exist");
  }
  return fixture;
}

describe("GT-003 — Drag to Container session contract", () => {
  it("cung cấp spokenLabel tiếng Việt cho mọi entity nguồn kể cả khi item.label không khai báo", () => {
    for (const fixture of GT003_FIXTURES) {
      const session = new GT003Session(fixture.content, fixture.difficulty, 1);
      const zones = computeStageZones({
        logicW: 960,
        logicH: 540,
        ageBand: "4-5",
        cssPerLogic: 1,
        needsTray: true,
        needsCommit: false,
      });
      session.prepareRound(
        "4-5",
        { w: 960, h: 540 },
        zones.stage,
        zones.tray ?? undefined
      );

      const view = session.getView();
      const sources = view.entities.filter((e) => e.role === "source");
      expect(sources.length).toBe(fixture.content.items.length);
      for (const entity of sources) {
        expect(entity.spokenLabel).toBeTruthy();
        expect(entity.label).toBeTruthy();
      }
      const target = view.entities.find((e) => e.role === "target");
      expect(target?.hitShape).toBe("square");
      expect(target?.spokenLabel).toBe(fixture.content.container.label);
    }
  });

  it("hỗ trợ cả kéo-thả và chạm-chạm với dung sai TAP_TOLERANCE_PX và tự thắng khi đủ vật đúng", () => {
    const fixture = getFirstFixture();
    const session = new GT003Session(fixture.content, fixture.difficulty, 7);
    const zones = computeStageZones({
      logicW: 960,
      logicH: 540,
      ageBand: "3-4",
      cssPerLogic: 1,
      needsTray: true,
      needsCommit: false,
    });
    session.prepareRound(
      "3-4",
      { w: 960, h: 540 },
      zones.stage,
      zones.tray ?? undefined
    );

    const view = session.getView();
    const target = view.entities.find((e) => e.role === "target");
    if (!target) {
      throw new Error("Missing container target entity");
    }

    const correctIds = new Set(
      fixture.content.items.filter((i) => i.is_correct).map((i) => i.item_id)
    );
    const correctEntities = view.entities.filter(
      (e) => e.role === "source" && correctIds.has(e.id)
    );
    expect(correctEntities.length).toBeGreaterThanOrEqual(2);

    const first = correctEntities[0];
    if (!first) {
      throw new Error("Missing first correct entity");
    }

    // Chạm-chạm ở rìa trong dung sai TAP_TOLERANCE_PX
    const edgeX = first.x + first.w / 2 + TAP_TOLERANCE_PX - 2;
    const tap1 = session.dispatch({
      type: "tap",
      x: edgeX,
      y: first.y,
      timeMs: 10,
    });
    expect(tap1).toEqual(ACTION_IGNORED);
    expect(session.getStagedItemId()).toBe(first.id);

    const tap2 = session.dispatch({
      type: "tap",
      x: target.x,
      y: target.y,
      timeMs: 20,
    });
    expect(tap2?.valid).toBe(true);
    expect(session.getPlacements().has(first.id)).toBe(true);

    // Kéo-thả các vật đúng còn lại
    for (const entity of correctEntities.slice(1)) {
      const res = session.dispatch({
        type: "drop",
        fromX: entity.x,
        fromY: entity.y,
        toX: target.x,
        toY: target.y,
        timeMs: 30,
      });
      expect(res?.valid).toBe(true);
    }

    expect(session.checkWinCondition()).toBe(true);
  });
});
