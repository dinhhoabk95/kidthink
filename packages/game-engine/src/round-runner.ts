/**
 * RoundRunner — orchestrates a sequence of rounds within a game level.
 *
 * Wraps TemplateGameSession (does NOT modify GameSession interface — BR-RSP-03).
 * For each round: factory → setupEntities → play → destroy.
 *
 * Emits round_started and round_completed for EVERY round, including
 * single-round sets (BR-RSP-02).
 *
 * Zero network requests during play (BR-ENG-03).
 */

import type { AgeBand } from "./contracts/types";
import {
  type ActionResult,
  type GameAction,
  type GameActionValue,
  type GameSession,
  type TelemetryEvent,
  TemplateGameSession,
} from "./game-session";
import type { LogicSpace } from "./layout/constants.js";
import type { ZoneRect } from "./layout/stage-zones.js";
import { AudioController } from "./systems/audio-controller";

export interface RoundConfig {
  round_index: number;
  instruction?: string | null;
  instruction_audio_path?: string | null;
  narration_template?: string | null;
  content_pack: Record<string, GameActionValue> | null | undefined;
  difficulty_params: Record<string, GameActionValue> | null | undefined;
}

export type SessionFactory = (
  contentPack: Record<string, GameActionValue> | null | undefined,
  difficultyParams: Record<string, GameActionValue> | null | undefined,
  layoutSeed: number
) => GameSession;

/** Vì sao câu dẫn được phát: mở vòng, hay trẻ bấm "Nghe lại". */
export type NarrationTrigger = "round_open" | "replay";

export interface RoundRunnerOptions {
  rounds: RoundConfig[];
  sessionFactory: SessionFactory;
  audioController?: AudioController;
  /**
   * Chủ sở hữu duy nhất của việc phát câu dẫn (BR-PNR-03).
   *
   * Bề mặt chơi thật truyền hàm này để nó phát câu dẫn bằng đường phát của
   * chính nó — đường duy nhất có đủ ba bậc dự phòng. Khi có hàm này,
   * `RoundRunner` Cấm — NEVER tự phát thêm một lần nữa: hai nguồn phát song
   * song cho ra hai giọng chồng nhau trên cùng một vòng.
   */
  onPlayNarration?: (
    roundConfig: RoundConfig,
    trigger: NarrationTrigger
  ) => void;
  /**
   * Bậc 3 của thứ tự dự phòng (BR-PNR-06): tín hiệu thị giác khi không phát
   * được tiếng. Chỉ dùng cho đường phát nội bộ, tức khi không có
   * `onPlayNarration`.
   */
  onNarrationFallbackCue?: () => void;
  /** Band tuổi — truyền tới prepareRound. Mặc định '4-5'. */
  ageBand?: AgeBand;
  layoutSeed?: number;
  logicSpace?: LogicSpace;
  /** Vùng sân khấu được cấp bởi shell (`BR-PSZ-01`, Task #277 S3). */
  stageRect?: ZoneRect;
  /** Vùng khay được cấp bởi shell khi session `needsTray` (Task #277 S5). */
  trayRect?: ZoneRect;
  /** Px CSS trên một logic px do shell đo (`BR-PSZ-04`, Task #283 N). */
  cssPerLogic?: number;
  onRoundStarted?: (roundIndex: number, roundConfig: RoundConfig) => void;
  onRoundCompleted?: (roundIndex: number, wasSkipped: boolean) => void;
  onAllRoundsCompleted?: () => void;
  /**
   * Trì hoãn đồng hồ vòng (`duration_ms` của `round_completed`/`round_skipped`)
   * và hẹn giờ trợ giúp (`hint_after_ms`) tới khi gọi `notePromptSettled()`,
   * thay vì tính từ lúc mở vòng (`BR-PNR-11`, Task #273).
   *
   * Mặc định `false` — giữ đúng hành vi cũ cho mọi lời gọi hiện có (test,
   * harness không gắn cổng câu dẫn). Bề mặt chơi thật khai `true` và gọi
   * `notePromptSettled()` khi câu dẫn của chính nó (đường `onPlayNarration`)
   * phát xong hoặc quá hạn dự phòng.
   */
  gateOnPromptSettle?: boolean;
}

export interface RoundRunnerState {
  currentRoundIndex: number;
  roundsTotal: number;
  /**
   * Số vòng đã **hoàn thành**, không phải số vòng đúng ngay lần đầu.
   *
   * Cấm — NEVER gửi giá trị này lên server, và Cấm — NEVER dùng nó làm
   * `rounds_correct` của mục 7.1 `scoring-and-result.md`: định nghĩa ở đó là
   * vòng có `answer_correct` **ở lần thử đầu**, còn biến này tăng ở mọi
   * `completeCurrentRound()` bất kể trẻ thử mấy lần. `BR-RSP-12` bắt server tự
   * dựng `rounds_total` và `rounds_correct` từ chuỗi event.
   *
   * Tên cũ của nó trùng tên chỉ số của server, và cái tên đó là một lời mời gửi
   * nó đi.
   */
  roundsCompleted: number;
  roundsSkipped: number;
  isFinished: boolean;
  hintCountTotal: number;
}

/** Event vòng đời có hai nguồn (engine và session) nên chỉ giữ một lần cả phiên. */
const LIFECYCLE_EVENTS: ReadonlySet<string> = new Set([
  "game_started",
  "game_completed",
]);

/**
 * `round_started`/`round_completed` do runner phát đúng một lần mỗi vòng
 * (`BR-RSP-12`); `reconstructRounds` đếm `round_started` làm `rounds_total`, nên
 * bản session tự ghi (GT-026 …) bị bỏ — nếu không, `first_try_ratio` bị chia
 * cho số vòng gấp đôi và 24/24 đúng vẫn chỉ được 2 sao.
 */
const RUNNER_OWNED_EVENTS: ReadonlySet<string> = new Set([
  "round_started",
  "round_completed",
]);

/**
 * `item_count` của một vòng. GT-000 (concept-intro) dùng `difficulty_fixed`,
 * schema strict không có trường này — tính là 1.
 */
function resolveItemCount(config: RoundConfig): number | undefined {
  const params = config.difficulty_params;
  if (
    typeof params === "object" &&
    params !== null &&
    "item_count" in params &&
    typeof params.item_count === "number"
  ) {
    return params.item_count;
  }
  const isConceptIntro =
    typeof config.content_pack === "object" &&
    config.content_pack !== null &&
    "concept" in config.content_pack;
  return isConceptIntro ? 1 : undefined;
}

export class RoundRunner {
  private readonly rounds: RoundConfig[];
  private readonly sessionFactory: SessionFactory;
  private readonly ageBand: AgeBand;
  private readonly layoutSeed: number;
  private readonly audioController: AudioController;
  private readonly ownsAudioController: boolean;
  /** Tăng mỗi lần mở vòng — callback câu dẫn của vòng cũ tự bỏ qua. */
  private narrationToken = 0;
  private readonly onPlayNarration?: (
    roundConfig: RoundConfig,
    trigger: NarrationTrigger
  ) => void;
  private readonly onNarrationFallbackCue?: () => void;
  private readonly onRoundStarted?: (
    roundIndex: number,
    roundConfig: RoundConfig
  ) => void;
  private readonly onRoundCompleted?: (
    roundIndex: number,
    wasSkipped: boolean
  ) => void;
  private readonly onAllRoundsCompleted?: () => void;

  private readonly gateOnPromptSettle: boolean;

  private currentRoundIndex = 0;
  private roundsCompleted = 0;
  private roundsSkipped = 0;
  private hintCountTotal = 0;
  private isFinished = false;
  private currentSession: GameSession | null = null;
  private readonly allEvents: TelemetryEvent[] = [];
  private readonly collectedEvents = new Set<TelemetryEvent>();
  private readonly collectedEventSeqs = new Set<number>();
  private readonly lifecycleEventsSeen = new Set<string>();
  private sessionStartMs = 0;
  /** Số lần thử đã ghi ở vòng hiện tại (`attempt_index` của `answer_*`). */
  private attemptIndex = 0;
  /** Số `answer_*` session tự phát mà runner đã thấy ở vòng hiện tại. */
  private sessionAnswerEventsSeen = 0;
  /** Lúc bắt đầu pause hiện tại; `null` khi không pause (BR-HPL-07). */
  private pausedSinceMs: number | null = null;
  /** Tổng thời gian pause đã xong của vòng hiện tại. */
  private pausedTotalMs = 0;
  private logicSpace?: LogicSpace;
  private stageRect?: ZoneRect;
  private trayRect?: ZoneRect;
  private cssPerLogic?: number;
  /** `true` khi chưa cần chờ (gate tắt) hoặc câu dẫn vòng hiện tại đã đọc xong. */
  private promptSettled = true;

  constructor(options: RoundRunnerOptions) {
    if (options.rounds.length === 0) {
      throw new Error("RoundRunner requires at least one round");
    }

    this.rounds = [...options.rounds].sort(
      (a, b) => a.round_index - b.round_index
    );
    // Kiểm hết từ đầu: ném giữa `advanceToNextRound` để lại runner ở trạng
    // thái không phục hồi được (`currentSession = null`, `isFinished = false`).
    for (const [index, config] of this.rounds.entries()) {
      if (resolveItemCount(config) === undefined) {
        throw new Error(
          `Round ${index} thiếu difficulty_params.item_count bắt buộc (BR-LDC-02).`
        );
      }
    }
    this.sessionFactory = options.sessionFactory;
    this.ownsAudioController = !options.audioController;
    this.audioController = options.audioController ?? new AudioController();
    this.onPlayNarration = options.onPlayNarration;
    this.onNarrationFallbackCue = options.onNarrationFallbackCue;
    this.ageBand = options.ageBand ?? "4-5";
    this.layoutSeed = options.layoutSeed ?? 0;
    this.logicSpace = options.logicSpace;
    this.stageRect = options.stageRect;
    this.trayRect = options.trayRect;
    this.cssPerLogic = options.cssPerLogic;
    this.onRoundStarted = options.onRoundStarted;
    this.onRoundCompleted = options.onRoundCompleted;
    this.onAllRoundsCompleted = options.onAllRoundsCompleted;
    this.gateOnPromptSettle = options.gateOnPromptSettle ?? false;
  }

  getState(): RoundRunnerState {
    return {
      currentRoundIndex: this.currentRoundIndex,
      roundsTotal: this.rounds.length,
      roundsCompleted: this.roundsCompleted,
      roundsSkipped: this.roundsSkipped,
      isFinished: this.isFinished,
      hintCountTotal: this.hintCountTotal,
    };
  }

  getCurrentSession(): GameSession | null {
    return this.currentSession;
  }

  getCurrentRoundConfig(): RoundConfig | null {
    if (this.currentRoundIndex >= this.rounds.length) {
      return null;
    }
    return this.rounds[this.currentRoundIndex] ?? null;
  }

  /** Start the first round. Call once after construction. */
  startFirstRound(): void {
    this.collectedEvents.clear();
    this.collectedEventSeqs.clear();
    this.lifecycleEventsSeen.clear();
    this.startRound(0);
  }

  /** Đổi không gian logic (và vùng shell cấp) cho session đang chạy và mọi vòng sau. */
  setLogicSpace(
    space: LogicSpace,
    stage?: ZoneRect,
    tray?: ZoneRect,
    cssPerLogic?: number
  ): void {
    this.logicSpace = space;
    if (cssPerLogic !== undefined) {
      this.cssPerLogic = cssPerLogic;
    }
    if (stage) {
      this.stageRect = stage;
    }
    if (tray) {
      this.trayRect = tray;
    }
    // `setLogicSpace`/`resolveSlots` là API của `TemplateGameSession`; hỏi kiểu
    // bằng `typeof x === "function"` chỉ che mất việc session sai kiểu.
    if (this.currentSession instanceof TemplateGameSession) {
      this.currentSession.setLogicSpace(space);
      this.currentSession.resolveSlots(
        this.ageBand,
        space,
        this.stageRect,
        this.trayRect,
        this.cssPerLogic
      );
    }
  }

  /** Đổi vùng sân khấu cho session đang chạy và mọi vòng sau (Task #277 S3). */
  setStageRect(stage: ZoneRect): void {
    this.stageRect = stage;
    if (this.currentSession instanceof TemplateGameSession) {
      this.currentSession.stageRect = stage;
      this.currentSession.resolveSlots(
        this.ageBand,
        this.logicSpace,
        stage,
        this.trayRect,
        this.cssPerLogic
      );
    }
  }

  getStageRect(): ZoneRect | undefined {
    return this.stageRect;
  }

  getTrayRect(): ZoneRect | undefined {
    return this.trayRect;
  }

  getLogicSpace(): LogicSpace | undefined {
    return this.logicSpace;
  }

  /** Delegate action to the current session. */
  handleAction(action: GameAction): ActionResult {
    if (!this.currentSession || this.isFinished) {
      return { valid: false, feedback: "none" };
    }
    const result = this.currentSession.validateAction(action);
    if (!result.valid && this.isRetryDisallowed()) {
      this.skipCurrentRound("retry_disallowed");
    }
    return result;
  }

  /**
   * Vòng hiện tại có cấm thử lại không (`allow_retry: false`).
   *
   * Bề mặt chơi gửi cử chỉ thẳng vào `session.dispatch()` chứ không đi qua
   * `handleAction`, nên luật này phải đọc được từ ngoài — nếu không thì
   * `allow_retry` chỉ có hiệu lực trong test (`GT-003.md` §5, nhánh 2).
   */
  isRetryDisallowed(): boolean {
    const config = this.rounds[this.currentRoundIndex];
    const params = config?.difficulty_params as
      | Record<string, GameActionValue>
      | undefined;
    return params?.allow_retry === false;
  }

  /** Check if the current round is won. */
  isCurrentRoundWon(): boolean {
    if (!this.currentSession) {
      return false;
    }
    return this.currentSession.checkWinCondition();
  }

  /**
   * Complete the current round and advance to the next.
   * Returns true if there are more rounds, false if finished.
   */
  completeCurrentRound(): boolean {
    if (!this.currentSession || this.isFinished) {
      return false;
    }

    this.collectSessionTelemetry();
    this.recordEvent("round_completed", {
      round_index: this.currentRoundIndex,
      duration_ms: this.roundElapsedMs(),
    });

    this.currentSession.completeSession();
    this.currentSession.destroy();
    this.currentSession = null;
    this.roundsCompleted++;

    this.onRoundCompleted?.(this.currentRoundIndex, false);

    return this.advanceToNextRound();
  }

  /**
   * Skip the current round (scaffold exhaustion).
   * Returns true if there are more rounds, false if finished.
   */
  skipCurrentRound(
    reason: "scaffold_exhausted" | "user" | "retry_disallowed"
  ): boolean {
    if (!this.currentSession || this.isFinished) {
      return false;
    }

    this.collectSessionTelemetry();
    this.recordEvent("round_skipped", {
      round_index: this.currentRoundIndex,
      reason,
    });

    this.currentSession.destroy();
    this.currentSession = null;
    this.roundsSkipped++;

    this.onRoundCompleted?.(this.currentRoundIndex, true);

    return this.advanceToNextRound();
  }

  /**
   * Ghi một lần thử của trẻ vào dòng telemetry (`answer_correct` /
   * `answer_incorrect` mang `attempt_index`) để server dựng `rounds_correct`
   * và `first_try_ratio` (`BR-SCO-01`, `BR-RSP-12`). Bề mặt chơi gọi cho mọi
   * verdict khác `none`; session đã tự phát `answer_*` (GT-000) thì không ghi
   * trùng.
   */
  recordAnswerVerdict(isCorrect: boolean): void {
    if (!this.currentSession || this.isFinished) {
      return;
    }
    let ownAnswers = 0;
    for (const e of this.currentSession.getTelemetry().events) {
      if (
        e.event_name === "answer_correct" ||
        e.event_name === "answer_incorrect"
      ) {
        ownAnswers++;
      }
    }
    if (ownAnswers > this.sessionAnswerEventsSeen) {
      this.sessionAnswerEventsSeen = ownAnswers;
      this.attemptIndex++;
      return;
    }
    this.attemptIndex++;
    this.recordEvent(isCorrect ? "answer_correct" : "answer_incorrect", {
      round_index: this.currentRoundIndex,
      attempt_index: this.attemptIndex,
      elapsed_ms: this.roundElapsedMs(),
      ...(this.currentSession.isTrialBased?.() ? { trial_based: true } : {}),
    });
  }

  /** Increment hint counter (accumulates across rounds, not reset per round). */
  recordHint(): void {
    this.hintCountTotal++;
  }

  /** Get all accumulated telemetry events across all rounds. */
  /**
   * Nhận một event do GameEngine phát (scaffolding, demo...) vào dòng telemetry
   * của lượt chơi. `GameEngine.emitEvent` chỉ gọi listener, nên nếu không có
   * đường này thì mọi event của engine không bao giờ tới `/events`.
   */
  recordExternalEvent(event: TelemetryEvent): void {
    if (
      RUNNER_OWNED_EVENTS.has(event.event_name) ||
      this.isDuplicateLifecycleEvent(event.event_name)
    ) {
      return;
    }
    if (event.event_name === "hint_requested") {
      this.recordHint();
    }
    this.pushLifecycleAware(event);
  }

  /** `game_started` luôn đứng đầu dòng telemetry để `seq = 1` (`play-event-ingestion` §7.3). */
  private pushLifecycleAware(event: TelemetryEvent): void {
    this.collectedEvents.add(event);
    const seq =
      typeof event.data?.seq === "number"
        ? event.data.seq
        : (event as { seq?: number }).seq;
    if (typeof seq === "number") {
      this.collectedEventSeqs.add(seq);
    }
    if (LIFECYCLE_EVENTS.has(event.event_name)) {
      this.lifecycleEventsSeen.add(event.event_name);
    }
    if (event.event_name === "game_started") {
      this.allEvents.unshift(event);
      return;
    }
    this.allEvents.push(event);
  }

  /**
   * `game_started` / `game_completed` có hai nguồn (engine và session) và mỗi
   * vòng session ghi lại một lần. Spec: `game_started` đúng một lần cả phiên
   * (`seq = 1`), `game_completed` đúng một lần sau vòng cuối
   * (`round-sequence-play.md` §7).
   */
  private isDuplicateLifecycleEvent(eventName: string): boolean {
    if (!LIFECYCLE_EVENTS.has(eventName)) {
      return false;
    }
    if (this.lifecycleEventsSeen.has(eventName)) {
      return true;
    }
    const isFinalRound = this.currentRoundIndex >= this.rounds.length - 1;
    return eventName === "game_completed" && !isFinalRound;
  }

  getAllTelemetry(): TelemetryEvent[] {
    if (this.currentSession) {
      this.collectSessionTelemetry();
    }
    return [...this.allEvents];
  }

  /** Clean up. Must be called when the level is done or abandoned. */
  destroy(): void {
    this.audioController.stopAll();
    if (this.ownsAudioController) {
      this.audioController.dispose();
    }
    if (this.currentSession) {
      this.currentSession.destroy();
      this.currentSession = null;
    }
    this.isFinished = true;
  }

  /** Lấy AudioController dùng trong lượt chơi. */
  getAudioController(): AudioController {
    return this.audioController;
  }

  /**
   * Phát lại câu dẫn vòng hiện tại khi trẻ bấm nút "Nghe lại" (BR-PNR-07).
   * Bấm nghe lại BẮT BUỘC không phạt, không tính là sai, không trừ điểm (BR-PNR-08).
   */
  replayCurrentRoundNarration(): void {
    const config = this.getCurrentRoundConfig();
    if (config) {
      this.playRoundNarration(config, "replay");
    }
  }

  /**
   * Phát câu dẫn của vòng (BR-PNR-04, BR-PNR-06).
   *
   * Khi bề mặt chơi đã nhận việc phát qua `onPlayNarration`, đây là lời gọi
   * duy nhất và `RoundRunner` không tự phát — một vòng chỉ có một nguồn giọng
   * (BR-PNR-03).
   *
   * Đường phát nội bộ đi hết ba bậc của mục 7.2 và Cấm — NEVER dừng ở im lặng:
   *   bậc 1 `instruction_audio_path` → bậc 2 TTS tiếng Việt từ `instruction`
   *   hoặc `narration_template` → bậc 3 tín hiệu thị giác.
   */
  private playRoundNarration(
    config: RoundConfig,
    trigger: NarrationTrigger
  ): void {
    if (this.onPlayNarration) {
      this.onPlayNarration(config, trigger);
      return;
    }

    // "Nghe lại" không chờ gì — gate chỉ áp cho nhịp mở vòng (BR-PNR-08:
    // nghe lại Cấm — NEVER ảnh hưởng điểm/bậc trợ giúp, Cấm — NEVER khoá cử
    // chỉ). Nó cắt câu dẫn mở vòng đang phát, mà clip bị cắt không còn báo
    // xong (`playPromptAudio`, Task #274 S1c) — nên settle lượt mở vòng ngay
    // tại đây, như `stopNarrationAudio()` của bề mặt web.
    if (trigger === "replay") {
      this.notePromptSettled();
    }
    // `speak()` gọi `cancel()` trước, và `cancel()` bắn đồng bộ `onEnd` của
    // câu dẫn vòng TRƯỚC — lúc đó vòng mới đã mở. Không có token thì callback
    // cũ settle vòng mới: mở input và chạy hẹn giờ trợ giúp trước khi đọc đề.
    if (trigger === "round_open") {
      this.narrationToken++;
    }
    const token = this.narrationToken;
    const settleIfRoundOpen = () => {
      if (trigger === "round_open" && token === this.narrationToken) {
        this.notePromptSettled();
      }
    };

    const audioPath = config.instruction_audio_path;
    const text = config.instruction || config.narration_template;

    const speakOrCue = () => {
      if (text) {
        this.audioController.speakPrompt(text, settleIfRoundOpen, () => {
          this.onNarrationFallbackCue?.();
          settleIfRoundOpen();
        });
        return;
      }
      this.onNarrationFallbackCue?.();
      settleIfRoundOpen();
    };

    if (audioPath) {
      // `playPromptAudio` gọi CẢ `onError` và tham số `onEnd` trên mọi nhánh
      // lỗi (hợp đồng của nó — xem docstring ở `audio-controller.ts`), nên
      // không thể coi `onEnd` là "đã xong thật". Cờ `mp3Failed` phân biệt
      // "phát xong thật" với "lỗi, đang rơi xuống TTS" — thiếu cờ này thì
      // vòng settle ngay khi mp3 lỗi, trước khi TTS kịp nói xong.
      let mp3Failed = false;
      this.audioController.playPromptAudio(
        audioPath,
        () => {
          if (!mp3Failed) {
            settleIfRoundOpen();
          }
        },
        () => {
          mp3Failed = true;
          speakOrCue();
        }
      );
      return;
    }
    speakOrCue();
  }

  /**
   * Bắt đầu đồng hồ vòng (`sessionStartMs`, dùng cho `duration_ms`) — ngay khi
   * mở vòng nếu gate tắt, hoặc từ `notePromptSettled` nếu gate bật
   * (`BR-PNR-11`). Đồng hồ trợ giúp thuộc engine, không ở đây (Task #313 B8).
   */
  private beginRoundTiming(): void {
    this.pausedTotalMs = 0;
    if (this.pausedSinceMs !== null) {
      this.pausedSinceMs = Date.now();
    }
    this.sessionStartMs = Date.now();
  }

  /** Thời gian chơi thật của vòng, đã trừ mọi lần pause (BR-HPL-07). */
  private roundElapsedMs(): number {
    const now = Date.now();
    const pausedNow =
      this.pausedSinceMs === null ? 0 : now - this.pausedSinceMs;
    return Math.max(
      0,
      now - this.sessionStartMs - this.pausedTotalMs - pausedNow
    );
  }

  /** Dừng đồng hồ vòng (BR-HPL-07); đồng hồ hint thuộc engine. Gọi lặp là vô hại. */
  pause(): void {
    if (this.pausedSinceMs !== null || this.isFinished) {
      return;
    }
    this.pausedSinceMs = Date.now();
  }

  /** Chạy tiếp: hẹn lại hint với phần còn lại, không tính thời gian đã pause. */
  resume(): void {
    if (this.pausedSinceMs === null) {
      return;
    }
    this.pausedTotalMs += Date.now() - this.pausedSinceMs;
    this.pausedSinceMs = null;
  }

  /**
   * Báo câu dẫn của vòng hiện tại đã đọc xong — thành công, rơi hết ba bậc dự
   * phòng của `play-narration.md` §7.2, hay quá hạn dự phòng bên gọi tự đặt
   * (`BR-PNR-09`). Từ đây mới tính `duration_ms` và mới hẹn giờ trợ giúp
   * (`BR-PNR-11`).
   *
   * Vô hiệu khi gate tắt (`gateOnPromptSettle: false`, mặc định) hoặc đã
   * settle rồi — idempotent, vì cả `onEnd` và `onError` của một bậc phát có
   * thể cùng dẫn tới lời gọi này.
   */
  notePromptSettled(): void {
    if (!this.gateOnPromptSettle || this.promptSettled) {
      return;
    }
    this.promptSettled = true;
    this.beginRoundTiming();
  }

  /** Câu dẫn vòng hiện tại đã đọc xong hay chưa — bề mặt chơi gate cử chỉ theo đây (`BR-PNR-11`). */
  isPromptSettled(): boolean {
    return this.promptSettled;
  }

  private startRound(index: number): void {
    if (index >= this.rounds.length) {
      this.isFinished = true;
      this.onAllRoundsCompleted?.();
      return;
    }

    this.currentRoundIndex = index;
    this.attemptIndex = 0;
    this.sessionAnswerEventsSeen = 0;
    const config = this.rounds[index];
    if (!config) {
      return;
    }

    // Constructor đã chặn round thiếu item_count.
    const itemCount = resolveItemCount(config) ?? 1;

    this.recordEvent("round_started", {
      round_index: index,
      item_count: itemCount,
    });

    this.currentSession = this.sessionFactory(
      config.content_pack,
      config.difficulty_params,
      this.layoutSeed + index
    );
    // prepareRound does setupEntities + computeSlots + computeRoundDerived
    if (this.currentSession instanceof TemplateGameSession) {
      this.currentSession.prepareRound(
        this.ageBand,
        this.logicSpace,
        this.stageRect,
        this.trayRect,
        this.cssPerLogic
      );
    } else {
      this.currentSession.setupEntities();
    }

    if (this.gateOnPromptSettle) {
      this.promptSettled = false;
    } else {
      this.beginRoundTiming();
    }

    // Nhịp N2: phát câu dẫn mở vòng (BR-PNR-04, BR-PNR-06)
    this.playRoundNarration(config, "round_open");

    this.onRoundStarted?.(index, config);
  }

  private advanceToNextRound(): boolean {
    const nextIndex = this.currentRoundIndex + 1;
    if (nextIndex >= this.rounds.length) {
      this.isFinished = true;
      this.onAllRoundsCompleted?.();
      return false;
    }
    this.startRound(nextIndex);
    return true;
  }

  private collectSessionTelemetry(): void {
    if (!this.currentSession) {
      return;
    }
    const telemetry = this.currentSession.getTelemetry();
    for (const event of telemetry.events) {
      if (
        RUNNER_OWNED_EVENTS.has(event.event_name) ||
        this.isDuplicateLifecycleEvent(event.event_name)
      ) {
        continue;
      }
      const seq =
        typeof event.data?.seq === "number"
          ? event.data.seq
          : (event as { seq?: number }).seq;
      if (typeof seq === "number" && this.collectedEventSeqs.has(seq)) {
        continue;
      }
      if (!this.collectedEvents.has(event)) {
        this.pushLifecycleAware(event);
      }
    }
  }

  private recordEvent(
    eventName: string,
    data?: Record<string, GameActionValue>
  ): void {
    const event: TelemetryEvent = {
      event_name: eventName,
      timestamp_ms: Date.now(),
      data,
    };
    if (LIFECYCLE_EVENTS.has(eventName)) {
      this.lifecycleEventsSeen.add(eventName);
    }
    const seq = data?.seq;
    if (typeof seq === "number") {
      this.collectedEventSeqs.add(seq);
    }
    this.collectedEvents.add(event);
    this.allEvents.push(event);
  }
}
