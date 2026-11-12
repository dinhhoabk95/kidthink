import { describe, expect, it, vi } from "vitest";
import { DEFAULT_LOGIC_SPACE } from "#src/layout/constants";
import { TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import { computeStageZones } from "#src/layout/stage-zones";
import {
  drawGT008InsetBoard,
  drawGT008SourceToken,
  drawGT008TargetWell,
} from "#src/render/gt-008-shapes";
import { RenderSystem } from "#src/systems/render-system";
import { WRONG_FLASH_MS } from "#src/systems/wrong-flash";
import { GT008_FIXTURES } from "#src/templates/GT-008/fixtures";
import {
  resolveGT008TokenPalette,
  resolveGT008TokenPose,
} from "#src/templates/GT-008/layout";
import { GT008Session } from "#src/templates/GT-008/session";
import type {
  GT008Content,
  GT008Difficulty,
} from "#src/templates/GT-008/template";
import { createFakeCanvas } from "#tests/gates/fake-canvas";
import { collectRenderedText, lettersOnly } from "#tests/helpers/rendered-text";

function isCanvas2D(v: object | null): v is CanvasRenderingContext2D {
  return v !== null && "fillText" in v;
}

function getFixture(): {
  readonly content: GT008Content;
  readonly difficulty: GT008Difficulty;
} {
  const fixture = GT008_FIXTURES[0];
  if (!fixture) {
    throw new Error("Missing GT-008 fixture");
  }
  return fixture;
}

describe("GT-008 — kéo vào ô chứa (drag-to-slot): hit-test, spokenLabel, retry state", () => {
  const fixture = getFixture();

  function buildSession(
    seed = 1,
    difficultyOverride?: Partial<GT008Difficulty>,
    contentOverride?: GT008Content
  ): GT008Session {
    const zones = computeStageZones({
      logicW: DEFAULT_LOGIC_SPACE.w,
      logicH: DEFAULT_LOGIC_SPACE.h,
      ageBand: "4-5",
      cssPerLogic: 1,
      needsTray: true,
      needsCommit: false,
    });
    const session = new GT008Session(
      contentOverride ?? fixture.content,
      { ...fixture.difficulty, ...difficultyOverride },
      seed
    );
    session.prepareRound(
      "4-5",
      DEFAULT_LOGIC_SPACE,
      zones.stage,
      zones.tray ?? undefined
    );
    return session;
  }

  it("chạm lệch mép trong dung sai TAP_TOLERANCE_PX (24px) chọn được vật nguồn và đặt vào ô đích", () => {
    const session = buildSession(1);
    const slot0 = fixture.content.slots[0];
    if (!slot0) {
      throw new Error("Missing slot 0");
    }
    const itemIdx = session.displayItems.findIndex(
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

  it("thang gợi ý L1 / L2 / L3: L1 tô ô đích trống, L2 nối vật nguồn tới ô đích, L3 trả chuỗi bước mẫu", () => {
    const session = buildSession(1);
    const slot0 = fixture.content.slots[0];
    const slot2 = fixture.content.slots[2];
    if (!(slot0 && slot2)) {
      throw new Error("Missing fixture slots");
    }

    expect(session.getHintTargetForLevel(1)).toEqual({
      kind: "region",
      ids: [slot0.slot_id],
    });

    const srcIdx0 = session.getHintTargetIndex();
    const dstIdx0 = session.getHintDestinationIndex();
    expect(srcIdx0).not.toBeNull();
    expect(dstIdx0).not.toBeNull();
    expect(session.getHintTargetForLevel(2)).toEqual({
      kind: "slot",
      index: srcIdx0,
      toIndex: dstIdx0,
    });
    expect(session.getHintTarget()).toEqual(session.getHintTargetForLevel(2));

    const demoSteps = session.getHintDemoSequence(3);
    expect(demoSteps).not.toBeNull();
    expect(demoSteps?.length).toBe(3);

    const item2Idx = session.displayItems.findIndex(
      (it) => it.item_id === slot2.expected_item_id
    );
    const srcSlot2 = session.sourceSlots[item2Idx];
    const dstSlot2 = session.targetSlots[2];
    if (!(srcSlot2 && dstSlot2)) {
      throw new Error("Missing slot 2 positions");
    }
    session.toAction({
      type: "tap",
      x: dstSlot2.x,
      y: dstSlot2.y,
      timeMs: 10,
    });
    expect(session.getStagedSlotId()).toBe(slot2.slot_id);
    expect(session.getHintTargetForLevel(1)).toEqual({
      kind: "region",
      ids: [slot2.slot_id],
    });
    expect(session.getHintTargetForLevel(2)).toEqual({
      kind: "slot",
      index: session.slots.indexOf(srcSlot2),
      toIndex: session.slots.indexOf(dstSlot2),
    });

    session.toAction({
      type: "tap",
      x: dstSlot2.x,
      y: dstSlot2.y,
      timeMs: 15,
    });
    expect(session.getStagedSlotId()).toBeNull();

    session.toAction({
      type: "tap",
      x: srcSlot2.x,
      y: srcSlot2.y,
      timeMs: 20,
    });
    expect(session.getHintTargetForLevel(1)).toEqual({
      kind: "region",
      ids: [slot2.slot_id],
    });
    expect(session.getHintTargetForLevel(2)).toEqual({
      kind: "slot",
      index: session.slots.indexOf(srcSlot2),
      toIndex: session.slots.indexOf(dstSlot2),
    });

    session.commit({
      type: "place_item",
      data: { item_id: slot0.expected_item_id, slot_id: slot0.slot_id },
    });
    const slot1 = fixture.content.slots[1];
    if (slot1) {
      session.commit({
        type: "place_item",
        data: { item_id: slot1.expected_item_id, slot_id: slot1.slot_id },
      });
    }
    expect(session.getHintDemoSequence(3)).toBeNull();

    session.commit({
      type: "place_item",
      data: { item_id: slot2.expected_item_id, slot_id: slot2.slot_id },
    });
    expect(session.checkWinCondition()).toBe(true);
    expect(session.getHintTargetForLevel(1)).toBeNull();
    expect(session.getHintTargetForLevel(2)).toBeNull();
  });

  it("hỗ trợ revert_item kéo ngược về khay, tap-tap 2 chiều, chặn thả chồng vào ô đã đầy và không để HIT_TOL ô đã đầy nuốt ô trống kế bên (BR-E008-01/02)", () => {
    const session = buildSession(0);
    const slot0 = fixture.content.slots[0];
    const slot1 = fixture.content.slots[1];
    if (!(slot0 && slot1)) {
      throw new Error("Missing slots");
    }
    const target0 = session.targetSlots[0];
    const target1 = session.targetSlots[1];
    const item0Idx = session.displayItems.findIndex(
      (it) => it.item_id === slot0.expected_item_id
    );
    const item1Idx = session.displayItems.findIndex(
      (it) => it.item_id === slot1.expected_item_id
    );
    const source0 = session.sourceSlots[item0Idx];
    const source1 = session.sourceSlots[item1Idx];
    if (!(target0 && target1 && source0 && source1)) {
      throw new Error("Missing target or source slots");
    }

    expect(
      session.toAction({
        type: "tap",
        x: target0.x,
        y: target0.y,
        timeMs: 0,
      })
    ).toBeNull();
    expect(session.getStagedSlotId()).toBe(slot0.slot_id);

    const reverseTapAction = session.toAction({
      type: "tap",
      x: source0.x,
      y: source0.y,
      timeMs: 10,
    });
    expect(reverseTapAction).toEqual({
      type: "place_item",
      data: { item_id: slot0.expected_item_id, slot_id: slot0.slot_id },
    });
    if (reverseTapAction) {
      session.commit(reverseTapAction);
    }
    expect(session.placedSlots.get(slot0.slot_id)).toBe(slot0.expected_item_id);

    const dropOccupied = session.toAction({
      type: "drop",
      fromX: source1.x,
      fromY: source1.y,
      toX: target0.x,
      toY: target0.y,
      timeMs: 20,
    });
    expect(dropOccupied).toBeNull();

    const dropNeighborEmpty = session.toAction({
      type: "drop",
      fromX: source1.x,
      fromY: source1.y,
      toX: target1.x - 4,
      toY: target1.y,
      timeMs: 25,
    });
    expect(dropNeighborEmpty).toEqual({
      type: "place_item",
      data: { item_id: slot1.expected_item_id, slot_id: slot1.slot_id },
    });

    const revertAction = session.toAction({
      type: "drop",
      fromX: target0.x,
      fromY: target0.y,
      toX: source0.x,
      toY: source0.y,
      timeMs: 30,
    });
    expect(revertAction).toEqual({
      type: "revert_item",
      data: { slot_id: slot0.slot_id },
    });

    const revertVerdict = session.dispatch({
      type: "drop",
      fromX: target0.x,
      fromY: target0.y,
      toX: source0.x,
      toY: source0.y,
      timeMs: 40,
    });
    expect(revertVerdict?.valid).toBe(false);
    expect(revertVerdict?.feedback).toBe("none");
    expect(session.placedSlots.has(slot0.slot_id)).toBe(false);
    const entity0 = session
      .getView()
      .entities.find((e) => e.id === slot0.expected_item_id);
    expect(entity0?.state).toBe("idle");
  });

  it("xáo trộn khay tất định theo layoutSeed !== 0 và giữ thứ tự gốc khi layoutSeed === 0 (N7, BR-E008-04)", () => {
    const s0 = buildSession(0);
    const s1a = buildSession(7);
    const s1b = buildSession(7);
    const origIds = fixture.content.items.map((it) => it.item_id);

    expect(s0.displayItems.map((it) => it.item_id)).toEqual(origIds);
    expect(s1a.displayItems.map((it) => it.item_id)).toEqual(
      s1b.displayItems.map((it) => it.item_id)
    );
    expect([...s1a.displayItems.map((it) => it.item_id)].sort()).toEqual(
      [...origIds].sort()
    );
    expect(s1a.displayItems.map((it) => it.item_id)).not.toEqual(origIds);
  });

  it("allow_retry: false đóng vòng ngay sau lần đặt sai đầu tiên và chặn mọi cử chỉ tiếp theo", () => {
    const session = buildSession(0, { allow_retry: false });
    const slot0 = fixture.content.slots[0];
    const slot1 = fixture.content.slots[1];
    const source0 = session.sourceSlots[0];
    const target1 = session.targetSlots[1];
    if (!(slot0 && slot1 && source0 && target1)) {
      throw new Error("Missing slots");
    }

    session.commit({
      type: "place_item",
      data: { item_id: slot0.expected_item_id, slot_id: slot1.slot_id },
    });

    expect(session.getTelemetry().end_time_ms).toBeDefined();
    expect(session.isAcceptingInput()).toBe(false);
    expect(session.checkWinCondition()).toBe(false);
    expect(
      session.toAction({
        type: "drop",
        fromX: source0.x,
        fromY: source0.y,
        toX: target1.x,
        toY: target1.y,
        timeMs: 20,
      })
    ).toBeNull();
    expect(session.getHintTargetForLevel(1)).toBeNull();
    expect(session.getHintTargetForLevel(2)).toBeNull();
    expect(session.getHintDemoSequence(3)).toBeNull();
  });

  it("đặt sai lặp lại cùng một vật kích hoạt lại wrongFlash độc lập với timeMs của render() và phân biệt đủ 5 trạng thái qua >= 2 kênh phi-màu (BR-ERC-02)", () => {
    const session = buildSession(0);
    const slot0 = fixture.content.slots[0];
    const slot1 = fixture.content.slots[1];
    if (!(slot0 && slot1)) {
      throw new Error("Missing slots");
    }

    const ctx = createFakeCanvas(
      DEFAULT_LOGIC_SPACE.w,
      DEFAULT_LOGIC_SPACE.h
    ).getContext("2d");
    if (!isCanvas2D(ctx)) {
      throw new Error("Missing fake 2d context");
    }
    const rs = new RenderSystem();
    const retrySpy = vi.spyOn(rs, "drawRetryRing");

    session.commit({
      type: "place_item",
      data: { item_id: slot0.expected_item_id, slot_id: slot1.slot_id },
    });
    session.render(ctx, rs, 50_000);
    expect(retrySpy).toHaveBeenCalled();
    expect(
      session.getView().entities.find((e) => e.id === slot0.expected_item_id)
        ?.state
    ).toBe("incorrect");

    session.update(WRONG_FLASH_MS + 50);
    expect(
      session.getView().entities.find((e) => e.id === slot0.expected_item_id)
        ?.state
    ).toBe("idle");

    retrySpy.mockClear();
    session.commit({
      type: "place_item",
      data: { item_id: slot0.expected_item_id, slot_id: slot1.slot_id },
    });
    session.render(ctx, rs, 99_999);
    expect(retrySpy).toHaveBeenCalled();
    expect(
      session.getView().entities.find((e) => e.id === slot0.expected_item_id)
        ?.state
    ).toBe("incorrect");

    const item0 = fixture.content.items[0];
    if (!item0) {
      throw new Error("Missing item 0");
    }
    const idlePal = resolveGT008TokenPalette("idle");
    const touchPal = resolveGT008TokenPalette("touching");
    const selPal = resolveGT008TokenPalette("selected");
    const okPal = resolveGT008TokenPalette("correct");
    const errPal = resolveGT008TokenPalette("wrong");
    expect(
      new Set([
        idlePal.fill,
        touchPal.fill,
        selPal.fill,
        okPal.fill,
        errPal.fill,
      ]).size
    ).toBe(5);
    expect(selPal.lineWidth).toBeGreaterThan(idlePal.lineWidth);

    const idlePose = resolveGT008TokenPose(
      0,
      {
        item: item0,
        state: "idle",
        timeMs: 100,
        stagedElapsedMs: null,
        wrongProgress: null,
      },
      false
    );
    const touchPose = resolveGT008TokenPose(
      0,
      {
        item: item0,
        state: "touching",
        timeMs: 100,
        stagedElapsedMs: null,
        wrongProgress: null,
      },
      false
    );
    const selPose = resolveGT008TokenPose(
      0,
      {
        item: item0,
        state: "selected",
        timeMs: 100,
        stagedElapsedMs: 50,
        wrongProgress: null,
      },
      false
    );
    const errPose = resolveGT008TokenPose(
      0,
      {
        item: item0,
        state: "wrong",
        timeMs: 100,
        stagedElapsedMs: null,
        wrongProgress: 0.3,
      },
      false
    );
    expect(touchPose.scale).toBeLessThan(idlePose.scale);
    expect(touchPose.offsetY).toBeGreaterThan(idlePose.offsetY);
    expect(selPose.scale).toBeGreaterThan(idlePose.scale);
    expect(selPose.offsetY).toBeLessThan(idlePose.offsetY);
    expect(Math.abs(errPose.offsetX)).toBeGreaterThan(0);

    const rmPose = resolveGT008TokenPose(
      0,
      {
        item: item0,
        state: "wrong",
        timeMs: 100,
        stagedElapsedMs: null,
        wrongProgress: 0.3,
      },
      true
    );
    expect(rmPose.offsetX).toBe(0);
  });

  it("render() thuần 100% và vẽ được cả asset emoji lẫn audio mà không xuất hiện chữ cái trên canvas (BR-E008-05)", () => {
    const session = buildSession(1);
    const ctx = createFakeCanvas(
      DEFAULT_LOGIC_SPACE.w,
      DEFAULT_LOGIC_SPACE.h
    ).getContext("2d");
    if (!isCanvas2D(ctx)) {
      throw new Error("Missing fake 2d context");
    }
    const rs = new RenderSystem();
    const viewBefore = session.getView();
    session.render(ctx, rs, 240);
    const viewAfter = session.getView();
    expect(viewAfter).toEqual(viewBefore);

    const slot0 = session.targetSlots[0];
    const def0 = fixture.content.slots[0];
    const item0 = fixture.content.items[0];
    if (!(slot0 && def0 && item0)) {
      throw new Error("Missing slot0/def0/item0");
    }
    drawGT008InsetBoard(ctx, rs, { x: 20, y: 20, w: 200, h: 100 });
    drawGT008TargetWell(ctx, rs, slot0, {
      slotDef: def0,
      expectedItem: item0,
      placedItem: undefined,
      breath: 1,
      isReceiving: false,
      isStagedTarget: false,
      isHighlightedEmpty: false,
      wrongProgress: null,
      popElapsedMs: null,
    });
    drawGT008SourceToken(ctx, rs, slot0, {
      item: item0,
      state: "idle",
      timeMs: 100,
      stagedElapsedMs: null,
      wrongProgress: null,
      assetOverride: { kind: "audio", path: "/sfx/bell-1.mp3" },
    });
    expect(
      lettersOnly(collectRenderedText(session, { prepare: false }))
    ).toEqual([]);
  });
});
