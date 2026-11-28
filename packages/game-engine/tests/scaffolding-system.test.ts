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
    // BR-SCF-11: fixture hint_after_ms=8s -> L1 8s, L2 12s, L3 16s.
    engine.advanceFrame(3000); // 13s -> L2
    engine.advanceFrame(4000); // 17s -> L3

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
      elapsed_ms: 13_000,
    });
    expect(escalations[2]?.data).toEqual({
      round_index: 0,
      level: 3,
      trigger: "timer",
      elapsed_ms: 17_000,
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

  it("Task #301 S1 / BR-SCF-11: hint_after_ms đặt L1=1x, L2=1,5x, L3=2x", () => {
    // hint_after_ms = 6000: L1=6s, L2=9s, L3=12s.
    const system = new ScaffoldingSystem("4-5", 6000);

    expect(system.tick(5000)).toBe(0);
    expect(system.tick(1000)).toBe(1); // 6s -> L1
    expect(system.tick(2000)).toBe(1); // 8s -> still L1
    expect(system.tick(1000)).toBe(2); // 9s -> L2
    expect(system.tick(2000)).toBe(2); // 11s -> still L2
    expect(system.tick(1000)).toBe(3); // 12s -> L3
  });

  it("Regression: gợi ý kích hoạt sau khi trả lời sai ở câu 1 phải được xoá sạch khi trả lời đúng hoặc sang câu tiếp theo", () => {
    const fixture0 = GT002_FIXTURES[0];
    if (!fixture0) {
      throw new Error("Expected GT002_FIXTURES[0]");
    }
    const round1Session = new GT002Session(
      fixture0.content,
      fixture0.difficulty,
      1
    );
    const round2Session = new GT002Session(
      fixture0.content,
      fixture0.difficulty,
      2
    );
    const engine = new GameEngine();
    engine.load(
      {
        level_code: "LVL-SCF-RESET",
        content_version: 1,
        template_code: "GT-002",
        content_pack: fixture0.content,
        difficulty_params: fixture0.difficulty,
        theme_id: "default",
        age_band: "3-4",
        reduced_motion: false,
        audio_enabled: false,
      },
      () => round1Session
    );
    round1Session.prepareRound("3-4");

    // Trả lời sai 2 lần ở câu 1 -> bật gợi ý L1 (vùng tiêu chí), sai thêm lần 3 -> L2 (focusIndex)
    engine.scaffolding?.onMiss();
    engine.scaffolding?.onMiss();
    engine.advanceFrame(16);
    expect(engine.scaffolding?.getCurrentLevel()).toBe(1);
    expect(engine.hintRegionIds).toEqual(["gt002-criterion-header"]);
    expect(engine.focusIndex).toBeNull();

    engine.scaffolding?.onMiss();
    engine.advanceFrame(16);
    expect(engine.scaffolding?.getCurrentLevel()).toBe(2);
    expect(engine.focusIndex).not.toBeNull();

    // Trả lời đúng qua `onSuccess()` -> khung tiếp theo phải tự xoá sạch hintRegionIds và focusIndex
    engine.scaffolding?.onSuccess();
    engine.advanceFrame(16);
    expect(engine.scaffolding?.getCurrentLevel()).toBe(0);
    expect(engine.focusIndex).toBeNull();
    expect(engine.actionHinted).toBe(false);
    expect(engine.hintRegionIds).toEqual([]);

    // Bật lại gợi ý L1 -> L2 rồi sang câu 2 bằng `resetScaffolding()` (kể cả khi đang khóa input chờ đọc đề)
    engine.scaffolding?.onMiss();
    engine.scaffolding?.onMiss();
    engine.advanceFrame(16);
    expect(engine.hintRegionIds).toEqual(["gt002-criterion-header"]);
    engine.scaffolding?.onMiss();
    engine.advanceFrame(16);
    expect(engine.focusIndex).not.toBeNull();

    round2Session.prepareRound("3-4");
    engine.activeSession = round2Session;
    engine.acceptingInput = false;
    engine.resetScaffolding();

    expect(engine.scaffolding?.getCurrentLevel()).toBe(0);
    expect(engine.focusIndex).toBeNull();
    expect(engine.actionHinted).toBe(false);
    expect(engine.hintRegionIds).toEqual([]);

    // Mở cổng input câu 2 và chạy nhiều khung hình: gợi ý vẫn tắt cho tới khi câu 2 tự đủ ngưỡng
    engine.acceptingInput = true;
    engine.advanceFrame(1000);
    expect(engine.scaffolding?.getCurrentLevel()).toBe(0);
    expect(engine.focusIndex).toBeNull();

    engine.destroy();
  });

  describe("Task #321 — fallback không giọng chỉ là gợi ý mức 1, không đặt sàn (BR-SCF-13)", () => {
    it("sau triggerVisualFallback level là 1 và không đặt floorLevel", () => {
      const scaffolding = new ScaffoldingSystem("3-4");
      const state = scaffolding.createInitialState();
      const action = scaffolding.triggerVisualFallback(1, state);
      expect(state.level).toBe(1);
      expect(state.floorLevel).toBeUndefined();
      scaffolding.triggerVisualFallback(1);
      expect(scaffolding.getCurrentLevel()).toBe(1);
      expect(action.level).toBe(1);
      expect(action.trigger).toBe("voice_fallback");
      expect(action.ghostHandSpeed).toBeUndefined();
      expect(scaffolding.focusIndex).toBe(1);
    });

    it("thang theo thời gian vẫn chạy: tới hint_after_ms thì lên L2 như thường", () => {
      const scaffolding = new ScaffoldingSystem("3-4");
      scaffolding.triggerVisualFallback(0);
      expect(scaffolding.tick(16)).toBeLessThan(2);
      expect(scaffolding.tick(26_000)).toBeGreaterThanOrEqual(2);
    });

    it("L1 sống qua tick kế: tick(16) vẫn L1, thang tiếp tục tới L2 đúng l2_time_s", () => {
      const scaffolding = new ScaffoldingSystem("3-4");
      scaffolding.triggerVisualFallback(0);
      expect(scaffolding.tick(16)).toBe(1);
      expect(scaffolding.tick(100)).toBe(1);
      // Fallback đưa đồng hồ tới mốc L1 (10 s); L2 ở 18 s, L3 ở 25 s (band 3-4).
      expect(scaffolding.tick(7000)).toBe(1);
      expect(scaffolding.tick(1000)).toBe(2);
    });

    it("đang L2 thì fallback giữ L2, không hạ rồi leo lại", () => {
      const scaffolding = new ScaffoldingSystem("3-4");
      scaffolding.tick(30_000);
      const before = scaffolding.getCurrentLevel();
      expect(before).toBeGreaterThanOrEqual(2);
      scaffolding.triggerVisualFallback(0);
      expect(scaffolding.getCurrentLevel()).toBe(before);
      expect(scaffolding.tick(16)).toBe(before);
    });

    it("ca âm: gọi hai lần không vượt L1 và không đặt sàn", () => {
      const scaffolding = new ScaffoldingSystem("3-4");
      const state = scaffolding.createInitialState();
      scaffolding.triggerVisualFallback(0, state);
      scaffolding.triggerVisualFallback(0, state);
      expect(state.level).toBe(1);
      expect(state.floorLevel).toBeUndefined();
    });

    it("trả lời đúng thì về 0", () => {
      const scaffolding = new ScaffoldingSystem("3-4");
      scaffolding.triggerVisualFallback(0);
      scaffolding.resetOnSuccess();
      expect(scaffolding.tick(16)).toBe(0);
    });

    it("vòng mới (onSuccess) reset state về 0", () => {
      const scaffolding = new ScaffoldingSystem("3-4");
      const state = scaffolding.createInitialState();
      scaffolding.triggerVisualFallback(0, state);
      scaffolding.onSuccess(state);
      expect(state.level).toBe(0);
      expect(state.floorLevel).toBeUndefined();
    });
  });
});

describe("BR-SCF-11 — nhịp theo hint_after_ms", () => {
  it("L1 ở 1x, L2 ở 1,5x, L3 ở 2x hint_after_ms (8 s -> 8/12/16 s)", () => {
    const s = new ScaffoldingSystem("4-5", 8000);
    expect(s.tick(7900)).toBe(0);
    expect(s.tick(200)).toBe(1);
    expect(s.tick(4000)).toBe(2);
    expect(s.tick(4000)).toBe(3);
  });
});
