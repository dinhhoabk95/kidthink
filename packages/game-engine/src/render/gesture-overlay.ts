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
import { alpha } from "./color-utils.js";
import {
  drawGlyphInSlot,
  drawTargetHoverAura,
  drawTextInSlot,
  getColorsForState,
} from "./shared-render.js";
import { drawCircleOutline, drawEmptyTargetSlot } from "./slot-decor.js";

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

const DASH_ELASTIC: readonly number[] = Object.freeze([10, 7]);
const DASH_NONE: readonly number[] = Object.freeze([]);

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

function drawElasticConnector(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  isTargetHovered: boolean
): void {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const dist = Math.hypot(dx, dy);
  if (dist < 16) {
    return;
  }

  const midX = (fromX + toX) / 2;
  const archOffset = Math.min(36, dist * 0.14);
  const ctrlX = midX;
  const ctrlY = (fromY + toY) / 2 - archOffset;

  const strokeColor = isTargetHovered
    ? designTokens.colors.semantic.success[500]
    : designTokens.colors.montessori.amber;

  ctx.save();
  ctx.strokeStyle = alpha(strokeColor, 0.85);
  ctx.lineWidth = isTargetHovered ? 5 : 4;
  ctx.lineCap = "round";
  ctx.setLineDash(isTargetHovered ? DASH_NONE : DASH_ELASTIC);
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.quadraticCurveTo(ctrlX, ctrlY, toX, toY);
  ctx.stroke();

  ctx.setLineDash(DASH_NONE);
  ctx.fillStyle = strokeColor;
  ctx.beginPath();
  ctx.arc(fromX, fromY, 6, 0, Math.PI * 2);
  ctx.arc(toX, toY, isTargetHovered ? 8 : 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
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
      drawTargetHoverAura(ctx, target.x, target.y, radius * 1.15, phase);
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

function drawTrailRibbon(
  ctx: CanvasRenderingContext2D,
  points: readonly { readonly x: number; readonly y: number }[]
): void {
  if (points.length < 2) {
    return;
  }
  const first = points[0];
  const last = points.at(-1);
  if (!(first && last)) {
    return;
  }

  ctx.save();
  ctx.strokeStyle = alpha(designTokens.colors.montessori.amber, 0.72);
  ctx.lineWidth = 10;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(first.x, first.y);
  for (let i = 1; i < points.length; i++) {
    const pt = points[i];
    if (pt) {
      ctx.lineTo(pt.x, pt.y);
    }
  }
  ctx.stroke();

  ctx.fillStyle = designTokens.colors.montessori.amber;
  ctx.strokeStyle = designTokens.colors.surface[0];
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(last.x, last.y, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
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
  const t = rs.reducedMotion ? 1 : 1 - (1 - rawProgress) ** 3;
  const x = flight.fromX + (flight.toX - flight.fromX) * t;
  const baseLinearY = flight.fromY + (flight.toY - flight.fromY) * t;
  const arcLift = rs.reducedMotion
    ? 0
    : Math.sin(rawProgress * Math.PI) *
      (flight.kind === "snap_to_target" ? -28 : -16);
  const y = baseLinearY + arcLift;
  const scale =
    flight.kind === "snap_to_target"
      ? 1 + 0.14 * Math.sin(rawProgress * Math.PI)
      : 1.12 - 0.12 * t;

  drawFloatingEntityToken(
    ctx,
    rs,
    flight.entity,
    x,
    y,
    scale,
    flight.kind === "snap_to_target" ? "correct" : "selected"
  );
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
  const drawX = hovered
    ? state.currentX * 0.72 + hovered.x * 0.28
    : state.currentX;
  const drawY = hovered
    ? state.currentY * 0.72 + hovered.y * 0.28
    : state.currentY - 6;

  drawElasticConnector(ctx, active.x, active.y, drawX, drawY, hovered !== null);
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

  drawTrailRibbon(ctx, state.trailPoints);
}
