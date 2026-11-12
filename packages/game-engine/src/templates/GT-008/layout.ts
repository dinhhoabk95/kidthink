import type {
  GameAction,
  GameActionValue,
  HintDemoStep,
} from "#src/game-session";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import { alpha } from "#src/render/color-utils.js";
import type { RenderAsset } from "#src/render/index.js";
import { deriveStream } from "#src/rng/mulberry32";
import { shuffle } from "#src/rng/shuffle";
import { designTokens } from "#src/systems/designTokens";
import type { Particle } from "#src/systems/render-system";
import type { GT008Content } from "./template.js";

const STAGED_POP_MS = 200;
const WELL_POP_MS = 240;
const BASE_FRAME_MS = 16.667;
const c = designTokens.colors;
const m = c.montessori;
const s = c.semantic.success;

export type GT008Item = GT008Content["items"][number];
export type GT008SlotDef = GT008Content["slots"][number];
export type GT008CardAsset =
  | RenderAsset
  | { readonly kind: "audio"; readonly path: string };
export type GT008TokenVisualState =
  | "idle"
  | "touching"
  | "selected"
  | "correct"
  | "wrong";

export interface GT008TokenPalette {
  readonly fill: string;
  readonly rim: string;
  readonly base: string;
  readonly innerRim: string | null;
  readonly lineWidth: number;
}
export interface GT008TokenPose {
  readonly offsetX: number;
  readonly offsetY: number;
  readonly scale: number;
  readonly baseLift: number;
  readonly shadowBlur: number;
}
export interface GT008TargetWellOptions {
  readonly slotDef: GT008SlotDef;
  readonly expectedItem: GT008Item | undefined;
  readonly placedItem: GT008Item | undefined;
  readonly breath: number;
  readonly isReceiving: boolean;
  readonly isStagedTarget: boolean;
  readonly isHighlightedEmpty: boolean;
  readonly wrongProgress: number | null;
  readonly popElapsedMs: number | null;
}
export interface GT008SourceTokenOptions {
  readonly item: GT008Item;
  readonly state: GT008TokenVisualState;
  readonly timeMs: number;
  readonly stagedElapsedMs: number | null;
  readonly wrongProgress: number | null;
  readonly assetOverride?: GT008CardAsset;
}
export interface GT008ClockState {
  logicMs: number;
  stagedAtMs: number | null;
  closedFlashUntilMs: number;
  readonly slotPopAtMs: Map<string, number>;
}
export interface GT008HintPair {
  readonly slotDef: GT008SlotDef;
  readonly targetSlotIdx: number;
  readonly sourceItemIdx: number;
}

const SESSION_CLOCK = new WeakMap<object, GT008ClockState>();

export function getGT008Clock(session: object): GT008ClockState {
  let st = SESSION_CLOCK.get(session);
  if (!st) {
    const slotPopAtMs = new Map<string, number>();
    st = { logicMs: 0, stagedAtMs: null, closedFlashUntilMs: 0, slotPopAtMs };
    SESSION_CLOCK.set(session, st);
  }
  return st;
}
export function resetGT008Clock(session: object): GT008ClockState {
  const s0 = getGT008Clock(session);
  s0.logicMs = 0;
  s0.stagedAtMs = null;
  s0.closedFlashUntilMs = 0;
  s0.slotPopAtMs.clear();
  return s0;
}
export function placeGT008Action(itemId: string, slotId: string): GameAction {
  return { type: "place_item", data: { item_id: itemId, slot_id: slotId } };
}
export function insetGT008Rect(r: ZoneRect, ix: number, iy: number): ZoneRect {
  return {
    x: r.x + ix,
    y: r.y + iy,
    w: Math.max(0, r.w - 2 * ix),
    h: Math.max(0, r.h - 2 * iy),
  };
}
export function buildGT008DisplayItems(
  items: readonly GT008Item[],
  layoutSeed: number
): readonly GT008Item[] {
  if (layoutSeed === 0 || items.length < 2) {
    return [...items];
  }
  const rng = deriveStream(layoutSeed, "items");
  for (let attempt = 0; attempt < 4; attempt++) {
    const cnd = shuffle(items, rng);
    if (cnd.some((it, i) => it.item_id !== items[i]?.item_id)) {
      return cnd;
    }
  }
  return [items.at(-1) ?? items[0], ...items.slice(0, -1)].filter(
    (it): it is GT008Item => Boolean(it)
  );
}
export function extractGT008PlacePayload(
  data: GameActionValue
): { readonly item_id: string; readonly slot_id: string } | null {
  if (typeof data !== "object" || data === null) {
    return null;
  }
  const itemId = Reflect.get(data, "item_id");
  const slotId = Reflect.get(data, "slot_id");
  return typeof itemId === "string" && typeof slotId === "string"
    ? { item_id: itemId, slot_id: slotId }
    : null;
}
export function extractGT008RevertPayload(
  data: GameActionValue
): { readonly slot_id: string } | null {
  if (typeof data !== "object" || data === null) {
    return null;
  }
  const slotId = Reflect.get(data, "slot_id");
  return typeof slotId === "string" ? { slot_id: slotId } : null;
}

function pal(
  fill: string,
  rim: string,
  base: string,
  innerRim: string | null,
  lineWidth: number
): GT008TokenPalette {
  return { fill, rim, base, innerRim, lineWidth };
}

const s0 = c.surface[0];
const TOKEN_PALETTES: Readonly<
  Record<GT008TokenVisualState, GT008TokenPalette>
> = {
  idle: pal(s0, m.woodBevel, m.woodBorder, alpha(s0, 0.8), 2.5),
  touching: pal(c.brand[50], c.brand[400], c.brand[600], c.brand[200], 3.2),
  selected: pal(m.amberGlow, m.amber, m.amberDeep, c.cta[300], 3.8),
  correct: pal(s[50], s[500], s[700], alpha(s[400], 0.55), 3.2),
  wrong: pal(c.retry[100], c.retry[600], c.retry[700], c.retry[300], 3.4),
};

export function resolveGT008TokenPalette(
  state: GT008TokenVisualState
): GT008TokenPalette {
  return TOKEN_PALETTES[state];
}
export function resolveGT008WellPopScale(
  dt: number | null,
  rm: boolean
): number {
  return !rm && dt !== null && dt >= 0 && dt < WELL_POP_MS
    ? 1 + Math.sin((dt / WELL_POP_MS) * Math.PI) * 0.1
    : 1;
}

function pose(
  offsetX: number,
  offsetY: number,
  scale: number,
  baseLift: number,
  shadowBlur: number
): GT008TokenPose {
  return { offsetX, offsetY, scale, baseLift, shadowBlur };
}
function selectedPose(
  opts: GT008SourceTokenOptions,
  rm: boolean
): GT008TokenPose {
  if (rm) {
    return pose(0, 0, 1, 4.5, 12);
  }
  const dt = opts.stagedElapsedMs ?? STAGED_POP_MS;
  const pulse =
    dt >= 0 && dt < STAGED_POP_MS
      ? Math.sin((dt / STAGED_POP_MS) * Math.PI) * 0.04
      : 0;
  return pose(0, -5, 1.07 + pulse, 4.5, 12);
}
export function resolveGT008TokenPose(
  slotIndex: number,
  opts: GT008SourceTokenOptions,
  rm: boolean
): GT008TokenPose {
  if (opts.state === "wrong") {
    const p = opts.wrongProgress ?? 0;
    return pose(rm ? 0 : Math.sin(p * Math.PI * 5) * (1 - p) * 5, 0, 1, 3, 6);
  }
  if (opts.state === "touching") {
    return pose(0, rm ? 0 : 2, rm ? 1 : 0.97, 1.5, 4);
  }
  if (opts.state === "selected") {
    return selectedPose(opts, rm);
  }
  if (opts.state === "correct") {
    return pose(0, 0, 1, 2.5, 6);
  }
  const ph = opts.timeMs / 700 + slotIndex * 0.8;
  const oy = rm ? 0 : Math.cos(ph) * 1.1;
  return pose(0, oy, rm ? 1 : 1 + Math.sin(ph) * 0.012, 3.5, 8);
}

export function findGT008NextHintPair(
  slotDefs: readonly GT008SlotDef[],
  displayItems: readonly GT008Item[],
  placed: ReadonlyMap<string, string>,
  stagedId: string | null,
  stagedSlotId: string | null = null
): GT008HintPair | null {
  const open = (s: GT008SlotDef) => !placed.has(s.slot_id);
  const byItem = slotDefs.findIndex(
    (s) => open(s) && s.expected_item_id === stagedId
  );
  const bySlot = slotDefs.findIndex(
    (s) => open(s) && s.slot_id === stagedSlotId
  );
  let tIdx = slotDefs.findIndex(open);
  if (stagedId !== null && byItem >= 0) {
    tIdx = byItem;
  } else if (stagedSlotId !== null && bySlot >= 0) {
    tIdx = bySlot;
  }
  const def = slotDefs[tIdx];
  if (tIdx < 0 || !def) {
    return null;
  }
  const sIdx = displayItems.findIndex(
    (it) => it.item_id === def.expected_item_id
  );
  return sIdx >= 0
    ? { slotDef: def, targetSlotIdx: tIdx, sourceItemIdx: sIdx }
    : null;
}

export function computeGT008HintDemoSteps(
  slotDefs: readonly GT008SlotDef[],
  displayItems: readonly GT008Item[],
  placedSlots: ReadonlyMap<string, string>,
  allSlots: readonly Slot[],
  sourceSlots: readonly Slot[],
  targetSlots: readonly Slot[]
): readonly HintDemoStep[] | null {
  const steps: HintDemoStep[] = [];
  for (let i = 0; i < slotDefs.length && steps.length < 3; i++) {
    const def = slotDefs[i];
    if (!def || placedSlots.has(def.slot_id)) {
      continue;
    }
    const sIdx = displayItems.findIndex(
      (it) => it.item_id === def.expected_item_id
    );
    const src = sourceSlots[sIdx];
    const dst = targetSlots[i];
    const from = src ? allSlots.indexOf(src) : -1;
    const to = dst ? allSlots.indexOf(dst) : -1;
    if (from >= 0 && to >= 0) {
      steps.push({ from, to });
    }
  }
  return steps.length >= 2 ? steps : null;
}

function clampV(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
export function stepGT008Particles(
  particles: readonly Particle[],
  deltaMs: number,
  stage?: ZoneRect
): Particle[] {
  if (particles.length === 0 || deltaMs <= 0) {
    return [...particles];
  }
  const ratio = clampV(deltaMs / BASE_FRAME_MS, 0.05, 4);
  const out: Particle[] = [];
  for (const p of particles) {
    const life = p.life - (deltaMs / 1000) * 1.6;
    if (life <= 0) {
      continue;
    }
    const rx = p.x + p.vx * ratio;
    const ry = p.y + p.vy * ratio;
    const pad = Math.max(6, p.size + 2);
    const x = stage ? clampV(rx, stage.x + pad, stage.x + stage.w - pad) : rx;
    const y = stage ? clampV(ry, stage.y + pad, stage.y + stage.h - pad) : ry;
    out.push({ ...p, x, y, vy: p.vy + 0.25 * ratio, life });
  }
  return out;
}
