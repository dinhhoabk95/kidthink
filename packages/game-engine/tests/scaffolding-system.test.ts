import { describe, expect, it } from "vitest";
import {
  type ScaffoldAction,
  ScaffoldingSystem,
  type ScaffoldState,
} from "../src/systems/scaffolding";

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

    system.onMiss(state); // 1 miss for 3-4 -> L1
    const action = system.tick(1000, state, "3-4", 1) as ScaffoldAction | null;

    expect(state.level).toBe(1);
    expect(action?.trigger).toBe("miss_streak");
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

  it("BR-SCF-06: reduced-motion flag is set in action", () => {
    const system = new ScaffoldingSystem();
    const state = createInitialState();

    const action = system.tick(
      18_000,
      state,
      "3-4",
      0,
      true
    ) as ScaffoldAction | null;
    expect(action?.reducedMotion).toBe(true);
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
});
