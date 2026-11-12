import type { LogicSpace } from "#src/layout/constants";
import { dockRectAroundSlots, legacyStageArea } from "#src/layout/slot-fit.js";
import type { ZoneRect } from "#src/layout/stage-zones.js";
import type { Slot } from "#src/layout/types";
import type { ItemVisualState } from "#src/render/types.js";
import { designTokens } from "#src/systems/designTokens";
import type { Particle } from "#src/systems/render-system";

const IDLE_BREATHE_SPEED = 0.0024;
const IDLE_BREATHE_AMPLITUDE_PX = 1.2;
const SELECT_POP_DURATION_MS = 220;
const WIN_SPRING_DURATION_MS = 450;
const DEFAULT_SLAB_DEPTH_PX = 3.5;
const TOUCHING_SLAB_DEPTH_PX = 1.5;
const TOUCHING_SINK_Y_PX = 1.5;
const TOUCHING_SCALE = 0.95;

export interface GT002TokenAnimState {
  readonly timeMs: number;
  readonly selectElapsedMs: number;
  readonly winElapsedMs: number;
  readonly wrongProgress: number;
  readonly isActiveWrong: boolean;
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
    rimBorder: retry[600],
    rimBorderWidth: 3.5,
    tokenFill: retry[100],
    tokenBorder: retry[600],
    tokenSlab: retry[700],
    tokenBorderWidth: 3.5,
    innerRing: null,
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

/**
 * Tính khung bàn gỗ Montessori ôm trọn các đĩa lựa chọn của `GT-002`,
 * luôn kẹp gọn trong `stageRect` (hoặc `legacyStageArea(logicSpace)` khi chạy ngoài shell).
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
 * Tính tư thế vật lý 3D (độ lún, độ nảy, lắc ngang, độ dày đế gỗ) cho từng đĩa `GT-002`.
 * Tôn trọng tuyệt đối `reducedMotion`.
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
    const shakeX =
      reducedMotion || !anim.isActiveWrong
        ? 0
        : Math.sin(anim.wrongProgress * Math.PI * 4) *
          (1 - anim.wrongProgress) *
          3.5;
    return { dx: shakeX, dy: 0, scale: 1, slabDepth: DEFAULT_SLAB_DEPTH_PX };
  }
  if (state === "selected") {
    return resolveSelectedPose(reducedMotion, anim.selectElapsedMs);
  }
  if (state === "correct") {
    return resolveCorrectPose(slotIndex, reducedMotion, anim);
  }
  const breatheOffsetY = reducedMotion
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
