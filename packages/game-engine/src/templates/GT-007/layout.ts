import { formatSpokenLabel } from "@mindkid/shared/preschool-terminology";
import type { AgeBand } from "#src/contracts/types";
import type { GameActionValue } from "#src/game-session";
import type { EngineView, ViewEntity } from "#src/interaction";
import { type LogicSpace, resolveTouchFloor } from "#src/layout/constants";
import { findHitSlotIndex, TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import { resolveLayout } from "#src/layout/registry";
import { computeStageTreeSlots } from "#src/layout/stage-targets";
import type { ZoneRect } from "#src/layout/stage-zones";
import {
  computeTraySourceSlots,
  findNearestHitSlot,
  type MinHitSize,
  pickTrayZones,
} from "#src/layout/tray-layout";
import type { Slot } from "#src/layout/types";
import type { ItemVisualState } from "#src/render/index.js";
import type { Particle } from "#src/systems/render-system";
import type { WrongFlash } from "#src/systems/wrong-flash";
import type { GT007Content } from "#src/templates/GT-007/template";

export const TREE_CELL_MAX_PX = 104;
export const PART_POP_MS = 240;
export const STAGED_POP_MS = 220;
const BASE_FRAME_MS = 16.67;
const LEGACY_PART_HIT: MinHitSize = { w: 100, h: 100 };

export function computeChoiceSlots(
  c: GT007Content,
  nOpt: number,
  ageBand: AgeBand,
  cssPerLogic: number | undefined,
  logic: LogicSpace,
  stageRect?: ZoneRect | null,
  trayRect?: ZoneRect | null
): readonly Slot[] {
  const touchFloor = resolveTouchFloor(ageBand, cssPerLogic);
  const zones = pickTrayZones(stageRect ?? undefined, trayRect ?? undefined);
  if (zones) {
    const partCount = c.parts.length;
    const tree = computeStageTreeSlots({
      partCount,
      stage: zones.stage,
      touchFloor,
      maxCell: TREE_CELL_MAX_PX,
    });
    return [
      ...tree,
      ...computeTraySourceSlots(nOpt, zones.tray, touchFloor, tree.length),
    ];
  }
  const key = isTenFrameContent(c) ? "ten-frame-split" : "number-bond-tree";
  const targetCount = c.parts.length;
  return resolveLayout(key)({ slotCount: nOpt, targetCount, ageBand, logic });
}

type Opt = GT007Content["options"][number];
type Part = GT007Content["parts"][number];
type NumMap = ReadonlyMap<string, number>;
type StrMap = ReadonlyMap<string, string>;

export type GT007TokenVisualState =
  | "idle"
  | "touching"
  | "selected"
  | "correct"
  | "locked";

export interface GT007OptionPreview {
  readonly optionValue: number;
  readonly resultingSum: number;
  readonly expectedWhole: number;
}

export interface GT007TokenPose {
  readonly offsetY: number;
  readonly scale: number;
  readonly baseLift: number;
  readonly shadowBlur: number;
}

export interface GT007WholeFrameOptions {
  readonly label: string;
  readonly isTenFrame: boolean;
  readonly isWon: boolean;
  readonly wrongProgress: number | null;
  readonly stage: ZoneRect | null;
}

export interface GT007PartSocketOptions {
  readonly valueText: string;
  readonly isTarget: boolean;
  readonly isFilled: boolean;
  readonly isHovered: boolean;
  readonly isStagedReady: boolean;
  readonly isSolutionReveal: boolean;
  readonly isTenFrame: boolean;
  readonly popScale: number;
}

export interface GT007OptionTokenOptions {
  readonly state: GT007TokenVisualState;
  readonly timeMs: number;
  readonly stagedElapsedMs: number | null;
}

export interface GT007RenderClock {
  stagedAtMs: number | null;
  winAtMs: number | null;
  readonly partPopAtMs: Map<string, number>;
}

const SESSION_CLOCK = new WeakMap<object, GT007RenderClock>();

export function getGT007Clock(session: object): GT007RenderClock {
  const c = SESSION_CLOCK.get(session) ?? {
    stagedAtMs: null,
    winAtMs: null,
    partPopAtMs: new Map(),
  };
  SESSION_CLOCK.set(session, c);
  return c;
}

export const resetGT007Clock = (s: object): void => {
  SESSION_CLOCK.delete(s);
};

export function resolveWrongFlashProgress(
  f: WrongFlash,
  lMs: number
): number | null {
  return f.isActive(lMs) ? f.progress(lMs) : null;
}

export const isCandyContent = (c: GT007Content): boolean =>
  c.representation === "discrete-object";

export const isTenFrameContent = (c: GT007Content): boolean =>
  c.layout === "ten-frame-split" || c.representation === "ten-frame";

function strProp(d: GameActionValue, k: string): string | undefined {
  const v = typeof d === "object" && d !== null ? Reflect.get(d, k) : null;
  return typeof v === "string" ? v : undefined;
}

export const extractOptionId = (d: GameActionValue) => strProp(d, "option_id");
export const extractPartId = (d: GameActionValue) => strProp(d, "part_id");

export function computeKnownSum(
  c: GT007Content,
  f?: NumMap,
  ex?: string
): number {
  let sum = 0;
  for (const p of c.parts) {
    if (!p.is_target) {
      sum += p.value;
    } else if (p.id !== ex && f?.has(p.id)) {
      sum += f.get(p.id) ?? 0;
    }
  }
  return sum;
}

export function resolveNextTargetPartId(c: GT007Content, f: NumMap): string {
  const open = c.parts.find((p) => p.is_target && !f.has(p.id));
  const fallback = c.parts.find((p) => p.is_target) ?? c.parts[0];
  return (open ?? fallback)?.id ?? "part_0";
}

export function canSubsetSum(
  v: readonly number[],
  k: number,
  sum: number,
  idx = 0
): boolean {
  if (k === 0) {
    return sum === 0;
  }
  if (sum < 0 || v.length - idx < k) {
    return false;
  }
  for (let i = idx; i <= v.length - k; i++) {
    if (canSubsetSum(v, k - 1, sum - (v[i] ?? 0), i + 1)) {
      return true;
    }
  }
  return false;
}

function isUsedElsewhere(ids: StrMap, partId: string, optId: string): boolean {
  for (const [pId, usedId] of ids) {
    if (pId !== partId && usedId === optId) {
      return true;
    }
  }
  return false;
}

export function canOptionSatisfyBond(
  c: GT007Content,
  filled: NumMap,
  ids: StrMap,
  partId: string,
  opt: Opt,
  pool?: readonly Opt[]
): boolean {
  const target = c.parts.find((p) => p.id === partId);
  if (!target?.is_target || isUsedElsewhere(ids, partId, opt.id)) {
    return false;
  }
  const partial = computeKnownSum(c, filled, partId) + opt.value;
  const rem = c.parts.filter(
    (p) => p.is_target && p.id !== partId && !filled.has(p.id)
  ).length;
  if (rem === 0) {
    const exact =
      filled.size === 0 && opt.is_correct && opt.value === target.value;
    return partial === c.whole.value || exact;
  }
  const unused = (pool ?? c.options)
    .filter((o) => o.id !== opt.id && !isUsedElsewhere(ids, partId, o.id))
    .map((o) => o.value);
  return canSubsetSum(unused, rem, c.whole.value - partial);
}

export function isBondChoiceComplete(c: GT007Content, filled: NumMap): boolean {
  const targets = c.parts.filter((p) => p.is_target);
  if (targets.length === 0) {
    return true;
  }
  if (!targets.every((p) => filled.has(p.id))) {
    return false;
  }
  const total = c.parts.reduce(
    (sum, p) => sum + (p.is_target ? (filled.get(p.id) ?? 0) : p.value),
    0
  );
  return (
    total === c.whole.value ||
    targets.every((p) => filled.get(p.id) === p.value)
  );
}

function resolveSelectedScale(elMs: number | null, red: boolean): number {
  if (red) {
    return 1;
  }
  const el = elMs === null ? STAGED_POP_MS : Math.max(0, elMs);
  return el < STAGED_POP_MS
    ? 1 + Math.sin((el / STAGED_POP_MS) * Math.PI) * 0.04
    : 1.03;
}

const pose = (
  offsetY: number,
  scale: number,
  baseLift: number,
  shadowBlur: number
): GT007TokenPose => ({ offsetY, scale, baseLift, shadowBlur });

export function resolveGT007OptionPose(
  o: GT007OptionTokenOptions,
  slotIdx: number,
  red: boolean
): GT007TokenPose {
  if (o.state === "locked" || o.state === "correct") {
    return pose(0, 1, 0, 0);
  }
  if (o.state === "touching") {
    return pose(red ? 0 : 1.5, red ? 1 : 0.96, 1.5, 5);
  }
  if (o.state === "selected") {
    return pose(
      red ? 0 : -2,
      resolveSelectedScale(o.stagedElapsedMs, red),
      4,
      10
    );
  }
  return pose(red ? 0 : Math.sin(o.timeMs / 640 + slotIdx * 0.9), 1, 3, 7);
}

export const resolvePartPopScale = (ms: number | null, red: boolean): number =>
  red || ms === null || ms < 0 || ms >= PART_POP_MS
    ? 1
    : 1 + Math.sin((ms / PART_POP_MS) * Math.PI) * 0.04;

export function resolveWholeShakeOffset(
  w: number | null,
  red: boolean,
  s: Slot,
  st?: ZoneRect | null
): number {
  if (red || w === null) {
    return 0;
  }
  const raw = Math.sin(w * Math.PI * 4) * (1 - w) * 3.5;
  if (!st) {
    return raw;
  }
  const minX = st.x + s.w / 2 + 1 - s.x;
  const maxX = st.x + st.w - s.w / 2 - 1 - s.x;
  return Math.max(minX, Math.min(maxX, raw));
}

export function stepParticlesWithinStage(
  list: readonly Particle[],
  dt: number,
  st?: ZoneRect | null
): Particle[] {
  if (list.length === 0 || dt <= 0) {
    return [...list];
  }
  const ratio = Math.min(4, Math.max(0.1, dt / BASE_FRAME_MS));
  const next: Particle[] = [];
  for (const p of list) {
    const life = p.life - (dt / 1000) * 1.6;
    if (life <= 0) {
      continue;
    }
    const r = p.size * life + 1;
    const nx = p.x + p.vx * ratio;
    const ny = p.y + p.vy * ratio;
    const x = st ? Math.max(st.x + r, Math.min(st.x + st.w - r, nx)) : nx;
    const y = st ? Math.max(st.y + r, Math.min(st.y + st.h - r, ny)) : ny;
    next.push({ ...p, x, y, vy: p.vy + 0.28 * ratio, life });
  }
  return next;
}

export function findGT007ChoiceOption(
  opts: readonly Opt[],
  src: readonly Slot[],
  ids: StrMap,
  x: number,
  y: number
): Opt | null {
  const used = new Set(ids.values());
  const open = opts.flatMap((opt, i) => {
    const slot = src[i];
    return slot && !used.has(opt.id) ? [{ opt, slot }] : [];
  });
  const slots = open.map((e) => e.slot);
  const hit = findHitSlotIndex(slots, x, y, "circle", TAP_TOLERANCE_PX);
  return open[hit]?.opt ?? null;
}

export function findGT007HoveredSlot(
  slots: readonly Slot[],
  isCandy: boolean,
  x: number,
  y: number
): number | null {
  if (isCandy) {
    const idx = findHitSlotIndex(slots, x, y, "square", TAP_TOLERANCE_PX);
    return idx >= 0 ? idx : null;
  }
  const src = slots.filter((s) => s.role === "source");
  const sIdx = findHitSlotIndex(src, x, y, "circle", TAP_TOLERANCE_PX);
  if (sIdx >= 0 && src[sIdx]) {
    return slots.indexOf(src[sIdx]);
  }
  const tgt = slots.filter((s) => s.role === "target");
  const tIdx = findHitSlotIndex(tgt, x, y, "square", TAP_TOLERANCE_PX);
  return tIdx >= 0 && tgt[tIdx] ? slots.indexOf(tgt[tIdx]) : null;
}

export function findGT007TargetPart(
  c: GT007Content,
  targets: readonly Slot[],
  filled: NumMap,
  inFrame: boolean,
  x: number,
  y: number,
  incFilled = false
): Part | null {
  const all = c.parts.flatMap((part, i) => {
    const slot = targets[i + 1];
    return slot && part.is_target ? [{ part, slot }] : [];
  });
  const slots = all.map((e) => e.slot);
  const hit = findNearestHitSlot(
    slots,
    x,
    y,
    TAP_TOLERANCE_PX,
    inFrame ? undefined : LEGACY_PART_HIT
  );
  const part = all[hit]?.part ?? null;
  return part && (incFilled || !filled.has(part.id)) ? part : null;
}

export function resolveOptionVisualState(
  optId: string,
  stagedId: string | null,
  ids: StrMap,
  raw: ItemVisualState,
  touching: boolean
): GT007TokenVisualState {
  for (const usedId of ids.values()) {
    if (usedId === optId) {
      return "locked";
    }
  }
  if (raw === "correct" || raw === "locked") {
    return raw;
  }
  if (stagedId === optId || raw === "selected") {
    return "selected";
  }
  return touching ? "touching" : "idle";
}

export function resolveOptionEntityState(
  optId: string,
  stagedId: string | null,
  ids: StrMap,
  raw: ItemVisualState
): ViewEntity["state"] {
  const vis = resolveOptionVisualState(optId, stagedId, ids, raw, false);
  if (vis === "locked" || vis === "correct") {
    return "correct";
  }
  if (vis === "selected") {
    return "selected";
  }
  return raw === "wrong" ? "incorrect" : "idle";
}

export function buildGT007ChoiceView(
  c: GT007Content,
  options: readonly Opt[],
  slots: readonly Slot[],
  filled: NumMap,
  isWrong: boolean,
  optState: (id: string) => ViewEntity["state"]
): EngineView {
  const targets = slots.filter((s) => s.role === "target");
  const sources = slots.filter((s) => s.role === "source");
  const raw = [
    c.whole.id,
    ...c.parts.map((p) => p.id),
    ...options.map((o) => o.id),
  ];
  const pfx = new Set(raw).size !== raw.length;
  const entities: ViewEntity[] = [];
  const add = (
    id: string,
    s: Slot | undefined,
    role: ViewEntity["role"],
    state: ViewEntity["state"],
    label: string,
    spoken = formatSpokenLabel(label)
  ) => {
    if (s) {
      entities.push({
        id,
        slotIndex: slots.indexOf(s),
        role,
        state,
        x: s.x,
        y: s.y,
        w: Math.max(s.hitW, s.w),
        h: Math.max(s.hitH, s.h),
        hitShape: role === "source" ? "circle" : "square",
        label,
        spokenLabel: spoken,
      });
    }
  };
  const wId = pfx ? `whole:${c.whole.id}` : c.whole.id;
  add(
    wId,
    targets[0],
    "target",
    isWrong ? "incorrect" : "idle",
    String(c.whole.value)
  );
  c.parts.forEach((p, i) => {
    const has = filled.has(p.id);
    const hide = p.is_target && !has;
    const val = String(filled.get(p.id) ?? p.value);
    const id = pfx ? `part:${p.id}` : p.id;
    const spk = hide ? "Ô trống" : formatSpokenLabel(val);
    add(
      id,
      targets[i + 1],
      "target",
      has ? "correct" : "idle",
      hide ? "?" : val,
      spk
    );
  });
  options.forEach((o, i) => {
    const id = pfx ? `opt:${o.id}` : o.id;
    add(id, sources[i], "source", optState(o.id), String(o.value));
  });
  return { entities, activePrompt: c.prompt };
}
