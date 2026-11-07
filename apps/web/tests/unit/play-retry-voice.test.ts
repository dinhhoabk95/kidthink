import {
  computeStageZones,
  createGameSessionSync,
  type EngineConfig,
  type GT001Content,
  type GT001Difficulty,
  preloadGameSession,
  RETRY_ENCOURAGEMENTS,
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

/** Task #313 Phase 2 — sai thì nói câu khích lệ xoay vòng (`BR-FBK-13`) và đọc pill (`BR-PNR-12`). */
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

describe("Task #313 Phase 2 — giọng khi chưa đúng", () => {
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
    const speakEncouragement = vi.fn();
    const speakPrompt = vi.fn();
    const engine = {
      activeSession: session,
      acceptingInput: true,
      scaffolding: { onMiss: vi.fn(), onSuccess: vi.fn() },
      resetScaffolding: vi.fn(),
      audio: {
        playSnapSound: vi.fn(),
        playPopCelebrateSound: vi.fn(),
        playSoftFeedbackSound: vi.fn(),
        playTapSound: vi.fn(),
        playPromptAudio: vi.fn(),
        speakPrompt,
        speakEncouragement,
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
    const find = (id: string) => {
      const entity = session.getView().entities.find((e) => e.id === id);
      if (!entity) {
        throw new Error(`Thiếu ${id}`);
      }
      return entity;
    };
    const tap = (id: string) => {
      const e = find(id);
      gesture.handlePointerDown(pointer(e.x, e.y, 0));
      gesture.handlePointerUp(pointer(e.x, e.y, 1));
    };
    return { session, speakEncouragement, speakPrompt, tap };
  }

  it("tap đúng không nói câu khích lệ", () => {
    const { speakEncouragement, tap } = build();
    tap("ok");
    expect(speakEncouragement).not.toHaveBeenCalled();
  });

  it("tap sai nói một câu khích lệ trong danh sách", () => {
    const { speakEncouragement, speakPrompt, tap } = build();
    tap("bad1");
    // Tên vật vừa chạm đọc trước; câu khích lệ chỉ tới khi tên đọc xong.
    for (const call of speakPrompt.mock.calls) {
      const onDone = call[1] as (() => void) | undefined;
      onDone?.();
    }
    expect(speakEncouragement).toHaveBeenCalledTimes(1);
    const clip = speakEncouragement.mock.calls[0]?.[0] as { text: string };
    expect(RETRY_ENCOURAGEMENTS).toContain(clip.text);
  });

  it("câu khích lệ không cắt ngang tên vật đang đọc", () => {
    const { speakEncouragement, speakPrompt, tap } = build();
    tap("bad1");
    expect(speakPrompt).toHaveBeenCalled();
    expect(speakEncouragement).not.toHaveBeenCalled();
  });

  it("hai lần sai cách nhau quá cooldown xoay sang câu khác", () => {
    const { speakEncouragement, speakPrompt, tap } = build();
    const flush = () => {
      for (const call of speakPrompt.mock.calls) {
        (call[1] as (() => void) | undefined)?.();
      }
      speakPrompt.mockClear();
    };
    tap("bad1");
    flush();
    vi.advanceTimersByTime(450);
    tap("bad2");
    flush();
    const texts = speakEncouragement.mock.calls.map(
      (c) => (c[0] as { text: string }).text
    );
    expect(texts).toHaveLength(2);
    expect(texts[0]).not.toBe(texts[1]);
  });

  it("hai lần sai trong cooldown chỉ nói một câu", () => {
    const { speakEncouragement, speakPrompt, tap } = build();
    tap("bad1");
    vi.advanceTimersByTime(100);
    tap("bad2");
    for (const call of speakPrompt.mock.calls) {
      (call[1] as (() => void) | undefined)?.();
    }
    expect(speakEncouragement).toHaveBeenCalledTimes(1);
  });

  it("engine có lời đọc cho pill thì đọc lời đó thay vì câu khích lệ chung", () => {
    const { session, speakEncouragement, speakPrompt, tap } = build();
    vi.spyOn(session, "takePillNarration").mockReturnValue(
      "Toa thứ 2 chưa đúng"
    );
    tap("bad1");
    for (const call of [...speakPrompt.mock.calls]) {
      (call[1] as (() => void) | undefined)?.();
    }
    expect(speakPrompt).toHaveBeenCalledWith("Toa thứ 2 chưa đúng");
    expect(speakEncouragement).not.toHaveBeenCalled();
  });
});
