import type { AgeBand } from "#src/contracts/types";
import type { GameAction } from "#src/game-session";
import type { ViewEntity } from "#src/interaction";
import { resolveAssetLabels } from "#src/labels/spoken-keyword";
import { resolveTouchFloor, SLOT_GAP_PX } from "#src/layout/constants";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot, SlotRole } from "#src/layout/types";
import type { ItemVisualState, RenderAsset } from "#src/render/index.js";
import type { Particle } from "#src/systems/render-system";
import type { GT005Content } from "./template.js";

const MAX_SLOT_W = 120;
const MAX_SLOT_H = 90;
const CLAY_SLAB_PX = 5;

export type GT005SideItem = GT005Content["pairs"][number]["left"];
export type GT005CardAsset =
  | RenderAsset
  | { readonly kind: "audio"; readonly path: string };
export type GT005AnchorSide = "left" | "right" | "top" | "bottom";
export type GT005CardVisualState =
  | "idle"
  | "touching"
  | "selected"
  | "correct"
  | "wrong";

export interface GT005CardAnchor {
  readonly x: number;
  readonly y: number;
  readonly side: GT005AnchorSide;
}

export interface GT005CardPalette {
  readonly fill: string;
  readonly rim: string;
  readonly base: string;
  readonly innerRim: string | null;
  readonly lineWidth: number;
}

export interface GT005CardPose {
  readonly offsetX: number;
  readonly offsetY: number;
  readonly scale: number;
  readonly baseLift: number;
  readonly shadowBlur: number;
}

export interface GT005CardPoseInput {
  readonly state: GT005CardVisualState;
  readonly slotIndex: number;
  readonly timeMs: number;
  readonly stagedAtMs: number | null;
  readonly matchedAtMs: number | null;
  readonly wrongProgress: number | null;
  readonly reducedMotion: boolean;
}

export interface GT005PairCardOptions {
  readonly id: string;
  readonly asset: GT005CardAsset;
  readonly state: GT005CardVisualState;
  readonly timeMs: number;
  readonly stagedAtMs: number | null;
  readonly matchedAtMs: number | null;
  readonly wrongProgress: number | null;
  readonly accentColor: string | null;
  readonly anchorSide: GT005AnchorSide;
  readonly stageRect?: ZoneRect;
}

export interface GT005CardBox {
  readonly slotIndex: number;
  readonly innerSlot: Slot;
  readonly cx: number;
  readonly cy: number;
  readonly rx: number;
  readonly ry: number;
  readonly w: number;
  readonly h: number;
  readonly r: number;
  readonly auraR: number;
  readonly ringR: number;
  readonly pegX: number;
  readonly pegY: number;
  readonly badgeX: number;
  readonly badgeY: number;
  readonly badgeR: number;
}

export interface GT005RopeCurve {
  readonly p1: { readonly x: number; readonly y: number };
  readonly p2: { readonly x: number; readonly y: number };
  readonly ctrl: { readonly x: number; readonly y: number };
  readonly dist: number;
}

interface PairColumnsInput {
  readonly stage: ZoneRect;
  readonly ageBand: AgeBand;
  readonly cssPerLogic?: number;
  readonly leftCount: number;
  readonly rightCount: number;
}

interface SideBlock {
  readonly count: number;
  readonly originX: number;
  readonly width: number;
  readonly role: SlotRole;
  readonly firstIndex: number;
}

function rowsPerColumn(height: number, floor: number): number {
  return Math.max(
    1,
    Math.floor((height + SLOT_GAP_PX) / (floor + SLOT_GAP_PX))
  );
}

function layoutBlock(
  block: SideBlock,
  stage: ZoneRect,
  floor: number,
  rows: number
): Slot[] {
  const subCols = Math.max(1, Math.ceil(block.count / rows));
  const rowsInCol = Math.min(rows, block.count);
  const slotW = Math.floor(
    Math.max(
      floor,
      Math.min(
        MAX_SLOT_W,
        (block.width - (subCols - 1) * SLOT_GAP_PX) / subCols
      )
    )
  );
  const slotH = Math.floor(
    Math.max(
      floor,
      Math.min(
        MAX_SLOT_H,
        (stage.h - (rowsInCol - 1) * SLOT_GAP_PX) / rowsInCol
      )
    )
  );
  const totalW = subCols * slotW + (subCols - 1) * SLOT_GAP_PX;
  const totalH = rowsInCol * slotH + (rowsInCol - 1) * SLOT_GAP_PX;
  const startX = Math.round(block.originX + (block.width - totalW) / 2);
  const startY = Math.round(stage.y + (stage.h - totalH) / 2);
  const slots: Slot[] = [];
  for (let i = 0; i < block.count; i++) {
    const col = Math.floor(i / rows);
    const row = i % rows;
    slots.push({
      index: block.firstIndex + i,
      x: Math.round(startX + col * (slotW + SLOT_GAP_PX) + slotW / 2),
      y: Math.round(startY + row * (slotH + SLOT_GAP_PX) + slotH / 2),
      w: Math.round(slotW),
      h: Math.round(slotH),
      hitW: Math.max(floor, Math.round(slotW)),
      hitH: Math.max(floor, Math.round(slotH)),
      page: 0,
      role: block.role,
    });
  }
  return slots;
}

function layoutHorizontalBand(
  count: number,
  cols: number,
  slotW: number,
  slotH: number,
  floor: number,
  stage: ZoneRect,
  startY: number,
  role: SlotRole,
  firstIndex: number
): Slot[] {
  const usedCols = Math.min(cols, count);
  const totalW = usedCols * slotW + (usedCols - 1) * SLOT_GAP_PX;
  const startX = Math.round(stage.x + (stage.w - totalW) / 2);
  const slots: Slot[] = [];
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    slots.push({
      index: firstIndex + i,
      x: Math.round(startX + col * (slotW + SLOT_GAP_PX) + slotW / 2),
      y: Math.round(startY + row * (slotH + SLOT_GAP_PX) + slotH / 2),
      w: Math.round(slotW),
      h: Math.round(slotH),
      hitW: Math.max(floor, Math.round(slotW)),
      hitH: Math.max(floor, Math.round(slotH)),
      page: 0,
      role,
    });
  }
  return slots;
}

function tryLayoutTopBottom(
  stage: ZoneRect,
  floor: number,
  leftCount: number,
  rightCount: number
): Slot[] | null {
  const cols = Math.max(
    1,
    Math.floor((stage.w + SLOT_GAP_PX) / (floor + SLOT_GAP_PX))
  );
  const topRows = Math.max(1, Math.ceil(leftCount / cols));
  const botRows = Math.max(1, Math.ceil(rightCount / cols));
  const totalRows = topRows + botRows;
  const neededW = cols * floor + (cols - 1) * SLOT_GAP_PX;
  const neededH = totalRows * floor + (totalRows - 1) * SLOT_GAP_PX;
  if (neededW > stage.w || neededH > stage.h) {
    return null;
  }
  const slotW = Math.floor(
    Math.max(
      floor,
      Math.min(MAX_SLOT_W, (stage.w - (cols - 1) * SLOT_GAP_PX) / cols)
    )
  );
  const slotH = Math.floor(
    Math.max(
      floor,
      Math.min(
        MAX_SLOT_H,
        (stage.h - (totalRows - 1) * SLOT_GAP_PX) / totalRows
      )
    )
  );
  const topTotalH = topRows * slotH + (topRows - 1) * SLOT_GAP_PX;
  const botTotalH = botRows * slotH + (botRows - 1) * SLOT_GAP_PX;
  const groupGap = Math.max(
    SLOT_GAP_PX,
    Math.min(36, Math.floor((stage.h - topTotalH - botTotalH) * 0.5))
  );
  const combinedH = topTotalH + groupGap + botTotalH;
  const topStartY = Math.round(stage.y + (stage.h - combinedH) / 2);
  const botStartY = topStartY + topTotalH + groupGap;

  return [
    ...layoutHorizontalBand(
      leftCount,
      cols,
      slotW,
      slotH,
      floor,
      stage,
      topStartY,
      "source",
      0
    ),
    ...layoutHorizontalBand(
      rightCount,
      cols,
      slotW,
      slotH,
      floor,
      stage,
      botStartY,
      "target",
      leftCount
    ),
  ];
}

export interface HitProbe {
  readonly x: number;
  readonly y: number;
  readonly hitTolerance: number;
  readonly minW: number;
  readonly minH: number;
}

export function nearestHitIndex(
  slots: readonly Slot[],
  isTaken: readonly boolean[],
  probe: HitProbe
): number {
  let best = -1;
  let bestDist = Number.POSITIVE_INFINITY;
  isTaken.forEach((taken, i) => {
    const slot = slots[i];
    if (!slot || taken) {
      return;
    }
    const halfW =
      Math.max(slot.hitW, slot.w, probe.minW) / 2 + probe.hitTolerance;
    const halfH =
      Math.max(slot.hitH, slot.h, probe.minH) / 2 + probe.hitTolerance;
    const dx = Math.abs(probe.x - slot.x);
    const dy = Math.abs(probe.y - slot.y);
    if (dx <= halfW && dy <= halfH) {
      const dist = Math.hypot(dx, dy);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    }
  });
  return best;
}

export function computePairColumnsInStage(input: PairColumnsInput): Slot[] {
  const { leftCount, rightCount } = input;
  const stage = { ...input.stage, h: input.stage.h - CLAY_SLAB_PX };
  const floor = Math.ceil(resolveTouchFloor(input.ageBand, input.cssPerLogic));
  const zoneW = Math.floor((stage.w - SLOT_GAP_PX) / 2);
  const rows = rowsPerColumn(stage.h, floor);
  const leftSubCols = Math.max(1, Math.ceil(leftCount / rows));
  const rightSubCols = Math.max(1, Math.ceil(rightCount / rows));
  const leftNeededW = leftSubCols * floor + (leftSubCols - 1) * SLOT_GAP_PX;
  const rightNeededW = rightSubCols * floor + (rightSubCols - 1) * SLOT_GAP_PX;

  if (leftNeededW > zoneW || rightNeededW > zoneW) {
    const topBottom = tryLayoutTopBottom(stage, floor, leftCount, rightCount);
    if (topBottom) {
      return topBottom;
    }
  }

  return [
    ...layoutBlock(
      {
        count: leftCount,
        originX: stage.x,
        width: zoneW,
        role: "source",
        firstIndex: 0,
      },
      stage,
      floor,
      rows
    ),
    ...layoutBlock(
      {
        count: rightCount,
        originX: stage.x + zoneW + SLOT_GAP_PX,
        width: zoneW,
        role: "target",
        firstIndex: leftCount,
      },
      stage,
      floor,
      rows
    ),
  ];
}

export function clampGT005PointToStage(
  pt: { readonly x: number; readonly y: number },
  st?: ZoneRect
): { readonly x: number; readonly y: number } {
  if (!st) {
    return pt;
  }
  return {
    x: Math.max(st.x + 8, Math.min(st.x + st.w - 8, pt.x)),
    y: Math.max(st.y + 8, Math.min(st.y + st.h - 8, pt.y)),
  };
}

export function computeGT005MatchedCurve(
  fromPt: { readonly x: number; readonly y: number },
  toPt: { readonly x: number; readonly y: number },
  stageRect: ZoneRect | undefined,
  elapsedMs: number,
  reducedMotion: boolean
): GT005RopeCurve {
  const b =
    !reducedMotion && elapsedMs >= 0 && elapsedMs < 240
      ? 1 + Math.sin((elapsedMs / 240) * Math.PI * 2) * 0.25
      : 1;
  return computeGT005RopeCurve(fromPt, toPt, stageRect, b, 20, 0.1);
}

export function computeGT005PreviewCurve(
  fromPt: { readonly x: number; readonly y: number },
  toPt: { readonly x: number; readonly y: number },
  stageRect: ZoneRect | undefined
): GT005RopeCurve {
  return computeGT005RopeCurve(fromPt, toPt, stageRect, -1, 18, 0.08);
}

export function computeGT005RopeCurve(
  fromPt: { readonly x: number; readonly y: number },
  toPt: { readonly x: number; readonly y: number },
  stageRect: ZoneRect | undefined,
  sagDirection: number,
  maxSag: number,
  sagRatio: number
): GT005RopeCurve {
  const p1 = clampGT005PointToStage(fromPt, stageRect);
  const p2 = clampGT005PointToStage(toPt, stageRect);
  const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
  const ctrl = clampGT005PointToStage(
    {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2 + Math.min(maxSag, dist * sagRatio) * sagDirection,
    },
    stageRect
  );
  return { p1, p2, ctrl, dist };
}

function resolvePegOffset(
  w: number,
  h: number,
  side: GT005AnchorSide
): { readonly dx: number; readonly dy: number } {
  const ins = Math.min(8, Math.max(5, Math.round(Math.min(w, h) * 0.12)));
  if (side === "right") {
    return { dx: w / 2 - ins, dy: 0 };
  }
  if (side === "left") {
    return { dx: -w / 2 + ins, dy: 0 };
  }
  return { dx: 0, dy: side === "bottom" ? h / 2 - ins : -h / 2 + ins };
}

export function computeGT005CardBox(
  slot: Slot,
  pose: GT005CardPose,
  side: GT005AnchorSide,
  st?: ZoneRect
): GT005CardBox {
  const x0 = slot.x - slot.hitW / 2 + 2;
  const x1 = slot.x + slot.hitW / 2 - 2;
  const y0 = slot.y - slot.hitH / 2 + 2;
  const y1 = slot.y + slot.hitH / 2 - 2;
  const minX = st ? Math.max(x0, st.x + 2) : x0;
  const maxX = st ? Math.min(x1, st.x + st.w - 2) : x1;
  const minY = st ? Math.max(y0, st.y + 2) : y0;
  const maxY = st ? Math.min(y1, st.y + st.h - 2) : y1;
  const w = Math.max(
    24,
    Math.min(maxX - minX - 4, Math.round((slot.w - 6) * pose.scale))
  );
  const h = Math.max(
    24,
    Math.min(
      maxY - minY - pose.baseLift - 4,
      Math.round((slot.h - 6 - pose.baseLift) * pose.scale)
    )
  );
  const cx = Math.max(
    minX + w / 2,
    Math.min(maxX - w / 2, slot.x + pose.offsetX)
  );
  const cy = Math.max(
    minY + h / 2,
    Math.min(
      maxY - h / 2 - pose.baseLift,
      slot.y + pose.offsetY - pose.baseLift / 2
    )
  );
  const r = Math.max(8, Math.min(18, Math.round(Math.min(w, h) * 0.24)));
  const auraR = Math.max(
    12,
    Math.min(cx - minX, maxX - cx, cy - minY, maxY - cy)
  );
  const ringR = Math.max(10, Math.min(w, h) / 2 - 3);
  const peg = resolvePegOffset(w, h, side);
  const badgeR = Math.max(7, Math.min(10, Math.round(Math.min(w, h) * 0.14)));
  const badgeX =
    side === "right" ? cx - w / 2 + badgeR + 4 : cx + w / 2 - badgeR - 4;
  const badgeY = cy - h / 2 + badgeR + 4;
  const innerSlot: Slot = { ...slot, x: cx, y: cy, w: w * 0.82, h: h * 0.82 };
  return {
    slotIndex: slot.index,
    innerSlot,
    cx,
    cy,
    rx: cx - w / 2,
    ry: cy - h / 2,
    w,
    h,
    r,
    auraR,
    ringR,
    pegX: cx + peg.dx,
    pegY: cy + peg.dy,
    badgeX,
    badgeY,
    badgeR,
  };
}

export function createGT005MatchParticles(
  anchors: readonly GT005CardAnchor[],
  color: string,
  stageRect?: ZoneRect
): Particle[] {
  const out: Particle[] = [];
  for (const a of anchors) {
    const pt = clampGT005PointToStage(a, stageRect);
    for (let i = 0; i < 4; i++) {
      const ang = (i * Math.PI) / 2 + Math.PI / 4;
      out.push({
        x: pt.x,
        y: pt.y,
        vx: Math.cos(ang) * 1.4,
        vy: Math.sin(ang) * 1.4 - 0.5,
        color,
        size: 3.5,
        life: 0.75,
        maxLife: 0.75,
      });
    }
  }
  return out;
}

export function extractGT005MatchPayload(
  data: GameAction["data"] | undefined
): { readonly leftId: string; readonly rightId: string } | null {
  if (!data || typeof data !== "object") {
    return null;
  }
  const leftId: string | symbol | number | boolean | object | undefined =
    Reflect.get(data, "left_item_id");
  const rightId: string | symbol | number | boolean | object | undefined =
    Reflect.get(data, "right_item_id");
  if (
    typeof leftId === "string" &&
    leftId.length > 0 &&
    typeof rightId === "string" &&
    rightId.length > 0
  ) {
    return { leftId, rightId };
  }
  return null;
}

export function toGT005EntityState(
  isMatched: boolean,
  isStaged: boolean,
  isWrong: boolean,
  rawState: ItemVisualState
): ViewEntity["state"] {
  if (isMatched || rawState === "correct") {
    return "correct";
  }
  if (isWrong || rawState === "wrong") {
    return "incorrect";
  }
  return isStaged || rawState === "selected" ? "selected" : "idle";
}

export function buildGT005ViewEntity(
  side: "left" | "right",
  item: GT005SideItem,
  slot: Slot,
  slotIndex: number,
  state: ViewEntity["state"],
  dupIds?: ReadonlySet<string>
): ViewEntity {
  const id = dupIds?.has(item.item_id) ? `right:${item.item_id}` : item.item_id;
  return {
    id,
    slotIndex,
    role: side === "left" ? "source" : "target",
    hitShape: "square",
    state,
    x: slot.x,
    y: slot.y,
    w: slot.w,
    h: slot.h,
    ...resolveAssetLabels(item.asset),
  };
}
