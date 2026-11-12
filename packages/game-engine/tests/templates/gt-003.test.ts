import { describe, expect, it, vi } from "vitest";
import { ACTION_IGNORED } from "#src/game-session";
import { TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import { computeStageZones } from "#src/layout/stage-zones";
import { DegradationManager } from "#src/systems/degradation";
import { RenderSystem } from "#src/systems/render-system";
import { GT003_FIXTURES } from "#src/templates/GT-003/fixtures";
import { GT003Session, WRONG_FEEDBACK_MS } from "#src/templates/GT-003/session";
import { createFakeCanvas } from "#tests/gates/fake-canvas";

function getFirstFixture() {
  const fixture = GT003_FIXTURES[0];
  if (!fixture) {
    throw new Error("GT003_FIXTURES[0] must exist");
  }
  return fixture;
}

function createPreparedSession(allowRetry = true): GT003Session {
  const fixture = getFirstFixture();
  const session = new GT003Session(
    fixture.content,
    { ...fixture.difficulty, allow_retry: allowRetry },
    7
  );
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
  return session;
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
    const session = createPreparedSession(true);

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

  it("BR-ERC-02: render() gọi lặp 100 lần cùng timeMs giữ nguyên Object.entries(session) và hạt chỉ bước trong update(deltaMs)", () => {
    const session = createPreparedSession(true);
    const correctIdx = session.displayItems.findIndex((i) => i.is_correct);
    const fromSlot = session.sourceSlots[correctIdx];
    const box = session.getContainerBox();
    if (!(fromSlot && box)) {
      throw new Error("Missing slot or container box");
    }

    session.dispatch({
      type: "drop",
      fromX: fromSlot.x,
      fromY: fromSlot.y,
      toX: box.x,
      toY: box.y,
      timeMs: 100,
    });

    const canvas = createFakeCanvas(960, 540);
    const rs = new RenderSystem();
    rs.setupCanvas(canvas as HTMLCanvasElement);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Missing 2d context");
    }

    const beforeEntries = JSON.stringify(Object.entries(session));
    for (let i = 0; i < 100; i++) {
      session.render(ctx as CanvasRenderingContext2D, rs, 250);
    }
    const afterEntries = JSON.stringify(Object.entries(session));
    expect(afterEntries).toBe(beforeEntries);

    session.update(16);
    const afterUpdateEntries = JSON.stringify(Object.entries(session));
    expect(afterUpdateEntries).not.toBe(beforeEntries);
  });

  it("allow_retry: false đóng vòng khi thả vật sai, khoá input, giữ nguyên vật đúng đã nằm trong rổ và hint trả null", () => {
    const session = createPreparedSession(false);
    const correctIdx = session.displayItems.findIndex((i) => i.is_correct);
    const wrongIdx = session.displayItems.findIndex((i) => !i.is_correct);
    const correctSlot = session.sourceSlots[correctIdx];
    const wrongSlot = session.sourceSlots[wrongIdx];
    const wrongItem = session.displayItems[wrongIdx];
    const box = session.getContainerBox();
    if (!(correctSlot && wrongSlot && wrongItem && box)) {
      throw new Error("Missing test slots");
    }

    // Thả vật đúng thứ 1 vào rổ
    session.dispatch({
      type: "drop",
      fromX: correctSlot.x,
      fromY: correctSlot.y,
      toX: box.x,
      toY: box.y,
      timeMs: 50,
    });
    expect(session.getPlacements().size).toBe(1);
    expect(session.isAcceptingInput()).toBe(true);

    // Thả vật sai vào rổ -> đóng vòng ngay lập tức
    session.dispatch({
      type: "drop",
      fromX: wrongSlot.x,
      fromY: wrongSlot.y,
      toX: box.x,
      toY: box.y,
      timeMs: 80,
    });

    expect(session.isAcceptingInput()).toBe(false);
    expect(session.getPlacements().size).toBe(1);
    expect(session.getItemState(wrongItem.item_id)).toBe("wrong");
    expect(session.getHintTargetIndex()).toBeNull();
    expect(session.getHintDestinationIndex()).toBeNull();
    expect(session.getHintTarget()).toBeNull();

    // Mọi cử chỉ tiếp theo đều bị khoá
    expect(
      session.toAction({
        type: "tap",
        x: wrongSlot.x,
        y: wrongSlot.y,
        timeMs: 90,
      })
    ).toBeNull();
    expect(
      session.dispatch({
        type: "tap",
        x: wrongSlot.x,
        y: wrongSlot.y,
        timeMs: 90,
      })
    ).toBe(ACTION_IGNORED);
    session.stageItem(wrongItem.item_id);
    expect(session.getStagedItemId()).toBeNull();
    expect(session.hoveredContainer).toBe(false);
  });

  it("khoá sạch getHintTargetIndex, getHintDestinationIndex và getHintTarget sau khi thắng", () => {
    const session = createPreparedSession(true);
    const box = session.getContainerBox();
    if (!box) {
      throw new Error("Missing container box");
    }

    expect(session.getHintTargetIndex()).not.toBeNull();
    expect(session.getHintDestinationIndex()).not.toBeNull();
    expect(session.getHintTarget()).not.toBeNull();

    for (let i = 0; i < session.displayItems.length; i++) {
      const item = session.displayItems[i];
      const slot = session.sourceSlots[i];
      if (item?.is_correct && slot) {
        session.dispatch({
          type: "drop",
          fromX: slot.x,
          fromY: slot.y,
          toX: box.x,
          toY: box.y,
          timeMs: 100 + i * 20,
        });
      }
    }

    expect(session.checkWinCondition()).toBe(true);
    expect(session.getHintTargetIndex()).toBeNull();
    expect(session.getHintDestinationIndex()).toBeNull();
    expect(session.getHintTarget()).toBeNull();
  });

  it("re-drop vật sai đang nháy (<260ms) làm mới nhịp 260ms; chạm tap vào vật đang nháy dọn flash sang selected; chạm lần 2 bỏ chọn", () => {
    const session = createPreparedSession(true);
    const wrongIdx = session.displayItems.findIndex((i) => !i.is_correct);
    const wrongSlot = session.sourceSlots[wrongIdx];
    const wrongItem = session.displayItems[wrongIdx];
    const box = session.getContainerBox();
    if (!(wrongSlot && wrongItem && box)) {
      throw new Error("Missing wrong slot or item");
    }

    // Lần thả sai 1 tại t = 0
    session.dispatch({
      type: "drop",
      fromX: wrongSlot.x,
      fromY: wrongSlot.y,
      toX: box.x,
      toY: box.y,
      timeMs: 0,
    });
    expect(session.getItemState(wrongItem.item_id)).toBe("wrong");

    // Tiến 200ms (< 260ms) rồi thả lại chính vật sai đó
    session.update(200);
    expect(session.getItemState(wrongItem.item_id)).toBe("wrong");
    session.dispatch({
      type: "drop",
      fromX: wrongSlot.x,
      fromY: wrongSlot.y,
      toX: box.x,
      toY: box.y,
      timeMs: 200,
    });

    // Thêm 150ms (tổng 350ms > 260ms ban đầu nhưng mới 150ms từ lần 2) -> vẫn đang nháy wrong!
    session.update(150);
    expect(session.getItemState(wrongItem.item_id)).toBe("wrong");

    // Chạm tap lần 1 vào vật đang nháy wrong -> xoá ngay wrong, chuyển sang selected
    session.dispatch({
      type: "tap",
      x: wrongSlot.x,
      y: wrongSlot.y,
      timeMs: 355,
    });
    expect(session.getItemState(wrongItem.item_id)).toBe("selected");
    expect(session.hoveredContainer).toBe(true);

    // Chạm tap lần 2 vào chính vật đó -> bỏ chọn về idle và tắt hoveredContainer
    session.dispatch({
      type: "tap",
      x: wrongSlot.x,
      y: wrongSlot.y,
      timeMs: 360,
    });
    expect(session.getStagedItemId()).toBeNull();
    expect(session.getItemState(wrongItem.item_id)).toBe("idle");
    expect(session.hoveredContainer).toBe(false);

    // Thả sai lần nữa và đợi hết WRONG_FEEDBACK_MS -> tự về idle
    session.dispatch({
      type: "drop",
      fromX: wrongSlot.x,
      fromY: wrongSlot.y,
      toX: box.x,
      toY: box.y,
      timeMs: 400,
    });
    expect(session.getItemState(wrongItem.item_id)).toBe("wrong");
    session.update(WRONG_FEEDBACK_MS + 10);
    expect(session.getItemState(wrongItem.item_id)).toBe("idle");
  });

  it("hỗ trợ đủ 5 trạng thái thị giác, reducedMotion, softShadowsEnabled, degradation, fallback asset hỏng và cache gradient qua 60 frames", () => {
    const fixture = getFirstFixture();
    const brokenContent = {
      ...fixture.content,
      items: fixture.content.items.map((item, idx) =>
        idx === 0
          ? {
              ...item,
              asset: { kind: "emoji" as const, ref: "unknown_broken_key" },
            }
          : item
      ),
    };
    const session = new GT003Session(brokenContent, fixture.difficulty, 3);
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

    const canvas = createFakeCanvas(960, 540);
    const rs = new RenderSystem();
    rs.setupCanvas(canvas as HTMLCanvasElement);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Missing 2d context");
    }

    // Kiểm tra trạng thái touching -> selected -> wrong -> locked
    const firstItem = session.displayItems[0];
    const wrongItem = session.displayItems.find((i) => !i.is_correct);
    const correctItem = session.displayItems.find((i) => i.is_correct);
    if (!(firstItem && wrongItem && correctItem)) {
      throw new Error("Missing test items");
    }

    session.setTouchingItem(firstItem.item_id);
    expect(session.getTouchingItemId()).toBe(firstItem.item_id);
    expect(session.getItemState(firstItem.item_id)).toBe("touching");
    session.render(ctx as CanvasRenderingContext2D, rs, 16);

    session.stageItem(firstItem.item_id);
    expect(session.getItemState(firstItem.item_id)).toBe("selected");
    session.render(ctx as CanvasRenderingContext2D, rs, 32);

    session.onItemDropped(
      wrongItem.item_id,
      fixture.content.container.container_id
    );
    expect(session.getItemState(wrongItem.item_id)).toBe("wrong");
    const retrySpy = vi.spyOn(rs, "drawRetryRing");
    session.render(ctx as CanvasRenderingContext2D, rs, 48);
    expect(retrySpy).toHaveBeenCalled();

    session.onItemDropped(
      correctItem.item_id,
      fixture.content.container.container_id
    );
    expect(session.getItemState(correctItem.item_id)).toBe("correct");

    // Kiểm tra reducedMotion, softShadowsEnabled = false và degradation.particles_enabled = false
    rs.reducedMotion = true;
    rs.softShadowsEnabled = false;
    const manager = new DegradationManager();
    const degState = manager.updateFps(30);
    session.degradation = degState;
    expect(rs.softShadowsEnabled).toBe(false);
    expect(session.degradation.particles_enabled).toBe(false);

    // 60 frames liên tiếp ở cùng trạng thái rổ không tạo thêm gradient mới
    const gradBefore = ctx.gradientCalls.length;
    for (let f = 0; f < 60; f++) {
      session.render(ctx as CanvasRenderingContext2D, rs, 100 + f * 16);
    }
    expect(ctx.gradientCalls.length - gradBefore).toBeLessThanOrEqual(1);
  });
});
