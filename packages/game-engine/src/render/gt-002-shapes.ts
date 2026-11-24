import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import {
  getCachedGradient,
  getContextGeneration,
  PRIMITIVE_GRADIENTS,
  setCachedGradient,
} from "#src/render/cache";
import { alpha } from "#src/render/color-utils";
import { drawGeometricSpecInSlot } from "#src/render/geometric-primitives";
import {
  drawDotPattern,
  drawPlaceholderBox,
  drawQuantityRepresentation,
} from "#src/render/numeracy-primitives";
import {
  drawAssetInSlot,
  drawSlotLabel,
  drawTextInSlot,
} from "#src/render/shared-render";
import {
  detectSlotVisualComparisonCue,
  drawSlotVisualComparisonCue,
} from "#src/render/slot-decor";
import type { ItemVisualState, RenderItem } from "#src/render/types";
import {
  drawBambooJointAccent,
  drawDoPaperFiberMarks,
} from "#src/render/vn-folk-motifs";
import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";
import type { GT002BoardStyle } from "#src/templates/GT-002/gt002-story-lines";
import {
  type GT002TokenAnimState,
  resolveGT002PlatePalette,
  resolveGT002TokenPose,
} from "#src/templates/GT-002/layout";
import type { GT002PlateVariant } from "#src/templates/GT-002/template";

const BOARD_SLAB_DEPTH_PX = 4;
const SPEAKING_PULSE_MS = 520;
const { brand, montessori, retry, scene, surface, vnMaterials } =
  designTokens.colors;

interface BoardMaterialTheme {
  readonly fill: string;
  readonly stroke: string;
  readonly slab: string;
}

const BOARD_THEMES: Readonly<Record<GT002BoardStyle, BoardMaterialTheme>> = {
  montessori_wood: {
    fill: montessori.woodTray,
    stroke: montessori.woodBevel,
    slab: montessori.woodBorder,
  },
  sedge_harvest: {
    fill: vnMaterials.sedgeMat.base,
    stroke: vnMaterials.bamboo.joint,
    slab: vnMaterials.bamboo.deep,
  },
  ocean_net: {
    fill: scene.sky[100],
    stroke: brand[300],
    slab: brand[600],
  },
};

function drawBoardMaterialTexture(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  bodyH: number,
  cornerR: number,
  boardStyle: GT002BoardStyle
): void {
  if (w < 96 || bodyH < 44) {
    return;
  }
  ctx.save();
  if (boardStyle === "sedge_harvest") {
    ctx.strokeStyle = alpha(vnMaterials.sedgeMat.weft, 0.28);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    const stepY = Math.max(18, Math.round(bodyH / 4));
    for (let ry = y + stepY; ry < y + bodyH - 8; ry += stepY) {
      ctx.moveTo(x + cornerR, ry);
      ctx.lineTo(x + w - cornerR, ry);
    }
    ctx.stroke();
    drawBambooJointAccent(
      ctx,
      x + cornerR + 8,
      y + bodyH - 5,
      x + w - cornerR - 8,
      y + bodyH - 5,
      4
    );
  } else if (boardStyle === "ocean_net") {
    ctx.strokeStyle = alpha(brand[300], 0.24);
    ctx.lineWidth = 1.2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(x + cornerR, y + bodyH * 0.34);
    ctx.lineTo(x + w - cornerR, y + bodyH * 0.34);
    ctx.moveTo(x + cornerR, y + bodyH * 0.66);
    ctx.lineTo(x + w - cornerR, y + bodyH * 0.66);
    ctx.stroke();
    ctx.setLineDash([]);

    const floatR = 4.5;
    ctx.fillStyle = montessori.bambooWarm;
    ctx.strokeStyle = montessori.woodBorder;
    ctx.lineWidth = 1.4;
    for (const [fx, fy] of [
      [x + cornerR, y + 6],
      [x + w - cornerR, y + 6],
    ] as const) {
      ctx.beginPath();
      ctx.arc(fx, fy, floatR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  } else {
    ctx.strokeStyle = alpha(vnMaterials.woodGrain.groove, 0.25);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x + cornerR + 8, y + bodyH * 0.72);
    ctx.lineTo(x + w * 0.36, y + bodyH * 0.72);
    ctx.moveTo(x + w * 0.64, y + bodyH * 0.28);
    ctx.lineTo(x + w - cornerR - 8, y + bodyH * 0.28);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawGT002BoardFrame(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  boardRect: ZoneRect | null,
  boardStyle: GT002BoardStyle = "montessori_wood"
): void {
  if (!boardRect || boardRect.w < 24 || boardRect.h < 24) {
    return;
  }
  const { x, y, w, h } = boardRect;
  const bodyH = Math.max(12, h - BOARD_SLAB_DEPTH_PX);
  const cornerR = Math.min(24, Math.floor(bodyH / 2));
  const mat = BOARD_THEMES[boardStyle];

  ctx.save();
  if (rs.softShadowsEnabled) {
    ctx.save();
    ctx.shadowColor = alpha(montessori.woodBorder, 0.16);
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = mat.fill;
    ctx.beginPath();
    ctx.roundRect(x, y, w, bodyH, cornerR);
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  ctx.translate(0, BOARD_SLAB_DEPTH_PX);
  ctx.fillStyle = mat.slab;
  ctx.beginPath();
  ctx.roundRect(x, y, w, bodyH, cornerR);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = mat.fill;
  ctx.strokeStyle = mat.stroke;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.roundRect(x, y, w, bodyH, cornerR);
  ctx.fill();
  ctx.stroke();

  drawBoardMaterialTexture(ctx, x, y, w, bodyH, cornerR, boardStyle);

  ctx.strokeStyle = alpha(surface[0], 0.82);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + cornerR, y + 4);
  ctx.lineTo(x + w - cornerR, y + 4);
  ctx.stroke();
  ctx.restore();
}

function resolvePlateGradients(
  ctx: CanvasRenderingContext2D,
  slot: Slot,
  baseR: number,
  innerR: number
): { readonly rimGrad: CanvasGradient; readonly innerGrad: CanvasGradient } {
  const gen = getContextGeneration(ctx);
  const rimId = PRIMITIVE_GRADIENTS.PLATE_RIM;
  const innerId = PRIMITIVE_GRADIENTS.PLATE_INNER;
  const { x, y, index: idx } = slot;

  let rimGrad = getCachedGradient(ctx, gen, rimId, idx);
  if (!rimGrad) {
    const gx = x - baseR * 0.3;
    const gy = y - baseR * 0.3;
    rimGrad = ctx.createRadialGradient(gx, gy, baseR * 0.1, x, y, baseR);
    rimGrad.addColorStop(0, montessori.plateLight);
    rimGrad.addColorStop(0.7, montessori.plateMid);
    rimGrad.addColorStop(1, montessori.plateEdge);
    setCachedGradient(ctx, gen, rimId, idx, rimGrad);
  }

  let innerGrad = getCachedGradient(ctx, gen, innerId, idx);
  if (!innerGrad) {
    innerGrad = ctx.createRadialGradient(x, y, innerR * 0.2, x, y, innerR);
    innerGrad.addColorStop(0, montessori.plateInner);
    innerGrad.addColorStop(1, montessori.plateInnerEdge);
    setCachedGradient(ctx, gen, innerId, idx, innerGrad);
  }
  return { rimGrad, innerGrad };
}

function drawDualFaceCardBody(
  ctx: CanvasRenderingContext2D,
  slot: Slot,
  item: RenderItem
): void {
  const upperSlot: Slot = {
    ...slot,
    y: Math.round(slot.y - slot.h * 0.15),
    w: Math.round(slot.w * 0.9),
    h: Math.round(slot.h * 0.56),
  };
  if (item.text !== undefined) {
    drawTextInSlot(ctx, item.text, upperSlot, vnMaterials.doPaper.ink);
  } else if (item.asset?.kind === "text") {
    drawTextInSlot(ctx, item.asset.text, upperSlot, vnMaterials.doPaper.ink);
  } else if (!drawAssetInSlot(ctx, item.asset, upperSlot, 0.88)) {
    drawPlaceholderBox(ctx, upperSlot);
  }

  const subSize = Math.max(14, Math.round(Math.min(slot.w, slot.h) * 0.4));
  const subSlot: Slot = {
    ...slot,
    x: Math.round(slot.x + slot.w * 0.18),
    y: Math.round(slot.y + slot.h * 0.24),
    w: subSize,
    h: subSize,
  };
  if (!drawAssetInSlot(ctx, item.secondaryAsset, subSlot, 0.88)) {
    drawPlaceholderBox(ctx, subSlot);
  }
}

function drawSpeakingWaveArcs(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  maxRadius: number,
  selectElapsedMs: number,
  reducedMotion: boolean
): void {
  if (selectElapsedMs < 0 || selectElapsedMs > SPEAKING_PULSE_MS) {
    return;
  }
  const progress = reducedMotion ? 0.35 : selectElapsedMs / SPEAKING_PULSE_MS;
  const fade = Math.max(0, 1 - progress);
  const r1 = maxRadius * (0.58 + 0.22 * progress);
  ctx.save();
  ctx.strokeStyle = alpha(brand[400], 0.55 * fade);
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(cx, cy, r1, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawFramelessTenFrame(
  ctx: CanvasRenderingContext2D,
  slot: Slot,
  filledCount: number
): void {
  const w = slot.w * 0.94;
  const h = Math.min(slot.h * 0.72, w * 0.52);
  const x0 = slot.x - w / 2;
  const y0 = slot.y - h / 2;
  const cellW = w / 5;
  const cellH = h / 2;
  const r = Math.max(3, Math.min(cellW, cellH) * 0.36);

  ctx.save();
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 5; col++) {
      const cx = x0 + col * cellW + cellW / 2;
      const cy = y0 + row * cellH + cellH / 2;
      const filled = row * 5 + col < filledCount;
      ctx.fillStyle = filled ? montessori.amberLight : montessori.slotRecess;
      ctx.strokeStyle = filled ? montessori.amberDark : montessori.woodBorder;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      if (filled) {
        ctx.fillStyle = montessori.amber;
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.65, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const arm = r * 0.34;
        ctx.strokeStyle = surface[400];
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(cx - arm, cy);
        ctx.lineTo(cx + arm, cy);
        ctx.moveTo(cx, cy - arm);
        ctx.lineTo(cx, cy + arm);
        ctx.stroke();
      }
    }
  }
  ctx.strokeStyle = montessori.woodBorder;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(x0 + 3, slot.y);
  ctx.lineTo(x0 + w - 3, slot.y);
  ctx.stroke();
  ctx.restore();
}

function drawTileQuantityRepresentation(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  slot: Slot,
  rep: NonNullable<RenderItem["representation"]>,
  isWoodTile: boolean
): boolean {
  if (isWoodTile && rep.kind === "dot-pattern" && rep.count <= 6) {
    const side = Math.min(slot.w, slot.h) * 0.88;
    drawDotPattern(
      ctx,
      { x: slot.x - side / 2, y: slot.y - side / 2, w: side, h: side },
      rep.count,
      { frame: false, dotRadius: Math.max(3.4, side * 0.095) }
    );
    return true;
  }
  if (isWoodTile && rep.kind === "ten-frame") {
    drawFramelessTenFrame(ctx, slot, rep.count);
    return true;
  }
  return drawQuantityRepresentation(ctx, rs, slot, rep);
}

function drawPlateBody(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  slot: Slot,
  item: RenderItem
): void {
  if (
    item.geometricSpec &&
    drawGeometricSpecInSlot(ctx, rs, slot, item.geometricSpec)
  ) {
    return;
  }
  if (
    item.representation &&
    drawTileQuantityRepresentation(
      ctx,
      rs,
      slot,
      item.representation,
      item.plateVariant === "wood_tile"
    )
  ) {
    return;
  }
  if (item.secondaryAsset) {
    drawDualFaceCardBody(ctx, slot, item);
    return;
  }
  if (item.text !== undefined) {
    drawTextInSlot(ctx, item.text, slot, vnMaterials.doPaper.ink);
    return;
  }
  const emojiRef = item.asset?.kind === "emoji" ? item.asset.ref : undefined;
  const cue = detectSlotVisualComparisonCue(item.label, item.id, emojiRef);
  if (cue) {
    drawSlotVisualComparisonCue(ctx, slot, cue);
  }
  if (!drawAssetInSlot(ctx, item.asset, slot, cue?.glyphScale ?? 1)) {
    drawPlaceholderBox(ctx, slot);
  }
}

function shouldDrawBottomLabel(item: RenderItem): boolean {
  if (!item.label) {
    return false;
  }
  if (item.asset?.kind === "text" && item.asset.text === item.label) {
    return false;
  }
  if (item.text !== undefined && item.text === item.label) {
    return false;
  }
  return true;
}

function drawTickBadgeAt(
  ctx: CanvasRenderingContext2D,
  bx: number,
  by: number,
  badgeR: number,
  fillColor: string,
  borderColor: string
): void {
  const arm = badgeR * 0.52;
  ctx.save();
  ctx.fillStyle = fillColor;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(bx, by, badgeR, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = surface[0];
  ctx.lineWidth = Math.max(2.2, badgeR * 0.22);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(bx - arm * 0.7, by);
  ctx.lineTo(bx - arm * 0.1, by + arm * 0.6);
  ctx.lineTo(bx + arm * 0.7, by - arm * 0.5);
  ctx.stroke();
  ctx.restore();
}

function drawWoodTileOverlays(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  box: {
    readonly x: number;
    readonly y: number;
    readonly tileW: number;
    readonly tileH: number;
    readonly innerW: number;
    readonly innerH: number;
    readonly contentSlot: Slot;
  },
  item: RenderItem,
  palette: ReturnType<typeof resolveGT002PlatePalette>,
  anim: GT002TokenAnimState
): void {
  if (item.isSpeakingPulse === true) {
    drawSpeakingWaveArcs(
      ctx,
      box.contentSlot.x,
      box.y + box.tileH / 2,
      Math.min(box.innerW, box.innerH) * 0.48,
      anim.selectElapsedMs,
      rs.reducedMotion
    );
  }
  if (shouldDrawBottomLabel(item) && item.label) {
    const labelAnchor: Slot = {
      ...box.contentSlot,
      h: Math.max(12, box.innerH - 22),
    };
    drawSlotLabel(ctx, item.label, labelAnchor, rs);
  }
  if (palette.badgeFill && palette.badgeBorder) {
    const badgeR = Math.max(
      8,
      Math.min(13, Math.min(box.tileW, box.tileH) * 0.14)
    );
    drawTickBadgeAt(
      ctx,
      box.x + box.tileW - badgeR - 3,
      box.y + badgeR + 3,
      badgeR,
      palette.badgeFill,
      palette.badgeBorder
    );
  }
}

function drawWoodTilePlate(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  slot: Slot,
  slotIndex: number,
  item: RenderItem,
  anim: GT002TokenAnimState
): void {
  const state: ItemVisualState = item.state ?? "idle";
  const palette = resolveGT002PlatePalette(state);
  const pose = resolveGT002TokenPose(state, slotIndex, rs.reducedMotion, anim);
  const isDimmedIdle = state === "idle" && item.isSoftDimmed === true;

  const maxW = Math.max(24, slot.hitW - 8);
  const maxH = Math.max(24, slot.hitH - 8);
  const tileW = Math.min(maxW, Math.max(24, slot.w - 4) * pose.scale);
  const tileH = Math.min(maxH, Math.max(24, slot.h - 4) * pose.scale);
  const cx = slot.x + pose.dx;
  const cy = slot.y + pose.dy;
  const x = cx - tileW / 2;
  const y = cy - tileH / 2;
  const cornerR = Math.min(18, Math.floor(Math.min(tileW, tileH) * 0.22));

  ctx.save();
  if (rs.softShadowsEnabled) {
    ctx.save();
    ctx.shadowColor = alpha(montessori.woodBorder, 0.2);
    ctx.shadowBlur = state === "selected" || state === "correct" ? 13 : 8;
    ctx.shadowOffsetY = 3;
    ctx.fillStyle = palette.tokenSlab;
    ctx.beginPath();
    ctx.roundRect(x, y, tileW, tileH, cornerR);
    ctx.fill();
    ctx.restore();
  }

  ctx.fillStyle = palette.tokenSlab;
  ctx.beginPath();
  ctx.roundRect(x, y + pose.slabDepth, tileW, tileH, cornerR);
  ctx.fill();

  ctx.fillStyle = montessori.plateMid;
  ctx.strokeStyle = isDimmedIdle ? surface[300] : palette.rimBorder;
  ctx.lineWidth = isDimmedIdle ? 2 : palette.rimBorderWidth;
  ctx.beginPath();
  ctx.roundRect(x, y, tileW, tileH, cornerR);
  ctx.fill();
  ctx.stroke();

  const inset = Math.max(4, Math.round(Math.min(tileW, tileH) * 0.085));
  const innerX = x + inset;
  const innerY = y + inset;
  const innerW = Math.max(12, tileW - inset * 2);
  const innerH = Math.max(12, tileH - inset * 2);
  const innerR = Math.max(6, cornerR - 3);

  ctx.fillStyle =
    state === "idle" ? vnMaterials.doPaper.sheet : palette.tokenFill;
  ctx.strokeStyle = isDimmedIdle ? surface[300] : palette.tokenBorder;
  ctx.lineWidth = isDimmedIdle ? 1.8 : palette.tokenBorderWidth;
  ctx.beginPath();
  ctx.roundRect(innerX, innerY, innerW, innerH, innerR);
  ctx.fill();
  ctx.stroke();

  drawDoPaperFiberMarks(ctx, innerX, innerY, innerW, innerH);

  if (palette.innerRing && !item.representation) {
    ctx.strokeStyle = palette.innerRing;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(
      innerX + 3,
      innerY + 3,
      Math.max(6, innerW - 6),
      Math.max(6, innerH - 6),
      Math.max(4, innerR - 2)
    );
    ctx.stroke();
  }

  const labelReserve = shouldDrawBottomLabel(item) ? 14 : 0;
  const contentInset = item.representation ? 2 : 6;
  const contentSlot: Slot = {
    ...slot,
    x: cx,
    y: cy - labelReserve / 2,
    w: Math.max(16, innerW - contentInset),
    h: Math.max(16, innerH - contentInset - labelReserve),
  };
  ctx.save();
  if (isDimmedIdle) {
    ctx.globalAlpha = 0.72;
  }
  drawPlateBody(ctx, rs, contentSlot, item);
  ctx.restore();

  drawWoodTileOverlays(
    ctx,
    rs,
    { x, y, tileW, tileH, innerW, innerH, contentSlot },
    item,
    palette,
    anim
  );
  ctx.restore();
}

export function drawGT002ChoicePlate(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  slot: Slot,
  slotIndex: number,
  item: RenderItem,
  anim: GT002TokenAnimState
): void {
  if (item.plateVariant === "wood_tile") {
    drawWoodTilePlate(ctx, rs, slot, slotIndex, item, anim);
    return;
  }
  const state: ItemVisualState = item.state ?? "idle";
  const palette = resolveGT002PlatePalette(state);
  const pose = resolveGT002TokenPose(state, slotIndex, rs.reducedMotion, anim);
  const isDimmedIdle = state === "idle" && item.isSoftDimmed === true;

  const hitR = Math.min(slot.hitW, slot.hitH) / 2;
  const baseR = Math.max(12, Math.min(slot.w, slot.h) / 2 - 2);
  const plateR = Math.min(hitR - 5, baseR * pose.scale);
  const innerR = plateR * 0.78;
  const cx = slot.x + pose.dx;
  const cy = slot.y + pose.dy;

  ctx.save();
  if (rs.softShadowsEnabled) {
    ctx.save();
    ctx.shadowColor = alpha(montessori.woodBorder, 0.22);
    ctx.shadowBlur = state === "selected" || state === "correct" ? 14 : 9;
    ctx.shadowOffsetY = 3;
    ctx.fillStyle = palette.tokenSlab;
    ctx.beginPath();
    ctx.arc(cx, cy, plateR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.fillStyle = palette.tokenSlab;
  ctx.beginPath();
  ctx.arc(cx, cy + pose.slabDepth, plateR, 0, Math.PI * 2);
  ctx.fill();

  const { rimGrad, innerGrad } = resolvePlateGradients(
    ctx,
    slot,
    baseR,
    innerR
  );
  ctx.fillStyle = rimGrad;
  ctx.strokeStyle = isDimmedIdle ? surface[300] : palette.rimBorder;
  ctx.lineWidth = isDimmedIdle ? 2 : palette.rimBorderWidth;
  ctx.beginPath();
  ctx.arc(cx, cy, plateR, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = state === "idle" ? innerGrad : palette.tokenFill;
  ctx.strokeStyle = isDimmedIdle ? surface[300] : palette.tokenBorder;
  ctx.lineWidth = isDimmedIdle ? 2 : palette.tokenBorderWidth;
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  if (palette.innerRing) {
    ctx.strokeStyle = palette.innerRing;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(6, innerR - 4), 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.strokeStyle = alpha(surface[0], 0.8);
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(cx, cy, plateR * 0.88, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();

  const innerSize = innerR * 1.72;
  const contentSlot: Slot = {
    ...slot,
    x: cx,
    y: cy,
    w: innerSize,
    h: innerSize,
  };
  ctx.save();
  if (isDimmedIdle) {
    ctx.globalAlpha = 0.72;
  }
  drawPlateBody(ctx, rs, contentSlot, item);
  ctx.restore();

  if (item.isSpeakingPulse === true) {
    drawSpeakingWaveArcs(
      ctx,
      cx,
      cy,
      innerR,
      anim.selectElapsedMs,
      rs.reducedMotion
    );
  }
  if (shouldDrawBottomLabel(item) && item.label) {
    drawSlotLabel(ctx, item.label, contentSlot, rs);
  }
  if (palette.badgeFill && palette.badgeBorder) {
    const badgeR = Math.max(8, Math.min(13, plateR * 0.28));
    const offset = Math.max(0, (plateR - badgeR - 1) * 0.7);
    drawTickBadgeAt(
      ctx,
      cx + offset,
      cy - offset,
      badgeR,
      palette.badgeFill,
      palette.badgeBorder
    );
  }
  ctx.restore();
}

export function drawGT002WrongRing(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  slot: Slot,
  slotIndex: number,
  anim: GT002TokenAnimState,
  plateVariant: GT002PlateVariant = "round_plate"
): void {
  const pose = resolveGT002TokenPose(
    "wrong",
    slotIndex,
    rs.reducedMotion,
    anim
  );
  const prog =
    !anim.isActiveWrong || rs.reducedMotion ? 0.25 : anim.wrongProgress;
  if (plateVariant === "wood_tile") {
    const fade = 1 - Math.min(1, Math.max(0, prog));
    if (fade <= 0) {
      return;
    }
    const ringW = Math.min(slot.hitW - 4, Math.max(24, slot.w - 2));
    const ringH = Math.min(slot.hitH - 4, Math.max(24, slot.h - 2));
    const rx = slot.x + pose.dx - ringW / 2;
    const ry = slot.y + pose.dy - ringH / 2;
    const cornerR = Math.min(20, Math.floor(Math.min(ringW, ringH) * 0.24));
    ctx.save();
    ctx.globalAlpha *= fade;
    ctx.strokeStyle = retry[500];
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(rx, ry, ringW, ringH, cornerR);
    ctx.stroke();
    ctx.restore();
    return;
  }
  const hitR = Math.min(slot.hitW, slot.hitH) / 2;
  const baseR = Math.max(12, Math.min(slot.w, slot.h) / 2 - 2);
  const ringR = Math.min(hitR - 4.5, baseR + 1);
  rs.drawRetryRing(ctx, slot.x + pose.dx, slot.y + pose.dy, ringR, prog);
}
