import type { HintLevel } from "#src/game-session";
import type { Slot } from "#src/layout/types";
import { CARD_FLIP_MS, cardFlipPose } from "#src/render/flashcard";
import { drawSlotItem, drawSubPromptText } from "#src/render/shared-render";
import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";
import { alpha } from "./color-utils.js";
import type { RenderAsset, SceneBox } from "./types.js";

export interface GT027SharedRenderParams {
  readonly stageRect?: SceneBox;
  readonly isSignaling: boolean;
  readonly hintLevel: 0 | HintLevel;
  readonly softShadowsEnabled?: boolean;
  readonly timeMs: number;
}
export interface GT027RuleBannerParams extends GT027SharedRenderParams {
  readonly captionRect?: SceneBox;
  readonly currentText: string;
  readonly previousText: string;
  readonly flipElapsedMs: number | null;
  readonly criterion: "color" | "shape" | "size";
  readonly targetValue: string;
  readonly signalProgress: number;
  readonly completedSteps: number;
  readonly switchAfterTrials: number;
  readonly wrongFlashIntensity: number;
  readonly cssPerLogic?: number;
}
export interface GT027ItemCardParams extends GT027SharedRenderParams {
  readonly slot: Slot;
  readonly itemId: string;
  readonly asset: RenderAsset;
  readonly color: string;
  readonly shape: string;
  readonly size?: string;
  readonly state: "idle" | "hovered" | "correct" | "wrong";
  readonly wrongIntensity: number;
  readonly correctPulseProgress: number;
  readonly revealCorrect: boolean;
  readonly isHintSample: boolean;
  readonly isHintTarget: boolean;
  readonly particlesEnabled: boolean;
}
type Ctx = CanvasRenderingContext2D;
type Box4 = readonly [number, number, number, number];
type Box6 = readonly [number, number, number, number, number, number];
type Arc3 = readonly [number, number, number];
const C = designTokens.colors;
const [m, sB, sV] = [C.montessori, C.scene.blue, C.scene.violet];
const [cR, cRL, cY, cYL] = [m.coral, m.coralLight, m.amber, m.amberLight];
const [cG, cGL, TAU] = [m.emeraldBright, m.emerald, Math.PI * 2];
const [BROKEN_RE, SZ_V] = [/^EMJ-[A-Z0-9_-]+$/i, [0.62, 0.8, 0.96]];
const GEO = new Set(["circle", "square", "star", "triangle", "diamond"]);
const SZ_K = ["small", "medium", "large"];
const POLY_N: Readonly<Record<string, number>> = { triangle: 3, diamond: 4 };
const AC_K = ["red", "blue", "yellow", "green", "orange", "purple", "pink"];
const AC_F = [cR, sB[500], cY, cG, C.cta[500], sV[500], C.scene.pink];
const AC_R = [cRL, sB[400], cYL, cGL, C.cta[300], sV[400], cRL];
const ST_K = ["idle", "hovered", "correct", "wrong"];
const ST_BG = [m.paper, m.paper, C.brand[50], C.retry[50]];
const ST_BR = [m.woodBevel, m.woodBorder, cG, C.retry[500]];
const cl = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
function st(g: Ctx, fill: string, stroke: string, lw: number) {
  [g.fillStyle, g.strokeStyle, g.lineWidth] = [fill, stroke, lw];
}
function clampArc(cx: number, cy: number, r: number, b?: SceneBox): Arc3 {
  const sx = b ? cl(cx, b.x + 2, b.x + b.w - 2) : cx;
  const sy = b ? cl(cy, b.y + 2, b.y + b.h - 2) : cy;
  const rx = b ? Math.min(sx - b.x - 1, b.x + b.w - 1 - sx) : r;
  const ry = b ? Math.min(sy - b.y - 1, b.y + b.h - 1 - sy) : r;
  return [sx, sy, Math.max(1, Math.min(r, rx, ry))];
}
function rBox(g: Ctx, bx: Box4, r: number, b?: SceneBox, s = true, sh = 0) {
  const x0 = b ? Math.max(b.x + 1, bx[0]) : bx[0];
  const y0 = b ? Math.max(b.y + 1, bx[1]) : bx[1];
  const x1 = b ? Math.min(b.x + b.w - 1, bx[0] + bx[2]) : bx[0] + bx[2];
  const y1 = b ? Math.min(b.y + b.h - 1, bx[1] + bx[3]) : bx[1] + bx[3];
  const [w, h] = [Math.max(2, x1 - x0), Math.max(2, y1 - y0)];
  g.beginPath();
  g.roundRect(x0, y0, w, h, cl(r, 2, Math.min(w, h) / 2));
  g.save();
  [g.shadowColor, g.shadowBlur] = [alpha(m.woodBorder, 0.18), sh];
  g.shadowOffsetY = sh > 0 ? Math.min(4, sh / 3) : 0;
  g.fill();
  g.restore();
  g[s ? "stroke" : "fill"]();
}
function circ(g: Ctx, c: Arc3, stroke = true) {
  g.beginPath();
  g.arc(c[0], c[1], c[2], 0, TAU);
  g.fill();
  g[stroke ? "stroke" : "fill"]();
}
function resolveAttrColor(c: string): readonly [string, string] {
  const i = AC_K.indexOf(c.toLowerCase());
  return [AC_F[i] ?? C.brand[500], AC_R[i] ?? C.brand[300]];
}
function drawPoly(g: Ctx, c: Arc3, shape: string, b?: SceneBox) {
  const [cx, cy, r] = c;
  const k = shape.toLowerCase();
  if (k === "circle") {
    circ(g, c, true);
    return;
  }
  if (k === "square") {
    const s = r * 1.5;
    rBox(g, [cx - s / 2, cy - s / 2, s, s], Math.max(2, s * 0.2), b, true, 0);
    return;
  }
  const n = POLY_N[k] ?? 10;
  g.beginPath();
  for (let i = 0; i < n; i++) {
    const a = (i * TAU) / n - Math.PI / 2;
    const d = r * (n === 10 && i % 2 === 1 ? 0.42 : 0.9);
    const [px, py] = [cx + Math.cos(a) * d, cy + Math.sin(a) * d];
    const sx = b ? cl(px, b.x + 1, b.x + b.w - 1) : px;
    const sy = b ? cl(py, b.y + 1, b.y + b.h - 1) : py;
    g[i === 0 ? "moveTo" : "lineTo"](sx, sy);
  }
  g.closePath();
  g.fill();
  g.stroke();
}
export type GT027RuleGlyph =
  | { readonly kind: "dot"; readonly color: string }
  | { readonly kind: "shape"; readonly shape: string }
  | { readonly kind: "size"; readonly level: number };

/** Hình icon luật = chính **giá trị** luật: một chấm đỏ, một hình vuông (`BR-E027-10`). */
export function resolveGT027RuleGlyph(
  criterion: "color" | "shape" | "size",
  value: string
): GT027RuleGlyph {
  if (criterion === "color") {
    return { kind: "dot", color: value };
  }
  if (criterion === "shape") {
    return { kind: "shape", shape: value };
  }
  const at = SZ_K.indexOf(value);
  return { kind: "size", level: at >= 0 ? at : 1 };
}

/** Cạnh icon luật tối thiểu theo px CSS (`BR-E027-10`); 1 px dư cho viền làm tròn. */
const ICON_MIN_CSS = 29;
const BANNER_PAD = 6;
const BANNER_DOT_STEP = 12;

export interface GT027BannerLayout {
  readonly box: SceneBox;
  readonly icon: SceneBox;
  readonly pill: SceneBox;
}

/**
 * Bố cục dải luật: cột icon bên trái (>= 28 px CSS), chấm tiến độ bên phải,
 * pill chữ nằm giữa hai cột nên không bao giờ đè icon (`BR-E027-10`).
 */
export function layoutGT027RuleBanner(
  caption: SceneBox,
  cssPerLogic: number | undefined,
  steps = 0
): GT027BannerLayout {
  const scale = cssPerLogic && cssPerLogic > 0 ? cssPerLogic : 1;
  const box = {
    x: caption.x + 12,
    y: caption.y + 2,
    w: Math.max(180, caption.w - 24),
    h: Math.max(30, caption.h - BANNER_PAD),
  };
  const side = Math.min(Math.ceil(ICON_MIN_CSS / scale), box.h - 2);
  const icon = {
    x: box.x + BANNER_PAD,
    y: box.y + (box.h - side) / 2,
    w: side,
    h: side,
  };
  const dotsW = steps > 0 ? steps * BANNER_DOT_STEP + 8 : 0;
  const left = icon.x + icon.w + 8;
  const right = box.x + box.w - dotsW - BANNER_PAD;
  const pillH = Math.min(32, box.h);
  const pill = {
    x: left,
    y: box.y + (box.h - pillH) / 2,
    w: Math.max(40, right - left),
    h: pillH,
  };
  return { box, icon, pill };
}

function drawRuleGlyph(g: Ctx, icon: SceneBox, p: GT027RuleBannerParams) {
  const [cx, cy, r] = [icon.x + icon.w / 2, icon.y + icon.h / 2, icon.w / 2];
  const glyph = resolveGT027RuleGlyph(p.criterion, p.targetValue);
  if (glyph.kind === "dot") {
    const [fill, rim] = resolveAttrColor(glyph.color);
    st(g, fill, rim, 2);
    circ(g, clampArc(cx, cy, r * 0.62, p.stageRect), true);
  } else if (glyph.kind === "shape") {
    st(g, m.indigoLight, m.indigo, 2);
    drawPoly(
      g,
      clampArc(cx, cy, r * 0.68, p.stageRect),
      glyph.shape,
      p.stageRect
    );
  } else {
    for (let i = 0; i < 3; i++) {
      const on = glyph.level === i;
      st(g, on ? cY : m.plateInner, on ? m.amberDark : m.woodBevel, 1.5);
      const [dx, dy, rr] = [-0.5 + i * 0.47, 0.14 - i * 0.1, 0.26 + i * 0.1];
      circ(g, clampArc(cx + r * dx, cy + r * dy, r * rr, p.stageRect), true);
    }
  }
}

function drawRuleIcon(g: Ctx, icon: SceneBox, p: GT027RuleBannerParams) {
  const hint = p.hintLevel === 2;
  st(g, m.plateLight, hint ? cY : m.woodBevel, hint ? 3 : 2);
  rBox(
    g,
    [icon.x, icon.y, icon.w, icon.h],
    icon.w * 0.28,
    p.stageRect,
    true,
    0
  );
  if (hint) {
    st(g, alpha(m.amberGlow, 0.25), cY, 2.2);
    rBox(
      g,
      [icon.x - 3, icon.y - 3, icon.w + 6, icon.h + 6],
      icon.w * 0.3,
      p.stageRect
    );
  }
  drawRuleGlyph(g, icon, p);
  if (p.isSignaling) {
    st(g, cY, m.amberDark, 1.4);
    const dot = [icon.x + icon.w - 4, icon.y + 4, 4] as const;
    circ(g, clampArc(dot[0], dot[1], dot[2], p.stageRect), true);
  }
}
function applyBannerStyle(g: Ctx, p: GT027RuleBannerParams) {
  const h1 = p.hintLevel === 1;
  const b0 = [m.plateLight, h1 ? cY : m.woodBevel, h1 ? 2.6 : 2] as const;
  const err = [C.retry[100], C.retry[500], 2.6] as const;
  const mid = p.wrongFlashIntensity > 0 ? err : b0;
  const [bg, brd, lw] = p.isSignaling ? ([m.amberGlow, cY, 2.6] as const) : mid;
  st(g, bg, brd, lw);
}
function resolveFlip(p: GT027RuleBannerParams, reduced: boolean) {
  const f = p.flipElapsedMs;
  if (f !== null && f >= 0 && f < CARD_FLIP_MS) {
    const pose = cardFlipPose(f, reduced);
    const txt = pose.showsNewFace ? p.currentText : p.previousText;
    return [pose.scaleX, txt] as const;
  }
  return [1, p.currentText] as const;
}
function drawBannerDots(g: Ctx, box: SceneBox, p: GT027RuleBannerParams) {
  const steps = cl(p.switchAfterTrials, 1, 6);
  const dotsX = box.x + box.w - steps * BANNER_DOT_STEP - 4;
  for (let i = 0; i < steps; i++) {
    const done = i < p.completedSteps;
    st(g, done ? cG : m.plateInner, done ? cGL : m.woodBevel, 1.5);
    circ(
      g,
      clampArc(dotsX + i * BANNER_DOT_STEP, box.y + box.h / 2, 4.5, p.stageRect)
    );
  }
}
function drawRuleBanner(g: Ctx, rs: RenderSystem, p: GT027RuleBannerParams) {
  const [x, y] = [rs.LOGIC_WIDTH * 0.12, rs.LOGIC_HEIGHT * 0.12];
  const c = p.captionRect ?? { x, y, w: rs.LOGIC_WIDTH * 0.76, h: 44 };
  const steps = cl(p.switchAfterTrials, 1, 6);
  const lay = layoutGT027RuleBanner(c, p.cssPerLogic, steps);
  const [scaleX, shownText] = resolveFlip(p, rs.reducedMotion);
  const sinP = Math.sin(p.timeMs * 0.008) * 0.025;
  const pulse = p.hintLevel === 1 && !rs.reducedMotion ? 1 + sinP : 1;
  const [cx, cy] = [c.x + c.w / 2, c.y + c.h / 2];
  const { x: bx, y: by, w: bw, h: bh } = lay.box;
  g.save();
  g.translate(cx, cy);
  g.scale(scaleX * pulse, pulse);
  g.translate(-cx, -cy);
  const isHot = p.isSignaling || p.wrongFlashIntensity > 0;
  st(g, isHot ? m.amberDark : m.woodBorder, m.woodBorder, 1);
  rBox(g, [bx, by + 3, bw, bh], 16, p.stageRect, false, 0);
  applyBannerStyle(g, p);
  const hasSh = rs.softShadowsEnabled && (p.softShadowsEnabled ?? true);
  rBox(g, [bx, by, bw, bh], 16, p.stageRect, true, hasSh ? 8 : 0);
  drawRuleIcon(g, lay.icon, p);
  drawBannerDots(g, lay.box, p);
  if (p.isSignaling) {
    const barW = Math.max(8, (bw - 28) * cl(1 - p.signalProgress, 0.05, 1));
    st(g, cY, m.amberDark, 1);
    rBox(g, [bx + 14, by + bh - 4, barW, 2.5], 2, p.stageRect, false, 0);
  }
  drawSubPromptText(g, rs, shownText, lay.pill);
  g.restore();
}
function cardBox(p: GT027ItemCardParams, red: boolean): Box6 {
  const w0 = Math.sin(p.timeMs * 0.0028 + p.slot.index * 0.9) * 0.012;
  const bW = p.isSignaling ? 0 : w0;
  const cW = Math.sin(p.correctPulseProgress * Math.PI) * 0.05;
  const sc = red ? 1 : ([1 + bW, 1.03, 1 + cW, 1][ST_K.indexOf(p.state)] ?? 1);
  const sw = Math.sin(p.timeMs * 0.045) * 4 * p.wrongIntensity;
  const cx = p.slot.x + (p.state === "wrong" && !red ? sw : 0);
  const cy = p.slot.y + (p.state === "hovered" && !red ? -3 : 0);
  const [w, h] = [p.slot.w * sc, p.slot.h * sc];
  return [cx, cy, w, h, cx - w / 2, cy - h / 2];
}
function drawCardInner(g: Ctx, rs: RenderSystem, p: GT027ItemCardParams) {
  const [cx, cy, w, h] = cardBox(p, rs.reducedMotion);
  const ref = p.asset.kind === "emoji" ? p.asset.ref.trim() : "";
  const [fill, rim] = resolveAttrColor(p.color);
  const szRatio = SZ_V[SZ_K.indexOf(p.size ?? "")] ?? 0.8;
  const [sb, rad] = [p.stageRect, Math.max(6, Math.min(w, h) * 0.38 * szRatio)];
  const bad = !ref || BROKEN_RE.test(ref);
  if (bad || GEO.has(p.shape.toLowerCase())) {
    st(g, bad ? fill : alpha(fill, 0.24), bad ? rim : alpha(rim, 0.85), 2);
    drawPoly(g, clampArc(cx, cy, rad, sb), p.shape, sb);
  } else {
    st(g, fill, rim, 1.5);
    circ(g, clampArc(cx - w / 2 + 11, cy - h / 2 + 11, 5.5, sb), true);
  }
  if (!bad) {
    const gS = p.size ? Math.min(0.84, szRatio * 0.88) : 0.72;
    const [iw, ih] = [cl(w * gS, 14, p.slot.w), cl(h * gS, 14, p.slot.h)];
    const inner: Slot = { ...p.slot, x: cx, y: cy, w: iw, h: ih };
    const item = { id: p.itemId, asset: p.asset, state: "idle" as const };
    drawSlotItem(g, rs, inner, item, "square");
  }
}
function drawCorrectBadge(g: Ctx, rs: RenderSystem, p: GT027ItemCardParams) {
  const [, , w, h, x0, y0] = cardBox(p, rs.reducedMotion);
  const [sb, r0] = [p.stageRect, Math.max(7, Math.min(w, h) * 0.14)];
  const [bx, by, r] = clampArc(x0 + w - 10, y0 + 10, r0, sb);
  st(g, cG, cGL, 1.6);
  circ(g, [bx, by, r], true);
  st(g, m.paper, m.paper, 1.8);
  g.beginPath();
  g.moveTo(bx - r * 0.42, by + r * 0.02);
  g.lineTo(bx - r * 0.1, by + r * 0.36);
  g.lineTo(bx + r * 0.46, by - r * 0.34);
  g.stroke();
  if (!rs.reducedMotion && p.particlesEnabled && p.correctPulseProgress > 0) {
    st(g, cY, m.amberDark, 1.1);
    const [d, sr] = [(1 - p.correctPulseProgress) * 8, Math.max(2, r * 0.35)];
    for (const a of [2.5, 4.9, 1.9]) {
      const [px, py] = [x0 + 12 + Math.cos(a) * d, y0 + 12 + Math.sin(a) * d];
      circ(g, clampArc(px, py, sr, sb), true);
    }
  }
}
function drawCardFeedback(g: Ctx, rs: RenderSystem, p: GT027ItemCardParams) {
  const [cx, cy, w, h, x0, y0] = cardBox(p, rs.reducedMotion);
  if (p.state === "correct") {
    drawCorrectBadge(g, rs, p);
  }
  if (p.state === "wrong" && p.wrongIntensity > 0) {
    const rArc = clampArc(cx, cy, Math.max(w, h) * 0.48, p.stageRect);
    rs.drawRetryRing(g, rArc[0], rArc[1], rArc[2], p.wrongIntensity);
  }
  const h2 = p.hintLevel === 2 && p.isHintSample;
  if (h2 || (p.hintLevel === 3 && p.isHintTarget)) {
    st(g, alpha(m.amberGlow, 0.12), p.hintLevel === 3 ? cG : cY, 2.6);
    rBox(g, [x0 - 2, y0 - 2, w + 4, h + 4], 20, p.stageRect, true, 0);
  }
}
function drawGT027ItemCard(g: Ctx, rs: RenderSystem, p: GT027ItemCardParams) {
  const [, , w, h, x0, y0] = cardBox(p, rs.reducedMotion);
  g.save();
  g.globalAlpha = p.isSignaling && p.state === "idle" ? 0.76 : 1;
  st(g, m.woodBorder, m.woodBorder, 1);
  rBox(g, [x0, y0 + 3, w, h], 18, p.stageRect, false, 0);
  const sIdx = ST_K.indexOf(p.state);
  const brd = p.revealCorrect ? cG : (ST_BR[sIdx] ?? m.woodBevel);
  st(g, ST_BG[sIdx] ?? m.paper, brd, p.state === "idle" ? 2.2 : 3);
  const hasSh = rs.softShadowsEnabled && (p.softShadowsEnabled ?? true);
  rBox(g, [x0, y0, w, h], 18, p.stageRect, true, hasSh ? 6 : 0);
  drawCardInner(g, rs, p);
  drawCardFeedback(g, rs, p);
  g.restore();
}

export { drawGT027ItemCard, drawRuleBanner as drawGT027RuleBanner };
