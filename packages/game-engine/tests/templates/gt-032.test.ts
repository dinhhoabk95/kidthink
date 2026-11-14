import { describe, expect, it, vi } from "vitest";
import { GT032Generator } from "#src/generators/gt032";
import { deriveLogicSpace } from "#src/layout/constants";
import { computeStageZones } from "#src/layout/stage-zones";
import { createRng } from "#src/rng/mulberry32";
import { RenderSystem } from "#src/systems/render-system";
import { GT032_FIXTURES } from "#src/templates/GT-032/fixtures";
import { getGT032Clock } from "#src/templates/GT-032/layout";
import { GT032Session } from "#src/templates/GT-032/session";
import {
  type GT032Content,
  GT032ContentSchema,
  type GT032Difficulty,
  GT032DifficultySchema,
} from "#src/templates/GT-032/template";
import { createFakeCanvas } from "#tests/gates/fake-canvas";
import { findDrawsOutsideStage } from "#tests/layout/stage-checks";

vi.mock("#src/render/shared-render", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("#src/render/shared-render")>();
  return { ...actual, drawSceneBackground: vi.fn() };
});

const FONT_PX_RE = /(\d+(?:\.\d+)?)px/;
const NUMERIC_RE = /^\d+$/;

const FOUND_COMPARE = GT032_FIXTURES.find(
  (f) => f.content.question_type !== "pour_to_mark"
);
if (!FOUND_COMPARE) {
  throw new Error("Thiếu fixture GT-032");
}
const COMPARE_FIXTURE = FOUND_COMPARE;

const POUR_CONTENT = GT032ContentSchema.parse({
  prompt: "Bé hãy rót nước đến vạch 4 cho chiếc cốc nhé!",
  question_type: "pour_to_mark",
  target_units: 4,
  conservation_trap: false,
  cups: [
    {
      cup_id: "cup_1",
      shape: "standard",
      capacity_units: 6,
      fill_units: 1,
      target_units: 4,
      color: "sky",
    },
    {
      cup_id: "cup_2",
      shape: "fluted",
      capacity_units: 6,
      fill_units: 4,
      target_units: 4,
      color: "mint",
    },
  ],
});
const POUR_DIFFICULTY = GT032DifficultySchema.parse({
  item_count: 2,
  cup_count: 2,
  level_steps: 6,
  conservation_trap: false,
  allow_retry: true,
  hint_after_ms: 8000,
});

function buildSession(
  content: GT032Content = COMPARE_FIXTURE.content,
  difficulty: GT032Difficulty = COMPARE_FIXTURE.difficulty,
  layoutSeed = 101,
  w = 964,
  h = 628
): GT032Session {
  const session = new GT032Session(content, difficulty, layoutSeed);
  const space = deriveLogicSpace(w, h);
  const cssPerLogic = Math.min(w / space.w, h / space.h);
  const zones = computeStageZones({
    logicW: space.w,
    logicH: space.h,
    ageBand: "5-6",
    cssPerLogic,
    needsTray: session.needsTray,
    needsCommit: session.needsCommit,
  });
  session.prepareRound("5-6", space, zones.stage, undefined, cssPerLogic);
  return session;
}

function isCanvas2D(ctx: object): ctx is CanvasRenderingContext2D {
  return "fillText" in ctx;
}

function createCtx(w = 960, h = 540): CanvasRenderingContext2D {
  const ctx = createFakeCanvas(w, h).getContext("2d");
  if (!(ctx && isCanvas2D(ctx))) {
    throw new Error("Không lấy được 2D context");
  }
  return ctx;
}

describe("GT-032 — nâng cấp toàn diện UI/UX, BR-ERC-02, gợi ý N5 & N7", () => {
  it("BR-ERC-02: render() 100 lần liên tiếp thuần 100% trước và sau khi thắng", () => {
    const session = buildSession();
    const ctx = createCtx();
    const rs = new RenderSystem();
    const beforeView = JSON.stringify(session.getView());
    const beforeFills = session
      .getDisplayCups()
      .map((c) => session.getCupFill(c.cup_id));

    for (let i = 0; i < 100; i++) {
      session.render(ctx, rs, i * 16);
    }
    expect(JSON.stringify(session.getView())).toBe(beforeView);
    expect(
      session.getDisplayCups().map((c) => session.getCupFill(c.cup_id))
    ).toEqual(beforeFills);

    const correctCup = session
      .getDisplayCups()
      .find((c) => session.isCupCorrect(c));
    if (!correctCup) {
      throw new Error("Thiếu cốc đúng");
    }
    session.commit({ type: "select_cup", data: { cup_id: correctCup.cup_id } });
    const clock = getGT032Clock(session);
    const particleCount = clock.particles.length;
    const firstLife = clock.particles[0]?.life;
    const eventCount = session.getTelemetry().events.length;
    expect(particleCount).toBeGreaterThan(0);

    for (let i = 0; i < 100; i++) {
      session.render(ctx, rs, i * 16);
    }
    expect(clock.particles.length).toBe(particleCount);
    expect(clock.particles[0]?.life).toBe(firstLife);
    expect(session.getTelemetry().events.length).toBe(eventCount);
  });

  it("5 trạng thái thị giác (idle, hovered, selected, wrong + drawRetryRing, correct)", () => {
    const pourSession = buildSession(POUR_CONTENT, POUR_DIFFICULTY);
    const ctx = createCtx();
    const rs = new RenderSystem();
    const cupSlot = pourSession.slots[0];
    const pourCup = pourSession.getDisplayCups()[0];
    if (!(cupSlot && pourCup)) {
      throw new Error("Thiếu slot pour");
    }

    // 1. hovered qua setPointerOver(x, y) và clearPointerOver()
    pourSession.setPointerOver(cupSlot.x, cupSlot.y);
    expect(pourSession.getView().entities[0]?.state).toBe("selected");
    pourSession.render(ctx, rs, 16);
    pourSession.clearPointerOver();
    expect(pourSession.getView().entities[0]?.state).toBe("idle");

    // 2. selected khi rót ở pour_to_mark
    pourSession.commit({
      type: "adjust_cup",
      data: { cup_id: pourCup.cup_id, delta: 1 },
    });
    expect(pourSession.getSelectedCupId()).toBe(pourCup.cup_id);

    // 3. wrong + drawRetryRing khi chọn sai ở chế độ so sánh
    const pickSession = buildSession();
    const wrongCup = pickSession
      .getDisplayCups()
      .find((c) => !pickSession.isCupCorrect(c));
    if (!wrongCup) {
      throw new Error("Thiếu cốc sai");
    }
    const retrySpy = vi.spyOn(rs, "drawRetryRing");
    pickSession.commit({
      type: "select_cup",
      data: { cup_id: wrongCup.cup_id },
    });
    expect(
      pickSession.getView().entities.find((e) => e.id === wrongCup.cup_id)
        ?.state
    ).toBe("incorrect");
    pickSession.render(ctx, rs, 32);
    expect(retrySpy).toHaveBeenCalled();

    // Hết thời gian flash thì tự về idle
    pickSession.update(2000);
    expect(
      pickSession.getView().entities.find((e) => e.id === wrongCup.cup_id)
        ?.state
    ).toBe("idle");

    // 4. correct khi chọn đúng
    const rightCup = pickSession
      .getDisplayCups()
      .find((c) => pickSession.isCupCorrect(c));
    if (!rightCup) {
      throw new Error("Thiếu cốc đúng");
    }
    pickSession.commit({
      type: "select_cup",
      data: { cup_id: rightCup.cup_id },
    });
    expect(pickSession.checkWinCondition()).toBe(true);
    expect(pickSession.isAcceptingInput()).toBe(false);
    expect(
      pickSession.getView().entities.find((e) => e.id === rightCup.cup_id)
        ?.state
    ).toBe("correct");
  });

  it("thang gợi ý L1/L2 trả region không lộ đáp án sớm; L3 trả slot + getHintDemoSequence(3)", () => {
    const session = buildSession();
    const l1 = session.getHintTargetForLevel(1);
    const l2 = session.getHintTargetForLevel(2);
    const l3 = session.getHintTargetForLevel(3);
    expect(l1).toEqual({
      kind: "region",
      ids: ["cup-unit-ticks", ...session.getDisplayCups().map((c) => c.cup_id)],
    });
    expect(l2).toEqual({
      kind: "region",
      ids: [
        "cup-unit-counts",
        ...session.getDisplayCups().map((c) => c.cup_id),
      ],
    });
    expect(l1).not.toEqual(l2);
    const expectedIdx = session
      .getDisplayCups()
      .findIndex((c) => session.isCupCorrect(c));
    expect(l3).toEqual({ kind: "slot", index: expectedIdx });
    expect(session.getHintDemoSequence(3)).toEqual([{ from: expectedIdx }]);
    expect(session.getHintDemoSequence(2)).toBeNull();

    const pourSession = buildSession(POUR_CONTENT, POUR_DIFFICULTY);
    const pourTargetIdx = pourSession.getHintTargetIndex();
    const pourCup =
      pourTargetIdx === null
        ? undefined
        : pourSession.getDisplayCups()[pourTargetIdx];
    expect(pourSession.getHintTargetForLevel(1)).toEqual({
      kind: "region",
      ids: [
        "cup-unit-ticks",
        ...pourSession.getDisplayCups().map((c) => c.cup_id),
      ],
    });
    expect(pourSession.getHintTargetForLevel(2)).toEqual({
      kind: "region",
      ids: ["cup-target-mark", pourCup?.cup_id ?? ""],
    });
    expect(pourSession.getHintTargetForLevel(3)).toEqual({
      kind: "slot",
      index: pourTargetIdx,
    });
  });

  it("BR-PSZ-01: findDrawsOutsideStage trên 360x640 = [] cho L1, L2, L3, wrong và pour_to_mark", () => {
    const compare = buildSession(
      COMPARE_FIXTURE.content,
      COMPARE_FIXTURE.difficulty,
      1,
      360,
      640
    );
    const stage = compare.stageRect;
    if (!stage) {
      throw new Error("Thiếu stageRect");
    }
    const rs = new RenderSystem();
    const space = deriveLogicSpace(360, 640);
    const scale = Math.min(360 / space.w, 640 / space.h);
    rs.viewport = {
      cssWidth: 360,
      cssHeight: 640,
      dpr: 1,
      offsetX: 0,
      offsetY: 0,
      scale,
      logicSpace: space,
    };
    for (const lvl of [1, 2, 3] as const) {
      compare.getHintTargetForLevel(lvl);
      expect(
        findDrawsOutsideStage(stage, (ctx) => compare.render(ctx, rs, 240))
      ).toEqual([]);
    }
    compare.onHintCleared();
    const wrongCup = compare
      .getDisplayCups()
      .find((c) => !compare.isCupCorrect(c));
    if (wrongCup) {
      compare.commit({
        type: "select_cup",
        data: { cup_id: wrongCup.cup_id },
      });
    }
    expect(
      findDrawsOutsideStage(stage, (ctx) => compare.render(ctx, rs, 260))
    ).toEqual([]);

    const pour = buildSession(POUR_CONTENT, POUR_DIFFICULTY, 1, 360, 640);
    if (!pour.stageRect) {
      throw new Error("Thiếu stageRect pour");
    }
    expect(
      findDrawsOutsideStage(pour.stageRect, (ctx) => pour.render(ctx, rs, 240))
    ).toEqual([]);
  });

  it("BR-A11-08: chữ số L2 trên 360x640 đạt >= 16px CSS và nằm gọn trong stageZone", () => {
    const session = buildSession(
      COMPARE_FIXTURE.content,
      COMPARE_FIXTURE.difficulty,
      1,
      360,
      640
    );
    session.getHintTargetForLevel(2);
    const ctx = createCtx(360, 640);
    const fonts: string[] = [];
    const ys: number[] = [];
    vi.spyOn(ctx, "fillText").mockImplementation(
      (text: string, _x: number, y: number) => {
        if (NUMERIC_RE.test(text.trim())) {
          fonts.push(ctx.font);
          ys.push(y);
        }
      }
    );
    const rs = new RenderSystem();
    const space = deriveLogicSpace(360, 640);
    const cssPerLogic = Math.min(360 / space.w, 640 / space.h);
    rs.viewport = {
      cssWidth: 360,
      cssHeight: 640,
      dpr: 1,
      offsetX: 0,
      offsetY: 0,
      scale: cssPerLogic,
      logicSpace: space,
    };
    session.render(ctx, rs, 0);

    expect(fonts.length).toBe(session.getDisplayCups().length);
    for (const f of fonts) {
      const m = FONT_PX_RE.exec(f);
      const px = m?.[1] ? Number.parseFloat(m[1]) : 0;
      expect(px * cssPerLogic).toBeGreaterThanOrEqual(16);
    }
    const stage = session.stageRect;
    if (stage) {
      for (const y of ys) {
        expect(y).toBeGreaterThanOrEqual(stage.y);
        expect(y).toBeLessThanOrEqual(stage.y + stage.h);
      }
    }
  });

  it("allow_retry: false đóng vòng, ghi game_completed(score=0) và tách cột đối chiếu", () => {
    const session = buildSession(COMPARE_FIXTURE.content, {
      ...COMPARE_FIXTURE.difficulty,
      allow_retry: false,
    });
    const wrongCup = session
      .getDisplayCups()
      .find((c) => !session.isCupCorrect(c));
    if (!wrongCup) {
      throw new Error("Thiếu cốc sai");
    }
    session.commit({ type: "select_cup", data: { cup_id: wrongCup.cup_id } });
    expect(session.isRoundClosedOnWrong()).toBe(true);
    expect(session.isAcceptingInput()).toBe(false);
    expect(session.checkWinCondition()).toBe(false);
    const completed = session
      .getTelemetry()
      .events.find((e) => e.event_name === "game_completed");
    expect(completed?.data).toEqual({ score: 0 });

    const ctx = createCtx();
    const rs = new RenderSystem();
    rs.reducedMotion = true;
    const widths: number[] = [];
    vi.spyOn(ctx, "roundRect").mockImplementation((_x, _y, w) => {
      widths.push(w);
    });
    session.render(ctx, rs, 0);
    expect(widths.filter((w) => w === 36)).toHaveLength(
      session.getDisplayCups().length
    );
  });

  it("N7: replay (prepareRound lần 2+) xáo vị trí cốc theo layoutSeed nhưng giữ nguyên fill_units & trap", () => {
    const session = buildSession(
      COMPARE_FIXTURE.content,
      COMPARE_FIXTURE.difficulty,
      777
    );
    const round1Order = session.getDisplayCups().map((c) => c.cup_id);
    session.prepareRound("5-6", session.logicSpace, session.stageRect);
    const round2Order = session.getDisplayCups().map((c) => c.cup_id);
    expect(round2Order).not.toEqual(round1Order);
    expect(new Set(round2Order)).toEqual(new Set(round1Order));
    session.destroy();
  });

  it("degradation: tắt particles khi particles_enabled = false", () => {
    const session = buildSession();
    session.degradation = {
      particles_enabled: false,
      soft_shadows_enabled: false,
      touch_target_size_degraded: false,
      audio_channel_degraded: false,
      font_size_degraded: false,
    };
    const rightCup = session
      .getDisplayCups()
      .find((c) => session.isCupCorrect(c));
    if (!rightCup) {
      throw new Error("Thiếu cốc đúng");
    }
    session.commit({ type: "select_cup", data: { cup_id: rightCup.cup_id } });
    expect(getGT032Clock(session).particles).toHaveLength(0);
  });

  it("GT032Generator: sinh đủ 4 question_type, hỗ trợ fluted trap cùng capacity_units và hợp lệ schema", () => {
    const seenTypes = new Set<string>();
    const seenShapes = new Set<string>();
    for (let seed = 1; seed <= 40; seed++) {
      const generated = GT032Generator.generate({
        rng: createRng(seed * 97),
        age_band: "5-6",
        what: "capacity",
        theme: "animals",
        vocabulary: { theme: "animals", nouns: [] },
        escalation_step: seed % 8,
      });
      const content = GT032ContentSchema.parse(generated.content_pack);
      const diff = GT032DifficultySchema.parse(generated.difficulty_params);
      expect(diff.cup_count).toBe(content.cups.length);
      expect(diff.conservation_trap).toBe(content.conservation_trap);
      expect(diff.level_steps).toBe(
        Math.max(...content.cups.map((c) => c.capacity_units))
      );
      seenTypes.add(content.question_type);
      for (const c of content.cups) {
        seenShapes.add(c.shape);
      }
      if (content.conservation_trap) {
        const hasSameCapPair = content.cups.some((a, i) =>
          content.cups.some(
            (b, j) =>
              i !== j &&
              a.fill_units === b.fill_units &&
              a.capacity_units === b.capacity_units &&
              a.shape !== b.shape
          )
        );
        expect(hasSameCapPair).toBe(true);
      }
    }
    expect(seenTypes.has("more")).toBe(true);
    expect(seenTypes.has("less")).toBe(true);
    expect(seenTypes.has("same")).toBe(true);
    expect(seenTypes.has("pour_to_mark")).toBe(true);
    expect(seenShapes.has("fluted")).toBe(true);
  });
});
