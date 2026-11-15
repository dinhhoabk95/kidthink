import type { Slot } from "#src/layout/types";
import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";
import {
  clampRetryRadiusToStage,
  type GT012OptionTokenProps as OptProps,
  type GT012OptionVisualState as OptState,
  type GT012StagePhase as StagePhase,
} from "#src/templates/GT-012/zone-layout";
import { alpha } from "./color-utils.js";
import {
  applyCanvasFontAtSize,
  canvasFontPx,
  legibleFontPx,
  spaceOf,
} from "./type-scale.js";

type Ctx = CanvasRenderingContext2D;
type Fill = string | CanvasGradient;
type RS = RenderSystem;
export interface PlayOpts {
  readonly touching: boolean;
  readonly breath01: number;
  readonly degraded?: boolean;
}
export interface ReplayOpts {
  readonly touching: boolean;
  readonly emphasized: boolean;
  readonly pulse01: number;
  readonly degraded?: boolean;
}

const COLORS = designTokens.colors;
const WOOD = COLORS.montessori;
const OK_500 = COLORS.semantic.success[500];
const OK_600 = COLORS.semantic.success[600];

function fillDisk(
  c: Ctx,
  cx: number,
  cy: number,
  r: number,
  f: Fill,
  shadow = false
): void {
  if (shadow) {
    c.save();
    c.shadowColor = alpha(WOOD.woodBorder, 0.22);
    c.shadowBlur = 8;
    c.shadowOffsetY = 3;
  }
  c.beginPath();
  c.arc(cx, cy, r, 0, Math.PI * 2);
  c.fillStyle = f;
  c.fill();
  if (shadow) {
    c.restore();
  }
}
function strokeDisk(
  c: Ctx,
  cx: number,
  cy: number,
  r: number,
  col: string,
  lw: number
): void {
  c.beginPath();
  c.arc(cx, cy, r, 0, Math.PI * 2);
  c.strokeStyle = col;
  c.lineWidth = lw;
  c.stroke();
}

export function drawGT012StageMat(
  c: Ctx,
  rs: RS,
  plate: Slot,
  phase: StagePhase,
  pulse01: number,
  degraded: boolean
): void {
  const r = Math.max(16, Math.min(plate.w, plate.h) / 2 - 4);
  const pulse = rs.reducedMotion ? 0.5 : pulse01;
  c.save();
  strokeDisk(c, plate.x, plate.y, r, WOOD.woodBevel, 5);
  if (!degraded) {
    c.setLineDash([6, 5]);
    strokeDisk(c, plate.x, plate.y, Math.max(12, r - 3), WOOD.woodBorder, 1.8);
    c.setLineDash([]);
  }
  if (phase === "awaiting_start") {
    const col = alpha(WOOD.amberLight, 0.45 + 0.25 * pulse);
    strokeDisk(c, plate.x, plate.y, r, col, 8);
  } else if (phase === "flashing") {
    strokeDisk(c, plate.x, plate.y, r, alpha(WOOD.amberGlow, 0.68), 7);
  } else if (phase === "reveal_win") {
    strokeDisk(c, plate.x, plate.y, r, alpha(WOOD.emeraldLight, 0.55), 8);
  } else if (phase === "reveal_closed") {
    strokeDisk(c, plate.x, plate.y, r, alpha(WOOD.plateEdge, 0.58), 6);
  }
  c.restore();
}

export function drawGT012PlayMedallion(
  c: Ctx,
  rs: RS,
  plate: Slot,
  opts: PlayOpts
): void {
  const breath = rs.reducedMotion ? 0 : opts.breath01;
  const scale = opts.touching ? 0.95 : 1 + 0.035 * breath;
  const baseR = Math.max(18, Math.min(30, Math.min(plate.w, plate.h) * 0.16));
  const r = baseR * scale;
  const slab = opts.touching ? 2 : 5.5;
  const [cx, cy] = [plate.x, plate.y + (opts.touching ? 3 : 0)];
  const shadow = rs.softShadowsEnabled && !opts.degraded;
  c.save();
  fillDisk(c, cx, cy, r + 5, alpha(WOOD.amberLight, 0.42 + 0.18 * breath));
  fillDisk(c, cx, cy + slab, r, WOOD.amberDark, shadow);
  const grad = c.createLinearGradient(cx, cy - r, cx, cy + r);
  grad.addColorStop(0, WOOD.amberLight);
  grad.addColorStop(1, WOOD.amber);
  fillDisk(c, cx, cy, r, grad);
  strokeDisk(c, cx, cy, r, WOOD.amberDark, 2.6);
  strokeDisk(c, cx, cy, Math.max(8, r - 3.5), COLORS.surface[0], 1.6);
  fillDisk(
    c,
    cx - r * 0.32,
    cy - r * 0.34,
    Math.max(2.5, r * 0.16),
    alpha(COLORS.surface[0], 0.72)
  );
  const [tx, tw, th] = [cx + r * 0.08, r * 0.42, r * 0.46];
  c.beginPath();
  c.moveTo(tx - tw * 0.72, cy - th);
  c.lineTo(tx + tw * 0.92, cy);
  c.lineTo(tx - tw * 0.72, cy + th);
  c.closePath();
  c.lineJoin = "round";
  c.fillStyle = COLORS.surface[0];
  c.fill();
  c.strokeStyle = WOOD.amberDark;
  c.lineWidth = 1.6;
  c.stroke();
  c.restore();
}

export function drawGT012ReplayMedallion(
  c: Ctx,
  rs: RS,
  plate: Slot,
  opts: ReplayOpts
): void {
  const pulse = rs.reducedMotion ? 0.5 : opts.pulse01;
  const baseR = Math.max(15, Math.min(24, Math.min(plate.w, plate.h) * 0.135));
  const r = baseR * (opts.touching ? 0.95 : 1);
  const slab = opts.touching ? 1.5 : 4;
  const [cx, cy] = [plate.x, plate.y + (opts.touching ? 2.5 : 0)];
  const shadow = rs.softShadowsEnabled && !opts.degraded;
  c.save();
  if (opts.emphasized) {
    fillDisk(c, cx, cy, r + 5, alpha(WOOD.amberLight, 0.5 + 0.25 * pulse));
  }
  fillDisk(c, cx, cy + slab, r, WOOD.woodBorder, shadow);
  fillDisk(c, cx, cy, r, opts.emphasized ? WOOD.amberLight : WOOD.paper);
  const rimCol = opts.emphasized ? WOOD.amber : WOOD.woodBorder;
  strokeDisk(c, cx, cy, r, rimCol, opts.emphasized ? 3.2 : 2.2);
  strokeDisk(c, cx, cy, Math.max(6, r - 3), WOOD.woodBevel, 1.3);
  const ar = r * 0.46;
  const endAng = Math.PI * 0.72;
  c.beginPath();
  c.arc(cx, cy, ar, -Math.PI * 0.68, endAng, false);
  c.lineCap = "round";
  c.strokeStyle = WOOD.amberDark;
  c.lineWidth = 2.8;
  c.stroke();
  const [ax, ay] = [cx + Math.cos(endAng) * ar, cy + Math.sin(endAng) * ar];
  const head = Math.max(4, r * 0.24);
  c.beginPath();
  c.moveTo(ax - head * 0.2, ay - head * 0.95);
  c.lineTo(ax, ay);
  c.lineTo(ax + head * 0.95, ay + head * 0.15);
  c.lineJoin = "round";
  c.stroke();
  c.restore();
}

const OPT_PAL: Record<OptState, readonly [string, string, string, number]> = {
  idle: [WOOD.paper, WOOD.woodBorder, WOOD.woodBevel, 2.6],
  touching: [COLORS.surface[0], COLORS.brand[500], WOOD.woodBorder, 3.4],
  selected: [WOOD.amberLight, COLORS.brand[500], WOOD.amberDark, 3.6],
  correct: [COLORS.semantic.success[50], OK_600, OK_500, 3.8],
  wrong: [WOOD.amberLight, WOOD.amberDark, WOOD.amber, 3.4],
};
const STATE_DY: Record<OptState, number> = {
  idle: 0,
  touching: 2.2,
  selected: -1.8,
  correct: -1.8,
  wrong: 0,
};

function resolveOptionTransform(
  props: OptProps,
  reducedMotion: boolean
): { scale: number; shake: number; dy: number; slab: number } {
  let scale = 1;
  if (props.state === "touching") {
    scale = 0.96;
  } else if (props.state === "selected") {
    scale = 1.03;
  } else if (props.state === "correct" && !reducedMotion) {
    scale = 1 + Math.sin(props.winPop01 * Math.PI) * 0.06;
  }
  const canShake =
    props.state === "wrong" && props.wrongProgress !== null && !reducedMotion;
  const prog = props.wrongProgress ?? 0;
  const shake = canShake ? Math.sin(prog * Math.PI * 6) * (1 - prog) * 3.5 : 0;
  const slab = props.state === "touching" || props.dimmed ? 1.5 : 3.5;
  return { scale, shake, dy: STATE_DY[props.state], slab };
}

function drawCorrectExtras(
  c: Ctx,
  rs: RS,
  cx: number,
  cy: number,
  r: number,
  degraded: boolean
): void {
  const [bx, by, br] = [cx + r * 0.62, cy - r * 0.62, Math.max(6.5, r * 0.28)];
  fillDisk(c, bx, by, br, OK_500);
  strokeDisk(c, bx, by, br, COLORS.surface[0], 1.6);
  c.beginPath();
  c.moveTo(bx - br * 0.42, by + 0.2);
  c.lineTo(bx - br * 0.1, by + br * 0.36);
  c.lineTo(bx + br * 0.46, by - br * 0.34);
  c.lineCap = "round";
  c.lineJoin = "round";
  c.strokeStyle = COLORS.surface[0];
  c.lineWidth = 1.8;
  c.stroke();
  if (!(rs.reducedMotion || degraded)) {
    for (const [ox, oy] of [
      [-0.74, -0.58],
      [0.74, 0.56],
      [-0.72, 0.58],
    ] as const) {
      fillDisk(c, cx + r * ox, cy + r * oy, 2.2, WOOD.amber);
    }
  }
}

export function drawGT012OptionToken(
  c: Ctx,
  rs: RS,
  s: Slot,
  props: OptProps
): void {
  const maxR = Math.max(14, Math.min(s.w, s.h) / 2 - 4);
  const tf = resolveOptionTransform(props, rs.reducedMotion);
  const r = Math.min(maxR - 0.5, Math.max(11, (maxR - 2.5) * tf.scale));
  const [cx, cy] = [s.x + tf.shake, s.y + tf.dy];
  const [fill, rim, bev, lw] = OPT_PAL[props.state];
  const isDimmedIdle = props.dimmed && props.state === "idle";
  const shadow = rs.softShadowsEnabled && !(props.degraded || isDimmedIdle);
  c.save();
  if (isDimmedIdle) {
    c.globalAlpha = 0.42;
  }
  fillDisk(c, cx, cy + tf.slab, r, bev, shadow);
  fillDisk(c, cx, cy, r, fill);
  if (isDimmedIdle) {
    c.setLineDash([5, 4]);
  }
  strokeDisk(c, cx, cy, r, rim, lw);
  c.setLineDash([]);
  if (props.state !== "idle") {
    const inCol = props.state === "wrong" ? WOOD.amber : alpha(rim, 0.55);
    strokeDisk(c, cx, cy, Math.max(6, r - 4), inCol, 1.5);
  }
  const { space, scale: fScale } = spaceOf(rs);
  const fPx = canvasFontPx(space, "number", fScale);
  const px = legibleFontPx(Math.min(Math.floor(r * 0.92), fPx), fScale);
  applyCanvasFontAtSize(c, px, "heading", "bold");
  c.fillStyle = COLORS.surface[800];
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText(String(props.value), cx, cy, r * 1.6);
  if (props.state === "correct") {
    drawCorrectExtras(c, rs, cx, cy, r, props.degraded);
  }
  if (props.state === "wrong" && props.wrongProgress !== null) {
    const ringR = clampRetryRadiusToStage(s, props.stageRect);
    const prog = rs.reducedMotion ? 0.25 : props.wrongProgress;
    rs.drawRetryRing(c, cx, cy, ringR, prog);
  }
  c.restore();
}
