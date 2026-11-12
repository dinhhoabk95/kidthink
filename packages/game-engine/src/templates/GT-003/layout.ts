import type { GameAction } from "#src/game-session";
import {
  CONTENT_TOP_PX,
  type LogicSpace,
  SAFE_MARGIN_PX,
  SLOT_GAP_PX,
} from "#src/layout/constants";
import type { ZoneRect } from "#src/layout/stage-zones";
import {
  CONTAINER_HEIGHT_PER_ITEM,
  CONTAINER_MIN_H,
  CONTAINER_MIN_W,
  CONTAINER_WIDTH_PER_ITEM,
  computeStageContainerBox,
} from "#src/layout/tray-layout";
import type { Slot } from "#src/layout/types";
import { alpha } from "#src/render/color-utils.js";
import type { ContainerBox } from "#src/render/container-shapes.js";
import type { RenderItem } from "#src/render/types.js";
import { designTokens } from "#src/systems/designTokens";
import type { Particle } from "#src/systems/render-system";

export type GT003TokenVisualState =
  | "idle"
  | "touching"
  | "selected"
  | "wrong"
  | "locked";

export interface GT003RenderItem {
  readonly id: string;
  readonly asset?: RenderItem["asset"];
  readonly label?: string;
  readonly text?: string;
  readonly quantity?: number;
}

export interface GT003BasketOptions {
  readonly label: string;
  readonly placedItems: readonly GT003RenderItem[];
  readonly targetCount: number;
  readonly isHovered: boolean;
  readonly isWon: boolean;
  readonly shakeElapsedMs: number | null;
}

export interface GT003SourceTokenOptions {
  readonly state: GT003TokenVisualState;
  readonly timeMs: number;
  readonly stagedAtMs: number | null;
  readonly wrongProgress: number | null;
}

export interface GT003SocketWell {
  readonly index: number;
  readonly cx: number;
  readonly cy: number;
  readonly r: number;
  readonly slot: Slot;
}

export interface GT003TokenPalette {
  readonly fill: string;
  readonly rim: string;
  readonly base: string;
  readonly innerRing: string | null;
  readonly lineWidth: number;
}

export interface GT003TokenPose {
  readonly offsetX: number;
  readonly offsetY: number;
  readonly scale: number;
  readonly baseLift: number;
  readonly shadowBlur: number;
}

export interface GT003TokenPoseInput {
  readonly state: GT003TokenVisualState;
  readonly slotIndex: number;
  readonly timeMs: number;
  readonly stagedAtMs: number | null;
  readonly wrongProgress: number | null;
  readonly reducedMotion: boolean;
}

const STAGED_POP_MS = 200;
const BASE_FRAME_MS = 16.67;

const TOKEN_PALETTES: Readonly<
  Record<GT003TokenVisualState, GT003TokenPalette>
> = {
  idle: {
    fill: designTokens.colors.surface[0],
    rim: designTokens.colors.cta[200],
    base: designTokens.colors.montessori.woodBorder,
    innerRing: null,
    lineWidth: 2.5,
  },
  touching: {
    fill: designTokens.colors.brand[50],
    rim: designTokens.colors.brand[400],
    base: designTokens.colors.brand[600],
    innerRing: designTokens.colors.brand[300],
    lineWidth: 3.5,
  },
  selected: {
    fill: designTokens.colors.brand[50],
    rim: designTokens.colors.brand[500],
    base: designTokens.colors.brand[700],
    innerRing: designTokens.colors.brand[300],
    lineWidth: 4,
  },
  wrong: {
    fill: designTokens.colors.retry[100],
    rim: designTokens.colors.retry[600],
    base: designTokens.colors.retry[700],
    innerRing: designTokens.colors.retry[300],
    lineWidth: 3.5,
  },
  locked: {
    fill: alpha(designTokens.colors.surface[200], 0.55),
    rim: alpha(designTokens.colors.montessori.woodBorder, 0.28),
    base: alpha(designTokens.colors.montessori.woodBorder, 0.18),
    innerRing: null,
    lineWidth: 2,
  },
};

/**
 * Tính toạ độ hàng ổ đếm trực quan (`targetCount` ô 1..4) trong lòng rổ đích.
 * Trẻ 3–4 tuổi nhìn số ổ trống biết ngay cần bỏ thêm mấy món mà không cần đọc chữ.
 */
export function computeGT003SocketWells(
  box: ContainerBox,
  targetCount: number
): readonly GT003SocketWell[] {
  const count = Math.max(1, Math.min(4, targetCount));
  const innerW = box.w * 0.78;
  const maxR = Math.min(24, box.h * 0.22, innerW / (count * 2.25));
  const r = Math.max(12, Math.round(maxR));
  const spacing = count === 1 ? 0 : Math.min(innerW / count, r * 2.55);
  const startX = box.x - ((count - 1) * spacing) / 2;
  const cy = Math.round(box.y - box.h * 0.08);
  const wells: GT003SocketWell[] = [];

  for (let i = 0; i < count; i++) {
    const cx = Math.round(startX + i * spacing);
    const d = r * 2;
    wells.push({
      index: i,
      cx,
      cy,
      r,
      slot: {
        index: i,
        x: cx,
        y: cy,
        w: d,
        h: d,
        hitW: d,
        hitH: d,
        page: 0,
        role: "target",
      },
    });
  }
  return wells;
}

/** Bảng màu của token nguồn theo 5 trạng thái thị giác. */
export function resolveGT003SourcePalette(
  state: GT003TokenVisualState
): GT003TokenPalette {
  return TOKEN_PALETTES[state];
}

/** Bảng màu và khoá cache của rổ đích theo trạng thái `idle | hovered | won`. */
export function resolveGT003BasketTheme(
  box: ContainerBox,
  isHovered: boolean,
  isWon: boolean
): {
  readonly cacheKey: number;
  readonly auraCore: string;
  readonly trayFill: string;
  readonly trayRim: string;
} {
  const baseKey = Math.round(box.x) * 100_000 + Math.round(box.y) * 100;
  const trayFill = isHovered
    ? designTokens.colors.montessori.woodTrayHigh
    : designTokens.colors.montessori.woodTray;
  if (isWon) {
    return {
      cacheKey: baseKey + 2,
      auraCore: alpha(designTokens.colors.semantic.success[300], 0.42),
      trayFill,
      trayRim: designTokens.colors.semantic.success[500],
    };
  }
  if (isHovered) {
    return {
      cacheKey: baseKey + 1,
      auraCore: alpha(designTokens.colors.montessori.amber, 0.38),
      trayFill,
      trayRim: designTokens.colors.montessori.amber,
    };
  }
  return {
    cacheKey: baseKey,
    auraCore: alpha(designTokens.colors.montessori.amberLight, 0.22),
    trayFill,
    trayRim: designTokens.colors.montessori.woodBorder,
  };
}

function resolveStagedPose(
  timeMs: number,
  stagedAtMs: number | null,
  reducedMotion: boolean
): GT003TokenPose {
  if (reducedMotion) {
    return { offsetX: 0, offsetY: 0, scale: 1, baseLift: 3.5, shadowBlur: 12 };
  }
  let scale = 1.04;
  if (stagedAtMs !== null) {
    const elapsed = Math.max(0, timeMs - stagedAtMs);
    if (elapsed < STAGED_POP_MS) {
      const t = elapsed / STAGED_POP_MS;
      scale = 1 + Math.sin(t * Math.PI) * 0.05;
    }
  }
  return { offsetX: 0, offsetY: -2, scale, baseLift: 4.5, shadowBlur: 12 };
}

/** Tư thế động học (offset, scale, độ nổi, bóng đổ) của token nguồn theo trạng thái. */
export function resolveGT003SourcePose(
  input: GT003TokenPoseInput
): GT003TokenPose {
  if (input.state === "locked") {
    return { offsetX: 0, offsetY: 0, scale: 1, baseLift: 0, shadowBlur: 0 };
  }
  if (input.state === "wrong") {
    const progress = input.wrongProgress ?? 0;
    const shakeX = input.reducedMotion
      ? 0
      : Math.sin(progress * Math.PI * 4) * (1 - progress) * 3.5;
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
      offsetY: input.reducedMotion ? 0 : -2,
      scale: input.reducedMotion ? 1 : 1.05,
      baseLift: 4.5,
      shadowBlur: 14,
    };
  }
  if (input.state === "selected") {
    return resolveStagedPose(
      input.timeMs,
      input.stagedAtMs,
      input.reducedMotion
    );
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

/** Cập nhật vật lý hạt theo `deltaMs` (chỉ gọi trong `update(deltaMs)`, `BR-ERC-02`). */
export function stepParticlesByDelta(
  particles: readonly Particle[],
  deltaMs: number
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
    next.push({
      ...p,
      x: p.x + p.vx * stepRatio,
      y: p.y + p.vy * stepRatio,
      vy: p.vy + 0.3 * stepRatio,
      life,
    });
  }
  return next;
}

/** Tính hộp vẽ & chạm của rổ đích, tự nở tới vùng an toàn mà không lấn vùng nguồn. */
export function computeGT003ContainerBox(
  slot: Slot | undefined,
  sources: readonly Slot[],
  logicSpace: LogicSpace,
  stageRect?: ZoneRect,
  trayRect?: ZoneRect
): ContainerBox | null {
  if (!slot) {
    return null;
  }
  if (stageRect && trayRect) {
    return computeStageContainerBox(slot, stageRect);
  }
  const itemW = Math.max(slot.w, ...sources.map((s) => s.w));
  const itemH = Math.max(slot.h, ...sources.map((s) => s.h));
  const srcBottom = sources.length
    ? Math.max(...sources.map((s) => s.y + s.h / 2))
    : CONTENT_TOP_PX;
  const srcRight = sources.length
    ? Math.max(...sources.map((s) => s.x + s.w / 2))
    : SAFE_MARGIN_PX;

  const topLimit =
    slot.y > srcBottom ? srcBottom + SLOT_GAP_PX : CONTENT_TOP_PX;
  const leftLimit = slot.x > srcRight ? srcRight + SLOT_GAP_PX : SAFE_MARGIN_PX;

  const maxW =
    2 * Math.min(slot.x - leftLimit, logicSpace.w - SAFE_MARGIN_PX - slot.x);
  const maxH =
    2 * Math.min(slot.y - topLimit, logicSpace.h - SAFE_MARGIN_PX - slot.y);

  const w = Math.max(
    slot.hitW,
    Math.min(Math.max(CONTAINER_MIN_W, itemW * CONTAINER_WIDTH_PER_ITEM), maxW)
  );
  const h = Math.max(
    slot.hitH,
    Math.min(Math.max(CONTAINER_MIN_H, itemH * CONTAINER_HEIGHT_PER_ITEM), maxH)
  );
  return { x: slot.x, y: slot.y, w, h };
}

/** Trích xuất payload `{ itemId, containerId }` thuần, không dùng ép kiểu `as`. */
export function extractGT003DropPayload(
  data: GameAction["data"] | undefined
): { itemId: string; containerId: string } | null {
  if (!data || typeof data !== "object") {
    return null;
  }
  const itemId: string | symbol | number | boolean | object | undefined =
    Reflect.get(data, "item_id");
  const containerId: string | symbol | number | boolean | object | undefined =
    Reflect.get(data, "container_id");
  if (
    typeof itemId === "string" &&
    itemId.length > 0 &&
    typeof containerId === "string" &&
    containerId.length > 0
  ) {
    return { itemId, containerId };
  }
  return null;
}
