import type { ZoneRect } from "#src/layout/stage-zones";
import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";
import type {
  GT000RuleMemoryVariant,
  GT000SpatialAnchorProp,
  GT000SpatialRelation,
  GT000ToneMark,
} from "#src/templates/GT-000/scene-board-schema";
import { alpha } from "./color-utils.js";
import {
  drawVisualInBox,
  type GT000ResolvedVisual,
} from "./gt-000-scene-shapes.js";
import { getEmojiSprite } from "./sprite-registry.js";
import {
  applyCanvasFontAtSize,
  applyEmojiFont,
  legibleFontPx,
} from "./type-scale.js";

const COLORS = designTokens.colors;
const VN = COLORS.vnMaterials;
const MONTESSORI = COLORS.montessori;
const SURFACE = COLORS.surface;
const BRAND = COLORS.brand;
const CTA = COLORS.cta;

function drawSpatialProp(
  ctx: CanvasRenderingContext2D,
  prop: GT000SpatialAnchorProp,
  cx: number,
  cy: number,
  w: number,
  h: number,
  relation: GT000SpatialRelation
): void {
  ctx.save();
  if (prop === "wood_table") {
    const topY = cy - h * 0.08;
    const tableW = w * 0.64;
    ctx.fillStyle = VN.woodGrain.ring;
    ctx.strokeStyle = VN.woodGrain.bark;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(cx - tableW / 2, topY, tableW, 10, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillRect(cx - tableW * 0.36, topY + 10, 8, h * 0.32);
    ctx.fillRect(cx + tableW * 0.36 - 8, topY + 10, 8, h * 0.32);
  } else if (prop === "bamboo_box") {
    const boxW = w * 0.44;
    const boxH = h * 0.42;
    ctx.fillStyle = VN.bamboo.light;
    ctx.strokeStyle = VN.bamboo.deep;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(cx - boxW / 2, cy - boxH / 2 + 6, boxW, boxH, 8);
    ctx.fill();
    ctx.stroke();
  } else if (prop === "sedge_fence") {
    const fenceW = w * 0.62;
    const fenceH = h * 0.36;
    ctx.strokeStyle = VN.sedgeMat.trim;
    ctx.fillStyle = VN.sedgeMat.warp;
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      const px = cx - fenceW / 2 + (i * fenceW) / 4;
      ctx.fillRect(px - 4, cy - fenceH / 2, 8, fenceH);
    }
    ctx.fillRect(cx - fenceW / 2, cy - 4, fenceW, 6);
  } else if (prop === "balance_scale") {
    const tilt = relation === "heavier_than" ? -0.18 : 0.14;
    const armHalf = w * 0.32;
    ctx.fillStyle = VN.woodGrain.bark;
    ctx.beginPath();
    ctx.moveTo(cx, cy + 4);
    ctx.lineTo(cx + 12, cy + h * 0.34);
    ctx.lineTo(cx - 12, cy + h * 0.34);
    ctx.closePath();
    ctx.fill();
    ctx.save();
    ctx.translate(cx, cy + 4);
    ctx.rotate(tilt);
    ctx.strokeStyle = VN.bamboo.deep;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(-armHalf, 0);
    ctx.lineTo(armHalf, 0);
    ctx.stroke();
    ctx.restore();
  } else if (prop === "mirror_axis") {
    ctx.strokeStyle = BRAND[400];
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(cx, cy - h * 0.4);
    ctx.lineTo(cx, cy + h * 0.4);
    ctx.stroke();
    ctx.setLineDash([]);
  } else if (prop === "slope_ramp") {
    ctx.fillStyle = VN.woodGrain.ring;
    ctx.strokeStyle = VN.woodGrain.bark;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.34, cy + h * 0.28);
    ctx.lineTo(cx - w * 0.34, cy - h * 0.16);
    ctx.lineTo(cx + w * 0.34, cy + h * 0.28);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    // measure_baseline
    ctx.strokeStyle = VN.terracotta.fired;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.36, cy + h * 0.3);
    ctx.lineTo(cx + w * 0.36, cy + h * 0.3);
    ctx.moveTo(cx - w * 0.32, cy - h * 0.3);
    ctx.lineTo(cx - w * 0.32, cy + h * 0.3);
    ctx.stroke();
  }
  ctx.restore();
}

function resolveSpatialTargetPoint(
  relation: GT000SpatialRelation,
  cx: number,
  cy: number,
  w: number,
  h: number
): { readonly x: number; readonly y: number; readonly scale: number } {
  switch (relation) {
    case "on":
      return { x: cx, y: cy - h * 0.26, scale: 1 };
    case "under":
      return { x: cx, y: cy + h * 0.22, scale: 0.92 };
    case "inside":
      return { x: cx, y: cy + 4, scale: 0.88 };
    case "outside":
    case "right_of":
      return { x: cx + w * 0.32, y: cy, scale: 0.95 };
    case "left_of":
      return { x: cx - w * 0.32, y: cy, scale: 0.95 };
    case "in_front":
      return { x: cx, y: cy + h * 0.18, scale: 1.08 };
    case "behind":
      return { x: cx + w * 0.12, y: cy - h * 0.18, scale: 0.84 };
    case "between":
      return { x: cx, y: cy, scale: 0.96 };
    case "taller_than":
    case "longer_than":
      return { x: cx + w * 0.14, y: cy - h * 0.04, scale: 1.18 };
    case "heavier_than":
      return { x: cx - w * 0.26, y: cy - h * 0.08, scale: 1.06 };
    case "mirror_x":
      return { x: cx + w * 0.24, y: cy, scale: 0.96 };
    case "rotate_90":
      return { x: cx + w * 0.22, y: cy, scale: 0.96 };
    default:
      return { x: cx + w * 0.08, y: cy + h * 0.02, scale: 0.96 };
  }
}

/** Mode 4: `spatial_stage` — Sân khấu Đạo cụ Không gian / Đo lường / Hình học. */
export function drawGT000SpatialStageShowcase(
  ctx: CanvasRenderingContext2D,
  page: ZoneRect,
  params: {
    readonly anchorProp: GT000SpatialAnchorProp;
    readonly relation: GT000SpatialRelation;
    readonly targetVisual: GT000ResolvedVisual | undefined;
  }
): void {
  const cx = Math.round(page.x + page.w / 2);
  const cy = Math.round(page.y + page.h / 2);
  const baseSize = Math.max(
    26,
    Math.min(58, Math.floor(Math.min(page.w, page.h) * 0.32))
  );

  if (params.relation === "behind") {
    const pt = resolveSpatialTargetPoint(
      params.relation,
      cx,
      cy,
      page.w,
      page.h
    );
    drawVisualInBox(ctx, params.targetVisual, pt.x, pt.y, baseSize * pt.scale);
    drawSpatialProp(
      ctx,
      params.anchorProp,
      cx,
      cy,
      page.w,
      page.h,
      params.relation
    );
    return;
  }

  drawSpatialProp(
    ctx,
    params.anchorProp,
    cx,
    cy,
    page.w,
    page.h,
    params.relation
  );

  if (params.relation === "mirror_x" || params.relation === "rotate_90") {
    drawVisualInBox(
      ctx,
      params.targetVisual,
      cx - page.w * 0.24,
      cy,
      baseSize * 0.92
    );
  }
  const pt = resolveSpatialTargetPoint(params.relation, cx, cy, page.w, page.h);
  ctx.save();
  ctx.fillStyle = alpha(MONTESSORI.amberLight, 0.55);
  ctx.strokeStyle = MONTESSORI.amber;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(pt.x, pt.y, baseSize * pt.scale * 0.58, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  if (params.relation === "mirror_x") {
    ctx.translate(pt.x, pt.y);
    ctx.scale(-1, 1);
    ctx.translate(-pt.x, -pt.y);
  } else if (params.relation === "rotate_90") {
    ctx.translate(pt.x, pt.y);
    ctx.rotate(Math.PI / 2);
    ctx.translate(-pt.x, -pt.y);
  }
  drawVisualInBox(ctx, params.targetVisual, pt.x, pt.y, baseSize * pt.scale);
  ctx.restore();
}

function drawToneMarkCurve(
  ctx: CanvasRenderingContext2D,
  tone: GT000ToneMark,
  cx: number,
  cy: number,
  spanW: number
): void {
  const half = Math.max(12, Math.min(28, spanW * 0.32));
  ctx.save();
  ctx.strokeStyle = BRAND[600];
  ctx.fillStyle = BRAND[600];
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  if (tone === "ngang") {
    ctx.moveTo(cx - half, cy);
    ctx.lineTo(cx + half, cy);
    ctx.stroke();
  } else if (tone === "huyen") {
    ctx.moveTo(cx - half, cy - 5);
    ctx.lineTo(cx + half, cy + 5);
    ctx.stroke();
  } else if (tone === "sac") {
    ctx.moveTo(cx - half, cy + 6);
    ctx.lineTo(cx + half, cy - 6);
    ctx.stroke();
  } else if (tone === "hoi") {
    ctx.moveTo(cx - half * 0.6, cy - 6);
    ctx.quadraticCurveTo(cx + half * 0.5, cy - 2, cx, cy + 6);
    ctx.stroke();
  } else if (tone === "nga") {
    ctx.moveTo(cx - half, cy + 2);
    ctx.bezierCurveTo(
      cx - half * 0.3,
      cy - 8,
      cx + half * 0.3,
      cy + 8,
      cx + half,
      cy - 4
    );
    ctx.stroke();
  } else {
    ctx.arc(cx, cy + 2, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Mode 8: `word_phonics_box` — Hình neo nghĩa + Hộp âm tiết/vần + Đường nét dấu thanh. */
export function drawGT000WordPhonicsShowcase(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  page: ZoneRect,
  params: {
    readonly meaningVisual: GT000ResolvedVisual | undefined;
    readonly parts: readonly string[];
    readonly toneMark?: GT000ToneMark;
    readonly exploredCount: number;
  }
): void {
  const cx = Math.round(page.x + page.w / 2);
  const iconSize = Math.max(28, Math.min(64, Math.floor(page.h * 0.38)));
  const iconY = Math.round(page.y + iconSize * 0.58 + 4);
  drawVisualInBox(ctx, params.meaningVisual, cx, iconY, iconSize);

  const count = Math.max(1, params.parts.length);
  const gap = 6;
  const maxBoxW = Math.floor((page.w - 16 - (count - 1) * gap) / count);
  const boxW = Math.max(26, Math.min(72, maxBoxW));
  const boxH = Math.max(28, Math.min(44, Math.floor(page.h * 0.32)));
  const totalW = count * boxW + (count - 1) * gap;
  const startX = Math.round(cx - totalW / 2);
  const boxesY = Math.round(page.y + page.h - boxH - 6);
  const activeIdx =
    params.exploredCount > 0 ? (params.exploredCount - 1) % count : -1;

  if (params.toneMark && boxesY - (iconY + iconSize / 2) >= 14) {
    drawToneMarkCurve(ctx, params.toneMark, cx, boxesY - 9, totalW);
  }

  ctx.save();
  const fontPx = Math.max(
    legibleFontPx(16, rs.viewport?.scale),
    Math.min(26, Math.round(boxH * 0.56))
  );
  applyCanvasFontAtSize(ctx, fontPx, "heading", "bold");
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let i = 0; i < count; i++) {
    const bx = startX + i * (boxW + gap);
    const isLit = i === activeIdx;
    ctx.fillStyle = isLit ? MONTESSORI.amberLight : SURFACE[0];
    ctx.strokeStyle = isLit ? CTA[500] : BRAND[400];
    ctx.lineWidth = isLit ? 3 : 2;
    ctx.beginPath();
    ctx.roundRect(bx, boxesY, boxW, boxH, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = VN.doPaper.ink;
    ctx.fillText(
      params.parts[i] ?? "",
      bx + boxW / 2,
      boxesY + boxH / 2,
      boxW - 6
    );
  }
  ctx.restore();
}

/** Mode 9: `rule_memory_stage` — Úp mở trí nhớ (Nón lá) & Thẻ Tín hiệu Luật Điều hành (EF). */
export function drawGT000RuleMemoryShowcase(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  page: ZoneRect,
  params: {
    readonly variant: GT000RuleMemoryVariant;
    readonly targetVisual: GT000ResolvedVisual | undefined;
    readonly ruleBadgeGlyph?: string;
    readonly ruleLabel?: string;
    readonly exploredCount: number;
  }
): void {
  const cx = Math.round(page.x + page.w / 2);
  const cy = Math.round(page.y + page.h / 2);
  const size = Math.max(
    32,
    Math.min(72, Math.floor(Math.min(page.w, page.h) * 0.44))
  );

  if (params.variant === "peekaboo_cover") {
    drawVisualInBox(ctx, params.targetVisual, cx, cy + 8, size * 0.85);
    // Nón lá úp hờ hoặc nâng cao khi trẻ chạm mở khám phá
    const liftY =
      params.exploredCount % 2 === 1 ? -Math.round(size * 0.48) : -4;
    const hatTopY = Math.max(page.y + 4, cy - size * 0.46 + liftY);
    const hatBrimY = Math.min(page.y + page.h - 6, hatTopY + size * 0.56);
    const hatHalfW = size * 0.68;

    ctx.save();
    ctx.fillStyle = alpha(
      VN.bamboo.stalk,
      params.exploredCount % 2 === 1 ? 0.92 : 0.62
    );
    ctx.strokeStyle = VN.bamboo.deep;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx, hatTopY);
    ctx.lineTo(cx + hatHalfW, hatBrimY);
    ctx.lineTo(cx - hatHalfW, hatBrimY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    return;
  }

  // variant === "rule_signal": Bảng tín hiệu luật ấm áp (0 dùng danger đỏ)
  const plaqueW = Math.max(48, Math.min(page.w - 12, 240));
  const plaqueH = Math.max(40, Math.min(page.h - 12, 84));
  const px = Math.round(cx - plaqueW / 2);
  const py = Math.round(cy - plaqueH / 2);

  ctx.save();
  ctx.fillStyle = BRAND[50];
  ctx.strokeStyle = BRAND[500];
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(px, py, plaqueW, plaqueH, 16);
  ctx.fill();
  ctx.stroke();

  const badgeGlyph = params.ruleBadgeGlyph || "⭐";
  const badgeX = params.ruleLabel ? px + 26 : cx;
  const badgeSprite = getEmojiSprite(badgeGlyph);
  if (badgeSprite) {
    ctx.drawImage(badgeSprite, badgeX - 15, cy - 15, 30, 30);
  } else {
    applyEmojiFont(ctx, 26);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(badgeGlyph, badgeX, cy);
  }

  if (params.ruleLabel && plaqueW >= 110) {
    const fontPx = legibleFontPx(16, rs.viewport?.scale);
    applyCanvasFontAtSize(ctx, fontPx, "sans", "bold");
    ctx.fillStyle = BRAND[900];
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(params.ruleLabel, px + 48, cy, plaqueW - 58);
  }
  ctx.restore();
}
