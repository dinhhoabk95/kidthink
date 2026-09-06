/**
 * Gradient & render cache for Canvas2D rendering hot path (BR-ENG-15).
 * Enforces zero allocation per frame by caching recurring CanvasGradient objects.
 * Positional scalar comparison across (ctx, generation, primitiveId, slotIndex).
 * NO string concatenation, NO content keys (item_id/symbol_id forbidden).
 */

export const PRIMITIVE_GRADIENTS = {
  BG_SKY: 1,
  BG_SPACE: 2,
  BG_SEA: 3,
  BG_DEFAULT: 4,
  BG_VIGNETTE: 5,
  PLATE_RIM: 6,
  PLATE_INNER: 7,
  PLATE_CLOCHE: 8,
  PARTY_HORN: 9,
  BG_SCHOOL: 10,
  BG_FARM: 11,
  BG_HOME: 12,
  BG_ANIMAL: 13,
  BG_NATURE: 14,
  BG_OCEAN: 15,
  BG_FOOD: 16,
  BG_VEHICLE: 17,
  BG_ART: 18,
  BG_FAMILY: 19,
  BG_BODY: 20,
  BG_WEATHER: 21,
  BG_FESTIVAL: 22,
} as const;

export type PrimitiveGradientId =
  (typeof PRIMITIVE_GRADIENTS)[keyof typeof PRIMITIVE_GRADIENTS];

interface GradientCacheEntry {
  readonly ctx: CanvasRenderingContext2D;
  generation: number;
  readonly primitiveId: number;
  readonly slotIndex: number;
  gradient: CanvasGradient;
}

const entries: GradientCacheEntry[] = [];
const contextGenerations = new WeakMap<CanvasRenderingContext2D, number>();

export function setContextGeneration(
  ctx: CanvasRenderingContext2D,
  generation: number
): void {
  contextGenerations.set(ctx, generation);
}

export function getContextGeneration(ctx: CanvasRenderingContext2D): number {
  return contextGenerations.get(ctx) ?? 0;
}

export function getCachedGradient(
  ctx: CanvasRenderingContext2D,
  generation: number,
  primitiveId: number,
  slotIndex: number
): CanvasGradient | undefined {
  for (const e of entries) {
    if (
      e.ctx === ctx &&
      e.generation === generation &&
      e.primitiveId === primitiveId &&
      e.slotIndex === slotIndex
    ) {
      return e.gradient;
    }
  }
  return undefined;
}

export function setCachedGradient(
  ctx: CanvasRenderingContext2D,
  generation: number,
  primitiveId: number,
  slotIndex: number,
  gradient: CanvasGradient
): void {
  for (const e of entries) {
    if (
      e.ctx === ctx &&
      e.primitiveId === primitiveId &&
      e.slotIndex === slotIndex
    ) {
      e.generation = generation;
      e.gradient = gradient;
      return;
    }
  }
  entries.push({
    ctx,
    generation,
    primitiveId,
    slotIndex,
    gradient,
  });
}

export function clearRenderCache(): void {
  entries.length = 0;
}
