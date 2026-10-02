/**
 * Lớp phủ phản hồi chung của bề mặt chơi (`feedback-and-celebration.md`
 * `BR-FBK-05`, `BR-FBK-07`, `BR-FBK-11`).
 *
 * Shell gọi `trigger` khi engine trả verdict, rồi mỗi khung vẽ gọi `frame` để
 * lấy vòng pop/nhịp hổ phách tại điểm chạm và dáng mascot. Không engine nào
 * phải sửa: 37 template phản hồi giống nhau qua cùng một lớp.
 */

import type { MascotPose } from "#src/render/mascot";
import { designTokens } from "./designTokens";
import { FEEDBACK_TABLE } from "./feedback-system";

export type OverlayFeedbackKind = "success" | "retry";

export interface FeedbackPoint {
  readonly x: number;
  readonly y: number;
}

export interface PulseFrame {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly alpha: number;
  readonly lineWidth: number;
  readonly color: string;
}

export interface FeedbackFrame {
  readonly pulses: readonly PulseFrame[];
  readonly mascotPose: MascotPose;
  /** Thời gian từ lúc dáng hiện tại bắt đầu — để hoạt ảnh mascot chạy từ 0. */
  readonly mascotElapsedMs: number;
}

interface ActiveFeedback {
  readonly kind: OverlayFeedbackKind;
  readonly point: FeedbackPoint;
  readonly startMs: number;
}

/** Dáng phản hồi giữ đủ lâu để trẻ kịp thấy — §7.4. */
export const MASCOT_FEEDBACK_HOLD_MS = 700;

const PULSE_BASE_RADIUS = 18;
const PULSE_GROWTH = 1.6;
const RETRY_BEATS = 2;

const FEEDBACK_STYLE: Record<
  OverlayFeedbackKind,
  {
    readonly color: string;
    readonly pose: MascotPose;
    readonly durationMs: number;
  }
> = {
  success: {
    color: designTokens.colors.semantic.success[500],
    pose: "happy",
    durationMs: FEEDBACK_TABLE.success.durationMs,
  },
  retry: {
    color: designTokens.colors.retry[500],
    pose: "encourage",
    durationMs: FEEDBACK_TABLE.retry.durationMs,
  },
};

function pulseRadius(
  kind: OverlayFeedbackKind,
  progress: number,
  reducedMotion: boolean
): number {
  if (reducedMotion) {
    return PULSE_BASE_RADIUS;
  }
  if (kind === "success") {
    return PULSE_BASE_RADIUS * (1 + PULSE_GROWTH * progress);
  }
  // Hai nhịp hổ phách tại chỗ — không lan rộng dần (`BR-FBK-07`).
  const beat = Math.abs(Math.sin(progress * Math.PI * RETRY_BEATS));
  return PULSE_BASE_RADIUS * (1 + 0.35 * beat);
}

function toPulseFrame(
  active: ActiveFeedback,
  nowMs: number,
  reducedMotion: boolean
): PulseFrame | null {
  const style = FEEDBACK_STYLE[active.kind];
  const progress = (nowMs - active.startMs) / style.durationMs;
  if (progress < 0 || progress >= 1) {
    return null;
  }
  return {
    x: active.point.x,
    y: active.point.y,
    radius: pulseRadius(active.kind, progress, reducedMotion),
    alpha: 1 - progress,
    lineWidth: 6,
    color: style.color,
  };
}

export class FeedbackOverlay {
  private active: ActiveFeedback | null = null;
  private celebrating = false;

  trigger(
    kind: OverlayFeedbackKind,
    point: FeedbackPoint,
    nowMs: number
  ): void {
    // Một phản hồi một lúc: chạm mới thay hẳn chạm cũ, không chồng cường độ.
    this.active = { kind, point: { x: point.x, y: point.y }, startMs: nowMs };
  }

  celebrate(): void {
    this.celebrating = true;
  }

  reset(): void {
    this.active = null;
    this.celebrating = false;
  }

  frame(
    nowMs: number,
    basePose: MascotPose = "idle",
    reducedMotion = false
  ): FeedbackFrame {
    if (this.celebrating) {
      return { pulses: [], mascotPose: "celebrate", mascotElapsedMs: nowMs };
    }
    const active = this.active;
    if (!active) {
      return { pulses: [], mascotPose: basePose, mascotElapsedMs: nowMs };
    }
    const elapsed = nowMs - active.startMs;
    const pulse = toPulseFrame(active, nowMs, reducedMotion);
    const holding = elapsed >= 0 && elapsed < MASCOT_FEEDBACK_HOLD_MS;
    return {
      pulses: pulse ? [pulse] : [],
      mascotPose: holding ? FEEDBACK_STYLE[active.kind].pose : basePose,
      mascotElapsedMs: holding ? elapsed : nowMs,
    };
  }
}

/** Vẽ các vòng của một khung — lớp trên cùng, sau engine (`BR-ERC` lớp 4). */
export function drawFeedbackPulses(
  ctx: CanvasRenderingContext2D,
  pulses: readonly PulseFrame[]
): void {
  for (const pulse of pulses) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, pulse.alpha));
    ctx.strokeStyle = pulse.color;
    ctx.lineWidth = pulse.lineWidth;
    ctx.beginPath();
    ctx.arc(pulse.x, pulse.y, pulse.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}
