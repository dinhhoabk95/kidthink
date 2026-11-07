import {
  CONTENT_TOP_PX,
  DEFAULT_LOGIC_SPACE,
  TRAY_ZONE_H_PX,
} from "#src/layout/constants";
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
  drawPlaceholderBox,
  drawQuantityRepresentation,
} from "./numeracy-primitives.js";
import {
  detectSlotVisualComparisonCue,
  drawCheckMark,
  drawSlotVisualComparisonCue,
} from "./slot-decor.js";
import {
  canvasFontPx,
  type LogicSpace,
  minLegiblePx,
  spaceOf,
} from "./type-scale.js";
import type {
  ItemVisualState,
  RenderAsset,
  RenderItem,
  SceneBox,
} from "./types.js";

/**
 * Nguyên thuỷ vẽ dùng chung cho `render()` của mọi engine.
 *
 * Mọi kích thước lấy từ `RenderSystem.LOGIC_WIDTH/LOGIC_HEIGHT` chứ ❌ NEVER
 * viết `960`/`540` vào thân hàm: bản trước hằng số hoá cả khung nền lẫn vị trí
 * câu lệnh, nên đổi độ phân giải logic là vỡ bố cục mà không cổng nào thấy.
 *
 * Toạ độ **item** luôn tới từ `Slot` do `resolveLayout()` sinh (`BR-ERC-03`).
 * Hàm ở đây chỉ nhận `Slot`, ❌ NEVER tự chế toạ độ cho item.
 */

const PROMPT_TOP_RATIO = 0.045;
const LABEL_FONT_RATIO = 0.16;
const GLYPH_FILL_RATIO = 0.52;

export function getColorsForState(state: ItemVisualState): {
  fill: string;
  border: string;
} {
  switch (state) {
    case "correct":
      return {
        fill: designTokens.colors.semantic.success[100],
        border: designTokens.colors.semantic.success[600],
      };
    case "wrong":
      return {
        fill: designTokens.colors.retry[100],
        border: designTokens.colors.retry[600],
      };
    case "touching":
      return {
        fill: designTokens.colors.montessori.amberLight,
        border: designTokens.colors.montessori.amberDark,
      };
    case "selected":
      return {
        fill: designTokens.colors.montessori.amberLight,
        border: designTokens.colors.montessori.amber,
      };
    case "locked":
      return {
        fill: designTokens.colors.surface[100],
        border: designTokens.colors.surface[400],
      };
    default:
      return {
        fill: designTokens.colors.surface[0],
        border: designTokens.colors.cta[200],
      };
  }
}

export type EmojiResolver = (code: string) => string | null;
let customEmojiResolver: EmojiResolver | null = null;

export function setEmojiResolver(resolver: EmojiResolver | null): void {
  customEmojiResolver = resolver;
}

/**
 * Tra cứu glyph emoji theo `asset.ref` (Task #202 D-EE).
 * Ref chính là glyph UTF-8 thật.
 */
export function resolveEmojiGlyph(ref: string): string | null {
  if (customEmojiResolver) {
    const resolved = customEmojiResolver(ref);
    if (resolved) {
      return resolved;
    }
  }
  if (ref && ref.length > 0) {
    return ref;
  }
  return null;
}

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

const SEGMENTER =
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new Intl.Segmenter("vi", { granularity: "grapheme" })
    : null;

/** Tách chuỗi theo cụm ký tự người đọc thấy — giữ nguyên emoji và dấu tổ hợp (NFD). */
export function graphemes(text: string): string[] {
  return SEGMENTER
    ? Array.from(SEGMENTER.segment(text), (part) => part.segment)
    : Array.from(text);
}

/** Tối đa dòng của khung yêu cầu — khung cao hơn sẽ đè vùng nội dung (`BR-ERC-15`). */
const PROMPT_MAX_LINES = 2;

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
  const fontStr = `bold ${fontPx}px ${designTokens.fonts.sans}`;

  ctx.save();
  ctx.font = fontStr;

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
  /**
   * `BR-ERC-15`: khung yêu cầu không được đè nội dung. `CONTENT_TOP_PX` là mốc
   * mà hình học đặt slot bên dưới, còn `height * PROMPT_TOP_RATIO` lớn dần theo
   * cạnh dài — trên máy dọc (cạnh dài 1168) lề đó một mình đã vượt mốc. Kẹp để
   * đáy khung nằm trong dải trên; prompt phải xuống dòng thì lùi sát mép.
   */
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
  ctx.fillStyle = designTokens.colors.surface[0];
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, radius);
  ctx.fill();
  ctx.restore();

  // Floating claymorphic card body
  ctx.fillStyle = designTokens.colors.surface[0];
  ctx.strokeStyle = designTokens.colors.surface[300];
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, radius);
  ctx.fill();
  ctx.stroke();

  // Prompt text (cùng cỡ font với khi đo, BR-ERC-15) — căn giữa, bỏ badge loa trang trí (H8, Task #277 S3)
  ctx.fillStyle = designTokens.colors.surface[900];
  ctx.font = fontStr;
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

export function drawEmojiContent(
  ctx: CanvasRenderingContext2D,
  emojiRef: string,
  slot: Slot
): boolean {
  return drawAssetInSlot(ctx, { kind: "emoji", ref: emojiRef }, slot);
}

/**
 * Vùng chữ nhật của thẻ gỗ trung tâm hiển thị vật thể / câu đố lớn cho trẻ
 * (GT-001, GT-009, GT-026...), vẽ bởi `drawCentralTargetCard` — một nguồn
 * hình học duy nhất cho cả vẽ và chạm lại nghe từ khoá (Task #273). Tách ra
 * để session dựng `ViewEntity` khớp đúng ô đang vẽ, không đoán lại toạ độ.
 * Nhận `LogicSpace` trực tiếp (không phải `RenderSystem`) để gọi được từ
 * `getView()`, nơi không có `RenderSystem` trong tay.
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
  ctx.fillStyle = designTokens.colors.surface[0];
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

  // 3. Card Body & Wooden Bevel Border
  ctx.fillStyle = designTokens.colors.surface[0];
  ctx.strokeStyle = designTokens.colors.montessori.woodBevel;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 28);
  ctx.fill();
  ctx.stroke();

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
 * Dock khay gỗ cho các token lựa chọn, vẽ trọn trong `rect` (`BR-PSZ-01`,
 * Task #277 S5): mặt dock cộng tấm gỗ đáy không vượt đáy rect. Session đã nhận
 * khay chung truyền đúng `zones.tray`; bỏ trống thì rơi về toạ độ cũ
 * `getWoodenTokenDockRect(space)` cho session chưa chuyển vào khung.
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
  ctx.fillStyle = designTokens.colors.surface[100];
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

  // 3. Dock Surface & Bevel
  ctx.fillStyle = designTokens.colors.surface[50];
  ctx.strokeStyle = designTokens.colors.montessori.woodBevel;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.roundRect(dockX, dockY, dockW, dockH, radius);
  ctx.fill();
  ctx.stroke();

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
 * Vẽ trong một vùng của bàn chơi, cắt mọi nét tràn ra ngoài (`BR-PSZ-01`,
 * Task #277 S5) — quầng sáng hay bóng đổ của primitive không được lấn sang
 * vùng lời dẫn, khay hay nút hành động.
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
  /** Có thì nhãn nằm trọn trong vùng này (đỉnh vùng, giữa ngang), không theo tỉ lệ canvas. */
  rect?: ZoneRect
): void {
  if (!text) {
    return;
  }
  const { space, scale } = spaceOf(rs);
  const fontPx = canvasFontPx(space, "subPrompt", scale);
  ctx.save();
  ctx.font = `${fontPx}px ${designTokens.fonts.sans}`;
  const metrics = ctx.measureText(text);
  const pillW = Math.min(
    rect?.w ?? Number.POSITIVE_INFINITY,
    Math.max(160, metrics.width + 36)
  );
  const pillH = Math.max(32, fontPx + 14);
  const centerX = rect ? rect.x + rect.w / 2 : rs.LOGIC_WIDTH / 2;
  const pillX = centerX - pillW / 2;
  const pillY = rect ? rect.y : rs.LOGIC_HEIGHT * PROMPT_TOP_RATIO + 56;

  // Sub-prompt pill background
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
  // Pill đã kẹp theo bề ngang vùng: chữ dài co lại thay vì tràn ra ngoài pill.
  ctx.fillText(text, centerX, pillY + pillH / 2, pillW - 24);
  ctx.restore();
}

/** Chấm tiến độ trong thẻ phụ: `done` chấm đặc trên `total`, không chữ (`BR-ENG-10`). */
export interface ProgressDotsSpec {
  readonly done: number;
  /** Có `total` thì hiện đủ chấm (đặc + rỗng); không có thì chỉ hiện chấm đặc đã đạt. */
  readonly total?: number;
  /** Ký hiệu số ngắn đặt đầu hàng, vd `+2` — chữ số là ký hiệu toán nên giữ. */
  readonly badge?: string;
  /** Chữ số đích đặt cuối hàng — số là ký hiệu toán nên giữ. */
  readonly trailing?: string;
}

const PROGRESS_DOT_MAX = 12;
const PROGRESS_DOT_RADIUS = 8;
const PROGRESS_DOT_GAP = 10;

/** Thay dòng phụ "Đã đếm: x / y" bằng một hàng chấm lấp đầy dần. */
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
  // Vùng hẹp thì co khoảng cách và cỡ chấm để hàng chấm không tràn khỏi viên thuốc.
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
    ctx.font = `${fontPx}px ${designTokens.fonts.sans}`;
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
    ctx.font = `${fontPx}px ${designTokens.fonts.sans}`;
    ctx.fillStyle = designTokens.colors.montessori.amberDark;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(spec.trailing, pillX + pillW - 14, cy);
  }
  ctx.restore();
}

/** Vẽ nội dung asset vào tâm slot. Trả `false` khi không vẽ được gì. */
export function drawAssetInSlot(
  ctx: CanvasRenderingContext2D,
  asset: RenderAsset | null | undefined,
  slot: Slot,
  glyphScale = 1
): boolean {
  if (!asset) {
    return false;
  }
  if (asset.kind === "text") {
    drawTextInSlot(ctx, asset.text, slot);
    return true;
  }
  if (asset.kind === "image") {
    // Ảnh bitmap chưa có đường nạp trong engine — ô thay thế trung tính
    // (`BR-ENG-09`: asset hỏng ❌ NEVER làm trống màn).
    drawPlaceholderBox(ctx, slot);
    return true;
  }
  const glyph = resolveEmojiGlyph(asset.ref);
  if (!glyph) {
    drawPlaceholderBox(ctx, slot);
    return true;
  }
  drawGlyphInSlot(ctx, glyph, slot, glyphScale);
  return true;
}

/** Mã tham chiếu emoji, ví dụ `🍎`. */
const EMOJI_CODE_REGEX = /^EMJ-[a-z0-9-]+$/i;

const graphemePartsCache = new Map<string, readonly string[]>();

function getGraphemeParts(drawable: string): readonly string[] {
  const cached = graphemePartsCache.get(drawable);
  if (cached !== undefined) {
    return cached;
  }
  const parts =
    drawable.length <= 2
      ? [drawable]
      : graphemes(drawable).filter((p) => p.trim().length > 0);
  if (graphemePartsCache.size > 4096) {
    graphemePartsCache.clear();
  }
  graphemePartsCache.set(drawable, parts);
  return parts;
}

function resolveMultiGlyphCols(count: number): number {
  if (count <= 2) {
    return count;
  }
  if (count <= 4) {
    return 2;
  }
  if (count <= 6) {
    return 3;
  }
  return 4;
}

function drawMultiGlyphClusterInSlot(
  ctx: CanvasRenderingContext2D,
  parts: readonly string[],
  slot: Slot
): void {
  const count = parts.length;
  const cols = resolveMultiGlyphCols(count);
  const rows = Math.ceil(count / cols);
  const cellW = (slot.w * 0.72) / cols;
  const cellH = (slot.h * 0.72) / rows;
  const itemSize = Math.max(14, Math.floor(Math.min(cellW, cellH) * 0.86));
  ctx.font = `${itemSize}px "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", ${designTokens.fonts.sans}`;
  const totalH = (rows - 1) * cellH;
  const startY = slot.y - totalH / 2;
  for (let r = 0; r < rows; r++) {
    const rowStart = r * cols;
    const rowCount = Math.min(cols, count - rowStart);
    const totalW = (rowCount - 1) * cellW;
    const startX = slot.x - totalW / 2;
    for (let c = 0; c < rowCount; c++) {
      const g = parts[rowStart + c];
      if (g) {
        ctx.fillText(g, startX + c * cellW, startY + r * cellH);
      }
    }
  }
}

/**
 * Vẽ một glyph vào ô.
 *
 * Nhận cả **mã** `EMJ-*` lẫn ký tự thật, vì nơi gọi không phải lúc nào cũng
 * phân giải trước: `GT-004` truyền thẳng `group.label_emoji`, và ngày
 * 2026-09-01 chụp thật thấy chuỗi `⚽` / `👦` hiện **to bằng nửa
 * màn** cho trẻ 3-6 đọc. Mã không phân giải được thì vẽ ô thay thế, đúng ý đã
 * ghi ở `resolveEmojiGlyph()`: cấm — NEVER in mã ra màn hình cho trẻ.
 */
export function drawGlyphInSlot(
  ctx: CanvasRenderingContext2D,
  glyph: string,
  slot: Slot,
  glyphScale = 1
): void {
  let drawable = glyph;
  if (EMOJI_CODE_REGEX.test(drawable)) {
    const resolved = resolveEmojiGlyph(drawable);
    // Sau Task #202, `resolveEmojiGlyph` coi ref chính là glyph và trả nguyên
    // chuỗi vào. Nên mã `EMJ-*` còn sót lại trong corpus sẽ quay về y hệt —
    // cấm — NEVER vẽ nó, và cấm gọi đệ quy vì nó không bao giờ hội tụ.
    if (!resolved || EMOJI_CODE_REGEX.test(resolved)) {
      drawPlaceholderBox(ctx, slot);
      return;
    }
    drawable = resolved;
  }
  const parts = getGraphemeParts(drawable);
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (parts.length > 1 && parts.length <= 12) {
    drawMultiGlyphClusterInSlot(ctx, parts, slot);
    ctx.restore();
    return;
  }
  const size = Math.max(
    14,
    Math.floor(Math.min(slot.w, slot.h) * GLYPH_FILL_RATIO * glyphScale)
  );
  ctx.font = `${size}px "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", ${designTokens.fonts.sans}`;
  ctx.fillText(drawable, slot.x, slot.y);
  ctx.restore();
}

/** Chữ vẽ thay asset — số, dấu, giá trị phương án. */
export function drawTextInSlot(
  ctx: CanvasRenderingContext2D,
  text: string,
  slot: Slot,
  color: string = designTokens.colors.surface[800]
): void {
  const size = Math.floor(Math.min(slot.w, slot.h) * 0.42);
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `bold ${size}px ${designTokens.fonts.heading}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  // "04:30" ở cỡ 0,42 cạnh ô rộng hơn ô tròn — co lại trong 85% bề ngang.
  ctx.fillText(text, slot.x, slot.y, slot.w * 0.85);
  ctx.restore();
}

/**
 * Nhãn chữ dưới một slot.
 *
 * Sàn cỡ chữ là **16 px CSS** (`BR-A11-08`), không phải 16 px logic: trên máy
 * dọc 390 px tỉ lệ là ~0,72 nên sàn logic phải là 23. Truyền `rs` để lấy tỉ lệ
 * thật của khung nhìn; thiếu nó thì `minLegiblePx` lấy sàn máy dọc thận trọng.
 */
export function drawSlotLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  slot: Slot,
  rs?: RenderSystem
): void {
  const space: LogicSpace = rs
    ? { w: rs.LOGIC_WIDTH, h: rs.LOGIC_HEIGHT }
    : DEFAULT_LOGIC_SPACE;
  const size = Math.max(
    minLegiblePx(space, rs?.viewport?.scale),
    Math.floor(Math.min(slot.w, slot.h) * LABEL_FONT_RATIO)
  );
  ctx.save();
  ctx.fillStyle = designTokens.colors.surface[600];
  ctx.font = `${size}px ${designTokens.fonts.sans}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  // Nhãn dài hơn vật thì co ngang vừa vùng chạm — không chồng sang nhãn vật kề bên.
  ctx.fillText(
    text,
    slot.x,
    slot.y + slot.h / 2 + 4,
    Math.max(slot.hitW, slot.w)
  );
  ctx.restore();
}

/**
 * Hình mờ (bóng) của vật trong ô đích: thay cho nhãn chữ để trẻ chưa biết đọc
 * vẫn thấy ô này nhận vật nào (`BR-ENG-10`). Vẽ mờ để không lẫn với vật thật.
 */
export function drawGhostAssetInSlot(
  ctx: CanvasRenderingContext2D,
  asset: RenderItem["asset"],
  slot: Slot,
  alpha = 0.35
): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  drawAssetInSlot(ctx, asset, slot);
  ctx.restore();
}

function drawSlotAssetOrPlaceholder(
  ctx: CanvasRenderingContext2D,
  slot: Slot,
  item: RenderItem
): void {
  const emojiRef = item.asset?.kind === "emoji" ? item.asset.ref : undefined;
  const cue = detectSlotVisualComparisonCue(item.label, item.id, emojiRef);
  if (cue) {
    drawSlotVisualComparisonCue(ctx, slot, cue);
  }
  if (!drawAssetInSlot(ctx, item.asset, slot, cue?.glyphScale ?? 1)) {
    drawPlaceholderBox(ctx, slot);
  }
}

/**
 * Một vật thể hoàn chỉnh trong một slot: thân clay, nội dung, nhãn, dấu đúng.
 *
 * Đây là đường vẽ mà **mọi** engine dùng cho danh sách item của nó. Không engine
 * nào tự đặt toạ độ: `slot` tới từ `resolveLayout()`, nên vùng chạm theo band
 * tuổi được giữ nguyên (`BR-ERC-02`).
 */
export function drawSlotItem(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  slot: Slot,
  item: RenderItem,
  shape: "circle" | "square" = "circle"
): void {
  const state = item.state ?? "idle";
  const { fill, border } = getColorsForState(state);
  const radius = Math.min(slot.w, slot.h) / 2;

  rs.drawClayBody(ctx, slot.x, slot.y, radius, fill, border, shape);

  const drawnAsRepresentation = item.representation
    ? drawQuantityRepresentation(ctx, rs, slot, item.representation)
    : false;

  if (!drawnAsRepresentation) {
    if (item.text === undefined) {
      drawSlotAssetOrPlaceholder(ctx, slot, item);
    } else {
      drawTextInSlot(ctx, item.text, slot);
    }
  }

  if (item.label) {
    drawSlotLabel(ctx, item.label, slot, rs);
  }
  if (state === "correct") {
    drawCheckMark(ctx, slot);
  }
}

/**
 * Một vật thể được vẽ **lật gương** qua trục: thân clay đứng yên, nội dung
 * (glyph hoặc ô giữ chỗ) lật quanh tâm slot — trục `vertical` lật trái-phải,
 * `horizontal` lật trên-dưới. Dùng cho nửa phản chiếu của bài đối xứng, để hình
 * bất đối xứng (giày, khủng long) hiện đúng ảnh trong gương chứ không là bản sao.
 */
export function drawMirroredSlotItem(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  slot: Slot,
  item: RenderItem,
  axis: "vertical" | "horizontal",
  shape: "circle" | "square" = "square"
): void {
  const state = item.state ?? "idle";
  const { fill, border } = getColorsForState(state);
  const radius = Math.min(slot.w, slot.h) / 2;
  rs.drawClayBody(ctx, slot.x, slot.y, radius, fill, border, shape);

  ctx.save();
  ctx.translate(slot.x, slot.y);
  if (axis === "vertical") {
    ctx.scale(-1, 1);
  } else {
    ctx.scale(1, -1);
  }
  ctx.translate(-slot.x, -slot.y);
  if (!drawAssetInSlot(ctx, item.asset, slot)) {
    drawPlaceholderBox(ctx, slot);
  }
  ctx.restore();

  if (state === "correct") {
    drawCheckMark(ctx, slot);
  }
}

/** Ghép danh sách item với danh sách slot theo chỉ số, bỏ qua phần thừa. */
export function drawSlotItems(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  slots: readonly Slot[],
  items: readonly RenderItem[],
  shape: "circle" | "square" = "circle"
): void {
  const count = Math.min(slots.length, items.length);
  for (let i = 0; i < count; i++) {
    const slot = slots[i];
    const item = items[i];
    if (slot && item) {
      drawSlotItem(ctx, rs, slot, item, shape);
    }
  }
}

// Tách khỏi file này vì kích thước (review game-engine, Phase 6). Re-export ở
// đây — không ở barrel — để `vi.mock("#src/render/shared-render")` của test
// vẫn thay được `drawSceneBackground`, `drawProgressBadge` như trước khi tách.
// biome-ignore lint/performance/noBarrelFile: giữ đường mock của test sau khi tách file
export * from "./craft-shapes.js";
export * from "./flashcard.js";
export * from "./particles.js";
export * from "./scene-background.js";
export * from "./slot-decor.js";
