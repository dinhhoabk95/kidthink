/**
 * Mascot Thỏ Tini của vùng lời dẫn (`feedback-and-celebration.md` §7.4,
 * `BR-PSZ-10`, `BR-FBK-11`).
 *
 * Asset thật là sprite SVG/PNG đặt ngoài engine, mỗi dáng một ảnh. Dáng nào
 * chưa có sprite thì vẽ thay thế bằng primitive — vẫn đổi dáng được, nên tắt
 * tiếng trẻ vẫn thấy mình được khen.
 */

import { designTokens } from "#src/systems/designTokens";

export const MASCOT_POSES = [
  "idle",
  "listen",
  "happy",
  "encourage",
  "hint",
  "celebrate",
] as const;

export type MascotPose = (typeof MASCOT_POSES)[number];

export type MascotSprites = Partial<Record<MascotPose, CanvasImageSource>>;

export interface MascotPlacement {
  readonly cx: number;
  readonly cy: number;
  readonly radius: number;
}

export interface MascotMotion {
  /** Lệch dọc theo tỉ lệ bán kính (âm là nảy lên). */
  readonly dy: number;
  /** Góc nghiêng, radian. */
  readonly tilt: number;
  readonly scale: number;
}

export interface DrawMascotOptions {
  readonly sprites?: MascotSprites;
  readonly reducedMotion?: boolean;
}

const BOUNCE_PERIOD_MS = 360;
const BREATH_PERIOD_MS = 2400;
const ENCOURAGE_TILT_RAD = 0.18;
const REDUCED_PULSE_SCALE = 1.08;
const STILL: MascotMotion = { dy: 0, tilt: 0, scale: 1 };

function wave(elapsedMs: number, periodMs: number): number {
  return Math.sin((elapsedMs / periodMs) * Math.PI * 2);
}

/** Một nhịp scale duy nhất thay cho nảy/nghiêng khi reduced-motion (`BR-FBK-09`). */
function reducedMotionFor(pose: MascotPose): MascotMotion {
  if (pose === "happy" || pose === "celebrate") {
    return { dy: 0, tilt: 0, scale: REDUCED_PULSE_SCALE };
  }
  return STILL;
}

/** Chuyển động của dáng ở thời điểm `elapsedMs` — hàm thuần để test không cần canvas. */
export function mascotMotion(
  pose: MascotPose,
  elapsedMs: number,
  reducedMotion: boolean
): MascotMotion {
  if (reducedMotion) {
    return reducedMotionFor(pose);
  }
  const bounce = Math.abs(wave(elapsedMs, BOUNCE_PERIOD_MS));
  switch (pose) {
    case "happy":
      return { dy: -0.18 * bounce, tilt: 0, scale: 1.06 };
    case "celebrate":
      return { dy: -0.28 * bounce, tilt: 0, scale: 1.12 };
    case "encourage":
      return { dy: 0, tilt: ENCOURAGE_TILT_RAD, scale: 1 };
    case "listen":
      return { dy: 0, tilt: -0.08, scale: 1 };
    case "hint":
      return { dy: -0.06 * bounce, tilt: 0, scale: 1 };
    default:
      return {
        dy: 0,
        tilt: 0,
        scale: 1 + 0.02 * wave(elapsedMs, BREATH_PERIOD_MS),
      };
  }
}

function drawEars(
  ctx: CanvasRenderingContext2D,
  r: number,
  pose: MascotPose
): void {
  const earsUp = pose === "happy" || pose === "celebrate";
  const spread = pose === "celebrate" ? 0.42 : 0.22;
  const bentRight = pose === "listen" || pose === "encourage";
  const sides = [-1, 1] as const;
  for (const side of sides) {
    const bent = bentRight && side === 1;
    const angle = side * spread + (bent ? 0.9 : 0);
    const length = earsUp ? 0.95 : 0.8;
    ctx.save();
    ctx.translate(side * r * 0.38, -r * 0.62);
    ctx.rotate(angle);
    ctx.fillStyle = designTokens.colors.surface[0];
    ctx.strokeStyle = designTokens.colors.surface[300];
    ctx.lineWidth = Math.max(1.5, r * 0.05);
    ctx.beginPath();
    ctx.ellipse(
      0,
      -r * length * 0.5,
      r * 0.22,
      r * length * 0.5,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = designTokens.colors.cta[100];
    ctx.beginPath();
    ctx.ellipse(
      0,
      -r * length * 0.5,
      r * 0.11,
      r * length * 0.36,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.restore();
  }
}

function drawFace(
  ctx: CanvasRenderingContext2D,
  r: number,
  pose: MascotPose
): void {
  ctx.fillStyle = designTokens.colors.surface[0];
  ctx.strokeStyle = designTokens.colors.surface[300];
  ctx.lineWidth = Math.max(1.5, r * 0.05);
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.7, r * 0.62, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  const joyful = pose === "happy" || pose === "celebrate";
  ctx.strokeStyle = designTokens.colors.surface[800];
  ctx.fillStyle = designTokens.colors.surface[800];
  ctx.lineWidth = Math.max(1.5, r * 0.06);
  for (const side of [-1, 1] as const) {
    ctx.beginPath();
    if (joyful) {
      // Mắt cười: cung úp.
      ctx.arc(side * r * 0.24, -r * 0.06, r * 0.09, Math.PI, 0);
      ctx.stroke();
    } else {
      ctx.ellipse(
        side * r * 0.24,
        -r * 0.06,
        r * 0.06,
        r * 0.08,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }

  ctx.fillStyle = designTokens.colors.cta[200];
  ctx.beginPath();
  ctx.ellipse(0, r * 0.1, r * 0.07, r * 0.05, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  const smile = joyful ? 0.2 : 0.12;
  ctx.arc(0, r * 0.16, r * smile, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
}

function drawPlaceholderRabbit(
  ctx: CanvasRenderingContext2D,
  r: number,
  pose: MascotPose
): void {
  drawEars(ctx, r, pose);
  drawFace(ctx, r, pose);
}

export function drawMascot(
  ctx: CanvasRenderingContext2D,
  placement: MascotPlacement,
  pose: MascotPose,
  elapsedMs: number,
  options?: DrawMascotOptions
): void {
  const motion = mascotMotion(pose, elapsedMs, options?.reducedMotion ?? false);
  const r = placement.radius * motion.scale;

  ctx.save();
  ctx.translate(placement.cx, placement.cy + motion.dy * placement.radius);
  ctx.rotate(motion.tilt);

  const sprite = options?.sprites?.[pose];
  if (sprite) {
    ctx.drawImage(sprite, -r, -r, r * 2, r * 2);
  } else {
    drawPlaceholderRabbit(ctx, r, pose);
  }
  ctx.restore();
}
