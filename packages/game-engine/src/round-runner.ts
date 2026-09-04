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
 *
 * Spec sở hữu: round-sequence-play.md §4
 */

import type { AgeBand } from "./contracts/types";
import type {
  ActionResult,
  GameAction,
  GameSession,
  TelemetryEvent,
} from "./game-session";

export interface RoundConfig {
  round_index: number;
  instruction?: string | null;
  instruction_audio_path?: string | null;
  content_pack: unknown;
  difficulty_params: unknown;
}

export type SessionFactory = (
  contentPack: unknown,
  difficultyParams: unknown,
  layoutSeed: number
) => GameSession;

export interface RoundRunnerOptions {
  rounds: RoundConfig[];
  sessionFactory: SessionFactory;
  /** Band tuổi — truyền tới prepareRound. Mặc định '4-5'. */
  ageBand?: AgeBand;
  layoutSeed?: number;
  onRoundStarted?: (roundIndex: number, roundConfig: RoundConfig) => void;
  onRoundCompleted?: (roundIndex: number, wasSkipped: boolean) => void;
  onAllRoundsCompleted?: () => void;
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

export class RoundRunner {
  private readonly rounds: RoundConfig[];
  private readonly sessionFactory: SessionFactory;
  private readonly ageBand: AgeBand;
  private readonly layoutSeed: number;
  private readonly onRoundStarted?: (
    roundIndex: number,
    roundConfig: RoundConfig
  ) => void;
  private readonly onRoundCompleted?: (
    roundIndex: number,
    wasSkipped: boolean
  ) => void;
  private readonly onAllRoundsCompleted?: () => void;

  private currentRoundIndex = 0;
  private roundsCompleted = 0;
  private roundsSkipped = 0;
  private hintCountTotal = 0;
  private isFinished = false;
  private currentSession: GameSession | null = null;
  private readonly allEvents: TelemetryEvent[] = [];
  private sessionStartMs = 0;

  constructor(options: RoundRunnerOptions) {
    if (options.rounds.length === 0) {
      throw new Error("RoundRunner requires at least one round");
    }

    this.rounds = [...options.rounds].sort(
      (a, b) => a.round_index - b.round_index
    );
    this.sessionFactory = options.sessionFactory;
    this.ageBand = options.ageBand ?? "4-5";
    this.layoutSeed = options.layoutSeed ?? 0;
    this.onRoundStarted = options.onRoundStarted;
    this.onRoundCompleted = options.onRoundCompleted;
    this.onAllRoundsCompleted = options.onAllRoundsCompleted;
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
    this.startRound(0);
  }

  /** Delegate action to the current session. */
  handleAction(action: GameAction): ActionResult {
    if (!this.currentSession || this.isFinished) {
      return { valid: false, feedback: "none" };
    }
    return this.currentSession.validateAction(action);
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
      duration_ms: Date.now() - this.sessionStartMs,
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
  skipCurrentRound(reason: "scaffold_exhausted" | "user"): boolean {
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

  /** Increment hint counter (accumulates across rounds, not reset per round). */
  recordHint(): void {
    this.hintCountTotal++;
  }

  /** Get all accumulated telemetry events across all rounds. */
  getAllTelemetry(): TelemetryEvent[] {
    if (this.currentSession) {
      this.collectSessionTelemetry();
    }
    return [...this.allEvents];
  }

  /** Clean up. Must be called when the level is done or abandoned. */
  destroy(): void {
    if (this.currentSession) {
      this.currentSession.destroy();
      this.currentSession = null;
    }
    this.isFinished = true;
  }

  private startRound(index: number): void {
    if (index >= this.rounds.length) {
      this.isFinished = true;
      this.onAllRoundsCompleted?.();
      return;
    }

    this.currentRoundIndex = index;
    const config = this.rounds[index];
    if (!config) {
      return;
    }

    this.recordEvent("round_started", {
      round_index: index,
      item_count: this.extractItemCount(config.content_pack),
    });

    this.sessionStartMs = Date.now();
    this.currentSession = this.sessionFactory(
      config.content_pack,
      config.difficulty_params,
      this.layoutSeed + index
    );
    // prepareRound does setupEntities + computeSlots + computeRoundDerived
    const sessionWithPrepare = this.currentSession as unknown as {
      prepareRound?: (band: AgeBand) => void;
    };
    if (typeof sessionWithPrepare.prepareRound === "function") {
      sessionWithPrepare.prepareRound(this.ageBand);
    } else {
      this.currentSession.setupEntities();
    }

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
        !this.allEvents.some(
          (e) =>
            e.event_name === event.event_name &&
            e.timestamp_ms === event.timestamp_ms
        )
      ) {
        this.allEvents.push(event);
      }
    }
  }

  private recordEvent(eventName: string, data?: Record<string, unknown>): void {
    this.allEvents.push({
      event_name: eventName,
      timestamp_ms: Date.now(),
      data,
    });
  }

  private extractItemCount(contentPack: unknown): number {
    if (typeof contentPack !== "object" || contentPack === null) {
      return 0;
    }
    if ("items" in contentPack && Array.isArray(contentPack.items)) {
      return contentPack.items.length;
    }
    if ("options" in contentPack && Array.isArray(contentPack.options)) {
      return contentPack.options.length;
    }
    return 0;
  }
}
