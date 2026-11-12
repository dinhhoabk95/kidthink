import { describe, expect, it, vi } from "vitest";
import { DEFAULT_LOGIC_SPACE } from "#src/layout/constants";
import { TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import { computeStageZones } from "#src/layout/stage-zones";
import { setContextGeneration } from "#src/render/cache";
import { drawGT005PairCard } from "#src/render/gt-005-shapes";
import { RenderSystem } from "#src/systems/render-system";
import { GT005_FIXTURES } from "#src/templates/GT-005/fixtures";
import { GT005Session } from "#src/templates/GT-005/session";
import type { GT005Content } from "#src/templates/GT-005/template";
import { createFakeCanvas } from "../gates/fake-canvas.ts";
import { collectRenderedText, lettersOnly } from "../helpers/rendered-text.ts";

function getFixture() {
  const fixture = GT005_FIXTURES[0];
  if (!fixture) {
    throw new Error("Missing GT-005 fixture");
  }
  return fixture;
}

function buildStageSession(
  content?: GT005Content,
  overrides?: Partial<{
    readonly allow_retry: boolean;
    readonly shuffle_sides: boolean;
    readonly seed: number;
  }>
): GT005Session {
  const fixture = getFixture();
  const zones = computeStageZones({
    logicW: DEFAULT_LOGIC_SPACE.w,
    logicH: DEFAULT_LOGIC_SPACE.h,
    ageBand: "4-5",
    cssPerLogic: 1,
    needsTray: false,
    needsCommit: false,
  });
  const session = new GT005Session(
    content ?? fixture.content,
    {
      ...fixture.difficulty,
      allow_retry: overrides?.allow_retry ?? true,
      shuffle_sides: overrides?.shuffle_sides ?? false,
    },
    overrides?.seed ?? 1
  );
  session.prepareRound("4-5", DEFAULT_LOGIC_SPACE, zones.stage);
  return session;
}

describe("GT-005 — ghép cặp (pair-match): tương tác 2 chiều, tương đương thị giác, render thuần", () => {
  const fixture = getFixture();

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

  it("tap-tap hai chiều (Phải -> Trái), chạm lại để bỏ chọn, chạm thẻ khác cùng bên để đổi chọn và kéo thả Phải -> Trái", () => {
    const session = buildStageSession();
    const left0 = session.sourceSlots[0];
    const left1 = session.sourceSlots[1];
    const right0 = session.targetSlots[0];
    const right1 = session.targetSlots[1];
    if (!(left0 && left1 && right0 && right1)) {
      throw new Error("Missing slots");
    }

    // 1. Chạm thẻ Phải 0 -> chọn Phải 0
    session.dispatch({ type: "tap", x: right0.x, y: right0.y, timeMs: 10 });
    expect(session.getStagedRightId()).toBe("banana");
    expect(session.getStagedLeftId()).toBeNull();
    expect(
      session.getView().entities.find((e) => e.id === "banana")?.state
    ).toBe("selected");
    // Hint khi đang chọn Phải 0 phải trỏ về Trái 0 (toIndex không có)
    expect(session.getHintTarget()).toEqual({ kind: "slot", index: 0 });

    // 2. Chạm lại chính thẻ Phải 0 -> bỏ chọn
    session.dispatch({ type: "tap", x: right0.x, y: right0.y, timeMs: 20 });
    expect(session.getStagedRightId()).toBeNull();

    // 3. Chạm Phải 0 rồi đổi ý sang Phải 1 -> nối về Trái 1
    session.dispatch({ type: "tap", x: right0.x, y: right0.y, timeMs: 30 });
    session.dispatch({ type: "tap", x: right1.x, y: right1.y, timeMs: 40 });
    expect(session.getStagedRightId()).toBe("carrot");
    const verdict = session.dispatch({
      type: "tap",
      x: left1.x,
      y: left1.y,
      timeMs: 50,
    });
    expect(verdict?.valid).toBe(true);
    expect(session.getMatchedPairs().get("rabbit")).toBe("carrot");
    expect(session.getStagedRightId()).toBeNull();

    // 4. Kéo thả từ Phải 0 sang Trái 0
    const dropVerdict = session.dispatch({
      type: "drop",
      fromX: right0.x,
      fromY: right0.y,
      toX: left0.x,
      toY: left0.y,
      timeMs: 60,
    });
    expect(dropVerdict?.valid).toBe(true);
    expect(session.checkWinCondition()).toBe(true);
  });

  it("getView() gán spokenLabel tiếng Việt và cô lập nháy sai theo cột khi left.item_id === right.item_id", () => {
    const dbStyleContent: GT005Content = {
      ...fixture.content,
      pairs: [
        {
          pair_id: "p1",
          left: { item_id: "n1", asset: { kind: "emoji", ref: "🐵" } },
          right: { item_id: "n1", asset: { kind: "emoji", ref: "🍌" } },
        },
        {
          pair_id: "p2",
          left: { item_id: "n2", asset: { kind: "emoji", ref: "🐰" } },
          right: { item_id: "n2", asset: { kind: "emoji", ref: "🥕" } },
        },
      ],
    };
    const session = buildStageSession(dbStyleContent);

    const view = session.getView();
    const ids = view.entities.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const entity of view.entities) {
      expect(entity.spokenLabel).toBeTruthy();
    }

    // Nối sai left:n1 với right:n2 -> chỉ left:n1 và right:n2 là incorrect; left:n2 và right:n1 vẫn idle
    const left0 = session.sourceSlots[0];
    const right1 = session.targetSlots[1];
    if (!(left0 && right1)) {
      throw new Error("Missing slots");
    }
    const res = session.dispatch({
      type: "drop",
      fromX: left0.x,
      fromY: left0.y,
      toX: right1.x,
      toY: right1.y,
      timeMs: 100,
    });
    expect(res?.valid).toBe(false);
    expect(res?.feedback).toBe("amber_soft");

    const afterMismatch = session.getView().entities;
    expect(afterMismatch.find((e) => e.id === "n1")?.state).toBe("incorrect");
    expect(afterMismatch.find((e) => e.id === "right:n2")?.state).toBe(
      "incorrect"
    );
    expect(afterMismatch.find((e) => e.id === "n2")?.state).toBe("idle");
    expect(afterMismatch.find((e) => e.id === "right:n1")?.state).toBe("idle");
  });

  it("chấp nhận nối chéo khi hai cặp có vế giống hệt nhau về thị giác và cập nhật activePairs bảo toàn 1-1", () => {
    const twinContent: GT005Content = {
      prompt: "Ghép bánh kem giống nhau",
      pairs: [
        {
          pair_id: "p1",
          left: { item_id: "cupcake_l1", asset: { kind: "emoji", ref: "🧁" } },
          right: { item_id: "cupcake_r1", asset: { kind: "emoji", ref: "🧁" } },
        },
        {
          pair_id: "p2",
          left: { item_id: "cupcake_l2", asset: { kind: "emoji", ref: "🧁" } },
          right: { item_id: "cupcake_r2", asset: { kind: "emoji", ref: "🧁" } },
        },
        {
          pair_id: "p3",
          left: { item_id: "cookie_l3", asset: { kind: "emoji", ref: "🍪" } },
          right: { item_id: "cookie_r3", asset: { kind: "emoji", ref: "🍪" } },
        },
      ],
    };
    const session = buildStageSession(twinContent);

    // Nối chéo cupcake_l1 với cupcake_r2 (cùng hình 🧁) -> phải hợp lệ!
    const crossAction = {
      type: "match_pair",
      data: { left_item_id: "cupcake_l1", right_item_id: "cupcake_r2" },
    };
    expect(session.validateAction(crossAction).valid).toBe(true);
    session.commit(crossAction);
    expect(session.getMatchedPairs().get("cupcake_l1")).toBe("cupcake_r2");

    // Hint tiếp theo cho cupcake_l2 (index 1) phải trỏ tới cupcake_r1 (index 3 + 0 = 3)
    expect(session.getHintTarget()).toEqual({
      kind: "slot",
      index: 1,
      toIndex: 3,
    });

    // Nối cặp còn lại cupcake_l2 với cupcake_r1 và cookie_l3 với cookie_r3 -> thắng trọn vẹn
    const remainAction = {
      type: "match_pair",
      data: { left_item_id: "cupcake_l2", right_item_id: "cupcake_r1" },
    };
    expect(session.validateAction(remainAction).valid).toBe(true);
    session.commit(remainAction);
    session.commit({
      type: "match_pair",
      data: { left_item_id: "cookie_l3", right_item_id: "cookie_r3" },
    });
    expect(session.checkWinCondition()).toBe(true);
  });

  it("WrongFlashMap (450ms): chạm thẻ đang nháy xoá ngay wrong sang selected; allow_retry: false đóng lượt khi nối sai", () => {
    const session = buildStageSession(undefined, { allow_retry: true });
    const left0 = session.sourceSlots[0];
    const right1 = session.targetSlots[1];
    if (!(left0 && right1)) {
      throw new Error("Missing slots");
    }

    // Ghép sai -> nháy 450ms
    session.dispatch({
      type: "drop",
      fromX: left0.x,
      fromY: left0.y,
      toX: right1.x,
      toY: right1.y,
      timeMs: 0,
    });
    expect(
      session.getView().entities.find((e) => e.id === "monkey")?.state
    ).toBe("incorrect");

    // Chạm vào thẻ đang nháy ở 100ms -> xoá ngay incorrect sang selected
    session.update(100);
    session.dispatch({ type: "tap", x: left0.x, y: left0.y, timeMs: 100 });
    expect(
      session.getView().entities.find((e) => e.id === "monkey")?.state
    ).toBe("selected");
    expect(
      session.getView().entities.find((e) => e.id === "carrot")?.state
    ).toBe("incorrect");

    // Sau đủ 450ms, thẻ phải cũng hết nháy
    session.update(400);
    expect(
      session.getView().entities.find((e) => e.id === "carrot")?.state
    ).toBe("idle");

    // Kiểm tra allow_retry: false
    const strictContent: GT005Content = {
      prompt: "Ghép không thử lại",
      pairs: [
        ...fixture.content.pairs,
        {
          pair_id: "pair_3",
          left: { item_id: "cat", asset: { kind: "emoji", ref: "🐱" } },
          right: { item_id: "fish", asset: { kind: "emoji", ref: "🐟" } },
        },
      ],
    };
    const strictSession = buildStageSession(strictContent, {
      allow_retry: false,
    });
    // Đúng cặp 1
    strictSession.commit({
      type: "match_pair",
      data: { left_item_id: "monkey", right_item_id: "banana" },
    });
    expect(strictSession.isAcceptingInput()).toBe(true);
    // Ghép lại cặp đã nối đúng trả ACTION_IGNORED
    expect(
      strictSession.validateAction({
        type: "match_pair",
        data: { left_item_id: "monkey", right_item_id: "banana" },
      }).feedback
    ).toBe("none");

    // Sai cặp 2 -> khoá lượt ngay
    strictSession.commit({
      type: "match_pair",
      data: { left_item_id: "rabbit", right_item_id: "fish" },
    });
    expect(strictSession.isAcceptingInput()).toBe(false);
    expect(strictSession.checkWinCondition()).toBe(false);
    expect(strictSession.getMatchedPairs().get("monkey")).toBe("banana");
    expect(strictSession.getHintTargetIndex()).toBeNull();
    expect(strictSession.getHintDestinationIndex()).toBeNull();
    expect(strictSession.getHintTarget()).toBeNull();
    expect(
      strictSession.dispatch({
        type: "tap",
        x: left0.x,
        y: left0.y,
        timeMs: 500,
      })?.feedback
    ).toBe("none");
  });

  it("shuffle_sides: true đảm bảo derangement tương đối (không xếp thẳng hàng 100% ở mọi seed)", () => {
    for (let seed = 0; seed < 30; seed++) {
      const session = buildStageSession(undefined, {
        shuffle_sides: true,
        seed,
      });
      const allAligned = session.displayLeft.every((leftItem, idx) => {
        const rightItem = session.displayRight[idx];
        return fixture.content.pairs.some(
          (p) =>
            p.left.item_id === leftItem.item_id &&
            p.right.item_id === rightItem?.item_id
        );
      });
      expect(allAligned).toBe(false);
    }
  });

  it("render() thuần 100%, vẽ đủ 5 trạng thái + dây xem trước + audio icon + cache gradient 60 frames", () => {
    const richContent: GT005Content = {
      prompt: "Ghép đa phương tiện",
      pairs: [
        {
          pair_id: "p1",
          left: {
            item_id: "aud_1",
            asset: {
              kind: "emoji",
              ref: "🐱",
              audio_path: "/audio/vi/sound_cat.mp3",
            },
          },
          right: { item_id: "emj_1", asset: { kind: "emoji", ref: "🐱" } },
        },
        {
          pair_id: "p2",
          left: {
            item_id: "img_2",
            asset: { kind: "image", path: "/images/dog.png" },
          },
          right: { item_id: "emj_2", asset: { kind: "emoji", ref: "🐶" } },
        },
        {
          pair_id: "p3",
          left: { item_id: "emj_3", asset: { kind: "emoji", ref: "🐮" } },
          right: { item_id: "emj_3_r", asset: { kind: "emoji", ref: "🥛" } },
        },
      ],
    };
    const session = buildStageSession(richContent);
    const rs = new RenderSystem();
    const canvas = createFakeCanvas(960, 540);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Missing 2d context");
    }
    setContextGeneration(ctx as CanvasRenderingContext2D, 1);

    // Kiểm tra độ thuần render() trên thực thể session
    const snapshotBefore = JSON.stringify(Object.entries(session));
    session.render(ctx as CanvasRenderingContext2D, rs, 100);
    const snapshotAfter = JSON.stringify(Object.entries(session));
    expect(snapshotAfter).toBe(snapshotBefore);

    // Không vẽ chuỗi đường dẫn audio lên canvas
    const drawnLetters = lettersOnly(
      collectRenderedText(session, { prepare: false })
    );
    expect(drawnLetters).toEqual([]);

    // Kích hoạt đủ các trạng thái: correct (p1), wrong (p2+p3), selected (p2), touching + preview rope
    session.commit({
      type: "match_pair",
      data: { left_item_id: "aud_1", right_item_id: "emj_1" },
    });
    session.commit({
      type: "match_pair",
      data: { left_item_id: "img_2", right_item_id: "emj_3_r" },
    });
    const left1 = session.sourceSlots[1];
    const right2 = session.targetSlots[2];
    if (!(left1 && right2)) {
      throw new Error("Missing slots");
    }
    session.dispatch({ type: "tap", x: left1.x, y: left1.y, timeMs: 120 });
    session.setPointerOver(right2.x, right2.y);

    const radialSpy = vi.spyOn(ctx, "createRadialGradient");
    for (let frameIdx = 0; frameIdx < 60; frameIdx++) {
      session.render(ctx as CanvasRenderingContext2D, rs, 120 + frameIdx * 16);
    }
    expect(radialSpy.mock.calls.length).toBeLessThanOrEqual(2);

    // Kiểm tra reducedMotion, degradation và vẽ trực tiếp thẻ audio icon
    rs.reducedMotion = true;
    session.degradation = {
      particles_enabled: false,
      soft_shadows_enabled: false,
      touch_target_size_degraded: false,
      audio_channel_degraded: false,
      font_size_degraded: false,
    };
    drawGT005PairCard(ctx as CanvasRenderingContext2D, rs, left1, {
      id: "aud_direct",
      asset: { kind: "audio", path: "/audio/vi/sound_cat.mp3" },
      state: "idle",
      timeMs: 1200,
      stagedAtMs: null,
      matchedAtMs: null,
      wrongProgress: null,
      accentColor: null,
      anchorSide: "right",
      stageRect: session.stageRect,
    });
    session.clearPointerOver();
    session.render(ctx as CanvasRenderingContext2D, rs, 1200);
  });
});
