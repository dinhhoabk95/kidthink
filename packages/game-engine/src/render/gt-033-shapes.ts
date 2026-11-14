import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import { alpha } from "#src/render/color-utils";
import { drawYarnMark, yarnFillColor } from "#src/render/craft-shapes";
import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";

export type GT033CellVisualState =
  | "given"
  | "idle"
  | "hovered"
  | "selected"
  | "wrong"
  | "correct";
interface GridBaseParams {
  readonly clip?: ZoneRect;
  readonly cols: number;
  readonly gridBox: ZoneRect | null;
  readonly rows: number;
  readonly slots: readonly Slot[];
}
export interface GT033LoomBackdropParams extends GridBaseParams {
  readonly colColors: readonly (string | null)[];
  readonly rowColors: readonly (string | null)[];
  readonly shadowsOff?: boolean;
}
export interface GT033AxisGuidesParams extends GridBaseParams {
  readonly brokenColIndex: number | null;
  readonly brokenRowIndex: number | null;
  readonly hintColIndex: number | null;
  readonly hintLevel: number;
  readonly hintRowIndex: number | null;
  readonly timeMs: number;
}
interface SlotBaseParams {
  readonly clip?: ZoneRect;
  readonly shadowsOff?: boolean;
  readonly slot: Slot;
  readonly timeMs: number;
}
export interface GT033WeaveCellParams extends SlotBaseParams {
  readonly colorId: string | null;
  readonly ghostColorId?: string | null;
  readonly isSelectedCell: boolean;
  readonly state: GT033CellVisualState;
  readonly winWavePhase?: number;
}
export interface GT033SpoolHaloParams extends SlotBaseParams {
  readonly isHinted: boolean;
  readonly isHovered: boolean;
  readonly isSelected: boolean;
}
const {
  montessori: MO,
  surface: SURF,
  retry: RETRY,
  semantic,
} = designTokens.colors;
const SEM = semantic.success;
const TAU = Math.PI * 2;

function saveClip(ctx: CanvasRenderingContext2D, clip?: ZoneRect): void {
  ctx.save();
  if (clip) {
    ctx.beginPath();
    ctx.rect(clip.x, clip.y, clip.w, clip.h);
    ctx.clip();
  }
}
function rrect(
  ctx: CanvasRenderingContext2D,
  b: ZoneRect,
  f: string,
  s: string,
  lw = 2
): void {
  ctx.beginPath();
  ctx.roundRect(b.x, b.y, b.w, b.h, Math.min(12, b.w / 2, b.h / 2));
  ctx.fillStyle = f;
  ctx.fill();
  [ctx.strokeStyle, ctx.lineWidth] = [s, lw];
  ctx.stroke();
}
function seg(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): void {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}
function dot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  f: string,
  s?: string,
  lw = 1.4
): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fillStyle = f;
  ctx.fill();
  if (s) {
    [ctx.strokeStyle, ctx.lineWidth] = [s, lw];
    ctx.stroke();
  }
}
function loomBounds(
  gb: ZoneRect,
  clip?: ZoneRect
): [number, number, number, number] {
  const barX = Math.max((clip?.x ?? -1e9) + 2, gb.x - 10);
  return [
    Math.max((clip?.y ?? -1e9) + 2, gb.y - 11),
    Math.min(clip ? clip.y + clip.h - 9 : 1e9, gb.y + gb.h + 4),
    barX,
    Math.min(clip ? clip.x + clip.w - 2 : 1e9, gb.x + gb.w + 10) - barX,
  ];
}
export function drawGT033LoomBackdrop(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  p: GT033LoomBackdropParams
): void {
  const { gridBox: gb, clip } = p;
  if (!gb) {
    return;
  }
  saveClip(ctx, clip);
  if (!p.shadowsOff && rs.softShadowsEnabled) {
    ctx.shadowColor = alpha(MO.woodBorder, 0.2);
    [ctx.shadowBlur, ctx.shadowOffsetY] = [6, 2];
  }
  const [topY, botY, barX, barW] = loomBounds(gb, clip);
  rrect(ctx, { x: barX, y: topY, w: barW, h: 7 }, MO.woodBevel, MO.woodBorder);
  rrect(ctx, { x: barX, y: botY, w: barW, h: 7 }, MO.woodBevel, MO.woodBorder);
  [ctx.shadowBlur, ctx.shadowOffsetY] = [0, 0];
  [ctx.strokeStyle, ctx.lineWidth] = [alpha(MO.woodBorder, 0.35), 1.5];
  const [minX, minY] = clip ? [clip.x + 6, clip.y + 6] : [gb.x - 16, gb.y - 16];
  const [dotX, dotY] = [Math.max(minX, gb.x - 10), Math.max(minY, gb.y - 10)];
  const put = (
    s: Slot | undefined,
    x: number,
    y: number,
    c: string | null | undefined
  ) => {
    if (s && c) {
      dot(ctx, x, y, 4.5, yarnFillColor(c), SURF[0]);
    }
  };
  for (let c = 0; c < p.cols; c++) {
    const s = p.slots[c];
    if (s) {
      seg(ctx, s.x, topY + 7, s.x, botY);
    }
    if (gb.y - minY >= 10) {
      put(s, s?.x ?? 0, dotY, p.colColors[c]);
    }
  }
  for (let r = 0; r < p.rows && gb.x - minX >= 10; r++) {
    const s = p.slots[r * p.cols];
    put(s, dotX, s?.y ?? 0, p.rowColors[r]);
  }
  ctx.restore();
}

export function drawGT033AxisGuides(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  p: GT033AxisGuidesParams
): void {
  const { gridBox: gb, clip } = p;
  if (!gb) {
    return;
  }
  const pv = rs.reducedMotion ? 0.85 : 0.55 + 0.35 * Math.sin(p.timeMs * 0.006);
  saveClip(ctx, clip);
  ctx.setLineDash([5, 4]);
  const drawBand = (isR: boolean, i: number | null, f: string, st: string) => {
    const s = i === null ? undefined : p.slots[isR ? i * p.cols : i];
    if (s) {
      const b = isR
        ? { x: gb.x - 4, y: s.y - s.h / 2 - 3, w: gb.w + 8, h: s.h + 6 }
        : { x: s.x - s.w / 2 - 3, y: gb.y - 4, w: s.w + 6, h: gb.h + 8 };
      rrect(ctx, b, f, st, 2.5);
    }
  };
  const hf = alpha(MO.amberLight, 0.25 * pv);
  const hs = alpha(MO.amberDark, 0.75 * pv);
  const [bf, bs] = [alpha(RETRY[100], 0.45), alpha(RETRY[600], 0.9 * pv)];
  drawBand(true, p.hintLevel >= 1 ? p.hintRowIndex : null, hf, hs);
  drawBand(false, p.hintLevel >= 2 ? p.hintColIndex : null, hf, hs);
  drawBand(true, p.brokenRowIndex, bf, bs);
  drawBand(false, p.brokenColIndex, bf, bs);
  ctx.restore();
}
function drawCellBody(
  ctx: CanvasRenderingContext2D,
  b: ZoneRect,
  s: Slot,
  p: GT033WeaveCellParams
): void {
  const { state: st, colorId } = p;
  if (!colorId) {
    const [bg, bd, lw] =
      st === "hovered"
        ? [MO.amberLight, MO.amberDark, 2.8]
        : [alpha(MO.paper, 0.92), MO.woodBevel, 1.8];
    rrect(ctx, b, bg, bd, lw);
    [ctx.shadowBlur, ctx.shadowOffsetY] = [0, 0];
    [ctx.strokeStyle, ctx.lineWidth] = [alpha(MO.woodBorder, 0.28), 1.4];
    seg(ctx, s.x, b.y + 6, s.x, b.y + b.h - 6);
    seg(ctx, b.x + 6, s.y, b.x + b.w - 6, s.y);
    return;
  }
  const strokeMap: Partial<Record<GT033CellVisualState, string>> = {
    wrong: RETRY[600],
    correct: SEM[600],
    given: MO.woodBorder,
  };
  const bd = strokeMap[st] ?? (p.isSelectedCell ? MO.amberDark : SURF[0]);
  const lw = st === "wrong" || p.isSelectedCell ? 3 : 2;
  rrect(ctx, b, yarnFillColor(colorId), bd, lw);
  [ctx.shadowBlur, ctx.shadowOffsetY] = [0, 0];
  [ctx.strokeStyle, ctx.lineWidth] = [alpha(SURF[0], 0.28), 2];
  seg(ctx, b.x + 8, s.y - b.h * 0.16, b.x + b.w - 8, s.y - b.h * 0.16);
  seg(ctx, b.x + 8, s.y + b.h * 0.16, b.x + b.w - 8, s.y + b.h * 0.16);
  drawYarnMark(ctx, colorId, s.x, s.y, Math.min(b.w, b.h) * 0.42);
  if (st === "given") {
    for (const y of [b.y + 6, b.y + b.h - 6]) {
      dot(ctx, b.x + 6, y, 2.1, MO.woodBevel);
      dot(ctx, b.x + b.w - 6, y, 2.1, MO.woodBevel);
    }
  }
}
export function drawGT033WeaveCell(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  p: GT033WeaveCellParams
): void {
  const { slot: s, state: st } = p;
  const [w, h] =
    st === "hovered" && !rs.reducedMotion
      ? [s.w * 1.03, s.h * 1.03]
      : [s.w, s.h];
  const b: ZoneRect = { x: s.x - w / 2, y: s.y - h / 2, w, h };
  saveClip(ctx, p.clip);
  if (!p.shadowsOff && rs.softShadowsEnabled && st !== "idle") {
    ctx.shadowColor = alpha(MO.woodBorder, 0.18);
    [ctx.shadowBlur, ctx.shadowOffsetY] = [st === "hovered" ? 7 : 4, 2];
  }
  drawCellBody(ctx, b, s, p);
  if (p.ghostColorId) {
    ctx.save();
    ctx.globalAlpha = 0.42;
    ctx.setLineDash([5, 4]);
    rrect(ctx, b, yarnFillColor(p.ghostColorId), MO.amberDark, 2.2);
    drawYarnMark(ctx, p.ghostColorId, s.x, s.y, Math.min(w, h) * 0.4);
    ctx.restore();
  }
  const wave = p.winWavePhase ?? 0;
  if (st === "correct" && wave > 0) {
    rrect(
      ctx,
      b,
      alpha(SEM[100], 0.25 * (rs.reducedMotion ? 0.5 : wave)),
      SEM[500],
      2.8
    );
  }
  ctx.restore();
}
export function drawGT033SpoolHalo(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  p: GT033SpoolHaloParams
): void {
  const { slot: s, clip } = p;
  if (!(p.isHinted || p.isSelected || p.isHovered)) {
    return;
  }
  saveClip(ctx, clip);
  const pv = rs.reducedMotion ? 0.85 : 0.55 + 0.35 * Math.sin(p.timeMs * 0.006);
  const r = Math.min(s.w, s.h) * 0.44 + (p.isHinted ? 5 : 3);
  const [fA, lw] = p.isHinted
    ? [0.35 * pv, 3]
    : [p.isSelected ? 0.48 : 0.32, p.isSelected ? 2.6 : 2];
  const c = p.isHinted ? MO.amberGlow : MO.amberLight;
  const st = p.isHinted || p.isSelected ? MO.amberDark : MO.amber;
  dot(ctx, s.x, s.y, r, alpha(c, fA), st, lw);
  ctx.restore();
}
