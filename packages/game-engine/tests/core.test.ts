import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { GameEngine, GT001_FIXTURES, GT001Session } from "#src/index";

const RE_VUE = /from\s+['"]vue['"]/;
const RE_PINIA = /from\s+['"]pinia['"]/;
const RE_VUEUSE = /from\s+['"]@vueuse/;

describe("Task 3 & Task 4 — Core Engine & GT-001 End-to-End (BR-ENG-01..17)", () => {
  it("BR-ENG-01: source code contains no imports from vue, pinia, or @vueuse", () => {
    const srcDir = path.resolve(import.meta.dirname, "../src");
    const scanDir = (dir: string) => {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          scanDir(fullPath);
        } else if (file.endsWith(".ts")) {
          const content = fs.readFileSync(fullPath, "utf-8");
          expect(content).not.toMatch(RE_VUE);
          expect(content).not.toMatch(RE_PINIA);
          expect(content).not.toMatch(RE_VUEUSE);
        }
      }
    };
    scanDir(srcDir);
  });

  it("BR-ENG-03: zero network requests emitted during active gameplay", () => {
    const engine = new GameEngine();
    const fixture = GT001_FIXTURES[0];
    expect(fixture).toBeDefined();
    if (!fixture) {
      return;
    }

    engine.load(
      {
        level_code: "LVL-001",
        content_version: 1,
        template_code: "GT-001",
        content_pack: fixture.content,
        difficulty_params: fixture.difficulty,
        theme_id: "default",
        age_band: "3-4",
        reduced_motion: false,
        audio_enabled: true,
      },
      () => new GT001Session(fixture.content, fixture.difficulty)
    );

    engine.start();
    expect(engine.getNetworkRequestCount()).toBe(0);
    engine.destroy();
  });

  it("BR-ENG-13: checkWinCondition() is pure and free of side effects across 100 calls", () => {
    const fixture = GT001_FIXTURES[0];
    expect(fixture).toBeDefined();
    if (!fixture) {
      return;
    }
    const session = new GT001Session(fixture.content, fixture.difficulty);
    session.setupEntities();

    const initialTelemetryCount = session.getTelemetry().events.length;

    for (let i = 0; i < 100; i++) {
      const win = session.checkWinCondition();
      expect(win).toBe(false);
    }

    expect(session.getTelemetry().events.length).toBe(initialTelemetryCount);
  });

  it("Task 4 — GT-001 E2E Journey: load -> start -> select correct option -> complete", () => {
    const engine = new GameEngine();
    const fixture = GT001_FIXTURES[0];
    if (!fixture) {
      throw new Error("Fixture missing");
    }
    const eventsEmitted: string[] = [];

    engine.on("*", (evt) => {
      eventsEmitted.push(evt.event_name);
    });

    engine.load(
      {
        level_code: "LVL-001",
        content_version: 1,
        template_code: "GT-001",
        content_pack: fixture.content,
        difficulty_params: fixture.difficulty,
        theme_id: "default",
        age_band: "3-4",
        reduced_motion: false,
        audio_enabled: true,
      },
      () => new GT001Session(fixture.content, fixture.difficulty)
    );

    engine.start();
    expect(eventsEmitted).toContain("game_started");
    expect(engine.checkWinCondition()).toBe(false);

    const session = engine.activeSession as GT001Session;

    // Validate wrong action first -> amber soft feedback
    const wrongRes = session.validateAction({
      type: "tap_option",
      data: { item_id: "banana_opt" },
    });
    expect(wrongRes.valid).toBe(false);
    expect(wrongRes.feedback).toBe("amber_soft");

    // Validate correct action -> pop celebrate feedback
    const correctRes = session.validateAction({
      type: "tap_option",
      data: { item_id: "apple_opt" },
    });
    expect(correctRes.valid).toBe(true);
    expect(correctRes.feedback).toBe("pop_celebrate");

    // Lock item choice
    session.onItemLocked("apple_opt");
    expect(engine.checkWinCondition()).toBe(true);

    const telemetry = session.getTelemetry();
    expect(telemetry.events.some((e) => e.event_name === "item_selected")).toBe(
      true
    );
    expect(
      telemetry.events.some((e) => e.event_name === "game_completed")
    ).toBe(true);

    engine.destroy();
  });

  it("BR-ENG-14: loop() draws through session.render when a canvas is attached", () => {
    const fixture = GT001_FIXTURES[0];
    if (!fixture) {
      throw new Error("Fixture missing");
    }
    const rendered: number[] = [];
    const ctxStub = {
      canvas: { width: 960, height: 540 },
      clearRect: () => undefined,
      scale: () => undefined,
      setTransform: () => undefined,
      save: () => undefined,
      restore: () => undefined,
    };
    const canvasStub = {
      getBoundingClientRect: () => ({ width: 960, height: 540 }),
      getContext: () => ctxStub,
      width: 0,
      height: 0,
    } as unknown as HTMLCanvasElement;

    const engine = new GameEngine();
    engine.load(
      {
        level_code: "LVL-001",
        content_version: 1,
        template_code: "GT-001",
        content_pack: fixture.content,
        difficulty_params: fixture.difficulty,
        theme_id: "default",
        age_band: "3-4",
        reduced_motion: false,
        audio_enabled: true,
      },
      () => {
        const s = new GT001Session(fixture.content, fixture.difficulty);
        (s as GT001Session & { render: unknown }).render = (
          _ctx: unknown,
          _rs: unknown,
          timeMs: number
        ) => {
          rendered.push(timeMs);
        };
        return s;
      }
    );

    engine.start(canvasStub);
    expect(rendered.length).toBeGreaterThan(0);
    engine.destroy();
  });

  it("BR-ENG-14: loop() skips drawing when no canvas is attached", () => {
    const fixture = GT001_FIXTURES[0];
    if (!fixture) {
      throw new Error("Fixture missing");
    }
    let renderCalls = 0;

    const engine = new GameEngine();
    engine.load(
      {
        level_code: "LVL-001",
        content_version: 1,
        template_code: "GT-001",
        content_pack: fixture.content,
        difficulty_params: fixture.difficulty,
        theme_id: "default",
        age_band: "3-4",
        reduced_motion: false,
        audio_enabled: true,
      },
      () => {
        const s = new GT001Session(fixture.content, fixture.difficulty);
        (s as GT001Session & { render: unknown }).render = () => {
          renderCalls++;
        };
        return s;
      }
    );

    engine.start();
    expect(renderCalls).toBe(0);
    engine.destroy();
  });

  it("Engine asset load failure emits asset_load_failed and allows fallback continue", () => {
    const engine = new GameEngine();
    const events: string[] = [];
    engine.on("asset_load_failed", () => events.push("failed"));

    engine.handleAssetLoadError("missing_emoji_ref");
    expect(events).toContain("failed");
  });
});
