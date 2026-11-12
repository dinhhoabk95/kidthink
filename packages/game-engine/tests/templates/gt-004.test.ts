import { describe, expect, it, vi } from "vitest";
import { ACTION_IGNORED } from "#src/game-session";
import { GT004Generator } from "#src/generators/gt004";
import { TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import { computeStageZones } from "#src/layout/stage-zones";
import { sortTrayGeometry } from "#src/render/container-shapes";
import { createRng } from "#src/rng/mulberry32";
import { RenderSystem } from "#src/systems/render-system";
import { WRONG_FLASH_MS } from "#src/systems/wrong-flash";
import { GT004_FIXTURES } from "#src/templates/GT-004/fixtures";
import {
  computeGT004PlacedChips,
  resolveGT004GroupLabel,
  resolveGT004GroupTheme,
  resolveGT004SourcePose,
  trayPopScale,
  trayShakeOffset,
} from "#src/templates/GT-004/layout";
import { GT004Session } from "#src/templates/GT-004/session";
import { collectRenderedText } from "#tests/helpers/rendered-text";

function getFirstFixture() {
  const fixture = GT004_FIXTURES[0];
  if (!fixture) {
    throw new Error("GT004_FIXTURES[0] must exist");
  }
  return fixture;
}

function createPreparedSession(
  allowRetry = true,
  seed = 3
): {
  readonly session: GT004Session;
  readonly fixture: ReturnType<typeof getFirstFixture>;
} {
  const fixture = getFirstFixture();
  const session = new GT004Session(
    fixture.content,
    { ...fixture.difficulty, allow_retry: allowRetry },
    seed
  );
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
  return { session, fixture };
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

  it("bỏ qua vật đã phân loại khi chạm lại ô cũ, bật trạng thái incorrect tạm thời WRONG_FLASH_MS (400ms) trên cả vật nguồn lẫn rổ nhóm khi thả nhầm, và hoàn thành bằng cả kéo-thả lẫn chạm-chạm", () => {
    const { session, fixture } = createPreparedSession(true, 3);

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

    // Thả nhầm rổ -> trả về valid: false, trạng thái incorrect tạm thời WRONG_FLASH_MS (400ms) cho cả vật và rổ
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
    expect(
      session.getView().entities.find((e) => e.id === wrongTarget.id)?.state
    ).toBe("incorrect");

    session.update(WRONG_FLASH_MS - 1);
    expect(
      session.getView().entities.find((e) => e.id === firstSource.id)?.state
    ).toBe("incorrect");
    expect(
      session.getView().entities.find((e) => e.id === wrongTarget.id)?.state
    ).toBe("incorrect");
    session.update(1);
    expect(
      session.getView().entities.find((e) => e.id === firstSource.id)?.state
    ).toBe("idle");
    expect(
      session.getView().entities.find((e) => e.id === wrongTarget.id)?.state
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
    expect(session.isAcceptingInput()).toBe(false);
  });

  it("render() thuần 100% (BR-ERC-02): gọi render với timeMs lớn không làm trôi đồng hồ logic hay tắt sớm wrongFlashes", () => {
    const { session, fixture } = createPreparedSession(true, 1);
    const [firstItem] = fixture.content.items;
    const wrongGroup = fixture.content.groups.find(
      (g) => g.group_id !== firstItem?.correct_group_id
    );
    if (!(firstItem && wrongGroup)) {
      throw new Error("Missing fixture item or wrong group");
    }

    session.commit({
      type: "sort_item",
      data: { item_id: firstItem.item_id, group_id: wrongGroup.group_id },
    });
    expect(
      session.getView().entities.find((e) => e.id === firstItem.item_id)?.state
    ).toBe("incorrect");

    const retrySpy = vi.spyOn(RenderSystem.prototype, "drawRetryRing");

    // Gọi render ở timeMs rất lớn mà chưa gọi update(deltaMs)
    collectRenderedText(session, { prepare: false, timeMs: 500_000 });
    expect(retrySpy).toHaveBeenCalled();
    retrySpy.mockRestore();

    // Trạng thái logic vẫn còn incorrect cho tới khi update(WRONG_FLASH_MS) chạy
    expect(
      session.getView().entities.find((e) => e.id === firstItem.item_id)?.state
    ).toBe("incorrect");
    expect(
      session.getView().entities.find((e) => e.id === wrongGroup.group_id)
        ?.state
    ).toBe("incorrect");

    session.update(WRONG_FLASH_MS);
    expect(
      session.getView().entities.find((e) => e.id === firstItem.item_id)?.state
    ).toBe("idle");
    expect(
      session.getView().entities.find((e) => e.id === wrongGroup.group_id)
        ?.state
    ).toBe("idle");
  });

  it("chạm lại vật đang chớp wrong sẽ xoá ngay chớp sai và chuyển vật sang selected", () => {
    const { session, fixture } = createPreparedSession(true, 2);
    const view = session.getView();
    const firstSource = view.entities.find((e) => e.role === "source");
    if (!firstSource) {
      throw new Error("Missing source entity");
    }
    const itemDef = fixture.content.items.find(
      (i) => i.item_id === firstSource.id
    );
    const wrongGroup = fixture.content.groups.find(
      (g) => g.group_id !== itemDef?.correct_group_id
    );
    if (!(itemDef && wrongGroup)) {
      throw new Error("Missing item or wrong group");
    }

    session.commit({
      type: "sort_item",
      data: { item_id: firstSource.id, group_id: wrongGroup.group_id },
    });
    expect(
      session.getView().entities.find((e) => e.id === firstSource.id)?.state
    ).toBe("incorrect");

    session.dispatch({
      type: "tap",
      x: firstSource.x,
      y: firstSource.y,
      timeMs: 25,
    });
    expect(session.getStagedItemId()).toBe(firstSource.id);
    expect(
      session.getView().entities.find((e) => e.id === firstSource.id)?.state
    ).toBe("selected");
  });

  it("allow_retry === false: xếp sai 1 lần đóng vòng ngay, giữ nguyên các vật đã xếp đúng trước đó và khoá mọi tương tác tiếp theo", () => {
    const { session, fixture } = createPreparedSession(false, 4);
    const [firstItem, secondItem] = fixture.content.items;
    if (!(firstItem && secondItem)) {
      throw new Error("Missing items");
    }
    const wrongGroupForSecond = fixture.content.groups.find(
      (g) => g.group_id !== secondItem.correct_group_id
    );
    if (!wrongGroupForSecond) {
      throw new Error("Missing wrong group");
    }

    // Xếp đúng vật thứ nhất
    session.commit({
      type: "sort_item",
      data: {
        item_id: firstItem.item_id,
        group_id: firstItem.correct_group_id,
      },
    });
    expect(session.getPlacements().get(firstItem.item_id)).toBe(
      firstItem.correct_group_id
    );
    expect(session.isAcceptingInput()).toBe(true);

    // Xếp sai vật thứ hai khi allow_retry = false -> đóng vòng
    session.commit({
      type: "sort_item",
      data: {
        item_id: secondItem.item_id,
        group_id: wrongGroupForSecond.group_id,
      },
    });

    expect(session.isAcceptingInput()).toBe(false);
    expect(session.checkWinCondition()).toBe(false);
    // Vật thứ nhất đã xếp đúng vẫn được giữ nguyên (Spec §5 Nhánh 2)
    expect(session.getPlacements().get(firstItem.item_id)).toBe(
      firstItem.correct_group_id
    );
    expect(session.getPlacements().has(secondItem.item_id)).toBe(false);
    expect(
      session
        .getTelemetry()
        .events.some((e) => e.event_name === "game_completed")
    ).toBe(true);

    // Mọi thao tác tiếp theo đều bị từ chối
    expect(
      session.validateAction({
        type: "sort_item",
        data: {
          item_id: secondItem.item_id,
          group_id: secondItem.correct_group_id,
        },
      })
    ).toEqual(ACTION_IGNORED);
    const srcEntity = session
      .getView()
      .entities.find((e) => e.id === secondItem.item_id);
    expect(
      session.dispatch({
        type: "tap",
        x: srcEntity?.x ?? 0,
        y: srcEntity?.y ?? 0,
        timeMs: 100,
      })
    ).toEqual(ACTION_IGNORED);
    expect(session.getHintTarget()).toBeNull();
    expect(session.getHintTargetForLevel(1)).toBeNull();
  });

  it("hỗ trợ trạng thái touching và hovered cho rổ đích qua setTouchingItem / setPointerOver / clearPointerOver và đánh dấu rổ 'correct' ngay khi nhận đủ vật của nhóm", () => {
    const { session, fixture } = createPreparedSession(true, 0);
    const view = session.getView();
    const firstSource = view.entities.find((e) => e.role === "source");
    const firstTarget = view.entities.find((e) => e.role === "target");
    if (!(firstSource && firstTarget)) {
      throw new Error("Missing entities");
    }

    session.setTouchingItem(firstSource.id);
    expect(session.getTouchingItemId()).toBe(firstSource.id);
    expect(
      session.getView().entities.find((e) => e.id === firstSource.id)?.state
    ).toBe("active");

    session.setPointerOver(firstTarget.x, firstTarget.y);
    expect(session.getHoveredGroupId()).toBe(firstTarget.id);
    expect(
      session.getView().entities.find((e) => e.id === firstTarget.id)?.state
    ).toBe("selected");

    session.clearPointerOver();
    expect(session.getHoveredGroupId()).toBeNull();
    expect(session.getTouchingItemId()).toBeNull();

    // Xếp toàn bộ vật thuộc nhóm đầu tiên -> nhóm đầu tiên chuyển sang state 'correct' dù nhóm thứ hai chưa xong
    const firstGroupId = firstTarget.id;
    const itemsOfFirstGroup = fixture.content.items.filter(
      (i) => i.correct_group_id === firstGroupId
    );
    for (const item of itemsOfFirstGroup) {
      session.commit({
        type: "sort_item",
        data: { item_id: item.item_id, group_id: firstGroupId },
      });
    }
    expect(session.checkWinCondition()).toBe(false);
    expect(
      session.getView().entities.find((e) => e.id === firstGroupId)?.state
    ).toBe("correct");
  });

  it("thang gợi ý L1/L2/L3 (Spec §4 N5): L1 chỉ nguồn khi chưa cầm vật, chỉ đúng rổ đích khi đang chọn vật, L2/L3 kéo từ nguồn tới rổ đúng", () => {
    const { session, fixture } = createPreparedSession(true, 0);
    const srcIdx = session.getHintTargetIndex();
    const destIdx = session.getHintDestinationIndex();
    expect(srcIdx).not.toBeNull();
    expect(destIdx).not.toBeNull();

    // Khi chưa chọn vật: L1 chỉ vào vật nguồn, L2/L3 kéo từ nguồn tới đích
    expect(session.getHintTargetForLevel(1)).toEqual({
      kind: "slot",
      index: srcIdx,
    });
    expect(session.getHintTargetForLevel(2)).toEqual({
      kind: "slot",
      index: srcIdx,
      toIndex: destIdx ?? undefined,
    });
    expect(session.getHintTargetForLevel(3)).toEqual({
      kind: "slot",
      index: srcIdx,
      toIndex: destIdx ?? undefined,
    });

    // Khi trẻ chọn (stage) một vật ở cuối khay: L1 sáng nhẹ đúng rổ đích của vật đang cầm
    const lastItem = session.displayItems.at(-1);
    if (!lastItem) {
      throw new Error("Missing last display item");
    }
    session.stageItem(lastItem.item_id);
    const expectedGroupIdx = fixture.content.groups.findIndex(
      (g) => g.group_id === lastItem.correct_group_id
    );
    const expectedTargetSlot = session.targetSlots[expectedGroupIdx];
    const expectedDestSlotIdx = expectedTargetSlot
      ? session.slots.indexOf(expectedTargetSlot)
      : -1;

    expect(session.getHintTargetIndex()).toBe(session.displayItems.length - 1);
    expect(session.getHintDestinationIndex()).toBe(expectedDestSlotIdx);
    expect(session.getHintTargetForLevel(1)).toEqual({
      kind: "slot",
      index: expectedDestSlotIdx,
    });
    expect(session.getHintTargetForLevel(2)).toEqual({
      kind: "slot",
      index: session.displayItems.length - 1,
      toIndex: expectedDestSlotIdx,
    });
  });

  it("bảng màu 4 nhóm phân biệt rõ kèm chấm phi màu 1..4, chip đã xếp nằm gọn khoang trên, và tôn trọng reducedMotion", () => {
    const themes = [0, 1, 2, 3].map((i) => resolveGT004GroupTheme(i));
    const rims = new Set(themes.map((t) => t.rim));
    const dots = themes.map((t) => t.dotCount);
    expect(rims.size).toBe(4);
    expect(dots).toEqual([1, 2, 3, 4]);

    expect(resolveGT004GroupLabel("  ", "🍎", 0)).toBeTruthy();
    expect(resolveGT004GroupLabel("", "", 2)).toBe("Nhóm 3");

    const { session } = createPreparedSession(true, 0);
    const targetSlot = session.targetSlots[0];
    if (!targetSlot) {
      throw new Error("Missing target slot");
    }
    const geom = sortTrayGeometry(targetSlot);
    const chips = computeGT004PlacedChips(targetSlot, geom, 4, 0);
    expect(chips).toHaveLength(4);
    for (const chip of chips) {
      expect(chip.cy - chip.r).toBeGreaterThanOrEqual(geom.body.y);
      expect(chip.cy + chip.r).toBeLessThanOrEqual(geom.front.y);
    }

    // Kiểm tra tôn trọng reducedMotion cho shake, pop và token pose
    expect(trayShakeOffset(120, false)).not.toBe(0);
    expect(trayShakeOffset(120, true)).toBe(0);
    expect(trayPopScale(100, false)).toBeGreaterThan(1);
    expect(trayPopScale(100, true)).toBe(1);
    expect(
      resolveGT004SourcePose({
        state: "touching",
        slotIndex: 0,
        timeMs: 100,
        stagedAtMs: null,
        wrongProgress: null,
        reducedMotion: true,
      }).scale
    ).toBe(1);
  });

  it("GT004Generator sinh item_count khớp chính xác với số lượng items trong content_pack", () => {
    const generated = GT004Generator.generate({
      rng: createRng(42),
      age_band: "4-5",
      what: "classification",
      theme: "animals",
      vocabulary: {
        theme: "animals",
        label_vi: "Động vật",
        icon_emoji_ref: "🐶",
        nouns: [
          { label_vi: "Chó", emoji_ref: "🐶" },
          { label_vi: "Mèo", emoji_ref: "🐱" },
          { label_vi: "Thỏ", emoji_ref: "🐰" },
          { label_vi: "Gấu", emoji_ref: "🐻" },
          { label_vi: "Gấu trúc", emoji_ref: "🐼" },
          { label_vi: "Cáo", emoji_ref: "🦊" },
        ],
        contrast: {
          theme: "fruits",
          label_vi: "Trái cây",
          icon_emoji_ref: "🍎",
          nouns: [
            { label_vi: "Táo", emoji_ref: "🍎" },
            { label_vi: "Chuối", emoji_ref: "🍌" },
          ],
        },
      },
    });
    expect(generated.difficulty_params.item_count).toBe(
      generated.content_pack.items.length
    );
  });
});
