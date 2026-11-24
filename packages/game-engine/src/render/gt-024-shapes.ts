import { alpha } from "#src/render/color-utils";
import { getEmojiSprite } from "#src/render/sprite-registry";
import { applyCanvasFontAtSize, legibleFontPx } from "#src/render/type-scale";
import type { SceneBox } from "#src/render/types";
import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";

export type GT024Bounds = SceneBox;
interface Pt {
  readonly x: number;
  readonly y: number;
}
export interface GT024Point extends Pt {
  readonly id?: string;
  readonly label?: string;
  readonly order: number;
}
export interface GT024Chevron {
  readonly lx: number;
  readonly ly: number;
  readonly rx: number;
  readonly ry: number;
  readonly tx: number;
  readonly ty: number;
}
export interface GT024HintVisual {
  readonly beadR: number;
  readonly beadX: number;
  readonly beadY: number;
  readonly from: GT024Point;
  readonly to: GT024Point;
}
export interface GT024RenderedWaypoint {
  readonly cx: number;
  readonly cy: number;
  readonly fill: string;
  readonly haloAlpha: number;
  readonly haloR: number;
  readonly isDone: boolean;
  readonly isPop: boolean;
  readonly isTargetNow: boolean;
  readonly label: string;
  readonly lineWidth: number;
  readonly outerHaloR: number;
  readonly r: number;
  readonly retryR: number;
  readonly sparkAlpha: number;
  readonly sparkDist: number;
  readonly stroke: string;
  readonly wrongProgress?: number;
}

type Ctx = CanvasRenderingContext2D;
const DASH_10_8: number[] = [10, 8];
const DASH_EMPTY: number[] = [];
const ANGLES = [0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2] as const;

function tracePoly(ctx: Ctx, pts: readonly Pt[]): void {
  ctx.beginPath();
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    if (p) {
      ctx[i === 0 ? "moveTo" : "lineTo"](p.x, p.y);
    }
  }
}

function strokePoly(
  ctx: Ctx,
  pts: readonly Pt[],
  color: string,
  width: number,
  dash?: number[]
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  if (dash) {
    ctx.setLineDash(dash);
  }
  tracePoly(ctx, pts);
  ctx.stroke();
  if (dash) {
    ctx.setLineDash(DASH_EMPTY);
  }
}

function drawCircle(ctx: Ctx, x: number, y: number, r: number): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
}

export function drawGT024SandSlate(
  ctx: Ctx,
  rs: RenderSystem,
  opts: {
    readonly box: GT024Bounds;
    readonly closedLoop: boolean;
    readonly guideGlyph: string | null;
    readonly inset: number;
    readonly isClosedReveal: boolean;
    readonly isWon: boolean;
    readonly shadowsOff: boolean;
    readonly waypoints: readonly GT024Point[];
  }
): void {
  const mo = designTokens.colors.montessori;
  const { box, inset: ins } = opts;
  ctx.save();
  ctx.save();
  if (!opts.shadowsOff && rs.softShadowsEnabled) {
    ctx.shadowColor = alpha(mo.woodBorder, 0.16);
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 3;
  }
  ctx.fillStyle = mo.woodBevel;
  ctx.beginPath();
  ctx.roundRect(box.x, box.y + 3, box.w, box.h, 18);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = alpha(mo.paper, 0.94);
  ctx.strokeStyle = mo.woodBorder;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(box.x, box.y, box.w, box.h, 18);
  ctx.fill();
  ctx.stroke();

  const ro = Math.max(5, ins * 0.65);
  ctx.fillStyle = mo.woodBorder;
  for (const dx of [ro, box.w - ro]) {
    drawCircle(ctx, box.x + dx, box.y + ro, 2.2);
    ctx.fill();
    drawCircle(ctx, box.x + dx, box.y + box.h - ro, 2.2);
    ctx.fill();
  }
  ctx.fillStyle = alpha(designTokens.colors.surface[50], 0.88);
  ctx.strokeStyle = alpha(mo.woodBevel, 0.65);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(box.x + ins, box.y + ins, box.w - ins * 2, box.h - ins * 2, 13);
  ctx.fill();
  ctx.stroke();

  if (opts.closedLoop && (opts.isWon || opts.isClosedReveal)) {
    const fillCol = opts.isWon ? mo.emeraldBright : mo.amber;
    ctx.fillStyle = alpha(fillCol, opts.isWon ? 0.16 : 0.12);
    tracePoly(ctx, opts.waypoints);
    ctx.closePath();
    ctx.fill();
  }
  const px = legibleFontPx(18);
  const gx = box.x + ins + px * 0.85;
  const gy = box.y + ins + px * 0.85;
  if (opts.guideGlyph && gx + px < box.x + box.w && gy + px < box.y + box.h) {
    ctx.save();
    ctx.globalAlpha = 0.24;
    const guideSprite = getEmojiSprite(opts.guideGlyph);
    if (guideSprite) {
      const sz = Math.round(px * 1.3);
      const half = sz / 2;
      ctx.drawImage(guideSprite, gx - half, gy - half, sz, sz);
    } else {
      applyCanvasFontAtSize(ctx, px, "body", "normal");
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(opts.guideGlyph, gx, gy);
    }
    ctx.restore();
  }
  ctx.restore();
}

export function drawGT024PathGrooves(
  ctx: Ctx,
  _rs: RenderSystem,
  opts: {
    readonly chevrons: readonly GT024Chevron[];
    readonly fadingAlpha: number;
    readonly fadingPoints: readonly Pt[];
    readonly hint: GT024HintVisual | null;
    readonly isWon: boolean;
    readonly showGuideLines: boolean;
    readonly tracedPoints: readonly GT024Point[];
    readonly waypoints: readonly GT024Point[];
  }
): void {
  if (opts.waypoints.length === 0) {
    return;
  }
  const mo = designTokens.colors.montessori;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (opts.showGuideLines) {
    strokePoly(ctx, opts.waypoints, alpha(mo.woodBevel, 0.42), 8);
    const dashCol = designTokens.colors.surface[300];
    strokePoly(ctx, opts.waypoints, dashCol, 4, DASH_10_8);
    ctx.strokeStyle = alpha(mo.woodBorder, 0.68);
    ctx.lineWidth = 2.2;
    for (const ch of opts.chevrons) {
      ctx.beginPath();
      ctx.moveTo(ch.lx, ch.ly);
      ctx.lineTo(ch.tx, ch.ty);
      ctx.lineTo(ch.rx, ch.ry);
      ctx.stroke();
    }
  }
  if (opts.hint) {
    const seg = [opts.hint.from, opts.hint.to];
    strokePoly(ctx, seg, alpha(mo.amber, 0.82), 4.5, DASH_10_8);
    if (opts.hint.beadR > 0) {
      ctx.fillStyle = mo.amber;
      drawCircle(ctx, opts.hint.beadX, opts.hint.beadY, opts.hint.beadR);
      ctx.fill();
    }
  }
  if (opts.fadingAlpha > 0 && opts.fadingPoints.length >= 2) {
    strokePoly(ctx, opts.fadingPoints, alpha(mo.amber, opts.fadingAlpha), 4);
  }
  if (opts.tracedPoints.length > 1) {
    const c1 = opts.isWon ? mo.emerald : mo.amberDark;
    const c2 = opts.isWon ? mo.emeraldBright : mo.amber;
    strokePoly(ctx, opts.tracedPoints, c1, 7);
    strokePoly(ctx, opts.tracedPoints, c2, 4);
  }
  ctx.restore();
}

function drawPegMark(
  ctx: Ctx,
  it: GT024RenderedWaypoint,
  showNumberedDots: boolean,
  fontPx: number
): void {
  const s0 = designTokens.colors.surface[0];
  if (showNumberedDots) {
    ctx.fillStyle = it.isDone ? s0 : designTokens.colors.surface[900];
    applyCanvasFontAtSize(ctx, fontPx, "heading", "bold");
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(it.label, it.cx, it.cy);
  } else if (it.isDone) {
    ctx.strokeStyle = s0;
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(it.cx - it.r * 0.32, it.cy + it.r * 0.02);
    ctx.lineTo(it.cx - it.r * 0.06, it.cy + it.r * 0.28);
    ctx.lineTo(it.cx + it.r * 0.36, it.cy - it.r * 0.24);
    ctx.stroke();
  }
}

export function drawGT024Waypoints(
  ctx: Ctx,
  rs: RenderSystem,
  opts: {
    readonly items: readonly GT024RenderedWaypoint[];
    readonly scaffoldLevel: 0 | 1 | 2 | 3;
    readonly showNumberedDots: boolean;
  }
): void {
  const mo = designTokens.colors.montessori;
  const fontPx = legibleFontPx(14);
  for (const it of opts.items) {
    ctx.save();
    if (it.isTargetNow) {
      ctx.strokeStyle = alpha(mo.amber, it.haloAlpha);
      ctx.lineWidth = 2.5;
      drawCircle(ctx, it.cx, it.cy, it.haloR);
      ctx.stroke();
      if (opts.scaffoldLevel >= 1) {
        ctx.strokeStyle = alpha(mo.amberDark, 0.75);
        ctx.lineWidth = 2;
        drawCircle(ctx, it.cx, it.cy, it.outerHaloR);
        ctx.stroke();
      }
    }
    if (it.wrongProgress !== undefined) {
      rs.drawRetryRing(ctx, it.cx, it.cy, it.retryR, it.wrongProgress);
    }
    ctx.fillStyle = it.fill;
    ctx.strokeStyle = it.stroke;
    ctx.lineWidth = it.lineWidth;
    drawCircle(ctx, it.cx, it.cy, it.r);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = alpha(designTokens.colors.surface[0], 0.32);
    drawCircle(ctx, it.cx, it.cy - it.r * 0.28, it.r * 0.48);
    ctx.fill();
    if (it.sparkAlpha > 0) {
      ctx.fillStyle = alpha(mo.amber, it.sparkAlpha);
      for (const ang of ANGLES) {
        const sx = it.cx + Math.cos(ang) * it.sparkDist;
        const sy = it.cy + Math.sin(ang) * it.sparkDist;
        drawCircle(ctx, sx, sy, 2);
        ctx.fill();
      }
    }
    drawPegMark(ctx, it, opts.showNumberedDots, fontPx);
    ctx.restore();
  }
}
