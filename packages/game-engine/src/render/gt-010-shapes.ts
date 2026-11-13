import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";
import {
  type GT010OptionAnimOptions as AnimOpt,
  clampBoxInStage,
  clampRadiusInStage,
  type GT010ExpressionOptions as ExprOpt,
  getOptionPose,
  type GT010OptionVisualState as OptState,
  type GT010RuleVisualState as RuleState,
} from "#src/templates/GT-010/layout";
import {
  getCachedGradient,
  getContextGeneration,
  PRIMITIVE_GRADIENTS,
  setCachedGradient,
} from "./cache.js";
import { alpha } from "./color-utils.js";
import {
  applyCanvasFontAtSize,
  canvasFontPx,
  legibleFontPx,
  spaceOf,
} from "./type-scale.js";
import type { SceneBox } from "./types.js";

type Ctx = CanvasRenderingContext2D;
type Fill = string | CanvasGradient;
type Zone = ZoneRect | null | undefined;
type RS = RenderSystem;

const COLORS = designTokens.colors;
const WOOD = COLORS.montessori;
const OK_500 = COLORS.semantic.success[500];
const RETRY_500 = COLORS.retry[500];
const AURA_ID = PRIMITIVE_GRADIENTS.TARGET_HOVER_AURA;

function fillDisk(c: Ctx, cx: number, cy: number, r: number, f: Fill): void {
  c.beginPath();
  c.arc(cx, cy, r, 0, Math.PI * 2);
  c.fillStyle = f;
  c.fill();
}
function stroke(c: Ctx, color: string, lw: number): void {
  c.strokeStyle = color;
  c.lineWidth = lw;
  c.stroke();
}
function text(c: Ctx, t: string, x: number, y: number, s: number, w: number) {
  applyCanvasFontAtSize(c, s, "heading", "bold");
  c.fillStyle = COLORS.surface[800];
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText(t, x, y, w);
}
function drawBadge(c: Ctx, cx: number, cy: number, r: number, ok: boolean) {
  fillDisk(c, cx, cy, r, ok ? OK_500 : RETRY_500);
  stroke(c, COLORS.surface[0], 1.5);
  c.beginPath();
  if (ok) {
    c.moveTo(cx - r * 0.42, cy + 0.2);
    c.lineTo(cx - r * 0.1, cy + r * 0.35);
    c.lineTo(cx + r * 0.46, cy - r * 0.32);
  } else {
    c.arc(cx, cy, r * 0.46, -Math.PI * 0.75, Math.PI * 0.55);
  }
  stroke(c, COLORS.surface[0], 1.7);
}
function drawSlotAura(c: Ctx, cx: number, cy: number, r: number): void {
  const key = Math.round(r) * 100 + AURA_ID;
  const gen = getContextGeneration(c);
  let grad = getCachedGradient(c, gen, AURA_ID, key);
  if (!grad) {
    grad = c.createRadialGradient(0, 0, r * 0.2, 0, 0, r);
    grad.addColorStop(0, alpha(WOOD.amber, 0.34));
    grad.addColorStop(1, alpha(WOOD.amberLight, 0));
    setCachedGradient(c, gen, AURA_ID, key, grad);
  }
  c.save();
  c.translate(cx, cy);
  fillDisk(c, 0, 0, r, grad);
  c.restore();
}
export function drawGT010MarketBoard(c: Ctx, rs: RS, box: SceneBox, z?: Zone) {
  const b = clampBoxInStage(box, z, 3);
  const baseH = Math.min(4, z ? z.y + z.h - (b.y + b.h) - 1 : 4);
  c.save();
  if (rs.softShadowsEnabled) {
    c.shadowColor = alpha(WOOD.woodBorder, 0.18);
    c.shadowBlur = 6;
    c.shadowOffsetY = 2;
  }
  if (baseH > 0.5) {
    c.beginPath();
    c.roundRect(b.x, b.y + baseH, b.w, b.h, 16);
    c.fillStyle = WOOD.woodBorder;
    c.fill();
  }
  c.shadowColor = "transparent";
  c.beginPath();
  c.roundRect(b.x, b.y, b.w, b.h, 16);
  c.fillStyle = WOOD.woodTray;
  c.fill();
  stroke(c, WOOD.woodBevel, 2.2);
  for (const px of [b.x + 10, b.x + b.w - 10]) {
    for (const py of [b.y + 10, b.y + b.h - 10]) {
      fillDisk(c, px, py, 2.6, WOOD.woodBorder);
    }
  }
  c.restore();
}
export function drawGT010RuleRowBackdrop(
  c: Ctx,
  rs: RS,
  s: Slot,
  st: RuleState,
  ph: number
): void {
  const [x, y] = [s.x - s.w / 2 + 3, s.y - s.h / 2 + 3];
  const [w, h] = [Math.max(20, s.w - 6), Math.max(18, s.h - 6)];
  const [iw, ih] = [Math.max(12, w - 5), Math.max(12, h - 5)];
  c.save();
  c.beginPath();
  c.roundRect(x, y, w, h, 8);
  if (st === "selected" || st === "hinted") {
    stroke(c, WOOD.amber, 3.5);
    c.beginPath();
    c.roundRect(x + 2.5, y + 2.5, iw, ih, 6);
    stroke(c, alpha(WOOD.amber, 0.55), 1.4);
    c.beginPath();
    c.roundRect(x + w - 6.5, y + 6, 4.5, Math.max(8, h - 12), 2);
    c.fillStyle = WOOD.amber;
    c.fill();
  } else if (st === "active") {
    c.setLineDash([7, 4]);
    stroke(c, WOOD.amber, 3.2 + (rs.reducedMotion ? 0 : Math.sin(ph) * 0.4));
    c.setLineDash([]);
  } else if (st === "touching") {
    stroke(c, COLORS.brand[400], 2.8);
    c.beginPath();
    c.roundRect(x + 2.5, y + 2.5, iw, ih, 6);
    stroke(c, alpha(COLORS.brand[400], 0.65), 1.5);
  } else {
    stroke(c, WOOD.woodBevel, 1.4);
  }
  c.restore();
}
function drawHighlightedBadges(
  c: Ctx,
  s: Slot,
  cy: number,
  px: number,
  txt: string,
  spec: ExprOpt
): void {
  if (!spec.tokens.some((t) => t.isHighlighted)) {
    return;
  }
  applyCanvasFontAtSize(c, px, "heading", "bold");
  const measure = (t: string): number =>
    c.measureText(t).width || t.length * px * 0.58;
  const totalW = Math.max(1, measure(txt));
  const fit = Math.min(1, Math.max(40, s.w - 30) / totalW);
  const leftX = s.x + 4 - (totalW * fit) / 2;
  const r = Math.max(9, Math.min(14, s.h * 0.22));
  const glyphs = spec.tokens.map((t) => t.glyph);
  spec.tokens.forEach((tok, idx) => {
    if (tok.isHighlighted) {
      const pfx = idx > 0 ? `${glyphs.slice(0, idx).join(" + ")} + ` : "";
      const tokX = leftX + (measure(pfx) + measure(tok.glyph) / 2) * fit;
      fillDisk(c, tokX, cy, r, alpha(WOOD.amberLight, 0.78));
      stroke(c, WOOD.amber, 2.2);
    }
  });
}
export function drawGT010EquationExpression(
  c: Ctx,
  rs: RS,
  s: Slot,
  spec: ExprOpt
): void {
  const { space, scale } = spaceOf(rs);
  const boost = spec.lookedUp ? 1.12 : 1;
  const rawPx = Math.round(canvasFontPx(space, "label", scale) * boost);
  const px = legibleFontPx(Math.min(Math.floor(s.h * 0.48), rawPx), scale);
  const cy = spec.question ? s.y : s.y - s.h * 0.08;
  const maxW = Math.max(40, s.w - 30);
  const rev = spec.reveal ?? 0;
  c.save();
  if (spec.question && rev > 0) {
    const sub = spec.tokens.map((t) =>
      t.solvedValue === undefined ? t.glyph : `${t.glyph}(${t.solvedValue})`
    );
    const pillW = Math.min(s.w - 24, Math.max(80, s.w * 0.76));
    const pillH = Math.max(18, Math.min(s.h - 10, px + 8));
    c.beginPath();
    c.roundRect(s.x - pillW / 2 + 4, cy - pillH / 2, pillW, pillH, 8);
    c.fillStyle = alpha(WOOD.amberLight, 0.65 * rev);
    c.fill();
    stroke(c, WOOD.amber, 2);
    const txt = `${sub.join(" + ")} = ${spec.answer ?? "?"}`;
    text(c, txt, s.x + 4, cy, px, maxW);
    c.restore();
    return;
  }
  const lhs = spec.tokens.map((t) => t.glyph).join(" + ");
  const txt = `${lhs} = ${spec.rhs}${spec.hint ?? ""}`;
  drawHighlightedBadges(c, s, cy, px, txt, spec);
  text(c, txt, s.x + 4, cy, px, maxW);
  c.restore();
}
export function drawGT010LookupBridge(
  c: Ctx,
  rs: RS,
  fromSlots: readonly Slot[],
  qSlot: Slot | undefined,
  stage: Zone,
  ph: number
): void {
  if (!qSlot || fromSlots.length === 0) {
    return;
  }
  const maxX = stage ? stage.x + stage.w - 6 : qSlot.x + qSlot.w * 0.42;
  const bx = Math.min(maxX, qSlot.x + qSlot.w * 0.38);
  c.save();
  c.lineCap = "round";
  if (!rs.reducedMotion) {
    c.lineDashOffset = -ph * 10;
  }
  for (const from of fromSlots) {
    c.setLineDash([6, 5]);
    c.beginPath();
    c.moveTo(bx, from.y);
    c.lineTo(bx, qSlot.y);
    stroke(c, WOOD.amber, 2.6);
    c.setLineDash([]);
    fillDisk(c, bx, from.y, 3.2, WOOD.amber);
  }
  fillDisk(c, bx, qSlot.y, 3.6, WOOD.amber);
  c.restore();
}

const OPT_PAL = {
  idle: { fill: COLORS.surface[0], rim: WOOD.woodBorder, lw: 2.2 },
  touching: { fill: COLORS.surface[0], rim: COLORS.brand[400], lw: 3.2 },
  selected: { fill: WOOD.amberLight, rim: WOOD.amber, lw: 3.2 },
  correct: { fill: COLORS.semantic.success[50], rim: OK_500, lw: 3.2 },
  wrong: { fill: COLORS.retry[50], rim: RETRY_500, lw: 3.2 },
} as const;

export function drawGT010OptionToken(
  c: Ctx,
  rs: RS,
  s: Slot,
  val: number,
  st: OptState,
  anim: AnimOpt,
  stage?: Zone
): void {
  const maxH = Math.max(14, Math.min(s.w, s.h) / 2 - 4);
  const tf = getOptionPose(st, s.index, anim, rs.reducedMotion);
  const baseR = Math.max(12, maxH - 3) * tf.scale;
  const r = Math.min(maxH - 0.5, Math.max(11, baseR));
  const [cx, cy] = [s.x + tf.dx, s.y + Math.max(-2, Math.min(2, tf.dy))];
  const pal = OPT_PAL[st];
  const bev = st === "correct" ? OK_500 : WOOD.woodBevel;
  c.save();
  if (st === "selected" || st === "correct") {
    drawSlotAura(c, cx, cy, Math.min(maxH, r + 2.5));
  }
  fillDisk(c, cx, cy + Math.min(3.2, tf.lift), r, bev);
  fillDisk(c, cx, cy, r, pal.fill);
  stroke(c, pal.rim, pal.lw);
  if (st === "correct" || st === "selected") {
    c.beginPath();
    c.arc(cx, cy, Math.max(6, r - 4), 0, Math.PI * 2);
    stroke(c, alpha(pal.rim, 0.5), 1.4);
  }
  const { space, scale } = spaceOf(rs);
  const fPx = canvasFontPx(space, "number", scale);
  const px = legibleFontPx(Math.min(Math.floor(r * 0.92), fPx), scale);
  text(c, String(val), cx, cy, px, r * 1.6);
  if (st === "correct" || st === "wrong") {
    const bR = Math.max(6.5, r * 0.28);
    drawBadge(c, cx + r * 0.62, cy - r * 0.62, bR, st === "correct");
  }
  if (st === "wrong" && anim.wrongProgress !== null) {
    const rawR = Math.min(s.hitW, s.hitH) / 2 + 2;
    const ringR = clampRadiusInStage(cx, cy, rawR, stage);
    const prog = rs.reducedMotion ? 0.25 : anim.wrongProgress;
    rs.drawRetryRing(c, cx, cy, ringR, prog);
  }
  c.restore();
}
