import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";
import { alpha } from "./color-utils.js";
import {
  drawTrafficLight as dLight,
  trafficLightBox as tBox,
  trafficStimulusSlot as tStim,
} from "./container-shapes.js";
import {
  drawGlyphInSlot as dG,
  drawTextInSlot as dT,
  resolveEmojiGlyph as rE,
} from "./shared-render.js";
import type * as T from "./types.js";

const C = designTokens.colors;
const [m, sc, TAU] = [C.montessori, C.semantic.success, Math.PI * 2];
const [EMOJI_RE, LETTER_RE] = [/^EMJ-[a-z0-9-]+$/i, /\p{L}/u];
type Ctx = CanvasRenderingContext2D;
type RS = RenderSystem;
type HS = T.GT026HeaderSpec;
type WF = T.GT026WindowFrameSpec;
type SP = T.GT026StimulusPodSpec;
type PA = T.GT026StopPadSpec;
type OF = T.GT026OutcomeFeedbackSpec;
type SB = T.SceneBox;
type Arc3 = readonly [number, number, number];
type Box4 = readonly [number, number, number, number];
const cl = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
function st(ctx: Ctx, fill: string, stroke: string, lw: number): void {
  [ctx.fillStyle, ctx.strokeStyle, ctx.lineWidth] = [fill, stroke, lw];
}
function clampBox(bx: Box4, b?: SB): Box4 {
  const x0 = b ? Math.max(b.x + 2, bx[0]) : bx[0];
  const y0 = b ? Math.max(b.y + 2, bx[1]) : bx[1];
  const x1 = b ? Math.min(b.x + b.w - 2, bx[0] + bx[2]) : bx[0] + bx[2];
  const y1 = b ? Math.min(b.y + b.h - 2, bx[1] + bx[3]) : bx[1] + bx[3];
  return [x0, y0, Math.max(2, x1 - x0), Math.max(2, y1 - y0)];
}
function clampArc(cx: number, cy: number, r: number, b?: SB): Arc3 {
  const sx = b ? cl(cx, b.x + 2, b.x + b.w - 2) : cx;
  const sy = b ? cl(cy, b.y + 2, b.y + b.h - 2) : cy;
  const rx = b ? Math.min(sx - b.x - 2, b.x + b.w - 2 - sx) : r;
  const ry = b ? Math.min(sy - b.y - 2, b.y + b.h - 2 - sy) : r;
  return [sx, sy, Math.max(1, Math.min(r, rx, ry))];
}
function rBox(ctx: Ctx, bx: Box4, r: number, b?: SB, s = true, sh = 0): void {
  const cb = clampBox(bx, b);
  const rad = cl(r, 2, Math.min(cb[2], cb[3]) / 2);
  ctx.beginPath();
  ctx.roundRect(cb[0], cb[1], cb[2], cb[3], rad);
  ctx.save();
  ctx.shadowColor = alpha(m.woodBorder, 0.2);
  [ctx.shadowBlur, ctx.shadowOffsetY] = [sh, sh > 5 ? 3 : sh / 3];
  ctx.fill();
  ctx.restore();
  ctx[s ? "stroke" : "fill"]();
}
function circ(ctx: Ctx, c: Arc3, stroke = true): void {
  ctx.beginPath();
  ctx.arc(c[0], c[1], c[2], 0, TAU);
  ctx.fill();
  ctx[stroke ? "stroke" : "fill"]();
}
function drawFallbackShape(ctx: Ctx, c: Arc3, k: "go" | "nogo"): void {
  const [cx, cy, r] = c;
  const [n, a0] = k === "go" ? [10, -Math.PI / 2] : [8, Math.PI / 8];
  const [f, s] = k === "go" ? [sc[500], m.emerald] : [m.amber, m.amberDark];
  ctx.save();
  st(ctx, f, s, 2.2);
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const ang = (i * TAU) / n + a0;
    const d = r * (k === "go" && i % 2 === 1 ? 0.36 : 0.76);
    const [px, py] = [cx + Math.cos(ang) * d, cy + Math.sin(ang) * d];
    ctx[i === 0 ? "moveTo" : "lineTo"](px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
type SGArgs = readonly [Arc3, T.RenderAsset, "go" | "nogo", number];
function drawStimulusGlyph(ctx: Ctx, [c, a, k, scVal]: SGArgs): void {
  const [x, y, r] = c;
  const [d, role] = [Math.max(4, r * 2), "source" as const];
  const slot = { index: 0, page: 0, role, x, y, w: d, h: d, hitW: d, hitH: d };
  const g = a.kind === "emoji" && a.ref.trim() ? rE(a.ref.trim()) : null;
  if (g && !EMOJI_RE.test(g)) {
    dG(ctx, g, slot, scVal);
    return;
  }
  const txt = a.kind === "text" ? a.text.trim() : "";
  if (txt.length > 0 && !LETTER_RE.test(txt) && !EMOJI_RE.test(txt)) {
    dT(ctx, txt, slot, C.surface[900]);
    return;
  }
  drawFallbackShape(ctx, c, k);
}
function drawRuleIcon(ctx: Ctx, c: Arc3, k: "go" | "nogo"): void {
  const [cx, cy, r] = c;
  const [f, s] = k === "go" ? [sc[500], m.emerald] : [m.amber, m.amberDark];
  ctx.save();
  [ctx.lineCap, ctx.lineJoin] = ["round", "round"];
  st(ctx, f, s, 1.8);
  circ(ctx, c, true);
  if (k === "nogo") {
    drawStimulusGlyph(ctx, [c, { kind: "emoji", ref: "✋" }, "nogo", 0.78]);
    ctx.restore();
    return;
  }
  st(ctx, C.surface[0], C.surface[0], 2);
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.36, cy);
  ctx.lineTo(cx + r * 0.36, cy);
  ctx.moveTo(cx + r * 0.04, cy - r * 0.3);
  ctx.lineTo(cx + r * 0.36, cy);
  ctx.lineTo(cx + r * 0.04, cy + r * 0.3);
  ctx.stroke();
  ctx.restore();
}
type RCArgs = readonly [Box4, T.RenderAsset, "go" | "nogo", boolean, SB?];
function drawRuleCard(ctx: Ctx, [bx, a, k, isLit, sb]: RCArgs): void {
  const cb = clampBox(bx, sb);
  const [lit, br] =
    k === "go" ? [sc[100], sc[500]] : [m.amberGlow, m.amberDark];
  st(ctx, isLit ? lit : C.surface[0], br, isLit ? 3 : 2);
  rBox(ctx, cb, 10, sb, true);
  const r = Math.max(4, Math.min(cb[3] * 0.38, cb[2] * 0.22));
  const cy = cb[1] + cb[3] / 2;
  const gc = clampArc(cb[0] + cb[2] * 0.33, cy, r, sb);
  drawStimulusGlyph(ctx, [gc, a, k, 0.9]);
  drawRuleIcon(ctx, clampArc(cb[0] + cb[2] * 0.74, cy, r * 0.72, sb), k);
}
function drawDot(ctx: Ctx, c: Arc3, d: T.GT026DotStatus, won: boolean): void {
  if (d === "correct" || won) {
    st(ctx, sc[500], m.emerald, 1.8);
    circ(ctx, c, true);
    if (c[2] >= 5) {
      st(ctx, C.surface[0], C.surface[0], 1.6);
      ctx.beginPath();
      ctx.moveTo(c[0] - c[2] * 0.4, c[1]);
      ctx.lineTo(c[0] - c[2] * 0.08, c[1] + c[2] * 0.32);
      ctx.lineTo(c[0] + c[2] * 0.42, c[1] - c[2] * 0.3);
      ctx.stroke();
    }
    return;
  }
  const f = d === "passed" ? m.amberLight : m.woodTrayHigh;
  const s = d === "passed" ? m.amberDark : m.woodBorder;
  const cur = d === "current";
  st(ctx, cur ? m.amberGlow : f, cur ? m.amber : s, cur ? 2.2 : 1.5);
  circ(ctx, c, true);
}
export function drawGT026StageHeader(ctx: Ctx, rs: RS, p: HS): void {
  const { rect: r, stageBounds: sb, highlightedRule: hr } = p;
  const sh = rs.softShadowsEnabled && !p.disableShadows ? 6 : 0;
  ctx.save();
  st(ctx, m.woodTray, m.woodBorder, 2.2);
  rBox(ctx, [r.x, r.y, r.w, r.h], 14, sb, true, sh);
  const [cw, pad, ry] = [cl(Math.round(r.w * 0.24), 56, 112), 5, r.y + 5];
  const [ch, rx] = [Math.max(16, r.h - 10), r.x + r.w - pad];
  const bGo: Box4 = [r.x + pad, ry, cw, ch];
  const bNo: Box4 = [rx - cw, ry, cw, ch];
  drawRuleCard(ctx, [bGo, p.goAsset, "go", hr === "go", sb]);
  drawRuleCard(ctx, [bNo, p.nogoAsset, "nogo", hr === "nogo", sb]);
  const [dx, dw] = [r.x + pad + cw + 6, Math.max(24, r.w - (pad + cw + 6) * 2)];
  const cb = clampBox([dx, ry, dw, ch], sb);
  const [n, cy] = [Math.max(1, p.dots.length), cb[1] + cb[3] / 2];
  const step = cb[2] / n;
  const br = cl(Math.min(step * 0.34, cb[3] * 0.28), 3, 9);
  const wave = p.isWon && !rs.reducedMotion;
  p.dots.forEach((d, i) => {
    const wy = wave ? Math.sin(p.timeMs * 0.008 + i * 0.5) * 1.5 : 0;
    const dc = clampArc(cb[0] + (i + 0.5) * step, cy + wy, br, sb);
    drawDot(ctx, dc, d, p.isWon);
  });
  ctx.restore();
}
export function drawGT026WindowFrame(ctx: Ctx, rs: RS, p: WF): void {
  const { rect: r, stageBounds: sb } = p;
  const sh = rs.softShadowsEnabled && !p.disableShadows ? 8 : 0;
  ctx.save();
  st(ctx, m.woodBevel, m.woodBorder, 2.6);
  rBox(ctx, [r.x, r.y, r.w, r.h], 18, sb, true, sh);
  st(ctx, p.isWon ? sc[50] : m.paper, p.isWon ? sc[500] : m.woodBorder, 1.8);
  rBox(ctx, [r.x + 5, r.y + 5, r.w - 10, r.h - 10], 14, sb, true);
  if (p.showTimerBar) {
    const ratio = rs.reducedMotion ? 0.65 : cl(p.remainingRatio, 0, 1);
    const [bw, bx, by] = [Math.max(16, r.w - 20), r.x + 10, r.y + r.h - 14];
    st(ctx, m.woodTrayHigh, m.woodBorder, 1);
    rBox(ctx, [bx, by, bw, 6], 3, sb, true);
    st(ctx, ratio > 0.35 ? sc[500] : m.amber, m.woodBorder, 1);
    rBox(ctx, [bx, by, Math.max(4, Math.round(bw * ratio)), 6], 3, sb, false);
  }
  if (p.isWaitingForStart && p.startSlot) {
    const s = p.startSlot;
    const pulse = rs.reducedMotion ? 1 : 1 + Math.sin(p.timeMs * 0.005) * 0.04;
    const rad = Math.min(s.w, s.h) * 0.38 * pulse;
    const c = clampArc(s.x, s.y + (p.isStartHovered ? 1 : 0), rad, sb);
    st(ctx, m.emerald, m.woodBorder, 2);
    circ(ctx, clampArc(c[0], c[1] + 2.5, c[2], sb), false);
    st(ctx, sc[500], C.surface[0], 2.8);
    circ(ctx, c, true);
    const tr = c[2] * 0.42;
    st(ctx, C.surface[0], C.surface[0], 2);
    ctx.beginPath();
    ctx.moveTo(c[0] - tr * 0.55, c[1] - tr * 0.75);
    ctx.lineTo(c[0] + tr * 0.85, c[1]);
    ctx.lineTo(c[0] - tr * 0.55, c[1] + tr * 0.75);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}
function podStyle(p: SP): readonly [string, string, number] {
  if (p.wrongProgress !== null) {
    return [m.amberLight, m.amber, 3.2];
  }
  if (p.isHovered || p.isHinted) {
    return [p.isHovered ? sc[50] : C.surface[0], sc[500], 3.2];
  }
  return [C.surface[0], m.woodBorder, 2.4];
}
export function drawGT026StimulusPod(ctx: Ctx, rs: RS, p: SP): void {
  const { slot: s, stageBounds: sb } = p;
  const rSlot = p.shakeX === 0 ? s : { ...s, x: s.x + p.shakeX };
  ctx.save();
  const ex = p.exit;
  if (ex) {
    const tail =
      ex.kind === "shake"
        ? Math.max(0, (ex.progress - 0.6) / 0.4)
        : ex.progress;
    ctx.globalAlpha = Math.max(0, 1 - tail);
  } else {
    dLight(ctx, tBox(rSlot), p.kind === "go" ? "green" : "red", p.glow);
  }
  const stim = tStim(rSlot);
  const noPulse = rs.reducedMotion || p.wrongProgress !== null || Boolean(ex);
  const br = noPulse ? 1 : 1 + Math.sin(p.timeMs * 0.004) * 0.025;
  const pop =
    ex?.kind === "pop" && !rs.reducedMotion
      ? 1 + Math.sin(ex.progress * Math.PI) * 0.2
      : 1;
  const r = Math.min(stim.w, stim.h) * 0.43 * (p.isHovered ? 1.04 : br) * pop;
  const c = clampArc(stim.x, stim.y + (p.isHovered ? 1.5 : 0), r, sb);
  st(ctx, m.woodBorder, m.woodBorder, 1.5);
  circ(ctx, clampArc(c[0], c[1] + (p.isHovered ? 1.5 : 3), c[2], sb), false);
  const [fill, border, lw] = podStyle(p);
  st(ctx, fill, border, lw);
  ctx.setLineDash(p.wrongProgress !== null || p.isHinted ? [6, 4] : []);
  circ(ctx, c, true);
  ctx.setLineDash([]);
  drawStimulusGlyph(ctx, [c, p.asset, p.kind, p.isHovered ? 1.05 : 1]);
  if (p.wrongProgress !== null) {
    const rr = Math.max(8, c[2] * 0.88);
    rs.drawRetryRing(ctx, c[0], c[1], rr, p.wrongProgress);
  }
  ctx.restore();
}
export function drawGT026StopPad(ctx: Ctx, rs: RS, p: PA): void {
  const { slot: s, stageBounds: sb } = p;
  const wave = !rs.reducedMotion && p.isHinted;
  const pulse = wave ? 1 + Math.sin(p.timeMs * 0.006) * 0.04 : 1;
  const rad = Math.min(s.w, s.h) * 0.43 * pulse;
  const c = clampArc(s.x, s.y + (p.isHovered ? 1.5 : 0), rad, sb);
  ctx.save();
  st(ctx, m.amberDark, m.amberDark, 1.5);
  circ(ctx, clampArc(c[0], c[1] + (p.isHovered ? 1.2 : 2.8), c[2], sb), false);
  const f = p.isHovered ? m.amberGlow : m.amberLight;
  const b = p.isHinted ? m.amber : m.amberDark;
  st(ctx, f, b, p.isHinted || p.isHovered ? 3.2 : 2.4);
  circ(ctx, c, true);
  drawStimulusGlyph(ctx, [c, p.asset, "nogo", 0.92]);
  ctx.restore();
}
export function drawGT026OutcomeFeedback(ctx: Ctx, rs: RS, p: OF): void {
  const { center: pt, stageBounds: sb, progress: t } = p;
  const c = clampArc(pt.x, pt.y, 26, sb);
  ctx.save();
  if (p.kind === "retry") {
    rs.drawRetryRing(ctx, c[0], c[1], Math.max(10, c[2]), cl(t, 0, 1));
    ctx.restore();
    return;
  }
  const a = cl(1 - t, 0, 1);
  if (p.kind === "correct_rejection") {
    const sr =
      c[2] * (rs.reducedMotion ? 0.92 : 0.85 + 0.15 * Math.sin(t * Math.PI));
    const scArc = clampArc(c[0], c[1], sr, sb);
    st(ctx, alpha(sc[100], a * 0.9), alpha(sc[500], a), 2.6);
    circ(ctx, scArc, true);
    drawRuleIcon(ctx, clampArc(c[0], c[1], scArc[2] * 0.58, sb), "nogo");
  } else {
    const hr = c[2] * (rs.reducedMotion ? 0.85 : 0.6 + t * 0.4);
    st(ctx, alpha(sc[100], a * 0.4), alpha(sc[500], a), 2.4);
    circ(ctx, clampArc(c[0], c[1], hr, sb), true);
    if (!(rs.reducedMotion || p.disableParticles)) {
      ctx.fillStyle = alpha(m.amber, a);
      for (let i = 0; i < 6; i++) {
        const [ang, d] = [(i * TAU) / 6, c[2] * (0.55 + t * 0.35)];
        const [px, py] = [c[0] + Math.cos(ang) * d, c[1] + Math.sin(ang) * d];
        circ(ctx, clampArc(px, py, 2.2, sb), false);
      }
    }
  }
  ctx.restore();
}
