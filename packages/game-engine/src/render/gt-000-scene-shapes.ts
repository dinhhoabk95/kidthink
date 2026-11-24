import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";
import { computeSquashStretch } from "#src/systems/spring-physics";
import type {
  GT000PartWholeOperation,
  GT000QuantityRepKind,
  GT000ShapeBadge,
  GT000SortingBasket,
} from "#src/templates/GT-000/scene-board-schema";
import { alpha } from "./color-utils.js";
import { curtainGeometry, drawCurtains } from "./craft-shapes.js";
import { drawQuantityRepresentation } from "./numeracy-primitives.js";
import { drawAssetInSlot } from "./shared-slot-render.js";
import { getEmojiSprite } from "./sprite-registry.js";
import {
  applyCanvasFontAtSize,
  applyEmojiFont,
  legibleFontPx,
} from "./type-scale.js";
import type { RenderAsset } from "./types.js";

const COLORS = designTokens.colors;
const VN = COLORS.vnMaterials;
const MONTESSORI = COLORS.montessori;
const SURFACE = COLORS.surface;
const BRAND = COLORS.brand;
const CTA = COLORS.cta;
const SUCCESS = COLORS.semantic.success;
const ASCII_GLYPH_RE = /^[\w\d?+-]+$/i;

export interface GT000ResolvedVisual {
  readonly id: string;
  readonly label: string;
  readonly glyph?: string;
  readonly asset: RenderAsset | null;
}

function drawGlyphOrSprite(
  ctx: CanvasRenderingContext2D,
  glyph: string,
  cx: number,
  cy: number,
  size: number
): void {
  const sprite = getEmojiSprite(glyph);
  if (sprite) {
    const s = Math.max(14, Math.round(size));
    ctx.drawImage(sprite, Math.round(cx - s / 2), Math.round(cy - s / 2), s, s);
    return;
  }
  ctx.save();
  const isAscii = glyph.length <= 2 && ASCII_GLYPH_RE.test(glyph);
  if (isAscii) {
    applyCanvasFontAtSize(
      ctx,
      Math.max(16, Math.round(size * 0.85)),
      "heading",
      "bold"
    );
    ctx.fillStyle = BRAND[700];
  } else {
    applyEmojiFont(ctx, Math.max(16, Math.round(size * 0.82)));
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(glyph, cx, cy);
  ctx.restore();
}

export function drawVisualInBox(
  ctx: CanvasRenderingContext2D,
  visual: GT000ResolvedVisual | undefined,
  cx: number,
  cy: number,
  size: number
): void {
  if (!visual) {
    drawGlyphOrSprite(ctx, "★", cx, cy, size);
    return;
  }
  if (visual.asset) {
    const slot: Slot = {
      index: 0,
      x: Math.round(cx),
      y: Math.round(cy),
      w: Math.round(size),
      h: Math.round(size),
      hitW: Math.round(size),
      hitH: Math.round(size),
      page: 0,
      role: "neutral",
    };
    if (drawAssetInSlot(ctx, visual.asset, slot, 0.86)) {
      return;
    }
  }
  drawGlyphOrSprite(
    ctx,
    visual.glyph || visual.label.charAt(0) || "★",
    cx,
    cy,
    size
  );
}

/** Rèm bước `recall` kẹp chặt trong `bounds` để không bao giờ tràn ngoài `zones.stage`. */
export function drawGT000BoundedCurtains(
  ctx: CanvasRenderingContext2D,
  slots: readonly Slot[],
  bounds: ZoneRect,
  openness: number | undefined
): void {
  if (openness === undefined || slots.length === 0) {
    return;
  }
  const boxes = slots.map((s) => ({
    x: s.x - s.hitW / 2,
    y: s.y - s.hitH / 2,
    w: s.hitW,
    h: s.hitH,
  }));
  const raw = curtainGeometry(boxes, bounds.x + bounds.w - 2, openness);
  if (!raw) {
    return;
  }
  const minX = bounds.x + 2;
  const maxX = bounds.x + bounds.w - 2;
  const minY = bounds.y + 8;
  const maxY = bounds.y + bounds.h - 2;

  const clampBox = (
    b: {
      readonly x: number;
      readonly y: number;
      readonly w: number;
      readonly h: number;
    } | null
  ) => {
    if (!b) {
      return null;
    }
    const x1 = Math.max(minX, b.x);
    const x2 = Math.min(maxX, b.x + b.w);
    const y1 = Math.max(minY, b.y);
    const y2 = Math.min(maxY, b.y + b.h);
    return x2 - x1 >= 1 && y2 - y1 >= 4
      ? { x: x1, y: y1, w: x2 - x1, h: y2 - y1 }
      : null;
  };

  const winX1 = Math.max(minX, raw.window.x);
  const winX2 = Math.min(maxX, raw.window.x + raw.window.w);
  const winY1 = Math.max(minY, raw.window.y);
  const winY2 = Math.min(maxY, raw.window.y + raw.window.h);
  drawCurtains(ctx, {
    left: clampBox(raw.left),
    right: clampBox(raw.right),
    window: {
      x: winX1,
      y: winY1,
      w: Math.max(4, winX2 - winX1),
      h: Math.max(4, winY2 - winY1),
    },
  });
}

function drawFingerHandRep(
  ctx: CanvasRenderingContext2D,
  box: ZoneRect,
  count: number
): void {
  const safeCount = Math.max(0, Math.min(10, count));
  const hands = safeCount > 5 ? 2 : 1;
  const palmW = Math.min(
    Math.floor((box.w - 16) / hands) - 8,
    Math.round(box.h * 0.56)
  );
  const palmR = Math.max(12, Math.round(palmW * 0.34));
  const startX = box.x + box.w / 2 - ((hands - 1) * (palmW + 12)) / 2;
  const palmY = Math.round(box.y + box.h * 0.66);

  ctx.save();
  for (let h = 0; h < hands; h++) {
    const cx = Math.round(startX + h * (palmW + 12));
    const raisedInHand = Math.max(0, Math.min(5, safeCount - h * 5));
    for (let f = 0; f < 5; f++) {
      const angle = -Math.PI * 0.78 + (f * Math.PI * 0.56) / 4;
      const isUp = f < raisedInHand;
      const len = isUp ? palmR * 1.15 : palmR * 0.48;
      const fx = cx + Math.cos(angle) * (palmR * 0.75 + len * 0.5);
      const fy = palmY + Math.sin(angle) * (palmR * 0.75 + len * 0.5);
      ctx.strokeStyle = isUp ? CTA[500] : VN.bamboo.stalk;
      ctx.lineWidth = Math.max(5, Math.round(palmR * 0.3));
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(
        cx + Math.cos(angle) * palmR * 0.5,
        palmY + Math.sin(angle) * palmR * 0.5
      );
      ctx.lineTo(fx, fy);
      ctx.stroke();
    }
    ctx.fillStyle = MONTESSORI.pawCream;
    ctx.strokeStyle = VN.terracotta.clay;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, palmY, palmR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

/** Mode 2: `cpa_bridge` — cầu nối Vật thật (đếm chạm 1–1) ↔ Mô hình học cụ CPA. */
export function drawGT000CpaBridgeShowcase(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  page: ZoneRect,
  params: {
    readonly count: number;
    readonly repKind: GT000QuantityRepKind;
    readonly concreteGlyph: string;
    readonly exploredCount: number;
    readonly exploreProgress: number;
  }
): void {
  const topBox: ZoneRect = {
    x: page.x + 6,
    y: page.y + 4,
    w: Math.max(24, page.w - 12),
    h: Math.max(24, Math.floor(page.h * 0.48)),
  };
  const botBox: ZoneRect = {
    x: page.x + 6,
    y: topBox.y + topBox.h + 6,
    w: Math.max(24, page.w - 12),
    h: Math.max(24, page.y + page.h - (topBox.y + topBox.h + 10)),
  };

  // 1. Nửa trên: Vật thật xếp hàng 5 (subitizing) + phản hồi đếm chạm
  const displayCount = Math.max(0, Math.min(12, params.count));
  ctx.save();
  ctx.fillStyle = alpha(VN.bamboo.light, 0.72);
  ctx.strokeStyle = VN.bamboo.stalk;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.roundRect(topBox.x, topBox.y, topBox.w, topBox.h, 14);
  ctx.fill();
  ctx.stroke();

  if (displayCount === 0) {
    const fontPx = legibleFontPx(16, rs.viewport?.scale);
    applyCanvasFontAtSize(ctx, fontPx, "sans", 600);
    ctx.fillStyle = SURFACE[500];
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      "(Khay rỗng — 0)",
      topBox.x + topBox.w / 2,
      topBox.y + topBox.h / 2,
      topBox.w - 16
    );
  } else {
    const cols = Math.min(5, displayCount);
    const rows = Math.ceil(displayCount / cols);
    const cellW = Math.floor((topBox.w - 16) / cols);
    const cellH = Math.floor((topBox.h - 12) / rows);
    const itemSize = Math.max(16, Math.min(44, Math.min(cellW, cellH) - 6));
    const litCount =
      params.exploredCount > 0
        ? ((params.exploredCount - 1) % displayCount) + 1
        : 0;

    for (let i = 0; i < displayCount; i++) {
      const rIdx = Math.floor(i / cols);
      const cIdx = i % cols;
      const inRow = Math.min(cols, displayCount - rIdx * cols);
      const rowW = inRow * cellW;
      const cx = Math.round(
        topBox.x + (topBox.w - rowW) / 2 + cIdx * cellW + cellW / 2
      );
      const cy = Math.round(
        topBox.y + (topBox.h - rows * cellH) / 2 + rIdx * cellH + cellH / 2
      );
      const isLit = i < litCount;
      const isLatest = isLit && i === litCount - 1;

      if (isLit) {
        ctx.fillStyle = alpha(MONTESSORI.amberLight, 0.75);
        ctx.strokeStyle = MONTESSORI.amber;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, itemSize * 0.58, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      if (isLatest && params.exploreProgress > 0 && !rs.reducedMotion) {
        const sq = computeSquashStretch(
          params.exploreProgress,
          "bounce",
          false
        );
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(sq.scaleX, sq.scaleY);
        ctx.translate(-cx, -cy);
        drawGlyphOrSprite(ctx, params.concreteGlyph, cx, cy, itemSize * 1.08);
        ctx.restore();
      } else {
        drawGlyphOrSprite(ctx, params.concreteGlyph, cx, cy, itemSize);
      }
    }
  }
  ctx.restore();

  // 2. Nửa dưới: Mô hình học cụ CPA
  const repSlot: Slot = {
    index: 0,
    x: Math.round(botBox.x + botBox.w / 2),
    y: Math.round(botBox.y + botBox.h / 2),
    w: Math.max(24, botBox.w - 8),
    h: Math.max(24, botBox.h - 6),
    hitW: botBox.w,
    hitH: botBox.h,
    page: 0,
    role: "neutral",
  };
  if (params.repKind === "finger") {
    drawFingerHandRep(ctx, botBox, params.count);
    return;
  }
  if (params.repKind === "numeral" || params.repKind === "discrete-object") {
    ctx.save();
    ctx.fillStyle = VN.doPaper.warm;
    ctx.strokeStyle = VN.bamboo.joint;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(botBox.x, botBox.y, botBox.w, botBox.h, 14);
    ctx.fill();
    ctx.stroke();
    const numPx = Math.max(24, Math.min(52, Math.round(botBox.h * 0.62)));
    applyCanvasFontAtSize(ctx, numPx, "heading", "bold");
    ctx.fillStyle = CTA[600];
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(params.count), repSlot.x, repSlot.y);
    ctx.restore();
    return;
  }
  drawQuantityRepresentation(ctx, rs, repSlot, {
    kind: params.repKind,
    count: params.count,
    max: Math.max(10, params.count),
  });
}

function drawPlateCluster(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  count: number,
  glyph: string,
  dimmed = false
): void {
  ctx.save();
  ctx.fillStyle = dimmed ? alpha(SURFACE[100], 0.65) : MONTESSORI.plateLight;
  ctx.strokeStyle = dimmed ? SURFACE[400] : VN.bamboo.joint;
  ctx.lineWidth = 2;
  if (dimmed) {
    ctx.setLineDash([4, 3]);
  }
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);

  const safe = Math.max(0, Math.min(8, count));
  if (safe === 0) {
    ctx.restore();
    return;
  }
  const itemSize = Math.max(12, Math.min(24, Math.round(r * 0.62)));
  if (safe === 1) {
    drawGlyphOrSprite(ctx, glyph, cx, cy, itemSize);
    ctx.restore();
    return;
  }
  const ringR = r * 0.48;
  for (let i = 0; i < safe; i++) {
    const a = -Math.PI / 2 + (i * Math.PI * 2) / safe;
    drawGlyphOrSprite(
      ctx,
      glyph,
      cx + Math.cos(a) * ringR,
      cy + Math.sin(a) * ringR,
      itemSize
    );
  }
  ctx.restore();
}

/** Mode 3: `part_whole` — Sơ đồ Gộp / Tách / Bớt / Chia đều trên đĩa mây. */
export function drawGT000PartWholeShowcase(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  page: ZoneRect,
  params: {
    readonly wholeCount: number;
    readonly partACount: number;
    readonly partBCount: number;
    readonly itemGlyph: string;
    readonly operation: GT000PartWholeOperation;
  }
): void {
  const r = Math.max(
    18,
    Math.min(44, Math.floor(Math.min(page.w * 0.22, page.h * 0.24)))
  );
  const topCx = Math.round(page.x + page.w / 2);
  const topCy = Math.round(page.y + r + 8);
  const botCy = Math.round(page.y + page.h - r - 8);
  const leftCx = Math.round(page.x + page.w * 0.28);
  const rightCx = Math.round(page.x + page.w * 0.72);

  ctx.save();
  ctx.strokeStyle = VN.bamboo.joint;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(topCx - r * 0.4, topCy + r * 0.85);
  ctx.lineTo(leftCx, botCy - r * 0.9);
  ctx.moveTo(topCx + r * 0.4, topCy + r * 0.85);
  ctx.lineTo(rightCx, botCy - r * 0.9);
  ctx.stroke();

  drawPlateCluster(ctx, topCx, topCy, r, params.wholeCount, params.itemGlyph);
  drawPlateCluster(ctx, leftCx, botCy, r, params.partACount, params.itemGlyph);
  drawPlateCluster(
    ctx,
    rightCx,
    botCy,
    r,
    params.partBCount,
    params.itemGlyph,
    params.operation === "take_away"
  );

  let opSymbol = "∧";
  if (params.operation === "combine") {
    opSymbol = "+";
  } else if (params.operation === "take_away") {
    opSymbol = "−";
  } else if (params.operation === "equal_share") {
    opSymbol = "=";
  }
  const midY = Math.round((topCy + botCy) / 2);
  const badgeR = Math.max(11, Math.min(15, Math.round(r * 0.36)));
  ctx.fillStyle = MONTESSORI.amberLight;
  ctx.strokeStyle = MONTESSORI.amber;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(topCx, midY, badgeR, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  const fontPx = legibleFontPx(16, rs.viewport?.scale);
  applyCanvasFontAtSize(ctx, fontPx, "heading", "bold");
  ctx.fillStyle = MONTESSORI.amberDark;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(opSymbol, topCx, midY);
  ctx.restore();
}

/** Mode 5: `sequence_strip` — Toa tàu tre quy luật / trình tự có ô tiêu điểm. */
export function drawGT000SequenceStripShowcase(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  page: ZoneRect,
  params: {
    readonly items: readonly (GT000ResolvedVisual | undefined)[];
    readonly focusSlotIndex: number;
    readonly maskFocusAsMystery: boolean;
    readonly rhythmLabels?: readonly string[];
  }
): void {
  const count = Math.max(1, params.items.length);
  const gap = 6;
  const maxCellW = Math.floor((page.w - 12 - (count - 1) * gap) / count);
  const cellSize = Math.max(
    22,
    Math.min(62, maxCellW, Math.floor(page.h * 0.56))
  );
  const totalW = count * cellSize + (count - 1) * gap;
  const startX = Math.round(page.x + (page.w - totalW) / 2);
  const centerY = Math.round(page.y + page.h * 0.46);

  ctx.save();
  // Thanh ray tre nối các ô quy luật
  ctx.strokeStyle = VN.bamboo.joint;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(startX + cellSize / 2, centerY);
  ctx.lineTo(startX + totalW - cellSize / 2, centerY);
  ctx.stroke();

  for (let i = 0; i < count; i++) {
    const cx = startX + i * (cellSize + gap) + Math.round(cellSize / 2);
    const isFocus = i === params.focusSlotIndex;
    ctx.fillStyle = isFocus ? MONTESSORI.amberGlow : SURFACE[0];
    ctx.strokeStyle = isFocus ? CTA[500] : VN.bamboo.stalk;
    ctx.lineWidth = isFocus ? 3 : 2;
    ctx.beginPath();
    ctx.roundRect(
      cx - cellSize / 2,
      centerY - cellSize / 2,
      cellSize,
      cellSize,
      12
    );
    ctx.fill();
    ctx.stroke();

    if (isFocus && params.maskFocusAsMystery) {
      drawGlyphOrSprite(ctx, "?", cx, centerY, cellSize * 0.72);
    } else {
      drawVisualInBox(ctx, params.items[i], cx, centerY, cellSize * 0.76);
    }

    const rLabel = params.rhythmLabels?.[i]?.trim();
    if (rLabel && page.h >= cellSize + 32) {
      const fontPx = legibleFontPx(16, rs.viewport?.scale);
      applyCanvasFontAtSize(ctx, fontPx, "sans", 600);
      ctx.fillStyle = VN.doPaper.ink;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(rLabel, cx, centerY + cellSize / 2 + 4, cellSize + gap - 2);
    }
  }
  ctx.restore();
}

function drawShapeBadgeIcon(
  ctx: CanvasRenderingContext2D,
  shape: GT000ShapeBadge,
  cx: number,
  cy: number,
  r: number,
  color: string
): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = SURFACE[0];
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  if (shape === "circle") {
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
  } else if (shape === "square") {
    ctx.roundRect(cx - r, cy - r, r * 2, r * 2, 3);
  } else if (shape === "triangle") {
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx + r, cy + r * 0.85);
    ctx.lineTo(cx - r, cy + r * 0.85);
    ctx.closePath();
  } else {
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx + r, cy);
    ctx.lineTo(cx, cy + r);
    ctx.lineTo(cx - r, cy);
    ctx.closePath();
  }
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/** Mode 6: `sorting_baskets` — Hai rổ cói đan kèm nhãn + huy hiệu hình học phi-màu. */
export function drawGT000SortingBasketsShowcase(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  page: ZoneRect,
  baskets: readonly [
    {
      readonly spec: GT000SortingBasket;
      readonly samples: readonly GT000ResolvedVisual[];
    },
    {
      readonly spec: GT000SortingBasket;
      readonly samples: readonly GT000ResolvedVisual[];
    },
  ]
): void {
  const gap = 10;
  const basketW = Math.max(36, Math.floor((page.w - 12 - gap) / 2));
  const basketH = Math.max(44, Math.min(136, page.h - 14));
  const topY = Math.round(page.y + (page.h - basketH) / 2);
  const rims = [BRAND[500], CTA[500]] as const;

  ctx.save();
  for (let b = 0; b < 2; b++) {
    const entry = baskets[b];
    if (!entry) {
      continue;
    }
    const leftX = page.x + 6 + b * (basketW + gap);
    const rim = rims[b] ?? BRAND[500];

    ctx.fillStyle = VN.sedgeMat.base;
    ctx.strokeStyle = rim;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(leftX, topY + 12, basketW, basketH - 12, 14);
    ctx.fill();
    ctx.stroke();

    // Kênh kép WCAG: Huy hiệu hình học + Nhãn tiếng Việt
    drawShapeBadgeIcon(
      ctx,
      entry.spec.shape_badge,
      leftX + 16,
      topY + 12,
      7,
      rim
    );
    const fontPx = legibleFontPx(16, rs.viewport?.scale);
    applyCanvasFontAtSize(ctx, fontPx, "sans", "bold");
    ctx.fillStyle = VN.doPaper.ink;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(
      entry.spec.label,
      leftX + basketW / 2 + 6,
      topY + 10,
      basketW - 24
    );

    const samples = entry.samples;
    const sCount = samples.length;
    if (sCount > 0) {
      const sSize = Math.max(
        16,
        Math.min(34, Math.floor((basketW - 14) / sCount))
      );
      const rowW = sCount * sSize;
      const sy = Math.round(topY + 12 + (basketH - 12) * 0.56);
      for (let i = 0; i < sCount; i++) {
        const sx = Math.round(
          leftX + (basketW - rowW) / 2 + i * sSize + sSize / 2
        );
        drawVisualInBox(ctx, samples[i], sx, sy, sSize * 0.88);
      }
    }
  }
  ctx.restore();
}

/** Mode 7: `cause_effect` — Khung biến đổi Nhân–Quả: Trước ──(Tác nhân)──▶ Sau. */
export function drawGT000CauseEffectShowcase(
  ctx: CanvasRenderingContext2D,
  page: ZoneRect,
  params: {
    readonly beforeVisual: GT000ResolvedVisual | undefined;
    readonly triggerGlyph: string;
    readonly afterVisual: GT000ResolvedVisual | undefined;
    readonly maskAfterAsMystery: boolean;
  }
): void {
  const frameSize = Math.max(
    32,
    Math.min(86, Math.floor(Math.min(page.w * 0.32, page.h * 0.72)))
  );
  const cy = Math.round(page.y + page.h / 2);
  const leftCx = Math.round(page.x + page.w * 0.24);
  const rightCx = Math.round(page.x + page.w * 0.76);
  const midCx = Math.round((leftCx + rightCx) / 2);

  ctx.save();
  // Khung Trước
  ctx.fillStyle = SURFACE[0];
  ctx.strokeStyle = VN.bamboo.joint;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(
    leftCx - frameSize / 2,
    cy - frameSize / 2,
    frameSize,
    frameSize,
    14
  );
  ctx.fill();
  ctx.stroke();
  drawVisualInBox(ctx, params.beforeVisual, leftCx, cy, frameSize * 0.76);

  // Mũi tên biến đổi + Huy hiệu tác nhân ở giữa
  const arrowLeft = leftCx + frameSize / 2 + 6;
  const arrowRight = rightCx - frameSize / 2 - 6;
  if (arrowRight > arrowLeft + 8) {
    ctx.strokeStyle = CTA[500];
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(arrowLeft, cy);
    ctx.lineTo(arrowRight, cy);
    ctx.lineTo(arrowRight - 7, cy - 6);
    ctx.moveTo(arrowRight, cy);
    ctx.lineTo(arrowRight - 7, cy + 6);
    ctx.stroke();
  }
  const trigR = Math.max(12, Math.min(18, Math.round(frameSize * 0.24)));
  ctx.fillStyle = MONTESSORI.amberLight;
  ctx.strokeStyle = MONTESSORI.amber;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(midCx, cy - trigR - 6, trigR, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  drawGlyphOrSprite(
    ctx,
    params.triggerGlyph,
    midCx,
    cy - trigR - 6,
    trigR * 1.3
  );

  // Khung Sau
  ctx.fillStyle = params.maskAfterAsMystery
    ? MONTESSORI.slotRecess
    : SUCCESS[50];
  ctx.strokeStyle = params.maskAfterAsMystery ? CTA[500] : SUCCESS[500];
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(
    rightCx - frameSize / 2,
    cy - frameSize / 2,
    frameSize,
    frameSize,
    14
  );
  ctx.fill();
  ctx.stroke();
  if (params.maskAfterAsMystery) {
    drawGlyphOrSprite(ctx, "?", rightCx, cy, frameSize * 0.7);
  } else {
    drawVisualInBox(ctx, params.afterVisual, rightCx, cy, frameSize * 0.76);
  }
  ctx.restore();
}
