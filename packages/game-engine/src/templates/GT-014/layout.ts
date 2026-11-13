import type { HintDemoStep, HintLevel, HintTarget } from "#src/game-session";
import type { ViewEntity } from "#src/interaction";
import {
  type AssetLabels,
  type KeywordAsset,
  resolveAssetLabels,
} from "#src/labels/spoken-keyword";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import type { ItemVisualState, SceneBox } from "#src/render/types";
import { deriveStream } from "#src/rng/mulberry32";
import { shuffle } from "#src/rng/shuffle";
import {
  canAchieveBalance,
  sumWeights,
  type WeightedItem,
} from "#src/systems/balance-system";
import type { MontessoriExploreTracker } from "#src/systems/montessori-explore-system";
import type { WrongFlash } from "#src/systems/wrong-flash";
import type { GT014Content, PlacedPanItem } from "./template.js";

const DIGIT_OR_WEIGHT_RE = /\d|nặng/i;

export interface GT014HintSolverInput {
  readonly initialLeftIds: ReadonlySet<string>;
  readonly initialRightIds: ReadonlySet<string>;
  readonly leftItems: readonly WeightedItem[];
  readonly rightItems: readonly WeightedItem[];
  readonly trayItems: readonly WeightedItem[];
}

export interface GT014StateSnapshot {
  readonly session: object;
  readonly content: GT014Content;
  readonly accepting: boolean;
  readonly leftWeight: number;
  readonly rightWeight: number;
  readonly slots: readonly Slot[];
  readonly leftPanSlot: Slot | undefined;
  readonly rightPanSlot: Slot | undefined;
  readonly sourceSlots: readonly Slot[];
  readonly stageRect: ZoneRect | undefined;
  readonly stageBounds: SceneBox;
  readonly leftPanBox: SceneBox;
  readonly rightPanBox: SceneBox;
  readonly leftPlaced: readonly PlacedPanItem[];
  readonly rightPlaced: readonly PlacedPanItem[];
  readonly refBoxes: readonly SceneBox[];
  readonly assetById: ReadonlyMap<string, KeywordAsset>;
  readonly maxWeight: number;
  readonly tiltDeg: number;
  readonly sink: { readonly left: number; readonly right: number };
  readonly isBalanced: boolean;
  readonly isWon: boolean;
  readonly isRoundClosed: boolean;
  readonly selectedSide: "left" | "right" | null;
  readonly stagedItemId: string | null;
  readonly wrongSide: "left" | "right" | null;
  readonly wrongFlash: WrongFlash;
  readonly activeHintTier: 0 | 1 | 2 | 3;
  readonly exploreTracker: MontessoriExploreTracker;
  readonly getItemState: (id: string) => ItemVisualState;
  readonly solverInput: GT014HintSolverInput;
}

export function resolveGT014TrayOrder<T extends WeightedItem>(
  tray: readonly T[],
  layoutSeed: number
): T[] {
  if (layoutSeed === 0 || tray.length < 2) {
    return [...tray];
  }
  const rng = deriveStream(layoutSeed, "items");
  for (let i = 0; i < 4; i++) {
    const cand = shuffle(tray, rng);
    if (cand.some((it, idx) => it.item_id !== tray[idx]?.item_id)) {
      return cand;
    }
  }
  return [...tray.slice(1), ...(tray[0] ? [tray[0]] : [])];
}

export interface GT014PlacementStep {
  readonly trayIndex: number;
  readonly item: WeightedItem;
  readonly targetSide: "left" | "right";
}

export type GT014HintMove =
  | {
      readonly kind: "place";
      readonly trayIndex: number;
      readonly item: WeightedItem;
      readonly targetSide: "left" | "right";
      readonly sequence: readonly GT014PlacementStep[];
    }
  | {
      readonly kind: "return";
      readonly fromSide: "left" | "right";
      readonly item: WeightedItem;
    };

function buildStepsFromMask(
  mask: number,
  trayItems: readonly WeightedItem[],
  lighterSide: "left" | "right"
): { steps: GT014PlacementStep[]; addL: number; addR: number; score: number } {
  const steps: GT014PlacementStep[] = [];
  let addL = 0;
  let addR = 0;
  let temp = mask;
  for (let i = 0; i < trayItems.length; i++) {
    const ch = temp % 3;
    temp = Math.floor(temp / 3);
    const item = trayItems[i];
    if (ch > 0 && item) {
      const targetSide = ch === 1 ? "left" : "right";
      steps.push({ trayIndex: i, item, targetSide });
      addL += targetSide === "left" ? item.weight : 0;
      addR += targetSide === "right" ? item.weight : 0;
    }
  }
  steps.sort((a, b) => {
    const ap = a.targetSide === lighterSide ? 0 : 1;
    const bp = b.targetSide === lighterSide ? 0 : 1;
    return ap === bp ? a.trayIndex - b.trayIndex : ap - bp;
  });
  const first = steps[0];
  const pref = first?.targetSide === lighterSide ? 0 : 10;
  return {
    steps,
    addL,
    addR,
    score: steps.length * 100 + pref + (first?.trayIndex ?? 0),
  };
}

function findMinimalPlaceSequence(
  leftSum: number,
  rightSum: number,
  trayItems: readonly WeightedItem[]
): readonly GT014PlacementStep[] | null {
  const side: "left" | "right" = leftSum <= rightSum ? "left" : "right";
  let best: { steps: GT014PlacementStep[]; score: number } | null = null;
  for (let mask = 1, limit = 3 ** trayItems.length; mask < limit; mask++) {
    const c = buildStepsFromMask(mask, trayItems, side);
    if (
      leftSum + c.addL === rightSum + c.addR &&
      leftSum + c.addL > 0 &&
      (!best || c.score < best.score)
    ) {
      best = c;
    }
  }
  return best?.steps ?? null;
}

interface RemovableCand {
  fromSide: "left" | "right";
  index: number;
  item: WeightedItem;
}

function collectRemovableCandidates(
  input: GT014HintSolverInput
): RemovableCand[] {
  const sides =
    sumWeights(input.leftItems) >= sumWeights(input.rightItems)
      ? (["left", "right"] as const)
      : (["right", "left"] as const);
  return sides.flatMap((fromSide) => {
    const items = fromSide === "left" ? input.leftItems : input.rightItems;
    const init =
      fromSide === "left" ? input.initialLeftIds : input.initialRightIds;
    return items
      .map((item, index) => ({ fromSide, index, item }))
      .filter((c) => !init.has(c.item.item_id))
      .reverse();
  });
}

export function solveGT014NextHintMove(
  input: GT014HintSolverInput
): GT014HintMove | null {
  const leftSum = sumWeights(input.leftItems);
  const rightSum = sumWeights(input.rightItems);
  if (leftSum === rightSum && leftSum > 0) {
    return null;
  }
  const seq = findMinimalPlaceSequence(leftSum, rightSum, input.trayItems);
  const first = seq?.[0];
  if (seq && first) {
    return {
      kind: "place",
      trayIndex: first.trayIndex,
      item: first.item,
      targetSide: first.targetSide,
      sequence: seq,
    };
  }
  const candidates = collectRemovableCandidates(input);
  const match =
    candidates.find((c) => {
      const nextL =
        c.fromSide === "left"
          ? input.leftItems.filter((_, idx) => idx !== c.index)
          : input.leftItems;
      const nextR =
        c.fromSide === "right"
          ? input.rightItems.filter((_, idx) => idx !== c.index)
          : input.rightItems;
      return (
        sumWeights(nextL) === sumWeights(nextR) ||
        canAchieveBalance(nextL, nextR, [...input.trayItems, c.item])
      );
    }) ?? candidates[0];
  return match
    ? { kind: "return", fromSide: match.fromSide, item: match.item }
    : null;
}

export function sanitizeGT014AssetLabels(
  asset: KeywordAsset | undefined
): AssetLabels {
  const raw = asset ? resolveAssetLabels(asset) : null;
  const clean = (s?: string): string | undefined =>
    s && !DIGIT_OR_WEIGHT_RE.test(s) ? s : undefined;
  return {
    glyph: raw?.glyph,
    label: clean(raw?.label),
    spokenLabel: clean(raw?.spokenLabel) ?? "Quả cân",
    spokenAudioPath: raw?.spokenAudioPath,
  };
}

export function isGT014BrokenAsset(asset: KeywordAsset | undefined): boolean {
  if (!asset) {
    return true;
  }
  if (asset.kind === "emoji") {
    return !asset.ref.trim() || DIGIT_OR_WEIGHT_RE.test(asset.ref);
  }
  return asset.kind === "image"
    ? !asset.path.trim()
    : !asset.text.trim() || DIGIT_OR_WEIGHT_RE.test(asset.text);
}

function appendPanItems(
  p: GT014StateSnapshot,
  side: "left" | "right",
  out: ViewEntity[]
): void {
  const s = p.solverInput;
  const placed = side === "left" ? p.leftPlaced : p.rightPlaced;
  const initIds = side === "left" ? s.initialLeftIds : s.initialRightIds;
  const prefix = side === "left" ? "pan-0" : "pan-1";
  for (const pl of placed) {
    const labels = sanitizeGT014AssetLabels(p.assetById.get(pl.item.item_id));
    const isInit = initIds.has(pl.item.item_id);
    out.push({
      id: `${prefix}:${pl.item.item_id}`,
      slotIndex: -1,
      role: isInit ? "neutral" : "source",
      state: isInit ? "correct" : "active",
      x: Math.round(pl.x),
      y: Math.round(pl.y),
      w: pl.size,
      h: pl.size,
      hitShape: "circle",
      ...labels,
      spokenLabel: labels.spokenLabel ?? "Quả cân",
    });
  }
}

export function buildGT014ViewEntities(p: GT014StateSnapshot): ViewEntity[] {
  const out: ViewEntity[] = [];
  for (const [id, side, slot, label] of [
    ["left_pan", "left", p.leftPanSlot, "Đĩa cân bên trái"],
    ["right_pan", "right", p.rightPanSlot, "Đĩa cân bên phải"],
  ] as const) {
    if (!slot) {
      continue;
    }
    const idx = p.slots.indexOf(slot);
    const won =
      p.isWon && (p.content.goal === "balance" || p.selectedSide === side);
    const sel = p.selectedSide === side ? "selected" : "idle";
    out.push({
      id,
      slotIndex: idx >= 0 ? idx : -1,
      role: "target",
      state: won ? "correct" : sel,
      x: slot.x,
      y: slot.y,
      w: Math.max(slot.hitW, slot.w),
      h: Math.max(slot.hitH, slot.h),
      hitShape: "square",
      label,
      spokenLabel: label,
    });
  }
  appendPanItems(p, "left", out);
  appendPanItems(p, "right", out);
  p.solverInput.trayItems.forEach((item, i) => {
    const slot = p.sourceSlots[i];
    if (!slot) {
      return;
    }
    const idx = p.slots.indexOf(slot);
    const labels = sanitizeGT014AssetLabels(p.assetById.get(item.item_id));
    out.push({
      id: item.item_id,
      slotIndex: idx >= 0 ? idx : -1,
      role: "source",
      state: p.stagedItemId === item.item_id ? "selected" : "idle",
      x: slot.x,
      y: slot.y,
      w: Math.max(slot.hitW, slot.w),
      h: Math.max(slot.hitH, slot.h),
      hitShape: "circle",
      ...labels,
      spokenLabel: labels.spokenLabel ?? "Quả cân",
    });
  });
  (p.content.reference_scales ?? []).forEach((ref, idx) => {
    const box = p.refBoxes[idx];
    if (box) {
      out.push({
        id: ref.scale_id,
        slotIndex: -1,
        role: "neutral",
        state: "idle",
        x: Math.round(box.x + box.w / 2),
        y: Math.round(box.y + box.h / 2),
        w: Math.round(box.w),
        h: Math.round(box.h),
        hitShape: "square",
        label: "Cân mẫu thăng bằng",
        spokenLabel: "Cân mẫu thăng bằng",
      });
    }
  });
  return out;
}

export function resolvePickExpectedSide(
  goal: GT014Content["goal"],
  leftW: number,
  rightW: number
): "left" | "right" {
  return (goal === "pick_lighter" ? leftW < rightW : leftW > rightW)
    ? "left"
    : "right";
}

function slotIndexOrNull(
  slots: readonly Slot[],
  slot: Slot | undefined
): number | null {
  const idx = slot ? slots.indexOf(slot) : -1;
  return idx >= 0 ? idx : null;
}

export function resolveGT014HintTargetIndex(
  h: GT014StateSnapshot
): number | null {
  if (!h.accepting) {
    return null;
  }
  if (h.content.goal !== "balance") {
    const side = resolvePickExpectedSide(
      h.content.goal,
      h.leftWeight,
      h.rightWeight
    );
    return slotIndexOrNull(
      h.slots,
      side === "left" ? h.leftPanSlot : h.rightPanSlot
    );
  }
  const move = solveGT014NextHintMove(h.solverInput);
  if (!move) {
    return null;
  }
  return move.kind === "place"
    ? slotIndexOrNull(h.slots, h.sourceSlots[move.trayIndex])
    : slotIndexOrNull(
        h.slots,
        move.fromSide === "left" ? h.leftPanSlot : h.rightPanSlot
      );
}

export function resolveGT014HintDestinationIndex(
  h: GT014StateSnapshot
): number | null {
  const move =
    h.accepting && h.content.goal === "balance"
      ? solveGT014NextHintMove(h.solverInput)
      : null;
  return move?.kind === "place"
    ? slotIndexOrNull(
        h.slots,
        move.targetSide === "left" ? h.leftPanSlot : h.rightPanSlot
      )
    : null;
}

export function resolveGT014HintTargetForLevel(
  h: GT014StateSnapshot,
  level: HintLevel
): HintTarget | null {
  if (!h.accepting) {
    return null;
  }
  if (level === 3) {
    const index = resolveGT014HintTargetIndex(h);
    const toIndex = resolveGT014HintDestinationIndex(h);
    if (index === null) {
      return null;
    }
    return toIndex === null
      ? { kind: "slot", index }
      : { kind: "slot", index, toIndex };
  }
  if (h.content.goal !== "balance") {
    const side = resolvePickExpectedSide(
      h.content.goal,
      h.leftWeight,
      h.rightWeight
    );
    const ids = level === 1 ? ["left_pan", "right_pan"] : [`${side}_pan`];
    return { kind: "region", ids };
  }
  const move = solveGT014NextHintMove(h.solverInput);
  if (!move) {
    return null;
  }
  const side = move.kind === "place" ? move.targetSide : move.fromSide;
  const ids =
    level === 1 ? [`${side}_pan`] : [`${side}_pan`, move.item.item_id];
  return { kind: "region", ids };
}

function mapPlacementStepToDemo(
  h: GT014StateSnapshot,
  step: GT014PlacementStep
): HintDemoStep | null {
  const from = slotIndexOrNull(h.slots, h.sourceSlots[step.trayIndex]);
  const to = slotIndexOrNull(
    h.slots,
    step.targetSide === "left" ? h.leftPanSlot : h.rightPanSlot
  );
  return from !== null && to !== null ? { from, to } : null;
}

export function resolveGT014HintDemoSequence(
  h: GT014StateSnapshot,
  level: HintLevel
): readonly HintDemoStep[] | null {
  if (level < 3 || !h.accepting) {
    return null;
  }
  const move =
    h.content.goal === "balance" ? solveGT014NextHintMove(h.solverInput) : null;
  if (move?.kind === "place") {
    const steps = move.sequence
      .slice(0, 3)
      .map((s) => mapPlacementStepToDemo(h, s))
      .filter((s): s is HintDemoStep => s !== null);
    return steps.length > 0 ? steps : null;
  }
  const idx = resolveGT014HintTargetIndex(h);
  return idx === null ? null : [{ from: idx }];
}
