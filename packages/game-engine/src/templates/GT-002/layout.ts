import type { AgeBand } from "#src/contracts/types";
import {
  type LogicSpace,
  resolveTouchFloor,
  SLOT_GAP_PX,
} from "#src/layout/constants";
import { resolveLayout } from "#src/layout/registry";
import {
  dockRectAroundSlots,
  insetDrawSize,
  legacyStageArea,
} from "#src/layout/slot-fit";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import { is3DGeometricForm } from "#src/render/geometric-primitives";
import type { ItemVisualState } from "#src/render/types";
import { designTokens } from "#src/systems/designTokens";
import type { Particle } from "#src/systems/render-system";
import type {
  GT002Item,
  GT002PlateVariant,
} from "#src/templates/GT-002/template";

const IDLE_BREATHE_SPEED = 0.0024;
const IDLE_BREATHE_AMPLITUDE_PX = 1.2;
const SELECT_POP_DURATION_MS = 220;
const WIN_SPRING_DURATION_MS = 450;
const DEFAULT_SLAB_DEPTH_PX = 3.5;
const TOUCHING_SLAB_DEPTH_PX = 1.5;
const TOUCHING_SINK_Y_PX = 1.5;
const TOUCHING_SCALE = 0.95;

const HEADER_TOP_PAD_PX = 6;
const HEADER_SIDE_PAD_PX = 8;
const HEADER_HEIGHT_PX = 44;
const HEADER_MIN_HEIGHT_PX = 32;
const HEADER_GAP_PX = 8;
const SIDE_RAIL_WIDTH_PX = 76;
const ACTION_PIN_MIN_PX = 28;
const ACTION_PIN_MAX_PX = 30;

export interface GT002TokenAnimState {
  readonly timeMs: number;
  readonly selectElapsedMs: number;
  readonly winElapsedMs: number;
  readonly wrongProgress: number;
  readonly isActiveWrong: boolean;
  readonly isHintActive?: boolean;
}

export interface GT002TokenPose {
  readonly dx: number;
  readonly dy: number;
  readonly scale: number;
  readonly slabDepth: number;
}

export interface GT002PlatePalette {
  readonly rimBorder: string;
  readonly rimBorderWidth: number;
  readonly tokenFill: string;
  readonly tokenBorder: string;
  readonly tokenSlab: string;
  readonly tokenBorderWidth: number;
  readonly innerRing: string | null;
  readonly badgeFill: string | null;
  readonly badgeBorder: string | null;
}

export interface GT002StageLayoutInput {
  readonly itemCount: number;
  readonly ageBand: AgeBand;
  readonly logicSpace: LogicSpace;
  readonly stageRect?: ZoneRect;
  readonly cssPerLogic?: number;
}

export interface GT002StageLayout {
  readonly bounds: ZoneRect;
  readonly headerPlacement: "top" | "side";
  readonly criterionHeaderRect: ZoneRect;
  readonly gridArea: ZoneRect;
  readonly slots: readonly Slot[];
  readonly boardRect: ZoneRect | null;
  readonly actionPinRect: ZoneRect;
}

const { brand, cta, montessori, retry, semantic, surface } =
  designTokens.colors;

const PLATE_PALETTES: Readonly<Record<ItemVisualState, GT002PlatePalette>> = {
  idle: {
    rimBorder: montessori.woodBevel,
    rimBorderWidth: 2.5,
    tokenFill: surface[0],
    tokenBorder: cta[200],
    tokenSlab: montessori.woodBorder,
    tokenBorderWidth: 2.5,
    innerRing: null,
    badgeFill: null,
    badgeBorder: null,
  },
  touching: {
    rimBorder: brand[400],
    rimBorderWidth: 3,
    tokenFill: brand[50],
    tokenBorder: brand[400],
    tokenSlab: brand[600],
    tokenBorderWidth: 3.5,
    innerRing: brand[300],
    badgeFill: null,
    badgeBorder: null,
  },
  selected: {
    rimBorder: brand[500],
    rimBorderWidth: 3.5,
    tokenFill: brand[50],
    tokenBorder: brand[500],
    tokenSlab: brand[600],
    tokenBorderWidth: 4,
    innerRing: brand[300],
    badgeFill: brand[500],
    badgeBorder: surface[0],
  },
  correct: {
    rimBorder: semantic.success[600],
    rimBorderWidth: 4,
    tokenFill: semantic.success[100],
    tokenBorder: semantic.success[600],
    tokenSlab: semantic.success[700],
    tokenBorderWidth: 4,
    innerRing: semantic.success[300],
    badgeFill: montessori.emeraldBright,
    badgeBorder: montessori.emerald,
  },
  wrong: {
    rimBorder: retry[500],
    rimBorderWidth: 3.5,
    tokenFill: retry[100],
    tokenBorder: retry[600],
    tokenSlab: retry[700],
    tokenBorderWidth: 3.5,
    innerRing: retry[300],
    badgeFill: null,
    badgeBorder: null,
  },
  locked: {
    rimBorder: surface[400],
    rimBorderWidth: 2.5,
    tokenFill: surface[100],
    tokenBorder: surface[400],
    tokenSlab: surface[500],
    tokenBorderWidth: 2.5,
    innerRing: null,
    badgeFill: null,
    badgeBorder: null,
  },
};

export function resolveGT002PlatePalette(
  state: ItemVisualState
): GT002PlatePalette {
  return PLATE_PALETTES[state];
}

export type GT002ShapeSource = Pick<
  GT002Item,
  | "asset"
  | "plate_variant"
  | "representation"
  | "geometric_spec"
  | "secondary_asset"
>;

export function resolveGT002PlateShape(
  item: GT002ShapeSource
): GT002PlateVariant {
  if (item.plate_variant) {
    return item.plate_variant;
  }
  if (
    item.representation !== undefined ||
    item.secondary_asset !== undefined ||
    item.asset.kind === "text"
  ) {
    return "wood_tile";
  }
  if (item.geometric_spec !== undefined) {
    const { form } = item.geometric_spec;
    if (is3DGeometricForm(form) || form === "rectangle") {
      return "wood_tile";
    }
  }
  return "round_plate";
}

export function toHitShape(plateShape: GT002PlateVariant): "circle" | "square" {
  return plateShape === "wood_tile" ? "square" : "circle";
}

function splitHeaderAndGridArea(
  bounds: ZoneRect,
  itemCount: number,
  touchFloor: number
): {
  readonly headerPlacement: "top" | "side";
  readonly criterionHeaderRect: ZoneRect;
  readonly gridArea: ZoneRect;
} {
  const safeCount = Math.max(1, itemCount);
  const fitColsFull = Math.max(
    1,
    Math.floor((bounds.w + SLOT_GAP_PX) / (touchFloor + SLOT_GAP_PX))
  );
  const rowsIfTop = Math.ceil(safeCount / fitColsFull);
  const neededGridH =
    rowsIfTop * touchFloor + Math.max(0, rowsIfTop - 1) * SLOT_GAP_PX;
  const fullTopBudget = HEADER_TOP_PAD_PX + HEADER_HEIGHT_PX + HEADER_GAP_PX;

  const fitRowsFull = Math.max(
    1,
    Math.floor((bounds.h + SLOT_GAP_PX) / (touchFloor + SLOT_GAP_PX))
  );
  const colsIfSide = Math.ceil(safeCount / fitRowsFull);
  const neededSideGridW =
    colsIfSide * touchFloor + Math.max(0, colsIfSide - 1) * SLOT_GAP_PX;
  const sideTotalBudget =
    HEADER_SIDE_PAD_PX + SIDE_RAIL_WIDTH_PX + HEADER_GAP_PX;

  if (
    bounds.w > bounds.h &&
    bounds.h - fullTopBudget < neededGridH &&
    bounds.w - sideTotalBudget >= neededSideGridW
  ) {
    const criterionHeaderRect: ZoneRect = {
      x: bounds.x + HEADER_SIDE_PAD_PX,
      y: bounds.y + HEADER_TOP_PAD_PX,
      w: SIDE_RAIL_WIDTH_PX,
      h: Math.max(36, bounds.h - HEADER_TOP_PAD_PX * 2),
    };
    const gridLeft =
      criterionHeaderRect.x + criterionHeaderRect.w + HEADER_GAP_PX;
    return {
      headerPlacement: "side",
      criterionHeaderRect,
      gridArea: {
        x: gridLeft,
        y: bounds.y,
        w: Math.max(0, bounds.x + bounds.w - gridLeft),
        h: bounds.h,
      },
    };
  }

  const spareVertical =
    bounds.h - neededGridH - HEADER_TOP_PAD_PX - HEADER_GAP_PX;
  const headerH = Math.max(
    HEADER_MIN_HEIGHT_PX,
    Math.min(
      HEADER_HEIGHT_PX,
      spareVertical >= HEADER_MIN_HEIGHT_PX
        ? spareVertical
        : HEADER_MIN_HEIGHT_PX
    )
  );
  const clampedH = Math.min(headerH, Math.max(16, Math.floor(bounds.h * 0.24)));
  const criterionHeaderRect: ZoneRect = {
    x: bounds.x + HEADER_SIDE_PAD_PX,
    y: bounds.y + HEADER_TOP_PAD_PX,
    w: Math.max(32, bounds.w - HEADER_SIDE_PAD_PX * 2),
    h: clampedH,
  };
  const gridTop = criterionHeaderRect.y + criterionHeaderRect.h + HEADER_GAP_PX;
  return {
    headerPlacement: "top",
    criterionHeaderRect,
    gridArea: {
      x: bounds.x,
      y: gridTop,
      w: bounds.w,
      h: Math.max(0, bounds.y + bounds.h - gridTop),
    },
  };
}

function computeActionPinRect(bounds: ZoneRect, refRect: ZoneRect): ZoneRect {
  const rawSize = Math.round(Math.min(bounds.w, bounds.h) * 0.1);
  const size = Math.max(
    ACTION_PIN_MIN_PX,
    Math.min(ACTION_PIN_MAX_PX, rawSize)
  );
  const pinW = Math.min(size, Math.max(0, bounds.w - 4));
  const pinH = Math.min(size, Math.max(0, bounds.h - 4));
  const targetX = Math.min(
    bounds.x + bounds.w - pinW - 2,
    refRect.x + refRect.w - pinW + 2
  );
  const targetY = Math.min(
    bounds.y + bounds.h - pinH - 2,
    refRect.y + refRect.h - pinH + 2
  );
  return {
    x: Math.max(bounds.x + 2, Math.round(targetX)),
    y: Math.max(bounds.y + 2, Math.round(targetY)),
    w: pinW,
    h: pinH,
  };
}

export function computeGT002StageLayout(
  input: GT002StageLayoutInput
): GT002StageLayout {
  const bounds = input.stageRect ?? legacyStageArea(input.logicSpace);
  const touchFloor = resolveTouchFloor(input.ageBand, input.cssPerLogic);
  const { headerPlacement, criterionHeaderRect, gridArea } =
    splitHeaderAndGridArea(bounds, input.itemCount, touchFloor);

  const layoutFn = resolveLayout("flex-wrap");
  const rawSlots =
    input.itemCount > 0
      ? layoutFn({
          slotCount: input.itemCount,
          ageBand: input.ageBand,
          logic: input.logicSpace,
          stage: gridArea,
          cssPerLogic: input.cssPerLogic,
        })
      : [];
  const slots = insetDrawSize(rawSlots, input.stageRect);
  const boardRect =
    slots.length > 0 ? (dockRectAroundSlots(slots, gridArea) ?? null) : null;
  const actionPinRect = computeActionPinRect(bounds, boardRect ?? gridArea);

  return {
    bounds,
    headerPlacement,
    criterionHeaderRect,
    gridArea,
    slots,
    boardRect,
    actionPinRect,
  };
}

/**
 * Tính khung bàn ôm trọn các đĩa lựa chọn của `GT-002` (tương thích ngược).
 */
export function computeGT002BoardRect(
  slots: readonly Slot[],
  logicSpace: LogicSpace,
  stageRect?: ZoneRect
): ZoneRect | null {
  if (slots.length === 0) {
    return null;
  }
  const bounds = stageRect ?? legacyStageArea(logicSpace);
  return dockRectAroundSlots(slots, bounds) ?? null;
}

function resolveSelectedPose(
  reducedMotion: boolean,
  selectElapsedMs: number
): GT002TokenPose {
  const inPop =
    !reducedMotion &&
    selectElapsedMs >= 0 &&
    selectElapsedMs < SELECT_POP_DURATION_MS;
  const popScale = inPop
    ? 1 + 0.05 * Math.sin((selectElapsedMs / SELECT_POP_DURATION_MS) * Math.PI)
    : 1;
  return {
    dx: 0,
    dy: 0,
    scale: popScale,
    slabDepth: DEFAULT_SLAB_DEPTH_PX,
  };
}

function resolveCorrectPose(
  slotIndex: number,
  reducedMotion: boolean,
  anim: GT002TokenAnimState
): GT002TokenPose {
  if (reducedMotion) {
    return { dx: 0, dy: 0, scale: 1, slabDepth: DEFAULT_SLAB_DEPTH_PX };
  }
  if (anim.winElapsedMs < WIN_SPRING_DURATION_MS) {
    const progress = Math.max(0, anim.winElapsedMs) / WIN_SPRING_DURATION_MS;
    const bounce =
      Math.sin(progress * Math.PI * 2.5) * Math.exp(-progress * 2.4);
    return {
      dx: 0,
      dy: -Math.abs(bounce) * 3,
      scale: 1 + 0.08 * Math.max(0, bounce),
      slabDepth: DEFAULT_SLAB_DEPTH_PX,
    };
  }
  return {
    dx: 0,
    dy: Math.sin(anim.timeMs * 0.004 + slotIndex) * IDLE_BREATHE_AMPLITUDE_PX,
    scale: 1.02,
    slabDepth: DEFAULT_SLAB_DEPTH_PX,
  };
}

/**
 * Tính tư thế vật lý 3D cho từng đĩa/thẻ `GT-002`.
 * Tắt `IDLE_BREATHE` khi `anim.isHintActive` để giữ đúng 1 phần tử động (`BR-E002-08`),
 * và làm êm nhịp `wrong` thành nhịp hổ phách đồng bộ nhẹ nhàng.
 */
export function resolveGT002TokenPose(
  state: ItemVisualState,
  slotIndex: number,
  reducedMotion: boolean,
  anim: GT002TokenAnimState
): GT002TokenPose {
  if (state === "touching") {
    return {
      dx: 0,
      dy: TOUCHING_SINK_Y_PX,
      scale: reducedMotion ? 1 : TOUCHING_SCALE,
      slabDepth: TOUCHING_SLAB_DEPTH_PX,
    };
  }
  if (state === "wrong") {
    if (reducedMotion || !anim.isActiveWrong) {
      return { dx: 0, dy: 0, scale: 1, slabDepth: DEFAULT_SLAB_DEPTH_PX };
    }
    const envelope = 1 - Math.min(1, Math.max(0, anim.wrongProgress));
    const gentleSwayX =
      Math.sin(anim.wrongProgress * Math.PI * 2) * envelope * 1.6;
    const warmPulse =
      1 + 0.025 * Math.sin(anim.wrongProgress * Math.PI) * envelope;
    return {
      dx: gentleSwayX,
      dy: 0,
      scale: warmPulse,
      slabDepth: DEFAULT_SLAB_DEPTH_PX,
    };
  }
  if (state === "selected") {
    return resolveSelectedPose(reducedMotion, anim.selectElapsedMs);
  }
  if (state === "correct") {
    return resolveCorrectPose(slotIndex, reducedMotion, anim);
  }
  const breatheOffsetY =
    reducedMotion || anim.isHintActive === true
      ? 0
      : Math.sin(anim.timeMs * IDLE_BREATHE_SPEED + slotIndex * 0.85) *
        IDLE_BREATHE_AMPLITUDE_PX;
  return {
    dx: 0,
    dy: breatheOffsetY,
    scale: 1,
    slabDepth: DEFAULT_SLAB_DEPTH_PX,
  };
}

/**
 * Bước hạt ăn mừng theo `deltaMs` trong `update(deltaMs)` — giữ `render()` thuần 100% (`BR-ERC-02`).
 */
export function stepParticlesByDelta(
  particles: readonly Particle[],
  deltaMs: number
): Particle[] {
  const stepFactor = Math.max(0, deltaMs) / 16.667;
  if (stepFactor <= 0) {
    return [...particles];
  }
  const alive: Particle[] = [];
  for (const particle of particles) {
    const nextLife = particle.life - 0.025 * stepFactor;
    if (nextLife > 0) {
      alive.push({
        ...particle,
        x: particle.x + particle.vx * stepFactor,
        y: particle.y + particle.vy * stepFactor,
        vy: particle.vy + 0.25 * stepFactor,
        life: nextLife,
      });
    }
  }
  return alive;
}
