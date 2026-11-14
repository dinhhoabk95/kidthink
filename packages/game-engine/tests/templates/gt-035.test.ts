import { describe, expect, it, vi } from "vitest";
import { GT035Generator } from "#src/generators/gt035";
import { deriveLogicSpace } from "#src/layout/constants";
import { computeZonesForSession } from "#src/layout/session-zones";
import { createRng } from "#src/rng/mulberry32";
import { findShortestSolution } from "#src/systems/command-queue-system";
import { RenderSystem } from "#src/systems/render-system";
import { peekGT035Clock } from "#src/templates/GT-035/layout";
import { GT035_STEP_MS, GT035Session } from "#src/templates/GT-035/session";
import {
  type GT035Content,
  GT035ContentSchema,
  type GT035Difficulty,
  GT035DifficultySchema,
} from "#src/templates/GT-035/template";
import { createFakeCanvas } from "#tests/gates/fake-canvas";
import { findDrawsOutsideStage } from "#tests/layout/stage-checks";

vi.mock("#src/render/shared-render", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("#src/render/shared-render")>();
  return { ...actual, drawSceneBackground: vi.fn() };
});

const FONT_PX_RE = /(\d+(?:\.\d+)?)px/;
const LETTER_RE = /[A-Za-zÀ-ỹ]/;
const NUMERIC_RE = /^\d+$/;

const BASE_CONTENT = GT035ContentSchema.parse({
  prompt: "Bé xếp hàng lệnh giúp robot về đích nhé!",
  grid: { rows: 3, cols: 4 },
  start: { col: 0, row: 0, facing: "right" },
  goal: { col: 2, row: 1, asset: { kind: "emoji", ref: "🏁" } },
  obstacles: [{ col: 1, row: 0 }],
  collectibles: [
    { id: "col_1", col: 0, row: 1, asset: { kind: "emoji", ref: "⭐" } },
  ],
  allowed_commands: ["forward", "turn_left", "turn_right", "loop"],
});

const BASE_DIFFICULTY = GT035DifficultySchema.parse({
  item_count: 3,
  max_commands: 6,
  obstacle_count: 1,
  collectible_count: 1,
  allow_loop: true,
  allow_retry: true,
  hint_after_ms: 8000,
});

interface PreparedHarness {
  readonly session: GT035Session;
  readonly ctx: CanvasRenderingContext2D;
  readonly rs: RenderSystem;
  readonly stage: ReturnType<typeof computeZonesForSession>["stage"];
  readonly cssPerLogic: number;
}

function isCanvas2D(v: object): v is CanvasRenderingContext2D {
  return "fillRect" in v && "fillText" in v;
}

function buildSession(
  content: GT035Content = BASE_CONTENT,
  difficulty: GT035Difficulty = BASE_DIFFICULTY,
  layoutSeed = 42,
  w = 330,
  h = 697
): PreparedHarness {
  const session = new GT035Session(content, difficulty, layoutSeed);
  const space = deriveLogicSpace(w, h);
  const cssPerLogic = Math.min(w / space.w, h / space.h);
  const zones = computeZonesForSession(
    { logicW: space.w, logicH: space.h, ageBand: "5-6", cssPerLogic },
    session
  );
  session.prepareRound("5-6", space, zones.stage, undefined, cssPerLogic);
  const canvas = createFakeCanvas(space.w, space.h);
  const ctx = canvas.getContext("2d");
  if (!(ctx && isCanvas2D(ctx))) {
    throw new Error("Thiếu fake canvas 2d context");
  }
  const rs = new RenderSystem();
  rs.logicSpace = space;
  return { session, ctx, rs, stage: zones.stage, cssPerLogic };
}

function winBaseSession(session: GT035Session): void {
  const winCmds = [
    "turn_right",
    "forward",
    "turn_left",
    "forward",
    "forward",
  ] as const;
  for (const command of winCmds) {
    session.commit({ type: "add_command", data: { command } });
  }
  session.commit({ type: "run_program", data: {} });
  for (let i = 0; i < 16; i++) {
    session.update(GT035_STEP_MS);
    if (session.checkWinCondition()) {
      break;
    }
  }
}

describe("GT-035 template contract", () => {
  it("BR-ERC-02: render(ctx, rs, timeMs) thuần 100% ở mở màn và sau khi thắng", () => {
    const { session, ctx, rs } = buildSession();

    const beforeKeys = Object.keys(session);
    const beforeSnapshot = JSON.stringify(session);

    session.render(ctx, rs, 0);
    session.render(ctx, rs, 420);

    expect(Object.keys(session)).toEqual(beforeKeys);
    expect(JSON.stringify(session)).toBe(beforeSnapshot);
    expect(peekGT035Clock(session)).toBeDefined();

    winBaseSession(session);
    expect(session.checkWinCondition()).toBe(true);
    session.update(180);

    const winSnapshot = JSON.stringify(session);
    session.render(ctx, rs, 1200);
    expect(JSON.stringify(session)).toBe(winSnapshot);
  });

  it("không vẽ vượt stage ở portrait 330x697 qua đủ 6 trạng thái", () => {
    const { session, rs, stage } = buildSession(
      BASE_CONTENT,
      BASE_DIFFICULTY,
      42,
      330,
      697
    );

    expect(
      findDrawsOutsideStage(stage, (c) => session.render(c, rs, 100))
    ).toEqual([]);

    for (const lvl of [1, 2, 3] as const) {
      session.onScaffoldEscalated(lvl);
      expect(
        findDrawsOutsideStage(stage, (c) => session.render(c, rs, 200))
      ).toEqual([]);
    }
    session.onHintCleared();

    const firstPal = session.slots.find((s) => s.role === "source");
    if (firstPal) {
      session.setPointerOver(firstPal.x, firstPal.y);
    }
    session.commit({ type: "add_command", data: { command: "forward" } });
    session.commit({ type: "run_program", data: {} });
    session.update(GT035_STEP_MS);
    expect(
      findDrawsOutsideStage(stage, (c) => session.render(c, rs, 350))
    ).toEqual([]);

    const winHarness = buildSession(
      BASE_CONTENT,
      BASE_DIFFICULTY,
      42,
      330,
      697
    );
    winBaseSession(winHarness.session);
    winHarness.session.update(180);
    expect(
      findDrawsOutsideStage(winHarness.stage, (c) =>
        winHarness.session.render(c, winHarness.rs, 900)
      )
    ).toEqual([]);
  });

  it("0 chữ cái qua fillText, hỗ trợ fallback EMJ- và cỡ số loop >= 16px CSS", () => {
    const emjContent = GT035ContentSchema.parse({
      ...BASE_CONTENT,
      goal: { col: 2, row: 1, asset: { kind: "emoji", ref: "EMJ-STAR" } },
      collectibles: [
        {
          id: "col_1",
          col: 0,
          row: 1,
          asset: { kind: "emoji", ref: "EMJ-GEM" },
        },
      ],
    });
    const { session, ctx, rs, cssPerLogic } = buildSession(
      emjContent,
      BASE_DIFFICULTY,
      42,
      330,
      697
    );
    session.commit({
      type: "add_command",
      data: { command: "forward" },
    });
    session.commit({
      type: "add_command",
      data: { command: "loop", count: 3 },
    });

    const textCalls: Array<{ text: string; font: string }> = [];
    vi.spyOn(ctx, "fillText").mockImplementation((text) => {
      textCalls.push({ text: String(text), font: ctx.font });
    });
    session.render(ctx, rs, 180);

    for (const call of textCalls) {
      const text = call.text.trim();
      expect(LETTER_RE.test(text)).toBe(false);
      if (NUMERIC_RE.test(text)) {
        const match = FONT_PX_RE.exec(call.font);
        expect(match).not.toBeNull();
        const logicPx = Number(match?.[1] ?? 0);
        expect(logicPx * cssPerLogic).toBeGreaterThanOrEqual(16);
      }
    }
  });

  it("allow_retry: false đóng vòng hoàn toàn sau pha bump và vẽ ghost lời giải trong stage", () => {
    const noRetryDiff = GT035DifficultySchema.parse({
      ...BASE_DIFFICULTY,
      allow_retry: false,
    });
    const { session, rs, stage } = buildSession(BASE_CONTENT, noRetryDiff, 42);

    const addRes = session.validateAction({
      type: "add_command",
      data: { command: "forward" },
    });
    expect(addRes.valid).toBe(true);
    session.commit({
      type: "add_command",
      data: { command: "forward" },
    });

    const runRes = session.validateAction({ type: "run_program", data: {} });
    expect(runRes.valid).toBe(true);
    session.commit({ type: "run_program", data: {} });

    let lastResult: ReturnType<GT035Session["update"]> = null;
    for (let step = 0; step < 20; step++) {
      const verdict = session.update(GT035_STEP_MS);
      if (verdict) {
        lastResult = verdict;
        break;
      }
    }
    expect(lastResult?.valid).toBe(false);

    session.update(GT035_STEP_MS);
    expect(session.isExecuting).toBe(false);
    expect(session.isAcceptingInput()).toBe(false);
    expect(session.canCommit()).toBe(false);
    expect(session.checkWinCondition()).toBe(false);
    expect(
      session.getEvents().some((e) => e.event_name === "game_completed")
    ).toBe(true);
    expect(
      findDrawsOutsideStage(stage, (c) => session.render(c, rs, 900))
    ).toEqual([]);
  });

  it("N7 & #301: layoutSeed = 42 xáo khay lệnh ở vòng 2 và đồng bộ gợi ý khi thao tác/lệch tiền tố", () => {
    const { session } = buildSession(BASE_CONTENT, BASE_DIFFICULTY, 42);
    const palette1 = session
      .getView()
      .entities.filter((e) => e.id.startsWith("pal_"))
      .map((e) => e.id);

    session.onScaffoldEscalated(1);
    expect(peekGT035Clock(session)?.activeHintLevel).toBe(1);
    session.commit({ type: "add_command", data: { command: "forward" } });
    expect(peekGT035Clock(session)?.activeHintLevel).toBe(0);
    expect(session.getHintTargetForLevel(2)).toEqual({
      kind: "slot",
      index: 12,
    });
    expect(session.getHintDemoSequence(3)).toBeNull();

    const space = deriveLogicSpace(330, 697);
    const cssPerLogic = Math.min(330 / space.w, 697 / space.h);
    const zones = computeZonesForSession(
      { logicW: space.w, logicH: space.h, ageBand: "5-6", cssPerLogic },
      session
    );
    session.prepareRound("5-6", space, zones.stage, undefined, cssPerLogic);
    const palette2 = session
      .getView()
      .entities.filter((e) => e.id.startsWith("pal_"))
      .map((e) => e.id);

    expect([...palette2].sort()).toEqual([...palette1].sort());
    expect(palette2).not.toEqual(palette1);

    const turnRightPalIdx = palette2.indexOf("pal_turn_right");
    expect(turnRightPalIdx).toBeGreaterThanOrEqual(0);
    const expectedFrom = 12 + BASE_DIFFICULTY.max_commands + turnRightPalIdx;
    expect(session.getHintTargetForLevel(2)).toEqual({
      kind: "slot",
      index: expectedFrom,
    });
    expect(session.getHintTargetForLevel(3)).toEqual({
      kind: "slot",
      index: expectedFrom,
      toIndex: 12,
    });
    expect(session.getHintDemoSequence(3)?.[0]).toEqual({
      from: expectedFrom,
      to: 12,
    });

    session.setPointerOver(0, 0);
    session.clearPointerOver();
    session.destroy();
    expect(peekGT035Clock(session)).toBeUndefined();
  });

  it("GT035Generator tuân thủ Spec mục 14 qua 40 seed cho escalation_step 0, 1, 2", () => {
    const steps = [0, 1, 2] as const;

    for (const step of steps) {
      for (let seed = 1; seed <= 40; seed++) {
        const out = GT035Generator.generate({
          rng: createRng(seed * 97 + step),
          age_band: "5-6",
          theme: "space",
          vocabulary: { theme: "space", nouns: [] },
          escalation_step: step,
        });
        const content = GT035ContentSchema.parse(out.content_pack);
        const diff = GT035DifficultySchema.parse(out.difficulty_params);

        const solution = findShortestSolution(
          {
            rows: content.grid.rows,
            cols: content.grid.cols,
            start: content.start,
            goal: content.goal,
            obstacles: content.obstacles,
            collectibles: content.collectibles,
            maxCommands: diff.max_commands,
          },
          content.allowed_commands
        );

        expect(solution).not.toBeNull();
        if (!solution) {
          continue;
        }

        if (step === 0) {
          expect(diff.allow_loop).toBe(false);
          expect(content.allowed_commands).toEqual([
            "go_up",
            "go_right",
            "go_down",
            "go_left",
          ]);
          expect(
            new Set(solution.map((c) => c.type)).size
          ).toBeGreaterThanOrEqual(2);
        } else if (step === 1) {
          expect(diff.allow_loop).toBe(false);
          expect(content.allowed_commands).toEqual([
            "forward",
            "turn_left",
            "turn_right",
          ]);
          expect(
            solution.some(
              (c) => c.type === "turn_left" || c.type === "turn_right"
            )
          ).toBe(true);
        } else {
          expect(diff.allow_loop).toBe(true);
          expect(content.allowed_commands).toContain("loop");
          const hasRepeatedRun = solution.some(
            (c, idx) => idx > 0 && c.type === solution[idx - 1]?.type
          );
          expect(hasRepeatedRun).toBe(true);
        }
      }
    }
  });
});
