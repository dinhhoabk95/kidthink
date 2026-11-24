import type { HintLevel } from "#src/game-session";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import { alpha } from "#src/render/color-utils";
import {
  drawGeometricSpecInSlot,
  resolveGeometricTokenColor,
} from "#src/render/geometric-primitives";
import {
  drawDotPattern,
  drawPlaceholderBox,
  drawQuantityRepresentation,
} from "#src/render/numeracy-primitives";
import { drawAssetInSlot } from "#src/render/shared-render";
import { applyCanvasFontAtSize } from "#src/render/type-scale";
import type { RenderAsset } from "#src/render/types";
import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";
import type { GT002StageLayout } from "#src/templates/GT-002/layout";
import type {
  GT002ColorToken,
  GT002CompareRelation,
  GT002Content,
  GT002CriterionAnchor,
  GT002LeafCriterionAnchor,
  GT002SelectionMode,
} from "#src/templates/GT-002/template";

const { brand, montessori, retry, semantic, surface, vnMaterials } =
  designTokens.colors;

export interface GT002CollectedChip {
  readonly asset: RenderAsset;
  readonly colorToken?: GT002ColorToken;
}

export interface GT002HeaderRenderState {
  readonly anchor: GT002CriterionAnchor;
  readonly allowNegated: boolean;
  readonly selectionMode: GT002SelectionMode;
  readonly requiredSelectCount: number;
  readonly selectedChips: readonly GT002CollectedChip[];
  readonly isWon: boolean;
  readonly isWrongFlashing: boolean;
  readonly hintLevel: 0 | HintLevel;
}

const NUMERIC_TEXT_RE = /^\d+$/u;

const COLOR_KEYWORD_MAP: readonly (readonly [RegExp, GT002ColorToken])[] = [
  [/màu\s*hồng|sen/iu, "lotus"],
  [/màu\s*đỏ|quả\s*đỏ|hạt\s*đỏ|\bđỏ\b/iu, "coral"],
  [/màu\s*vàng|màu\s*cam|\bvàng\b|\bcam\b/iu, "amber"],
  [/xanh\s*lá|xanh\s*lục/iu, "emerald"],
  [/xanh\s*dương|xanh\s*biển|xanh\s*lam|da\s*trời/iu, "sky"],
  [/màu\s*tím|chàm|\btím\b/iu, "indigo"],
  [/gốm|đất\s*nung/iu, "terracotta"],
  [/màu\s*nâu|\bgỗ\b/iu, "wood"],
];

const COMPARE_KEYWORD_MAP: readonly (readonly [
  RegExp,
  GT002CompareRelation,
])[] = [
  [/dài\s*(hơn|nhất)|\bdài\b/iu, "longer"],
  [/ngắn\s*(hơn|nhất)|\bngắn\b/iu, "shorter"],
  [/cao\s*(hơn|nhất)|\bcao\b/iu, "taller"],
  [/thấp\s*(hơn|nhất)|\bthấp\b|\blùn\b/iu, "shorter"],
  [/nặng\s*(hơn|nhất)|\bnặng\b/iu, "heavier"],
  [/nhẹ\s*(hơn|nhất)|\bnhẹ\b/iu, "lighter"],
  [/đầy\s*(hơn|nhất)|\bđầy\b/iu, "fuller"],
  [/vơi|rỗng|cạn/iu, "emptier"],
  [/to\s*(hơn|nhất)|lớn\s*(hơn|nhất)|\bto\b|\blớn\b/iu, "larger"],
  [/nhỏ\s*(hơn|nhất)|bé\s*(hơn|nhất)|\bnhỏ\b/iu, "smaller"],
];

export function inferFallbackCriterionAnchor(
  content: GT002Content,
  _themeId?: string
): GT002CriterionAnchor {
  if (content.criterion_anchor) {
    return content.criterion_anchor;
  }
  const correctItems = content.items.filter((item) => item.is_correct);
  const firstCorrect = correctItems[0];
  if (firstCorrect?.geometric_spec) {
    return {
      kind: "shape",
      form: firstCorrect.geometric_spec.form,
      color_token: firstCorrect.geometric_spec.color_token,
    };
  }
  if (firstCorrect?.representation) {
    return {
      kind: "quantity",
      count: firstCorrect.representation.count,
      representation: firstCorrect.representation,
    };
  }
  if (firstCorrect?.asset.kind === "text") {
    const raw = firstCorrect.asset.text.trim();
    if (NUMERIC_TEXT_RE.test(raw)) {
      return { kind: "quantity", count: Math.min(20, Number(raw)) };
    }
    return {
      kind: "phonics",
      symbol_text: raw.slice(0, 12) || "a",
      cue_asset: firstCorrect.secondary_asset,
    };
  }
  const textCue = `${content.target_criterion} ${content.prompt}`;
  for (const [pattern, token] of COLOR_KEYWORD_MAP) {
    if (pattern.test(textCue)) {
      return { kind: "color", color_token: token };
    }
  }
  for (const [pattern, relation] of COMPARE_KEYWORD_MAP) {
    if (pattern.test(textCue)) {
      return {
        kind: "size_compare",
        relation,
        reference_asset: firstCorrect?.asset,
      };
    }
  }
  return {
    kind: "category",
    cue_asset: firstCorrect?.asset,
    secondary_cue_asset: correctItems[1]?.asset,
  };
}

function makeMiniSlot(cx: number, cy: number, w: number, h = w): Slot {
  const [sw, sh] = [Math.max(8, Math.round(w)), Math.max(8, Math.round(h))];
  return {
    index: -1,
    x: Math.round(cx),
    y: Math.round(cy),
    w: sw,
    h: sh,
    hitW: sw,
    hitH: sh,
    page: 0,
    role: "neutral",
  };
}

function drawSafeMiniAsset(
  ctx: CanvasRenderingContext2D,
  asset: RenderAsset | undefined,
  slot: Slot,
  scale = 0.84
): void {
  if (!(asset && drawAssetInSlot(ctx, asset, slot, scale))) {
    drawPlaceholderBox(ctx, slot);
  }
}

function paintCircle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  fill: string,
  stroke?: string,
  lineWidth = 1.8
): void {
  ctx.save();
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
  ctx.restore();
}

function drawColorCriterion(
  ctx: CanvasRenderingContext2D,
  slot: Slot,
  token: GT002ColorToken
): void {
  const pal = resolveGeometricTokenColor(token);
  const r = Math.max(6, Math.min(slot.w, slot.h) * 0.38);
  paintCircle(
    ctx,
    slot.x,
    slot.y,
    r,
    pal.fill,
    pal.stroke,
    Math.max(1.8, r * 0.16)
  );
  paintCircle(
    ctx,
    slot.x - r * 0.28,
    slot.y - r * 0.28,
    r * 0.24,
    pal.highlight
  );
}

function isSmallSideFocused(
  sizeTier?: "small" | "medium" | "large",
  relation?: GT002CompareRelation
): boolean {
  return (
    sizeTier === "small" ||
    relation === "smaller" ||
    relation === "shorter" ||
    relation === "lighter" ||
    relation === "emptier"
  );
}

function drawSizeCompareCriterion(
  ctx: CanvasRenderingContext2D,
  slot: Slot,
  anchor: Extract<GT002LeafCriterionAnchor, { kind: "size_compare" }>
): void {
  const small = isSmallSideFocused(anchor.size_tier, anchor.relation);
  const u = Math.min(slot.w, slot.h);
  const off = Math.max(6, slot.w * 0.24);
  for (const [dx, dy, r, on] of [
    [slot.x - off, slot.y + u * 0.1, Math.max(3.5, u * 0.16), small],
    [slot.x + off * 0.85, slot.y, Math.max(6, u * 0.31), !small],
  ] as const) {
    paintCircle(
      ctx,
      dx,
      dy,
      r,
      on ? montessori.amber : surface[200],
      on ? montessori.amberDark : surface[400],
      on ? 2.2 : 1.5
    );
  }
}

function drawCategoryCriterion(
  ctx: CanvasRenderingContext2D,
  slot: Slot,
  anchor: Extract<GT002LeafCriterionAnchor, { kind: "category" }>
): void {
  if (anchor.cue_asset && anchor.secondary_cue_asset && slot.w >= 34) {
    const subSize = Math.min(slot.h * 0.88, slot.w * 0.48);
    const dx = slot.w * 0.22;
    drawSafeMiniAsset(
      ctx,
      anchor.cue_asset,
      makeMiniSlot(slot.x - dx, slot.y, subSize),
      0.86
    );
    drawSafeMiniAsset(
      ctx,
      anchor.secondary_cue_asset,
      makeMiniSlot(slot.x + dx, slot.y, subSize),
      0.86
    );
    return;
  }
  if (anchor.cue_asset) {
    drawSafeMiniAsset(ctx, anchor.cue_asset, slot, 0.86);
    return;
  }
  drawColorCriterion(ctx, slot, "amber");
}

function drawPhonicsCriterion(
  ctx: CanvasRenderingContext2D,
  slot: Slot,
  anchor: Extract<GT002LeafCriterionAnchor, { kind: "phonics" }>
): void {
  const hasCue = Boolean(anchor.cue_asset) && slot.w >= 38;
  const textX = hasCue ? slot.x - slot.w * 0.2 : slot.x;
  const fontPx = Math.max(16, Math.min(22, Math.floor(slot.h * 0.56)));
  ctx.save();
  ctx.fillStyle = vnMaterials.doPaper.ink;
  applyCanvasFontAtSize(ctx, fontPx, "heading", "bold");
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(
    anchor.symbol_text,
    textX,
    slot.y,
    hasCue ? slot.w * 0.52 : slot.w * 0.88
  );
  ctx.restore();

  if (hasCue && anchor.cue_asset) {
    const iconSize = Math.min(slot.h * 0.82, slot.w * 0.42);
    drawSafeMiniAsset(
      ctx,
      anchor.cue_asset,
      makeMiniSlot(slot.x + slot.w * 0.24, slot.y, iconSize),
      0.85
    );
  }
}

function drawNegationSlash(ctx: CanvasRenderingContext2D, slot: Slot): void {
  const half = Math.max(5, Math.min(slot.w, slot.h) * 0.36);
  ctx.save();
  ctx.lineCap = "round";
  ctx.strokeStyle = surface[0];
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.moveTo(slot.x - half, slot.y - half);
  ctx.lineTo(slot.x + half, slot.y + half);
  ctx.stroke();

  ctx.strokeStyle = retry[600];
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(slot.x - half, slot.y - half);
  ctx.lineTo(slot.x + half, slot.y + half);
  ctx.stroke();
  ctx.restore();
}

function drawQuantityCriterion(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  slot: Slot,
  anchor: Extract<GT002LeafCriterionAnchor, { kind: "quantity" }>
): void {
  const clamped = Math.max(0, Math.min(20, anchor.count));
  const rep =
    anchor.representation ??
    (clamped > 6
      ? { kind: "ten-frame" as const, count: Math.min(10, clamped) }
      : { kind: "dot-pattern" as const, count: Math.max(1, clamped) });
  const pad = Math.min(3, Math.floor(Math.min(slot.w, slot.h) * 0.1));
  const iw = Math.max(8, slot.w - pad * 2);
  const ih = Math.max(8, slot.h - pad * 2);
  if (rep.kind === "dot-pattern" && rep.count <= 6) {
    const side = Math.min(iw, ih);
    drawDotPattern(
      ctx,
      { x: slot.x - side / 2, y: slot.y - side / 2, w: side, h: side },
      rep.count,
      { frame: false, dotRadius: Math.max(1.5, side * 0.1) }
    );
    return;
  }
  const innerSlot = makeMiniSlot(slot.x, slot.y, iw, ih);
  if (!drawQuantityRepresentation(ctx, rs, innerSlot, rep)) {
    drawColorCriterion(ctx, slot, "amber");
  }
}

function drawLeafCriterion(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  slot: Slot,
  anchor: GT002LeafCriterionAnchor,
  allowNegated: boolean
): void {
  if (anchor.kind === "color") {
    drawColorCriterion(ctx, slot, anchor.color_token);
  } else if (anchor.kind === "shape") {
    drawGeometricSpecInSlot(ctx, rs, slot, {
      form: anchor.form,
      color_token: anchor.color_token ?? "indigo",
    });
  } else if (anchor.kind === "size_compare") {
    drawSizeCompareCriterion(ctx, slot, anchor);
  } else if (anchor.kind === "quantity") {
    drawQuantityCriterion(ctx, rs, slot, anchor);
  } else if (anchor.kind === "category") {
    drawCategoryCriterion(ctx, slot, anchor);
  } else if (anchor.kind === "phonics") {
    drawPhonicsCriterion(ctx, slot, anchor);
  }
  if (allowNegated && anchor.negated === true) {
    drawNegationSlash(ctx, slot);
  }
}

function drawConjunctionCriterion(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  box: ZoneRect,
  anchor: Extract<GT002CriterionAnchor, { kind: "conjunction" }>,
  allowNegated: boolean
): void {
  const [first, second] = anchor.clauses;
  if (!(first && second)) {
    return;
  }
  const draw = (s: Slot, leaf: GT002LeafCriterionAnchor): void =>
    drawLeafCriterion(ctx, rs, s, leaf, allowNegated);
  const [cx, cy] = [box.x + box.w / 2, box.y + box.h / 2];
  if (box.w <= 36) {
    const m = Math.max(
      9,
      Math.min(Math.floor((box.w - 4) / 2), Math.floor(box.h * 0.56))
    );
    const [dx, dy] = [
      Math.max(4.5, (box.w - m) * 0.44),
      Math.max(1.5, (box.h - m) * 0.22),
    ];
    draw(makeMiniSlot(cx - dx, cy - dy, m, m), first);
    draw(makeMiniSlot(cx + dx, cy + dy, m, m), second);
    return;
  }
  const [sw, sh] = [
    Math.max(14, Math.floor((box.w - 16) / 2)),
    Math.max(14, box.h - 4),
  ];
  draw(makeMiniSlot(box.x + 2 + sw / 2, cy, sw, sh), first);
  draw(makeMiniSlot(box.x + box.w - 2 - sw / 2, cy, sw, sh), second);
  ctx.strokeStyle = vnMaterials.bamboo.deep;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.beginPath();
  if (anchor.operator === "or") {
    ctx.moveTo(cx - 2.5, cy + 4);
    ctx.lineTo(cx + 2.5, cy - 4);
  } else {
    ctx.moveTo(cx - 3, cy);
    ctx.lineTo(cx + 3, cy);
    ctx.moveTo(cx, cy - 3);
    ctx.lineTo(cx, cy + 3);
  }
  ctx.stroke();
}

export function drawGT002CriterionPictogram(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  box: ZoneRect,
  anchor: GT002CriterionAnchor,
  allowNegated: boolean
): void {
  const clipR = Math.min(10, Math.floor(Math.min(box.w, box.h) * 0.32));
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(box.x, box.y, box.w, box.h, clipR);
  ctx.clip();
  const slot = makeMiniSlot(
    box.x + box.w / 2,
    box.y + box.h / 2,
    box.w - 2,
    box.h - 2
  );
  if (anchor.kind === "conjunction") {
    drawConjunctionCriterion(ctx, rs, box, anchor, allowNegated);
    if (allowNegated && anchor.negated === true) {
      drawNegationSlash(ctx, slot);
    }
  } else {
    drawLeafCriterion(ctx, rs, slot, anchor, allowNegated);
  }
  ctx.restore();
}

function drawMiniChip(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  chip: GT002CollectedChip | undefined,
  borderColor: string,
  fillColor: string
): void {
  paintCircle(ctx, cx, cy, radius, fillColor, borderColor, 1.8);
  if (!chip) {
    return;
  }
  if (chip.colorToken) {
    const pal = resolveGeometricTokenColor(chip.colorToken);
    paintCircle(ctx, cx, cy, radius * 0.56, pal.fill);
    return;
  }
  if (chip.asset.kind === "text") {
    paintCircle(ctx, cx, cy, radius * 0.45, brand[500]);
  } else {
    drawSafeMiniAsset(
      ctx,
      chip.asset,
      makeMiniSlot(cx, cy, radius * 1.72),
      0.8
    );
  }
}

/** Mẹt Tre Mở Co Giãn (`all_matching`): không lộ `x/N` trước khi commit. */
function drawExpandingHarvestMat(
  ctx: CanvasRenderingContext2D,
  matBox: ZoneRect,
  state: GT002HeaderRenderState
): void {
  if (matBox.w < 24 || matBox.h < 16) {
    return;
  }
  const chips = state.selectedChips;
  const chipR = Math.max(7, Math.min(12, Math.floor(matBox.h * 0.36)));
  const step = chipR * 2 + 4;
  const desiredW =
    chips.length === 0
      ? Math.min(matBox.w, Math.max(44, Math.round(matBox.h * 1.7)))
      : Math.min(matBox.w, Math.max(48, chips.length * step + 18));
  const pillX = matBox.x + matBox.w - desiredW;
  const pillY = matBox.y + 2;
  const pillH = Math.max(14, matBox.h - 4);
  const r = Math.min(14, Math.floor(pillH / 2));

  ctx.save();
  ctx.fillStyle = state.isWon
    ? semantic.success[50]
    : vnMaterials.sedgeMat.base;
  ctx.strokeStyle = state.isWon
    ? semantic.success[500]
    : vnMaterials.sedgeMat.trim;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, desiredW, pillH, r);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = alpha(vnMaterials.sedgeMat.weft, 0.42);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pillX + r, pillY + pillH * 0.5);
  ctx.lineTo(pillX + desiredW - r, pillY + pillH * 0.5);
  ctx.stroke();
  ctx.restore();

  if (chips.length === 0) {
    return;
  }
  const availW = Math.max(12, desiredW - 16);
  const effStep =
    chips.length > 1
      ? Math.min(step, (availW - chipR * 2) / (chips.length - 1))
      : 0;
  const totalSpan = chipR * 2 + Math.max(0, chips.length - 1) * effStep;
  const startCx = pillX + (desiredW - totalSpan) / 2 + chipR;
  const cy = pillY + pillH / 2;
  const rim = state.isWon ? semantic.success[600] : brand[400];
  const fill = state.isWon ? semantic.success[100] : surface[0];

  for (let i = 0; i < chips.length; i++) {
    drawMiniChip(ctx, startCx + i * effStep, cy, chipR, chips[i], rim, fill);
  }
}

/** Khay Gỗ N Hốc Tròn (`exact_count`): chọn dư quá `N` hiện hạt viền hổ phách. */
function drawExactCountSocketTray(
  ctx: CanvasRenderingContext2D,
  trayBox: ZoneRect,
  state: GT002HeaderRenderState
): void {
  if (trayBox.w < 28 || trayBox.h < 16) {
    return;
  }
  const targetN = Math.max(1, Math.min(6, state.requiredSelectCount));
  const totalVisible = Math.max(
    targetN,
    Math.min(8, state.selectedChips.length)
  );
  const pillY = trayBox.y + 2;
  const pillH = Math.max(14, trayBox.h - 4);
  const rawR = Math.min(
    Math.floor(pillH * 0.36),
    Math.floor((trayBox.w - 16) / (totalVisible * 2.35))
  );
  const sockR = Math.max(5.5, Math.min(11, rawR));
  const step = sockR * 2 + 4;
  const trayW = Math.min(trayBox.w, Math.max(44, totalVisible * step + 14));
  const trayX = trayBox.x + trayBox.w - trayW;
  const cornerR = Math.min(12, Math.floor(pillH / 2));

  ctx.save();
  ctx.fillStyle = vnMaterials.woodGrain.surface;
  ctx.strokeStyle = montessori.woodBorder;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(trayX, pillY, trayW, pillH, cornerR);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  const totalSpan = sockR * 2 + Math.max(0, totalVisible - 1) * step;
  const startCx = trayX + (trayW - totalSpan) / 2 + sockR;
  const cy = pillY + pillH / 2;

  for (let i = 0; i < totalVisible; i++) {
    const cx = startCx + i * step;
    const chip = state.selectedChips[i];
    const isOverflow = i >= targetN;
    if (!chip) {
      ctx.save();
      ctx.fillStyle = montessori.slotRecess;
      ctx.strokeStyle = vnMaterials.bamboo.joint;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 2]);
      ctx.beginPath();
      ctx.arc(cx, cy, sockR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      continue;
    }
    let rim: string = brand[400];
    let fill: string = surface[0];
    if (isOverflow) {
      rim = retry[500];
      fill = retry[100];
    } else if (state.isWon) {
      rim = semantic.success[600];
      fill = semantic.success[100];
    }
    drawMiniChip(ctx, cx, cy, sockR, chip, rim, fill);
  }
}

function resolveHeaderStroke(
  isWrongFlashing: boolean,
  isHighlighted: boolean
): string {
  if (isWrongFlashing) {
    return retry[500];
  }
  return isHighlighted ? montessori.amber : vnMaterials.bamboo.stalk;
}

function drawSoftCard(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  rect: ZoneRect,
  r: number,
  fill: string,
  stroke: string,
  lineWidth: number,
  blur: number
): void {
  ctx.save();
  if (rs.softShadowsEnabled) {
    ctx.save();
    ctx.shadowColor = alpha(montessori.woodBorder, 0.15);
    ctx.shadowBlur = blur;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = vnMaterials.doPaper.sheet;
    ctx.beginPath();
    ctx.roundRect(rect.x, rect.y, rect.w, rect.h, r);
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.roundRect(rect.x, rect.y, rect.w, rect.h, r);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawHeaderCollection(
  ctx: CanvasRenderingContext2D,
  matBox: ZoneRect,
  state: GT002HeaderRenderState
): void {
  if (state.selectionMode === "exact_count") {
    drawExactCountSocketTray(ctx, matBox, state);
  } else {
    drawExpandingHarvestMat(ctx, matBox, state);
  }
}

export function drawGT002CriterionHeader(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  stageLayout: GT002StageLayout,
  state: GT002HeaderRenderState
): void {
  const rect = stageLayout.criterionHeaderRect;
  if (rect.w < 24 || rect.h < 20) {
    return;
  }
  const hi = state.isWrongFlashing || (state.hintLevel >= 1 && !state.isWon);
  const r = Math.min(18, Math.floor(Math.min(rect.w, rect.h) / 2));
  const fill = hi ? montessori.amberGlow : vnMaterials.doPaper.sheet;
  const stroke = resolveHeaderStroke(state.isWrongFlashing, hi);
  drawSoftCard(ctx, rs, rect, r, fill, stroke, hi ? 3 : 2.5, 8);
  const drawPicto = (box: ZoneRect): void =>
    drawGT002CriterionPictogram(ctx, rs, box, state.anchor, state.allowNegated);

  if (stageLayout.headerPlacement === "side") {
    const ah = Math.max(20, Math.min(rect.w - 8, Math.floor(rect.h * 0.42)));
    const aBox: ZoneRect = {
      x: rect.x + 4,
      y: rect.y + 6,
      w: rect.w - 8,
      h: ah,
    };
    drawPicto(aBox);
    const mt = aBox.y + aBox.h + 6;
    const mh = Math.min(34, Math.max(18, rect.y + rect.h - mt - 6));
    drawHeaderCollection(
      ctx,
      { x: rect.x + 4, y: mt, w: rect.w - 8, h: mh },
      state
    );
    return;
  }

  const ratio = state.anchor.kind === "conjunction" ? 1.85 : 1.45;
  const aw = Math.min(
    Math.max(40, Math.round(rect.h * ratio)),
    Math.floor(rect.w * 0.44)
  );
  const ah = Math.max(16, rect.h - 6);
  const aBox: ZoneRect = { x: rect.x + 8, y: rect.y + 3, w: aw, h: ah };
  ctx.save();
  ctx.fillStyle = surface[0];
  ctx.strokeStyle = vnMaterials.bamboo.joint;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(aBox.x, aBox.y, aw, ah, Math.min(12, Math.floor(ah / 2)));
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  drawPicto(aBox);
  const ml = aBox.x + aw + 8;
  const mw = Math.max(0, rect.x + rect.w - 8 - ml);
  drawHeaderCollection(ctx, { x: ml, y: rect.y + 3, w: mw, h: ah }, state);
}

export function drawGT002ActionCornerPin(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  pinRect: ZoneRect,
  anchor: GT002CriterionAnchor,
  allowNegated: boolean
): void {
  if (pinRect.w < 20 || pinRect.h < 20) {
    return;
  }
  const r = Math.min(10, Math.floor(Math.min(pinRect.w, pinRect.h) * 0.34));
  drawSoftCard(
    ctx,
    rs,
    pinRect,
    r,
    vnMaterials.doPaper.sheet,
    vnMaterials.bamboo.joint,
    2,
    6
  );
  const inner: ZoneRect = {
    x: pinRect.x + 3,
    y: pinRect.y + 3,
    w: Math.max(12, pinRect.w - 6),
    h: Math.max(12, pinRect.h - 6),
  };
  drawGT002CriterionPictogram(ctx, rs, inner, anchor, allowNegated);
}

export function drawGT002CriterionHintRegion(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  stageLayout: GT002StageLayout,
  timeMs: number
): void {
  const rect = stageLayout.criterionHeaderRect;
  const bounds = stageLayout.bounds;
  const [cx, cy] = [rect.x + rect.w / 2, rect.y + rect.h / 2];
  const pulsePhase = (Math.max(0, timeMs) % 1000) / 1000;
  const wave = rs.reducedMotion ? 0 : Math.sin(pulsePhase * Math.PI * 2);
  const pulseScale = 1 + wave * 0.06;
  const maxRw = Math.max(
    16,
    Math.min(cx - bounds.x - 2, bounds.x + bounds.w - cx - 2) * 2
  );
  const maxRh = Math.max(
    16,
    Math.min(cy - bounds.y - 2, bounds.y + bounds.h - cy - 2) * 2
  );
  const targetRw = Math.min(maxRw, rect.w + 6 + wave * 2);
  const targetRh = Math.min(maxRh, rect.h + 6 + wave * 1.5);
  rs.renderScaffoldingRegion(
    ctx,
    cx,
    cy,
    Math.max(4, targetRw / pulseScale - 12),
    Math.max(4, targetRh / pulseScale - 12),
    pulsePhase
  );
}
