/**
 * Mascot Gấu Con của vùng lời dẫn (`feedback-and-celebration.md` §7.4,
 * `BR-PSZ-10`, `BR-FBK-11`).
 *
 * Asset thật là sprite SVG đặt ngoài engine (`MASCOT_SPRITE_FILES`). Dáng nào
 * chưa nạp được sprite thì vẽ thay thế bằng primitive — vẫn đổi dáng được, nên
 * tắt tiếng trẻ vẫn thấy mình được khen.
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

/**
 * Sáu dáng ánh xạ vào bốn tư thế đã vẽ của Gấu Con (§7.4). Đường dẫn tương
 * đối với gốc public của web; engine không tự nạp ảnh.
 */
export const MASCOT_SPRITE_FILES: Readonly<Record<MascotPose, string>> = {
  idle: "/mascot/mascot-bear-waiting.svg",
  listen: "/mascot/mascot-bear-waiting.svg",
  happy: "/mascot/mascot-bear-jumping.svg",
  encourage: "/mascot/mascot-bear-thinking.svg",
  hint: "/mascot/mascot-bear-thinking.svg",
  celebrate: "/mascot/mascot-bear-celebrating.svg",
};

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

/** Cùng bảng màu với bốn SVG Gấu Con ở `apps/web/public/mascot/`. */
const BEAR_FUR = designTokens.colors.retry[600];
const BEAR_OUTLINE = designTokens.colors.retry[800];
const BEAR_LIGHT = designTokens.colors.retry[200];
const BEAR_INK = designTokens.colors.surface[800];

function drawEars(ctx: CanvasRenderingContext2D, r: number): void {
  for (const side of [-1, 1] as const) {
    const cx = side * r * 0.6;
    const cy = -r * 0.62;
    ctx.fillStyle = BEAR_FUR;
    ctx.strokeStyle = BEAR_OUTLINE;
    ctx.lineWidth = Math.max(1.5, r * 0.08);
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.32, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = BEAR_LIGHT;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.16, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawEyes(
  ctx: CanvasRenderingContext2D,
  r: number,
  joyful: boolean
): void {
  ctx.strokeStyle = BEAR_INK;
  ctx.fillStyle = BEAR_INK;
  ctx.lineWidth = Math.max(1.5, r * 0.07);
  for (const side of [-1, 1] as const) {
    ctx.beginPath();
    if (joyful) {
      // Mắt cười: cung úp.
      ctx.arc(side * r * 0.3, -r * 0.12, r * 0.1, Math.PI, 0);
      ctx.stroke();
    } else {
      ctx.arc(side * r * 0.3, -r * 0.12, r * 0.08, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawFace(
  ctx: CanvasRenderingContext2D,
  r: number,
  pose: MascotPose
): void {
  ctx.fillStyle = BEAR_FUR;
  ctx.strokeStyle = BEAR_OUTLINE;
  ctx.lineWidth = Math.max(1.5, r * 0.08);
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.82, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  const joyful = pose === "happy" || pose === "celebrate";
  drawEyes(ctx, r, joyful);

  // Mõm sáng, mũi và miệng.
  ctx.fillStyle = BEAR_LIGHT;
  ctx.beginPath();
  ctx.ellipse(0, r * 0.26, r * 0.34, r * 0.24, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = BEAR_INK;
  ctx.beginPath();
  ctx.ellipse(0, r * 0.16, r * 0.1, r * 0.07, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = BEAR_INK;
  ctx.lineWidth = Math.max(1.5, r * 0.06);
  ctx.beginPath();
  const smile = joyful ? 0.18 : 0.1;
  ctx.arc(0, r * 0.24, r * smile, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
}

function drawPlaceholderBear(
  ctx: CanvasRenderingContext2D,
  r: number,
  pose: MascotPose
): void {
  drawEars(ctx, r);
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
    drawPlaceholderBear(ctx, r, pose);
  }
  ctx.restore();
}
