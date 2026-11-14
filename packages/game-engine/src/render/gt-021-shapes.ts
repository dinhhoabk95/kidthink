import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import { alpha } from "#src/render/color-utils";
import {
  drawMirrorFlash,
  mirrorFlashStrength,
  mirrorRevealAlpha,
} from "#src/render/craft-shapes";
import {
  drawAssetInSlot,
  drawMirroredSlotItem,
} from "#src/render/shared-render";
import type { RenderItem as D, RenderAsset } from "#src/render/types";
import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";

type Ctx = CanvasRenderingContext2D;
type Sys = RenderSystem;
export type GT021Axis = "vertical" | "horizontal";
type RH = "none" | "wrong_pair" | "hint" | "inspected";
type TS = "empty" | "targeted" | "hovered" | "correct" | "wrong" | "closed";
type PS = "idle" | "selected" | "hovered" | "wrong" | "off";
export type GT021RefHighlight = RH;
export type GT021TargetState = TS;
export type GT021TrayState = PS;
export type GT021GuidePair = Record<"fromX" | "fromY" | "toX" | "toY", number> &
  Record<"tone", "amber" | "sky">;
type BFlag = "showAxisGuide" | "allCompleted" | "degraded";
type TFlag = "showGhostHint" | "isHintTarget" | "degraded";
type TNum = "wrongProgress" | "revealElapsedMs" | "index" | "timeMs";
type CellBase = Record<"index" | "timeMs", number> &
  Record<"slot", Slot> &
  Record<"item", D>;
type TExtra = Record<TFlag, boolean> &
  Record<TNum, number> &
  Record<"placedItem", D | null> &
  Record<"expectedItem", D> &
  Record<"slot", Slot>;
type StageAxis = Record<"stageBounds", ZoneRect> & Record<"axis", GT021Axis>;
export type GT021BoardProps = Readonly<Record<BFlag, boolean> & StageAxis> & {
  readonly flashElapsedMs: number | null;
  readonly guidePairs: readonly GT021GuidePair[];
};
export type GT021RefCellProps = Readonly<CellBase & Record<"highlight", RH>>;
export type GT021TargetCellProps = Readonly<
  TExtra & StageAxis & Record<"state", TS>
>;
type PExtra = Record<"state", PS> &
  Record<"wrongProgress", number> &
  Record<"isHinted", boolean>;
export type GT021TrayPieceProps = Readonly<CellBase & PExtra>;
const [C, M] = [designTokens.colors, designTokens.colors.montessori];
const BADGES = [C.brand[500], M.amberDark, M.indigo, M.emerald] as const;
const [SX, SY] = [[-1, 1, -1, 1] as const, [-1, -1, 1, 1] as const];
const SHAPES: readonly (readonly number[])[] = [
  [-0.65, -0.7, 0.75, -0.25, 0.15, 0.75, -0.65, 0.45],
  [-0.65, -0.7, -0.1, -0.7, -0.1, 0.15, 0.65, 0.15, 0.65, 0.7, -0.65, 0.7],
  [-0.6, 0.65, -0.55, -0.7, 0.7, 0.1, 0.2, 0.65],
  [-0.65, -0.2, 0.15, -0.7, 0.7, -0.15, 0.1, 0.7, -0.25, 0.25],
];
const SOCK: Record<TS, readonly [string, string, number]> = {
  empty: [C.surface[100], M.woodBorder, 2],
  targeted: [M.amberGlow, M.amber, 3],
  hovered: [M.amberGlow, C.brand[500], 3],
  correct: [C.semantic.success[50], C.semantic.success[500], 2.5],
  wrong: [C.retry[50], C.retry[500], 2.5],
  closed: [M.amberGlow, M.amber, 2.5],
};
const TRAY: Record<PS, readonly [string, string, number, number]> = {
  idle: [C.surface[0], M.woodBorder, 0, 1],
  hovered: [M.amberLight, M.amberDark, 2, 1.02],
  selected: [M.amberGlow, C.brand[500], -4, 1.04],
  wrong: [C.retry[50], C.retry[500], 0, 1],
  off: [C.surface[100], C.surface[300], 0, 1],
};
const EMJ_CODE = /^EMJ-[a-z0-9-]+$/i;
const cl = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const isOk = (a: RenderAsset | null | undefined): a is RenderAsset => {
  const r = a?.kind === "emoji" ? a.ref.trim() : "";
  const okEmj = (r.codePointAt(0) ?? 0) > 127 && !EMJ_CODE.test(r);
  return Boolean(a && (a.kind === "text" ? a.text.trim() : okEmj));
};
function assetHash(it: D): number {
  const a = it.asset;
  const p = a?.kind === "image" ? a.path : undefined;
  const t = a?.kind === "text" ? a.text : undefined;
  const k = p ?? t ?? (a?.kind === "emoji" ? a.ref : it.id);
  return [...k].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 9973, 0);
}
function rBox(c: Ctx, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  c.roundRect(x, y, Math.max(4, w), Math.max(4, h), Math.max(2, Math.abs(r)));
  c[r < 0 ? "stroke" : "fill"]();
}
function circ(c: Ctx, x: number, y: number, r: number): void {
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
}
function rivets(c: Ctx, x: number, y: number, r: number, sz: number): void {
  c.fillStyle = M.amberDark;
  for (let i = 0; i < 4; i++) {
    circ(c, x + (SX[i] ?? 1) * r * 0.68, y + (SY[i] ?? 1) * r * 0.68, sz);
  }
}
function pen(c: Ctx, f: string, s: string, w: number): void {
  [c.fillStyle, c.strokeStyle, c.lineWidth] = [f, s, w];
}
function sq(c: Ctx, rs: Sys, s: Slot, r: number, f: string, b: string): void {
  rs.drawClayBody(c, s.x, s.y, r, f, b, "square");
}
function aura(c: Ctx, rs: Sys, s: Slot, r: number, t: number): void {
  rs.drawScaffoldingHighlight(c, s.x, s.y, r, (t % 1000) / 1000);
}
function shift(s: Slot, dx: number, dy: number, k = 1): Slot {
  return { ...s, x: s.x + dx, y: s.y + dy, w: s.w * k, h: s.h * k };
}
const shake = (on: boolean, wp: number, rm: boolean): number =>
  on && wp < 1 && !rm ? Math.sin(wp * Math.PI * 6) * 4 * (1 - wp) : 0;
function drawFallback(c: Ctx, s: Slot, it: D, ax?: GT021Axis): void {
  const [r, h] = [Math.min(s.w, s.h) * 0.34, assetHash(it) % 4];
  const [fx, fy] = [ax === "vertical" ? -1 : 1, ax === "horizontal" ? -1 : 1];
  const pts = SHAPES[h] ?? SHAPES[0] ?? [];
  c.save();
  c.translate(s.x, s.y);
  pen(c, BADGES[h] ?? C.brand[500], C.surface[0], 2);
  c.beginPath();
  for (let i = 0; i < pts.length; i += 2) {
    const [px, py] = [(pts[i] ?? 0) * r * fx, (pts[i + 1] ?? 0) * r * fy];
    c[i === 0 ? "moveTo" : "lineTo"](px, py);
  }
  c.closePath();
  c.fill();
  c.stroke();
  c.restore();
}
function drawContent(c: Ctx, rs: Sys, s: Slot, it: D, ax?: GT021Axis): void {
  const ok = isOk(it.asset);
  const mIt = ok ? it : { id: it.id, state: it.state };
  if (ax) {
    drawMirroredSlotItem(c, rs, s, mIt, ax, "square");
  } else if (ok) {
    drawAssetInSlot(c, it.asset, s);
  }
  if (!ok) {
    drawFallback(c, s, it, ax);
  }
}
function drawBoardGuides(c: Ctx, rs: Sys, p: GT021BoardProps): void {
  const { stageBounds: b, axis, flashElapsedMs: fe } = p;
  const [mx, my] = [b.x + b.w / 2, b.y + b.h / 2];
  const [x0, x1, y0, y1] = [b.x + 12, b.x + b.w - 12, b.y + 12, b.y + b.h - 12];
  const v = axis === "vertical";
  c.fillStyle = M.amberDark;
  circ(c, cl(v ? mx : x0 + 6, x0, x1), cl(v ? y0 + 6 : my, y0, y1), 5);
  circ(c, cl(v ? mx : x1 - 6, x0, x1), cl(v ? y1 - 6 : my, y0, y1), 5);
  for (const gp of p.guidePairs) {
    c.save();
    pen(c, M.amber, gp.tone === "amber" ? M.amber : C.brand[400], 2.5);
    c.setLineDash([4, 6]);
    c.beginPath();
    c.moveTo(gp.fromX, gp.fromY);
    c.lineTo(gp.toX, gp.toY);
    c.stroke();
    c.restore();
  }
  const s = fe === null ? 0 : mirrorFlashStrength(fe, rs.reducedMotion);
  if (s > 0) {
    drawMirrorFlash(c, axis, b, s);
  }
}
export function drawGT021SymmetryBoard(c: Ctx, rs: Sys, p: GT021BoardProps) {
  const { stageBounds: b, axis } = p;
  const [bx, by, bw, bh] = [b.x + 4, b.y + 4, b.w - 8, b.h - 8];
  c.save();
  if (!p.degraded && rs.softShadowsEnabled) {
    c.save();
    c.shadowColor = alpha(M.woodBorder, 0.14);
    [c.shadowBlur, c.shadowOffsetY, c.fillStyle] = [10, 4, M.woodBorder];
    rBox(c, bx, by + 3, bw, bh, 18);
    c.restore();
  }
  const bc = p.allCompleted ? C.semantic.success[500] : M.woodBorder;
  pen(c, M.plateLight, bc, 3);
  rBox(c, bx, by, bw, bh, 18);
  c.stroke();
  const [ix, iy, iw, ih] = [bx + 6, by + 6, bw - 12, bh - 12];
  const [hw, hh] = [iw / 2, ih / 2];
  const g = axis === "vertical" ? [hw, ih, ix + hw, iy] : [iw, hh, ix, iy + hh];
  c.save();
  c.beginPath();
  c.roundRect(ix, iy, iw, ih, 14);
  c.clip();
  c.fillStyle = alpha(M.amberLight, 0.24);
  c.fillRect(ix, iy, g[0] ?? 0, g[1] ?? 0);
  c.fillStyle = alpha(C.surface[0], 0.5);
  c.fillRect(g[2] ?? 0, g[3] ?? 0, g[0] ?? 0, g[1] ?? 0);
  c.restore();
  if (p.showAxisGuide) {
    drawBoardGuides(c, rs, p);
  }
  c.restore();
}
export function drawGT021ReferenceCell(c: Ctx, rs: Sys, p: GT021RefCellProps) {
  const { slot: s, item, highlight, timeMs } = p;
  const r = Math.min(s.w, s.h) / 2;
  c.save();
  if (highlight === "wrong_pair") {
    c.fillStyle = alpha(C.retry[400], 0.25);
    rBox(c, s.x - r - 5, s.y - r - 5, r * 2 + 10, r * 2 + 10, r * 0.26);
  }
  const fill = highlight === "none" ? M.plateMid : M.amberGlow;
  const brd = highlight === "wrong_pair" ? C.retry[500] : M.woodBorder;
  sq(c, rs, s, r, fill, brd);
  rivets(c, s.x, s.y, r, 2.4);
  drawContent(c, rs, s, item);
  if (highlight === "hint" || highlight === "inspected") {
    aura(c, rs, s, r + 5, timeMs);
  }
  c.restore();
}
function drawPlacedTarget(c: Ctx, rs: Sys, p: GT021TargetCellProps, r: number) {
  if (!p.placedItem) {
    return;
  }
  const isWrong = p.state === "wrong";
  const s = shift(p.slot, shake(isWrong, p.wrongProgress, rs.reducedMotion), 0);
  c.save();
  c.globalAlpha = mirrorRevealAlpha(p.revealElapsedMs, rs.reducedMotion);
  drawContent(c, rs, s, p.placedItem, p.axis);
  c.restore();
  if (isWrong) {
    if (p.wrongProgress < 1) {
      rs.drawRetryRing(c, p.slot.x, p.slot.y, r * 1.05, p.wrongProgress);
    }
    return;
  }
  if (!(p.degraded || rs.reducedMotion) && p.revealElapsedMs < 600) {
    const [b, k] = [p.stageBounds, 1 - p.revealElapsedMs / 600];
    c.fillStyle = M.amber;
    for (let i = 0; i < 4; i++) {
      const px = cl(s.x + (SX[i] ?? 1) * (r + 4), b.x + 6, b.x + b.w - 6);
      const py = cl(s.y + (SY[i] ?? 1) * (r + 4), b.y + 6, b.y + b.h - 6);
      circ(c, px, py, 3 * k);
    }
  }
}
export function drawGT021TargetCell(c: Ctx, rs: Sys, p: GT021TargetCellProps) {
  const { slot, axis, state } = p;
  const r = Math.min(slot.w, slot.h) / 2;
  c.save();
  if ((state === "correct" || state === "wrong") && p.placedItem) {
    drawPlacedTarget(c, rs, p, r);
  } else {
    const [fill, dashColor, dashW] = SOCK[state];
    pen(c, fill, alpha(M.woodBorder, 0.28), 2);
    rBox(c, slot.x - r, slot.y - r, r * 2, r * 2, r * 0.25);
    c.stroke();
    c.save();
    [c.strokeStyle, c.lineWidth] = [dashColor, dashW];
    c.setLineDash([7, 5]);
    rBox(c, slot.x - r + 3, slot.y - r + 3, (r - 3) * 2, (r - 3) * 2, -r * 0.2);
    c.restore();
    if (state === "closed" || p.showGhostHint) {
      c.save();
      c.globalAlpha = state === "closed" ? 0.55 : 0.36;
      drawContent(c, rs, slot, p.expectedItem, axis);
      c.restore();
    }
  }
  if (p.isHintTarget) {
    aura(c, rs, slot, r + 6, p.timeMs);
  }
  c.restore();
}
export function drawGT021TrayPiece(c: Ctx, rs: Sys, p: GT021TrayPieceProps) {
  const { slot, item, index, state } = p;
  const r = Math.min(slot.w, slot.h) / 2;
  c.save();
  const [fill, border, liftY, scale] = TRAY[state];
  if (state === "off") {
    c.globalAlpha = 0.55;
  }
  const bOn = state === "idle" && !rs.reducedMotion;
  const breath = bOn ? Math.sin(p.timeMs * 0.003 + index * 1.1) * 1.2 : 0;
  const dx = shake(state === "wrong", p.wrongProgress, rs.reducedMotion);
  const ds = shift(slot, dx, liftY + breath, scale);
  sq(c, rs, ds, Math.min(ds.w, ds.h) / 2, fill, border);
  if (state === "selected") {
    rivets(c, ds.x, ds.y, r, 2.2);
  }
  drawContent(c, rs, ds, item);
  if (state === "wrong" && p.wrongProgress < 1) {
    rs.drawRetryRing(c, slot.x, slot.y, r * 1.08, p.wrongProgress);
  }
  if (p.isHinted) {
    aura(c, rs, slot, r + 6, p.timeMs);
  }
  c.restore();
}
