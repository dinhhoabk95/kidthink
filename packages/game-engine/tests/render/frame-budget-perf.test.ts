import { performance } from "node:perf_hooks";
import { beforeAll, describe, expect, it } from "vitest";
import {
  ALL_TEMPLATE_CODES,
  createGameSessionSync,
  type EngineConfig,
  GameEngine,
  preloadGameSession,
  RenderSystem,
} from "#src/index";
import { FIXTURES_BY_CODE } from "../fixtures-map.js";
import { createFakeCanvas } from "../gates/fake-canvas.js";

function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted[mid] ?? 0;
}

describe("GameEngine 60fps Hot-Path Performance Benchmark & Budget", () => {
  beforeAll(async () => {
    for (const code of ALL_TEMPLATE_CODES) {
      await preloadGameSession(code);
    }
  });

  it("measures 60-frame advanceFrame + render across all 38 templates (5 runs median)", () => {
    const rs = new RenderSystem();
    const fakeCanvas = createFakeCanvas(960, 540);
    const ctx = fakeCanvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to get fake 2D context");
    }

    const FRAMES = 60;
    const RUNS = 5;

    const advanceTimes: number[] = [];
    const renderTimes: number[] = [];
    const totalTimes: number[] = [];
    const perTemplateMs = new Map<string, number[]>();

    // Warmup pass
    for (const code of ALL_TEMPLATE_CODES) {
      const fixture = FIXTURES_BY_CODE[code]?.[0];
      if (!fixture) {
        continue;
      }
      const cfg: EngineConfig = {
        level_code: `${code}-BENCH`,
        content_version: 1,
        template_code: code,
        content_pack: fixture.content,
        difficulty_params: fixture.difficulty,
        theme_id: "default",
        age_band: "4-5",
        reduced_motion: false,
        audio_enabled: false,
      };
      const engine = new GameEngine();
      const session = createGameSessionSync(code, cfg);
      engine.onViewChanged = () => {
        // active view listener as in web gameboard
      };
      engine.load(cfg, () => session);
      for (let f = 0; f < 10; f++) {
        engine.advanceFrame(16.67);
        session.render?.(
          ctx as unknown as CanvasRenderingContext2D,
          rs,
          f * 16.67
        );
      }
      engine.destroy();
    }

    // Measured runs
    for (let r = 0; r < RUNS; r++) {
      let runAdvanceMs = 0;
      let runRenderMs = 0;

      for (const code of ALL_TEMPLATE_CODES) {
        const fixture = FIXTURES_BY_CODE[code]?.[0];
        if (!fixture) {
          continue;
        }
        const cfg: EngineConfig = {
          level_code: `${code}-BENCH`,
          content_version: 1,
          template_code: code,
          content_pack: fixture.content,
          difficulty_params: fixture.difficulty,
          theme_id: "default",
          age_band: "4-5",
          reduced_motion: false,
          audio_enabled: false,
        };
        const engine = new GameEngine();
        const session = createGameSessionSync(code, cfg);
        engine.onViewChanged = () => {
          // active view listener
        };
        engine.load(cfg, () => session);

        const t0 = performance.now();
        for (let f = 0; f < FRAMES; f++) {
          engine.advanceFrame(16.67);
        }
        const t1 = performance.now();
        for (let f = 0; f < FRAMES; f++) {
          session.render?.(
            ctx as unknown as CanvasRenderingContext2D,
            rs,
            f * 16.67
          );
        }
        const t2 = performance.now();

        const adv = t1 - t0;
        const rnd = t2 - t1;
        runAdvanceMs += adv;
        runRenderMs += rnd;

        const list = perTemplateMs.get(code) ?? [];
        list.push(adv + rnd);
        perTemplateMs.set(code, list);

        engine.destroy();
      }

      advanceTimes.push(runAdvanceMs);
      renderTimes.push(runRenderMs);
      totalTimes.push(runAdvanceMs + runRenderMs);
    }

    const medAdvance = median(advanceTimes);
    const medRender = median(renderTimes);
    const medTotal = median(totalTimes);

    const slowest = [...perTemplateMs.entries()]
      .map(([code, times]) => ({ code, med: median(times) }))
      .sort((a, b) => b.med - a.med)
      .slice(0, 12);

    process.stdout.write(
      `\n[PERF-BENCH] 38 templates × ${FRAMES} frames (2280 frames total):\n` +
        `  advanceFrame median: ${medAdvance.toFixed(2)} ms\n` +
        `  render       median: ${medRender.toFixed(2)} ms\n` +
        `  total        median: ${medTotal.toFixed(2)} ms\n` +
        "  top slowest templates (60 frames):\n" +
        slowest.map((s) => `    ${s.code}: ${s.med.toFixed(2)} ms`).join("\n") +
        "\n"
    );

    expect(medTotal).toBeLessThan(500);
  });
});
