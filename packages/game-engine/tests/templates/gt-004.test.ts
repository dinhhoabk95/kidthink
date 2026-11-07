import { describe, expect, it } from "vitest";
import { ACTION_IGNORED } from "#src/game-session";
import { TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import { computeStageZones } from "#src/layout/stage-zones";
import { WRONG_FLASH_MS } from "#src/systems/wrong-flash";
import { GT004_FIXTURES } from "#src/templates/GT-004/fixtures";
import { GT004Session } from "#src/templates/GT-004/session";

function getFirstFixture() {
  const fixture = GT004_FIXTURES[0];
  if (!fixture) {
    throw new Error("GT004_FIXTURES[0] must exist");
  }
  return fixture;
}

describe("GT-004 — Sort Groups session contract", () => {
  it("cung cấp spokenLabel tiếng Việt cho cả vật nguồn và rổ đích trong getView().entities", () => {
    for (const fixture of GT004_FIXTURES) {
      const session = new GT004Session(fixture.content, fixture.difficulty, 1);
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
      const targets = view.entities.filter((e) => e.role === "target");

      expect(sources.length).toBe(fixture.content.items.length);
      expect(targets.length).toBe(fixture.content.groups.length);

      for (const src of sources) {
        expect(src.spokenLabel).toBeTruthy();
        expect(src.label).toBeTruthy();
      }
      for (const tgt of targets) {
        expect(tgt.spokenLabel).toBeTruthy();
        expect(tgt.hitShape).toBe("square");
      }
    }
  });

  it("bỏ qua vật đã phân loại khi chạm lại ô cũ, bật trạng thái incorrect tạm thời WRONG_FLASH_MS (400ms) khi thả nhầm rổ, và hoàn thành bằng cả kéo-thả lẫn chạm-chạm", () => {
    const fixture = getFirstFixture();
    const session = new GT004Session(fixture.content, fixture.difficulty, 3);
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
    const targets = view.entities.filter((e) => e.role === "target");

    const firstSource = sources[0];
    if (!firstSource) {
      throw new Error("Missing first source entity");
    }
    const itemDef = fixture.content.items.find(
      (i) => i.item_id === firstSource.id
    );
    if (!itemDef) {
      throw new Error("Missing item definition");
    }

    const wrongTarget = targets.find((t) => t.id !== itemDef.correct_group_id);
    const rightTarget = targets.find((t) => t.id === itemDef.correct_group_id);
    if (!(wrongTarget && rightTarget)) {
      throw new Error("Missing target entities");
    }

    // Thả nhầm rổ -> trả về valid: false, trạng thái incorrect tạm thời WRONG_FLASH_MS (400ms)
    const wrongRes = session.dispatch({
      type: "drop",
      fromX: firstSource.x,
      fromY: firstSource.y,
      toX: wrongTarget.x,
      toY: wrongTarget.y,
      timeMs: 10,
    });
    expect(wrongRes?.valid).toBe(false);
    expect(
      session.getView().entities.find((e) => e.id === firstSource.id)?.state
    ).toBe("incorrect");

    session.update(WRONG_FLASH_MS - 1);
    expect(
      session.getView().entities.find((e) => e.id === firstSource.id)?.state
    ).toBe("incorrect");
    session.update(1);
    expect(
      session.getView().entities.find((e) => e.id === firstSource.id)?.state
    ).toBe("idle");

    // Chạm-chạm đúng rổ với dung sai TAP_TOLERANCE_PX
    session.dispatch({
      type: "tap",
      x: firstSource.x + firstSource.w / 2 + TAP_TOLERANCE_PX - 2,
      y: firstSource.y,
      timeMs: 20,
    });
    expect(session.getStagedItemId()).toBe(firstSource.id);

    const rightTap = session.dispatch({
      type: "tap",
      x: rightTarget.x,
      y: rightTarget.y,
      timeMs: 30,
    });
    expect(rightTap?.valid).toBe(true);
    expect(session.getPlacements().get(firstSource.id)).toBe(rightTarget.id);

    // Chạm lại đúng toạ độ ô vừa đặt xong không được chọn lại vật đã đặt
    session.dispatch({
      type: "tap",
      x: firstSource.x,
      y: firstSource.y,
      timeMs: 40,
    });
    expect(session.getStagedItemId()).not.toBe(firstSource.id);
    expect(
      session.validateAction({
        type: "sort_item",
        data: { item_id: firstSource.id, group_id: rightTarget.id },
      })
    ).toEqual(ACTION_IGNORED);

    // Kéo-thả các vật còn lại về đúng rổ
    for (const src of sources.slice(1)) {
      const def = fixture.content.items.find((i) => i.item_id === src.id);
      const tgt = targets.find((t) => t.id === def?.correct_group_id);
      if (!tgt) {
        throw new Error("Missing target for item");
      }
      const res = session.dispatch({
        type: "drop",
        fromX: src.x,
        fromY: src.y,
        toX: tgt.x,
        toY: tgt.y,
        timeMs: 50,
      });
      expect(res?.valid).toBe(true);
    }

    expect(session.checkWinCondition()).toBe(true);
  });
});
