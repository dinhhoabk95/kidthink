import { describe, expect, it } from "vitest";
import { ACTION_IGNORED, ACTION_RETRY } from "#src/game-session";
import { RenderSystem } from "#src/systems/render-system";
import {
  GT017_FIXTURES,
  SAMPLE_LEVEL_1,
  SAMPLE_LEVEL_2,
} from "#src/templates/GT-017/fixtures";
import {
  BlockStackSession,
  GT017_WONDER_MS,
} from "#src/templates/GT-017/session";
import { createFakeCanvas } from "#tests/gates/fake-canvas";
import { solveWithWebGestures } from "#tests/gates/web-gesture-solver";
import { collectRenderedText, lettersOnly } from "#tests/helpers/rendered-text";

function isCanvas2D(ctx: object): ctx is CanvasRenderingContext2D {
  return "fillText" in ctx;
}

function renderSessionFrame(
  session: BlockStackSession,
  opts: { reducedMotion?: boolean; timeMs?: number } = {}
): void {
  const ctx = createFakeCanvas(960, 540).getContext("2d");
  if (!(ctx && isCanvas2D(ctx))) {
    throw new Error("Không lấy được context 2D");
  }
  const rs = new RenderSystem();
  rs.reducedMotion = opts.reducedMotion ?? false;
  session.render(ctx, rs, opts.timeMs ?? 0);
}

describe("GT-017: Xếp khối và phối cảnh — kiểm thử toàn diện UI/UX & cơ chế", () => {
  it("giải thắng trọn vẹn cả 3 fixtures (#0, #1, #2) qua solveWithWebGestures", async () => {
    for (const [index, fixture] of GT017_FIXTURES.entries()) {
      const outcome = await solveWithWebGestures("GT-017", fixture, index);
      expect(outcome).toBe("won");
    }
  });

  it("cử chỉ xoay đa phương thức (tap nửa trái/phải, kéo ngang drop, adjust) và khoá khi allow_rotate = false", () => {
    const rotatable = new BlockStackSession(
      SAMPLE_LEVEL_1.content_pack,
      { ...SAMPLE_LEVEL_1.difficulty_params, allow_rotate: true },
      0
    );
    rotatable.prepareRound("5-6");
    const heroSlot = rotatable.slots[0];
    if (!heroSlot) {
      throw new Error("Thiếu heroSlot");
    }

    // Chạm nửa trái hero -> ccw (270°)
    const leftVerdict = rotatable.dispatch({
      type: "tap",
      x: heroSlot.x - heroSlot.w * 0.25,
      y: heroSlot.y,
      timeMs: 10,
    });
    expect(leftVerdict?.valid).toBe(true);
    expect(rotatable.getCurrentRotation()).toBe(270);

    // Chạm nửa phải hero -> cw (0°)
    const rightVerdict = rotatable.dispatch({
      type: "tap",
      x: heroSlot.x + heroSlot.w * 0.25,
      y: heroSlot.y,
      timeMs: 20,
    });
    expect(rightVerdict?.valid).toBe(true);
    expect(rotatable.getCurrentRotation()).toBe(0);

    // Kéo ngang sang phải trên hero -> cw (90°)
    const dragRight = rotatable.dispatch({
      type: "drop",
      fromX: heroSlot.x - 24,
      fromY: heroSlot.y,
      toX: heroSlot.x + 24,
      toY: heroSlot.y,
      timeMs: 30,
    });
    expect(dragRight?.valid).toBe(true);
    expect(rotatable.getCurrentRotation()).toBe(90);

    // Kéo ngang sang trái trên hero -> ccw (0°)
    const dragLeft = rotatable.dispatch({
      type: "drop",
      fromX: heroSlot.x + 24,
      fromY: heroSlot.y,
      toX: heroSlot.x - 24,
      toY: heroSlot.y,
      timeMs: 40,
    });
    expect(dragLeft?.valid).toBe(true);
    expect(rotatable.getCurrentRotation()).toBe(0);

    // Adjust +1 -> cw (90°), -1 -> ccw (0°)
    expect(
      rotatable.dispatch({ type: "adjust", delta: 1, timeMs: 50 })?.valid
    ).toBe(true);
    expect(rotatable.getCurrentRotation()).toBe(90);
    expect(
      rotatable.dispatch({ type: "adjust", delta: -1, timeMs: 60 })?.valid
    ).toBe(true);
    expect(rotatable.getCurrentRotation()).toBe(0);

    // Khi allow_rotate = false, mọi cử chỉ xoay đều trả ACTION_IGNORED
    const lockedRot = new BlockStackSession(
      SAMPLE_LEVEL_2.content_pack,
      { ...SAMPLE_LEVEL_2.difficulty_params, allow_rotate: false },
      0
    );
    lockedRot.prepareRound("5-6");
    const lockedHero = lockedRot.slots[0];
    if (!lockedHero) {
      throw new Error("Thiếu lockedHero");
    }
    expect(
      lockedRot.dispatch({
        type: "tap",
        x: lockedHero.x + 20,
        y: lockedHero.y,
        timeMs: 10,
      })
    ).toEqual(ACTION_IGNORED);
    expect(
      lockedRot.dispatch({ type: "adjust", delta: 1, timeMs: 20 })
    ).toEqual(ACTION_IGNORED);
    expect(lockedRot.getCurrentRotation()).toBe(0);
  });

  it("re-tap phương án sai tái kích hoạt nhịp hổ phách + wonder (0 SFX); sau khi thắng không mất trạng thái thắng", () => {
    const session = new BlockStackSession(
      SAMPLE_LEVEL_1.content_pack,
      { ...SAMPLE_LEVEL_1.difficulty_params, allow_retry: true },
      0
    );
    session.prepareRound("5-6");
    const wrongIdx = session.getOptions().findIndex((o) => !o.is_correct);
    const rightIdx = session.getOptions().findIndex((o) => o.is_correct);
    const wrongSlot = session.sourceSlots[wrongIdx];
    const rightSlot = session.sourceSlots[rightIdx];
    if (!(wrongSlot && rightSlot)) {
      throw new Error("Thiếu slot phương án");
    }

    const v1 = session.dispatch({
      type: "tap",
      x: wrongSlot.x,
      y: wrongSlot.y,
      timeMs: 10,
    });
    expect(v1).toEqual(ACTION_RETRY);
    expect(session.mascotMood()).toBe("wonder");
    expect(session.takeSfxCues()).toEqual([]);

    session.update(300);
    // Chạm lại cùng ô sai khi nhịp đầu chưa tắt
    const v2 = session.dispatch({
      type: "tap",
      x: wrongSlot.x,
      y: wrongSlot.y,
      timeMs: 310,
    });
    expect(v2).toEqual(ACTION_RETRY);
    expect(session.mascotMood()).toBe("wonder");
    expect(session.takeSfxCues()).toEqual([]);

    session.update(GT017_WONDER_MS + 10);
    expect(session.mascotMood()).toBeNull();

    // Chọn đúng -> thắng
    const winVerdict = session.dispatch({
      type: "tap",
      x: rightSlot.x,
      y: rightSlot.y,
      timeMs: 2000,
    });
    expect(winVerdict?.valid).toBe(true);
    expect(session.checkWinCondition()).toBe(true);

    // Sau khi thắng, chạm hoặc gọi selectOption vào ô sai đều bị chặn, giữ nguyên chiến thắng
    expect(
      session.dispatch({
        type: "tap",
        x: wrongSlot.x,
        y: wrongSlot.y,
        timeMs: 2100,
      })
    ).toEqual(ACTION_IGNORED);
    expect(
      session.selectOption(session.getOptions()[wrongIdx]?.option_id ?? "")
    ).toBe(false);
    expect(session.checkWinCondition()).toBe(true);
  });

  it("allow_retry = false: chọn sai lần đầu khoá vòng, chặn chọn tiếp nhưng vẫn xoay được mô hình", () => {
    const session = new BlockStackSession(
      SAMPLE_LEVEL_1.content_pack,
      {
        ...SAMPLE_LEVEL_1.difficulty_params,
        allow_retry: false,
        allow_rotate: true,
      },
      0
    );
    session.prepareRound("5-6");
    const wrongIdx = session.getOptions().findIndex((o) => !o.is_correct);
    const rightIdx = session.getOptions().findIndex((o) => o.is_correct);
    const wrongSlot = session.sourceSlots[wrongIdx];
    const rightSlot = session.sourceSlots[rightIdx];
    const heroSlot = session.slots[0];
    if (!(wrongSlot && rightSlot && heroSlot)) {
      throw new Error("Thiếu slot");
    }

    const firstWrong = session.dispatch({
      type: "tap",
      x: wrongSlot.x,
      y: wrongSlot.y,
      timeMs: 10,
    });
    expect(firstWrong).toEqual(ACTION_RETRY);
    expect(session.isRoundLocked()).toBe(true);
    expect(session.checkWinCondition()).toBe(false);

    // Chạm tiếp ô đúng hoặc ô sai đều trả ACTION_IGNORED
    expect(
      session.dispatch({
        type: "tap",
        x: rightSlot.x,
        y: rightSlot.y,
        timeMs: 20,
      })
    ).toEqual(ACTION_IGNORED);
    expect(session.checkWinCondition()).toBe(false);

    // Vẫn xoay được mô hình để quan sát khối khuất
    const rotVerdict = session.dispatch({
      type: "tap",
      x: heroSlot.x + 20,
      y: heroSlot.y,
      timeMs: 30,
    });
    expect(rotVerdict?.valid).toBe(true);
    expect(session.getCurrentRotation()).toBe(90);
  });

  it("layoutSeed !== 0 xáo trộn derangement phương án và khớp getHintTargetIndex với phương án đúng", () => {
    const seedZero = new BlockStackSession(
      SAMPLE_LEVEL_1.content_pack,
      SAMPLE_LEVEL_1.difficulty_params,
      0
    );
    seedZero.prepareRound("5-6");
    expect(seedZero.getOptions().map((o) => o.option_id)).toEqual(
      SAMPLE_LEVEL_1.content_pack.options.map((o) => o.option_id)
    );
    expect(seedZero.getCurrentRotation()).toBe(0);

    const seeded = new BlockStackSession(
      SAMPLE_LEVEL_1.content_pack,
      SAMPLE_LEVEL_1.difficulty_params,
      42
    );
    seeded.prepareRound("5-6");
    const origIds = SAMPLE_LEVEL_1.content_pack.options.map((o) => o.option_id);
    const seededIds = seeded.getOptions().map((o) => o.option_id);
    expect(seededIds).not.toEqual(origIds);
    expect([90, 180, 270]).toContain(seeded.getCurrentRotation());

    const hintIdx = seeded.getHintTargetIndex();
    expect(hintIdx).not.toBeNull();
    const targetEntity = seeded
      .getView()
      .entities.find((e) => e.slotIndex === hintIdx);
    const correctOpt = seeded.getOptions().find((o) => o.is_correct);
    expect(targetEntity?.id).toBe(correctOpt?.option_id);
  });

  it("thang gợi ý L1/L2/L3, hover và render an toàn với reducedMotion & degradation (không vẽ chữ thừa)", () => {
    const session = new BlockStackSession(
      SAMPLE_LEVEL_2.content_pack,
      { ...SAMPLE_LEVEL_2.difficulty_params, allow_rotate: true },
      0
    );
    session.prepareRound(
      "5-6",
      { w: 960, h: 540 },
      { x: 40, y: 80, w: 880, h: 420 }
    );
    const firstOptSlot = session.sourceSlots[0];
    if (firstOptSlot) {
      session.setPointerOver(firstOptSlot.x, firstOptSlot.y);
    }

    const levels: readonly (1 | 2 | 3)[] = [1, 2, 3];
    for (const level of levels) {
      session.onScaffoldEscalated(level);
      renderSessionFrame(session, { reducedMotion: false, timeMs: 600 });
      renderSessionFrame(session, { reducedMotion: true, timeMs: 600 });
    }
    session.degradation = {
      particles_enabled: false,
      soft_shadows_enabled: false,
      touch_target_size_degraded: false,
      audio_channel_degraded: false,
      font_size_degraded: false,
    };
    renderSessionFrame(session, { reducedMotion: false, timeMs: 1200 });
    session.onHintCleared();
    session.clearPointerOver();
    session.rotateModel("ccw");
    renderSessionFrame(session, { reducedMotion: false, timeMs: 1300 });
    session.selectOption("opt-a");
    renderSessionFrame(session, { reducedMotion: false, timeMs: 1400 });
    session.degradation = {
      particles_enabled: true,
      soft_shadows_enabled: true,
      touch_target_size_degraded: false,
      audio_channel_degraded: false,
      font_size_degraded: false,
    };
    renderSessionFrame(session, { reducedMotion: false, timeMs: 1500 });

    const drawnLetters = lettersOnly(
      collectRenderedText(session, { prepare: false })
    );
    expect(drawnLetters.join(" ")).toBe("");
  });
});
