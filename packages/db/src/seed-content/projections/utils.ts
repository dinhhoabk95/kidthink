import { createRng as createEngineRng } from "@mindkid/game-engine";
import type { DatasetAsset, DatasetItem } from "@mindkid/shared";

export function createRng(seed: number): ReturnType<typeof createEngineRng> {
  return createEngineRng(seed);
}

/**
 * Deterministic Fisher-Yates shuffle using an Rng instance.
 */
export function shuffleDeterministic<T>(
  items: readonly T[],
  rng: ReturnType<typeof createRng>
): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = rng.nextInt(i + 1);
    const temp = result[i];
    const target = result[j];
    if (temp !== undefined && target !== undefined) {
      result[i] = target;
      result[j] = temp;
    }
  }
  return result;
}

export function safeGetItem<T>(arr: readonly T[], idx: number): T {
  const item = arr[idx];
  if (item === undefined) {
    throw new Error(`[BR-SDS-05] Không tìm thấy phần tử tại index ${idx}`);
  }
  return item;
}

/**
 * Resolves a DatasetItem into an Asset, prioritizing glyph (text) if preferGlyph is true,
 * otherwise image/emoji, fallback to label text.
 */
export function resolveItemAsset(
  item: DatasetItem,
  preferGlyph = true
): DatasetAsset {
  if (preferGlyph && item.glyph) {
    return { kind: "text", text: item.glyph };
  }
  if (item.image) {
    return item.image;
  }
  if (item.glyph) {
    return { kind: "text", text: item.glyph };
  }
  return { kind: "text", text: item.label };
}
