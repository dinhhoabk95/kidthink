import {
  computeStageZones,
  createGameSessionSync,
  type EngineConfig,
  type GT024Content,
  type GT024Difficulty,
  type GT032Content,
  type GT032Difficulty,
  preloadGameSession,
  type TemplateGameSession,
} from "@mindkid/game-engine";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { usePlayGesture } from "~/composables/play/use-play-gesture";

/**
 * Task #313 Phase 0 — web phải phát gesture `stroke` từ `trailPoints`.
 * Trước đây kéo luôn thành `drop` (đường thẳng from→to), nên nét cong đi qua
 * waypoint của GT-024 / GT-013 bị bỏ qua.
 */

const CONTENT: GT024Content = {
  prompt: "Nối các chấm theo thứ tự nhé!",
  shape_name: "tam giác",
  waypoints: [
    { id: "w0", x: 300, y: 380, order: 0 },
    { id: "w1", x: 480, y: 160, order: 1 },
    { id: "w2", x: 660, y: 380, order: 2 },
  ],
};

const DIFFICULTY: GT024Difficulty = {
  item_count: 3,
  tolerance_px: 40,
  show_numbered_dots: true,
  show_guide_lines: true,
  hint_after_ms: 8000,
  allow_retry: true,
};

const CONFIG: EngineConfig = {
  level_code: "GL-TEST-GT024",
  content_version: 1,
  template_code: "GT-024",
  content_pack: CONTENT,
  difficulty_params: DIFFICULTY,
  theme_id: "default",
  age_band: "5-6",
  reduced_motion: false,
  audio_enabled: false,
  layout_seed: 1,
};

function buildHarness(
  code: "GT-024" | "GT-032" = "GT-024",
  config: EngineConfig = CONFIG
) {
  const session = createGameSessionSync(code, config) as TemplateGameSession;
  const space = { w: 960, h: 540 };
  const cssPerLogic = 1;
  const zones = computeStageZones({
    logicW: space.w,
    logicH: space.h,
    ageBand: "5-6",
    cssPerLogic,
    needsTray: false,
    needsCommit: true,
  });
  session.prepareRound("5-6", space, zones.stage, undefined, cssPerLogic);

  const engine = {
    activeSession: session,
    acceptingInput: true,
    audio: {
      playSnapSound: vi.fn(),
      playPopCelebrateSound: vi.fn(),
      playSoftFeedbackSound: vi.fn(),
      playPromptAudio: vi.fn(),
      speakPrompt: vi.fn(),
    },
    renderSystem: {
      LOGIC_WIDTH: space.w,
      LOGIC_HEIGHT: space.h,
      toLogicPoint: (clientX: number, clientY: number) => ({
        x: clientX,
        y: clientY,
      }),
    },
  };
  const gesture = usePlayGesture({
    getEngine: () => engine as never,
    canvasRef: ref(null),
    onRoundWon: vi.fn(),
    getStageZones: () => zones,
  });
  gesture.syncView();
  return { session, gesture };
}

function correctCount(session: TemplateGameSession): number {
  return (session.getView?.().entities ?? []).filter(
    (e) => e.state === "correct"
  ).length;
}

function pointer(x: number, y: number, t: number): PointerEvent {
  return { pointerId: 1, clientX: x, clientY: y, timeStamp: t } as PointerEvent;
}

describe("Task #313 — web phát stroke từ trailPoints", () => {
  beforeAll(async () => {
    await preloadGameSession("GT-024");
    await preloadGameSession("GT-032");
  });

  it("kéo cong đi qua waypoint kế tiếp (điểm thả lệch xa) vẫn tiến vòng", () => {
    const { session, gesture } = buildHarness();
    const [wp0, wp1] = session.getView().entities;
    if (!(wp0 && wp1)) {
      throw new Error("Thiếu waypoint");
    }
    session.dispatch({ type: "tap", x: wp0.x, y: wp0.y, timeMs: 1 });
    expect(correctCount(session)).toBe(1);

    // Bắt đầu xa wp1, đi xuyên qua wp1, thả ở nơi đường thẳng from→to né wp1.
    const start = { x: wp1.x - 150, y: wp1.y };
    const end = { x: wp1.x, y: wp1.y + 150 };
    gesture.handlePointerDown(pointer(start.x, start.y, 10));
    gesture.handlePointerMove(pointer(start.x + 60, start.y, 20));
    gesture.handlePointerMove(pointer(wp1.x, wp1.y, 30));
    gesture.handlePointerMove(pointer(wp1.x, wp1.y + 80, 40));
    gesture.handlePointerUp(pointer(end.x, end.y, 50));

    expect(correctCount(session)).toBe(2);
  });

  it("GT-032 pour_to_mark: kéo lên trên vùng trống phát adjust và rót nước", () => {
    const content: GT032Content = {
      prompt: "Rót nước đến vạch nhé!",
      question_type: "pour_to_mark",
      conservation_trap: false,
      cups: [
        {
          cup_id: "a",
          shape: "standard",
          capacity_units: 6,
          fill_units: 0,
          target_units: 4,
          color: "sky",
        },
        {
          cup_id: "b",
          shape: "standard",
          capacity_units: 6,
          fill_units: 2,
          target_units: 2,
          color: "sky",
        },
      ],
    };
    const difficulty: GT032Difficulty = {
      item_count: 2,
      cup_count: 2,
      level_steps: 6,
      conservation_trap: false,
      allow_retry: true,
      hint_after_ms: 8000,
    };
    const { session, gesture } = buildHarness("GT-032", {
      ...CONFIG,
      level_code: "GL-TEST-GT032",
      template_code: "GT-032",
      content_pack: content,
      difficulty_params: difficulty,
    });
    const pours = () =>
      session
        .getTelemetry()
        .events.filter((e) => e.event_name === "liquid_poured").length;
    expect(pours()).toBe(0);

    // Kéo thẳng lên ~100px từ vùng trống (không trúng cốc).
    gesture.handlePointerDown(pointer(20, 300, 10));
    gesture.handlePointerMove(pointer(20, 250, 20));
    gesture.handlePointerUp(pointer(20, 200, 30));

    expect(pours()).toBe(1);
  });
});
