import type { ZoneRect } from "#src/layout/stage-zones";
import { alpha } from "#src/render/color-utils";
import type { SceneBox } from "#src/render/types";
import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";

type Canvas2D = CanvasRenderingContext2D;
type Rect4 = readonly [number, number, number, number];
export type GT032VisualState =
  | "idle"
  | "hovered"
  | "selected"
  | "wrong"
  | "hint"
  | "correct";
export type GT032ShapeKind =
  | "standard"
  | "narrow_tall"
  | "wide_short"
  | "fluted";
export type GT032QuestionKind = "more" | "less" | "same" | "pour_to_mark";

export interface GT032WaterBenchParams {
  readonly cupRects: readonly SceneBox[];
  readonly isRoundClosed: boolean;
  readonly isWon: boolean;
  readonly softShadowsEnabled: boolean;
  readonly stageZone: ZoneRect;
}
export interface GT032QuestionBadgeParams {
  readonly benchTopY: number;
  readonly elapsedMs: number;
  readonly questionType: GT032QuestionKind;
  readonly reducedMotion: boolean;
  readonly stageZone: ZoneRect;
}
export interface GT032CupOverlayParams {
  readonly capacityUnits: number;
  readonly elapsedMs: number;
  readonly fillUnits: number;
  readonly isRoundClosed: boolean;
  readonly rect: SceneBox;
  readonly reducedMotion: boolean;
  readonly shape: GT032ShapeKind;
  readonly showRipple: boolean;
  readonly showTargetMark: boolean;
  readonly stageZone: ZoneRect;
  readonly state: GT032VisualState;
  readonly targetUnits: number | null;
  readonly wrongProgress: number | null;
}
export interface GT032HintRegionParams {
  readonly cupRects: readonly SceneBox[];
  readonly elapsedMs: number;
  readonly level: 1 | 2;
  readonly reducedMotion: boolean;
  readonly stageZone: ZoneRect;
}

const WOOD = designTokens.colors.montessori;
const SCENE = designTokens.colors.scene;
const WHITE = designTokens.colors.surface[0];
const BADGE_SPEC = {
  more: [SCENE.sky[100], SCENE.blue[500], 0.8, 0.35],
  less: [WOOD.emeraldLight, WOOD.emerald, 0.3, 0.78],
  same: [WOOD.amberLight, WOOD.woodBorder, 0.65, 0.65],
  pour_to_mark: [SCENE.sky[100], SCENE.blue[500], 0.45, 0.75],
} as const;
const GLOW: Record<GT032VisualState, string> = {
  idle: SCENE.blue[500],
  hovered: SCENE.blue[500],
  selected: WOOD.indigo,
  correct: WOOD.emerald,
  wrong: designTokens.colors.semantic.warning[500],
  hint: WOOD.amber,
};

const clamp = (v: number, lo: number, hi: number): number =>
  Math.max(lo, Math.min(hi, v));

function clampBox(b: Rect4, z: ZoneRect): Rect4 {
  const cx = clamp(b[0], z.x + 2, z.x + z.w - 6);
  const cy = clamp(b[1], z.y + 2, z.y + z.h - 6);
  return [
    cx,
    cy,
    Math.min(b[2], z.x + z.w - 2 - cx),
    Math.min(b[3], z.y + z.h - 2 - cy),
  ];
}

function drawBox(
  ctx: Canvas2D,
  b: Rect4,
  r: number,
  color: string | CanvasGradient,
  lw = 0
): void {
  ctx.beginPath();
  ctx.roundRect(b[0], b[1], b[2], b[3], r);
  if (lw > 0 && typeof color === "string") {
    ctx.lineWidth = lw;
    ctx.strokeStyle = color;
    ctx.stroke();
    return;
  }
  ctx.fillStyle = color;
  ctx.fill();
}

function dot(
  ctx: Canvas2D,
  x: number,
  y: number,
  r: number,
  color: string
): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

export function computeGT032WaterLevel(
  shape: GT032ShapeKind,
  ratio: number
): number {
  const c = clamp(ratio, 0, 1);
  return shape === "fluted" ? (Math.sqrt(0.49 + 1.2 * c) - 0.7) / 0.6 : c;
}

export function withGT032StageClip(
  ctx: Canvas2D,
  z: ZoneRect,
  drawFn: () => void
): void {
  if (typeof ctx.rect !== "function" || typeof ctx.clip !== "function") {
    drawFn();
    return;
  }
  ctx.save();
  ctx.beginPath();
  ctx.rect(z.x, z.y, z.w, z.h);
  ctx.clip();
  drawFn();
  ctx.restore();
}

export function drawGT032WaterBench(
  ctx: Canvas2D,
  _rs: RenderSystem,
  p: GT032WaterBenchParams
): void {
  const z = p.stageZone;
  const bot =
    p.cupRects.length > 0
      ? Math.max(...p.cupRects.map((r) => r.y + r.h))
      : z.y + z.h * 0.72;
  const by = clamp(bot + 6, z.y + 40, z.y + z.h - 44);
  const padX = Math.max(24, z.w * 0.04);
  const bx = z.x + padX;
  const bw = Math.max(120, z.w - padX * 2);
  const bh = Math.max(38, z.y + z.h - by - 8);
  if (p.softShadowsEnabled) {
    drawBox(
      ctx,
      [bx + 4, by + 5, bw - 4, bh - 5],
      14,
      alpha(WOOD.woodBorder, 0.16)
    );
  }
  const grad = ctx.createLinearGradient(bx, by, bx, by + bh);
  grad.addColorStop(0, SCENE.wood.light);
  grad.addColorStop(1, SCENE.wood.warm);
  drawBox(ctx, [bx, by, bw, bh], 14, grad);
  drawBox(ctx, [bx, by, bw, bh], 14, WOOD.woodBorder, 2.5);
  const hiW = Math.max(20, bw - 24);
  drawBox(ctx, [bx + 12, by + 4, hiW, 5], 2.5, alpha(WHITE, 0.38));
}

export function drawGT032QuestionBadge(
  ctx: Canvas2D,
  p: GT032QuestionBadgeParams
): void {
  const [bg, bd, lH, rH] = BADGE_SPEC[p.questionType];
  const z = p.stageZone;
  const x = Math.max(z.x + 8, z.x + z.w - 104);
  const y = clamp(p.benchTopY - 40, z.y + 8, z.y + 12);
  drawBox(ctx, [x + 2, y + 3, 88, 34], 17, alpha(WOOD.woodBorder, 0.16));
  drawBox(ctx, [x, y, 88, 34], 17, bg);
  drawBox(ctx, [x, y, 88, 34], 17, bd, 2);
  for (const [cx, ratio] of [
    [x + 16, lH],
    [x + 58, rH],
  ] as const) {
    drawBox(ctx, [cx, y + 8, 14, 18], 3, WHITE);
    drawBox(ctx, [cx, y + 8, 14, 18], 3, bd, 1.6);
    const fh = Math.max(3, 14 * ratio);
    drawBox(ctx, [cx + 2, y + 24 - fh, 10, fh], 2, SCENE.blue[400]);
  }
  dot(ctx, x + 44, y + 17, 3, bd);
}

function drawCupStateGlow(ctx: Canvas2D, p: GT032CupOverlayParams): void {
  const st = p.state;
  if (st === "idle") {
    return;
  }
  const r = p.rect;
  const pad = st === "selected" || st === "correct" ? 8 : 6;
  const pulse =
    p.reducedMotion || st !== "hint"
      ? 1
      : 0.55 + 0.45 * Math.sin(p.elapsedMs / 240);
  const wob =
    st === "wrong" && p.wrongProgress !== null && !p.reducedMotion
      ? Math.sin(p.wrongProgress * Math.PI * 4) * 3
      : 0;
  const box = clampBox(
    [r.x - pad + wob, r.y - pad, r.w + pad * 2, r.h + pad * 2],
    p.stageZone
  );
  const col = alpha(GLOW[st], st === "wrong" ? 0.9 : 0.85 * pulse);
  ctx.save();
  if (st === "wrong") {
    ctx.setLineDash([7, 5]);
  }
  drawBox(ctx, box, 18, col, st === "selected" || st === "correct" ? 4 : 3);
  ctx.restore();
}

export function drawGT032CupOverlay(
  ctx: Canvas2D,
  rs: RenderSystem,
  p: GT032CupOverlayParams
): void {
  const { rect: r, stageZone: z, capacityUnits: cap, targetUnits: tgt } = p;
  const ratio = cap > 0 ? clamp(p.fillUnits / cap, 0, 1) : 0;
  drawCupStateGlow(ctx, p);
  ctx.save();
  if (p.showRipple && ratio > 0.02) {
    const lv = computeGT032WaterLevel(p.shape, ratio);
    const half = (p.shape === "fluted" ? r.w * (0.7 + 0.6 * lv) : r.w) * 0.5;
    const wave = p.reducedMotion ? 0 : Math.sin(p.elapsedMs / 320) * 1.5;
    const rx = clamp(r.x + r.w / 2 - half * 0.24, z.x + 6, z.x + z.w - 6);
    const ry = clamp(r.y + r.h * (1 - lv) + wave, z.y + 6, z.y + z.h - 6);
    dot(ctx, rx, ry, Math.max(3, half * 0.16), alpha(WHITE, 0.35));
  }
  if (p.showTargetMark && tgt !== null && tgt > 0 && tgt <= cap) {
    const lv = computeGT032WaterLevel(p.shape, tgt / cap);
    const ty = clamp(r.y + r.h * (1 - lv), z.y + 7, z.y + z.h - 7);
    ctx.strokeStyle = WOOD.amber;
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(Math.max(z.x + 2, r.x - 4), ty);
    ctx.lineTo(Math.min(z.x + z.w - 2, r.x + r.w + 4), ty);
    ctx.stroke();
    ctx.setLineDash([]);
    dot(ctx, Math.max(z.x + 7, r.x - 9), ty, 5, WOOD.amber);
  }
  ctx.restore();
  if (p.state === "wrong") {
    rs.drawRetryRing(
      ctx,
      r.x + r.w / 2,
      r.y + r.h / 2,
      Math.max(r.w, r.h) * 0.36,
      p.wrongProgress ?? 0.5
    );
  }
}

export function drawGT032HintRegionOverlay(
  ctx: Canvas2D,
  p: GT032HintRegionParams
): void {
  if (p.cupRects.length === 0) {
    return;
  }
  let [x0, y0, x1, y1] = [1e9, 1e9, -1e9, -1e9];
  for (const r of p.cupRects) {
    x0 = Math.min(x0, r.x - 14);
    y0 = Math.min(y0, r.y - 14);
    x1 = Math.max(x1, r.x + r.w + 14);
    y1 = Math.max(y1, r.y + r.h + 14);
  }
  const pulse = p.reducedMotion ? 1 : 0.65 + 0.35 * Math.sin(p.elapsedMs / 240);
  ctx.save();
  ctx.setLineDash(p.level === 1 ? [8, 6] : []);
  drawBox(
    ctx,
    clampBox([x0, y0, x1 - x0, y1 - y0], p.stageZone),
    20,
    alpha(p.level === 2 ? WOOD.amber : SCENE.blue[500], 0.85 * pulse),
    p.level === 2 ? 3.5 : 2.5
  );
  ctx.restore();
}
