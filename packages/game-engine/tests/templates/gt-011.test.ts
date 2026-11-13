import { describe, expect, it } from "vitest";
import { ACTION_IGNORED } from "#src/game-session";
import { DEFAULT_LOGIC_SPACE } from "#src/layout/constants";
import { computeStageZones } from "#src/layout/stage-zones";
import { RenderSystem } from "#src/systems/render-system";
import { WRONG_FLASH_MS } from "#src/systems/wrong-flash";
import { GT011_FIXTURES } from "#src/templates/GT-011/fixtures";
import {
  getGT011Clock,
  resolveGT011EffectiveStage,
  resolveGT011FallbackBadgeIndex,
} from "#src/templates/GT-011/layout";
import { GT011_WONDER_MS, GT011Session } from "#src/templates/GT-011/session";
import type {
  GT011Content,
  GT011Difficulty,
} from "#src/templates/GT-011/template";
import { collectRenderedText, lettersOnly } from "#tests/helpers/rendered-text";
import { findDrawsOutsideStage } from "#tests/layout/stage-checks";

function getFixture(): { content: GT011Content; difficulty: GT011Difficulty } {
  const f = GT011_FIXTURES[0];
  if (!f) {
    throw new Error("Thiếu GT011_FIXTURES[0]");
  }
  return f;
}

const ZONES = computeStageZones({
  logicW: DEFAULT_LOGIC_SPACE.w,
  logicH: DEFAULT_LOGIC_SPACE.h,
  ageBand: "5-6",
  cssPerLogic: 1,
  needsTray: false,
  needsCommit: false,
});

function createPreparedSession(
  overrides?: Partial<GT011Difficulty>,
  layoutSeed = 0
): GT011Session {
  const f = getFixture();
  const session = new GT011Session(
    f.content,
    { ...f.difficulty, ...overrides },
    layoutSeed
  );
  session.prepareRound("5-6", DEFAULT_LOGIC_SPACE, ZONES.stage);
  return session;
}

function renderOnce(
  session: GT011Session,
  timeMs: number,
  reducedMotion = false
): void {
  const rs = new RenderSystem();
  rs.reducedMotion = reducedMotion;
  findDrawsOutsideStage(ZONES.stage, (ctx) => {
    session.render(ctx, rs, timeMs);
  });
}

describe("GT-011 (matrix-choice) — cải tiến UI/UX & sửa lỗi toàn diện", () => {
  it("render() thuần 100%: gọi lặp không mutate state; wrongFlash tự dọn trong update(deltaMs)", () => {
    const session = createPreparedSession();
    session.onOptionSelected("o2");
    expect(session.getRenderItemState("o2")).toBe("wrong");
    const clockBefore = getGT011Clock(session).logicMs;
    const eventsBefore = session.getTelemetry().events.length;

    renderOnce(session, 100);
    renderOnce(session, 900);

    expect(getGT011Clock(session).logicMs).toBe(clockBefore);
    expect(session.getRenderItemState("o2")).toBe("wrong");
    expect(session.getTelemetry().events.length).toBe(eventsBefore);

    session.update(WRONG_FLASH_MS + 10);
    expect(session.getRenderItemState("o2")).toBe("idle");
    expect(session.getPreview()).toBeNull();
  });

  it("re-tap cùng một phương án sai khi allow_retry = true luôn kích lại wrongFlash và mascot wonder", () => {
    const session = createPreparedSession({ allow_retry: true });
    session.onOptionSelected("o2");
    const seq1 = getGT011Clock(session).wrongTriggerSeq;
    expect(session.mascotMood()).toBe("wonder");

    session.update(GT011_WONDER_MS + 10);
    expect(session.mascotMood()).toBeNull();

    session.onOptionSelected("o2");
    const seq2 = getGT011Clock(session).wrongTriggerSeq;
    expect(seq2).toBeGreaterThan(seq1);
    expect(session.getRenderItemState("o2")).toBe("wrong");
    expect(session.mascotMood()).toBe("wonder");
  });

  it("allow_retry = false: chọn sai đóng lượt ngay, không thắng, hiện đáp án giải thích và khoá input", () => {
    const session = createPreparedSession({ allow_retry: false });
    expect(session.isAcceptingInput()).toBe(true);

    session.onOptionSelected("o2");

    expect(session.isAcceptingInput()).toBe(false);
    expect(session.checkWinCondition()).toBe(false);
    expect(
      session
        .getTelemetry()
        .events.some((e) => e.event_name === "game_completed")
    ).toBe(true);

    renderOnce(session, 200);

    const optSlot = session.slots[9];
    if (!optSlot) {
      throw new Error("Thiếu option slot");
    }
    expect(
      session.toAction({ type: "tap", x: optSlot.x, y: optSlot.y, timeMs: 300 })
    ).toBeNull();
    expect(
      session.validateAction({ type: "select_item", data: { item_id: "o1" } })
    ).toEqual(ACTION_IGNORED);
    session.onOptionSelected("o1");
    expect(session.checkWinCondition()).toBe(false);
  });

  it("xáo trộn options tất định theo layoutSeed !== 0 và giữ nguyên khi layoutSeed === 0", () => {
    const f = getFixture();
    const baseIds = f.content.options.map((o) => o.option_id);

    const s0 = createPreparedSession(undefined, 0);
    expect(s0.getDisplayOptions().map((o) => o.option_id)).toEqual(baseIds);

    const s1 = createPreparedSession(undefined, 42);
    const s2 = createPreparedSession(undefined, 42);
    const ids1 = s1.getDisplayOptions().map((o) => o.option_id);
    const ids2 = s2.getDisplayOptions().map((o) => o.option_id);

    expect(ids1).toEqual(ids2);
    expect(ids1).not.toEqual(baseIds);
    expect([...ids1].sort()).toEqual([...baseIds].sort());
  });

  it("inspect_cell: chạm ô ma trận trả { valid: true, feedback: 'none' }, không phát telemetry lạ hay SFX", () => {
    const session = createPreparedSession();
    const firstCellSlot = session.slots[0];
    if (!firstCellSlot) {
      throw new Error("Thiếu cell slot 0");
    }
    const eventsBefore = session.getTelemetry().events.length;

    const verdict = session.dispatch({
      type: "tap",
      x: firstCellSlot.x,
      y: firstCellSlot.y,
      timeMs: 120,
    });

    expect(verdict).toEqual({ valid: true, feedback: "none" });
    expect(session.getTelemetry().events.length).toBe(eventsBefore);
    expect(session.takeSfxCues()).toEqual([]);
    expect(getGT011Clock(session).inspectSlotIndex).toBe(0);

    renderOnce(session, 150);

    const missVerdict = session.dispatch({
      type: "tap",
      x: 5,
      y: 5,
      timeMs: 160,
    });
    expect(missVerdict).toEqual({ valid: false, feedback: "none" });
  });

  it("thang gợi ý L1 / L2 / L3, getHintDestinationIndex và getHintDemoSequence(3) 3 bước chuẩn sư phạm", () => {
    const session = createPreparedSession();

    const l1 = session.getHintTargetForLevel(1);
    const l2 = session.getHintTargetForLevel(2);
    const l3 = session.getHintTargetForLevel(3);

    expect(l1).toEqual({
      kind: "region",
      ids: ["c2-0", "c2-1", "matrix_blank"],
    });
    expect(l2).toEqual({
      kind: "region",
      ids: ["c2-0", "c2-1", "matrix_blank", "c0-2", "c1-2"],
    });
    expect(l3).toEqual({
      kind: "slot",
      index: 9,
      toIndex: 8,
    });
    expect(session.getHintDestinationIndex()).toBe(8);

    expect(session.getHintDemoSequence(1)).toBeNull();
    expect(session.getHintDemoSequence(2)).toBeNull();
    const seq3 = session.getHintDemoSequence(3);
    expect(seq3).toEqual([
      { from: 9, to: 8 },
      { from: 6, to: 8 },
      { from: 2, to: 8 },
    ]);

    session.onScaffoldEscalated(1);
    renderOnce(session, 200);
    session.onScaffoldEscalated(2);
    renderOnce(session, 250);
    session.onHintCleared();
    renderOnce(session, 300);

    session.onScaffoldEscalated(2);
    session.onOptionPreviewed("o2");
    renderOnce(session, 350);
  });

  it("setPointerOver, reducedMotion, degradation.particles_enabled = false, render khi thiếu stageRect và 0 chữ cái trên canvas mở màn", () => {
    const f = getFixture();
    const unattached = new GT011Session(f.content, f.difficulty, 0);
    unattached.setupEntities();
    unattached.resolveSlots("5-6");
    expect(() => renderOnce(unattached, 100, true)).not.toThrow();

    const session = createPreparedSession();
    const drawnLetters = lettersOnly(
      collectRenderedText(session, { prepare: false })
    );
    expect(drawnLetters).toEqual([]);

    const optSlot = session.slots[9];
    const cellSlot = session.slots[0];
    if (!(optSlot && cellSlot)) {
      throw new Error("Thiếu slot");
    }
    session.setPointerOver({ x: optSlot.x, y: optSlot.y });
    expect(getGT011Clock(session).hoveredSlotIndex).toBe(9);
    session.setPointerOver(cellSlot.x, cellSlot.y);
    expect(getGT011Clock(session).hoveredSlotIndex).toBe(0);
    session.setTouchingSlot(9);
    expect(session.getTouchingSlot()).toBe(9);
    session.onScaffoldEscalated(3);
    renderOnce(session, 120);
    session.clearPointerOver();
    expect(getGT011Clock(session).hoveredSlotIndex).toBeNull();
    expect(session.getTouchingSlot()).toBeNull();

    session.degradation = {
      particles_enabled: false,
      soft_shadows_enabled: false,
      touch_target_size_degraded: false,
      audio_channel_degraded: false,
      font_size_degraded: false,
    };
    session.onOptionSelected("o1");
    expect(getGT011Clock(session).particles).toHaveLength(0);
    renderOnce(session, 220, true);
  });

  it("resolveGT011EffectiveStage bao trọn slot[12] ở preview 3-4@360x640 (GT011_FIXTURES[2]) và vẽ đủ 6 hình fallback khi asset.ref rỗng", () => {
    const f2 = GT011_FIXTURES[2];
    if (!f2) {
      throw new Error("Thiếu GT011_FIXTURES[2]");
    }
    const portraitSpace = { w: 540, h: 960 };
    const cssPerLogic = 360 / portraitSpace.w;
    const previewZones = computeStageZones({
      logicW: portraitSpace.w,
      logicH: portraitSpace.h,
      ageBand: "3-4",
      cssPerLogic,
      needsTray: false,
      needsCommit: false,
    });
    const session = new GT011Session(f2.content, f2.difficulty, 0);
    session.prepareRound(
      "3-4",
      portraitSpace,
      previewZones.stage,
      undefined,
      cssPerLogic
    );
    const slot12 = session.slots[12];
    if (!slot12) {
      throw new Error("Thiếu slot[12]");
    }
    const effStage = resolveGT011EffectiveStage(
      previewZones.stage,
      session.slots,
      portraitSpace
    );
    expect(effStage).toBeDefined();
    expect((effStage?.y ?? 0) + (effStage?.h ?? 0)).toBeGreaterThanOrEqual(
      slot12.y + Math.max(slot12.h, slot12.hitH) / 2
    );

    const emptyAssetContent: GT011Content = {
      ...f2.content,
      matrix: {
        ...f2.content.matrix,
        cells: f2.content.matrix.cells.map((c) =>
          c.asset ? { ...c, asset: { kind: "emoji", ref: "" } } : c
        ),
      },
      options: [0, 1, 2, 3, 4, 5].map((i) => ({
        option_id: `opt_${i}`,
        asset: { kind: "emoji", ref: "" },
        is_correct: i === 0,
      })),
    };
    for (let i = 0; i < 6; i++) {
      expect(
        resolveGT011FallbackBadgeIndex({ kind: "emoji", ref: "" }, i)
      ).toBe(i);
    }
    const emptySession = new GT011Session(emptyAssetContent, f2.difficulty, 1);
    emptySession.prepareRound("5-6", DEFAULT_LOGIC_SPACE, ZONES.stage);
    expect(() => renderOnce(emptySession, 180)).not.toThrow();
  });
});
