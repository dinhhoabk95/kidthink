import { getByCode } from "@mindkid/emoji";
import type { Slot } from "#src/layout/types";
import { designTokens } from "#src/systems/designTokens";
import type { Particle, RenderSystem } from "#src/systems/render-system";

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

export type ItemVisualState =
  | "idle"
  | "touching"
  | "selected"
  | "correct"
  | "wrong"
  | "locked";

/** Asset như contract khai — `emoji` mang mã `EMJ-*`, `image` mang đường dẫn. */
export type RenderAsset =
  | { readonly kind: "emoji"; readonly ref: string }
  | { readonly kind: "image"; readonly path: string };

/** Một vật thể vẽ được, đã tách khỏi hình dạng `content_pack` của từng engine. */
export interface RenderItem {
  readonly id: string;
  readonly asset?: RenderAsset | null;
  /** Nhãn chữ vẽ dưới vật thể — số đếm, tên nhóm, giá trị phương án. */
  readonly label?: string;
  /** Chữ vẽ THAY cho asset khi engine không có asset (ví dụ ô số của GT-010). */
  readonly text?: string;
  readonly state?: ItemVisualState;
}

export interface SceneBox {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

const PROMPT_FONT_PX = 24;
const PROMPT_TOP_RATIO = 0.045;
const LABEL_FONT_RATIO = 0.16;
const LABEL_MIN_FONT_PX = 11;
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
        border: designTokens.colors.surface[300],
      };
  }
}

export type EmojiResolver = (code: string) => string | null;
let customEmojiResolver: EmojiResolver | null = null;

export function setEmojiResolver(resolver: EmojiResolver | null): void {
  customEmojiResolver = resolver;
}

const ASCII_PRINTABLE_REGEX = /^[\x20-\x7E]+$/;

/**
 * Tra cứu glyph emoji theo `asset.ref`.
 *
 * Mặc định trả `null` trên mọi mã `EMJ-*` để `drawSlotItem()` kích hoạt
 * fallback icon và emit `MISSING_EMOJI_GLYPH` cho telemetry,
 * thay vì in chuỗi mã ra màn hình cho trẻ đọc.
 *
 * Corpus hiện còn glyph thô ở `asset.ref` (nợ đo ở `emoji-ref-debt.test.ts`),
 * nên một ref không khớp mã mà cũng không phải ASCII thì được coi là glyph sẵn.
 */
export function resolveEmojiGlyph(ref: string): string | null {
  if (customEmojiResolver) {
    const resolved = customEmojiResolver(ref);
    if (resolved) {
      return resolved;
    }
  }
  const entry = getByCode(ref);
  if (entry?.emoji) {
    return entry.emoji;
  }
  // Glyph thô còn sót trong corpus: không phải mã, không phải ASCII → vẽ luôn.
  if (ref.length > 0 && !ASCII_PRINTABLE_REGEX.test(ref)) {
    return ref;
  }
  return null;
}

export function sceneBox(rs: RenderSystem): SceneBox {
  return { x: 0, y: 0, w: rs.LOGIC_WIDTH, h: rs.LOGIC_HEIGHT };
}

export function drawSceneBackground(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem
): void {
  ctx.save();
  // Warm oatmeal paper base
  ctx.fillStyle = designTokens.colors.surface[50];
  ctx.fillRect(0, 0, rs.LOGIC_WIDTH, rs.LOGIC_HEIGHT);

  // Soft sunlit warm gradient from top
  const grad = ctx.createLinearGradient(0, 0, 0, rs.LOGIC_HEIGHT * 0.45);
  grad.addColorStop(0, "rgba(255, 250, 240, 0.65)");
  grad.addColorStop(1, "rgba(251, 249, 245, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, rs.LOGIC_WIDTH, rs.LOGIC_HEIGHT);

  ctx.restore();
}

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

  ctx.save();
  ctx.font = `${PROMPT_FONT_PX}px ${designTokens.fonts.heading}`;
  const textMetrics = ctx.measureText(prompt);
  const cardW = Math.max(340, Math.min(840, textMetrics.width + 100));
  const cardH = 50;
  const cardX = (width - cardW) / 2;
  const cardY = height * PROMPT_TOP_RATIO;
  const radius = 24;

  // Ambient card shadow
  ctx.save();
  ctx.shadowColor = "rgba(130, 118, 96, 0.12)";
  ctx.shadowBlur = 10;
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

  // Honey Amber Speaker Icon Badge at left
  const badgeRadius = 16;
  const badgeX = cardX + 24;
  const badgeY = cardY + cardH / 2;
  ctx.fillStyle = designTokens.colors.montessori.amber;
  ctx.beginPath();
  ctx.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2);
  ctx.fill();

  // Speaker symbol inside badge
  ctx.font =
    '16px "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("🔊", badgeX, badgeY);

  // Prompt text
  ctx.fillStyle = designTokens.colors.surface[900];
  ctx.font = `bold ${PROMPT_FONT_PX}px ${designTokens.fonts.heading}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(prompt, cardX + cardW / 2 + 12, cardY + cardH / 2);

  ctx.restore();
}

export function drawEmojiContent(
  ctx: CanvasRenderingContext2D,
  emojiRef: string,
  slot: Slot
): boolean {
  return drawAssetInSlot(ctx, { kind: "emoji", ref: emojiRef }, slot);
}

/** Thẻ gỗ trung tâm hiển thị vật thể / câu đố lớn cho trẻ (GT-001, GT-009, GT-026...) */
export function drawCentralTargetCard(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  asset?: RenderAsset | null,
  text?: string
): void {
  const cardW = 180;
  const cardH = 180;
  const cardX = (rs.LOGIC_WIDTH - cardW) / 2;
  const cardY = rs.LOGIC_HEIGHT * 0.22;
  const slot: Slot = {
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

  ctx.save();
  // 1. Ambient drop shadow
  ctx.save();
  ctx.shadowColor = "rgba(130, 118, 96, 0.2)";
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
  ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
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

/** Dock khay gỗ phía dưới cho các token lựa chọn */
export function drawWoodenTokenDock(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem
): void {
  const dockW = rs.LOGIC_WIDTH * 0.88;
  const dockH = 130;
  const dockX = (rs.LOGIC_WIDTH - dockW) / 2;
  const dockY = rs.LOGIC_HEIGHT - dockH - 12;

  ctx.save();
  ctx.save();
  ctx.shadowColor = "rgba(130, 118, 96, 0.12)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = designTokens.colors.surface[100];
  ctx.beginPath();
  ctx.roundRect(dockX, dockY, dockW, dockH, 32);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = designTokens.colors.montessori.woodBevel;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
}

/** Dòng phụ dưới câu lệnh — tiêu chí lọc, tên mô hình đích, luật đang hiệu lực. */
export function drawSubPromptText(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  text: string
): void {
  if (!text) {
    return;
  }
  ctx.save();
  ctx.font = `16px ${designTokens.fonts.sans}`;
  const metrics = ctx.measureText(text);
  const pillW = Math.max(160, metrics.width + 36);
  const pillH = 32;
  const pillX = (rs.LOGIC_WIDTH - pillW) / 2;
  const pillY = rs.LOGIC_HEIGHT * PROMPT_TOP_RATIO + 56;

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
  ctx.fillText(text, rs.LOGIC_WIDTH / 2, pillY + pillH / 2);
  ctx.restore();
}

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

/** Vẽ nội dung asset vào tâm slot. Trả `false` khi không vẽ được gì. */
export function drawAssetInSlot(
  ctx: CanvasRenderingContext2D,
  asset: RenderAsset | null | undefined,
  slot: Slot
): boolean {
  if (!asset) {
    return false;
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
  drawGlyphInSlot(ctx, glyph, slot);
  return true;
}

export function drawGlyphInSlot(
  ctx: CanvasRenderingContext2D,
  glyph: string,
  slot: Slot
): void {
  const size = Math.floor(Math.min(slot.w, slot.h) * GLYPH_FILL_RATIO);
  ctx.save();
  ctx.font = `${size}px "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", ${designTokens.fonts.sans}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(glyph, slot.x, slot.y);
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
  ctx.fillText(text, slot.x, slot.y);
  ctx.restore();
}

export function drawSlotLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  slot: Slot
): void {
  const size = Math.max(
    LABEL_MIN_FONT_PX,
    Math.floor(Math.min(slot.w, slot.h) * LABEL_FONT_RATIO)
  );
  ctx.save();
  ctx.fillStyle = designTokens.colors.surface[600];
  ctx.font = `${size}px ${designTokens.fonts.sans}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(text, slot.x, slot.y + slot.h / 2 + 4);
  ctx.restore();
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

  if (item.text !== undefined) {
    drawTextInSlot(ctx, item.text, slot);
  } else if (!drawAssetInSlot(ctx, item.asset, slot)) {
    drawPlaceholderBox(ctx, slot);
  }

  if (item.label) {
    drawSlotLabel(ctx, item.label, slot);
  }
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

export function drawCheckMark(ctx: CanvasRenderingContext2D, slot: Slot): void {
  const r = Math.min(slot.w, slot.h) / 2;
  const badgeR = Math.max(12, r * 0.32);
  const cx = slot.x + r * 0.55;
  const cy = slot.y - r * 0.55;
  const arm = badgeR * 0.55;

  ctx.save();
  // Emerald circle badge
  ctx.fillStyle = designTokens.colors.montessori.emeraldBright;
  ctx.strokeStyle = designTokens.colors.montessori.emerald;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, badgeR, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Crisp white checkmark
  ctx.strokeStyle = designTokens.colors.surface[0];
  ctx.lineWidth = Math.max(2.5, badgeR * 0.22);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(cx - arm * 0.7, cy);
  ctx.lineTo(cx - arm * 0.1, cy + arm * 0.6);
  ctx.lineTo(cx + arm * 0.7, cy - arm * 0.5);
  ctx.stroke();
  ctx.restore();
}

/** Ô đích rỗng — viền đứt, hốc chìm chờ trẻ thả vật vào. */
export function drawEmptyTargetSlot(
  ctx: CanvasRenderingContext2D,
  slot: Slot
): void {
  ctx.save();
  const r = Math.min(slot.w, slot.h) / 2;

  // Soft wooden recessed socket background
  ctx.fillStyle = designTokens.colors.surface[100];
  ctx.beginPath();
  ctx.roundRect(slot.x - r, slot.y - r, r * 2, r * 2, Math.max(8, r * 0.2));
  ctx.fill();

  // Dashed wood/amber outline
  ctx.strokeStyle = designTokens.colors.surface[400];
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 6]);
  ctx.stroke();
  ctx.restore();
}

export function drawSlotOutline(
  ctx: CanvasRenderingContext2D,
  slot: Slot,
  color: string,
  lineWidth: number
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.strokeRect(
    slot.x - slot.hitW / 2,
    slot.y - slot.hitH / 2,
    slot.hitW,
    slot.hitH
  );
  ctx.restore();
}

export function drawLabelText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  color = designTokens.colors.surface[700]
): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `${fontSize}px ${designTokens.fonts.sans}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
  ctx.restore();
}

export function drawCounterBadge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  current: number,
  total: number
): void {
  ctx.save();
  ctx.fillStyle = designTokens.colors.brand[600];
  ctx.beginPath();
  ctx.arc(x, y, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = designTokens.colors.surface[0];
  ctx.font = `14px ${designTokens.fonts.sans}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`${current}/${total}`, x, y);
  ctx.restore();
}

/** Đồng hồ tiến độ ở góc trên phải — vị trí suy từ khung logic, không hằng số. */
export function drawProgressBadge(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  current: number,
  total: number
): void {
  drawCounterBadge(ctx, rs.LOGIC_WIDTH - 44, 40, current, total);
}

export function drawDividerLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): void {
  ctx.save();
  ctx.strokeStyle = designTokens.colors.surface[200];
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

export function drawMatchLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string = designTokens.colors.semantic.success[500]
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

export function drawGridCell(
  ctx: CanvasRenderingContext2D,
  slot: Slot,
  fill: string,
  border: string
): void {
  ctx.save();
  ctx.fillStyle = fill;
  const rx = slot.x - slot.hitW / 2;
  const ry = slot.y - slot.hitH / 2;
  ctx.fillRect(rx, ry, slot.hitW, slot.hitH);
  ctx.strokeStyle = border;
  ctx.lineWidth = 3;
  ctx.strokeRect(rx, ry, slot.hitW, slot.hitH);
  ctx.restore();
}

export function spawnParticlesAtSlot(slot: Slot, count: number): Particle[] {
  const particles: Particle[] = [];
  const colors = [
    designTokens.colors.semantic.success[400],
    designTokens.colors.cta[400],
    designTokens.colors.brand[400],
  ];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;
    const spread = 1.5 + ((i * 7 + 3) % 5) * 0.4;
    particles.push({
      x: slot.x,
      y: slot.y,
      vx: Math.cos(angle) * spread,
      vy: Math.sin(angle) * spread,
      color:
        colors[i % colors.length] ?? designTokens.colors.semantic.success[400],
      size: 3 + ((i * 3 + 1) % 4),
      life: 1,
      maxLife: 1,
    });
  }
  return particles;
}

const PARTICLE_GRAVITY = 0.05;
const PARTICLE_DECAY = 0.02;

/**
 * Bước một khung hạt — trả mảng MỚI, ❌ NEVER sửa hạt tại chỗ.
 *
 * Bản trước cộng dồn thẳng vào `p.x`/`p.life` rồi mới lọc, nên cùng một mảng bị
 * chia sẻ giữa `renderParticles` của session và bất kỳ ai còn giữ tham chiếu —
 * replay và snapshot test đọc phải trạng thái đã trôi.
 */
export function updateParticles(particles: readonly Particle[]): Particle[] {
  const next: Particle[] = [];
  for (const p of particles) {
    const life = p.life - PARTICLE_DECAY;
    if (life <= 0) {
      continue;
    }
    next.push({
      ...p,
      x: p.x + p.vx,
      y: p.y + p.vy,
      vy: p.vy + PARTICLE_GRAVITY,
      life,
    });
  }
  return next;
}

export interface LiquidCupParams {
  readonly cupId: string;
  readonly shape: "standard" | "narrow_tall" | "wide_short" | "fluted";
  readonly capacityUnits: number;
  readonly fillUnits: number;
  readonly color?: string;
  readonly isSelected?: boolean;
  readonly showHintMarks?: boolean;
}

export function drawLiquidCup(
  ctx: CanvasRenderingContext2D,
  _rs: RenderSystem,
  slot: Slot,
  params: LiquidCupParams
): void {
  const baseW = slot.w * 0.8;
  const baseH = slot.h * 0.85;

  let wFactor = 1.0;
  let hFactor = 1.0;

  if (params.shape === "narrow_tall") {
    wFactor = 0.7;
    hFactor = 1.25;
  } else if (params.shape === "wide_short") {
    wFactor = 1.35;
    hFactor = 0.75;
  } else if (params.shape === "fluted") {
    wFactor = 1.1;
    hFactor = 1.0;
  }

  const cupW = baseW * wFactor;
  const cupH = baseH * hFactor;
  const x = slot.x - cupW / 2;
  const y = slot.y - cupH / 2 + (baseH - cupH) / 2;

  ctx.save();

  // Glass Background
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.strokeStyle = designTokens.colors.surface[400];
  ctx.lineWidth = 4;

  ctx.beginPath();
  ctx.roundRect(x, y, cupW, cupH, [6, 6, 16, 16]);
  ctx.fill();
  ctx.stroke();

  // Liquid fill calculation (BR-E032-03)
  const fillRatio =
    params.capacityUnits > 0
      ? Math.min(1, Math.max(0, params.fillUnits / params.capacityUnits))
      : 0;

  const liquidH = cupH * fillRatio;
  const liquidY = y + cupH - liquidH;

  if (liquidH > 0) {
    ctx.save();
    // Clip inside cup
    ctx.beginPath();
    ctx.roundRect(x + 2, y + 2, cupW - 4, cupH - 4, [4, 4, 14, 14]);
    ctx.clip();

    // Draw liquid
    ctx.fillStyle = designTokens.colors.brand[500];
    if (params.color === "mint") {
      ctx.fillStyle = designTokens.colors.semantic.success[500];
    } else if (params.color === "berry") {
      ctx.fillStyle = designTokens.colors.semantic.danger[400];
    } else if (params.color === "amber") {
      ctx.fillStyle = designTokens.colors.retry[500];
    }

    ctx.fillRect(x, liquidY, cupW, liquidH);

    // Meniscus / surface highlight
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.fillRect(x, liquidY, cupW, Math.min(6, liquidH));
    ctx.restore();
  }

  // Hint Marks (tick marks)
  if (params.showHintMarks) {
    ctx.strokeStyle = "rgba(100, 116, 139, 0.6)";
    ctx.lineWidth = 2;
    for (let step = 1; step < params.capacityUnits; step++) {
      const stepY = y + cupH - (cupH * step) / params.capacityUnits;
      ctx.beginPath();
      ctx.moveTo(x + 4, stepY);
      ctx.lineTo(x + 14, stepY);
      ctx.stroke();
    }
  }

  // Selected highlight
  if (params.isSelected) {
    ctx.strokeStyle = designTokens.colors.semantic.success[500];
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.roundRect(x - 4, y - 4, cupW + 8, cupH + 8, [10, 10, 20, 20]);
    ctx.stroke();
  }

  ctx.restore();
}

export interface WeaveCellParams {
  readonly cellIndex: number;
  readonly colorId: string | null;
  readonly isOriginal: boolean;
  readonly isSelected?: boolean;
  readonly isBrokenRow?: boolean;
  readonly isBrokenCol?: boolean;
}

export function drawWeaveCell(
  ctx: CanvasRenderingContext2D,
  _rs: RenderSystem,
  slot: Slot,
  params: WeaveCellParams
): void {
  const w = slot.w;
  const h = slot.h;
  const x = slot.x - w / 2;
  const y = slot.y - h / 2;

  ctx.save();

  // Cell base background
  ctx.fillStyle = params.colorId
    ? getColorForYarn(params.colorId)
    : designTokens.colors.surface[100];
  ctx.strokeStyle = designTokens.colors.surface[300];
  ctx.lineWidth = 2;

  if (params.isBrokenRow || params.isBrokenCol) {
    ctx.strokeStyle = designTokens.colors.retry[500];
    ctx.lineWidth = 4;
  }

  if (params.isSelected) {
    ctx.strokeStyle = designTokens.colors.semantic.success[500];
    ctx.lineWidth = 4;
  }

  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 8);
  ctx.fill();
  ctx.stroke();

  // Weave texture lines if color is present
  if (params.colorId) {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    // Horizontal yarn line
    ctx.moveTo(x + 4, y + h / 2);
    ctx.lineTo(x + w - 4, y + h / 2);
    // Vertical yarn line
    ctx.moveTo(x + w / 2, y + 4);
    ctx.lineTo(x + w / 2, y + h - 4);
    ctx.stroke();
  } else {
    // Empty dashed border indicator
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = designTokens.colors.surface[400];
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x + 4, y + 4, w - 8, h - 8, 4);
    ctx.stroke();
  }

  ctx.restore();
}

function getColorForYarn(colorId: string): string {
  switch (colorId.toLowerCase()) {
    case "red":
    case "berry":
      return designTokens.colors.semantic.danger[400];
    case "blue":
    case "sky":
      return designTokens.colors.brand[500];
    case "yellow":
    case "amber":
      return designTokens.colors.montessori.amber;
    case "green":
    case "mint":
      return designTokens.colors.semantic.success[500];
    case "purple":
    case "indigo":
      return designTokens.colors.montessori.indigo;
    case "orange":
      return designTokens.colors.cta[500];
    default:
      return designTokens.colors.brand[400];
  }
}
