import {
  DEFAULT_LOGIC_SPACE,
  getTouchFloor,
  type LogicSpace,
} from "#src/layout/constants";
import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";
import { canvasFontPx } from "./type-scale.js";
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
  ctx.font = `bold ${labelFontPx}px ${designTokens.fonts.sans}`;
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
