import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";
import { alpha } from "./color-utils.js";

type Canvas2D = CanvasRenderingContext2D;

export interface GT034ConcertRail {
  readonly box: ZoneRect;
  readonly dividersX: readonly number[];
}

export interface GT034ConcertStageParams {
  readonly allStepsBounds: ZoneRect;
  readonly dockBounds: ZoneRect | null;
  readonly elapsedMs: number;
  readonly replayLimit: number;
  readonly replaysUsed: number;
  readonly rowRails: readonly GT034ConcertRail[];
  readonly stageBounds: ZoneRect;
  readonly wrongKind: "content" | "timing" | null;
  readonly wrongProgress: number | null;
}

export interface GT034SlotFeedbackParams {
  readonly isLastFilled: boolean;
  readonly isStep: boolean;
  readonly particlesEnabled: boolean;
  readonly slot: Slot;
  readonly stageBounds: ZoneRect;
  readonly state: "idle" | "hovered" | "selected" | "correct" | "wrong";
  readonly stepIndex: number;
  readonly tapProgress: number | null;
  readonly timeMs: number;
  readonly victoryProgress: number | null;
}

export interface GT034FallbackGlyphParams {
  readonly instrumentId: string;
  readonly slot: Slot;
  readonly stageBounds: ZoneRect;
}

export interface GT034ScaffoldOverlayParams {
  readonly elapsedMs: number;
  readonly level: 0 | 1 | 2 | 3;
  readonly litStepSlot: Slot | null;
  readonly stageBounds: ZoneRect;
  readonly targetSlot: Slot | null;
  readonly targetStepSlot: Slot | null;
}

const montessori = designTokens.colors.montessori;
const surface = designTokens.colors.surface;
const SOLID_DASH: number[] = [];
const HINT_DASH: number[] = [5, 4];

const clamp = (val: number, min: number, len: number): number =>
  Math.max(min + 2, Math.min(min + len - 2, val));

const rectOf = (x: number, y: number, w: number, h: number): ZoneRect => ({
  x,
  y,
  w,
  h,
});

function createPen(ctx: Canvas2D, bounds: ZoneRect) {
  const paint = (fill?: string, stroke?: string, width = 2): void => {
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = width;
      ctx.stroke();
    }
  };
  const box = (rect: ZoneRect, r: number, fill?: string, stroke?: string) => {
    const x0 = clamp(rect.x, bounds.x, bounds.w);
    const y0 = clamp(rect.y, bounds.y, bounds.h);
    const width = Math.max(2, clamp(rect.x + rect.w, bounds.x, bounds.w) - x0);
    const height = Math.max(2, clamp(rect.y + rect.h, bounds.y, bounds.h) - y0);
    ctx.beginPath();
    ctx.roundRect(x0, y0, width, height, Math.min(r, width / 2, height / 2));
    paint(fill, stroke);
  };
  const ring = (slot: Slot, r: number, fill?: string, stroke?: string) => {
    const px = clamp(slot.x, bounds.x, bounds.w);
    const py = clamp(slot.y, bounds.y, bounds.h);
    const dx = Math.min(px - bounds.x, bounds.x + bounds.w - px);
    const dy = Math.min(py - bounds.y, bounds.y + bounds.h - py);
    ctx.beginPath();
    ctx.arc(px, py, Math.max(1, Math.min(r, dx - 2, dy - 2)), 0, Math.PI * 2);
    paint(fill, stroke, 2.5);
  };
  const tray = (rect: ZoneRect, r: number, fill: string, shadow: boolean) => {
    if (shadow) {
      box({ ...rect, y: rect.y + 3 }, r, alpha(montessori.woodBorder, 0.25));
    }
    box(rect, r, fill, montessori.woodBorder);
  };
  return { box, ring, tray };
}

type Pen = ReturnType<typeof createPen>;

export function drawGT034ConcertStage(
  ctx: Canvas2D,
  rs: RenderSystem,
  params: GT034ConcertStageParams
): void {
  const { stageBounds, rowRails, allStepsBounds, dockBounds } = params;
  if (rowRails.length === 0) {
    return;
  }
  const pen = createPen(ctx, stageBounds);
  ctx.save();
  const railFill = alpha(montessori.woodTray, 0.68);
  for (const rail of rowRails) {
    pen.tray(rail.box, 14, railFill, rs.softShadowsEnabled);
    const groove = rectOf(
      rail.box.x + 6,
      rail.box.y + rail.box.h / 2 - 4,
      rail.box.w - 12,
      8
    );
    pen.box(groove, 4, montessori.woodBevel);
    ctx.strokeStyle = alpha(montessori.woodBorder, 0.5);
    ctx.lineWidth = 2;
    const [topY, botY] = [
      clamp(rail.box.y + 4, stageBounds.y, stageBounds.h),
      clamp(rail.box.y + rail.box.h - 4, stageBounds.y, stageBounds.h),
    ];
    for (const divX of rail.dividersX) {
      const midX = clamp(divX, stageBounds.x, stageBounds.w);
      ctx.beginPath();
      ctx.moveTo(midX, topY);
      ctx.lineTo(midX, botY);
      ctx.stroke();
    }
  }
  const gaugeStartX =
    allStepsBounds.x + (allStepsBounds.w - (params.replayLimit * 20 - 6)) / 2;
  const gaugeY = Math.min(
    stageBounds.y + stageBounds.h - 10,
    allStepsBounds.y + allStepsBounds.h + 3
  );
  const remaining = Math.max(0, params.replayLimit - params.replaysUsed);
  for (let i = 0; i < params.replayLimit; i++) {
    const fill = i < remaining ? montessori.emeraldLight : surface[200];
    const stroke = i < remaining ? montessori.emerald : surface[400];
    pen.box(rectOf(gaugeStartX + i * 20, gaugeY, 14, 6), 3, fill, stroke);
  }
  if (params.wrongProgress !== null && params.wrongKind === "timing") {
    const sweepW = Math.min(48, allStepsBounds.w * 0.25);
    const sweepX =
      allStepsBounds.x + allStepsBounds.w * params.wrongProgress - sweepW / 2;
    const sweepBox = rectOf(sweepX, allStepsBounds.y, sweepW, allStepsBounds.h);
    const sweepGlow = alpha(
      montessori.amberGlow,
      (1 - params.wrongProgress) * 0.55
    );
    pen.box(sweepBox, 10, sweepGlow, montessori.amberDark);
  }
  if (dockBounds) {
    const dockFill = alpha(montessori.paper, 0.86);
    pen.tray(dockBounds, 16, dockFill, rs.softShadowsEnabled);
  }
  ctx.restore();
}

function drawSelectedOrCorrect(
  pen: Pen,
  rs: RenderSystem,
  params: GT034SlotFeedbackParams,
  radius: number
): void {
  const { slot } = params;
  if (params.state === "selected") {
    const pulse = rs.reducedMotion ? 0 : Math.sin(params.timeMs * 0.01) * 2;
    const fill = alpha(montessori.indigo, 0.14);
    pen.ring(slot, radius + 3 + pulse, fill, montessori.indigo);
    if (!rs.reducedMotion && params.particlesEnabled) {
      const aura = alpha(montessori.indigo, 0.4);
      pen.ring(slot, radius + 8 + pulse, undefined, aura);
    }
    return;
  }
  const victory = params.victoryProgress;
  const wave =
    victory !== null && !rs.reducedMotion
      ? Math.max(0, 1 - Math.abs(victory * 8 - params.stepIndex))
      : 0;
  const fill = alpha(montessori.emeraldLight, 0.24 + wave * 0.25);
  pen.ring(slot, radius + 3 + wave * 3, fill, montessori.emeraldBright);
}

export function drawGT034SlotFeedback(
  ctx: Canvas2D,
  rs: RenderSystem,
  params: GT034SlotFeedbackParams
): void {
  const { slot, stageBounds, state } = params;
  const pen = createPen(ctx, stageBounds);
  const radius = Math.min(slot.w, slot.h) / 2;
  ctx.save();
  if (state === "idle" && params.isLastFilled && params.isStep) {
    const marker = rectOf(slot.x - 10, slot.y + radius - 1, 20, 4);
    pen.box(marker, 2, alpha(montessori.amberDark, 0.55));
  } else if (state === "hovered" || state === "wrong") {
    const fill = alpha(montessori.amberLight, state === "hovered" ? 0.2 : 0.28);
    const ringRadius = radius + (state === "hovered" ? 4 : 3);
    pen.ring(slot, ringRadius, fill, montessori.amberDark);
  } else if (state === "selected" || state === "correct") {
    drawSelectedOrCorrect(pen, rs, params, radius);
  }
  const tap = params.tapProgress;
  if (tap !== null && tap < 1 && !rs.reducedMotion) {
    const ripple = alpha(montessori.emerald, (1 - tap) * 0.65);
    pen.ring(slot, radius + 2 + tap * 10, undefined, ripple);
  }
  ctx.restore();
}

export function drawGT034FallbackInstrumentGlyph(
  ctx: Canvas2D,
  params: GT034FallbackGlyphParams
): void {
  const { slot, stageBounds } = params;
  const pen = createPen(ctx, stageBounds);
  const radius = Math.min(slot.w, slot.h) * 0.34;
  ctx.save();
  pen.ring(slot, radius, montessori.amberLight, montessori.amberDark);
  pen.ring(slot, radius * 0.46, montessori.amberGlow, montessori.amberDark);
  pen.ring(slot, radius * 0.16, montessori.woodBorder);
  ctx.restore();
}

export function drawGT034ScaffoldOverlay(
  ctx: Canvas2D,
  rs: RenderSystem,
  params: GT034ScaffoldOverlayParams
): void {
  const { stageBounds, level, targetSlot, targetStepSlot, litStepSlot } =
    params;
  if (level === 0) {
    return;
  }
  const pen = createPen(ctx, stageBounds);
  const wave = rs.reducedMotion
    ? 0.85
    : 0.5 + 0.45 * Math.sin(params.elapsedMs * 0.006);
  ctx.save();
  if (level === 1 && targetStepSlot) {
    const radius = Math.min(targetStepSlot.w, targetStepSlot.h) / 2 + 4;
    const stroke = alpha(montessori.amberDark, wave);
    ctx.setLineDash(HINT_DASH);
    pen.ring(targetStepSlot, radius, undefined, stroke);
    ctx.setLineDash(SOLID_DASH);
  } else if (level >= 2 && targetSlot) {
    const radius = Math.min(targetSlot.w, targetSlot.h) / 2 + 5;
    const fill = alpha(montessori.amberGlow, wave * 0.2);
    pen.ring(targetSlot, radius, fill, montessori.amberDark);
    if (level === 3 && litStepSlot) {
      ctx.strokeStyle = alpha(montessori.amberDark, 0.55);
      ctx.lineWidth = 2;
      ctx.setLineDash(HINT_DASH);
      ctx.beginPath();
      const startX = clamp(targetSlot.x, stageBounds.x, stageBounds.w);
      const startY = clamp(targetSlot.y - radius, stageBounds.y, stageBounds.h);
      const endX = clamp(litStepSlot.x, stageBounds.x, stageBounds.w);
      const endY = clamp(
        litStepSlot.y + litStepSlot.h / 2,
        stageBounds.y,
        stageBounds.h
      );
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      ctx.setLineDash(SOLID_DASH);
    }
  }
  ctx.restore();
}
