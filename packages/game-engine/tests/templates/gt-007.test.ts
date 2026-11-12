import { describe, expect, it, vi } from "vitest";
import { GT007Generator } from "#src/generators/gt007";
import { DEFAULT_LOGIC_SPACE } from "#src/layout/constants";
import { TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import { computeStageZones } from "#src/layout/stage-zones";
import { deriveStream } from "#src/rng/mulberry32";
import { RenderSystem } from "#src/systems/render-system";
import { WRONG_FLASH_MS } from "#src/systems/wrong-flash";
import { GT007_FIXTURES } from "#src/templates/GT-007/fixtures";
import { GT007Session } from "#src/templates/GT-007/session";
import {
  type GT007Content,
  GT007ContentSchema,
  type GT007Difficulty,
  GT007DifficultySchema,
} from "#src/templates/GT-007/template";
import { findDrawsOutsideStage } from "#tests/layout/stage-checks";

function getFixture() {
  const fixture = GT007_FIXTURES[0];
  if (!fixture) {
    throw new Error("Missing GT-007 fixture");
  }
  return fixture;
}

describe("GT-007 — tách gộp số (number-bond): hit-test, spokenLabel, retry state", () => {
  const fixture = getFixture();

  function buildSession(): GT007Session {
    const zones = computeStageZones({
      logicW: DEFAULT_LOGIC_SPACE.w,
      logicH: DEFAULT_LOGIC_SPACE.h,
      ageBand: "4-5",
      cssPerLogic: 1,
      needsTray: true,
      needsCommit: false,
    });
    const session = new GT007Session(fixture.content, fixture.difficulty, 1);
    session.prepareRound(
      "4-5",
      DEFAULT_LOGIC_SPACE,
      zones.stage,
      zones.tray ?? undefined
    );
    return session;
  }

  it("chạm lệch mép trong dung sai TAP_TOLERANCE_PX (24px) chọn được lựa chọn và điền vào ô phần khuyết", () => {
    const session = buildSession();
    const correctIdx = fixture.content.options.findIndex((o) => o.is_correct);
    const optSlot = session.sourceSlots[correctIdx];
    const targetPartIdx = fixture.content.parts.findIndex((p) => p.is_target);
    const partSlot = session.targetSlots[targetPartIdx + 1];
    if (!(optSlot && partSlot)) {
      throw new Error("Missing option or part slot");
    }

    const optOffset = optSlot.hitH / 2 + TAP_TOLERANCE_PX - 4;
    expect(
      session.toAction({
        type: "tap",
        x: optSlot.x,
        y: optSlot.y + optOffset,
        timeMs: 0,
      })
    ).toBeNull();
    expect(session.getStagedOptionId()).toBe(
      fixture.content.options[correctIdx]?.id
    );

    const partOffset = partSlot.hitH / 2 + TAP_TOLERANCE_PX - 4;
    const action = session.toAction({
      type: "tap",
      x: partSlot.x,
      y: partSlot.y + partOffset,
      timeMs: 10,
    });
    expect(action).toEqual({
      type: "fill_part",
      data: {
        option_id: fixture.content.options[correctIdx]?.id,
        part_id: fixture.content.parts[targetPartIdx]?.id,
      },
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

  it("getView() gán spokenLabel, hitShape và kích thước vùng chạm khớp slot cho ô tổng, ô phần và các lựa chọn", () => {
    const session = buildSession();
    const view = session.getView();
    const ids = view.entities.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);

    const targetPart = fixture.content.parts.find((p) => p.is_target);
    const targetEntity = view.entities.find((e) => e.id === targetPart?.id);
    expect(targetEntity?.spokenLabel).toBe("Ô trống");

    for (const entity of view.entities) {
      expect(entity.spokenLabel).toBeTruthy();
      expect(entity.hitShape).toBe(
        entity.role === "source" ? "circle" : "square"
      );
      const slot = session.slots[entity.slotIndex ?? -1];
      if (slot) {
        expect(entity.w).toBeGreaterThanOrEqual(slot.hitW);
        expect(entity.h).toBeGreaterThanOrEqual(slot.hitH);
      }
    }
  });

  it("Montessori 2-Pha (Explore -> Challenge), Control of Error và Micro-Sandbox Retry", () => {
    const session = buildSession();
    session.startExplorePhase();
    expect(session.getExploreTracker().getPhase()).toBe("explore");

    const p1 = session.previewOption("o1");
    expect(p1).toEqual({
      optionValue: 1,
      resultingSum: 4,
      expectedWhole: 5,
    });
    expect(session.getPreviewedOptionId()).toBe("o1");
    expect(session.getExploreTracker().getPhase()).toBe("explore");

    const p2 = session.previewOption("o3");
    expect(p2).toEqual({
      optionValue: 4,
      resultingSum: 7,
      expectedWhole: 5,
    });
    expect(session.getExploreTracker().getPhase()).toBe("challenge");

    session.onPartFilled("o1", "p2");
    expect(session.getControlOfError()?.reasonVi).toBe(
      "Gộp 3 và 1 được 4 (cần 5)"
    );
    expect(session.isMicroSandboxActive()).toBe(false);

    session.onPartFilled("o3", "p2");
    expect(session.getControlOfError()?.reasonVi).toBe(
      "Gộp 3 và 4 được 7 (cần 5)"
    );
    expect(session.isMicroSandboxActive()).toBe(true);

    session.onPartFilled("o2", "p2");
    expect(session.isMicroSandboxActive()).toBe(false);
    expect(session.getControlOfError()).toBeNull();
    expect(session.checkWinCondition()).toBe(true);
  });
});

describe("GT-007 — tổng chưa khớp báo trên ô tổng, lựa chọn đứng yên (BR-E007-04)", () => {
  it("điền sai: ô tổng nhịp hổ phách, không lựa chọn nào đỏ, ô phần vẫn trống và hết hạn sau update(WRONG_FLASH_MS)", () => {
    const fixture = getFixture();
    const session = new GT007Session(fixture.content, fixture.difficulty, 1);
    session.prepareRound("4-5");
    session.onPartFilled("o1", "p2");

    const view = session.getView();
    const whole = view.entities.find((e) => e.id === fixture.content.whole.id);
    expect(whole?.state).toBe("incorrect");
    const options = view.entities.filter((e) => e.role === "source");
    expect(options.length).toBeGreaterThan(0);
    for (const opt of options) {
      expect(opt.state).not.toBe("incorrect");
    }
    expect(session.filledParts.size).toBe(0);
    expect(session.checkWinCondition()).toBe(false);

    session.update(WRONG_FLASH_MS + 10);
    const nextWhole = session
      .getView()
      .entities.find((e) => e.id === fixture.content.whole.id);
    expect(nextWhole?.state).toBe("idle");
  });
});

describe("GT-007 — đại số đa nghiệm (BR-E007-01), allow_retry: false, ten-frame, hint ladder & generator", () => {
  const multiTargetContent: GT007Content = {
    prompt: "Tách số 5 thành hai phần",
    layout: "number-bond-tree",
    representation: "numeral",
    whole: { id: "w", value: 5, label: "5" },
    parts: [
      { id: "p1", value: 2, is_target: true },
      { id: "p2", value: 3, is_target: true },
    ],
    options: [
      { id: "o1", value: 1, is_correct: false },
      { id: "o4", value: 4, is_correct: false },
      { id: "o2", value: 2, is_correct: true },
      { id: "o3", value: 3, is_correct: true },
    ],
  };

  it("chấp nhận mọi cặp số có tổng bằng whole (1 + 4 = 5) và cho phép chạm ô phần đã điền để gỡ trước khi thắng", () => {
    const fixture = getFixture();
    const session = new GT007Session(multiTargetContent, fixture.difficulty, 1);
    session.prepareRound("5-6");

    expect(
      session.validateAction({
        type: "fill_part",
        data: { option_id: "o1", part_id: "p1" },
      }).valid
    ).toBe(true);
    session.commit({
      type: "fill_part",
      data: { option_id: "o1", part_id: "p1" },
    });
    expect(session.filledParts.get("p1")).toBe(1);
    expect(session.checkWinCondition()).toBe(false);

    // Chạm vào ô p1 đã điền để gỡ ra trước khi hoàn tất vòng
    const p1Slot = session.targetSlots[1];
    if (!p1Slot) {
      throw new Error("Missing p1 slot");
    }
    expect(
      session.toAction({ type: "tap", x: p1Slot.x, y: p1Slot.y, timeMs: 20 })
    ).toBeNull();
    expect(session.filledParts.has("p1")).toBe(false);

    // Điền o1 vào p1 rồi thay trực tiếp bằng o2 qua tap-stage và qua drop
    session.commit({
      type: "fill_part",
      data: { option_id: "o1", part_id: "p1" },
    });
    expect(session.filledParts.get("p1")).toBe(1);
    const o2Slot = session.sourceSlots[2];
    const o1Slot = session.sourceSlots[0];
    if (!(o2Slot && o1Slot)) {
      throw new Error("Missing o1 or o2 slot");
    }
    session.toAction({ type: "tap", x: o2Slot.x, y: o2Slot.y, timeMs: 25 });
    const replaceTap = session.toAction({
      type: "tap",
      x: p1Slot.x,
      y: p1Slot.y,
      timeMs: 30,
    });
    expect(replaceTap).toEqual({
      type: "fill_part",
      data: { option_id: "o2", part_id: "p1" },
    });
    if (replaceTap) {
      session.commit(replaceTap);
    }
    expect(session.filledParts.get("p1")).toBe(2);

    const replaceDrop = session.toAction({
      type: "drop",
      fromX: o1Slot.x,
      fromY: o1Slot.y,
      toX: p1Slot.x,
      toY: p1Slot.y,
      timeMs: 35,
    });
    expect(replaceDrop).toEqual({
      type: "fill_part",
      data: { option_id: "o1", part_id: "p1" },
    });
    if (replaceDrop) {
      session.commit(replaceDrop);
    }
    expect(session.filledParts.get("p1")).toBe(1);
    session.commit({
      type: "fill_part",
      data: { option_id: "o4", part_id: "p2" },
    });
    expect(session.checkWinCondition()).toBe(true);
    expect(session.getHintTargetIndex()).toBeNull();
  });

  it("allow_retry: false đóng lượt ngay sau 1 lần sai ở cả chế độ chọn số và chia kẹo", () => {
    const fixture = getFixture();
    const noRetryDiff: GT007Difficulty = {
      ...fixture.difficulty,
      allow_retry: false,
    };
    const choiceSession = new GT007Session(fixture.content, noRetryDiff, 1);
    choiceSession.prepareRound("4-5");
    choiceSession.onPartFilled("o1", "p2");

    expect(choiceSession.isAcceptingInput()).toBe(false);
    expect(choiceSession.checkWinCondition()).toBe(false);
    expect(choiceSession.getHintTargetIndex()).toBeNull();
    expect(choiceSession.getHintDestinationIndex()).toBeNull();
    expect(choiceSession.getHintTargetForLevel(1)).toBeNull();
    const ignored = choiceSession.dispatch({
      type: "tap",
      x: 100,
      y: 100,
      timeMs: 10,
    });
    expect(ignored?.feedback).toBe("none");

    const candyFixture = GT007_FIXTURES[3];
    if (!candyFixture) {
      throw new Error("Missing candy fixture");
    }
    const candySession = new GT007Session(
      candyFixture.content,
      { ...candyFixture.difficulty, allow_retry: false },
      1
    );
    candySession.prepareRound("3-4");
    candySession.commit({
      type: "move_candy",
      data: { from: { kind: "plate" }, to: { kind: "tray", index: 0 } },
    });
    expect(candySession.isAcceptingInput()).toBe(false);
    expect(candySession.checkWinCondition()).toBe(false);
  });

  it("vẽ bảng ten-frame + drawRetryRing khi representation === 'ten-frame' và ở chế độ chia kẹo", () => {
    const fixture = getFixture();
    const tenFrameContent: GT007Content = {
      ...fixture.content,
      layout: "ten-frame-split",
      representation: "ten-frame",
    };
    const session = new GT007Session(tenFrameContent, fixture.difficulty, 1);
    session.prepareRound("4-5");
    session.onPartFilled("o1", "p2");

    const rs = new RenderSystem();
    const retrySpy = vi.spyOn(rs, "drawRetryRing");
    findDrawsOutsideStage(
      { x: 0, y: 0, w: DEFAULT_LOGIC_SPACE.w, h: DEFAULT_LOGIC_SPACE.h },
      (ctx) => session.render(ctx, rs, 80)
    );
    expect(retrySpy).toHaveBeenCalled();

    const candyFixture = GT007_FIXTURES[3];
    if (!candyFixture) {
      throw new Error("Missing candy fixture");
    }
    const candySession = new GT007Session(
      candyFixture.content,
      candyFixture.difficulty,
      1
    );
    candySession.prepareRound("3-4");
    candySession.commit({
      type: "move_candy",
      data: { from: { kind: "plate" }, to: { kind: "tray", index: 0 } },
    });
    retrySpy.mockClear();
    findDrawsOutsideStage(
      { x: 0, y: 0, w: DEFAULT_LOGIC_SPACE.w, h: DEFAULT_LOGIC_SPACE.h },
      (ctx) => candySession.render(ctx, rs, 100)
    );
    expect(retrySpy).toHaveBeenCalled();
  });

  it("getHintTargetForLevel(1 | 2 | 3) chuyển đích L1 khi đã stage nguồn đúng và quản lý hover/touching", () => {
    const fixture = getFixture();
    const session = new GT007Session(fixture.content, fixture.difficulty, 1);
    session.prepareRound("4-5");

    const srcIdx = session.getHintTargetIndex();
    const destIdx = session.getHintDestinationIndex();
    expect(srcIdx).not.toBeNull();
    expect(destIdx).not.toBeNull();
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

    const correctOptSlot = session.slots[srcIdx ?? 0];
    if (!correctOptSlot) {
      throw new Error("Missing correct option slot");
    }
    session.setTouchingSlot(srcIdx);
    expect(session.getTouchingSlot()).toBe(srcIdx);
    session.setPointerOver(correctOptSlot.x, correctOptSlot.y);
    expect(session.getHoveredSlot()).toBe(srcIdx);

    session.toAction({
      type: "tap",
      x: correctOptSlot.x,
      y: correctOptSlot.y,
      timeMs: 10,
    });
    expect(session.getHintTargetForLevel(1)).toEqual({
      kind: "slot",
      index: destIdx,
    });

    session.clearPointerOver();
    expect(session.getHoveredSlot()).toBeNull();
    expect(session.getTouchingSlot()).toBeNull();
  });

  it("GT007Generator sinh content_pack và difficulty_params hợp lệ qua Zod schema ở cả 2 ageBand", () => {
    const vocab = {
      theme: "animals",
      nouns: [
        { emoji_ref: "🐱", label_vi: "mèo" },
        { emoji_ref: "🐶", label_vi: "chó" },
        { emoji_ref: "🐰", label_vi: "thỏ" },
        { emoji_ref: "🦊", label_vi: "cáo" },
        { emoji_ref: "🐻", label_vi: "gấu" },
        { emoji_ref: "🐼", label_vi: "gấu trúc" },
      ],
    };
    for (const band of ["4-5", "5-6"] as const) {
      const generated = GT007Generator.generate({
        rng: deriveStream(42, "items"),
        age_band: band,
        theme: "animals",
        vocabulary: vocab,
      });
      const parsedContent = GT007ContentSchema.parse(generated.content_pack);
      const parsedDiff = GT007DifficultySchema.parse(
        generated.difficulty_params
      );
      expect(parsedDiff.item_count).toBe(parsedContent.options.length);
      for (const opt of parsedContent.options) {
        expect(Reflect.has(opt, "label")).toBe(false);
      }
    }
  });
});
