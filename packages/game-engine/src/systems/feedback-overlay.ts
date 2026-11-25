/**
 * Lớp phủ phản hồi chung của bề mặt chơi (`feedback-and-celebration.md`
 * `BR-FBK-05`, `BR-FBK-07`, `BR-FBK-11`).
 *
 * Shell gọi `trigger` khi engine trả verdict, rồi mỗi khung vẽ gọi `frame` để
 * lấy vòng pop/nhịp hổ phách tại điểm chạm và dáng mascot. Không engine nào
 * phải sửa: 37 template phản hồi giống nhau qua cùng một lớp.
 */

import type { AgeBand } from "#src/contracts/types";
import {
  type EncouragementMoment,
  pickEncouragementPhrase,
} from "#src/labels/encouragement-phrases";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { MascotPose } from "#src/render/mascot";
import {
  drawEncouragementBanner,
  type EncouragementBannerKind,
} from "#src/render/montessori-feedback";
import { designTokens } from "./designTokens";
import { FEEDBACK_TABLE } from "./feedback-system";
import type { RenderSystem } from "./render-system";

export type OverlayFeedbackKind = "success" | "retry";

export interface FeedbackPoint {
  readonly x: number;
  readonly y: number;
}

interface PulseFrame {
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

/** Thời lượng bảng đồng dao khích lệ cột mốc trên HUD (ms). */
export const MILESTONE_BANNER_HOLD_MS = 2200;

const BANNER_FADE_IN_MS = 140;
const BANNER_FADE_OUT_MS = 240;

const PULSE_BASE_RADIUS = 18;
const PULSE_GROWTH = 1.6;
const RETRY_BEATS = 2;
const EMPTY_PULSES: readonly PulseFrame[] = Object.freeze([]);

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

export interface BaseMascotPoseInput {
  readonly acceptingInput: boolean;
  /** Bậc trợ giúp đang hiện, 0 là chưa có (`scaffolding.getCurrentLevel()`). */
  readonly hintLevel: number;
  readonly session?: {
    mascotMood?(): MascotPose | null;
  } | null;
}

/**
 * Dáng nền của mascot: lời dẫn đang đọc > trợ giúp > tâm trạng của session >
 * idle (`BR-FBK-15`) — trẻ đang kẹt luôn thấy dáng gợi ý. Phản hồi đúng/chưa đúng của `FeedbackOverlay` đè lên trên.
 */
export function resolveBaseMascotPose(input: BaseMascotPoseInput): MascotPose {
  if (!input.acceptingInput) {
    return "listen";
  }
  if (input.hintLevel > 0) {
    return "hint";
  }
  return input.session?.mascotMood?.() ?? "idle";
}

function bannerKindForMoment(
  moment: EncouragementMoment
): EncouragementBannerKind {
  if (moment === "level_complete") {
    return "celebrate";
  }
  if (moment === "retry") {
    return "retry";
  }
  return "praise";
}

export class FeedbackOverlay {
  private active: ActiveFeedback | null = null;
  private celebrating = false;
  private bannerText = "";
  private bannerKind: EncouragementBannerKind = "praise";
  private bannerStartMs = -1;
  private bannerUntilMs = -1;
  private milestoneCount = 0;
  private readonly bannerBox = { x: 0, y: 0, w: 0, h: 52 };

  trigger(
    kind: OverlayFeedbackKind,
    point: FeedbackPoint,
    nowMs: number
  ): void {
    // Một phản hồi một lúc: chạm mới thay hẳn chạm cũ, không chồng cường độ.
    this.active = { kind, point: { x: point.x, y: point.y }, startMs: nowMs };
  }

  /**
   * Phát bảng đồng dao / lời cô giáo mầm non trên cột mốc vòng chơi hoặc hoàn
   * thành màn (`pickEncouragementPhrase` + `drawEncouragementBanner`).
   */
  triggerMilestone(
    moment: EncouragementMoment,
    ageBand: AgeBand,
    nowMs: number,
    durationMs = MILESTONE_BANNER_HOLD_MS
  ): string {
    const phrase = pickEncouragementPhrase(
      moment,
      ageBand,
      this.milestoneCount
    );
    this.milestoneCount += 1;
    this.bannerText = phrase;
    this.bannerKind = bannerKindForMoment(moment);
    this.bannerStartMs = nowMs;
    this.bannerUntilMs = nowMs + Math.max(400, durationMs);
    return phrase;
  }

  hasActiveMilestoneBanner(nowMs: number): boolean {
    return (
      this.bannerText.length > 0 &&
      nowMs >= this.bannerStartMs &&
      nowMs < this.bannerUntilMs
    );
  }

  getMilestoneBannerText(nowMs: number): string | null {
    return this.hasActiveMilestoneBanner(nowMs) ? this.bannerText : null;
  }

  drawMilestoneBanner(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    nowMs: number,
    stageZone?: ZoneRect,
    promptZone?: ZoneRect
  ): void {
    if (!this.hasActiveMilestoneBanner(nowMs)) {
      return;
    }
    const elapsed = nowMs - this.bannerStartMs;
    const remaining = this.bannerUntilMs - nowMs;
    let opacity = 1;
    if (!rs.reducedMotion) {
      if (elapsed < BANNER_FADE_IN_MS) {
        opacity = Math.max(0, elapsed / BANNER_FADE_IN_MS);
      } else if (remaining < BANNER_FADE_OUT_MS) {
        opacity = Math.max(0, remaining / BANNER_FADE_OUT_MS);
      }
    }

    if (promptZone && promptZone.w > 0 && promptZone.h > 0) {
      // Dải lời dẫn không chứa vật tương tác; câu khen chỉ hiện sau khi trẻ đã
      // làm xong nên che tạm câu đề là vô hại (không che thẻ mẫu, ô lưới, dải
      // tín hiệu đổi luật của sân khấu).
      this.bannerBox.x = promptZone.x;
      this.bannerBox.y = promptZone.y;
      this.bannerBox.w = promptZone.w;
      this.bannerBox.h = promptZone.h;
    } else if (stageZone && stageZone.w > 0) {
      this.bannerBox.x = stageZone.x;
      this.bannerBox.y = stageZone.y + 6;
      this.bannerBox.w = stageZone.w;
      this.bannerBox.h = 52;
    } else {
      this.bannerBox.x = 0;
      this.bannerBox.y = 12;
      this.bannerBox.w = rs.LOGIC_WIDTH;
      this.bannerBox.h = 52;
    }

    ctx.save();
    ctx.globalAlpha = opacity;
    drawEncouragementBanner(
      ctx,
      rs,
      this.bannerText,
      this.bannerKind,
      this.bannerBox
    );
    ctx.restore();
  }

  celebrate(ageBand?: AgeBand, nowMs?: number): void {
    this.celebrating = true;
    if (nowMs !== undefined) {
      this.triggerMilestone("level_complete", ageBand ?? "4-5", nowMs, 3200);
    }
  }

  reset(): void {
    this.active = null;
    this.celebrating = false;
    this.bannerText = "";
    this.bannerStartMs = -1;
    this.bannerUntilMs = -1;
  }

  frame(
    nowMs: number,
    basePose: MascotPose = "idle",
    reducedMotion = false
  ): FeedbackFrame {
    if (this.celebrating) {
      return {
        pulses: EMPTY_PULSES,
        mascotPose: "celebrate",
        mascotElapsedMs: nowMs,
      };
    }
    const active = this.active;
    if (!active) {
      return {
        pulses: EMPTY_PULSES,
        mascotPose: basePose,
        mascotElapsedMs: nowMs,
      };
    }
    const elapsed = nowMs - active.startMs;
    const pulse = toPulseFrame(active, nowMs, reducedMotion);
    const holding = elapsed >= 0 && elapsed < MASCOT_FEEDBACK_HOLD_MS;
    if (!pulse && elapsed >= MASCOT_FEEDBACK_HOLD_MS) {
      this.active = null;
    }
    return {
      pulses: pulse ? [pulse] : EMPTY_PULSES,
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
  if (pulses.length === 0) {
    return;
  }
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
