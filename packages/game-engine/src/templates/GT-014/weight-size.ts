/**
 * GT-014: cỡ vật theo khối lượng (`BR-E014-03`) thay cho số in trên vật
 * (`BR-E014-06`). Diện tích vật tỉ lệ thuận khối lượng, nên cạnh vật tỉ lệ
 * căn bậc hai của khối lượng; cùng khối lượng thì cùng cỡ ở khay, đĩa và cân
 * tham chiếu. Hàm tính là thuần — chỉ `drawWeightedPanItems` chạm canvas.
 */

import {
  drawSlotItem,
  type RenderAsset,
  type SceneBox,
  slotAtPoint,
} from "#src/render/index.js";
import type { RenderSystem } from "#src/systems/render-system";

/** Cạnh vật nhẹ nhất không nhỏ hơn từng này phần cạnh vật nặng nhất — vẫn nhìn ra hình. */
const MIN_SIZE_FRACTION = 0.4;
/** Số vật nặng nhất xếp vừa một hàng trên đĩa. */
const HEAVIEST_PER_PAN_ROW = 3;
/** Đĩa chiếm tối đa từng này phần bề ngang cho một hàng vật. */
const ROW_FILL_RATIO = 0.94;
/** Khe dọc giữa hai hàng vật xếp chồng trên đĩa. */
const ROW_GAP_PX = 2;
/** Vật trên đĩa không nhỏ hơn cạnh này (px logic) dù đĩa chật. */
const MIN_PAN_ITEM_PX = 14;

export interface WeightedAssetItem {
  readonly item_id: string;
  readonly weight: number;
  readonly asset?: RenderAsset;
}

/** Tỉ lệ cạnh vật so với vật nặng nhất của bài, trong `[MIN_SIZE_FRACTION, 1]`. */
export function weightSizeFraction(weight: number, maxWeight: number): number {
  if (maxWeight <= 0) {
    return 1;
  }
  const ratio = Math.sqrt(Math.max(0, weight) / maxWeight);
  return Math.min(1, Math.max(MIN_SIZE_FRACTION, ratio));
}

/** Khối lượng lớn nhất trong mọi vật của bài (khay, hai đĩa, cân tham chiếu). */
export function maxItemWeight(
  groups: readonly (readonly { readonly weight: number }[])[]
): number {
  return groups.reduce(
    (max, group) =>
      group.reduce((inner, item) => Math.max(inner, item.weight), max),
    0
  );
}

interface PlacedPanItem {
  readonly item: WeightedAssetItem;
  readonly x: number;
  readonly y: number;
  readonly size: number;
}

/** Cạnh vật nặng nhất trên đĩa: vừa `HEAVIEST_PER_PAN_ROW` vật một hàng, không cao hơn đĩa. */
export function panUnitSize(pan: SceneBox): number {
  return Math.max(
    MIN_PAN_ITEM_PX,
    Math.min(pan.w / HEAVIEST_PER_PAN_ROW, pan.h * 2.5)
  );
}

/**
 * Xếp vật trên đĩa thành các hàng chồng lên, mỗi hàng căn giữa; vật đặt trên
 * mặt đĩa (`pan.y`). Cỡ vật chỉ theo khối lượng, không theo số vật trên đĩa.
 */
export function layoutPanItems(
  pan: SceneBox,
  items: readonly WeightedAssetItem[],
  maxWeight: number,
  unit: number = panUnitSize(pan)
): PlacedPanItem[] {
  const sizes = items.map((item) =>
    Math.max(
      MIN_PAN_ITEM_PX,
      Math.round(unit * weightSizeFraction(item.weight, maxWeight))
    )
  );
  const capacity = pan.w * ROW_FILL_RATIO;
  const rows: { indices: number[]; width: number; height: number }[] = [];
  sizes.forEach((size, i) => {
    const row = rows.at(-1);
    if (row && row.width + size <= capacity) {
      row.indices.push(i);
      row.width += size;
      row.height = Math.max(row.height, size);
      return;
    }
    rows.push({ indices: [i], width: size, height: size });
  });
  const placed: PlacedPanItem[] = [];
  let bottom = pan.y;
  for (const row of rows) {
    let left = pan.x + (pan.w - row.width) / 2;
    for (const i of row.indices) {
      const item = items[i];
      const size = sizes[i];
      if (!item || size === undefined) {
        continue;
      }
      placed.push({
        item,
        x: left + size / 2,
        y: bottom - size / 2,
        size,
      });
      left += size;
    }
    bottom -= row.height + ROW_GAP_PX;
  }
  return placed;
}

/** Vẽ vật trên đĩa với cỡ theo khối lượng. */
export function drawWeightedPanItems(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  pan: SceneBox,
  items: readonly WeightedAssetItem[],
  maxWeight: number,
  unit?: number
): void {
  for (const placed of layoutPanItems(pan, items, maxWeight, unit)) {
    drawSlotItem(ctx, rs, slotAtPoint(placed.x, placed.y, placed.size), {
      id: placed.item.item_id,
      asset: placed.item.asset,
    });
  }
}
