import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import { alpha } from "#src/render/color-utils.js";
import { detectSlotVisualComparisonCue } from "#src/render/slot-decor.js";
import { shuffle } from "#src/rng/shuffle";
import type { Rng } from "#src/rng/types";
import { designTokens } from "#src/systems/designTokens";
import type { Particle } from "#src/systems/render-system";
import type {
  GT005AnchorSide,
  GT005CardAnchor,
  GT005CardPalette,
  GT005CardPose,
  GT005CardPoseInput,
  GT005CardVisualState,
} from "./pair-columns.js";
import type { GT005Content } from "./template.js";

export type GT005SideItem = GT005Content["pairs"][number]["left"];

export interface ActivePair {
  readonly pairId: string;
  readonly leftId: string;
  readonly rightId: string;
}

export interface EquivalentMatchResolution {
  readonly matchedPair: ActivePair;
  readonly nextActivePairs: readonly ActivePair[];
}

const STAGED_POP_MS = 200;
const MATCHED_SETTLE_MS = 220;
const BASE_FRAME_MS = 16.67;
const c = designTokens.colors;

const PAIR_ACCENTS: readonly string[] = [
  c.semantic.success[500],
  c.montessori.indigo,
  c.cta[500],
  c.montessori.coral,
  c.brand[400],
  c.montessori.amberDark,
];

function pal(
  fill: string,
  rim: string,
  base: string,
  innerRim: string | null,
  lineWidth: number
): GT005CardPalette {
  return { fill, rim, base, innerRim, lineWidth };
}

const m = c.montessori;
const s = c.semantic.success;
const CARD_PALETTES: Readonly<Record<GT005CardVisualState, GT005CardPalette>> =
  {
    idle: pal(c.surface[0], m.woodBevel, m.woodBorder, null, 2.5),
    touching: pal(c.brand[50], c.brand[400], c.brand[600], c.brand[300], 3.5),
    selected: pal(m.amberGlow, m.amber, m.amberDeep, c.cta[300], 4),
    correct: pal(s[50], s[500], s[700], alpha(s[400], 0.55), 3),
    wrong: pal(c.retry[100], c.retry[600], c.retry[700], c.retry[300], 3.5),
  };

export function resolveGT005CardPalette(
  state: GT005CardVisualState
): GT005CardPalette {
  return CARD_PALETTES[state];
}

export function resolveGT005PairAccent(pairIndex: number): string {
  return (
    PAIR_ACCENTS[Math.abs(pairIndex) % PAIR_ACCENTS.length] ??
    c.semantic.success[500]
  );
}

export function itemVisualSignature(item: GT005SideItem): string {
  const emoji = item.asset.kind === "emoji" ? item.asset.ref : undefined;
  const cue = detectSlotVisualComparisonCue(undefined, item.item_id, emoji);
  const cueSig = cue ? `${cue.kind}:${cue.glyphScale}:${cue.barRatio}` : "none";
  let raw = "";
  if (item.asset.kind === "text") {
    raw = item.asset.text;
  } else if (item.asset.kind === "emoji") {
    raw = item.asset.ref;
  } else {
    raw = item.asset.path;
  }
  return `${item.asset.kind}|${raw}|${cueSig}`;
}

function areVisuallyEqual(
  items: readonly GT005SideItem[],
  idA: string,
  idB: string
): boolean {
  const a = items.find((i) => i.item_id === idA);
  const b = items.find((i) => i.item_id === idB);
  return Boolean(a && b && itemVisualSignature(a) === itemVisualSignature(b));
}

export function resolveEquivalentMatch(
  leftId: string,
  rightId: string,
  activePairs: readonly ActivePair[],
  leftItems: readonly GT005SideItem[],
  rightItems: readonly GT005SideItem[],
  isLeftMatched: (id: string) => boolean,
  isRightMatched: (id: string) => boolean
): EquivalentMatchResolution | null {
  if (isLeftMatched(leftId) || isRightMatched(rightId)) {
    return null;
  }
  const pairA = activePairs.find(
    (p) => p.leftId === leftId && !isLeftMatched(p.leftId)
  );
  const pairB = activePairs.find(
    (p) => p.rightId === rightId && !isRightMatched(p.rightId)
  );
  if (!(pairA && pairB)) {
    return null;
  }
  if (pairA.pairId === pairB.pairId) {
    return { matchedPair: pairA, nextActivePairs: activePairs };
  }
  const sameR = areVisuallyEqual(rightItems, pairA.rightId, pairB.rightId);
  const sameL = areVisuallyEqual(leftItems, pairA.leftId, pairB.leftId);
  if (!(sameR || sameL)) {
    return null;
  }
  const swapped: ActivePair = { ...pairA, rightId: pairB.rightId };
  const nextActivePairs = activePairs.map((p) => {
    if (p.pairId === pairA.pairId) {
      return swapped;
    }
    return p.pairId === pairB.pairId ? { ...pairB, rightId: pairA.rightId } : p;
  });
  return { matchedPair: swapped, nextActivePairs };
}

export function shuffleSidesWithDerangement(
  pairs: GT005Content["pairs"],
  rng: Rng
): {
  readonly displayLeft: readonly GT005SideItem[];
  readonly displayRight: readonly GT005SideItem[];
} {
  const displayLeft = shuffle(
    pairs.map((p) => p.left),
    rng
  );
  const displayRight = [
    ...shuffle(
      pairs.map((p) => p.right),
      rng
    ),
  ];
  const allAligned =
    pairs.length >= 2 &&
    displayLeft.every((l, i) =>
      pairs.some(
        (p) =>
          p.left.item_id === l.item_id &&
          p.right.item_id === displayRight[i]?.item_id
      )
    );
  if (allAligned && displayRight[0] && displayRight[1]) {
    const tmp = displayRight[0];
    displayRight[0] = displayRight[1];
    displayRight[1] = tmp;
  }
  return { displayLeft, displayRight };
}

export function resolveGT005LayoutOrientation(
  sources: readonly Slot[],
  targets: readonly Slot[]
): "horizontal" | "vertical" {
  if (sources.length === 0 || targets.length === 0) {
    return "horizontal";
  }
  const srcMaxY = Math.max(...sources.map((s) => s.y + s.h / 2));
  const tgtMinY = Math.min(...targets.map((s) => s.y - s.h / 2));
  return srcMaxY <= tgtMinY ? "vertical" : "horizontal";
}

export function computeGT005CardAnchor(
  slot: Slot,
  role: "source" | "target",
  orientation: "horizontal" | "vertical"
): GT005CardAnchor {
  const halfW = Math.min(slot.w, slot.hitW) / 2;
  const halfH = Math.min(slot.h, slot.hitH) / 2;
  const ins = Math.min(
    10,
    Math.max(6, Math.round(Math.min(halfW, halfH) * 0.22))
  );
  if (orientation === "vertical") {
    const side: GT005AnchorSide = role === "source" ? "bottom" : "top";
    return {
      x: slot.x,
      y: side === "bottom" ? slot.y + halfH - ins : slot.y - halfH + ins,
      side,
    };
  }
  const side: GT005AnchorSide = role === "source" ? "right" : "left";
  return {
    x: side === "right" ? slot.x + halfW - ins : slot.x - halfW + ins,
    y: slot.y,
    side,
  };
}

function pulseScale(
  now: number,
  start: number | null,
  dur: number,
  base: number,
  rm: boolean
): number {
  if (rm || start === null || now - start >= dur) {
    return base;
  }
  return base + Math.sin((Math.max(0, now - start) / dur) * Math.PI) * 0.04;
}

function makePose(
  offsetX: number,
  offsetY: number,
  scale: number,
  baseLift: number,
  shadowBlur: number
): GT005CardPose {
  return { offsetX, offsetY, scale, baseLift, shadowBlur };
}

export function resolveGT005CardPose(input: GT005CardPoseInput): GT005CardPose {
  const rm = input.reducedMotion;
  switch (input.state) {
    case "wrong": {
      const p = input.wrongProgress ?? 0;
      const ox = rm ? 0 : Math.sin(p * Math.PI * 4) * (1 - p) * 4;
      return makePose(ox, 0, 1, 3, 6);
    }
    case "touching":
      return makePose(0, rm ? 0 : 1, rm ? 1 : 0.96, 1.5, 5);
    case "selected": {
      const s = pulseScale(
        input.timeMs,
        input.stagedAtMs,
        STAGED_POP_MS,
        rm ? 1 : 1.03,
        rm
      );
      return makePose(0, rm ? 0 : -2, s, 4, 12);
    }
    case "correct": {
      const s = pulseScale(
        input.timeMs,
        input.matchedAtMs,
        MATCHED_SETTLE_MS,
        0.97,
        rm
      );
      return makePose(0, 0, s, 2, 4);
    }
    default: {
      const s = rm
        ? 1
        : 1 + Math.sin(input.timeMs / 680 + input.slotIndex * 0.85) * 0.012;
      return makePose(0, 0, s, 3.5, 8);
    }
  }
}

export function stepParticlesByDelta(
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
