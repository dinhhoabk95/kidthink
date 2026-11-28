import type { ZoneRect } from "#src/layout/stage-zones";
import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";
import { alpha } from "./color-utils.js";
import { getEmojiSprite, getHeroEmojiSprite } from "./sprite-registry.js";
import { applyCanvasFontAtSize, legibleFontPx } from "./type-scale.js";
import { drawDoPaperFiberMarks } from "./vn-folk-motifs.js";

const VN = designTokens.colors.vnMaterials;
const MONTESSORI = designTokens.colors.montessori;
const SURFACE = designTokens.colors.surface;
const SUCCESS = designTokens.colors.semantic.success;

export const BOOK_SLAB_DEPTH_PX = 4;
export const BOOK_TURN_DURATION_MS = 340;
export const BOOK_SPREAD_ASPECT_THRESHOLD = 1.35;

export interface BookSpreadLayout {
  readonly outerStage: ZoneRect;
  readonly bookRect: ZoneRect;
  readonly innerRect: ZoneRect;
  readonly isHorizontalSpread: boolean;
  readonly spineCoord: number;
  readonly leftOrTopPage: ZoneRect;
  readonly rightOrBottomPage: ZoneRect;
  readonly bookmarkZone: ZoneRect;
  readonly owlStampCenter: {
    readonly x: number;
    readonly y: number;
    readonly r: number;
  };
}

/** Tiến độ trang sách dạng hạt tô dần, không chữ số (`BR-RSP-10`). */
export interface StorybookPageBeads {
  /** Chỉ số trang hiện tại (từ 0). */
  readonly current: number;
  readonly total: number;
}

const PAGE_BEADS_MAX = 10;

/** Số hạt vẽ và số hạt đã tô cho `total` trang, hàm thuần. */
export function resolvePageBeads(beads: StorybookPageBeads): {
  readonly count: number;
  readonly filled: number;
} {
  const total = Math.max(1, beads.total);
  const count = Math.min(PAGE_BEADS_MAX, total);
  const done = Math.min(total, Math.max(0, beads.current) + 1);
  return { count, filled: Math.max(1, Math.ceil((done / total) * count)) };
}

export interface StorybookFrameState {
  readonly currentSegmentIndex: number;
  readonly totalSegments: number;
  readonly isLastReview: boolean;
  readonly conceptLabel?: string;
  readonly pageBeads?: StorybookPageBeads;
  readonly turnProgress: number;
}

/**
 * Tiến độ lật trang giấy dó (`0..1`) từ đồng hồ đếm ngược `pageTurnRemainingMs`.
 * Khi `reducedMotion` bật hoặc hết giờ thì trả `1` (trạng thái mở phẳng tĩnh,
 * 0 thay đổi theo thời gian — `BR-FBK-09`).
 */
export function computeBookTurnProgress(
  pageTurnRemainingMs: number,
  reducedMotion: boolean
): number {
  if (reducedMotion || pageTurnRemainingMs <= 0) {
    return 1;
  }
  if (pageTurnRemainingMs >= BOOK_TURN_DURATION_MS) {
    return 0;
  }
  const raw = 1 - pageTurnRemainingMs / BOOK_TURN_DURATION_MS;
  const inv = 1 - Math.max(0, Math.min(1, raw));
  return 1 - inv * inv * inv;
}

/**
 * Tính bố cục Sách Giấy Dó thích ứng 100% bên trong `stage` (`BR-PSZ-01`, `BR-E000-17`):
 * - `stage.w >= stage.h * 1.35`: Sách Mở Ngang 2 Trang (Trái ↔ Phải).
 * - Portrait / khung hẹp: Sổ Mở Dọc Trên–Dưới để trang dưới luôn đủ bề ngang cho
 *   sàn chạm `96px` CSS (`touchEdge = 158px` logic trên `330x697`).
 */
export function computeResponsiveBookSpread(
  stage: ZoneRect,
  rightOrBottomShare?: number
): BookSpreadLayout {
  const pad = Math.min(
    6,
    Math.max(2, Math.floor(Math.min(stage.w, stage.h) * 0.012))
  );
  const bookX = Math.round(stage.x + pad);
  const bookY = Math.round(stage.y + pad);
  const bookW = Math.max(48, Math.round(stage.w - pad * 2));
  const bookH = Math.max(
    48,
    Math.round(stage.h - pad * 2 - BOOK_SLAB_DEPTH_PX)
  );
  const bookRect: ZoneRect = { x: bookX, y: bookY, w: bookW, h: bookH };

  const coverInset = Math.max(
    4,
    Math.min(7, Math.round(Math.min(bookW, bookH) * 0.018))
  );
  const innerRect: ZoneRect = {
    x: bookX + coverInset,
    y: bookY + coverInset,
    w: Math.max(32, bookW - coverInset * 2),
    h: Math.max(32, bookH - coverInset * 2),
  };

  const headerH = Math.max(22, Math.min(30, Math.round(innerRect.h * 0.082)));
  const owlR = Math.max(8, Math.min(12, Math.floor(headerH * 0.42)));
  const owlStampCenter = {
    x: innerRect.x + owlR + 6,
    y: innerRect.y + Math.round(headerH / 2) + 1,
    r: owlR,
  };
  const bookmarkLeft = owlStampCenter.x + owlR + 8;
  const bookmarkZone: ZoneRect = {
    x: bookmarkLeft,
    y: innerRect.y + 2,
    w: Math.max(24, innerRect.x + innerRect.w - bookmarkLeft - 8),
    h: Math.max(16, headerH - 3),
  };

  const isHorizontalSpread = stage.w >= stage.h * BOOK_SPREAD_ASPECT_THRESHOLD;
  const bodyTop = innerRect.y + headerH + 2;
  const bodyH = Math.max(24, innerRect.y + innerRect.h - bodyTop - 4);

  if (isHorizontalSpread) {
    const share = Math.min(0.68, Math.max(0.45, rightOrBottomShare ?? 0.5));
    const spineGap = 12;
    const usableW = Math.max(40, innerRect.w - 12 - spineGap);
    const rightW = Math.max(20, Math.round(usableW * share));
    const leftW = Math.max(20, usableW - rightW);
    const leftX = innerRect.x + 6;
    const spineCoord = Math.round(leftX + leftW + spineGap / 2);
    return {
      outerStage: stage,
      bookRect,
      innerRect,
      isHorizontalSpread: true,
      spineCoord,
      leftOrTopPage: { x: leftX, y: bodyTop, w: leftW, h: bodyH },
      rightOrBottomPage: {
        x: leftX + leftW + spineGap,
        y: bodyTop,
        w: rightW,
        h: bodyH,
      },
      bookmarkZone,
      owlStampCenter,
    };
  }

  const share = Math.min(0.7, Math.max(0.48, rightOrBottomShare ?? 0.56));
  const creaseGap = 10;
  const usableH = Math.max(40, bodyH - creaseGap);
  const bottomH = Math.max(20, Math.round(usableH * share));
  const topH = Math.max(20, usableH - bottomH);
  const pageX = innerRect.x + 6;
  const pageW = Math.max(24, innerRect.w - 12);
  const spineCoord = Math.round(bodyTop + topH + creaseGap / 2);

  return {
    outerStage: stage,
    bookRect,
    innerRect,
    isHorizontalSpread: false,
    spineCoord,
    leftOrTopPage: { x: pageX, y: bodyTop, w: pageW, h: topH },
    rightOrBottomPage: {
      x: pageX,
      y: bodyTop + topH + creaseGap,
      w: pageW,
      h: bottomH,
    },
    bookmarkZone,
    owlStampCenter,
  };
}

function drawFilledCircle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  fill: string,
  stroke?: string,
  lineW = 1.5
): void {
  if (r <= 0) {
    return;
  }
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineW;
    ctx.stroke();
  }
}

/**
 * Dấu triện tròn Cô Cú tĩnh ở góc trên sách (`BR-E000-15`, `BR-E000-17`):
 * Ưu tiên sprite `owl.webp` (`🦉`), rơi êm về hình cú vector mộc — 0 chữ `"Cú"`,
 * 0 chuyển động tự thân nên không tranh `focusIndex`.
 */
export function drawOwlTeacherSeal(
  ctx: CanvasRenderingContext2D,
  center: { readonly x: number; readonly y: number; readonly r: number }
): void {
  const { x: cx, y: cy, r } = center;
  if (r < 6) {
    return;
  }
  ctx.save();
  drawFilledCircle(
    ctx,
    cx,
    cy,
    r,
    VN.terracotta.glaze,
    VN.terracotta.clay,
    1.8
  );

  const owlSprite = getHeroEmojiSprite("🦉") ?? getEmojiSprite("🦉");
  if (owlSprite) {
    const imgSize = Math.round(r * 1.56);
    ctx.drawImage(
      owlSprite,
      Math.round(cx - imgSize / 2),
      Math.round(cy - imgSize / 2),
      imgSize,
      imgSize
    );
    ctx.restore();
    return;
  }

  // Vector Cô Cú mộc khi môi trường chưa preload sprite (test headless / offline)
  const headR = r * 0.62;
  ctx.fillStyle = VN.woodGrain.bark;
  for (const dir of [-1, 1] as const) {
    ctx.beginPath();
    ctx.moveTo(cx + dir * headR * 0.25, cy - headR * 0.55);
    ctx.lineTo(cx + dir * headR * 0.85, cy - headR * 1.05);
    ctx.lineTo(cx + dir * headR * 0.88, cy - headR * 0.15);
    ctx.closePath();
    ctx.fill();
  }
  drawFilledCircle(ctx, cx, cy + r * 0.06, headR, VN.bamboo.joint);
  for (const dir of [-1, 1] as const) {
    const ex = cx + dir * headR * 0.42;
    const ey = cy + r * 0.02;
    drawFilledCircle(
      ctx,
      ex,
      ey,
      headR * 0.34,
      SURFACE[0],
      VN.woodGrain.bark,
      1
    );
    drawFilledCircle(ctx, ex, ey, headR * 0.16, SURFACE[900]);
  }
  ctx.fillStyle = MONTESSORI.amber;
  ctx.beginPath();
  ctx.moveTo(cx - headR * 0.2, cy + headR * 0.24);
  ctx.lineTo(cx + headR * 0.2, cy + headR * 0.24);
  ctx.lineTo(cx, cy + headR * 0.58);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawLotusBudMarker(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  status: "done" | "current" | "upcoming",
  isReview: boolean
): void {
  let fill: string = VN.doPaper.warm;
  let stroke: string = VN.bamboo.joint;
  let lineW = 1.4;
  if (status === "done") {
    fill = SUCCESS[400];
    stroke = SUCCESS[600];
    lineW = 1.6;
  } else if (status === "current") {
    fill = VN.lotus.bloom;
    stroke = VN.terracotta.fired;
    lineW = 2;
  } else if (isReview) {
    fill = VN.lotus.mist;
    stroke = VN.lotus.bloom;
  }

  ctx.save();
  if (isReview || status === "current") {
    // Bông sen 5 cánh nhỏ cho chặng đang mở & chặng ôn tập cuối bài
    const petalCount = 5;
    const outerR = status === "current" ? r * 1.18 : r * 1.05;
    const innerR = outerR * 0.52;
    ctx.beginPath();
    for (let i = 0; i < petalCount * 2; i++) {
      const rad = i % 2 === 0 ? outerR : innerR;
      const angle = -Math.PI / 2 + (i * Math.PI) / petalCount;
      const px = cx + Math.cos(angle) * rad;
      const py = cy + Math.sin(angle) * rad;
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineW;
    ctx.fill();
    ctx.stroke();
    if (status === "current") {
      drawFilledCircle(ctx, cx, cy, r * 0.34, VN.lotus.pistil);
    }
  } else {
    drawFilledCircle(ctx, cx, cy, r * 0.88, fill, stroke, lineW);
  }
  ctx.restore();
}

/** Vẽ một hàng hạt tiến độ sát `rightLimitX`; trả bề rộng đã chiếm (0 nếu không đủ chỗ). */
function drawPageBeads(
  ctx: CanvasRenderingContext2D,
  zone: ZoneRect,
  cy: number,
  rightLimitX: number,
  beads: { readonly count: number; readonly filled: number }
): number {
  const beadR = 3;
  const beadStep = 9;
  const beadsW = (beads.count - 1) * beadStep + beadR * 2;
  if (beads.count < 2 || rightLimitX - zone.x < beadsW + 56) {
    return 0;
  }
  const startX = rightLimitX - beadsW + beadR;
  for (let i = 0; i < beads.count; i++) {
    drawFilledCircle(
      ctx,
      startX + i * beadStep,
      cy,
      beadR,
      i < beads.filled ? VN.bamboo.deep : alpha(VN.bamboo.deep, 0.25)
    );
  }
  return beadsW + 10;
}

/**
 * Dải Dấu Trang Hoa Sen ở mép trên sách (`vnMaterials.lotus`) thay cho chấm tròn
 * đáy màn cũ (`drawGT000SegmentProgress`), kèm nhãn chủ đề gọn bên trái.
 */
export function drawLotusBookmarkProgress(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  zone: ZoneRect,
  state: StorybookFrameState
): void {
  const cy = Math.round(zone.y + zone.h / 2);
  const count = Math.min(12, Math.max(1, state.totalSegments));
  const dotStep = Math.min(
    18,
    Math.max(11, Math.floor((zone.w * 0.45) / count))
  );
  const r = Math.min(
    6.5,
    Math.max(4.5, Math.min(zone.h * 0.34, dotStep * 0.36))
  );
  const stripW = (count - 1) * dotStep;
  const stripRight = zone.x + zone.w - r - 4;
  const stripStartX = Math.max(zone.x + r + 2, stripRight - stripW);

  ctx.save();
  if (count >= 2) {
    ctx.strokeStyle = alpha(VN.lotus.petal, 0.7);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(stripStartX, cy);
    ctx.lineTo(stripStartX + stripW, cy);
    ctx.stroke();

    for (let i = 0; i < count; i++) {
      let status: "done" | "current" | "upcoming" = "upcoming";
      if (i < state.currentSegmentIndex) {
        status = "done";
      } else if (i === state.currentSegmentIndex) {
        status = "current";
      }
      const isReview = state.isLastReview && i === count - 1;
      drawLotusBudMarker(
        ctx,
        Math.round(stripStartX + i * dotStep),
        cy,
        r,
        status,
        isReview
      );
    }
  }

  let rightLimitX = count >= 2 ? stripStartX - 10 : zone.x + zone.w - 4;
  if (state.pageBeads) {
    rightLimitX -= drawPageBeads(
      ctx,
      zone,
      cy,
      rightLimitX,
      resolvePageBeads(state.pageBeads)
    );
  }

  const label = state.conceptLabel?.trim();
  const availLabelW = rightLimitX - zone.x - 4;
  if (label && availLabelW >= 72) {
    const fontPx = Math.min(
      Math.max(14, zone.h - 2),
      legibleFontPx(16, rs.viewport?.scale)
    );
    applyCanvasFontAtSize(ctx, fontPx, "sans", 600);
    ctx.fillStyle = VN.doPaper.ink;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(label, zone.x + 2, cy, availLabelW);
  }
  ctx.restore();
}

function drawSpineBinding(
  ctx: CanvasRenderingContext2D,
  spread: BookSpreadLayout
): void {
  const { innerRect, isHorizontalSpread, spineCoord, leftOrTopPage } = spread;
  ctx.save();
  if (isHorizontalSpread) {
    const topY = leftOrTopPage.y + 2;
    const botY = leftOrTopPage.y + leftOrTopPage.h - 2;
    ctx.strokeStyle = alpha(VN.bamboo.joint, 0.5);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(spineCoord, topY);
    ctx.lineTo(spineCoord, botY);
    ctx.stroke();

    ctx.strokeStyle = VN.terracotta.clay;
    ctx.lineWidth = 2.5;
    for (const ratio of [0.22, 0.5, 0.78] as const) {
      const sy = Math.round(topY + (botY - topY) * ratio);
      ctx.beginPath();
      ctx.moveTo(spineCoord - 4, sy);
      ctx.lineTo(spineCoord + 4, sy);
      ctx.stroke();
    }
  } else {
    const leftX = innerRect.x + 10;
    const rightX = innerRect.x + innerRect.w - 10;
    ctx.strokeStyle = alpha(VN.bamboo.joint, 0.5);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(leftX, spineCoord);
    ctx.lineTo(rightX, spineCoord);
    ctx.stroke();

    ctx.strokeStyle = VN.terracotta.clay;
    ctx.lineWidth = 2.5;
    for (const ratio of [0.25, 0.5, 0.75] as const) {
      const sx = Math.round(leftX + (rightX - leftX) * ratio);
      ctx.beginPath();
      ctx.moveTo(sx, spineCoord - 3);
      ctx.lineTo(sx, spineCoord + 3);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/**
 * Vẽ khung Sách Giấy Dó Mở Đôi 2.5D bìa tre khâu chỉ, Dải Dấu Trang Hoa Sen
 * và Dấu Triện Cô Cú nằm trọn trong `zones.stage`.
 */
export function drawStorybookSpreadFrame(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  spread: BookSpreadLayout,
  state: StorybookFrameState,
  showSpine = true
): void {
  const { bookRect, innerRect, bookmarkZone, owlStampCenter } = spread;
  const cornerR = Math.min(
    24,
    Math.floor(Math.min(bookRect.w, bookRect.h) * 0.12)
  );
  const pageR = Math.max(10, cornerR - 4);

  ctx.save();
  // 1. Đế bìa gỗ/tre dày 3D (không tràn qua mép dưới stage nhờ đã trừ BOOK_SLAB_DEPTH_PX)
  if (rs.softShadowsEnabled) {
    ctx.shadowColor = alpha(VN.woodGrain.bark, 0.16);
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 3;
  }
  ctx.fillStyle = VN.woodGrain.bark;
  ctx.beginPath();
  ctx.roundRect(
    bookRect.x,
    bookRect.y + BOOK_SLAB_DEPTH_PX,
    bookRect.w,
    bookRect.h,
    cornerR
  );
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // 2. Bìa tre ngà ấm
  ctx.fillStyle = VN.bamboo.deep;
  ctx.strokeStyle = MONTESSORI.woodBorder;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(bookRect.x, bookRect.y, bookRect.w, bookRect.h, cornerR);
  ctx.fill();
  ctx.stroke();

  // 3. Ruột sách giấy dó mộc + vân xơ giấy
  ctx.fillStyle = VN.doPaper.sheet;
  ctx.strokeStyle = VN.bamboo.stalk;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(innerRect.x, innerRect.y, innerRect.w, innerRect.h, pageR);
  ctx.fill();
  ctx.stroke();

  drawDoPaperFiberMarks(
    ctx,
    innerRect.x,
    innerRect.y,
    innerRect.w,
    innerRect.h
  );

  // 4. Đường phân cách nhẹ dưới thanh dấu trang
  const headerBottomY = bookmarkZone.y + bookmarkZone.h + 1;
  ctx.strokeStyle = alpha(VN.bamboo.stalk, 0.65);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(innerRect.x + 10, headerBottomY);
  ctx.lineTo(innerRect.x + innerRect.w - 10, headerBottomY);
  ctx.stroke();

  // 5. Gáy khâu chỉ gốm (ẩn trên single_card 1 trang để thẻ giữa thoáng mắt)
  if (showSpine) {
    drawSpineBinding(ctx, spread);
  }

  // 6. Triện Cô Cú + Dải Dấu Trang Hoa Sen
  drawOwlTeacherSeal(ctx, owlStampCenter);
  drawLotusBookmarkProgress(ctx, rs, bookmarkZone, state);
  ctx.restore();
}

/**
 * Hiệu ứng lật lá giấy dó `340ms` khi sang trang/chương mới (`BR-E000-17`).
 * Khi `reducedMotion` bật, `computeBookTurnProgress` đã trả `1` nên hàm này
 * không vẽ hình động nào (`reduced-motion.test.ts` bất biến 100%).
 */
export function drawStorybookPageTurnOverlay(
  ctx: CanvasRenderingContext2D,
  spread: BookSpreadLayout,
  turnProgress: number,
  reducedMotion: boolean
): void {
  if (turnProgress <= 0 || turnProgress >= 1) {
    return;
  }
  const target = spread.rightOrBottomPage;
  if (target.w < 24 || target.h < 24) {
    return;
  }
  ctx.save();
  if (reducedMotion) {
    ctx.fillStyle = alpha(VN.doPaper.warm, 0.22 * (1 - turnProgress));
    ctx.beginPath();
    ctx.roundRect(target.x, target.y, target.w, target.h, 8);
    ctx.fill();
    ctx.restore();
    return;
  }

  if (spread.isHorizontalSpread) {
    const leafW = Math.max(4, Math.round(target.w * (1 - turnProgress)));
    ctx.fillStyle = alpha(VN.doPaper.warm, 0.86 * (1 - turnProgress * 0.45));
    ctx.strokeStyle = VN.bamboo.joint;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(target.x, target.y, leafW, target.h, 6);
    ctx.fill();
    ctx.stroke();
  } else {
    const leafH = Math.max(4, Math.round(target.h * (1 - turnProgress)));
    ctx.fillStyle = alpha(VN.doPaper.warm, 0.86 * (1 - turnProgress * 0.45));
    ctx.strokeStyle = VN.bamboo.joint;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(target.x, target.y, target.w, leafH, 6);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}
