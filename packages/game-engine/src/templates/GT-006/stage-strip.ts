import { formatSpokenLabel } from "@mindkid/shared/preschool-terminology";
import type { GameAction } from "#src/game-session";
import type { ViewEntity } from "#src/interaction";
import { resolveAssetLabels } from "#src/labels/spoken-keyword";
import { SLOT_GAP_PX } from "#src/layout/constants";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import type { ItemVisualState, RenderAsset } from "#src/render/index.js";
import type { Particle } from "#src/systems/render-system";
import type { GT006Content } from "./template.js";

const DECOR_STRIP_PX = 64;
const DECOR_STRIP_MAX_SHARE = 0.3;
const BASE_FRAME_MS = 16.67;
const LOCOMOTIVE_W_PX = 90;
const LOCOMOTIVE_H_PX = 70;
const LOCOMOTIVE_MIN_W_PX = 56;

export type GT006StepItem = GT006Content["sequence"][number];
export type GT006CardAsset =
  | RenderAsset
  | { readonly kind: "audio"; readonly path: string };
export type GT006CardVisualState =
  | "idle"
  | "touching"
  | "selected"
  | "correct"
  | "wrong";

export interface StageSplit {
  readonly slots: ZoneRect;
  readonly strip: ZoneRect;
}

export interface GT006CardPalette {
  readonly fill: string;
  readonly rim: string;
  readonly base: string;
  readonly innerRim: string | null;
  readonly lineWidth: number;
  readonly dashed: boolean;
}

export interface GT006CardPose {
  readonly offsetX: number;
  readonly offsetY: number;
  readonly scale: number;
  readonly baseLift: number;
  readonly shadowBlur: number;
}

export interface GT006CardPoseInput {
  readonly state: GT006CardVisualState;
  readonly isReceiveTarget: boolean;
  readonly slotIndex: number;
  readonly timeMs: number;
  readonly stagedAtMs: number | null;
  readonly settledAtMs: number | null;
  readonly wrongProgress: number | null;
  readonly reducedMotion: boolean;
}

export interface GT006StepCardOptions {
  readonly id: string;
  readonly slotOrderNumber: number;
  readonly asset: GT006CardAsset;
  readonly label?: string;
  readonly state: GT006CardVisualState;
  readonly isReceiveTarget: boolean;
  readonly timeMs: number;
  readonly stagedAtMs: number | null;
  readonly settledAtMs: number | null;
  readonly wrongProgress: number | null;
  readonly stageRect?: ZoneRect;
}

export interface GT006CardBox {
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
  readonly badgeX: number;
  readonly badgeY: number;
  readonly badgeR: number;
  readonly checkX: number;
  readonly checkY: number;
  readonly checkR: number;
}

export interface GT006SwapArc {
  readonly p1: { readonly x: number; readonly y: number };
  readonly p2: { readonly x: number; readonly y: number };
  readonly ctrl: { readonly x: number; readonly y: number };
  readonly dist: number;
}

export function splitStageForTrack(stage: ZoneRect): StageSplit {
  const stripH = Math.min(DECOR_STRIP_PX, stage.h * DECOR_STRIP_MAX_SHARE);
  return {
    slots: { x: stage.x, y: stage.y, w: stage.w, h: stage.h - stripH },
    strip: { x: stage.x, y: stage.y + stage.h - stripH, w: stage.w, h: stripH },
  };
}

export function slotsFitStage(
  slots: readonly Slot[],
  stage: ZoneRect
): boolean {
  return slots.every(
    (slot) =>
      slot.x - slot.hitW / 2 >= stage.x &&
      slot.x + slot.hitW / 2 <= stage.x + stage.w &&
      slot.y - slot.hitH / 2 >= stage.y &&
      slot.y + slot.hitH / 2 <= stage.y + stage.h
  );
}

export function clampGT006PointToStage(
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

export function computeGT006SwapArc(
  fromPt: { readonly x: number; readonly y: number },
  toPt: { readonly x: number; readonly y: number },
  st?: ZoneRect
): GT006SwapArc {
  const p1 = clampGT006PointToStage(fromPt, st);
  const p2 = clampGT006PointToStage(toPt, st);
  const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
  const lift = Math.min(28, Math.max(12, dist * 0.16));
  const ctrl = clampGT006PointToStage(
    { x: (p1.x + p2.x) / 2, y: Math.min(p1.y, p2.y) - lift },
    st
  );
  return { p1, p2, ctrl, dist };
}

export function computeGT006BannerSpan(
  slots: readonly Slot[],
  st?: ZoneRect
): { readonly x1: number; readonly x2: number; readonly y: number } | null {
  const first = slots[0];
  const last = slots.at(-1);
  if (!(first && last) || slots.length < 2) {
    return null;
  }
  const topY = Math.min(...slots.map((s) => s.y - s.h / 2));
  const y = st ? Math.max(st.y + 8, topY - 10) : Math.max(12, topY - 10);
  const x1 = Math.max(st ? st.x + 16 : 16, first.x - first.w * 0.35);
  const x2 = Math.min(st ? st.x + st.w - 16 : last.x, last.x + last.w * 0.35);
  return x2 - x1 >= 36 ? { x1, x2, y } : null;
}

export function computeGT006CouplerSegments(
  slots: readonly Slot[]
): readonly { readonly x1: number; readonly x2: number; readonly y: number }[] {
  const out: {
    readonly x1: number;
    readonly x2: number;
    readonly y: number;
  }[] = [];
  for (let i = 0; i < slots.length - 1; i++) {
    const a = slots[i];
    const b = slots[i + 1];
    if (
      !(a && b && b.x > a.x && Math.abs(a.y - b.y) <= Math.min(a.h, b.h) * 0.45)
    ) {
      continue;
    }
    const x1 = a.x + a.w / 2 - 2;
    const x2 = b.x - b.w / 2 + 2;
    if (x2 > x1) {
      out.push({ x1, x2, y: (a.y + b.y) / 2 });
    }
  }
  return out;
}

export function computeGT006LocomotiveSpot(
  firstSlot: Slot | undefined,
  strip: ZoneRect | null
): {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
} | null {
  if (!firstSlot) {
    return null;
  }
  const roomLeft = strip ? strip.x : 0;
  const roomRight = firstSlot.x - firstSlot.hitW / 2 - SLOT_GAP_PX;
  const w = Math.min(LOCOMOTIVE_W_PX, roomRight - roomLeft);
  if (w < LOCOMOTIVE_MIN_W_PX) {
    return null;
  }
  const pref = firstSlot.x - firstSlot.w * 1.5;
  const x = Math.max(roomLeft + w / 2, Math.min(pref, roomRight - w / 2));
  return { x, y: firstSlot.y, w, h: (w * LOCOMOTIVE_H_PX) / LOCOMOTIVE_W_PX };
}

export function computeGT006SolutionSlots(
  count: number,
  slots: readonly Slot[],
  st?: ZoneRect
): readonly Slot[] {
  if (count <= 0) {
    return [];
  }
  const strip = st
    ? splitStageForTrack(st).strip
    : { x: 24, y: 12, w: 672, h: 48 };
  const sz = Math.max(26, Math.min(44, Math.floor(strip.h - 10)));
  const cy = Math.max(
    strip.y + sz / 2 + 2,
    Math.min(strip.y + strip.h - sz / 2 - 2, strip.y + strip.h / 2)
  );
  const aligned =
    slots.length === count &&
    slots.every(
      (s, idx) => idx === 0 || s.x - (slots[idx - 1]?.x ?? 0) >= sz + 4
    );
  const span = (strip.w - 16) / count;
  const out: Slot[] = [];
  for (let i = 0; i < count; i++) {
    const rawX = aligned
      ? (slots[i]?.x ?? strip.x + 8 + span * (i + 0.5))
      : strip.x + 8 + span * (i + 0.5);
    const cx = Math.max(
      strip.x + sz / 2 + 4,
      Math.min(strip.x + strip.w - sz / 2 - 4, rawX)
    );
    out.push({
      index: i,
      x: cx,
      y: cy,
      w: sz,
      h: sz,
      hitW: sz,
      hitH: sz,
      page: 0,
      role: "target",
    });
  }
  return out;
}

export function computeGT006CardBox(
  slot: Slot,
  pose: GT006CardPose,
  st?: ZoneRect
): GT006CardBox {
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
  const r = Math.max(8, Math.min(18, Math.round(Math.min(w, h) * 0.22)));
  const auraR = Math.max(
    12,
    Math.min(cx - minX, maxX - cx, cy - minY, maxY - cy)
  );
  const ringR = Math.max(10, Math.min(w, h) / 2 - 3);
  const badgeR = Math.max(11, Math.min(14, Math.round(Math.min(w, h) * 0.18)));
  const badgeX = cx - w / 2 + badgeR + 4;
  const badgeY = cy - h / 2 + badgeR + 4;
  const checkX = cx + w / 2 - badgeR - 4;
  const innerSlot: Slot = { ...slot, x: cx, y: cy, w: w * 0.78, h: h * 0.78 };
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
    badgeX,
    badgeY,
    badgeR,
    checkX,
    checkY: badgeY,
    checkR: badgeR,
  };
}

export function createGT006StepParticles(
  slot: Slot | undefined,
  color: string,
  stageRect?: ZoneRect
): Particle[] {
  if (!slot) {
    return [];
  }
  const pt = clampGT006PointToStage({ x: slot.x, y: slot.y }, stageRect);
  const out: Particle[] = [];
  for (let i = 0; i < 6; i++) {
    const ang = (i * Math.PI) / 3;
    out.push({
      x: pt.x,
      y: pt.y,
      vx: Math.cos(ang) * 1.5,
      vy: Math.sin(ang) * 1.5 - 0.5,
      color,
      size: 3.5,
      life: 0.75,
      maxLife: 0.75,
    });
  }
  return out;
}

export function stepGT006Particles(
  particles: readonly Particle[],
  deltaMs: number,
  stage?: ZoneRect
): Particle[] {
  if (particles.length === 0 || deltaMs <= 0) {
    return [...particles];
  }
  const ratio = Math.min(4, Math.max(0.1, deltaMs / BASE_FRAME_MS));
  const next: Particle[] = [];
  for (const p of particles) {
    const life = p.life - (deltaMs / 1000) * 1.6;
    if (life <= 0) {
      continue;
    }
    const rx = p.x + p.vx * ratio;
    const ry = p.y + p.vy * ratio;
    const m = Math.max(8, p.size + 2);
    const x = stage
      ? Math.max(stage.x + m, Math.min(stage.x + stage.w - m, rx))
      : rx;
    const y = stage
      ? Math.max(stage.y + m, Math.min(stage.y + stage.h - m, ry))
      : ry;
    next.push({ ...p, x, y, vy: p.vy + 0.28 * ratio, life });
  }
  return next;
}

export function extractReorderPayload(
  data: GameAction["data"] | undefined
): { readonly fromIndex: number; readonly toIndex: number } | null {
  if (!data || typeof data !== "object") {
    return null;
  }
  const f: string | symbol | number | boolean | object | undefined =
    Reflect.get(data, "from_index");
  const t: string | symbol | number | boolean | object | undefined =
    Reflect.get(data, "to_index");
  return typeof f === "number" &&
    Number.isInteger(f) &&
    typeof t === "number" &&
    Number.isInteger(t)
    ? { fromIndex: f, toIndex: t }
    : null;
}

export function resolveStepOrderNumber(
  step: GT006StepItem | undefined,
  fallback: number
): number {
  if (!step) {
    return fallback;
  }
  const custom: string | symbol | number | boolean | object | undefined =
    Reflect.get(step, "correct_order");
  return typeof custom === "number" && Number.isFinite(custom)
    ? custom
    : step.order_index;
}

export function resolveGT006CardVisualState(
  idx: number,
  isWon: boolean,
  isWrongCard: boolean,
  stagedIdx: number | null,
  touchingIdx: number | null,
  raw: ItemVisualState
): GT006CardVisualState {
  if (isWon) {
    return "correct";
  }
  if (isWrongCard) {
    return "wrong";
  }
  if (stagedIdx === idx) {
    return "selected";
  }
  if (touchingIdx === idx) {
    return "touching";
  }
  return raw === "correct" ||
    raw === "wrong" ||
    raw === "selected" ||
    raw === "touching"
    ? raw
    : "idle";
}

export function toGT006EntityState(
  cardState: GT006CardVisualState,
  raw: ItemVisualState
): ViewEntity["state"] {
  if (
    cardState === "selected" ||
    cardState === "touching" ||
    raw === "selected"
  ) {
    return "selected";
  }
  if (cardState === "correct" || raw === "correct") {
    return "correct";
  }
  return cardState === "wrong" || raw === "wrong" ? "incorrect" : "idle";
}

export function buildGT006ViewEntity(
  stepId: string,
  slotIndex: number,
  slot: Slot,
  step: GT006StepItem | undefined,
  cardState: GT006CardVisualState,
  rawState: ItemVisualState
): ViewEntity {
  const assetLabels = step ? resolveAssetLabels(step.asset) : {};
  const ord = resolveStepOrderNumber(step, slotIndex + 1);
  const label = step?.label ?? assetLabels.label ?? String(ord);
  const spokenLabel = step?.label
    ? formatSpokenLabel(step.label)
    : (assetLabels.spokenLabel ?? formatSpokenLabel(String(ord)));
  return {
    id: stepId,
    slotIndex,
    role: "target",
    state: toGT006EntityState(cardState, rawState),
    x: slot.x,
    y: slot.y,
    w: slot.w,
    h: slot.h,
    hitShape: "square",
    glyph: assetLabels.glyph,
    label,
    spokenLabel,
    spokenAudioPath: assetLabels.spokenAudioPath,
  };
}

export function buildGT006StepCardOptions(
  step: GT006StepItem,
  slotIdx: number,
  state: GT006CardVisualState,
  stagedIdx: number | null,
  hoveredIdx: number | null,
  timeMs: number,
  stagedAtMs: number | null,
  settledAtMs: number | null,
  wrongProg: number | null,
  stageRect?: ZoneRect
): GT006StepCardOptions {
  const assetLabels = resolveAssetLabels(step.asset);
  const ord = resolveStepOrderNumber(step, slotIdx + 1);
  return {
    id: step.step_id,
    slotOrderNumber: slotIdx + 1,
    asset: step.asset,
    label: step.label ?? assetLabels.label ?? String(ord),
    state,
    isReceiveTarget:
      stagedIdx !== null &&
      stagedIdx !== slotIdx &&
      (hoveredIdx === null || hoveredIdx === slotIdx),
    timeMs,
    stagedAtMs: stagedIdx === slotIdx ? stagedAtMs : null,
    settledAtMs,
    wrongProgress: state === "wrong" ? wrongProg : null,
    stageRect,
  };
}
