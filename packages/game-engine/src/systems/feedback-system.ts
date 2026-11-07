/**
 * FeedbackSystem — Handles visual, audio, and rotational text feedback for play surface.
 * Implements BR-FBK-01..10 & spec FEEDBACK-AND-CELEBRATION.
 */

import type { Rng } from "#src/rng/types";

export type FeedbackState = "lift" | "success" | "retry" | "celebrate_level";

export interface FeedbackConfig {
  state: FeedbackState;
  tokenColor: "success" | "retry" | "brand" | null;
  motion:
    | "lift"
    | "pop_touch"
    | "amber_pulse_drift"
    | "celebrate_banner"
    | "scale_pulse_reduced";
  scale: number;
  durationMs: number;
  soundType: "tap" | "pop_celebrate" | "amber_soft" | "level_celebrate" | null;
  particlesCount: number;
  hasMascot: boolean;
}

export const FEEDBACK_TABLE: Record<FeedbackState, FeedbackConfig> = {
  lift: {
    state: "lift",
    tokenColor: null,
    motion: "lift",
    scale: 1.05,
    durationMs: 150,
    soundType: "tap",
    particlesCount: 0,
    hasMascot: false,
  },
  success: {
    state: "success",
    tokenColor: "success",
    motion: "pop_touch",
    scale: 1.2,
    durationMs: 260,
    soundType: "pop_celebrate",
    particlesCount: 0,
    hasMascot: false,
  },
  retry: {
    state: "retry",
    tokenColor: "retry", // Amber (BR-FBK-03), NEVER danger
    motion: "amber_pulse_drift",
    scale: 1.0,
    durationMs: 400,
    soundType: "amber_soft",
    particlesCount: 0,
    hasMascot: false,
  },
  celebrate_level: {
    state: "celebrate_level",
    tokenColor: "success",
    motion: "celebrate_banner",
    scale: 1.3,
    durationMs: 1200,
    soundType: "level_celebrate",
    particlesCount: 40, // Object pool limit (BR-FBK-04, §7.3)
    hasMascot: true,
  },
};

export const COMPLIMENTS = [
  "Giỏi quá!",
  "Đúng rồi!",
  "Bé làm được rồi!",
  "Tuyệt vời!",
  "Bé thật chăm chỉ!",
] as const;

export const RETRY_ENCOURAGEMENTS = [
  "Thử lại nhé!",
  "Gần đúng rồi!",
  "Bé thử chỗ khác xem?",
] as const;

/**
 * mp3 dự phòng cho từng câu của `RETRY_ENCOURAGEMENTS` (cùng chỉ số), phát khi
 * máy không có giọng Việt (`BR-FBK-13`). File do người thu đặt dưới
 * `apps/web/public/audio/voice/common/feedback/`; thiếu file thì phát im —
 * vòng pop/nhịp hổ phách của bề mặt chơi vẫn là kênh thị giác (`BR-FBK-02`).
 */
export const RETRY_ENCOURAGEMENT_AUDIO = [
  "/audio/voice/common/feedback/retry-thu-lai-nhe.mp3",
  "/audio/voice/common/feedback/retry-gan-dung-roi.mp3",
  "/audio/voice/common/feedback/retry-be-thu-cho-khac.mp3",
] as const;

export interface RetryEncouragementClip {
  readonly text: string;
  readonly audioRef: string;
}

export const FORBIDDEN_WORDS = [
  "Sai rồi",
  "Không đúng",
  "Bé chưa giỏi",
] as const;

/** Pick a non-repeating index using RNG or deterministic round-robin (BR-RNG-02, BR-FBK-08). */
function pickNextIndex(length: number, lastIndex: number, rng?: Rng): number {
  if (length <= 1) {
    return 0;
  }
  if (rng) {
    let nextIndex: number;
    do {
      nextIndex = rng.nextInt(length);
    } while (nextIndex === lastIndex);
    return nextIndex;
  }
  return (lastIndex + 1) % length;
}

export class FeedbackSystem {
  private lastComplimentIndex = -1;
  private lastRetryIndex = -1;
  private readonly rng?: Rng;

  constructor(rng?: Rng) {
    this.rng = rng;
  }

  /**
   * Returns rotation of praise text without repeating consecutive strings (BR-FBK-08).
   */
  getCompliment(): string {
    this.lastComplimentIndex = pickNextIndex(
      COMPLIMENTS.length,
      this.lastComplimentIndex,
      this.rng
    );
    const item = COMPLIMENTS[this.lastComplimentIndex];
    return item ?? COMPLIMENTS[0];
  }

  /**
   * Returns rotation of non-punitive retry encouragement text.
   */
  getRetryEncouragement(): string {
    this.lastRetryIndex = pickNextIndex(
      RETRY_ENCOURAGEMENTS.length,
      this.lastRetryIndex,
      this.rng
    );
    const item = RETRY_ENCOURAGEMENTS[this.lastRetryIndex];
    return item ?? RETRY_ENCOURAGEMENTS[0];
  }

  /** Câu khích lệ kèm mp3 dự phòng cùng chỉ số, xoay vòng không lặp liên tiếp. */
  getRetryEncouragementClip(): RetryEncouragementClip {
    this.lastRetryIndex = pickNextIndex(
      RETRY_ENCOURAGEMENTS.length,
      this.lastRetryIndex,
      this.rng
    );
    const text = RETRY_ENCOURAGEMENTS[this.lastRetryIndex];
    const audioRef = RETRY_ENCOURAGEMENT_AUDIO[this.lastRetryIndex];
    return {
      text: text ?? RETRY_ENCOURAGEMENTS[0],
      audioRef: audioRef ?? RETRY_ENCOURAGEMENT_AUDIO[0],
    };
  }

  /**
   * Returns feedback configuration according to state and reduced-motion preferences (BR-FBK-09).
   */
  getFeedbackConfig(
    state: FeedbackState,
    prefersReducedMotion = false
  ): FeedbackConfig {
    const base = FEEDBACK_TABLE[state];
    if (state === "celebrate_level" && prefersReducedMotion) {
      return {
        ...base,
        motion: "scale_pulse_reduced",
        durationMs: 400,
        particlesCount: 0, // 0 particles for reduced motion (§7.3)
        // Sound remains (BR-FBK-09)
      };
    }
    return base;
  }

  /**
   * Returns touch point feedback event (BR-FBK-05).
   */
  createTouchFeedback(
    state: FeedbackState,
    x: number,
    y: number,
    prefersReducedMotion = false
  ) {
    const config = this.getFeedbackConfig(state, prefersReducedMotion);
    return {
      config,
      touchPoint: { x, y },
      timestamp: Date.now(),
    };
  }
}
