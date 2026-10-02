import type { AgeBand } from "@mindkid/game-engine";
import {
  ACTION_CORRECT,
  ACTION_RETRY,
  type ActionResult,
  createGameSessionSync,
  type EngineConfig,
  type GameAction,
  type GT002Content,
  type GT002Difficulty,
  preloadGameSession,
  RoundRunner,
  type Slot,
  TemplateGameSession,
  type ViewEntity,
} from "@mindkid/game-engine";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { usePlayGesture } from "~/composables/play/use-play-gesture";

class FakeSession extends TemplateGameSession<
  Record<string, number>,
  Record<string, number>
> {
  readonly dispatched: GameAction[] = [];

  override setupEntities(): void {
    /* noop */
  }

  override validateAction(action: GameAction): ActionResult {
    this.dispatched.push(action);
    // Template kéo-thả: chạm là sai, chỉ `drop` mới đúng.
    return action.type === "drop_item" ? ACTION_CORRECT : ACTION_RETRY;
  }

  override checkWinCondition(): boolean {
    return false;
  }

  override toAction(gesture: { type: string }): GameAction | null {
    return gesture.type === "drop"
      ? { type: "drop_item", data: {} }
      : { type: "tap_item", data: {} };
  }

  protected override computeSlots(_band: AgeBand): readonly Slot[] {
    return [];
  }
}

/**
 * Mô phỏng GT-001 (chạm-chọn đơn): `toAction` trả null khi chạm ngoài mọi thẻ
 * hoặc khi đã thắng — giống hệt `TemplateGameSession.dispatch` sẽ trả
 * `ACTION_IGNORED` (feedback "none") cho cả hai trường hợp đó.
 */
class FakeTapSelectSession extends TemplateGameSession<
  Record<string, number>,
  Record<string, number>
> {
  readonly dispatched: GameAction[] = [];

  override setupEntities(): void {
    /* noop */
  }

  override toAction(gesture: {
    type: string;
    x?: number;
    y?: number;
  }): GameAction | null {
    if (gesture.type !== "tap") {
      return null;
    }
    const gx = gesture.x ?? -1000;
    const gy = gesture.y ?? -1000;
    if (Math.hypot(gx - 100, gy - 100) <= 40) {
      return { type: "select_item", data: { correct: true } };
    }
    if (Math.hypot(gx - 300, gy - 100) <= 40) {
      return { type: "select_item", data: { correct: false } };
    }
    return null;
  }

  override validateAction(action: GameAction): ActionResult {
    this.dispatched.push(action);
    const data = action.data as { correct: boolean };
    return data.correct ? ACTION_CORRECT : ACTION_RETRY;
  }

  private won = false;

  /** Đặt trạng thái đã thắng thẳng, không qua dispatch — mô phỏng vòng đã đóng. */
  markWon(): void {
    this.won = true;
  }

  override checkWinCondition(): boolean {
    return this.won;
  }

  protected override computeSlots(_band: AgeBand): readonly Slot[] {
    return [];
  }
}

type FeedbackSpy = (
  kind: "success" | "retry",
  point: { readonly x: number; readonly y: number }
) => void;

function makeTapSelectHarness(
  entities: { id: string; role: string }[],
  onFeedback?: FeedbackSpy
) {
  const session = new FakeTapSelectSession({}, {});
  const onMiss = vi.fn();
  const onSuccess = vi.fn();
  const speakPrompt = vi.fn();
  const engine = {
    activeSession: session,
    acceptingInput: true,
    audio: {
      playSnapSound: vi.fn(),
      playPopCelebrateSound: vi.fn(),
      playSoftFeedbackSound: vi.fn(),
      speakPrompt,
    },
    scaffolding: { onMiss, onSuccess },
    renderSystem: { LOGIC_WIDTH: 960, LOGIC_HEIGHT: 540 },
  };

  const gesture = usePlayGesture({
    getEngine: () => engine as never,
    canvasRef: ref(null),
    onRoundWon: vi.fn(),
    onFeedback,
  });

  gesture.viewEntities.value = entities.map((e, index) => ({
    id: e.id,
    role: e.role,
    x: 100 + index * 200,
    y: 100,
    w: 80,
    h: 80,
    spokenLabel: `nhãn-${e.id}`,
  })) as never;

  return { gesture, session, onMiss, onSuccess, speakPrompt, engine };
}

function makeHarness(
  entities: { id: string; role: string }[],
  onFeedback?: FeedbackSpy
) {
  const session = new FakeSession({}, {});
  const onMiss = vi.fn();
  const onSuccess = vi.fn();
  const engine = {
    activeSession: session,
    acceptingInput: true,
    audio: {
      playSnapSound: vi.fn(),
      playPopCelebrateSound: vi.fn(),
      playSoftFeedbackSound: vi.fn(),
    },
    scaffolding: { onMiss, onSuccess },
    renderSystem: { LOGIC_WIDTH: 960, LOGIC_HEIGHT: 540 },
  };

  const gesture = usePlayGesture({
    getEngine: () => engine as never,
    canvasRef: ref(null),
    onRoundWon: vi.fn(),
    onFeedback,
  });

  gesture.viewEntities.value = entities.map((e, index) => ({
    id: e.id,
    role: e.role,
    x: index * 100,
    y: 100,
    w: 80,
    h: 80,
  })) as never;

  return { gesture, session, onMiss, onSuccess };
}

describe("usePlayGesture — đường bàn phím (Task #260 I11)", () => {
  it("bề mặt kéo-thả: chọn nguồn chỉ stage, Cấm — NEVER tính là chạm sai", () => {
    const { gesture, session, onMiss } = makeHarness([
      { id: "src-1", role: "source" },
      { id: "dst-1", role: "target" },
    ]);

    const source = gesture.viewEntities.value[0];
    if (!source) {
      throw new Error("thiếu entity nguồn");
    }
    gesture.handleAccessibleEntityTap(source);

    expect(gesture.stagedEntityId.value).toBe("src-1");
    expect(session.dispatched).toHaveLength(0);
    expect(onMiss).not.toHaveBeenCalled();
  });

  it("bề mặt kéo-thả: Enter trên ô đích phát drop", () => {
    const { gesture, session } = makeHarness([
      { id: "src-1", role: "source" },
      { id: "dst-1", role: "target" },
    ]);

    const [source, target] = gesture.viewEntities.value;
    if (!(source && target)) {
      throw new Error("thiếu entity");
    }
    gesture.handleAccessibleEntityTap(source);
    gesture.handleAccessibleEntityTap(target);

    expect(session.dispatched.map((a) => a.type)).toEqual(["drop_item"]);
    expect(gesture.stagedEntityId.value).toBeNull();
  });

  it("đổi nguồn đang chọn trên bề mặt kéo-thả cũng không sinh chạm sai", () => {
    const { gesture, session, onMiss } = makeHarness([
      { id: "src-1", role: "source" },
      { id: "src-2", role: "source" },
      { id: "dst-1", role: "target" },
    ]);

    const [first, second] = gesture.viewEntities.value;
    if (!(first && second)) {
      throw new Error("thiếu entity");
    }
    gesture.handleAccessibleEntityTap(first);
    gesture.handleAccessibleEntityTap(second);

    expect(gesture.stagedEntityId.value).toBe("src-2");
    expect(session.dispatched).toHaveLength(0);
    expect(onMiss).not.toHaveBeenCalled();
  });

  it("bề mặt chạm-chọn (không có ô đích): Enter vẫn gửi tap ngay", () => {
    const { gesture, session } = makeHarness([
      { id: "opt-1", role: "source" },
      { id: "opt-2", role: "source" },
    ]);

    const option = gesture.viewEntities.value[0];
    if (!option) {
      throw new Error("thiếu entity");
    }
    gesture.handleAccessibleEntityTap(option);

    expect(session.dispatched.map((a) => a.type)).toEqual(["tap_item"]);
  });
});

describe("usePlayGesture — chạm ngoài slot và chạm lại minh hoạ (Task #273)", () => {
  it("chạm ra ngoài mọi thẻ (feedback none) Cấm — NEVER tính là chạm sai", () => {
    const { gesture, session, onMiss, engine } = makeTapSelectHarness([
      { id: "opt-1", role: "source" },
      { id: "opt-2", role: "source" },
    ]);

    gesture.dispatchGesture({ type: "tap", x: 900, y: 900, timeMs: 0 });

    expect(session.dispatched).toHaveLength(0);
    expect(onMiss).not.toHaveBeenCalled();
    expect(engine.audio.playSoftFeedbackSound).not.toHaveBeenCalled();
    expect(engine.audio.speakPrompt).not.toHaveBeenCalled();
  });

  it("chạm lại vào thẻ đã thắng vẫn đọc lại từ khoá, không tính miss mới", () => {
    const { gesture, session, onMiss, onSuccess, speakPrompt } =
      makeTapSelectHarness([
        { id: "opt-1", role: "source" },
        { id: "opt-2", role: "source" },
      ]);
    session.markWon();

    gesture.dispatchGesture({ type: "tap", x: 100, y: 100, timeMs: 0 });

    expect(session.dispatched).toHaveLength(0); // toAction chưa từng chạy
    expect(speakPrompt).toHaveBeenCalledWith("nhãn-opt-1");
    expect(onMiss).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("chạm trúng thẻ sai vẫn đọc tên thẻ, phát âm mềm và tính miss (hành vi cũ giữ nguyên)", () => {
    const { gesture, session, onMiss, speakPrompt, engine } =
      makeTapSelectHarness([
        { id: "opt-1", role: "source" },
        { id: "opt-2", role: "source" },
      ]);

    gesture.dispatchGesture({ type: "tap", x: 300, y: 100, timeMs: 0 });

    expect(session.dispatched).toHaveLength(1);
    expect(speakPrompt).toHaveBeenCalledWith("nhãn-opt-2");
    expect(engine.audio.playSoftFeedbackSound).toHaveBeenCalledTimes(1);
    expect(onMiss).toHaveBeenCalledTimes(1);
  });

  it("chạm trúng thẻ đúng vẫn đọc tên và báo thành công", () => {
    const { gesture, session, onSuccess, speakPrompt, engine } =
      makeTapSelectHarness([
        { id: "opt-1", role: "source" },
        { id: "opt-2", role: "source" },
      ]);

    gesture.dispatchGesture({ type: "tap", x: 100, y: 100, timeMs: 0 });

    expect(session.dispatched).toHaveLength(1);
    expect(speakPrompt).toHaveBeenCalledWith("nhãn-opt-1");
    expect(engine.audio.playSnapSound).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("session tự khoá (GT-000 đang đọc câu hỏi của bước): chạm bị nuốt trọn, Cấm — NEVER đọc nhãn cắt ngang câu hỏi (BR-E000-12)", () => {
    const { gesture, session, onMiss, speakPrompt } = makeTapSelectHarness([
      { id: "opt-1", role: "source" },
      { id: "opt-2", role: "source" },
    ]);
    session.isAcceptingInput = () => false;

    gesture.dispatchGesture({ type: "tap", x: 100, y: 100, timeMs: 0 });

    expect(session.dispatched).toHaveLength(0);
    expect(speakPrompt).not.toHaveBeenCalled();
    expect(onMiss).not.toHaveBeenCalled();
  });

  it("từ khoá có mp3: phát mp3 trước, TTS chỉ khi mp3 lỗi (Task #274 S7b)", () => {
    const { gesture, speakPrompt, engine } = makeTapSelectHarness([
      { id: "opt-1", role: "source" },
      { id: "opt-2", role: "source" },
    ]);
    let failMp3: (() => void) | undefined;
    const playPromptAudio = vi.fn(
      (_ref: string, _onEnd?: () => void, onError?: () => void) => {
        failMp3 = onError;
      }
    );
    Object.assign(engine.audio, { playPromptAudio });
    gesture.viewEntities.value = gesture.viewEntities.value.map((e) =>
      e.id === "opt-1" ? { ...e, spokenAudioPath: "/audio/opt-1.mp3" } : e
    );

    gesture.dispatchGesture({ type: "tap", x: 100, y: 100, timeMs: 0 });

    expect(playPromptAudio).toHaveBeenCalledWith(
      "/audio/opt-1.mp3",
      undefined,
      expect.any(Function)
    );
    expect(speakPrompt).not.toHaveBeenCalled();

    failMp3?.();
    expect(speakPrompt).toHaveBeenCalledWith("nhãn-opt-1");
  });

  it("chạm lệch trong dung sai 24px của engine vẫn đọc lại từ khoá — cùng hình học chạm với toAction() (Task #274 S1d)", () => {
    const { gesture, speakPrompt } = makeTapSelectHarness([
      { id: "opt-1", role: "source" },
      { id: "opt-2", role: "source" },
    ]);

    // Entity 80×80 tại (100,100): bán kính 40 + 20px lệch — trong 24px của
    // engine, ngoài 10px web từng tự chọn.
    gesture.dispatchGesture({ type: "tap", x: 160, y: 100, timeMs: 0 });

    expect(speakPrompt).toHaveBeenCalledWith("nhãn-opt-1");
  });

  it("engine.acceptingInput = false (đang chờ câu dẫn đọc xong): chạm bị nuốt hoàn toàn, Cấm — NEVER tính điểm/sai (BR-PNR-11)", () => {
    const { gesture, session, onMiss, onSuccess, speakPrompt, engine } =
      makeTapSelectHarness([
        { id: "opt-1", role: "source" },
        { id: "opt-2", role: "source" },
      ]);
    engine.acceptingInput = false;

    gesture.dispatchGesture({ type: "tap", x: 100, y: 100, timeMs: 0 });

    expect(session.dispatched).toHaveLength(0);
    expect(speakPrompt).not.toHaveBeenCalled();
    expect(onMiss).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });
});

const GT002_CONTENT: GT002Content = {
  prompt: "Bé hãy chọn tất cả các loại quả màu đỏ nhé!",
  target_criterion: "Màu đỏ",
  items: [
    { item_id: "apple", asset: { kind: "emoji", ref: "🍎" }, is_correct: true },
    {
      item_id: "strawberry",
      asset: { kind: "emoji", ref: "🍓" },
      is_correct: true,
    },
    {
      item_id: "banana",
      asset: { kind: "emoji", ref: "🍌" },
      is_correct: false,
    },
    {
      item_id: "grape",
      asset: { kind: "emoji", ref: "🍇" },
      is_correct: false,
    },
  ],
};

const GT002_DIFFICULTY: GT002Difficulty = {
  distractor_count: 2,
  target_count: 2,
  hint_after_ms: 8000,
  allow_retry: true,
};

const GT002_ENGINE_CONFIG: EngineConfig = {
  level_code: "GL-TEST-GT002",
  content_version: 1,
  template_code: "GT-002",
  content_pack: GT002_CONTENT,
  difficulty_params: GT002_DIFFICULTY,
  theme_id: "default",
  age_band: "4-5",
  reduced_motion: false,
  audio_enabled: false,
};

const COMMIT_ENTITY_ID = "commit:done";

function makeGt002Harness() {
  const runner = new RoundRunner({
    rounds: [
      {
        round_index: 0,
        content_pack: GT002_CONTENT,
        difficulty_params: {
          ...GT002_DIFFICULTY,
          item_count: GT002_CONTENT.items.length,
        },
      },
    ],
    ageBand: "4-5",
    layoutSeed: 1,
    sessionFactory: (contentPack, difficultyParams, roundSeed) =>
      createGameSessionSync("GT-002", {
        ...GT002_ENGINE_CONFIG,
        content_pack: contentPack,
        difficulty_params: difficultyParams,
        layout_seed: roundSeed,
      }),
    onPlayNarration: () => undefined,
  });
  runner.startFirstRound();

  const onRoundWon = vi.fn();
  const engine = {
    activeSession: runner.getCurrentSession(),
    acceptingInput: true,
    audio: {
      playSnapSound: vi.fn(),
      playPopCelebrateSound: vi.fn(),
      playSoftFeedbackSound: vi.fn(),
      playPromptAudio: vi.fn(),
      speakPrompt: vi.fn(),
    },
    scaffolding: { onMiss: vi.fn(), onSuccess: vi.fn() },
    renderSystem: { LOGIC_WIDTH: 960, LOGIC_HEIGHT: 540 },
  };

  const gesture = usePlayGesture({
    getEngine: () => engine as never,
    canvasRef: ref(null),
    onRoundWon,
  });
  gesture.syncView();

  function entityById(id: string): ViewEntity {
    const entity = gesture.viewEntities.value.find((e) => e.id === id);
    if (!entity) {
      throw new Error(`Thiếu entity ${id}`);
    }
    return entity;
  }

  function tapAllCorrectItems(): void {
    for (const item of GT002_CONTENT.items.filter((i) => i.is_correct)) {
      const entity = entityById(item.item_id);
      gesture.dispatchGesture({
        type: "tap",
        x: entity.x,
        y: entity.y,
        timeMs: 0,
      });
    }
  }

  return { gesture, onRoundWon, engine, entityById, tapAllCorrectItems };
}

/**
 * GT-002 nộp bài bằng nút Xong vẽ trên canvas (`D-275-1`): bề mặt web không
 * phát `commit` cho engine này, nên nếu `toAction()` không nhận chạm vào nút
 * thì trẻ không có đường nào thắng — chỉ harness engine gửi thẳng `commit`.
 */
describe("usePlayGesture — nút Xong của GT-002 thật (Task #275 S1b)", () => {
  beforeAll(async () => {
    await preloadGameSession("GT-002");
  });

  it("chọn đủ tập đúng rồi chạm nút Xong: báo thắng đúng một lần", () => {
    const { gesture, onRoundWon, entityById, tapAllCorrectItems } =
      makeGt002Harness();
    tapAllCorrectItems();
    expect(onRoundWon).not.toHaveBeenCalled();

    const button = entityById(COMMIT_ENTITY_ID);
    gesture.dispatchGesture({
      type: "tap",
      x: button.x,
      y: button.y,
      timeMs: 0,
    });

    expect(onRoundWon).toHaveBeenCalledTimes(1);
  });

  it("đường bàn phím: Enter trên nút Xong cho cùng kết quả", () => {
    const { onRoundWon, entityById, tapAllCorrectItems, gesture } =
      makeGt002Harness();
    tapAllCorrectItems();

    gesture.handleAccessibleEntityTap(entityById(COMMIT_ENTITY_ID));

    expect(onRoundWon).toHaveBeenCalledTimes(1);
  });
});

describe("usePlayGesture — lớp phủ phản hồi (#279, BR-FBK-05, BR-FBK-11)", () => {
  it("chạm đúng báo success tại đúng điểm chạm", () => {
    const onFeedback = vi.fn<FeedbackSpy>();
    const { gesture } = makeTapSelectHarness([], onFeedback);

    gesture.dispatchGesture({ type: "tap", x: 100, y: 100, timeMs: 0 });

    expect(onFeedback).toHaveBeenCalledExactlyOnceWith("success", {
      x: 100,
      y: 100,
    });
  });

  it("chạm chưa đúng báo retry tại đúng điểm chạm", () => {
    const onFeedback = vi.fn<FeedbackSpy>();
    const { gesture } = makeTapSelectHarness([], onFeedback);

    gesture.dispatchGesture({ type: "tap", x: 300, y: 100, timeMs: 0 });

    expect(onFeedback).toHaveBeenCalledExactlyOnceWith("retry", {
      x: 300,
      y: 100,
    });
  });

  it("cử chỉ bị nuốt (feedback none) không phát phản hồi", () => {
    const onFeedback = vi.fn<FeedbackSpy>();
    const { gesture } = makeTapSelectHarness([], onFeedback);

    gesture.dispatchGesture({ type: "tap", x: 700, y: 400, timeMs: 0 });

    expect(onFeedback).not.toHaveBeenCalled();
  });

  it("thả đúng báo success tại điểm thả, không phải điểm nhấc", () => {
    const onFeedback = vi.fn<FeedbackSpy>();
    const { gesture } = makeHarness([], onFeedback);

    gesture.dispatchGesture({
      type: "drop",
      fromX: 10,
      fromY: 20,
      toX: 400,
      toY: 250,
      timeMs: 0,
    });

    expect(onFeedback).toHaveBeenCalledExactlyOnceWith("success", {
      x: 400,
      y: 250,
    });
  });
});
