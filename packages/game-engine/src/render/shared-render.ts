import { CONTENT_TOP_PX, TRAY_ZONE_H_PX } from "#src/layout/constants";
import type { ZoneRect } from "#src/layout/stage-zones.js";
import type { Slot } from "#src/layout/types";
import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";
import {
  getCachedGradient,
  getContextGeneration,
  PRIMITIVE_GRADIENTS,
  setCachedGradient,
} from "./cache.js";
import { alpha } from "./color-utils.js";
import {
  drawAssetInSlot,
  drawTextInSlot,
  graphemes,
} from "./shared-slot-render.js";
import {
  applyCanvasFontAtSize,
  canvasFontPx,
  type LogicSpace,
  spaceOf,
} from "./type-scale.js";
import type { RenderAsset, SceneBox } from "./types.js";
import {
  drawBambooJointAccent,
  drawDoPaperFiberMarks,
} from "./vn-folk-motifs.js";

/**
 * Nguyên thuỷ vẽ dùng chung cho `render()` của mọi engine.
 *
 * Mọi kích thước lấy từ `RenderSystem.LOGIC_WIDTH/LOGIC_HEIGHT` chứ ❌ NEVER
 * viết `960`/`540` vào thân hàm. Toạ độ **item** luôn tới từ `Slot` do
 * `resolveLayout()` sinh (`BR-ERC-03`).
 */

const PROMPT_TOP_RATIO = 0.045;
const PROMPT_MAX_LINES = 2;

export function sceneBox(rs: RenderSystem): SceneBox {
  return { x: 0, y: 0, w: rs.LOGIC_WIDTH, h: rs.LOGIC_HEIGHT };
}

/** Hào quang màu hổ phách khi kéo vật phẩm qua ô đích */
export function drawTargetHoverAura(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  phase = 0
): void {
  ctx.save();
  const pulse = 1 + Math.sin(phase * Math.PI * 2) * 0.08;
  const r = radius * pulse;
  const slotIndex = Math.round(x) * 100_000 + Math.round(y) * 100;
  const generation = getContextGeneration(ctx);
  let auraGrad = getCachedGradient(
    ctx,
    generation,
    PRIMITIVE_GRADIENTS.TARGET_HOVER_AURA,
    slotIndex
  );
  if (!auraGrad) {
    auraGrad = ctx.createRadialGradient(x, y, r * 0.3, x, y, r * 1.3);
    auraGrad.addColorStop(0, alpha(designTokens.colors.montessori.amber, 0.45));
    auraGrad.addColorStop(
      0.7,
      alpha(designTokens.colors.montessori.amberLight, 0.2)
    );
    auraGrad.addColorStop(1, alpha(designTokens.colors.surface[0], 0));
    setCachedGradient(
      ctx,
      generation,
      PRIMITIVE_GRADIENTS.TARGET_HOVER_AURA,
      slotIndex,
      auraGrad
    );
  }
  ctx.fillStyle = auraGrad;
  ctx.beginPath();
  ctx.arc(x, y, r * 1.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Hào quang hút nam châm xanh ngọc ấm khi quân cờ tiến vào bán kính bắt dính của đích (Task #314).
 */
export function drawMagneticSnapHalo(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  strength = 0.8,
  phase = 0
): void {
  if (!(Number.isFinite(x) && Number.isFinite(y)) || radius <= 0) {
    return;
  }
  const clampedStrength = Math.min(1, Math.max(0.15, strength));
  const pulse = 1 + Math.sin(phase * Math.PI * 2) * 0.09;
  const r = radius * pulse;
  const slotIndex = Math.round(x) * 100_000 + Math.round(y) * 100;
  const generation = getContextGeneration(ctx);
  let snapGrad = getCachedGradient(
    ctx,
    generation,
    PRIMITIVE_GRADIENTS.MAGNETIC_SNAP_HALO,
    slotIndex
  );
  if (!snapGrad) {
    snapGrad = ctx.createRadialGradient(x, y, r * 0.28, x, y, r * 1.42);
    snapGrad.addColorStop(
      0,
      alpha(designTokens.colors.montessori.snapHalo, 0.46)
    );
    snapGrad.addColorStop(
      0.65,
      alpha(designTokens.colors.montessori.amberLight, 0.24)
    );
    snapGrad.addColorStop(1, alpha(designTokens.colors.surface[0], 0));
    setCachedGradient(
      ctx,
      generation,
      PRIMITIVE_GRADIENTS.MAGNETIC_SNAP_HALO,
      slotIndex,
      snapGrad
    );
  }
  ctx.save();
  ctx.globalAlpha *= 0.65 + clampedStrength * 0.35;
  ctx.fillStyle = snapGrad;
  ctx.beginPath();
  ctx.arc(x, y, r * 1.42, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Ngắt dòng prompt văn bản tự động vừa với bề rộng tối đa của card (BR-ERC-15).
 */
export function wrapPromptText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxLineWidth: number
): readonly string[] {
  if (!text) {
    return [];
  }
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = ctx.measureText(testLine).width;
    if (width <= maxLineWidth || !currentLine) {
      currentLine = testLine;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

/** Giữ `PROMPT_MAX_LINES` dòng; dòng cuối cắt theo ký tự (không theo UTF-16) kèm "…". */
function capPromptLines(
  ctx: CanvasRenderingContext2D,
  lines: readonly string[],
  maxWidth: number
): readonly string[] {
  if (lines.length <= PROMPT_MAX_LINES) {
    return lines;
  }
  const kept = lines.slice(0, PROMPT_MAX_LINES - 1);
  const chars = graphemes(lines.slice(PROMPT_MAX_LINES - 1).join(" "));
  while (
    chars.length > 1 &&
    ctx.measureText(`${chars.join("")}…`).width > maxWidth
  ) {
    chars.pop();
  }
  return [...kept, `${chars.join("")}…`];
}

interface CachedPromptLayout {
  readonly lines: readonly string[];
  readonly contentW: number;
}

const promptWrapCache = new WeakMap<
  CanvasRenderingContext2D,
  Map<string, CachedPromptLayout>
>();

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: adaptive multi-line prompt renderer
export function drawPromptText(
  ctx: CanvasRenderingContext2D,
  rsOrPrompt: RenderSystem | string,
  promptMaybe?: string
): void {
  const prompt =
    typeof rsOrPrompt === "string" ? rsOrPrompt : (promptMaybe ?? "");
  const rs = typeof rsOrPrompt === "object" ? rsOrPrompt : undefined;
  const width = rs?.LOGIC_WIDTH ?? 960;
  const height = rs?.LOGIC_HEIGHT ?? 540;

  if (!prompt) {
    return;
  }

  const space: LogicSpace = {
    w: width,
    h: height,
  };
  const fontPx = canvasFontPx(space, "prompt", rs?.viewport?.scale);

  ctx.save();
  applyCanvasFontAtSize(ctx, fontPx, "sans", "bold");

  const maxCardW = Math.min(860, width - 40);
  const maxContentW = maxCardW - 48;

  let ctxCache = promptWrapCache.get(ctx);
  if (!ctxCache) {
    ctxCache = new Map<string, CachedPromptLayout>();
    promptWrapCache.set(ctx, ctxCache);
  }
  const cacheKey = `${fontPx}|${maxContentW}|${prompt}`;
  let cachedLayout = ctxCache.get(cacheKey);

  if (!cachedLayout) {
    const singleLineWidth = ctx.measureText(prompt).width;
    let lines: readonly string[];
    let contentW: number;

    if (singleLineWidth <= maxContentW) {
      lines = [prompt];
      contentW = singleLineWidth;
    } else {
      lines = capPromptLines(
        ctx,
        wrapPromptText(ctx, prompt, maxContentW),
        maxContentW
      );
      let maxW = 0;
      for (const line of lines) {
        const w = ctx.measureText(line).width;
        if (w > maxW) {
          maxW = w;
        }
      }
      contentW = maxW;
    }
    cachedLayout = { lines, contentW };
    if (ctxCache.size > 256) {
      ctxCache.clear();
    }
    ctxCache.set(cacheKey, cachedLayout);
  }

  const { lines, contentW } = cachedLayout;

  const cardW = Math.max(280, Math.min(maxCardW, contentW + 48));
  const lineHeight = Math.round(fontPx * 1.35);
  const lineCount = Math.max(1, lines.length);
  const cardH = Math.max(54, 20 + lineCount * lineHeight);
  const cardX = (width - cardW) / 2;
  const cardY = Math.max(
    8,
    Math.min(height * PROMPT_TOP_RATIO, CONTENT_TOP_PX - cardH - 4)
  );
  const radius = Math.min(27, cardH / 2);

  // Ambient card shadow
  ctx.save();
  ctx.shadowColor = alpha(designTokens.colors.montessori.woodBorder, 0.16);
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = designTokens.colors.vnMaterials.doPaper.sheet;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, radius);
  ctx.fill();
  ctx.restore();

  // Thẻ giấy dó viền tre ngà ấm
  ctx.fillStyle = designTokens.colors.vnMaterials.doPaper.sheet;
  ctx.strokeStyle = designTokens.colors.vnMaterials.bamboo.stalk;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, radius);
  ctx.fill();
  ctx.stroke();

  // Đốt tre mảnh trang trí hai đầu thẻ câu lệnh
  if (cardW >= 220) {
    drawBambooJointAccent(
      ctx,
      cardX + radius + 6,
      cardY + cardH - 4,
      cardX + cardW - radius - 6,
      cardY + cardH - 4,
      3
    );
  }

  // Prompt text (tương phản cao >11:1 trên nền giấy dó)
  ctx.fillStyle = designTokens.colors.vnMaterials.doPaper.ink;
  applyCanvasFontAtSize(ctx, fontPx, "sans", "bold");
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const textCenterX = cardX + cardW / 2;
  const startY = cardY + (cardH - (lineCount - 1) * lineHeight) / 2;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line) {
      ctx.fillText(line, textCenterX, startY + i * lineHeight);
    }
  }

  ctx.restore();
}

/**
 * Vùng chữ nhật của thẻ gỗ trung tâm hiển thị vật thể / câu đố lớn cho trẻ
 * (GT-001, GT-009, GT-026...).
 */
export function getCentralTargetCardSlot(
  logicSpace: LogicSpace,
  stage?: ZoneRect
): Slot {
  if (stage) {
    const dockH = Math.min(130, Math.floor(stage.h * 0.42));
    const availH = stage.h - dockH - 20;
    const cardH = Math.round(Math.min(180, Math.max(100, availH)));
    const cardW = cardH;
    const cardX = stage.x + (stage.w - cardW) / 2;
    const cardY = stage.y + Math.max(6, Math.floor((availH - cardH) / 2) + 6);
    return {
      index: 0,
      x: Math.round(cardX + cardW / 2),
      y: Math.round(cardY + cardH / 2),
      w: cardW,
      h: cardH,
      hitW: cardW,
      hitH: cardH,
      page: 0,
      role: "target",
    };
  }
  const cardW = 180;
  const cardH = 180;
  const cardX = (logicSpace.w - cardW) / 2;
  const cardY = logicSpace.h * 0.22;
  return {
    index: 0,
    x: cardX + cardW / 2,
    y: cardY + cardH / 2,
    w: cardW,
    h: cardH,
    hitW: cardW,
    hitH: cardH,
    page: 0,
    role: "target",
  };
}

export function drawCentralTargetCard(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  asset?: RenderAsset | null,
  text?: string,
  stage?: ZoneRect
): void {
  const slot = getCentralTargetCardSlot(rs.logicSpace, stage);
  const cardW = slot.w;
  const cardH = slot.h;
  const cardX = slot.x - cardW / 2;
  const cardY = slot.y - cardH / 2;

  ctx.save();
  // 1. Ambient drop shadow
  ctx.save();
  ctx.shadowColor = alpha(designTokens.colors.montessori.woodBorder, 0.2);
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = designTokens.colors.vnMaterials.doPaper.sheet;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 28);
  ctx.fill();
  ctx.restore();

  // 2. 3D Bottom Wood Slab
  ctx.save();
  ctx.translate(0, 6);
  ctx.fillStyle = designTokens.colors.montessori.woodBorder;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 28);
  ctx.fill();
  ctx.restore();

  // 3. Thân thẻ giấy dó mộc & viền tre ngà
  ctx.fillStyle = designTokens.colors.vnMaterials.doPaper.sheet;
  ctx.strokeStyle = designTokens.colors.vnMaterials.bamboo.stalk;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 28);
  ctx.fill();
  ctx.stroke();

  // 3b. Xơ giấy dó & thanh đốt tre ngà mảnh
  drawDoPaperFiberMarks(ctx, cardX, cardY, cardW, cardH);
  if (cardW >= 110) {
    drawBambooJointAccent(
      ctx,
      cardX + 30,
      cardY + cardH - 8,
      cardX + cardW - 30,
      cardY + cardH - 8,
      2
    );
  }

  // 4. Specular White Highlight
  ctx.strokeStyle = alpha(designTokens.colors.surface[0], 0.9);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cardX + 28, cardY + 6);
  ctx.lineTo(cardX + cardW - 28, cardY + 6);
  ctx.stroke();

  // 5. Draw Asset or Text
  if (text) {
    drawTextInSlot(ctx, text, slot, designTokens.colors.montessori.amberDark);
  } else if (asset) {
    drawAssetInSlot(ctx, asset, slot);
  }

  ctx.restore();
}

/** Tính toạ độ và kích thước dock khay gỗ, tương thích khi có hoặc chưa có stage zone. */
export function getWoodenTokenDockRect(
  space: LogicSpace,
  stage?: ZoneRect
): ZoneRect {
  const dockW = (stage ? stage.w : space.w) * 0.9;
  const dockH = stage
    ? Math.min(130, Math.floor(stage.h * 0.42))
    : TRAY_ZONE_H_PX;
  const dockX = stage ? stage.x + (stage.w - dockW) / 2 : (space.w - dockW) / 2;
  const dockY = stage ? stage.y + stage.h - dockH - 6 : space.h - dockH - 12;
  return {
    x: Math.round(dockX),
    y: Math.round(dockY),
    w: Math.round(dockW),
    h: Math.round(dockH),
  };
}

/** Độ dày tấm gỗ đáy hắt xuống dưới mặt dock. */
const DOCK_SLAB_DEPTH_PX = 4;

/**
 * Dock khay gỗ mộc & tre ngà cho các token lựa chọn, vẽ trọn trong `rect`
 * (`BR-PSZ-01`, Task #277 S5): mặt dock cộng tấm gỗ đáy không vượt đáy rect.
 */
export function drawWoodenTokenDock(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  rect?: ZoneRect
): void {
  const { space } = spaceOf(rs);
  const dock = rect ?? getWoodenTokenDockRect(space);
  const { x: dockX, y: dockY, w: dockW } = dock;
  const dockH = Math.max(0, dock.h - DOCK_SLAB_DEPTH_PX);
  const radius = Math.min(32, Math.floor(dockH / 2));

  ctx.save();
  // 1. Ambient drop shadow
  ctx.save();
  ctx.shadowColor = alpha(designTokens.colors.montessori.woodBorder, 0.16);
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = designTokens.colors.vnMaterials.woodGrain.surface;
  ctx.beginPath();
  ctx.roundRect(dockX, dockY, dockW, dockH, radius);
  ctx.fill();
  ctx.restore();

  // 2. 3D Bottom Wood Slab
  ctx.save();
  ctx.translate(0, DOCK_SLAB_DEPTH_PX);
  ctx.fillStyle = designTokens.colors.montessori.woodBorder;
  ctx.beginPath();
  ctx.roundRect(dockX, dockY, dockW, dockH, radius);
  ctx.fill();
  ctx.restore();

  // 3. Dock Surface & Warm Bamboo-Wood Bevel
  ctx.fillStyle = designTokens.colors.vnMaterials.woodGrain.surface;
  ctx.strokeStyle = designTokens.colors.vnMaterials.bamboo.joint;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.roundRect(dockX, dockY, dockW, dockH, radius);
  ctx.fill();
  ctx.stroke();

  // 3b. Vân gỗ mộc & đốt tre ngà trang trí lòng khay (không gọi roundRect)
  if (dockH >= 48 && dockW >= 180) {
    ctx.strokeStyle = alpha(
      designTokens.colors.vnMaterials.woodGrain.groove,
      0.3
    );
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(dockX + radius + 8, dockY + dockH * 0.68);
    ctx.lineTo(dockX + dockW * 0.38, dockY + dockH * 0.68);
    ctx.moveTo(dockX + dockW * 0.62, dockY + dockH * 0.34);
    ctx.lineTo(dockX + dockW - radius - 8, dockY + dockH * 0.34);
    ctx.stroke();

    drawBambooJointAccent(
      ctx,
      dockX + radius + 12,
      dockY + dockH - 6,
      dockX + dockW - radius - 12,
      dockY + dockH - 6,
      4
    );
  }

  // 4. Specular highlight
  ctx.strokeStyle = alpha(designTokens.colors.surface[0], 0.85);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(dockX + radius, dockY + 4);
  ctx.lineTo(dockX + dockW - radius, dockY + 4);
  ctx.stroke();

  ctx.restore();
}

/**
 * Vẽ trong một vùng của bàn chơi, cắt mọi nét tràn ra ngoài (`BR-PSZ-01`).
 */
export function drawClippedToZone(
  ctx: CanvasRenderingContext2D,
  zone: ZoneRect,
  draw: () => void
): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(zone.x, zone.y, zone.w, zone.h);
  ctx.clip();
  draw();
  ctx.restore();
}

/** Dòng phụ dưới câu lệnh — tiêu chí lọc, tên mô hình đích, luật đang hiệu lực. */
export function drawSubPromptText(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  text: string,
  rect?: ZoneRect
): void {
  if (!text) {
    return;
  }
  const { space, scale } = spaceOf(rs);
  const fontPx = canvasFontPx(space, "subPrompt", scale);
  ctx.save();
  applyCanvasFontAtSize(ctx, fontPx, "sans", 500);
  const metrics = ctx.measureText(text);
  const pillW = Math.min(
    rect?.w ?? Number.POSITIVE_INFINITY,
    Math.max(160, metrics.width + 36)
  );
  const pillH = Math.max(32, fontPx + 14);
  const centerX = rect ? rect.x + rect.w / 2 : rs.LOGIC_WIDTH / 2;
  const pillX = centerX - pillW / 2;
  const pillY = rect ? rect.y : rs.LOGIC_HEIGHT * PROMPT_TOP_RATIO + 56;

  ctx.fillStyle = designTokens.colors.montessori.amberLight;
  ctx.strokeStyle = designTokens.colors.montessori.amber;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillW, pillH, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = designTokens.colors.montessori.amberDark;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, centerX, pillY + pillH / 2, pillW - 24);
  ctx.restore();
}

/** Chấm tiến độ trong thẻ phụ: `done` chấm đặc trên `total`, không chữ (`BR-ENG-10`). */
export interface ProgressDotsSpec {
  readonly done: number;
  readonly total?: number;
  readonly badge?: string;
  readonly trailing?: string;
}

const PROGRESS_DOT_MAX = 12;
const PROGRESS_DOT_RADIUS = 8;
const PROGRESS_DOT_GAP = 10;

export function drawProgressDots(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  spec: ProgressDotsSpec,
  rect?: ZoneRect
): void {
  const total = Math.min(
    PROGRESS_DOT_MAX,
    Math.max(0, spec.total ?? spec.done)
  );
  const done = Math.min(total, Math.max(0, spec.done));
  const { space, scale } = spaceOf(rs);
  const fontPx = canvasFontPx(space, "subPrompt", scale);
  const badgeW = spec.badge ? fontPx * 2.4 : 0;
  const trailingW = spec.trailing ? fontPx * 2.4 : 0;
  const pillW = Math.min(
    rect?.w ?? Number.POSITIVE_INFINITY,
    badgeW +
      trailingW +
      total * (PROGRESS_DOT_RADIUS * 2 + PROGRESS_DOT_GAP) +
      28
  );
  const pillH = Math.max(32, fontPx + 14);
  const centerX = rect ? rect.x + rect.w / 2 : rs.LOGIC_WIDTH / 2;
  const pillX = centerX - pillW / 2;
  const pillY = rect ? rect.y : rs.LOGIC_HEIGHT * PROMPT_TOP_RATIO + 56;
  const cy = pillY + pillH / 2;
  const dotsW = Math.max(1, pillW - 28 - badgeW - trailingW);
  const step = Math.min(
    PROGRESS_DOT_RADIUS * 2 + PROGRESS_DOT_GAP,
    total > 0 ? dotsW / total : Number.POSITIVE_INFINITY
  );
  const radius = Math.min(PROGRESS_DOT_RADIUS, step * 0.38);

  ctx.save();
  ctx.fillStyle = designTokens.colors.montessori.amberLight;
  ctx.strokeStyle = designTokens.colors.montessori.amber;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillW, pillH, 16);
  ctx.fill();
  ctx.stroke();

  let x = pillX + 14;
  if (spec.badge) {
    applyCanvasFontAtSize(ctx, fontPx, "sans", 500);
    ctx.fillStyle = designTokens.colors.montessori.amberDark;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(spec.badge, x, cy);
    x += badgeW;
  }
  for (let i = 0; i < total; i++) {
    const dx = x + step / 2 + i * step;
    ctx.beginPath();
    ctx.arc(dx, cy, radius, 0, Math.PI * 2);
    if (i < done) {
      ctx.fillStyle = designTokens.colors.montessori.amberDark;
      ctx.fill();
    } else {
      ctx.lineWidth = 2;
      ctx.strokeStyle = designTokens.colors.montessori.amberDark;
      ctx.stroke();
    }
  }
  if (spec.trailing) {
    applyCanvasFontAtSize(ctx, fontPx, "sans", 500);
    ctx.fillStyle = designTokens.colors.montessori.amberDark;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(spec.trailing, pillX + pillW - 14, cy);
  }
  ctx.restore();
}

// Re-export giữ tương thích mọi đường import & `vi.mock("#src/render/shared-render")`
// biome-ignore lint/performance/noBarrelFile: giữ đường mock của test sau khi tách file
export * from "./craft-shapes.js";
export * from "./flashcard.js";
export * from "./particles.js";
export * from "./scene-background.js";
export * from "./shared-slot-render.js";
export * from "./slot-decor.js";
export * from "./vn-folk-motifs.js";
