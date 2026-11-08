import {
  DEFAULT_LOGIC_SPACE,
  getTouchFloor,
  type LogicSpace,
} from "#src/layout/constants";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";
import { alpha } from "./color-utils.js";
import { drawGoalFlag } from "./craft-shapes.js";
import { applyCanvasFontAtSize, canvasFontPx } from "./type-scale.js";
import type { SceneBox } from "./types.js";

/** Bước tối thiểu giữa hai mốc khi mốc KHÔNG chạm được — đủ chỗ cho một nhãn số. */
export const NUMBER_LINE_MIN_STEP_PX = 28;

/**
 * Bước giữa hai mốc trên trục số (`BR-NRL-05` / T4.3).
 *
 * Mốc chạm được thì bước BẮT BUỘC ≥ sàn chạm của band: trục nở ra theo bước
 * thật chứ không nén cho vừa hộp. Nén thì hai mốc cách nhau 20 px và ngón tay
 * trẻ bấm trúng mốc bên cạnh — vùng chạm không đo được bằng mắt nên không cổng
 * nào bắt.
 */
export function numberLineStepPx(
  availableW: number,
  count: number,
  interactive: boolean
): number {
  const safeCount = Math.max(1, count);
  const minStepW = interactive ? getTouchFloor("5-6") : NUMBER_LINE_MIN_STEP_PX;
  return Math.max(availableW / safeCount, minStepW);
}

interface NumberLineTickOptions {
  readonly current?: number;
  readonly isMajorTick: boolean;
  readonly labelEveryTick: boolean;
  readonly lineY: number;
  readonly target?: number;
  readonly tickX: number;
  readonly val: number;
}

/** Một mốc trên trục số: vạch, nhãn (nếu còn chỗ) và vòng đích. */
function drawNumberLineTick(
  ctx: CanvasRenderingContext2D,
  options: NumberLineTickOptions
): void {
  const { current, isMajorTick, labelEveryTick, lineY, target, tickX, val } =
    options;
  const tickH = isMajorTick ? 14 : 8;

  ctx.lineWidth = isMajorTick ? 3 : 2;
  ctx.strokeStyle = isMajorTick
    ? designTokens.colors.surface[900]
    : designTokens.colors.surface[500];
  ctx.beginPath();
  ctx.moveTo(tickX, lineY - tickH / 2);
  ctx.lineTo(tickX, lineY + tickH / 2);
  ctx.stroke();

  if (labelEveryTick || isMajorTick || val === current) {
    ctx.fillStyle =
      val === current
        ? designTokens.colors.cta[600]
        : designTokens.colors.surface[700];
    ctx.fillText(String(val), tickX, lineY + 12);
  }

  if (target !== undefined && val === target) {
    ctx.strokeStyle = designTokens.colors.semantic.success[500];
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(tickX, lineY, 12, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// ── Trục số ngang (BR-NRL-05 / T4.2 / T4.3) ──────────────────────────
export function drawNumberLine(
  ctx: CanvasRenderingContext2D,
  box: SceneBox,
  options: {
    min: number;
    max: number;
    current?: number;
    target?: number;
    interactive?: boolean;
    space?: LogicSpace;
    /** `viewport.scale` của `RenderSystem` — sàn chữ đo bằng px CSS. */
    scale?: number;
  }
): void {
  const {
    min,
    max,
    current,
    target,
    interactive = false,
    space = DEFAULT_LOGIC_SPACE,
    scale,
  } = options;
  const count = Math.max(1, max - min);
  const padX = 36;
  const lineY = box.y + box.h / 2;
  const lineStart = box.x + padX;

  const stepW = numberLineStepPx(box.w - padX * 2, count, interactive);
  const availableW = stepW * count;
  const lineEnd = lineStart + availableW;

  ctx.save();
  // Trục ngang
  ctx.strokeStyle = designTokens.colors.surface[600];
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(lineStart, lineY);
  ctx.lineTo(lineEnd, lineY);
  ctx.stroke();

  // Mũi tên hai đầu trục
  const arrowSize = 8;
  ctx.beginPath();
  ctx.moveTo(lineEnd - arrowSize, lineY - arrowSize);
  ctx.lineTo(lineEnd, lineY);
  ctx.lineTo(lineEnd - arrowSize, lineY + arrowSize);
  ctx.stroke();

  /**
   * Cỡ chữ số mốc giữ sàn `BR-A11-08`; khi bước mốc hẹp hơn bề rộng một nhãn
   * thì **thưa nhãn** (chỉ mốc chia 5) thay vì thu nhỏ chữ xuống dưới sàn.
   */
  const labelFontPx = canvasFontPx(space, "hud", scale);
  const labelEveryTick = stepW >= labelFontPx * 1.3;
  applyCanvasFontAtSize(ctx, labelFontPx, "sans", "bold");
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  for (let i = 0; i <= count; i++) {
    drawNumberLineTick(ctx, {
      current,
      isMajorTick: i % 5 === 0,
      labelEveryTick,
      lineY,
      target,
      tickX: lineStart + i * stepW,
      val: min + i,
    });
  }

  // Con trỏ vị trí hiện tại (con bọ / hạt ngọc Amber)
  if (current !== undefined && current >= min && current <= max) {
    const cursorX = lineStart + (current - min) * stepW;
    const cursorR = Math.max(14, Math.round(labelFontPx * 0.7));

    ctx.fillStyle = designTokens.colors.montessori.amber;
    ctx.strokeStyle = designTokens.colors.montessori.amberDark;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cursorX, lineY, cursorR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Tâm con trỏ
    ctx.fillStyle = designTokens.colors.surface[0];
    ctx.beginPath();
    ctx.arc(cursorX, lineY, cursorR * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function drawTrackNumberLine(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  min: number,
  max: number,
  current?: number
): void {
  const lineBox: SceneBox = {
    x: 60,
    y: rs.LOGIC_HEIGHT * 0.78,
    w: rs.LOGIC_WIDTH - 120,
    h: 80,
  };
  drawNumberLine(ctx, lineBox, {
    min,
    max,
    current,
    space: { w: rs.LOGIC_WIDTH, h: rs.LOGIC_HEIGHT },
    scale: rs.viewport?.scale,
  });
}

/** Thanh đỡ vật cần đo kèm 2 vạch giới hạn đứt nét (GT-030). */
export function drawMeasurementGuideBar(
  ctx: CanvasRenderingContext2D,
  slot: Slot
): void {
  const barX = slot.x - slot.w / 2;
  const barY = slot.y - slot.h / 2;

  ctx.save();
  ctx.fillStyle = designTokens.colors.surface[200];
  ctx.strokeStyle = designTokens.colors.surface[300];
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(barX, barY, slot.w, slot.h, 12);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = designTokens.colors.surface[400];
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(barX, barY - 6);
  ctx.lineTo(barX, barY + slot.h + 6);
  ctx.moveTo(barX + slot.w, barY - 6);
  ctx.lineTo(barX + slot.w, barY + slot.h + 6);
  ctx.stroke();
  ctx.restore();
}

/**
 * Vạch chéo tô khe hoặc chỗ chồng giữa hai đơn vị đo (GT-030, `BR-E030-06`).
 * Là phản hồi dạy học nên dùng màu trung tính, không dùng màu báo sai.
 */
export function drawUnitGapHatch(
  ctx: CanvasRenderingContext2D,
  rect: {
    readonly x: number;
    readonly y: number;
    readonly w: number;
    readonly h: number;
  }
): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.strokeStyle = designTokens.colors.surface[500];
  ctx.lineWidth = 3;
  const step = 8;
  for (let d = -rect.h; d < rect.w + rect.h; d += step) {
    ctx.beginPath();
    ctx.moveTo(rect.x + d, rect.y + rect.h);
    ctx.lineTo(rect.x + d + rect.h, rect.y);
    ctx.stroke();
  }
  ctx.restore();
}

// ── Tia số có ếch nhảy cóc (GT-028, `BR-E028-08`) ─────────────────────

/** Một cú nhảy của ếch giữa hai mốc kéo dài ngần này ms. */
export const FROG_HOP_MS = 450;

export const FROG_BADGE_W_PX = 48;
export const FROG_TARGET_W_PX = 36;
const FROG_LINE_INSET_PX = 8;
const FROG_OVERFLOW_GAP_PX = 12;
/** Khe tối thiểu giữa thân ếch và nhãn kề (`+n`, số đích). */
const FROG_CLEARANCE_PX = 4;
const FROG_MIN_SIZE_PX = 18;
const FROG_LIFT_CAP_PX = 10;

export interface FrogLineLayout {
  /** Vị trí ếch khi vượt quá mốc cuối (không trùng mốc đích). */
  readonly overflowX: number;
  readonly frogSize: number;
  readonly lineY: number;
  /** Hoành độ các mốc 0..N, tăng dần. */
  readonly tickXs: readonly number[];
  readonly targetX: number;
  readonly badgeX: number;
  readonly x0: number;
  readonly x1: number;
}

/**
 * Bố cục tia số trong dải nhãn `rect`: ký hiệu `+n` bên trái, trục có `ticks + 1`
 * mốc, số đích bên phải; sau mốc cuối có một chỗ "ngoài mút" cho ếch khi trẻ
 * đếm vượt đích mà không tô điểm gì thêm.
 */
export function frogLineLayout(rect: ZoneRect, ticks: number): FrogLineLayout {
  const n = Math.max(1, ticks);
  const frogSizeFor = (spacing: number): number =>
    Math.max(FROG_MIN_SIZE_PX, Math.min(rect.h * 0.5, spacing * 1.5));
  // Lượt đầu đo cỡ ếch lớn nhất có thể; chừa nửa thân ếch ở hai đầu trục để ếch
  // ở vạch 0 không chạm nhãn `+n` và ếch ngoài mút không chạm số đích
  // (`BR-E028-10`). Lượt hai dùng đúng khoảng trống đã chừa.
  const rawX0 = rect.x + FROG_BADGE_W_PX + FROG_LINE_INSET_PX;
  const rawX1 =
    rect.x +
    rect.w -
    FROG_TARGET_W_PX -
    FROG_LINE_INSET_PX -
    FROG_OVERFLOW_GAP_PX * 2;
  const reserve = frogSizeFor((rawX1 - rawX0) / n) / 2 + FROG_CLEARANCE_PX;
  const x0 = rawX0 + reserve;
  const x1 = rawX1 - reserve;
  const spacing = (x1 - x0) / n;
  const tickXs: number[] = [];
  for (let i = 0; i <= n; i++) {
    tickXs.push(x0 + i * spacing);
  }
  return {
    badgeX: rect.x + FROG_BADGE_W_PX / 2,
    frogSize: frogSizeFor(spacing),
    lineY: rect.y + rect.h * 0.78,
    overflowX: x1 + FROG_OVERFLOW_GAP_PX,
    targetX: rect.x + rect.w - FROG_TARGET_W_PX / 2,
    tickXs,
    x0,
    x1,
  };
}

function frogSpotX(layout: FrogLineLayout, tick: number): number {
  const last = layout.tickXs.length - 1;
  if (tick > last) {
    return layout.overflowX;
  }
  return layout.tickXs[Math.max(0, tick)] ?? layout.x0;
}

function frogRestY(layout: FrogLineLayout): number {
  return layout.lineY - layout.frogSize * 0.34 - 1;
}

/**
 * Toạ độ tâm thân ếch ở `elapsedMs` kể từ lúc bắt đầu nhảy từ mốc `fromTick`
 * sang `toTick` (mốc lớn hơn N là chỗ ngoài mút). Hàm thuần: nhảy theo cung
 * parabol, xong cú nhảy thì đứng yên trên trục. `reduced_motion` tới thẳng mốc
 * cuối, không nhấc lên.
 */
export function frogHopPose(
  layout: FrogLineLayout,
  fromTick: number,
  toTick: number,
  elapsedMs: number,
  reducedMotion: boolean
): { x: number; y: number } {
  const restY = frogRestY(layout);
  const toX = frogSpotX(layout, toTick);
  const fromX = frogSpotX(layout, fromTick);
  const p = Math.min(1, Math.max(0, elapsedMs / FROG_HOP_MS));
  if (reducedMotion || fromX === toX || p >= 1) {
    return { x: toX, y: restY };
  }
  const eased = p * p * (3 - 2 * p);
  const lift = Math.min(layout.frogSize * 0.45, FROG_LIFT_CAP_PX);
  return {
    x: fromX + (toX - fromX) * eased,
    y: restY - lift * 4 * p * (1 - p),
  };
}

/** Ếch xanh vẽ vector: thân bầu dục, hai mắt nhô, chân sau. Tâm thân tại `(x, y)`. */
export function drawFrog(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
): void {
  const rx = size * 0.5;
  const ry = size * 0.34;
  const green = designTokens.colors.montessori.emeraldBright;
  const dark = designTokens.colors.montessori.emerald;
  ctx.save();
  ctx.fillStyle = green;
  ctx.strokeStyle = dark;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Chân sau
  ctx.beginPath();
  ctx.ellipse(
    x - rx * 0.85,
    y + ry * 0.75,
    rx * 0.32,
    ry * 0.4,
    0,
    0,
    Math.PI * 2
  );
  ctx.ellipse(
    x + rx * 0.85,
    y + ry * 0.75,
    rx * 0.32,
    ry * 0.4,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();
  // Hai mắt nhô lên đầu
  for (const dx of [-0.42, 0.42]) {
    const ex = x + rx * dx;
    const ey = y - ry * 0.95;
    ctx.fillStyle = designTokens.colors.surface[0];
    ctx.beginPath();
    ctx.arc(ex, ey, size * 0.14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = designTokens.colors.surface[900];
    ctx.beginPath();
    ctx.arc(ex, ey, size * 0.06, 0, Math.PI * 2);
    ctx.fill();
  }
  // Miệng cười
  ctx.strokeStyle = dark;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y + ry * 0.05, rx * 0.34, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  ctx.restore();
}

export interface FrogNumberLineSpec {
  /** Mốc ếch đang nhảy từ đó. */
  readonly fromTick: number;
  readonly hopElapsedMs: number;
  readonly step: number;
  /**
   * Số bước trục vẽ ra (mốc 0..`ticks`) — bằng số vật có thể chạm, **không** suy
   * từ `target / step`: trục dài đúng bằng số lần cần nhảy thì mốc cuối là đáp án.
   */
  readonly ticks: number;
  /** Mốc ếch nhảy tới (= số vật đã chọn). */
  readonly toTick: number;
}

/** Bán kính lá cờ đích: cờ rộng ≈ 1,3 r nên vừa cột đích 36 px và dải nhãn. */
export function goalFlagRadius(rect: ZoneRect): number {
  return Math.min(FROG_TARGET_W_PX / 2, rect.h * 0.4);
}

/**
 * Dải tia số trong dải nhãn: `+n`, trục và mốc, lá cờ đích, ếch. Chỉ số và hình —
 * không chữ cái (`BR-E028-05`). Ếch phản ánh số lần trẻ đã đếm; lá cờ đích
 * không số đứng riêng bên phải (`BR-E028-12`), không gắn vào mốc nào, và trục dài theo số vật chứ không theo
 * đích — nên tia số không chấm trước khi nộp (`BR-E028-03`).
 */
export function drawFrogNumberLine(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  rect: ZoneRect,
  spec: FrogNumberLineSpec
): void {
  const layout = frogLineLayout(rect, Math.max(1, spec.ticks));
  const fontPx = canvasFontPx(rs.logicSpace, "hud", rs.viewport?.scale);
  ctx.save();
  // Trục
  ctx.strokeStyle = designTokens.colors.surface[600];
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(layout.x0, layout.lineY);
  ctx.lineTo(layout.x1 + FROG_OVERFLOW_GAP_PX * 1.5, layout.lineY);
  ctx.stroke();
  // Mốc
  ctx.strokeStyle = designTokens.colors.surface[700];
  ctx.lineWidth = 2;
  for (const tx of layout.tickXs) {
    ctx.beginPath();
    ctx.moveTo(tx, layout.lineY - 4);
    ctx.lineTo(tx, layout.lineY + 4);
    ctx.stroke();
  }
  // Ký hiệu `+n` và số đích
  applyCanvasFontAtSize(ctx, fontPx, "sans", "bold");
  ctx.textBaseline = "middle";
  ctx.fillStyle = designTokens.colors.montessori.amberDark;
  ctx.textAlign = "center";
  ctx.fillText(`+${spec.step}`, layout.badgeX, rect.y + rect.h / 2);
  ctx.restore();
  // Đích là lá cờ không số (`BR-E028-12`); số đích chỉ đọc thành tiếng.
  drawGoalFlag(ctx, layout.targetX, rect.y + rect.h / 2, goalFlagRadius(rect));
  const pose = frogHopPose(
    layout,
    spec.fromTick,
    spec.toTick,
    spec.hopElapsedMs,
    rs.reducedMotion
  );
  drawFrog(ctx, pose.x, pose.y, layout.frogSize);
}

// ── Nhóm theo `step`: đôi tất, bàn tay, bó que tính (GT-028, `BR-E028-09`) ──

/** Số đơn vị trong nhóm: 2 chiếc tất, 5 ngón tay, 10 que tính. */
export function stepGroupUnitCount(step: 2 | 5 | 10): number {
  return step;
}

const HAND_FINGER_HEIGHTS = [0.34, 0.44, 0.5, 0.44, 0.34] as const;

function drawSockPair(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number
): void {
  const m = designTokens.colors.montessori;
  const colors = [m.coral, m.indigo] as const;
  colors.forEach((color, k) => {
    const sx = cx + size * (k === 0 ? -0.24 : 0.24);
    ctx.fillStyle = color;
    ctx.strokeStyle = m.woodBorder;
    ctx.beginPath();
    ctx.roundRect(
      sx - size * 0.15,
      cy - size * 0.42,
      size * 0.3,
      size * 0.62,
      4
    );
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(
      sx + size * 0.08,
      cy + size * 0.22,
      size * 0.2,
      size * 0.14,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.stroke();
  });
}

function drawHand(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number
): void {
  const m = designTokens.colors.montessori;
  ctx.fillStyle = m.amberLight;
  ctx.strokeStyle = m.amberDark;
  ctx.beginPath();
  ctx.ellipse(cx, cy + size * 0.18, size * 0.3, size * 0.26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  HAND_FINGER_HEIGHTS.forEach((ratio, i) => {
    const fx = cx + (i - 2) * size * 0.17;
    const fh = size * ratio;
    ctx.beginPath();
    ctx.roundRect(
      fx - size * 0.07,
      cy + size * 0.1 - fh,
      size * 0.14,
      fh,
      size * 0.07
    );
    ctx.fill();
    ctx.stroke();
  });
}

function drawStickBundle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number
): void {
  const m = designTokens.colors.montessori;
  ctx.fillStyle = m.amber;
  ctx.strokeStyle = m.amberDark;
  for (let i = 0; i < 10; i++) {
    const qx = cx + ((i % 5) - 2) * size * 0.17;
    const qy = cy - size * 0.46 + Math.floor(i / 5) * size * 0.5;
    ctx.beginPath();
    ctx.roundRect(qx - size * 0.06, qy, size * 0.12, size * 0.42, 3);
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = alpha(m.coral, 0.9);
  ctx.fillRect(cx - size * 0.5, cy - size * 0.06, size, size * 0.12);
}

/**
 * Biểu tượng nhóm của một lần nhảy, tâm `(cx, cy)`, cạnh `size`: đôi tất,
 * bàn tay, bó que tính. Mỗi đơn vị (tất, ngón, que) đúng một `roundRect` để
 * đếm được bằng mắt lẫn bằng test.
 */
export function drawStepGroupIcon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  step: 2 | 5 | 10
): void {
  ctx.save();
  ctx.lineWidth = 1.5;
  if (step === 2) {
    drawSockPair(ctx, cx, cy, size);
  } else if (step === 5) {
    drawHand(ctx, cx, cy, size);
  } else {
    drawStickBundle(ctx, cx, cy, size);
  }
  ctx.restore();
}
