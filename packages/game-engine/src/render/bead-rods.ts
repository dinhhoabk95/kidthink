import type { Slot } from "#src/layout/types";
import { designTokens } from "#src/systems/designTokens";
import type { SceneBox } from "./types.js";

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
