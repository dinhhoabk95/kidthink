/**
 * Đồng hồ hiệu ứng thuần render (WeakMap) và dựng EngineView cho GT-036.
 * Strict TypeScript: CẤM any, CẤM unknown, CẤM as T (ngoài as const).
 */

import type { EngineView, ViewEntity } from "#src/interaction";
import {
  resolveAssetLabels,
  resolveAssetSpeech,
} from "#src/labels/spoken-keyword";
import type { Slot } from "#src/layout/types";
import type { GT036BeadParams } from "#src/render/gt-036-shapes";
import type { RuleDetectionResult } from "#src/systems/rule-detection-system";
import type {
  GT036Content,
  GT036PaletteItem,
} from "#src/templates/GT-036/template";

export const GT036_CLEAR_ID = "clear-track";
export const GT036_CLEAR_ASSET = { kind: "emoji", ref: "🧹" } as const;
export const GT036_CLEAR_SPOKEN_LABEL = "Xoá hết dải";
export const GT036_LIGHT_STEP_MS = 350;
export const GT036_BEAD_POP_MS = 220;

export interface GT036VisualClock {
  simMs: number;
  hoveredSlotIndex: number | null;
  activeHintLevel: 0 | 1 | 2 | 3;
  lastPlacedSlotIndex: number | null;
  lastPlacedAtMs: number;
}

const clockStore = new WeakMap<object, GT036VisualClock>();

export function getGT036Clock(host: object): GT036VisualClock {
  const existing = clockStore.get(host);
  if (existing) {
    return existing;
  }
  const fresh: GT036VisualClock = {
    simMs: 0,
    hoveredSlotIndex: null,
    activeHintLevel: 0,
    lastPlacedSlotIndex: null,
    lastPlacedAtMs: -10_000,
  };
  clockStore.set(host, fresh);
  return fresh;
}

export function peekGT036Clock(host: object): GT036VisualClock | undefined {
  return clockStore.get(host);
}

export function deleteGT036Clock(host: object): void {
  clockStore.delete(host);
}

export function resolvePaletteColorIndex(
  elementId: string,
  palette: readonly GT036PaletteItem[]
): number {
  const idx = palette.findIndex((p) => p.id === elementId);
  if (idx >= 0) {
    return idx;
  }
  let hash = 0;
  for (let i = 0; i < elementId.length; i++) {
    hash = (hash * 31 + elementId.charCodeAt(i)) % 1_000_000_007;
  }
  return hash % 6;
}

export function computeBeadPopProgress(
  clock: GT036VisualClock | undefined,
  slotIndex: number,
  reducedMotion: boolean
): number {
  if (reducedMotion || !clock || clock.lastPlacedSlotIndex !== slotIndex) {
    return 1;
  }
  const elapsed = Math.max(0, clock.simMs - clock.lastPlacedAtMs);
  return Math.min(1, elapsed / GT036_BEAD_POP_MS);
}

export function computeLitOrder(
  placedItems: readonly (string | null)[],
  detectedRule: RuleDetectionResult | null
): number[] {
  const limit = detectedRule?.detected
    ? detectedRule.motif.length
    : placedItems.length;
  const order: number[] = [];
  for (let i = 0; i < limit; i++) {
    if (placedItems[i]) {
      order.push(i);
    }
  }
  return order;
}

export function isTrackCellLit(params: {
  readonly placedItems: readonly (string | null)[];
  readonly submitted: boolean;
  readonly detectedRule: RuleDetectionResult | null;
  readonly litElapsedMs: number;
  readonly index: number;
  readonly instant?: boolean;
}): boolean {
  if (!(params.submitted && params.placedItems[params.index])) {
    return false;
  }
  if (
    params.detectedRule?.detected &&
    params.index >= params.detectedRule.motif.length
  ) {
    return false;
  }
  if (params.instant) {
    return true;
  }
  const order = computeLitOrder(params.placedItems, params.detectedRule);
  const litCount = Math.floor(params.litElapsedMs / GT036_LIGHT_STEP_MS) + 1;
  return order.indexOf(params.index) < litCount;
}

function buildTrackEntity(params: {
  readonly index: number;
  readonly slot: Slot;
  readonly placedId: string | null | undefined;
  readonly paletteMap: ReadonlyMap<string, GT036PaletteItem>;
  readonly lit: boolean;
}): ViewEntity {
  const palItem = params.placedId
    ? params.paletteMap.get(params.placedId)
    : undefined;
  const assetLabels = palItem ? resolveAssetLabels(palItem.asset) : undefined;
  const itemSpoken = assetLabels?.spokenLabel ?? assetLabels?.label;
  let state: ViewEntity["state"] = "idle";
  if (params.lit) {
    state = "active";
  } else if (params.placedId) {
    state = "selected";
  }
  return {
    id: `track_${params.index}`,
    slotIndex: params.index,
    role: "target",
    state,
    x: params.slot.x,
    y: params.slot.y,
    w: params.slot.w,
    h: params.slot.h,
    hitW: params.slot.hitW,
    hitH: params.slot.hitH,
    hitShape: "circle",
    glyph: assetLabels?.glyph,
    label: assetLabels ? undefined : `${params.index + 1}`,
    spokenLabel: itemSpoken
      ? `Ô số ${params.index + 1}: ${itemSpoken}`
      : `Ô số ${params.index + 1} đang trống`,
    spokenAudioPath: assetLabels?.spokenAudioPath,
  };
}

function buildPaletteEntity(params: {
  readonly slotIndex: number;
  readonly slot: Slot;
  readonly pal: GT036PaletteItem;
  readonly isSelected: boolean;
}): ViewEntity {
  const { glyph, spokenLabel, spokenAudioPath } = resolveAssetSpeech(
    params.pal.asset
  );
  return {
    id: `palette_${params.pal.id}`,
    slotIndex: params.slotIndex,
    role: "source",
    state: params.isSelected ? "selected" : "idle",
    x: params.slot.x,
    y: params.slot.y,
    w: params.slot.w,
    h: params.slot.h,
    hitW: params.slot.hitW,
    hitH: params.slot.hitH,
    hitShape: "circle",
    glyph,
    spokenLabel: spokenLabel ?? params.pal.id,
    spokenAudioPath,
  };
}

export function buildGT036View(params: {
  readonly content: GT036Content;
  readonly paletteMap: ReadonlyMap<string, GT036PaletteItem>;
  readonly slots: readonly Slot[];
  readonly placedItems: readonly (string | null)[];
  readonly selectedPaletteId: string | null;
  readonly submitted: boolean;
  readonly detectedRule: RuleDetectionResult | null;
  readonly litElapsedMs: number;
  readonly clearSlotIndex: number;
  readonly isClearVisible: boolean;
  readonly focusIndex: number | undefined;
}): EngineView {
  const entities: ViewEntity[] = [];
  const count = params.content.track_length;

  for (let i = 0; i < count; i++) {
    const slot = params.slots[i];
    if (!slot) {
      continue;
    }
    const lit = isTrackCellLit({
      placedItems: params.placedItems,
      submitted: params.submitted,
      detectedRule: params.detectedRule,
      litElapsedMs: params.litElapsedMs,
      index: i,
    });
    entities.push(
      buildTrackEntity({
        index: i,
        slot,
        placedId: params.placedItems[i],
        paletteMap: params.paletteMap,
        lit,
      })
    );
  }

  for (let p = 0; p < params.content.palette.length; p++) {
    const slotIndex = count + p;
    const slot = params.slots[slotIndex];
    const pal = params.content.palette[p];
    if (slot && pal) {
      entities.push(
        buildPaletteEntity({
          slotIndex,
          slot,
          pal,
          isSelected: params.selectedPaletteId === pal.id,
        })
      );
    }
  }

  const clearSlot = params.slots[params.clearSlotIndex];
  if (clearSlot && params.isClearVisible) {
    entities.push({
      id: GT036_CLEAR_ID,
      slotIndex: params.clearSlotIndex,
      role: "neutral",
      state: "idle",
      x: clearSlot.x,
      y: clearSlot.y,
      w: clearSlot.w,
      h: clearSlot.h,
      hitW: clearSlot.hitW,
      hitH: clearSlot.hitH,
      hitShape: "circle",
      glyph: resolveAssetLabels(GT036_CLEAR_ASSET).glyph,
      spokenLabel: GT036_CLEAR_SPOKEN_LABEL,
    });
  }

  return {
    activePrompt: params.content.prompt,
    entities,
    focusIndex: params.focusIndex,
  };
}

export function buildTrackBeadRenderParams(params: {
  readonly slot: Slot;
  readonly index: number;
  readonly elementId: string | null | undefined;
  readonly palette: readonly GT036PaletteItem[];
  readonly paletteMap: ReadonlyMap<string, GT036PaletteItem>;
  readonly lit: boolean;
  readonly isHovered: boolean;
  readonly isHintL1: boolean;
  readonly popProgress: number;
  readonly reducedMotion: boolean;
  readonly softShadowsEnabled: boolean;
}): GT036BeadParams {
  const palItem = params.elementId
    ? params.paletteMap.get(params.elementId)
    : undefined;
  let ringTone: GT036BeadParams["ringTone"];
  if (params.lit) {
    ringTone = "lit";
  } else if (params.isHintL1) {
    ringTone = "hint";
  } else if (params.isHovered) {
    ringTone = "hover";
  }
  const bounce =
    !params.reducedMotion && params.popProgress < 1
      ? 1 + 0.14 * Math.sin(params.popProgress * Math.PI)
      : 1;
  const scaleBoost = bounce * (!params.reducedMotion && params.lit ? 1.05 : 1);
  const fallbackAsset = params.elementId
    ? ({ kind: "image", path: "" } as const)
    : null;
  return {
    slot: params.slot,
    asset: palItem ? palItem.asset : fallbackAsset,
    emptyLabel: `${params.index + 1}`,
    paletteIndex: params.elementId
      ? resolvePaletteColorIndex(params.elementId, params.palette)
      : 0,
    scaleBoost,
    ringTone,
    isHintDashed: !(params.elementId || params.isHintL1),
    softShadowsEnabled: params.softShadowsEnabled,
  };
}

export function buildPaletteBeadRenderParams(params: {
  readonly slot: Slot;
  readonly item: GT036PaletteItem;
  readonly paletteIndex: number;
  readonly isSelected: boolean;
  readonly isHovered: boolean;
  readonly isHintL2: boolean;
  readonly reducedMotion: boolean;
  readonly softShadowsEnabled: boolean;
  readonly animMs: number;
}): GT036BeadParams {
  let ringTone: GT036BeadParams["ringTone"];
  if (params.isSelected) {
    ringTone = "selected";
  } else if (params.isHintL2) {
    ringTone = "hint";
  } else if (params.isHovered) {
    ringTone = "hover";
  }
  const cyOffset =
    (params.isSelected ? -3 : 0) +
    (!params.reducedMotion && params.isHintL2
      ? Math.sin(params.animMs * 0.008) * 3
      : 0);
  return {
    slot: params.slot,
    asset: params.item.asset,
    paletteIndex: params.paletteIndex,
    cyOffset,
    ringTone,
    softShadowsEnabled: params.softShadowsEnabled,
  };
}
