import { getByGlyph } from "@mindkid/emoji";
import { describe, expect, it, vi } from "vitest";
import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
} from "#src/game-session";
import { GT021Generator } from "#src/generators/gt021";
import type { ThemeVocabulary } from "#src/generators/types";
import { TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import { createRng } from "#src/rng/mulberry32";
import { RenderSystem } from "#src/systems/render-system";
import { GT021_FIXTURES } from "#src/templates/GT-021/fixtures";
import { getSessionClock } from "#src/templates/GT-021/layout";
import { GT021Session } from "#src/templates/GT-021/session";
import { createFakeCanvas } from "#tests/gates/fake-canvas";
import { collectRenderedText, lettersOnly } from "#tests/helpers/rendered-text";

function isCanvas2D(ctx: object): ctx is CanvasRenderingContext2D {
  return "fillText" in ctx;
}

function get2DContext(): CanvasRenderingContext2D {
  const ctx = createFakeCanvas(960, 540).getContext("2d");
  if (!(ctx && isCanvas2D(ctx))) {
    throw new Error("Cannot get 2D context from fake canvas");
  }
  return ctx;
}

const SAMPLE_VOCAB: ThemeVocabulary = {
  theme: "nature",
  nouns: [
    { emoji_ref: "🦋", label_vi: "bướm" },
    { emoji_ref: "🌸", label_vi: "hoa đào" },
    { emoji_ref: "🍄", label_vi: "nấm" },
    { emoji_ref: "🐞", label_vi: "bọ rùa" },
    { emoji_ref: "🍀", label_vi: "cỏ bốn lá" },
    { emoji_ref: "🐝", label_vi: "ong mật" },
  ],
};

describe("GT-021 — dung sai chạm, nhãn đọc và đối xứng qua trục (BR-E021)", () => {
  const fixture = GT021_FIXTURES[0];
  if (!fixture) {
    throw new Error("Fixture GT-021 not found");
  }
  const { content, difficulty } = fixture;

  function buildSession(): GT021Session {
    const session = new GT021Session(content, difficulty, 1);
    session.prepareRound("4-5");
    return session;
  }

  it("chạm lệch tâm trong dung sai 24px (TAP_TOLERANCE_PX) vào mảnh chọn và ô đích vẫn trúng", () => {
    const session = buildSession();
    const targetDef = content.target_slots[0];
    if (!targetDef) {
      throw new Error("Thiếu target_slots[0]");
    }
    const displayOpts = session.getDisplayOptions();
    const optIdx = displayOpts.findIndex(
      (o) => o.asset_ref === targetDef.expected_asset_ref
    );
    const sourceSlot = session.sourceSlots[optIdx];
    const targetSlot = session.targetSlots[0];
    if (!(sourceSlot && targetSlot)) {
      throw new Error("Thiếu sourceSlot hoặc targetSlot");
    }

    const srcOffset = sourceSlot.hitH / 2 + TAP_TOLERANCE_PX - 4;
    const tgtOffset = targetSlot.hitH / 2 + TAP_TOLERANCE_PX - 4;

    session.dispatch({
      type: "tap",
      x: sourceSlot.x,
      y: sourceSlot.y + srcOffset,
      timeMs: 10,
    });
    expect(session.getStagedItemId()).toBe(displayOpts[optIdx]?.item_id);

    const res = session.dispatch({
      type: "tap",
      x: targetSlot.x,
      y: targetSlot.y + tgtOffset,
      timeMs: 20,
    });
    expect(res?.valid).toBe(true);
  });

  it("chạm vào ô mẫu tham chiếu (role neutral) không tính là lượt trả lời", () => {
    const session = buildSession();
    const neutralEntity = session
      .getView()
      .entities.find((e) => e.role === "neutral");
    if (!neutralEntity) {
      throw new Error("Thiếu neutralEntity");
    }

    const action = session.toAction({
      type: "tap",
      x: neutralEntity.x,
      y: neutralEntity.y,
      timeMs: 15,
    });
    expect(action).toBeNull();
    expect(getSessionClock(session).inspectedPair?.index).toBe(0);

    const ctx = get2DContext();
    session.render(ctx, new RenderSystem(), 30);

    const verdict = session.dispatch({
      type: "tap",
      x: -5000,
      y: -5000,
      timeMs: 0,
    });
    expect(verdict).toEqual({ valid: false, feedback: "none" });
  });

  it("getView() cung cấp ID duy nhất và spokenLabel cho mẫu tham chiếu cùng lựa chọn", () => {
    const session = buildSession();
    const view = session.getView();
    const ids = view.entities.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);

    const neutralEntity = view.entities.find((e) => e.role === "neutral");
    const ref0 = content.reference_pattern[0];
    const expectedRefName =
      ref0?.asset.kind === "emoji"
        ? getByGlyph(ref0.asset.ref)?.name
        : undefined;
    expect(neutralEntity?.spokenLabel).toBe(expectedRefName);
    expect(neutralEntity?.hitShape).toBe("square");

    const sourceEntity = view.entities.find((e) => e.role === "source");
    const opt0 = session.getDisplayOptions()[0];
    const expectedOptName =
      opt0?.asset.kind === "emoji"
        ? getByGlyph(opt0.asset.ref)?.name
        : undefined;
    expect(sourceEntity?.spokenLabel).toBe(expectedOptName);
  });
});

describe("GT-021 — nửa phản chiếu vẽ lật gương thật (BR-E021-05)", () => {
  function flipCalls(axis: "vertical" | "horizontal"): {
    before: number[][];
    after: number[][];
  } {
    const fixture = GT021_FIXTURES[0];
    if (!fixture) {
      throw new Error("Fixture GT-021 not found");
    }
    const session = new GT021Session(
      { ...fixture.content, axis },
      fixture.difficulty,
      1
    );
    session.prepareRound("4-5");
    const ctx = get2DContext();
    const calls: number[][] = [];
    vi.spyOn(ctx, "scale").mockImplementation((x, y) => {
      calls.push([x, y]);
    });
    const rs = new RenderSystem();
    session.render(ctx, rs, 0);
    const isFlip = ([x, y]: number[]) => x === -1 || y === -1;
    const before = calls.filter(isFlip);
    const target = fixture.content.target_slots[0];
    const opt = fixture.content.options.find(
      (o) => o.asset_ref === target?.expected_asset_ref
    );
    if (!(target && opt)) {
      throw new Error("Thiếu ô đích hoặc mảnh đúng");
    }
    session.onPlaceOption(opt.item_id, target.slot_id);
    calls.length = 0;
    session.render(ctx, rs, 16);
    return { before, after: calls.filter(isFlip) };
  }

  it("trục dọc: vật ở ô đích lật trái-phải, ô trống không lật", () => {
    const { before, after } = flipCalls("vertical");
    expect(before).toEqual([]);
    expect(after).toEqual([[-1, 1]]);
  });

  it("trục ngang: vật ở ô đích lật trên-dưới", () => {
    expect(flipCalls("horizontal").after).toEqual([[1, -1]]);
  });

  it("N4: nhấc mảnh thì ô đối xứng của nó sáng nhẹ, nhả ra thì tắt", () => {
    const fixture = GT021_FIXTURES[0];
    if (!fixture) {
      throw new Error("Fixture GT-021 not found");
    }
    const { content } = fixture;
    const session = new GT021Session(content, fixture.difficulty, 1);
    session.prepareRound("4-5");
    const lit = () =>
      session
        .getView()
        .entities.filter((e) => e.role === "target" && e.state === "active")
        .map((e) => e.id);
    expect(lit()).toEqual([]);
    const targetDef = content.target_slots[0];
    if (!targetDef) {
      throw new Error("Thiếu target_slots[0]");
    }
    const optIdx = session
      .getDisplayOptions()
      .findIndex((o) => o.asset_ref === targetDef.expected_asset_ref);
    const sourceSlot = session.sourceSlots[optIdx];
    if (!sourceSlot) {
      throw new Error("Thiếu sourceSlot");
    }
    const tapSource = {
      type: "tap",
      x: sourceSlot.x,
      y: sourceSlot.y,
    } as const;
    session.dispatch({ ...tapSource, timeMs: 1 });
    expect(lit()).toContain(targetDef.slot_id);
    session.dispatch({ ...tapSource, timeMs: 2 });
    expect(lit()).toEqual([]);
  });
});

describe("GT-021 — kiểm thử hồi quy bug logic, thang trợ giúp và an toàn vẽ", () => {
  const f1 = GT021_FIXTURES[1];
  if (!f1) {
    throw new Error("Fixture GT-021[1] not found");
  }

  it("1. Đặt sai 2 lần liên tiếp cách nhau 150ms vào 2 ô trống đều tự xoá sau WRONG_FLASH_MS (400ms) và vẽ drawRetryRing ở progress=0 ngay frame đầu", () => {
    const session = new GT021Session(f1.content, f1.difficulty, 0);
    session.prepareRound("4-5");
    const [slot0, slot1] = f1.content.target_slots;
    const wrongOpt = f1.content.options.find(
      (o) =>
        o.asset_ref !== slot0?.expected_asset_ref &&
        o.asset_ref !== slot1?.expected_asset_ref
    );
    if (!(slot0 && slot1 && wrongOpt)) {
      throw new Error("Thiếu dữ liệu đặt sai liên tiếp");
    }

    expect(session.onPlaceOption(wrongOpt.item_id, slot0.slot_id)).toEqual(
      ACTION_RETRY
    );
    const ctx = get2DContext();
    const rs = new RenderSystem();
    const retrySpy = vi.spyOn(rs, "drawRetryRing");
    session.render(ctx, rs, 0);
    expect(retrySpy).toHaveBeenCalledWith(
      ctx,
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
      0
    );
    session.update(150);
    expect(session.onPlaceOption(wrongOpt.item_id, slot1.slot_id)).toEqual(
      ACTION_RETRY
    );
    expect(session.mirrorSystem.getPlacement(slot0.slot_id)).toBe(
      wrongOpt.asset_ref
    );
    expect(session.mirrorSystem.getPlacement(slot1.slot_id)).toBe(
      wrongOpt.asset_ref
    );

    session.update(260);
    expect(session.mirrorSystem.getPlacement(slot0.slot_id)).toBeUndefined();
    expect(session.mirrorSystem.getPlacement(slot1.slot_id)).toBe(
      wrongOpt.asset_ref
    );

    session.update(160);
    expect(session.mirrorSystem.getPlacement(slot1.slot_id)).toBeUndefined();
  });

  it("2. Bảo vệ ô đích đã điền đúng: đặt hoặc chạm đè mảnh khác vào ô correct trả ACTION_IGNORED", () => {
    const session = new GT021Session(f1.content, f1.difficulty, 0);
    session.prepareRound("4-5");
    const slot0 = f1.content.target_slots[0];
    const rightOpt = f1.content.options.find(
      (o) => o.asset_ref === slot0?.expected_asset_ref
    );
    const wrongOpt = f1.content.options.find(
      (o) => o.asset_ref !== slot0?.expected_asset_ref
    );
    if (!(slot0 && rightOpt && wrongOpt)) {
      throw new Error("Thiếu mảnh kiểm tra bảo vệ ô đúng");
    }

    expect(session.onPlaceOption(rightOpt.item_id, slot0.slot_id)).toEqual(
      ACTION_CORRECT
    );
    expect(session.onPlaceOption(wrongOpt.item_id, slot0.slot_id)).toEqual(
      ACTION_IGNORED
    );
    expect(session.getPlacements().get(rightOpt.item_id)).toBe(slot0.slot_id);
    expect(session.mirrorSystem.getPlacement(slot0.slot_id)).toBe(
      rightOpt.asset_ref
    );
  });

  it("3. allow_retry = false: đặt sai lần đầu đóng lượt ngay, từ chối input tiếp theo và vẽ nửa còn thiếu", () => {
    const session = new GT021Session(
      f1.content,
      { ...f1.difficulty, allow_retry: false },
      0
    );
    session.prepareRound("4-5");
    const slot0 = f1.content.target_slots[0];
    const wrongOpt = f1.content.options.find(
      (o) => o.asset_ref !== slot0?.expected_asset_ref
    );
    if (!(slot0 && wrongOpt)) {
      throw new Error("Thiếu dữ liệu allow_retry=false");
    }

    expect(session.onPlaceOption(wrongOpt.item_id, slot0.slot_id)).toEqual(
      ACTION_RETRY
    );
    expect(session.isAcceptingInput()).toBe(false);
    expect(session.checkWinCondition()).toBe(false);

    const srcSlot = session.sourceSlots[0];
    if (!srcSlot) {
      throw new Error("Thiếu srcSlot");
    }
    expect(
      session.toAction({ type: "tap", x: srcSlot.x, y: srcSlot.y, timeMs: 50 })
    ).toBeNull();

    const ctx = get2DContext();
    session.render(ctx, new RenderSystem(), 100);
  });

  it("4. Thang trợ giúp L1 / L2 / L3, gợi ý đúng mảnh nguồn kể cả khi đang cầm mảnh nhiễu, và vẽ bóng mờ L2", () => {
    const session = new GT021Session(f1.content, f1.difficulty, 0);
    session.prepareRound("4-5");
    const ref0 = f1.content.reference_pattern[0];
    const slot0 = f1.content.target_slots[0];
    const distractorIdx = f1.content.options.findIndex(
      (o) =>
        !f1.content.target_slots.some(
          (t) => t.expected_asset_ref === o.asset_ref
        )
    );
    const expectedSrcIdx = f1.content.options.findIndex(
      (o) => o.asset_ref === slot0?.expected_asset_ref
    );
    const distractorSlot = session.sourceSlots[distractorIdx];
    const expectedSrcSlot = session.sourceSlots[expectedSrcIdx];
    const expectedTgtSlot = session.targetSlots[0];
    const rightOpt = f1.content.options[expectedSrcIdx];
    if (
      !(
        ref0 &&
        slot0 &&
        distractorSlot &&
        expectedSrcSlot &&
        expectedTgtSlot &&
        rightOpt
      )
    ) {
      throw new Error("Thiếu mảnh nhiễu hoặc mảnh đúng");
    }

    session.dispatch({
      type: "tap",
      x: distractorSlot.x,
      y: distractorSlot.y,
      timeMs: 5,
    });
    expect(session.getHintTargetIndex()).toBe(expectedSrcSlot.index);
    expect(session.getHintDestinationIndex()).toBe(expectedTgtSlot.index);
    expect(session.getHintTargetForLevel(1)).toEqual({
      kind: "region",
      ids: [ref0.slot_id, slot0.slot_id],
    });
    expect(session.getHintTargetForLevel(2)).toEqual({
      kind: "region",
      ids: [ref0.slot_id, slot0.slot_id, rightOpt.item_id],
    });
    expect(session.getHintTargetForLevel(3)).toEqual({
      kind: "slot",
      index: expectedSrcSlot.index,
      toIndex: expectedTgtSlot.index,
    });
    expect(session.getHintDemoSequence(3)).toEqual([
      {
        from: expectedSrcSlot.index,
        to: expectedTgtSlot.index,
        x: expectedSrcSlot.x,
        y: expectedSrcSlot.y,
      },
      {
        from: expectedTgtSlot.index,
        x: expectedTgtSlot.x,
        y: expectedTgtSlot.y,
      },
    ]);

    session.onScaffoldEscalated(2);
    expect(session.getScaffoldLevel()).toBe(2);
    const ctx = get2DContext();
    const flips: number[][] = [];
    vi.spyOn(ctx, "scale").mockImplementation((x, y) => {
      if (x === -1 || y === -1) {
        flips.push([x, y]);
      }
    });
    session.render(ctx, new RenderSystem(), 20);
    expect(flips.length).toBeGreaterThan(0);

    session.onHintCleared();
    expect(session.getScaffoldLevel()).toBe(0);
  });

  it("5. Xáo trộn tất định getDisplayOptions() khi layoutSeed != 0 và đổi thứ tự ở vòng 2", () => {
    const session = new GT021Session(f1.content, f1.difficulty, 7);
    session.prepareRound("4-5");
    const round1Ids = session.getDisplayOptions().map((o) => o.item_id);
    const rawIds = f1.content.options.map((o) => o.item_id);
    expect(round1Ids).not.toEqual(rawIds);

    session.prepareRound("4-5");
    const round2Ids = session.getDisplayOptions().map((o) => o.item_id);
    expect(round2Ids).not.toEqual(round1Ids);
  });

  it("6. BR-ERC-02: render() thuần 100%, chịu được reducedMotion, degradation và asset_ref không có glyph", () => {
    const customContent = {
      ...f1.content,
      reference_pattern: f1.content.reference_pattern.map((r, i) =>
        i === 0
          ? { ...r, asset: { kind: "image" as const, path: "wing_a" } }
          : r
      ),
      target_slots: f1.content.target_slots.map((t, i) =>
        i === 0 ? { ...t, expected_asset_ref: "wing_a" } : t
      ),
      options: f1.content.options.map((o, i) =>
        i === 0
          ? {
              ...o,
              asset_ref: "wing_a",
              asset: { kind: "image" as const, path: "wing_a" },
            }
          : o
      ),
    };
    const session = new GT021Session(customContent, f1.difficulty, 1);
    session.prepareRound("4-5");
    session.degradation = {
      particles_enabled: false,
      soft_shadows_enabled: false,
      touch_target_size_degraded: false,
      audio_channel_degraded: false,
      font_size_degraded: false,
    };
    const src0 = session.sourceSlots[0];
    if (src0) {
      session.setPointerOver(src0.x, src0.y);
    }
    const snapBefore = JSON.stringify(Object.entries(session));

    const ctx = get2DContext();
    const rs = new RenderSystem();
    rs.reducedMotion = true;
    session.render(ctx, rs, 120);
    const snapAfter = JSON.stringify(Object.entries(session));
    expect(snapAfter).toBe(snapBefore);
    session.clearPointerOver();
    const texts = lettersOnly(
      collectRenderedText(session, { prepare: false, timeMs: 120 })
    );
    for (const text of texts) {
      expect(text.toLowerCase()).not.toContain("wing");
    }
  });

  it("7. GT021Generator sinh đủ cả trục vertical lẫn horizontal ở band 5-6 và trộn vị trí đáp án", () => {
    const axes = new Set<string>();
    let firstOptionAlwaysAnswer = true;

    for (let seed = 1; seed <= 16; seed++) {
      const generated = GT021Generator.generate({
        rng: createRng(seed),
        age_band: "5-6",
        theme: "nature",
        vocabulary: SAMPLE_VOCAB,
      });
      axes.add(generated.content_pack.axis);
      const targetRefs = new Set(
        generated.content_pack.target_slots.map((t) => t.expected_asset_ref)
      );
      const firstOptRef = generated.content_pack.options[0]?.asset_ref ?? "";
      if (!targetRefs.has(firstOptRef)) {
        firstOptionAlwaysAnswer = false;
      }
    }

    expect(axes.has("vertical")).toBe(true);
    expect(axes.has("horizontal")).toBe(true);
    expect(firstOptionAlwaysAnswer).toBe(false);
  });
});
