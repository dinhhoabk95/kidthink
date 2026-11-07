import {
  computeStageZones,
  createGameSessionSync,
  type EngineConfig,
  type GT001Content,
  type GT001Difficulty,
  preloadGameSession,
  type TemplateGameSession,
} from "@mindkid/game-engine";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import {
  dragSlopCssPx,
  usePlayGesture,
} from "~/composables/play/use-play-gesture";

/** Task #313 B9 — ngưỡng kéo theo band tuổi: ngón rung của trẻ 3 tuổi vẫn là chạm. */
const CONTENT: GT001Content = {
  prompt: "Tìm quả táo màu đỏ",
  target_item: { item_id: "t", asset: { kind: "emoji", ref: "🍎" } },
  options: [
    { item_id: "ok", asset: { kind: "emoji", ref: "🍎" }, is_correct: true },
    { item_id: "bad1", asset: { kind: "emoji", ref: "🍌" }, is_correct: false },
    { item_id: "bad2", asset: { kind: "emoji", ref: "🍊" }, is_correct: false },
  ],
};
const DIFFICULTY: GT001Difficulty = {
  distractor_count: 2,
  hint_after_ms: 8000,
  allow_retry: true,
  shuffle_items: false,
};
const CONFIG: EngineConfig = {
  level_code: "GL-TEST-GT001",
  content_version: 1,
  template_code: "GT-001",
  content_pack: CONTENT,
  difficulty_params: DIFFICULTY,
  theme_id: "default",
  age_band: "3-4",
  reduced_motion: false,
  audio_enabled: false,
  layout_seed: 1,
};

function pointer(x: number, y: number, t: number): PointerEvent {
  return { pointerId: 1, clientX: x, clientY: y, timeStamp: t } as PointerEvent;
}

describe("Task #313 B9 — dragSlopCssPx", () => {
  it("band nhỏ tuổi có ngưỡng rộng hơn", () => {
    expect(dragSlopCssPx("3-4")).toBeGreaterThan(dragSlopCssPx("4-5"));
    expect(dragSlopCssPx("4-5")).toBeGreaterThan(dragSlopCssPx("5-6"));
    expect(dragSlopCssPx("3-4")).toBeGreaterThanOrEqual(20);
    expect(dragSlopCssPx("3-4")).toBeLessThanOrEqual(30);
  });
});

describe("Task #313 B9 — ngón rung là tap", () => {
  beforeAll(async () => {
    await preloadGameSession("GT-001");
  });

  function build(band: "3-4" | "5-6") {
    const session = createGameSessionSync(
      "GT-001",
      CONFIG
    ) as TemplateGameSession;
    const zones = computeStageZones({
      logicW: 960,
      logicH: 540,
      ageBand: band,
      cssPerLogic: 1,
      needsTray: false,
      needsCommit: false,
    });
    session.prepareRound(band, { w: 960, h: 540 }, zones.stage, undefined, 1);
    const onMiss = vi.fn();
    const engine = {
      activeSession: session,
      acceptingInput: true,
      scaffolding: { onMiss, onSuccess: vi.fn() },
      resetScaffolding: vi.fn(),
      audio: {
        playSnapSound: vi.fn(),
        playPopCelebrateSound: vi.fn(),
        playSoftFeedbackSound: vi.fn(),
        playTapSound: vi.fn(),
        playPromptAudio: vi.fn(),
        speakPrompt: vi.fn(),
      },
      renderSystem: {
        LOGIC_WIDTH: 960,
        LOGIC_HEIGHT: 540,
        toLogicPoint: (x: number, y: number) => ({ x, y }),
      },
    };
    const gesture = usePlayGesture({
      getEngine: () => engine as never,
      canvasRef: ref(null),
      onRoundWon: vi.fn(),
      getStageZones: () => zones,
      getAgeBand: () => band,
    });
    gesture.syncView();
    const bad = session.getView().entities.find((e) => e.id === "bad1");
    if (!bad) {
      throw new Error("Thiếu bad1");
    }
    const wobbleTap = () => {
      gesture.handlePointerDown(pointer(bad.x, bad.y, 0));
      gesture.handlePointerMove(pointer(bad.x + 10, bad.y, 1));
      gesture.handlePointerUp(pointer(bad.x + 20, bad.y, 2));
    };
    return { onMiss, wobbleTap };
  }

  it("3-4: rung 20px vẫn là tap, chấm là một lần sai", () => {
    const { onMiss, wobbleTap } = build("3-4");
    wobbleTap();
    expect(onMiss).toHaveBeenCalledTimes(1);
  });

  it("5-6: cùng cử động 20px là kéo, không phải tap", () => {
    const { onMiss, wobbleTap } = build("5-6");
    wobbleTap();
    expect(onMiss).not.toHaveBeenCalled();
  });
});
