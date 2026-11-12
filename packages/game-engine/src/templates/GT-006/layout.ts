import type { GameAction, HintDemoStep } from "#src/game-session";
import { findHitSlotIndex } from "#src/layout/hit-test";
import type { Slot } from "#src/layout/types";
import { alpha } from "#src/render/color-utils.js";
import { detectSlotVisualComparisonCue } from "#src/render/slot-decor.js";
import { deriveDerangement } from "#src/rng/derangement";
import type { Rng } from "#src/rng/types";
import { designTokens } from "#src/systems/designTokens";
import {
  computeGT006CardBox,
  type GT006CardBox,
  type GT006CardPalette,
  type GT006CardPose,
  type GT006CardPoseInput,
  type GT006CardVisualState,
  type GT006StepCardOptions,
  type GT006StepItem,
} from "./stage-strip.js";

const STAGED_POP_MS = 200;
const SETTLED_POP_MS = 220;
const c = designTokens.colors;
const m = c.montessori;
const s = c.semantic.success;

function pal(
  fill: string,
  rim: string,
  base: string,
  innerRim: string | null,
  lineWidth: number,
  dashed = false
): GT006CardPalette {
  return { fill, rim, base, innerRim, lineWidth, dashed };
}

const CARD_PALETTES: Readonly<Record<GT006CardVisualState, GT006CardPalette>> =
  {
    idle: pal(c.surface[0], m.woodBevel, m.woodBorder, null, 2.5),
    touching: pal(c.brand[50], c.brand[400], c.brand[600], c.brand[300], 3.5),
    selected: pal(m.amberGlow, m.amber, m.amberDeep, c.cta[300], 4),
    correct: pal(s[50], s[500], s[700], alpha(s[400], 0.55), 3.2),
    wrong: pal(c.retry[100], c.retry[600], c.retry[700], c.retry[300], 3.5),
  };

const RECEIVE_TARGET_PALETTE = pal(
  m.amberGlow,
  c.cta[500],
  m.amberDeep,
  m.amber,
  3.5,
  true
);

export function resolveGT006CardPalette(
  state: GT006CardVisualState,
  isReceive = false
): GT006CardPalette {
  return isReceive && state === "idle"
    ? RECEIVE_TARGET_PALETTE
    : CARD_PALETTES[state];
}

export function stepVisualSignature(step: GT006StepItem): string {
  const emoji = step.asset.kind === "emoji" ? step.asset.ref : undefined;
  const cue = detectSlotVisualComparisonCue(step.label, step.step_id, emoji);
  const cueSig = cue ? `${cue.kind}:${cue.glyphScale}:${cue.barRatio}` : "none";
  let raw = "";
  if (step.asset.kind === "text") {
    raw = step.asset.text;
  } else if (step.asset.kind === "emoji") {
    raw = step.asset.ref;
  } else {
    raw = step.asset.path;
  }
  return `${step.asset.kind}|${raw}|${step.label ?? ""}|${cueSig}`;
}

export function areStepsVisuallyEquivalent(
  a?: GT006StepItem,
  b?: GT006StepItem
): boolean {
  if (!(a && b)) {
    return false;
  }
  return (
    a.step_id === b.step_id || stepVisualSignature(a) === stepVisualSignature(b)
  );
}

export function isSequenceEquivalentMatch(
  cur: readonly string[],
  tgt: readonly string[],
  byId: ReadonlyMap<string, GT006StepItem>
): boolean {
  if (cur.length !== tgt.length) {
    return false;
  }
  return cur.every((id, i) => {
    const t = tgt[i];
    return Boolean(
      t && (id === t || areStepsVisuallyEquivalent(byId.get(id), byId.get(t)))
    );
  });
}

export function shuffleSequenceWithDerangement(
  seq: readonly GT006StepItem[],
  tgt: readonly string[],
  rng: Rng
): string[] {
  const out = [
    ...deriveDerangement(
      seq.map((st) => st.step_id),
      rng
    ),
  ];
  const byId = new Map(seq.map((st) => [st.step_id, st]));
  if (out.length >= 2 && isSequenceEquivalentMatch(out, tgt, byId)) {
    const first = out[0];
    const k = out.findIndex(
      (id, i) =>
        i > 0 &&
        first !== undefined &&
        !areStepsVisuallyEquivalent(byId.get(first), byId.get(id))
    );
    const second = k > 0 ? out[k] : undefined;
    if (first !== undefined && second !== undefined) {
      out[0] = second;
      out[k] = first;
    }
  }
  return out;
}

export function findFirstSequenceMismatch(
  cur: readonly string[],
  tgt: readonly string[],
  byId: ReadonlyMap<string, GT006StepItem>
): number {
  const len = Math.max(cur.length, tgt.length);
  for (let i = 0; i < len; i++) {
    const a = cur[i];
    const b = tgt[i];
    if (
      !(a && b) ||
      (a !== b && !areStepsVisuallyEquivalent(byId.get(a), byId.get(b)))
    ) {
      return i;
    }
  }
  return -1;
}

export function findNextSequenceMove(
  cur: readonly string[],
  tgt: readonly string[],
  byId: ReadonlyMap<string, GT006StepItem>
): { readonly from: number; readonly to: number } | null {
  const to = findFirstSequenceMismatch(cur, tgt, byId);
  const expId = to >= 0 ? tgt[to] : undefined;
  if (!expId) {
    return null;
  }
  const exact = cur.indexOf(expId, to + 1);
  if (exact >= 0 && exact !== to) {
    return { from: exact, to };
  }
  const expStep = byId.get(expId);
  for (let i = 0; i < cur.length; i++) {
    const cid = cur[i];
    if (
      i !== to &&
      cid &&
      (cid === expId || areStepsVisuallyEquivalent(byId.get(cid), expStep))
    ) {
      return { from: i, to };
    }
  }
  return null;
}

function simulateMoves(
  cur: readonly string[],
  tgt: readonly string[],
  byId: ReadonlyMap<string, GT006StepItem>,
  swap: boolean
): HintDemoStep[] {
  const work = [...cur];
  const steps: HintDemoStep[] = [];
  for (let i = 0; i < 3; i++) {
    const mv = findNextSequenceMove(work, tgt, byId);
    const a = mv ? work[mv.from] : undefined;
    const b = mv ? work[mv.to] : undefined;
    if (!(mv && a !== undefined && b !== undefined)) {
      break;
    }
    steps.push({ from: mv.from, to: mv.to });
    if (swap) {
      work[mv.from] = b;
      work[mv.to] = a;
    } else {
      work.splice(mv.from, 1);
      work.splice(mv.to, 0, a);
    }
  }
  return steps;
}

export function computeGT006HintDemoSteps(
  cur: readonly string[],
  tgt: readonly string[],
  byId: ReadonlyMap<string, GT006StepItem>
): readonly HintDemoStep[] | null {
  const ins = simulateMoves(cur, tgt, byId, false);
  if (ins.length >= 2) {
    return ins;
  }
  const swp = simulateMoves(cur, tgt, byId, true);
  return swp.length >= 2 ? swp : null;
}

export function findNearestSlotHitIndex(
  slots: readonly Slot[],
  x: number,
  y: number,
  tol: number
): number {
  return findHitSlotIndex(slots, x, y, "square", tol);
}

export function resolveGT006DropAction(
  slots: readonly Slot[],
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  tol: number
): GameAction | null {
  const f = findNearestSlotHitIndex(slots, fromX, fromY, tol);
  const t = findNearestSlotHitIndex(slots, toX, toY, tol);
  return f >= 0 && t >= 0 && f !== t
    ? { type: "reorder_step", data: { from_index: f, to_index: t } }
    : null;
}

export function resolveGT006CardSpec(
  s: Slot,
  o: GT006StepCardOptions,
  reducedMotion: boolean
): {
  readonly pal: GT006CardPalette;
  readonly pose: GT006CardPose;
  readonly b: GT006CardBox;
} {
  const pal = resolveGT006CardPalette(o.state, o.isReceiveTarget);
  const pose = resolveGT006CardPose({
    ...o,
    slotIndex: s.index,
    reducedMotion,
  });
  return { pal, pose, b: computeGT006CardBox(s, pose, o.stageRect) };
}

function pulseScale(
  now: number,
  t0: number | null,
  dur: number,
  b: number,
  rm: boolean
): number {
  return rm || t0 === null || now - t0 >= dur
    ? b
    : b + Math.sin((Math.max(0, now - t0) / dur) * Math.PI) * 0.04;
}
function makePose(
  offsetX: number,
  offsetY: number,
  scale: number,
  baseLift: number,
  shadowBlur: number
): GT006CardPose {
  return { offsetX, offsetY, scale, baseLift, shadowBlur };
}
function resolveIdlePose(inp: GT006CardPoseInput): GT006CardPose {
  const rm = inp.reducedMotion;
  if (inp.isReceiveTarget) {
    return makePose(0, rm ? 0 : -2, rm ? 1 : 1.03, 4, 10);
  }
  const ph = inp.timeMs / 680 + inp.slotIndex * 0.85;
  const sc = rm ? 1 : 1 + Math.sin(ph) * 0.012;
  const dy = rm ? 0 : Math.cos(ph) * 1.2;
  const pSc = pulseScale(inp.timeMs, inp.settledAtMs, SETTLED_POP_MS, sc, rm);
  return makePose(0, dy, pSc, 3.5, 8);
}
function resolveActivePose(inp: GT006CardPoseInput): GT006CardPose {
  const rm = inp.reducedMotion;
  if (inp.state === "touching") {
    return makePose(0, rm ? 0 : 2, rm ? 1 : 0.95, 1.5, 5);
  }
  if (inp.state === "selected") {
    const base = rm ? 1 : 1.06;
    const sc = pulseScale(inp.timeMs, inp.stagedAtMs, STAGED_POP_MS, base, rm);
    return makePose(0, rm ? 0 : -5, sc, 4.5, 12);
  }
  const base = rm ? 1 : 1.02;
  const sc = pulseScale(inp.timeMs, inp.settledAtMs, SETTLED_POP_MS, base, rm);
  return makePose(0, 0, sc, 2.5, 6);
}

export function resolveGT006CardPose(inp: GT006CardPoseInput): GT006CardPose {
  if (inp.state === "wrong") {
    const p = inp.wrongProgress ?? 0;
    const ox = inp.reducedMotion ? 0 : Math.sin(p * Math.PI * 4) * (1 - p) * 4;
    return makePose(ox, 0, 1, 3, 6);
  }
  return inp.state === "idle" ? resolveIdlePose(inp) : resolveActivePose(inp);
}
