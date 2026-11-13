import type { AgeBand } from "#src/contracts/types";
import type { GameAction } from "#src/game-session";
import type { Gesture } from "#src/interaction";
import {
  CONTENT_TOP_PX,
  type LogicSpace,
  resolveTouchFloor,
  SAFE_MARGIN_PX,
} from "#src/layout/constants";
import {
  HERO_OPTION_CELL_MAX_PX,
  heroSlot,
  splitHeroStage,
} from "#src/layout/hero-split";
import { findHitSlotIndex, TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import { computeStageCellSlots } from "#src/layout/stage-targets";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import { insetBox, type SceneBox, sceneBox } from "#src/render/index";
import type { GT017HeroLayout, GT017ProjectedCube } from "#src/render/types";
import { deriveStream } from "#src/rng/mulberry32";
import { shuffle } from "#src/rng/shuffle";
import {
  type CubeCoord,
  computeTopView,
  countHiddenCubes,
  isCubeHidden,
  projectIsometric,
  type RotationAngle,
  sortCubesForRender,
} from "#src/systems/isometric-system";
import type { RenderSystem } from "#src/systems/render-system";
import type { GT017Content, GT017Difficulty } from "./template.js";

const OPENING_ROTATIONS: readonly RotationAngle[] = [90, 180, 270];
const ALL_ROTATIONS: readonly RotationAngle[] = [0, 90, 180, 270];

export interface GT017ProjectedModel {
  readonly size: number;
  readonly cubes: readonly GT017ProjectedCube[];
  readonly topView: readonly (readonly number[])[];
}

export interface GT017RoundSetup {
  readonly orderedOptions: GT017Content["options"];
  readonly initialRotation: RotationAngle;
}

const projectedModelCache = new WeakMap<
  readonly CubeCoord[],
  Map<string, GT017ProjectedModel>
>();

export function computeGT017HeroLayout(heroBox: SceneBox): GT017HeroLayout {
  const minDim = Math.min(heroBox.w, heroBox.h);
  const pad = Math.max(4, Math.round(minDim * 0.04));
  const badgeSize = Math.max(22, Math.min(40, Math.round(minDim * 0.16)));
  const mw = Math.round(heroBox.w * 0.78);
  const mh = Math.round(heroBox.h * 0.74);
  const mx = Math.round(heroBox.x + (heroBox.w - mw) * 0.5);
  const my = Math.round(heroBox.y + heroBox.h * 0.05);
  const rimH = Math.max(5, Math.round(heroBox.h * 0.042));
  const ry = Math.max(12, Math.round(heroBox.h * 0.135));
  const cy = Math.round(heroBox.y + heroBox.h - pad - rimH - ry);
  const cx = Math.round(heroBox.x + heroBox.w * 0.5);
  const knobR = Math.max(9, Math.min(16, Math.round(minDim * 0.07)));
  const maxRx = Math.max(24, Math.round(heroBox.w * 0.5 - pad - knobR * 2.4));
  const rx = Math.min(Math.round(heroBox.w * 0.35), maxRx);
  const knobOff = Math.min(
    Math.round(heroBox.w * 0.5 - pad - knobR - 2),
    rx + Math.round(knobR * 1.15)
  );
  return {
    heroBox,
    badgeBox: {
      x: heroBox.x + pad,
      y: heroBox.y + pad,
      w: badgeSize,
      h: badgeSize,
    },
    topViewBox: {
      x: heroBox.x + heroBox.w - pad - badgeSize,
      y: heroBox.y + pad,
      w: badgeSize,
      h: badgeSize,
    },
    turntable: {
      cx,
      cy,
      rx,
      ry,
      rimH,
      leftKnob: { cx: cx - knobOff, cy, r: knobR },
      rightKnob: { cx: cx + knobOff, cy, r: knobR },
    },
    modelBox: { x: mx, y: my, w: mw, h: mh },
  };
}

export function computeGT017ProjectedModel(
  box: SceneBox,
  model: readonly CubeCoord[],
  rotation: RotationAngle
): GT017ProjectedModel {
  let byKey = projectedModelCache.get(model);
  if (!byKey) {
    byKey = new Map<string, GT017ProjectedModel>();
    projectedModelCache.set(model, byKey);
  }
  const key = `${rotation}:${box.x}:${box.y}:${box.w}:${box.h}`;
  const cached = byKey.get(key);
  if (cached) {
    return cached;
  }
  const ordered = sortCubesForRender(model, rotation);
  const unit = ordered.map((c) => projectIsometric(c, 0, 0, 1));
  const minX = Math.min(...unit.map((p) => p.screenX)) - 1;
  const maxX = Math.max(...unit.map((p) => p.screenX)) + 1;
  const minY = Math.min(...unit.map((p) => p.screenY)) - 0.5;
  const maxY = Math.max(...unit.map((p) => p.screenY)) + 1.5;
  const size = Math.max(
    1,
    Math.min(
      Math.min(box.w, box.h) / 6,
      (box.w - 4) / (maxX - minX),
      (box.h - 4) / (maxY - minY)
    )
  );
  const cx = box.x + box.w / 2 - ((minX + maxX) / 2) * size;
  const cy = box.y + box.h / 2 - ((minY + maxY) / 2) * size;
  const projected: GT017ProjectedModel = {
    size,
    cubes: ordered.map((c) => {
      const p = projectIsometric(c, cx, cy, size);
      return {
        sx: p.screenX,
        sy: p.screenY,
        z: c.z,
        hidden: isCubeHidden(c, ordered, 0),
      };
    }),
    topView: computeTopView(model),
  };
  byKey.set(key, projected);
  return projected;
}

export function computeGT017Slots(
  ageBand: AgeBand,
  logicSpace: LogicSpace,
  stageRect: ZoneRect | undefined,
  cssPerLogic: number | undefined,
  optionCount: number
): readonly Slot[] {
  const area: ZoneRect = stageRect ?? {
    x: SAFE_MARGIN_PX,
    y: CONTENT_TOP_PX,
    w: logicSpace.w - 2 * SAFE_MARGIN_PX,
    h: logicSpace.h - CONTENT_TOP_PX - SAFE_MARGIN_PX,
  };
  const touchFloor = resolveTouchFloor(ageBand, cssPerLogic);
  const { hero, rest } = splitHeroStage(area, optionCount > 0, {
    count: optionCount,
    touchFloor,
  });
  return [
    heroSlot(hero, 0),
    ...computeStageCellSlots({
      count: optionCount,
      stage: rest,
      touchFloor,
      maxCell: { w: HERO_OPTION_CELL_MAX_PX, h: HERO_OPTION_CELL_MAX_PX },
      role: "source",
      firstIndex: 1,
    }),
  ];
}

export function resolveGT017RoundSetup(
  content: GT017Content,
  difficulty: GT017Difficulty,
  layoutSeed: number,
  roundGeneration: number
): GT017RoundSetup {
  if (layoutSeed === 0) {
    return { orderedOptions: [...content.options], initialRotation: 0 };
  }
  const effectiveSeed = layoutSeed + roundGeneration * 997;
  const itemRng = deriveStream(effectiveSeed, "items");
  const baseOptions = [...content.options];
  let orderedOptions = shuffle(baseOptions, itemRng);
  if (
    orderedOptions.length >= 2 &&
    orderedOptions.every(
      (opt, idx) => opt.option_id === baseOptions[idx]?.option_id
    )
  ) {
    const first = orderedOptions[0];
    if (first) {
      orderedOptions = [...orderedOptions.slice(1), first];
    }
  }
  let initialRotation: RotationAngle = 0;
  if (content.question === "count_cubes" && difficulty.allow_rotate) {
    const rotRng = deriveStream(effectiveSeed, "initial");
    initialRotation =
      OPENING_ROTATIONS[rotRng.nextInt(OPENING_ROTATIONS.length)] ?? 90;
  }
  return { orderedOptions, initialRotation };
}

export function findHitGT017OptionId(
  optionSlots: readonly Slot[],
  options: readonly { readonly option_id: string }[],
  x: number,
  y: number
): string | null {
  const index = findHitSlotIndex(
    optionSlots.slice(0, options.length),
    x,
    y,
    "square",
    TAP_TOLERANCE_PX
  );
  return index >= 0 ? (options[index]?.option_id ?? null) : null;
}

export function resolveGT017HeroHitSide(
  targetSlot: Slot | undefined,
  x: number,
  y: number
): "ccw" | "cw" | "center" | null {
  if (!targetSlot) {
    return null;
  }
  const hit = findHitSlotIndex([targetSlot], x, y, "square", TAP_TOLERANCE_PX);
  if (hit < 0) {
    return null;
  }
  if (x < targetSlot.x - targetSlot.w * 0.12) {
    return "ccw";
  }
  if (x > targetSlot.x + targetSlot.w * 0.12) {
    return "cw";
  }
  return "center";
}

function resolveHeroRotateTap(
  heroSlot: Slot | undefined,
  allowRotate: boolean,
  x: number,
  y: number
): GameAction | null {
  if (!allowRotate) {
    return null;
  }
  const side = resolveGT017HeroHitSide(heroSlot, x, y);
  return side === null
    ? null
    : { type: "rotate_model", data: side === "ccw" ? "ccw" : "cw" };
}

function resolveHeroRotateDrop(
  heroSlot: Slot | undefined,
  allowRotate: boolean,
  fromX: number,
  fromY: number,
  toX: number
): GameAction | null {
  if (!allowRotate) {
    return null;
  }
  const side = resolveGT017HeroHitSide(heroSlot, fromX, fromY);
  const dx = toX - fromX;
  if (side === null || Math.abs(dx) < 16) {
    return null;
  }
  return { type: "rotate_model", data: dx >= 0 ? "cw" : "ccw" };
}

export function resolveGT017GestureAction(
  gesture: Gesture,
  optionSlots: readonly Slot[],
  heroSlot: Slot | undefined,
  orderedOptions: readonly { readonly option_id: string }[],
  allowRotate: boolean,
  canSelect: boolean
): GameAction | null {
  if (gesture.type === "tap") {
    const hitId = canSelect
      ? findHitGT017OptionId(optionSlots, orderedOptions, gesture.x, gesture.y)
      : null;
    return hitId
      ? { type: "select_option", data: hitId }
      : resolveHeroRotateTap(heroSlot, allowRotate, gesture.x, gesture.y);
  }
  if (gesture.type === "drop") {
    return resolveHeroRotateDrop(
      heroSlot,
      allowRotate,
      gesture.fromX,
      gesture.fromY,
      gesture.toX
    );
  }
  if (gesture.type === "adjust" && allowRotate) {
    return { type: "rotate_model", data: gesture.delta > 0 ? "cw" : "ccw" };
  }
  return null;
}

export function resolveGT017HeroBox(
  slots: readonly Slot[],
  stageRect: ZoneRect | undefined,
  rs: RenderSystem
): SceneBox {
  const hero = slots.find((s) => s.role === "target");
  if (hero) {
    return {
      x: hero.x - hero.w / 2,
      y: hero.y - hero.h / 2,
      w: hero.w,
      h: hero.h,
    };
  }
  if (stageRect) {
    return {
      x: stageRect.x,
      y: stageRect.y,
      w: stageRect.w,
      h: stageRect.h * 0.6,
    };
  }
  const scene = insetBox(sceneBox(rs), 0.08);
  return { x: scene.x, y: scene.y, w: scene.w, h: scene.h * 0.6 };
}

export function findBestUnoccludedRotation(
  model: readonly CubeCoord[],
  currentRotation: RotationAngle
): RotationAngle {
  let bestAngle: RotationAngle = currentRotation;
  let bestHidden = countHiddenCubes(model, currentRotation);
  const currIdx = Math.max(0, ALL_ROTATIONS.indexOf(currentRotation));
  for (const step of [1, 2, 3]) {
    const candidate = ALL_ROTATIONS[(currIdx + step) % 4] ?? currentRotation;
    const hidden = countHiddenCubes(model, candidate);
    if (hidden < bestHidden) {
      bestHidden = hidden;
      bestAngle = candidate;
    }
  }
  return bestAngle;
}
