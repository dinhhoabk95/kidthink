import {
  computeStageZones,
  createGameSessionSync,
  type EngineConfig,
  type GT001Content,
  type GT001Difficulty,
  preloadGameSession,
  type TemplateGameSession,
} from "@mindkid/game-engine";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { ref } from "vue";
import { usePlayGesture } from "~/composables/play/use-play-gesture";

/** Task #313 B6 — hai tap sai liên tiếp trong ~400ms chỉ tính một lần sai. */
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

describe("Task #313 B6 — cooldown sau verdict sai", () => {
  beforeAll(async () => {
    await preloadGameSession("GT-001");
  });
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  function build() {
    const session = createGameSessionSync(
      "GT-001",
      CONFIG
    ) as TemplateGameSession;
    const zones = computeStageZones({
      logicW: 960,
      logicH: 540,
      ageBand: "3-4",
      cssPerLogic: 1,
      needsTray: false,
      needsCommit: false,
    });
    session.prepareRound("3-4", { w: 960, h: 540 }, zones.stage, undefined, 1);
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
    });
    gesture.syncView();
    const bad = session.getView().entities.find((e) => e.id === "bad1");
    if (!bad) {
      throw new Error("Thiếu bad1");
    }
    const tapBad = () => {
      gesture.handlePointerDown(pointer(bad.x, bad.y, 0));
      gesture.handlePointerUp(pointer(bad.x, bad.y, 1));
    };
    return { onMiss, tapBad };
  }

  it("hai tap sai trong 400ms chỉ một miss", () => {
    const { onMiss, tapBad } = build();
    tapBad();
    vi.advanceTimersByTime(100);
    tapBad();
    expect(onMiss).toHaveBeenCalledTimes(1);
  });

  it("tap sai sau cooldown tính miss mới", () => {
    const { onMiss, tapBad } = build();
    tapBad();
    vi.advanceTimersByTime(450);
    tapBad();
    expect(onMiss).toHaveBeenCalledTimes(2);
  });
});
