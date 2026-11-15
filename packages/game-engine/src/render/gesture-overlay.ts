/**
 * Lớp phủ tương tác trực tiếp (Live Gesture & Transition Overlay) trên Canvas 2D.
 *
 * Vẽ ở bước `onAfterRender` của bề mặt chơi để mọi template (GT-001..GT-036)
 * đều có phản hồi vật lý sống động theo từng cử chỉ của trẻ:
 * 1. Nhấn giữ (`pointerdown`): vật sáng ấm và nhấc nhẹ khỏi khay.
 * 2. Kéo vật (`pointermove` trên thực thể nguồn):
 *    - Khay gốc mờ đi như hốc trống.
 *    - Dây nối đàn hồi (Bezier) nối từ vị trí gốc tới ngón tay.
 *    - Các ô đích khả dụng nhịp thở mời gọi; ô đích dưới ngón tay toả hào quang
 *      hút nam châm (`drawTargetHoverAura`).
 *    - Quân cờ/vật thể nổi dưới ngón tay (`scale 1.14`, bóng đổ mềm) di chuyển
 *      mượt mà theo tay bé.
 * 3. Vẽ đường mê cung (`trailPoints`): dải lụa hổ phách phát sáng chạy theo tay.
 * 4. Nhả tay (`pointerup` / `tap-tap`):
 *    - Thả trượt hoặc sai chỗ (`spring_back`): vật trôi đàn hồi về chỗ cũ (240ms).
 *    - Đặt đúng đích (`snap_to_target`): vật nhảy vòng cung vào ô đích (200ms).
 */

import type { ViewEntity } from "#src/interaction";
import type { Slot } from "#src/layout/types";
import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";
import {
  computeMagneticPull,
  computeSquashStretch,
  sampleTactileSpring,
} from "#src/systems/spring-physics";
import { alpha } from "./color-utils.js";
import {
  drawGlyphInSlot,
  drawMagneticSnapHalo,
  drawTargetHoverAura,
  drawTextInSlot,
  getColorsForState,
} from "./shared-render.js";
import {
  drawCircleOutline,
  drawElasticConnector,
  drawEmptyTargetSlot,
  drawTrailRibbon,
} from "./slot-decor.js";

export interface GestureTransitionFlight {
  readonly entity: ViewEntity;
  readonly fromX: number;
  readonly fromY: number;
  readonly toX: number;
  readonly toY: number;
  readonly startMs: number;
  readonly durationMs: number;
  readonly kind: "snap_to_target" | "spring_back";
}

export interface ActiveGestureVisualState {
  readonly activeEntity: ViewEntity | null;
  readonly stagedEntity: ViewEntity | null;
  readonly targetEntities: readonly ViewEntity[];
  readonly hoveredTarget: ViewEntity | null;
  readonly startX: number;
  readonly startY: number;
  readonly currentX: number;
  readonly currentY: number;
  readonly isPointerDown: boolean;
  readonly isDragging: boolean;
  readonly trailPoints: readonly { readonly x: number; readonly y: number }[];
  readonly flight: GestureTransitionFlight | null;
}

function entityToSlot(
  entity: ViewEntity,
  x = entity.x,
  y = entity.y,
  scale = 1
): Slot {
  const w = Math.max(48, entity.w * scale);
  const h = Math.max(48, entity.h * scale);
  return {
    index: entity.slotIndex,
    x,
    y,
    w,
    h,
    hitW: w,
    hitH: h,
    page: 0,
    role: entity.role === "target" ? "target" : "source",
  };
}

function drawFloatingEntityToken(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  entity: ViewEntity,
  x: number,
  y: number,
  scale: number,
  highlightState: "touching" | "selected" | "correct" = "touching"
): void {
  const slot = entityToSlot(entity, x, y, scale);
  const radius = Math.min(slot.w, slot.h) / 2;
  const { fill, border } = getColorsForState(highlightState);
  const shape = entity.hitShape === "square" ? "square" : "circle";

  ctx.save();
  ctx.shadowColor = alpha(designTokens.colors.montessori.woodBorder, 0.32);
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 8;
  rs.drawClayBody(ctx, slot.x, slot.y, radius, fill, border, shape);
  ctx.restore();

  if (entity.glyph) {
    drawGlyphInSlot(ctx, entity.glyph, slot, 1.05);
  } else if (entity.label) {
    drawTextInSlot(
      ctx,
      entity.label,
      slot,
      designTokens.colors.montessori.amberDark
    );
  }
}

function drawTargetInvitations(
  ctx: CanvasRenderingContext2D,
  targets: readonly ViewEntity[],
  hoveredTarget: ViewEntity | null,
  nowMs: number,
  reducedMotion: boolean
): void {
  const phase = reducedMotion ? 0 : (nowMs % 1200) / 1200;
  const pulsePad = reducedMotion ? 4 : 4 + Math.sin(phase * Math.PI * 2) * 3;

  for (const target of targets) {
    if (target.state === "correct") {
      continue;
    }
    const isHovered = hoveredTarget?.id === target.id;
    const radius = Math.min(target.w, target.h) / 2;
    if (isHovered) {
      drawMagneticSnapHalo(ctx, target.x, target.y, radius * 1.18, 1, phase);
      drawCircleOutline(
        ctx,
        entityToSlot(target),
        designTokens.colors.semantic.success[500],
        4.5,
        pulsePad + 3
      );
    } else {
      drawCircleOutline(
        ctx,
        entityToSlot(target),
        alpha(designTokens.colors.montessori.amber, 0.55),
        2.5,
        pulsePad
      );
    }
  }
}

function drawTransitionFlight(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  flight: GestureTransitionFlight,
  nowMs: number
): void {
  const rawProgress = (nowMs - flight.startMs) / flight.durationMs;
  if (rawProgress < 0 || rawProgress >= 1) {
    return;
  }
  const t = sampleTactileSpring(rawProgress, rs.reducedMotion);
  const x = flight.fromX + (flight.toX - flight.fromX) * t;
  const baseLinearY = flight.fromY + (flight.toY - flight.fromY) * t;
  const arcLift = rs.reducedMotion
    ? 0
    : Math.sin(rawProgress * Math.PI) *
      (flight.kind === "snap_to_target" ? -28 : -16);
  const y = baseLinearY + arcLift;
  const squash = computeSquashStretch(rawProgress, "drop", rs.reducedMotion);
  const baseScale =
    flight.kind === "snap_to_target"
      ? 1 + 0.14 * Math.sin(rawProgress * Math.PI)
      : 1.12 - 0.12 * Math.min(1, Math.max(0, t));

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(squash.scaleX, squash.scaleY);
  ctx.translate(-x, -y);
  drawFloatingEntityToken(
    ctx,
    rs,
    flight.entity,
    x,
    y,
    baseScale,
    flight.kind === "snap_to_target" ? "correct" : "selected"
  );
  ctx.restore();
}

function drawStagedEntityBob(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  staged: ViewEntity,
  targets: readonly ViewEntity[],
  nowMs: number
): void {
  const phase = rs.reducedMotion ? 0 : (nowMs % 1000) / 1000;
  const bobY = rs.reducedMotion ? 0 : Math.sin(phase * Math.PI * 2) * 3.5;
  const radius = Math.min(staged.w, staged.h) / 2;

  drawTargetHoverAura(ctx, staged.x, staged.y, radius * 1.05, phase);
  if (staged.glyph || staged.label) {
    drawFloatingEntityToken(
      ctx,
      rs,
      staged,
      staged.x,
      staged.y - 3 + bobY,
      1.05,
      "selected"
    );
  }
  drawTargetInvitations(ctx, targets, null, nowMs, rs.reducedMotion);
}

function drawPressedEntityOverlay(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  active: ViewEntity | null
): void {
  if (!(active && (active.glyph || active.label))) {
    return;
  }
  const radius = Math.min(active.w, active.h) / 2;
  drawTargetHoverAura(ctx, active.x, active.y, radius);
  drawFloatingEntityToken(
    ctx,
    rs,
    active,
    active.x,
    active.y - 4,
    1.07,
    "touching"
  );
}

function drawDraggingSourceOverlay(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  active: ViewEntity,
  state: ActiveGestureVisualState,
  nowMs: number
): void {
  drawEmptyTargetSlot(ctx, entityToSlot(active));
  drawTargetInvitations(
    ctx,
    state.targetEntities,
    state.hoveredTarget,
    nowMs,
    rs.reducedMotion
  );

  const hovered = state.hoveredTarget;
  let drawX = state.currentX;
  let drawY = state.currentY - 6;
  if (hovered) {
    const snapRadius = Math.max(hovered.w, hovered.h) * 0.95;
    const pulled = computeMagneticPull(
      state.currentX,
      state.currentY,
      hovered.x,
      hovered.y,
      snapRadius
    );
    drawX = pulled.snapped
      ? pulled.x
      : state.currentX * 0.72 + hovered.x * 0.28;
    drawY = pulled.snapped
      ? pulled.y
      : state.currentY * 0.72 + hovered.y * 0.28;
  }

  drawElasticConnector(
    ctx,
    active.x,
    active.y,
    drawX,
    drawY,
    hovered
      ? designTokens.colors.semantic.success[500]
      : designTokens.colors.montessori.amber,
    hovered !== null
  );
  drawFloatingEntityToken(
    ctx,
    rs,
    active,
    drawX,
    drawY,
    hovered ? 1.16 : 1.12,
    hovered ? "selected" : "touching"
  );
}

export function drawActiveGestureOverlay(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  state: ActiveGestureVisualState,
  nowMs: number
): void {
  if (state.flight) {
    drawTransitionFlight(ctx, rs, state.flight, nowMs);
  }

  if (!state.isPointerDown) {
    if (state.stagedEntity) {
      drawStagedEntityBob(
        ctx,
        rs,
        state.stagedEntity,
        state.targetEntities,
        nowMs
      );
    }
    return;
  }

  const active = state.activeEntity;
  if (!state.isDragging) {
    drawPressedEntityOverlay(ctx, rs, active);
    return;
  }

  if (active && active.role === "source" && (active.glyph || active.label)) {
    drawDraggingSourceOverlay(ctx, rs, active, state, nowMs);
    return;
  }

  drawTrailRibbon(
    ctx,
    state.trailPoints,
    designTokens.colors.montessori.amber,
    designTokens.colors.surface[0]
  );
}
