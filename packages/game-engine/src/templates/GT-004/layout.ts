import type { GameAction } from "#src/game-session";
import { spokenKeywordForAsset } from "#src/labels/spoken-keyword.js";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import { alpha } from "#src/render/color-utils.js";
import type { SortTrayGeometry } from "#src/render/container-shapes.js";
import type { RenderItem } from "#src/render/types.js";
import { designTokens } from "#src/systems/designTokens";
import type { Particle } from "#src/systems/render-system";
import { WRONG_FLASH_MS, type WrongFlashMap } from "#src/systems/wrong-flash";
import {
  type GT003TokenPalette,
  resolveGT003SourcePalette,
} from "#src/templates/GT-003/layout";

export type GT004TokenVisualState =
  | "idle"
  | "touching"
  | "selected"
  | "wrong"
  | "locked";

export type GT004TokenPalette = GT003TokenPalette;

export interface GT004RenderItem {
  readonly id: string;
  readonly asset?: RenderItem["asset"];
  readonly label?: string;
  readonly popElapsedMs?: number | null;
}

export interface GT004GroupTheme {
  readonly index: number;
  readonly rim: string;
  readonly frontTint: string;
  readonly auraCore: string;
  readonly dotCount: number;
}

export interface GT004PlacedChip {
  readonly index: number;
  readonly cx: number;
  readonly cy: number;
  readonly r: number;
  readonly slot: Slot;
}

export interface GT004TrayOptions {
  readonly groupIndex: number;
  readonly label: string;
  readonly labelEmoji: string;
  readonly placedItems: readonly GT004RenderItem[];
  readonly isHovered: boolean;
  readonly isComplete: boolean;
  readonly isWrong: boolean;
  readonly shakeElapsedMs: number | null;
  readonly popElapsedMs: number | null;
  readonly wrongProgress: number | null;
}

export interface GT004SourceTokenOptions {
  readonly state: GT004TokenVisualState;
  readonly timeMs: number;
  readonly stagedAtMs: number | null;
  readonly wrongProgress: number | null;
}

export interface GT004TokenPose {
  readonly offsetX: number;
  readonly offsetY: number;
  readonly scale: number;
  readonly baseLift: number;
  readonly shadowBlur: number;
}

export interface GT004TokenPoseInput {
  readonly state: GT004TokenVisualState;
  readonly slotIndex: number;
  readonly timeMs: number;
  readonly stagedAtMs: number | null;
  readonly wrongProgress: number | null;
  readonly reducedMotion: boolean;
}

export const TRAY_SHAKE_DURATION_MS = 400;
export const TRAY_POP_DURATION_MS = 220;
const STAGED_POP_MS = 200;
const BASE_FRAME_MS = 16.67;
const C = designTokens.colors;

const DEFAULT_GROUP_THEME: GT004GroupTheme = {
  index: 0,
  rim: C.montessori.coral,
  frontTint: C.cta[50],
  auraCore: alpha(C.montessori.coral, 0.34),
  dotCount: 1,
};

const GROUP_THEMES: readonly GT004GroupTheme[] = [
  DEFAULT_GROUP_THEME,
  {
    index: 1,
    rim: C.brand[600],
    frontTint: C.brand[50],
    auraCore: alpha(C.brand[400], 0.34),
    dotCount: 2,
  },
  {
    index: 2,
    rim: C.montessori.indigo,
    frontTint: C.montessori.indigoLight,
    auraCore: alpha(C.montessori.indigo, 0.34),
    dotCount: 3,
  },
  {
    index: 3,
    rim: C.cta[600],
    frontTint: C.cta[100],
    auraCore: alpha(C.cta[400], 0.34),
    dotCount: 4,
  },
];

export function resolveGT004GroupTheme(groupIndex: number): GT004GroupTheme {
  return GROUP_THEMES[Math.max(0, groupIndex) % 4] ?? DEFAULT_GROUP_THEME;
}

export const resolveGT004SourcePalette: (
  state: GT004TokenVisualState
) => GT004TokenPalette = resolveGT003SourcePalette;

export function resolveGT004GroupLabel(
  label: string,
  labelEmoji: string,
  index: number
): string {
  const trimmed = label.trim();
  if (trimmed.length > 0) {
    return trimmed;
  }
  const emoji = labelEmoji.trim();
  const kw =
    emoji.length > 0
      ? spokenKeywordForAsset({ kind: "emoji", ref: emoji })
      : undefined;
  return kw && kw.trim().length > 0 ? kw.trim() : `Nhóm ${index + 1}`;
}

export function computeGT004PlacedChips(
  slot: Slot,
  geom: SortTrayGeometry,
  placedCount: number,
  shakeX = 0
): readonly GT004PlacedChip[] {
  if (placedCount <= 0) {
    return [];
  }
  const topBound = Math.max(geom.body.y + 4, geom.label.y + geom.label.h + 2);
  const bottomBound = geom.front.y - 2;
  const rawCy =
    bottomBound > topBound
      ? (topBound + bottomBound) / 2
      : geom.body.y + (geom.front.y - geom.body.y) * 0.52;
  const innerW = Math.max(24, geom.body.w - 16);
  const maxR = Math.min(
    18,
    Math.max(18, bottomBound - topBound) * 0.45,
    innerW / (placedCount * 2.15)
  );
  const r = Math.max(
    8,
    Math.min(maxR, Math.max(8, (geom.front.y - geom.body.y) * 0.42))
  );
  const cy = Math.min(
    geom.front.y - r - 1,
    Math.max(geom.body.y + r + 2, rawCy)
  );
  const spacing =
    placedCount === 1 ? 0 : Math.min(innerW / placedCount, r * 2.35);
  const startX = slot.x + shakeX - ((placedCount - 1) * spacing) / 2;
  const minX = slot.x - slot.w / 2 + r + 2;
  const maxX = slot.x + slot.w / 2 - r - 2;
  const d = r * 2;
  return Array.from({ length: placedCount }, (_, i) => {
    const cx = Math.min(maxX, Math.max(minX, startX + i * spacing));
    return {
      index: i,
      cx,
      cy,
      r,
      slot: {
        ...slot,
        index: i,
        role: "target",
        x: cx,
        y: cy,
        w: d,
        h: d,
        hitW: d,
        hitH: d,
      },
    };
  });
}

function resolveSelectedPose(input: GT004TokenPoseInput): GT004TokenPose {
  if (input.reducedMotion) {
    return { offsetX: 0, offsetY: 0, scale: 1, baseLift: 3.5, shadowBlur: 12 };
  }
  const elapsed =
    input.stagedAtMs === null ? STAGED_POP_MS : input.timeMs - input.stagedAtMs;
  const scale =
    elapsed >= 0 && elapsed < STAGED_POP_MS
      ? 1 + Math.sin((elapsed / STAGED_POP_MS) * Math.PI) * 0.06
      : 1.04;
  return { offsetX: 0, offsetY: -3, scale, baseLift: 4.5, shadowBlur: 12 };
}

export function resolveGT004SourcePose(
  input: GT004TokenPoseInput
): GT004TokenPose {
  if (input.state === "locked") {
    return { offsetX: 0, offsetY: 0, scale: 1, baseLift: 0, shadowBlur: 0 };
  }
  if (input.state === "wrong") {
    const p = input.wrongProgress ?? 0;
    const shakeX = input.reducedMotion
      ? 0
      : Math.sin(p * Math.PI * 4) * (1 - p) * 3.5;
    return {
      offsetX: shakeX,
      offsetY: 0,
      scale: 1,
      baseLift: 3,
      shadowBlur: 6,
    };
  }
  if (input.state === "touching") {
    return {
      offsetX: 0,
      offsetY: input.reducedMotion ? 0 : 1.5,
      scale: input.reducedMotion ? 1 : 0.95,
      baseLift: 1.5,
      shadowBlur: 6,
    };
  }
  if (input.state === "selected") {
    return resolveSelectedPose(input);
  }
  const breathY = input.reducedMotion
    ? 0
    : Math.sin(input.timeMs / 620 + input.slotIndex * 0.9) * 1.2;
  return {
    offsetX: 0,
    offsetY: breathY,
    scale: 1,
    baseLift: 3.5,
    shadowBlur: 8,
  };
}

export function trayShakeOffset(
  elapsedMs: number | null,
  reducedMotion: boolean
): number {
  if (
    reducedMotion ||
    elapsedMs === null ||
    elapsedMs < 0 ||
    elapsedMs >= TRAY_SHAKE_DURATION_MS
  ) {
    return 0;
  }
  const t = elapsedMs / TRAY_SHAKE_DURATION_MS;
  return Math.sin(t * Math.PI * 6) * (1 - t) * 4.5;
}

export function trayPopScale(
  elapsedMs: number | null | undefined,
  reducedMotion: boolean
): number {
  if (
    reducedMotion ||
    elapsedMs === null ||
    elapsedMs === undefined ||
    elapsedMs < 0 ||
    elapsedMs >= TRAY_POP_DURATION_MS
  ) {
    return 1;
  }
  return 1 + Math.sin((elapsedMs / TRAY_POP_DURATION_MS) * Math.PI) * 0.06;
}

export function resolveFlashProgress(
  map: WrongFlashMap,
  id: string,
  logicMs: number,
  renderMs: number
): number | null {
  if (!map.isActive(id, logicMs)) {
    return null;
  }
  const p = map.progress(id, logicMs);
  if (p !== null && p > 0) {
    return p;
  }
  return renderMs > logicMs
    ? Math.min(
        0.95,
        Math.max(0.12, ((renderMs - logicMs) % WRONG_FLASH_MS) / WRONG_FLASH_MS)
      )
    : 0.2;
}

export function extractSortItemPayload(
  data: GameAction["data"] | undefined
): { itemId: string; groupId: string } | null {
  if (!data || typeof data !== "object") {
    return null;
  }
  const itemId: string | symbol | number | boolean | object | undefined =
    Reflect.get(data, "item_id");
  const groupId: string | symbol | number | boolean | object | undefined =
    Reflect.get(data, "group_id");
  return typeof itemId === "string" &&
    itemId.length > 0 &&
    typeof groupId === "string" &&
    groupId.length > 0
    ? { itemId, groupId }
    : null;
}

export function stepParticlesWithinBounds(
  particles: readonly Particle[],
  deltaMs: number,
  bounds?: ZoneRect | null
): Particle[] {
  if (particles.length === 0 || deltaMs <= 0) {
    return [...particles];
  }
  const stepRatio = Math.min(4, Math.max(0.1, deltaMs / BASE_FRAME_MS));
  const next: Particle[] = [];
  for (const p of particles) {
    const life = p.life - (deltaMs / 1000) * 1.5;
    if (life <= 0) {
      continue;
    }
    const rawX = p.x + p.vx * stepRatio;
    const rawY = p.y + p.vy * stepRatio;
    const x = bounds
      ? Math.min(bounds.x + bounds.w - 6, Math.max(bounds.x + 6, rawX))
      : rawX;
    const y = bounds
      ? Math.min(bounds.y + bounds.h - 6, Math.max(bounds.y + 6, rawY))
      : rawY;
    next.push({ ...p, x, y, vy: p.vy + 0.3 * stepRatio, life });
  }
  return next;
}
