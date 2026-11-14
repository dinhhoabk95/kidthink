import { describe, expect, it, vi } from "vitest";
import { GT036Generator } from "#src/generators/gt036";
import { GameEngine } from "#src/index";
import { DEFAULT_LOGIC_SPACE, deriveLogicSpace } from "#src/layout/constants";
import { computeStageZones } from "#src/layout/stage-zones";
import { createRng } from "#src/rng/mulberry32";
import type { DegradationState } from "#src/systems/degradation";
import { RenderSystem } from "#src/systems/render-system";
import { detectRule } from "#src/systems/rule-detection-system";
import { GT036_FIXTURES } from "#src/templates/GT-036/fixtures";
import { GT036Session } from "#src/templates/GT-036/session";
import {
  GT036ContentSchema,
  GT036DifficultySchema,
} from "#src/templates/GT-036/template";
import { peekGT036Clock } from "#src/templates/GT-036/view";
import { createFakeCanvas } from "#tests/gates/fake-canvas";
import { findDrawsOutsideStage } from "#tests/layout/stage-checks";

vi.mock("#src/render/index", async (importOriginal) => {
  const actual = await importOriginal<typeof import("#src/render/index")>();
  return { ...actual, drawSceneBackground: vi.fn() };
});

const FIRST = GT036_FIXTURES[0];
if (!FIRST) {
  throw new Error("Thiếu GT036_FIXTURES[0]");
}
const F0 = FIRST;
const FONT_PX_RE = /(\d+(?:\.\d+)?)px/;
const REPEAT_NUM_RE = /^[1-9]\d*$/;

function isCanvas2D(ctx: object): ctx is CanvasRenderingContext2D {
  return "fillText" in ctx;
}

function createCtx(w = 960, h = 540): CanvasRenderingContext2D {
  const ctx = createFakeCanvas(w, h).getContext("2d");
  if (!(ctx && isCanvas2D(ctx))) {
    throw new Error("Missing 2d context");
  }
  return ctx;
}

function buildSession(
  content = F0.content,
  difficulty = F0.difficulty
): GT036Session {
  const session = new GT036Session(content, difficulty);
  session.prepareRound("5-6");
  return session;
}

function makePortraitSession(
  content = F0.content,
  difficulty = F0.difficulty
): {
  session: GT036Session;
  stage: ReturnType<typeof computeStageZones>["stage"];
  rs: RenderSystem;
} {
  const cssW = 360;
  const cssH = 640;
  const space = deriveLogicSpace(cssW, cssH);
  const cssPerLogic = Math.min(cssW / space.w, cssH / space.h);
  const session = new GT036Session(content, difficulty);
  const zones = computeStageZones({
    logicW: space.w,
    logicH: space.h,
    ageBand: "5-6",
    cssPerLogic,
    needsTray: session.needsTray,
    needsCommit: session.needsCommit,
  });
  session.prepareRound(
    "5-6",
    space,
    zones.stage,
    zones.tray ?? undefined,
    cssPerLogic
  );
  const rs = new RenderSystem();
  rs.logicSpace = space;
  rs.viewport = {
    cssWidth: cssW,
    cssHeight: cssH,
    dpr: 1,
    offsetX: 0,
    offsetY: 0,
    scale: cssPerLogic,
  };
  return { session, stage: zones.stage, rs };
}

describe("GT-036 — Craftsmanship Upgrade (#301, §12, BR-ERC-02, N7, Generator)", () => {
  it("Task #301: L1 -> L2 -> L3 thang gợi ý đầy đủ & reset khi đặt hạt", () => {
    const session = buildSession();
    expect(session.getHintTargetForLevel(1)).toEqual({
      kind: "region",
      ids: ["track_0", "track_1"],
    });
    const l2 = session.getHintTargetForLevel(2);
    expect(l2?.kind).toBe("region");
    if (l2?.kind === "region") {
      expect(l2.ids.length).toBeGreaterThanOrEqual(2);
      expect(l2.ids.every((id) => id.startsWith("palette_"))).toBe(true);
    }
    expect(session.getHintTargetForLevel(3)).toEqual({
      kind: "slot",
      index: F0.content.track_length,
      toIndex: 0,
    });
    expect(session.getHintDemoSequence(1)).toBeNull();
    expect(session.getHintDemoSequence(2)).toBeNull();
    expect(session.getHintDemoSequence(3)).toEqual([
      { from: F0.content.track_length, to: 0 },
      { from: F0.content.track_length + 1, to: 1 },
    ]);

    session.onScaffoldEscalated(3);
    expect(peekGT036Clock(session)?.activeHintLevel).toBe(3);

    session.commit({
      type: "place_element",
      data: { slotIndex: 0, elementId: F0.content.palette[0]?.id ?? "star" },
    });
    expect(peekGT036Clock(session)?.activeHintLevel).toBe(0);
    expect(session.getHintDemoSequence(3)).toBeNull();

    session.onScaffoldEscalated(2);
    session.onHintCleared();
    expect(peekGT036Clock(session)?.activeHintLevel).toBe(0);

    const p0 = F0.content.palette[0]?.id ?? "star";
    const p1 = F0.content.palette[1]?.id ?? "moon";
    [p0, p1, p0, p1, p0, p1].forEach((elementId, slotIndex) => {
      session.commit({
        type: "place_element",
        data: { slotIndex, elementId },
      });
    });
    expect(session.getHintTargetForLevel(1)).toEqual({ kind: "action" });
    expect(session.getHintTargetForLevel(3)).toEqual({ kind: "action" });
    expect(session.getHintDemoSequence(3)).toBeNull();

    session.commit({ type: "submit_creation", data: {} });
    expect(session.checkWinCondition()).toBe(true);
    expect(session.getHintTargetForLevel(1)).toBeNull();
    expect(session.getHintTargetForLevel(3)).toBeNull();
  });

  it("Spec §12: khung nhóm + huy hiệu số chỉ hiện khi thắng; ẩn số khi tắt hiệu ứng; >=16px CSS; fallback asset hỏng", () => {
    const { session, rs } = makePortraitSession();
    const p0 = F0.content.palette[0]?.id ?? "star";
    const p1 = F0.content.palette[1]?.id ?? "moon";
    [p0, p1, p0, p1, p0, p1].forEach((elementId, slotIndex) => {
      session.commit({
        type: "place_element",
        data: { slotIndex, elementId },
      });
    });

    const beforeCtx = createCtx(360, 640);
    const preTexts: string[] = [];
    vi.spyOn(beforeCtx, "fillText").mockImplementation((t: string) => {
      preTexts.push(t);
    });
    session.render(beforeCtx, rs, 0);
    expect(preTexts.filter((t) => REPEAT_NUM_RE.test(t))).toEqual([]);

    session.commit({ type: "submit_creation", data: {} });
    const postCtx = createCtx(360, 640);
    const badgeTexts: string[] = [];
    const badgeFonts: number[] = [];
    vi.spyOn(postCtx, "fillText").mockImplementation((t: string) => {
      if (REPEAT_NUM_RE.test(t)) {
        badgeTexts.push(t);
        const match = FONT_PX_RE.exec(postCtx.font);
        if (match?.[1]) {
          badgeFonts.push(Number(match[1]));
        }
      }
    });
    session.render(postCtx, rs, 200);
    expect(badgeTexts).toEqual(["1", "2", "3"]);
    expect(badgeFonts.every((px) => px >= 16)).toBe(true);

    const lowDegrad: DegradationState = {
      particles_enabled: false,
      soft_shadows_enabled: false,
      touch_target_size_degraded: false,
      audio_channel_degraded: false,
      font_size_degraded: false,
    };
    session.degradation = lowDegrad;
    const lowCtx = createCtx(360, 640);
    const lowTexts: string[] = [];
    vi.spyOn(lowCtx, "fillText").mockImplementation((t: string) => {
      if (REPEAT_NUM_RE.test(t)) {
        lowTexts.push(t);
      }
    });
    session.render(lowCtx, rs, 200);
    expect(lowTexts).toEqual([]);

    const brokenContent = {
      ...F0.content,
      palette: [
        { id: "broken_a", asset: { kind: "image" as const, path: "" } },
        { id: "broken_b", asset: { kind: "image" as const, path: "" } },
      ],
    };
    const brokenSession = buildSession(brokenContent);
    brokenSession.commit({
      type: "place_element",
      data: { slotIndex: 0, elementId: "broken_a" },
    });
    const brokenCtx = createCtx(960, 540);
    expect(() =>
      brokenSession.render(brokenCtx, new RenderSystem(), 100)
    ).not.toThrow();
  });

  it("BR-ERC-02: render() thuần, không vẽ ngoài stage trên 360x640, hỗ trợ hover và destroy()", () => {
    const { session, stage, rs } = makePortraitSession();
    const p0 = F0.content.palette[0]?.id ?? "star";
    session.commit({
      type: "place_element",
      data: { slotIndex: 0, elementId: p0 },
    });
    const slot0 = session.slots[0];
    if (slot0) {
      session.setPointerOver(slot0.x, slot0.y);
      expect(peekGT036Clock(session)?.hoveredSlotIndex).toBe(0);
    }

    const beforeSnapshot = JSON.stringify({
      placed: session.placedElements,
      score: session.score,
      stars: session.stars,
      win: session.checkWinCondition(),
      clock: peekGT036Clock(session),
    });
    for (const lvl of [1, 2] as const) {
      session.onScaffoldEscalated(lvl);
      const hintViolations = findDrawsOutsideStage(stage, (ctx) => {
        session.render(ctx, rs, 196);
      });
      expect(hintViolations).toEqual([]);
    }
    session.onHintCleared();

    const violations = findDrawsOutsideStage(stage, (ctx) => {
      session.render(ctx, rs, 50_000);
    });
    expect(violations).toEqual([]);

    const afterSnapshot = JSON.stringify({
      placed: session.placedElements,
      score: session.score,
      stars: session.stars,
      win: session.checkWinCondition(),
      clock: peekGT036Clock(session),
    });
    expect(afterSnapshot).toBe(beforeSnapshot);

    const p1 = F0.content.palette[1]?.id ?? "moon";
    [p0, p1, p0, p1, p0, p1].forEach((elementId, slotIndex) => {
      session.commit({
        type: "place_element",
        data: { slotIndex, elementId },
      });
    });
    session.commit({ type: "submit_creation", data: {} });
    const winBefore = JSON.stringify({
      placed: session.placedElements,
      score: session.score,
      stars: session.stars,
      win: session.checkWinCondition(),
      clock: peekGT036Clock(session),
    });
    const winViolations = findDrawsOutsideStage(stage, (ctx) => {
      session.render(ctx, rs, 800);
    });
    expect(winViolations).toEqual([]);
    expect(
      JSON.stringify({
        placed: session.placedElements,
        score: session.score,
        stars: session.stars,
        win: session.checkWinCondition(),
        clock: peekGT036Clock(session),
      })
    ).toBe(winBefore);

    session.clearPointerOver();
    expect(peekGT036Clock(session)?.hoveredSlotIndex).toBeNull();

    session.destroy();
    expect(peekGT036Clock(session)).toBeUndefined();
    const ctxAfter = createCtx(360, 640);
    expect(() => session.render(ctxAfter, rs, 100)).not.toThrow();
  });

  it("GameEngine tích hợp L3: demoGhostSequence giữ nguyên 2 bước kéo từ khay vào dải", () => {
    const engine = new GameEngine();
    engine.load(
      {
        level_code: "LVL-036-CRAFT",
        content_version: 1,
        template_code: "GT-036",
        content_pack: F0.content,
        difficulty_params: F0.difficulty,
        theme_id: "default",
        age_band: "5-6",
        reduced_motion: false,
        audio_enabled: false,
      },
      () => new GT036Session(F0.content, F0.difficulty)
    );
    for (let i = 0; i < 46; i++) {
      engine.advanceFrame(1000);
    }
    expect(engine.scaffolding?.getCurrentLevel()).toBe(3);
    expect(engine.demoGhostSequence).toHaveLength(2);
    expect(engine.demoGhostSequence[0]?.to).not.toBeNull();
    expect(engine.demoGhostSequence[1]?.to).not.toBeNull();
    expect(Reflect.get(engine, "demoGhostSources")).toEqual([
      F0.content.track_length,
      F0.content.track_length + 1,
    ]);
    engine.destroy();
  });

  it("Spec §4 N7: prepareRound nhiều lần cập nhật bố cục theo stage mới", () => {
    const session = buildSession();
    const slotsBefore = session.slots.map((s) => ({ x: s.x, y: s.y }));
    const customStage = { x: 80, y: 120, w: 720, h: 360 };
    session.prepareRound("5-6", DEFAULT_LOGIC_SPACE, customStage);
    const slotsAfter = session.slots.map((s) => ({ x: s.x, y: s.y }));
    expect(slotsAfter).not.toEqual(slotsBefore);
    expect(
      session.slots.every(
        (s) =>
          s.x >= customStage.x &&
          s.x <= customStage.x + customStage.w &&
          s.y >= customStage.y &&
          s.y <= customStage.y + customStage.h
      )
    ).toBe(true);
  });

  it("GT036Generator: escalation_step 0/1/2+ hợp lệ schema & tránh 2 ca sai §14", () => {
    const themes = [
      "nature",
      "food",
      "animals",
      "school",
      "festival",
      "space",
      "home",
    ] as const;
    for (const step of [0, 1, 2, 3]) {
      for (const theme of themes) {
        const generated = GT036Generator.generate({
          rng: createRng(100 + step * 31 + theme.length),
          age_band: "5-6",
          theme,
          escalation_step: step,
          vocabulary: { theme, nouns: [] },
        });
        const content = GT036ContentSchema.parse(generated.content_pack);
        const diff = GT036DifficultySchema.parse(generated.difficulty_params);
        expect(content.track_length).toBeGreaterThanOrEqual(
          content.min_repetitions * 2
        );
        if (step === 0) {
          expect(content.palette).toHaveLength(2);
          expect(diff.strictness).toBe("relaxed");
          expect([6, 8]).toContain(content.track_length);
        }
        if (diff.strictness === "strict") {
          expect(content.track_length).not.toBe(7);
          expect(content.track_length).not.toBe(11);
          const id0 = content.palette[0]?.id ?? "a";
          const id1 = content.palette[1]?.id ?? "b";
          const abTrack = Array.from(
            { length: content.track_length },
            (_, i) => (i % 2 === 0 ? id0 : id1)
          );
          const check = detectRule(abTrack, {
            minRepetitions: content.min_repetitions,
            strictness: "strict",
          });
          expect(check.isWin).toBe(true);
        }
      }
    }
  });
});
