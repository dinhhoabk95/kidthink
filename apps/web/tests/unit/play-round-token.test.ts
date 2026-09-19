import {
  type ActionResult,
  BaseGameSession,
  createGameSessionSync,
  type EngineConfig,
  type GameAction,
  type GT002Content,
  type GT002Difficulty,
  type NarrationTrigger,
  preloadGameSession,
  type RoundConfig,
  RoundRunner,
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
import {
  bindToRound,
  captureRoundToken,
  createTimerBag,
  scheduleRoundOpenNarration,
  scheduleWonRoundCompletion,
  skipCurrentRoundIfUnwon,
} from "~/composables/play/play-round-token";

class WinnableSession extends BaseGameSession {
  setupEntities(): void {
    /* noop */
  }
  validateAction(_a: GameAction): ActionResult {
    return { valid: true, feedback: "none" };
  }
  checkWinCondition(): boolean {
    return this.isWon;
  }
  win(): void {
    this.isWon = true;
  }
}

function makeRound(roundIndex: number): RoundConfig {
  return {
    round_index: roundIndex,
    content_pack: { prompt: `Câu hỏi vòng ${roundIndex + 1}` },
    difficulty_params: { item_count: 2 },
  };
}

function makeRunner(
  onPlayNarration?: (config: RoundConfig, trigger: NarrationTrigger) => void
): RoundRunner {
  return new RoundRunner({
    rounds: [makeRound(0), makeRound(1), makeRound(2)],
    sessionFactory: () => new WinnableSession(),
    gateOnPromptSettle: true,
    onPlayNarration: onPlayNarration ?? (() => undefined),
  });
}

function winCurrentRound(runner: RoundRunner): void {
  const session = runner.getCurrentSession();
  if (!(session instanceof WinnableSession)) {
    throw new Error("Thiếu session của vòng hiện tại");
  }
  session.win();
}

const ADVANCE_MS = 900;

/**
 * Hành động trễ của bề mặt chơi (tự sang vòng sau khi thắng, câu dẫn trễ
 * 600ms, settle câu dẫn) phải neo vào đúng runner + vòng đã sinh ra nó
 * (Task #274, E2 và E6). Không neo thì một hẹn giờ của vòng N đóng hoặc mở
 * cổng của vòng N+1.
 */
describe("play-round-token — hành động trễ neo vào vòng (Task #274 S1b, S1e)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("nhiều vòng: thắng vòng 1 → vòng 2 mở và câu dẫn vòng 2 được phát ở nhịp round_open", () => {
    const narrations: { roundIndex: number; trigger: NarrationTrigger }[] = [];
    const runner = makeRunner((config, trigger) => {
      narrations.push({ roundIndex: config.round_index, trigger });
    });
    const timers = createTimerBag();
    runner.startFirstRound();
    runner.notePromptSettled();

    winCurrentRound(runner);
    scheduleWonRoundCompletion(timers, () => runner, ADVANCE_MS);
    vi.advanceTimersByTime(ADVANCE_MS);

    expect(runner.getState().currentRoundIndex).toBe(1);
    expect(runner.getState().roundsCompleted).toBe(1);
    expect(runner.isPromptSettled()).toBe(false);
    expect(narrations).toEqual([
      { roundIndex: 0, trigger: "round_open" },
      { roundIndex: 1, trigger: "round_open" },
    ]);
  });

  it("thắng rồi bấm Bỏ qua trong lúc chờ: vòng đã thắng Cấm — NEVER bị ghi skipped, vòng kế Cấm — NEVER bị đóng oan", () => {
    const runner = makeRunner();
    const timers = createTimerBag();
    runner.startFirstRound();

    winCurrentRound(runner);
    scheduleWonRoundCompletion(timers, () => runner, ADVANCE_MS);
    const skipped = skipCurrentRoundIfUnwon(runner, "scaffold_exhausted");
    vi.advanceTimersByTime(ADVANCE_MS);

    expect(skipped).toBe(false);
    expect(runner.getState()).toMatchObject({
      currentRoundIndex: 1,
      roundsCompleted: 1,
      roundsSkipped: 0,
    });
  });

  it("vòng chưa thắng thì Bỏ qua vẫn bỏ qua như cũ", () => {
    const runner = makeRunner();
    runner.startFirstRound();

    const skipped = skipCurrentRoundIfUnwon(runner, "scaffold_exhausted");

    expect(skipped).toBe(true);
    expect(runner.getState()).toMatchObject({
      currentRoundIndex: 1,
      roundsSkipped: 1,
    });
  });

  it("vòng đã đổi trước khi hẹn giờ chạy: hẹn giờ cũ Cấm — NEVER đóng vòng mới", () => {
    const runner = makeRunner();
    const timers = createTimerBag();
    runner.startFirstRound();

    winCurrentRound(runner);
    scheduleWonRoundCompletion(timers, () => runner, ADVANCE_MS);
    runner.completeCurrentRound();
    vi.advanceTimersByTime(ADVANCE_MS);

    expect(runner.getState()).toMatchObject({
      currentRoundIndex: 1,
      roundsCompleted: 1,
    });
  });

  it("clearAll() (rời trang, chơi lại) huỷ mọi hẹn giờ đang chờ", () => {
    const runner = makeRunner();
    const timers = createTimerBag();
    runner.startFirstRound();

    winCurrentRound(runner);
    scheduleWonRoundCompletion(timers, () => runner, ADVANCE_MS);
    timers.clearAll();
    vi.advanceTimersByTime(ADVANCE_MS * 2);

    expect(runner.getState().currentRoundIndex).toBe(0);
  });

  it("câu dẫn mở vòng: phát sau nhịp chuông, settle mở cổng đúng vòng đó", () => {
    const runner = makeRunner();
    const timers = createTimerBag();
    runner.startFirstRound();
    const play = vi.fn((settle: () => void) => settle());
    const onSettled = vi.fn();

    scheduleRoundOpenNarration({
      timers,
      getRunner: () => runner,
      delayMs: 600,
      play,
      onSettled,
    });
    expect(play).not.toHaveBeenCalled();
    vi.advanceTimersByTime(600);

    expect(play).toHaveBeenCalledTimes(1);
    expect(onSettled).toHaveBeenCalledTimes(1);
  });

  it("câu dẫn của vòng cũ: không phát nếu vòng đổi trước nhịp chuông, không mở cổng vòng mới nếu vòng đổi trước khi đọc xong (Task #274, E6)", () => {
    const runner = makeRunner();
    const timers = createTimerBag();
    runner.startFirstRound();

    const playNever = vi.fn();
    scheduleRoundOpenNarration({
      timers,
      getRunner: () => runner,
      delayMs: 600,
      play: playNever,
      onSettled: vi.fn(),
    });
    runner.completeCurrentRound();
    vi.advanceTimersByTime(600);
    expect(playNever).not.toHaveBeenCalled();

    let settleLater: (() => void) | undefined;
    const onSettled = vi.fn();
    scheduleRoundOpenNarration({
      timers,
      getRunner: () => runner,
      delayMs: 600,
      play: (settle) => {
        settleLater = settle;
      },
      onSettled,
    });
    vi.advanceTimersByTime(600);
    runner.completeCurrentRound();
    settleLater?.();
    expect(onSettled).not.toHaveBeenCalled();
  });

  it("bindToRound: callback của vòng cũ bị bỏ qua sau khi vòng đổi hoặc runner bị thay", () => {
    const runner = makeRunner();
    let current: RoundRunner | null = runner;
    runner.startFirstRound();
    const settle = vi.fn();

    const staleAfterAdvance = bindToRound(
      captureRoundToken(runner),
      () => current,
      settle
    );
    runner.completeCurrentRound();
    staleAfterAdvance();
    expect(settle).not.toHaveBeenCalled();

    const staleAfterReplace = bindToRound(
      captureRoundToken(runner),
      () => current,
      settle
    );
    current = makeRunner();
    staleAfterReplace();
    expect(settle).not.toHaveBeenCalled();

    current = runner;
    bindToRound(captureRoundToken(runner), () => current, settle)();
    expect(settle).toHaveBeenCalledTimes(1);
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

/**
 * GT-002 chấm tập chọn chỉ khi trẻ bấm xong (`BR-E002-02`). Trước Task #275
 * S1a, chọn đủ tập đúng làm session báo "đã thắng" dù chưa nộp: bề mặt chơi
 * không gọi `onRoundWon` (chọn/bỏ chọn trả `feedback: none`) mà "Bỏ qua" cũng
 * bị `skipCurrentRoundIfUnwon` từ chối — trẻ kẹt ở vòng đó.
 */
describe("skipCurrentRoundIfUnwon — GT-002 thật (Task #275 S1a)", () => {
  beforeAll(async () => {
    await preloadGameSession("GT-002");
  });

  it("chọn đủ tập đúng bằng chạm, chưa bấm xong → vẫn bỏ qua được vòng", () => {
    const runner = new RoundRunner({
      rounds: [
        {
          round_index: 0,
          content_pack: GT002_CONTENT,
          // `item_count` là trường cấp vòng mà RoundRunner đòi (BR-LDC-02),
          // không thuộc hợp đồng độ khó riêng của GT-002.
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
    const session = runner.getCurrentSession();
    const entities = session?.getView?.().entities ?? [];
    const correctIds = new Set(
      GT002_CONTENT.items.filter((i) => i.is_correct).map((i) => i.item_id)
    );
    const correctEntities = entities.filter((e) => correctIds.has(e.id));
    expect(correctEntities).toHaveLength(correctIds.size);

    for (const entity of correctEntities) {
      session?.dispatch?.({
        type: "tap",
        x: entity.x,
        y: entity.y,
        timeMs: 0,
      });
    }

    expect(skipCurrentRoundIfUnwon(runner, "user")).toBe(true);
  });
});
