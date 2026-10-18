import { describe, expect, it } from "vitest";
import { GameEngine } from "#src/index";
import {
  COMPLIMENTS,
  FORBIDDEN_WORDS,
  RETRY_ENCOURAGEMENTS,
} from "#src/systems/feedback-system";
import {
  type ScaffoldAction,
  ScaffoldingSystem,
  type ScaffoldState,
} from "#src/systems/scaffolding";
import { GT002_FIXTURES } from "#src/templates/GT-002/fixtures.js";
import { GT002Session } from "#src/templates/GT-002/session.js";

describe("ScaffoldingSystem (BR-SCF-01..08 & SCAFFOLDING-AND-HINTS spec)", () => {
  function createInitialState(): ScaffoldState {
    return {
      level: 0,
      sinceMs: 0,
      missStreak: 0,
      focusIndex: null,
      roundIndex: 0,
      l3DurationMs: 0,
      skipSuggested: false,
    };
  }

  it("BR-SCF-01 & BR-SCF-05: escalates automatically on age-band timers (3-4 vs 5-6)", () => {
    const system = new ScaffoldingSystem();
    const state34 = createInitialState();
    const state56 = createInitialState();

    // Tick 12 seconds
    const action34 = system.tick(
      12_000,
      state34,
      "3-4",
      2
    ) as ScaffoldAction | null;
    const action56 = system.tick(
      12_000,
      state56,
      "5-6",
      2
    ) as ScaffoldAction | null;

    // Band 3-4 triggers L1 at 10s -> level should be 1
    expect(state34.level).toBe(1);
    expect(action34?.level).toBe(1);
    expect(action34?.trigger).toBe("timer");

    // Band 5-6 L1 triggers at 20s -> 12s is still L0
    expect(state56.level).toBe(0);
    expect(action56).toBeNull();
  });

  it("BR-SCF-01: escalates on miss streak", () => {
    const system = new ScaffoldingSystem();
    const state = createInitialState();

    system.onMiss(state);
    system.onMiss(state); // 2 miss cho band 3-4 -> L1 (Task #274 D-274-1)
    const action = system.tick(1000, state, "3-4", 1) as ScaffoldAction | null;

    expect(state.level).toBe(1);
    expect(action?.trigger).toBe("miss_streak");
  });

  it("BR-SCF-05: band 3-4 — một lần sai chưa bật L1 (highlight đáp án), lần sai thứ hai mới bật (Task #274 D-274-1)", () => {
    const system = new ScaffoldingSystem();
    const state = createInitialState();

    system.onMiss(state);
    system.tick(1000, state, "3-4", 1);
    expect(state.level).toBe(0);

    system.onMiss(state);
    system.tick(16, state, "3-4", 1);
    expect(state.level).toBe(1);

    system.onMiss(state);
    system.tick(16, state, "3-4", 1);
    expect(state.level).toBe(2);

    system.onMiss(state);
    system.tick(16, state, "3-4", 1);
    expect(state.level).toBe(3);
  });

  it("BR-SCF-03: assigns focusIndex on escalation", () => {
    const system = new ScaffoldingSystem();
    const state = createInitialState();

    system.tick(10_000, state, "3-4", 5);
    expect(state.focusIndex).toBe(5);
  });

  it("BR-SCF-04: L3 + 60s suggests round skip without auto-completing", () => {
    const system = new ScaffoldingSystem();
    const state = createInitialState();

    // Move to L3 (25s)
    system.tick(25_000, state, "3-4", 0);
    expect(state.level).toBe(3);

    // Add 60s in L3
    const action = system.tick(
      60_000,
      state,
      "3-4",
      0
    ) as ScaffoldAction | null;
    expect(state.level).toBe(3); // stays at L3, does not auto complete
    expect(action?.roundSkippedSuggested).toBe(true);
  });

  it("BR-SCF-06: reduced-motion flag is set in action while preserving ghostHandSpeed demonstration", () => {
    const system = new ScaffoldingSystem();
    const state = createInitialState();

    const actionL2 = system.tick(
      18_000,
      state,
      "3-4",
      0,
      true
    ) as ScaffoldAction | null;
    expect(actionL2?.level).toBe(2);
    expect(actionL2?.reducedMotion).toBe(true);
    expect(actionL2?.ghostHandSpeed).toBe(1);

    const actionL3 = system.tick(
      7000,
      state,
      "3-4",
      0,
      true
    ) as ScaffoldAction | null;
    expect(actionL3?.level).toBe(3);
    expect(actionL3?.reducedMotion).toBe(true);
    expect(actionL3?.ghostHandSpeed).toBe(0.5);
  });

  it("BR-SCF-07: GameEngine emits scaffold_escalated on each escalation with accurate trigger and demo_shown at L2", () => {
    const fixture0 = GT002_FIXTURES[0];
    if (!fixture0) {
      throw new Error("Expected GT002_FIXTURES[0]");
    }
    const session = new GT002Session(fixture0.content, fixture0.difficulty, 1);
    const engine = new GameEngine();
    const emitted: Array<{
      event_name: string;
      data?: Record<string, number | string>;
    }> = [];
    for (const eventName of ["scaffold_escalated", "demo_shown"]) {
      engine.on(eventName, (ev) => {
        emitted.push({
          event_name: ev.event_name,
          data: ev.data as Record<string, number | string> | undefined,
        });
      });
    }

    engine.load(
      {
        level_code: "LVL-SCF-07",
        content_version: 1,
        template_code: "GT-002",
        content_pack: fixture0.content,
        difficulty_params: fixture0.difficulty,
        theme_id: "default",
        age_band: "3-4",
        reduced_motion: false,
        audio_enabled: false,
      },
      () => session
    );
    session.prepareRound("3-4");

    // 1 miss in band 3-4 stays at L0; 10s timer then escalates to L1 with trigger "timer"
    engine.scaffolding?.onMiss();
    engine.advanceFrame(10_000);
    // Advance +8s (18s total) -> L2
    engine.advanceFrame(8000);
    // Advance +7s (25s total) -> L3
    engine.advanceFrame(7000);

    const escalations = emitted.filter(
      (e) => e.event_name === "scaffold_escalated"
    );
    expect(escalations).toHaveLength(3);
    expect(escalations[0]?.data).toEqual({
      round_index: 0,
      level: 1,
      trigger: "timer",
      elapsed_ms: 10_000,
    });
    expect(escalations[1]?.data).toEqual({
      round_index: 0,
      level: 2,
      trigger: "timer",
      elapsed_ms: 18_000,
    });
    expect(escalations[2]?.data).toEqual({
      round_index: 0,
      level: 3,
      trigger: "timer",
      elapsed_ms: 25_000,
    });

    const demos = emitted.filter((e) => e.event_name === "demo_shown");
    expect(demos).toHaveLength(1);
    expect(demos[0]?.data).toEqual({ round_index: 0, speed: 1 });
    expect(engine.focusIndex).not.toBeNull();

    engine.destroy();
  });

  it("BR-SCF-08: mọi câu khích lệ khi trợ giúp/thử lại không bao giờ mang giọng chê hay so sánh", () => {
    for (const phrase of [...RETRY_ENCOURAGEMENTS, ...COMPLIMENTS]) {
      for (const forbidden of FORBIDDEN_WORDS) {
        expect(phrase.toLowerCase()).not.toContain(forbidden.toLowerCase());
      }
      expect(phrase.toLowerCase()).not.toContain("sai");
      expect(phrase.toLowerCase()).not.toContain("kém");
      expect(phrase.toLowerCase()).not.toContain("tệ");
    }
  });

  it("onSuccess resets scaffolding state to 0", () => {
    const system = new ScaffoldingSystem();
    const state = createInitialState();

    system.onMiss(state);
    system.tick(25_000, state, "3-4", 1);
    expect(state.level).toBe(3);

    system.onSuccess(state);
    expect(state.level).toBe(0);
    expect(state.missStreak).toBe(0);
    expect(state.sinceMs).toBe(0);
    expect(state.focusIndex).toBeNull();
  });

  it("Task #301 S1: hint_after_ms overrides L1 timer while keeping age-band gaps for L2 and L3", () => {
    // Band 4-5 default: L1=15s, L2=25s (+10s), L3=35s (+10s).
    // With hint_after_ms = 6000 (6s): L1=6s, L2=16s, L3=26s.
    const system = new ScaffoldingSystem("4-5", 6000);

    expect(system.tick(5000)).toBe(0);
    expect(system.tick(1000)).toBe(1); // 6s -> L1
    expect(system.tick(9000)).toBe(1); // 15s -> still L1
    expect(system.tick(1000)).toBe(2); // 16s -> L2
    expect(system.tick(9000)).toBe(2); // 25s -> still L2
    expect(system.tick(1000)).toBe(3); // 26s -> L3
  });
});
