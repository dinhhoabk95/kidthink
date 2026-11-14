/** Primitive vẽ chuyên biệt cho GT-036 (Bàn xâu chuỗi hạt gỗ Họa Mi 3D). */
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";
import { alpha } from "./color-utils.js";
import { drawAssetInSlot } from "./shared-render.js";
import { applyCanvasFontAtSize, canvasFontPx } from "./type-scale.js";
import type { RenderAsset } from "./types.js";

export interface GT036RackTrayParams {
  readonly rows: readonly {
    readonly box: ZoneRect;
    readonly pegs: readonly {
      readonly x: number;
      readonly y: number;
      readonly r: number;
    }[];
  }[];
  readonly trayBox: ZoneRect | null;
  readonly hintL2Active: boolean;
  readonly softShadowsEnabled: boolean;
  readonly timeMs: number;
}
export interface GT036BeadParams {
  readonly slot: Slot;
  readonly asset: RenderAsset | null;
  readonly emptyLabel?: string;
  readonly paletteIndex: number;
  readonly cyOffset?: number;
  readonly scaleBoost?: number;
  readonly ringTone?: "lit" | "hint" | "hover" | "selected";
  readonly isHintDashed?: boolean;
  readonly softShadowsEnabled: boolean;
}
export interface GT036ClearButtonParams {
  readonly slot: Slot;
  readonly asset: RenderAsset;
  readonly isHovered: boolean;
  readonly softShadowsEnabled: boolean;
}
export interface GT036MotifGroupsParams {
  readonly segments: readonly {
    readonly box: ZoneRect;
    readonly badgeCenter: { readonly x: number; readonly y: number } | null;
    readonly repetitionNumber: number;
  }[];
  readonly showRepeatBadge: boolean;
}

const MONTESSORI = designTokens.colors.montessori;
const SURFACE = designTokens.colors.surface;
const SCENE = designTokens.colors.scene;
const BRAND = designTokens.colors.brand;
const RIMS = [
  MONTESSORI.indigo,
  SCENE.sky[400],
  SCENE.violet[500],
  designTokens.colors.cta[400],
  SCENE.pink,
  SCENE.teal,
] as const;
const rimOf = (idx: number): string =>
  RIMS[Math.abs(idx) % RIMS.length] ?? MONTESSORI.indigo;

function setShadow(
  ctx: CanvasRenderingContext2D,
  on: boolean,
  blur = 0,
  y = 0
): void {
  ctx.shadowColor = alpha(SURFACE[900], on ? 0.14 : 0);
  ctx.shadowBlur = on ? blur : 0;
  ctx.shadowOffsetY = on ? y : 0;
}

function disc(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  fill: string,
  stroke?: string,
  lw = 2
): void {
  ctx.beginPath();
  ctx.arc(x, y, Math.max(1, r), 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lw;
    ctx.stroke();
  }
}

function roundBox(
  ctx: CanvasRenderingContext2D,
  b: ZoneRect,
  rad: number,
  fill: string,
  stroke: string,
  lw = 2
): void {
  ctx.beginPath();
  ctx.roundRect(b.x, b.y, b.w, b.h, rad);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lw;
  ctx.stroke();
}

function drawMark(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  s: number,
  idx: number,
  color: string
): void {
  const k = Math.abs(idx) % 6;
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.5, s * 0.22);
  ctx.beginPath();
  if (k === 0 || k === 4) {
    ctx.arc(cx, cy, s * 0.52, 0, Math.PI * 2);
    k === 0 ? ctx.fill() : ctx.stroke();
    return;
  }
  if (k === 3 || k === 5) {
    if (k === 3) {
      ctx.moveTo(cx - s * 0.65, cy);
      ctx.lineTo(cx + s * 0.65, cy);
      ctx.moveTo(cx, cy - s * 0.65);
      ctx.lineTo(cx, cy + s * 0.65);
    } else {
      ctx.rect(cx - s * 0.52, cy - s * 0.35, s * 1.04, s * 0.7);
    }
    ctx.stroke();
    return;
  }
  const dy = k === 1 ? 0 : s * 0.58;
  ctx.moveTo(cx, cy - s * 0.7);
  ctx.lineTo(cx + s * 0.68, cy + dy);
  if (k === 1) {
    ctx.lineTo(cx, cy + s * 0.7);
  }
  ctx.lineTo(cx - s * 0.68, cy + dy);
  ctx.closePath();
  ctx.fill();
}

export function drawGT036RackAndTray(
  ctx: CanvasRenderingContext2D,
  _rs: RenderSystem,
  p: GT036RackTrayParams
): void {
  const { woodBevel, woodBorder, woodTrayHigh, woodTray, amber } = MONTESSORI;
  const bevel = alpha(woodBevel, 0.55);
  ctx.save();
  for (const row of p.rows) {
    setShadow(ctx, p.softShadowsEnabled, 5, 2);
    roundBox(ctx, row.box, Math.max(2, row.box.h / 2), bevel, woodBorder, 1.5);
    setShadow(ctx, false);
    for (const peg of row.pegs) {
      disc(ctx, peg.x, peg.y, peg.r, woodTrayHigh, woodBorder, 1.5);
    }
  }
  if (p.trayBox) {
    const pulse = 0.55 + 0.45 * Math.sin(p.timeMs * 0.008);
    const border = p.hintL2Active
      ? alpha(amber, 0.65 + 0.35 * pulse)
      : woodBorder;
    const trayFill = alpha(woodTray, 0.92);
    roundBox(ctx, p.trayBox, 16, trayFill, border, p.hintL2Active ? 3 : 2);
  }
  ctx.restore();
}

const AMBER_TONE = {
  color: MONTESSORI.amber,
  fill: alpha(MONTESSORI.amberGlow, 0.72),
  lw: 3,
} as const;
const TONE_MAP = {
  lit: AMBER_TONE,
  hint: AMBER_TONE,
  selected: {
    color: MONTESSORI.indigo,
    fill: alpha(MONTESSORI.amberLight, 0.42),
    lw: 3,
  },
  hover: {
    color: MONTESSORI.indigo,
    fill: alpha(MONTESSORI.amberLight, 0.32),
    lw: 2.5,
  },
} as const;

export function drawGT036Bead(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  p: GT036BeadParams
): void {
  const { slot } = p;
  const { paper, woodBorder, woodTray } = MONTESSORI;
  const r = Math.max(12, Math.min(slot.w, slot.h) * 0.44) * (p.scaleBoost ?? 1);
  const cy = slot.y + (p.cyOffset ?? 0);
  const tone = p.ringTone ? TONE_MAP[p.ringTone] : null;
  ctx.save();
  if (!p.asset) {
    ctx.setLineDash(p.isHintDashed ? [4, 4] : []);
    const fill = tone?.fill ?? alpha(woodTray, 0.88);
    disc(ctx, slot.x, cy, r, fill, tone?.color ?? woodBorder, tone?.lw ?? 2);
    ctx.setLineDash([]);
    const fontPx = canvasFontPx(
      rs.logicSpace,
      "badge",
      rs.viewport?.scale ?? 1
    );
    applyCanvasFontAtSize(ctx, fontPx, "display", 700);
    ctx.fillStyle = woodBorder;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(p.emptyLabel ?? "", slot.x, cy + 1);
    ctx.restore();
    return;
  }
  if (tone) {
    disc(ctx, slot.x, cy, r + 4, tone.fill, tone.color, tone.lw);
  }
  const rim = tone?.color ?? rimOf(p.paletteIndex);
  setShadow(ctx, p.softShadowsEnabled, 7, 3);
  disc(ctx, slot.x, cy + 3, r, alpha(rim, 0.45));
  setShadow(ctx, false);
  disc(ctx, slot.x, cy, r, paper, rim, tone?.lw ?? 2.2);
  disc(ctx, slot.x - r * 0.32, cy - r * 0.34, r * 0.2, alpha(SURFACE[0], 0.72));
  const hr = Math.max(2, r * 0.09);
  disc(ctx, slot.x - r * 0.78, cy, hr, woodBorder);
  disc(ctx, slot.x + r * 0.78, cy, hr, woodBorder);
  const box = { ...slot, y: cy, w: r * 1.38, h: r * 1.38 };
  if (!drawAssetInSlot(ctx, p.asset, box, 0.85)) {
    drawMark(ctx, slot.x, cy, r * 0.48, p.paletteIndex, rim);
  }
  const mr = Math.max(3, r * 0.13);
  drawMark(ctx, slot.x, cy + r * 0.68, mr, p.paletteIndex, rim);
  ctx.restore();
}

export function drawGT036ClearButton(
  ctx: CanvasRenderingContext2D,
  _rs: RenderSystem,
  p: GT036ClearButtonParams
): void {
  const s = p.slot;
  const { paper, amber, woodBorder } = MONTESSORI;
  const r = Math.max(12, Math.min(s.w, s.h) * 0.44);
  const cy = s.y + (p.isHovered ? 1.5 : 0);
  ctx.save();
  setShadow(ctx, p.softShadowsEnabled, 5, 2);
  disc(ctx, s.x, cy, r, paper, p.isHovered ? amber : woodBorder, 2);
  ctx.restore();
  drawAssetInSlot(ctx, p.asset, { ...s, y: cy, w: r * 1.4, h: r * 1.4 }, 0.9);
}

export function drawGT036MotifGroups(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  p: GT036MotifGroupsParams
): void {
  if (p.segments.length === 0) {
    return;
  }
  ctx.save();
  const fontPx = canvasFontPx(rs.logicSpace, "badge", rs.viewport?.scale ?? 1);
  applyCanvasFontAtSize(ctx, fontPx, "display", 700);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const bg = alpha(BRAND[500], 0.09);
  const br = Math.max(11, fontPx * 0.65);
  for (const seg of p.segments) {
    roundBox(ctx, seg.box, 14, bg, MONTESSORI.emerald, 2.5);
    if (p.showRepeatBadge && seg.badgeCenter) {
      const { x, y } = seg.badgeCenter;
      disc(ctx, x, y, br, BRAND[500], MONTESSORI.paper, 2);
      ctx.fillStyle = SURFACE[0];
      ctx.fillText(String(seg.repetitionNumber), x, y + 1);
    }
  }
  ctx.restore();
}
