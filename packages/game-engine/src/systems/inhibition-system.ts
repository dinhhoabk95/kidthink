/**
 * Inhibition System — quản lý các lượt kích thích Go / No-Go cho bài tập kìm chế phản xạ.
 * Spec: docs/specs/01-platform/taxonomy-gap-batch.md §7.1, §7.3
 * Business rules: BR-TGB-04, BR-TGB-05, BR-TGB-08, BR-TGB-10
 *
 * System này độc lập với khuôn (BR-TGB-08).
 */

export type StimulusKind = "go" | "nogo";

export interface TrialItem<T = unknown> {
  readonly id: string;
  readonly kind: StimulusKind;
  readonly data?: T;
}

export type TrialOutcome =
  | "hit" // Go + Acted -> Đúng
  | "miss" // Go + No action -> Sai (omission error)
  | "correct_rejection" // No-Go + No action -> Đúng
  | "false_alarm"; // No-Go + Acted -> Sai (commission error)

export interface TrialResult {
  readonly trialIndex: number;
  readonly stimulusId: string;
  readonly kind: StimulusKind;
  readonly outcome: TrialOutcome;
  readonly reactionTimeMs?: number;
  readonly isCorrect: boolean;
}

export interface InhibitionSystemConfig<T = unknown> {
  readonly trials: readonly TrialItem<T>[];
  readonly stimulusWindowMs: number;
  readonly isiMs?: number;
  readonly untimed?: boolean;
}

export class InhibitionSystem<T = unknown> {
  private readonly trials: readonly TrialItem<T>[];
  private readonly stimulusWindowMs: number;
  private readonly isiMs: number;
  private readonly untimed: boolean;

  private currentTrialIndex = 0;
  private trialElapsedMs = 0;
  private state: "stimulus" | "isi" | "finished" = "stimulus";
  private readonly results: TrialResult[] = [];
  private hasActedCurrentTrial = false;

  constructor(config: InhibitionSystemConfig<T>) {
    if (!config.trials || config.trials.length === 0) {
      throw new Error("InhibitionSystem requires at least 1 trial");
    }
    this.trials = config.trials;
    this.stimulusWindowMs = Math.max(500, config.stimulusWindowMs);
    this.isiMs = Math.max(0, config.isiMs ?? 500);
    this.untimed = Boolean(config.untimed);
  }

  getCurrentTrial(): TrialItem<T> | null {
    if (
      this.state === "finished" ||
      this.currentTrialIndex >= this.trials.length
    ) {
      return null;
    }
    return this.trials[this.currentTrialIndex] ?? null;
  }

  getCurrentTrialIndex(): number {
    return this.currentTrialIndex;
  }

  getTotalTrials(): number {
    return this.trials.length;
  }

  getState(): "stimulus" | "isi" | "finished" {
    return this.state;
  }

  getResults(): readonly TrialResult[] {
    return this.results;
  }

  isFinished(): boolean {
    return this.state === "finished";
  }

  isUntimed(): boolean {
    return this.untimed;
  }

  getCorrectCount(): number {
    return this.results.filter((r) => r.isCorrect).length;
  }

  /**
   * Trẻ thực hiện hành động:
   * - "tap": chạm vào kích thích (Go choice)
   * - "pass": quyết định dừng / không chạm (No-Go choice)
   */
  handleAction(
    actionType: "tap" | "pass" = "tap"
  ): { isCorrect: boolean; outcome: TrialOutcome } | null {
    if (this.state !== "stimulus" || this.hasActedCurrentTrial) {
      return null;
    }
    this.hasActedCurrentTrial = true;
    const current = this.trials[this.currentTrialIndex];
    if (!current) {
      return null;
    }

    let outcome: TrialOutcome;
    if (actionType === "pass") {
      outcome = current.kind === "nogo" ? "correct_rejection" : "miss";
    } else {
      outcome = current.kind === "go" ? "hit" : "false_alarm";
    }
    const isCorrect = outcome === "hit" || outcome === "correct_rejection";

    this.results.push({
      trialIndex: this.currentTrialIndex,
      stimulusId: current.id,
      kind: current.kind,
      outcome,
      reactionTimeMs: this.trialElapsedMs,
      isCorrect,
    });

    this.transitionToNext();
    return { isCorrect, outcome };
  }

  handlePass(): { isCorrect: boolean; outcome: TrialOutcome } | null {
    return this.handleAction("pass");
  }

  private handleStimulusTimeout(): {
    isCorrect: boolean;
    outcome: TrialOutcome;
  } | null {
    const current = this.trials[this.currentTrialIndex];
    if (!current) {
      return null;
    }

    const outcome: TrialOutcome =
      current.kind === "go" ? "miss" : "correct_rejection";
    const isCorrect = outcome === "correct_rejection";

    this.results.push({
      trialIndex: this.currentTrialIndex,
      stimulusId: current.id,
      kind: current.kind,
      outcome,
      reactionTimeMs: undefined,
      isCorrect,
    });

    this.transitionToNext();
    return { isCorrect, outcome };
  }

  /**
   * Cập nhật thời gian mỗi frame.
   * Nếu hết thời gian kích thích mà trẻ KHÔNG chạm (chỉ khi có tính giờ):
   * - Go: miss (sai, omission)
   * - No-Go: correct_rejection (đúng kìm chế)
   */
  tick(deltaMs: number): { isCorrect: boolean; outcome: TrialOutcome } | null {
    if (this.state === "finished") {
      return null;
    }

    this.trialElapsedMs += deltaMs;

    if (this.state === "stimulus") {
      if (!this.untimed && this.trialElapsedMs >= this.stimulusWindowMs) {
        return this.handleStimulusTimeout();
      }
      return null;
    }

    if (this.state === "isi" && this.trialElapsedMs >= this.isiMs) {
      this.currentTrialIndex++;
      if (this.currentTrialIndex >= this.trials.length) {
        this.state = "finished";
      } else {
        this.state = "stimulus";
        this.trialElapsedMs = 0;
        this.hasActedCurrentTrial = false;
      }
    }

    return null;
  }

  private transitionToNext(): void {
    if (this.isiMs > 0) {
      this.state = "isi";
      this.trialElapsedMs = 0;
    } else {
      this.currentTrialIndex++;
      if (this.currentTrialIndex >= this.trials.length) {
        this.state = "finished";
      } else {
        this.state = "stimulus";
        this.trialElapsedMs = 0;
        this.hasActedCurrentTrial = false;
      }
    }
  }
}
