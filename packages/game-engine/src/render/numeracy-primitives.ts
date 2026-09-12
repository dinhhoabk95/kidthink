import {
  DEFAULT_LOGIC_SPACE,
  getTouchFloor,
  type LogicSpace,
} from "#src/layout/constants";
import type { Slot } from "#src/layout/types";
import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";
import { canvasFontPx } from "./type-scale.js";
import type { QuantityRepConfig, SceneBox } from "./types.js";

export function drawPlaceholderBox(
  ctx: CanvasRenderingContext2D,
  slot: Slot
): void {
  ctx.save();
  ctx.fillStyle = designTokens.colors.surface[200];
  ctx.strokeStyle = designTokens.colors.surface[400];
  ctx.lineWidth = 2;
  const w = slot.w / 2;
  const h = slot.h / 2;
  ctx.fillRect(slot.x - w / 2, slot.y - h / 2, w, h);
  ctx.strokeRect(slot.x - w / 2, slot.y - h / 2, w, h);
  ctx.restore();
}

// ── Khung 10 Montessori Ten-Frame (GT-007 / BR-ERC-13 / BR-NRL-07) ──
export function drawTenFrameBoard(
  ctx: CanvasRenderingContext2D,
  box: SceneBox,
  filledCount?: number
): readonly Slot[] {
  const slots: Slot[] = [];
  const rows = 2;
  const cols = 5;
  const padX = box.w * 0.06;
  const padY = box.h * 0.12;
  const cellW = (box.w - padX * 2) / cols;
  const cellH = (box.h - padY * 2) / rows;
  const slotR = Math.min(cellW, cellH) * 0.38;

  ctx.save();
  // Khay gỗ sồi bao quanh
  ctx.save();
  ctx.shadowColor = "rgba(130, 118, 96, 0.16)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = designTokens.colors.surface[100];
  ctx.beginPath();
  ctx.roundRect(box.x, box.y, box.w, box.h, 24);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = designTokens.colors.montessori.woodBevel;
  ctx.lineWidth = 4;
  ctx.stroke();

  // 10 ô lõm tròn
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = box.x + padX + c * cellW + cellW / 2;
      const cy = box.y + padY + r * cellH + cellH / 2;
      const index = r * cols + c;
      const isFilled = filledCount !== undefined && index < filledCount;

      // Hốc tròn lõm (dùng token, cấm hex thô)
      ctx.fillStyle = isFilled
        ? designTokens.colors.montessori.amberLight
        : designTokens.colors.surface[200];
      ctx.strokeStyle = isFilled
        ? designTokens.colors.montessori.amberDark
        : designTokens.colors.montessori.woodBorder;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, slotR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // BR-NRL-07 & T3.6: Ô đầy và ô trống phân biệt bằng HAI kênh thị giác
      if (isFilled) {
        // Kênh 1 + 2: Vòng tròn nổi đậm ở tâm (vị trí + hình dạng khối đầy)
        ctx.fillStyle = designTokens.colors.montessori.amber;
        ctx.beginPath();
        ctx.arc(cx, cy, slotR * 0.65, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Ô trống: dấu cộng/chữ thập tinh tế ở tâm biểu thị ô đón
        const markSize = slotR * 0.35;
        ctx.strokeStyle = designTokens.colors.surface[400];
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx - markSize, cy);
        ctx.lineTo(cx + markSize, cy);
        ctx.moveTo(cx, cy - markSize);
        ctx.lineTo(cx, cy + markSize);
        ctx.stroke();
      }

      slots.push({
        index,
        x: cx,
        y: cy,
        w: slotR * 2,
        h: slotR * 2,
        hitW: slotR * 2,
        hitH: slotR * 2,
        page: 0,
        role: "target",
      });
    }
  }

  // Vạch phân nhóm chia nửa 5 ô trên và 5 ô dưới (BR-NRL-07)
  ctx.strokeStyle = designTokens.colors.montessori.woodBorder;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(box.x + padX, box.y + box.h / 2);
  ctx.lineTo(box.x + box.w - padX, box.y + box.h / 2);
  ctx.stroke();

  ctx.restore();
  return slots;
}

export interface DotPosition {
  readonly x: number;
  readonly y: number;
}

/**
 * Toạ độ chuẩn mặt xúc xắc cho 1–6 (`BR-NRL-08` / T4.1).
 *
 * Tách riêng để engine nào cần **xếp vật thật** theo bố cục xúc xắc cũng dùng
 * đúng một bảng toạ độ. Cấm — NEVER bố cục ngẫu nhiên: nhận-tức-thì dựa vào
 * hình dạng cố định, đổi chỗ chấm là mất trọn giá trị sư phạm.
 */
export function computeDicePositions(
  box: SceneBox,
  value: number
): readonly DotPosition[] {
  const val = Math.max(1, Math.min(6, Math.round(value)));
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const pad = Math.min(box.w, box.h) * 0.22;
  const left = box.x + pad;
  const right = box.x + box.w - pad;
  const top = box.y + pad;
  const bottom = box.y + box.h - pad;

  const dots: DotPosition[] = [];
  switch (val) {
    case 1:
      dots.push({ x: cx, y: cy });
      break;
    case 2:
      dots.push({ x: left, y: top }, { x: right, y: bottom });
      break;
    case 3:
      dots.push({ x: left, y: top }, { x: cx, y: cy }, { x: right, y: bottom });
      break;
    case 4:
      dots.push(
        { x: left, y: top },
        { x: right, y: top },
        { x: left, y: bottom },
        { x: right, y: bottom }
      );
      break;
    case 5:
      dots.push(
        { x: left, y: top },
        { x: right, y: top },
        { x: cx, y: cy },
        { x: left, y: bottom },
        { x: right, y: bottom }
      );
      break;
    case 6:
      dots.push(
        { x: left, y: top },
        { x: right, y: top },
        { x: left, y: cy },
        { x: right, y: cy },
        { x: left, y: bottom },
        { x: right, y: bottom }
      );
      break;
    default:
      break;
  }
  return dots;
}

// ── Chấm xúc xắc chuẩn 1–6 (BR-NRL-08 / T4.1) ──────────────────────
export function drawDotPattern(
  ctx: CanvasRenderingContext2D,
  box: SceneBox,
  value: number,
  options?: {
    dotColor?: string;
    dotRadius?: number;
    /** Vẽ khung thẻ xúc xắc. Tắt khi primitive nằm trong một khay đã có khung. */
    frame?: boolean;
    /** Vẽ emoji của vật thật thay chấm trơn, giữ nguyên bố cục xúc xắc. */
    glyph?: string;
  }
): void {
  const r = options?.dotRadius ?? Math.min(box.w, box.h) * 0.09;
  const dotColor = options?.dotColor ?? designTokens.colors.surface[900];
  const dots = computeDicePositions(box, value);

  ctx.save();
  if (options?.frame !== false) {
    // Khung thẻ xúc xắc clay
    ctx.fillStyle = designTokens.colors.surface[0];
    ctx.strokeStyle = designTokens.colors.surface[300];
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(box.x, box.y, box.w, box.h, 16);
    ctx.fill();
    ctx.stroke();
  }

  if (options?.glyph) {
    ctx.font = `${Math.round(r * 2.2)}px "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", ${designTokens.fonts.sans}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const dot of dots) {
      ctx.fillText(options.glyph, dot.x, dot.y);
    }
    ctx.restore();
    return;
  }

  // Vẽ các chấm xúc xắc
  ctx.fillStyle = dotColor;
  for (const dot of dots) {
    ctx.beginPath();
    ctx.arc(dot.x, dot.y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

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

// ── Dấu gạch tally nhóm 5 (BR-NRL-05 / T4.4) ─────────────────────────
export function drawTally(
  ctx: CanvasRenderingContext2D,
  box: SceneBox,
  count: number,
  options?: {
    strokeColor?: string;
    strokeWidth?: number;
  }
): void {
  const total = Math.max(0, Math.round(count));
  const fullGroups = Math.floor(total / 5);
  const remainder = total % 5;
  const totalGroups = fullGroups + (remainder > 0 ? 1 : 0);

  if (totalGroups === 0) {
    return;
  }

  const strokeW = options?.strokeWidth ?? 4;
  const strokeColor = options?.strokeColor ?? designTokens.colors.surface[800];
  const tallyH = Math.min(box.h * 0.7, 64);
  const stickSpacing = Math.max(10, Math.min(16, strokeW * 3));
  const groupW = stickSpacing * 4;
  // T4.4: Nhóm cách nhau ≥ một bề rộng gạch
  const groupGap = Math.max(strokeW * 4, 20);

  const totalContentW = totalGroups * groupW + (totalGroups - 1) * groupGap;
  // Số nhóm lớn thì cụm gạch rộng hơn hộp; neo vào mép trái thay vì vẽ ra ngoài.
  const startX =
    totalContentW <= box.w ? box.x + (box.w - totalContentW) / 2 : box.x;
  const startY = box.y + (box.h - tallyH) / 2;

  ctx.save();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = strokeW;
  ctx.lineCap = "round";

  let currentGroupX = startX;

  // Vẽ các nhóm 5 đầy đủ
  for (let g = 0; g < fullGroups; g++) {
    // 4 gạch đứng
    for (let s = 0; s < 4; s++) {
      const sx = currentGroupX + s * stickSpacing;
      ctx.beginPath();
      ctx.moveTo(sx, startY);
      ctx.lineTo(sx, startY + tallyH);
      ctx.stroke();
    }
    // Gạch thứ năm bắc ngang (chéo qua 4 gạch từ dưới-trái lên trên-phải)
    ctx.beginPath();
    ctx.moveTo(currentGroupX - 4, startY + tallyH - 4);
    ctx.lineTo(currentGroupX + 3 * stickSpacing + 4, startY + 4);
    ctx.stroke();

    currentGroupX += groupW + groupGap;
  }

  // Vẽ phần dư (1..4 gạch đứng)
  for (let s = 0; s < remainder; s++) {
    const sx = currentGroupX + s * stickSpacing;
    ctx.beginPath();
    ctx.moveTo(sx, startY);
    ctx.lineTo(sx, startY + tallyH);
    ctx.stroke();
  }

  ctx.restore();
}

// ── Bàn tính Rekenrek Montessori (BR-NRL-07 / T4.5 / T4.6) ─────────────
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Rekenrek dual-row Montessori bead renderer
export function drawRekenrek(
  ctx: CanvasRenderingContext2D,
  box: SceneBox,
  count: number,
  options?: {
    maxPerWire?: number;
    rows?: number;
  }
): void {
  const maxPerWire = options?.maxPerWire ?? 10;
  const numRows = options?.rows ?? 2;
  const totalCount = Math.max(
    0,
    Math.min(numRows * maxPerWire, Math.round(count))
  );

  const framePad = 16;
  const wireSpacing = (box.h - framePad * 2) / (numRows + 1);
  /**
   * Hạt phải vừa **cả hai** chiều: cao theo khoảng cách dây, rộng theo bề ngang
   * hộp. Chỉ suy theo chiều cao thì trong slot hẹp mười hạt chồng lên nhau và
   * "5 và thêm mấy" không còn đọc được.
   */
  const wireW = box.w - framePad * 2;
  const beadR = Math.max(
    4,
    Math.min(wireSpacing * 0.42, 18, wireW / (maxPerWire * 1.8) / 2)
  );
  const beadW = beadR * 1.8;

  ctx.save();
  // Khung gỗ Rekenrek
  ctx.fillStyle = designTokens.colors.surface[100];
  ctx.strokeStyle = designTokens.colors.montessori.woodBorder;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(box.x, box.y, box.w, box.h, 20);
  ctx.fill();
  ctx.stroke();

  /**
   * `BR-NRL-07`: vạch phân nhóm phải nằm đúng **mốc 5 hạt** kể từ mép trái —
   * nơi năm hạt đỏ hết và năm hạt trắng bắt đầu. Vạch giữa hộp chỉ đúng khi hạt
   * lấp đầy dây, còn lại thì nó cắt ngang giữa một nhóm và mất nghĩa.
   */
  const groupMarkX = box.x + framePad + 5 * beadW;
  ctx.strokeStyle = designTokens.colors.montessori.woodBevel;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(groupMarkX, box.y + 8);
  ctx.lineTo(groupMarkX, box.y + box.h - 8);
  ctx.stroke();

  let remainingCount = totalCount;

  for (let r = 0; r < numRows; r++) {
    const wireY = box.y + framePad + (r + 1) * wireSpacing;
    const wireLeft = box.x + framePad;
    const wireRight = box.x + box.w - framePad;

    // Dây kim loại xâu hạt
    ctx.strokeStyle = designTokens.colors.surface[400];
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(wireLeft, wireY);
    ctx.lineTo(wireRight, wireY);
    ctx.stroke();

    const activeInRow = Math.min(remainingCount, maxPerWire);
    remainingCount -= activeInRow;
    const inactiveInRow = maxPerWire - activeInRow;

    // T4.5 & T4.6: Hạt đã đẩy sang TRÁI, hạt chưa đẩy dồn sang PHẢI (colorblind safe)!
    // Mỗi hàng 5 đỏ, 5 trắng!
    for (let i = 0; i < activeInRow; i++) {
      const beadX = wireLeft + beadR + i * beadW;
      const isRed = i < 5;
      ctx.fillStyle = isRed
        ? designTokens.colors.montessori.coral
        : designTokens.colors.surface[0];
      ctx.strokeStyle = isRed
        ? designTokens.colors.cta[800]
        : designTokens.colors.surface[500];
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(beadX, wireY, beadR * 0.85, beadR, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    for (let j = 0; j < inactiveInRow; j++) {
      const beadIdx = activeInRow + j;
      const beadX = wireRight - beadR - (inactiveInRow - 1 - j) * beadW;
      const isRed = beadIdx < 5;
      ctx.fillStyle = isRed
        ? designTokens.colors.montessori.coral
        : designTokens.colors.surface[0];
      ctx.strokeStyle = isRed
        ? designTokens.colors.cta[800]
        : designTokens.colors.surface[500];
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(beadX, wireY, beadR * 0.85, beadR, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  ctx.restore();
}

// ── Thanh số Montessori Number Rod (BR-NRL-05 / T4.7) ─────────────────
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Montessori number rod multi-segment renderer
export function drawNumberRod(
  ctx: CanvasRenderingContext2D,
  box: SceneBox,
  units: number,
  options?: {
    maxUnits?: number;
    unitWidth?: number;
    height?: number;
  }
): void {
  const count = Math.max(1, Math.min(10, Math.round(units)));
  const rodH = options?.height ?? Math.min(box.h * 0.6, 44);
  const rodY = box.y + (box.h - rodH) / 2;
  const maxU = options?.maxUnits ?? 10;
  const unitW = options?.unitWidth ?? (box.w - 32) / maxU;
  const totalRodW = count * unitW;
  const rodX = box.x + (box.w - totalRodW) / 2;

  ctx.save();
  // Vẽ thanh liên tục chia đốt bằng nhau, đốt xen kẽ hai màu (đỏ và xanh Montessori)
  for (let i = 0; i < count; i++) {
    const segX = rodX + i * unitW;
    const isRed = i % 2 === 0;
    const fill = isRed
      ? designTokens.colors.montessori.coral
      : designTokens.colors.montessori.indigo;
    const stroke = isRed
      ? designTokens.colors.cta[800]
      : designTokens.colors.montessori.indigoLight;

    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;

    ctx.beginPath();
    if (count === 1) {
      ctx.roundRect(segX, rodY, unitW, rodH, 8);
    } else if (i === 0) {
      ctx.roundRect(segX, rodY, unitW, rodH, [8, 0, 0, 8]);
    } else if (i === count - 1) {
      ctx.roundRect(segX, rodY, unitW, rodH, [0, 8, 8, 0]);
    } else {
      ctx.rect(segX, rodY, unitW, rodH);
    }
    ctx.fill();
    ctx.stroke();

    // Vạch khía phân đốt nhẹ (token + alpha; cấm màu thô theo BR-DSC-02)
    if (i < count - 1) {
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.strokeStyle = designTokens.colors.surface[900];
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(segX + unitW, rodY);
      ctx.lineTo(segX + unitW, rodY + rodH);
      ctx.stroke();
      ctx.restore();
    }
  }

  ctx.restore();
}

/**
 * Dispatcher vẽ một trong các dạng biểu diễn lượng chuẩn (BR-ERC-13).
 *
 * Nhận `kind` thuộc `QuantityRepKind`:
 * - `dot-pattern`: vẽ cụm chấm xúc xắc chuẩn (`drawDotPattern`).
 * - `ten-frame`: vẽ khung 10 (`drawTenFrameBoard`).
 * - `number-line`: vẽ trục số (`drawNumberLine`).
 * - `tally`: vẽ nhóm gạch tally 5 (`drawTally`).
 * - `rekenrek`: vẽ bàn tính 2 hàng hạt (`drawRekenrek`).
 * - `number-rod`: vẽ thanh số Montessori (`drawNumberRod`).
 * - `discrete-object`: vẽ qua `drawSlotItem` / `drawAssetInSlot`.
 * - `finger`: ném lỗi theo BR-NRL-10 (chưa hỗ trợ cử chỉ qua camera trong Phase 1).
 *
 * Trả `true` khi đã vẽ xong bằng một primitive; trả `false` khi `kind` là
 * `discrete-object`, nghĩa là nơi gọi phải đi tiếp đường asset thường.
 */
export function drawQuantityRepresentation(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  slot: Slot,
  config: QuantityRepConfig
): boolean {
  if (config.kind === "finger") {
    throw new Error(
      "BR-NRL-10: finger representation must be mapped to tactile/ten-frame in Phase 1 (no camera input allowed)"
    );
  }

  switch (config.kind) {
    case "dot-pattern": {
      const box: SceneBox = {
        x: slot.x - slot.w / 2,
        y: slot.y - slot.h / 2,
        w: slot.w,
        h: slot.h,
      };
      drawDotPattern(ctx, box, config.count, {
        dotColor: config.color,
      });
      break;
    }
    case "ten-frame": {
      const boardW = Math.min(slot.w, 320);
      const boardH = Math.min(slot.h, 140);
      const box: SceneBox = {
        x: slot.x - boardW / 2,
        y: slot.y - boardH / 2,
        w: boardW,
        h: boardH,
      };
      drawTenFrameBoard(ctx, box, config.count);
      break;
    }
    case "number-line": {
      const lineW = Math.min(slot.w, rs.LOGIC_WIDTH * 0.8);
      const lineH = Math.max(64, slot.h);
      const box: SceneBox = {
        x: slot.x - lineW / 2,
        y: slot.y - lineH / 2,
        w: lineW,
        h: lineH,
      };
      drawNumberLine(ctx, box, {
        min: config.min ?? 0,
        max: config.max ?? 10,
        current: config.count,
        space: {
          w: rs.LOGIC_WIDTH,
          h: rs.LOGIC_HEIGHT,
        },
        scale: rs.viewport?.scale,
      });
      break;
    }
    case "tally": {
      const box: SceneBox = {
        x: slot.x - slot.w / 2,
        y: slot.y - slot.h / 2,
        w: slot.w,
        h: slot.h,
      };
      drawTally(ctx, box, config.count, {
        strokeColor: config.color,
      });
      break;
    }
    case "rekenrek": {
      const box: SceneBox = {
        x: slot.x - slot.w / 2,
        y: slot.y - slot.h / 2,
        w: slot.w,
        h: slot.h,
      };
      drawRekenrek(ctx, box, config.count);
      break;
    }
    case "number-rod": {
      const box: SceneBox = {
        x: slot.x - slot.w / 2,
        y: slot.y - slot.h / 2,
        w: slot.w,
        h: slot.h,
      };
      drawNumberRod(ctx, box, config.count, {
        maxUnits: config.max ?? 10,
      });
      break;
    }
    case "discrete-object":
      /**
       * `discrete-object` KHÔNG có primitive riêng: theo mục 7.7 nó vẽ bằng
       * `drawSlotItem` / `drawAssetInSlot` với asset thật của level. Vẽ ô giữ
       * chỗ ở đây là thay vật thật bằng một ô xám — đúng cái fallback im lặng
       * mà `BR-NRL-10` cấm. Trả `false` để nơi gọi đi tiếp đường asset.
       */
      return false;
    default:
      /**
       * `BR-NRL-10`: gặp `kind` chưa hiện thực thì NÉM LỖI. `content_pack` tới
       * từ jsonb nên union đóng của TypeScript không chặn được giá trị lạ lúc
       * chạy; im lặng không vẽ gì thì báo cáo vẫn ghi là đã dạy lối biểu diễn.
       */
      throw new Error(
        `BR-NRL-10: engine chưa hiện thực quantity representation "${String(config.kind)}" — cấm vẽ vật rời thay`
      );
  }
  return true;
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

export function drawHeaderRepresentation(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  kind: "tally" | "rekenrek",
  count: number
): void {
  if (kind === "tally") {
    const tallyBox: SceneBox = {
      x: rs.LOGIC_WIDTH * 0.25,
      y: rs.LOGIC_HEIGHT * 0.16,
      w: rs.LOGIC_WIDTH * 0.5,
      h: 70,
    };
    drawTally(ctx, tallyBox, count);
  } else if (kind === "rekenrek") {
    const rekenrekBox: SceneBox = {
      x: rs.LOGIC_WIDTH * 0.25,
      y: rs.LOGIC_HEIGHT * 0.14,
      w: rs.LOGIC_WIDTH * 0.5,
      h: 90,
    };
    drawRekenrek(ctx, rekenrekBox, count);
  }
}

export function drawNumberRodAcrossSlots(
  ctx: CanvasRenderingContext2D,
  firstSlot: Slot,
  lastSlot: Slot,
  count: number,
  maxUnits: number
): void {
  const rodW = lastSlot.x + lastSlot.w / 2 - (firstSlot.x - firstSlot.w / 2);
  const rodBox: SceneBox = {
    x: firstSlot.x - firstSlot.w / 2,
    y: firstSlot.y - firstSlot.h / 2,
    w: rodW,
    h: firstSlot.h,
  };
  drawNumberRod(ctx, rodBox, count, { maxUnits });
}

export function computeDiceSlots(
  parentSlot: Slot,
  count: number,
  itemSize = 64
): Slot[] {
  const box: SceneBox = {
    x: parentSlot.x - parentSlot.w / 2,
    y: parentSlot.y - parentSlot.h / 2,
    w: parentSlot.w,
    h: parentSlot.h,
  };
  const positions = computeDicePositions(box, count);
  return positions.map((pos, index) => ({
    ...parentSlot,
    index,
    x: pos.x,
    y: pos.y,
    w: itemSize,
    h: itemSize,
    hitW: itemSize,
    hitH: itemSize,
  }));
}
