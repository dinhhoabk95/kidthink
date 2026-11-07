/**
 * GT-022 cảnh có lớp che thật (`BR-E022-08`): một vật nấp một phần sau vật khác
 * (bụi, đá…). Vật che vẽ đè lên vật nấp, nên phần nhìn thấy của vật nấp là một
 * dải ngoài mép vật che. Hàm ở đây thuần: nhận vùng cảnh và các "đơn vị" (vật
 * đơn hoặc cặp che–nấp), trả hộp vẽ và hộp chạm của từng vật.
 *
 * Hình học một cặp, cạnh đơn vị `u` (≥ sàn chạm), vật che bên phải của vật nấp
 * hoặc ngược lại (`side`):
 * - vật che vẽ `2u × 2u`;
 * - vật nấp vẽ `1,7u`, phần bị che `0,7u`, phần nhìn thấy `u` — đúng bằng vùng
 *   chạm của nó, nên vùng chạm vật nấp là dải nhìn thấy;
 * - vùng chạm vật che là phần thân không đè vùng chạm vật nấp, cách `gap`.
 */

import type { ZoneRect } from "#src/layout/stage-zones";

/** Cạnh vật che so với đơn vị `u`. */
const OCCLUDER_SCALE = 2;
/** Cạnh vẽ vật nấp so với `u`: phần bị che là `0,7u`. */
const HIDDEN_SCALE = 1.7;
/** Tâm vật nấp lệch khỏi mép vật che về phía ngoài, so với `u`. */
const HIDDEN_CENTER_PAST_EDGE = 0.15;

export type OcclusionSide = "left" | "right";

export interface LayerUnit {
  /** Vật đơn: chỉ số trong `scene_objects`. Cặp: chỉ số vật che và vật nấp. */
  readonly index: number;
  readonly hiddenIndex?: number;
  readonly side?: OcclusionSide;
}

export interface PlacedBox {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

export interface PlacedLayer {
  readonly index: number;
  /** Hộp chạm (tâm và kích thước). */
  readonly hit: PlacedBox;
  /** Hộp vẽ vuông (tâm và cạnh). */
  readonly draw: {
    readonly x: number;
    readonly y: number;
    readonly size: number;
  };
  /** 0 vẽ trước (vật nấp), 1 vẽ sau (vật che và vật đơn). */
  readonly layer: 0 | 1;
}

interface UnitSize {
  readonly w: number;
  readonly h: number;
}

function unitSize(unit: LayerUnit, u: number): UnitSize {
  if (unit.hiddenIndex === undefined) {
    return { w: u, h: u };
  }
  return {
    w: Math.round(OCCLUDER_SCALE * u + u),
    h: Math.round(OCCLUDER_SCALE * u),
  };
}

function placeSingle(
  unit: LayerUnit,
  cx: number,
  cy: number,
  u: number
): PlacedLayer[] {
  return [
    {
      index: unit.index,
      hit: { x: cx, y: cy, w: u, h: u },
      draw: { x: cx, y: cy, size: u },
      layer: 1,
    },
  ];
}

function placePair(
  unit: LayerUnit,
  cx: number,
  cy: number,
  u: number,
  gap: number
): PlacedLayer[] {
  const hiddenIndex = unit.hiddenIndex;
  if (hiddenIndex === undefined) {
    return [];
  }
  const occ = Math.round(OCCLUDER_SCALE * u);
  const sign = unit.side === "left" ? -1 : 1;
  const half = (occ + u) / 2;
  // Tâm vật che nằm lệch về phía đối diện với vật nấp để cả cặp cân quanh (cx, cy).
  const occX = Math.round(cx - sign * (half - occ / 2));
  const edge = occX + (sign * occ) / 2;
  const hiddenDrawSize = Math.round(HIDDEN_SCALE * u);
  const hiddenDrawX = Math.round(edge + sign * HIDDEN_CENTER_PAST_EDGE * u);
  const hiddenHitX = Math.round(edge + (sign * u) / 2);
  const occHitW = occ - gap;
  return [
    {
      index: hiddenIndex,
      hit: { x: hiddenHitX, y: cy, w: u, h: u },
      draw: { x: hiddenDrawX, y: cy, size: hiddenDrawSize },
      layer: 0,
    },
    {
      index: unit.index,
      hit: {
        x: Math.round(occX - (sign * gap) / 2),
        y: cy,
        w: occHitW,
        h: occ,
      },
      draw: { x: occX, y: cy, size: occ },
      layer: 1,
    },
  ];
}

interface Row {
  readonly units: LayerUnit[];
  width: number;
  height: number;
}

function packRows(
  units: readonly LayerUnit[],
  u: number,
  gap: number,
  maxWidth: number
): Row[] | null {
  const rows: Row[] = [];
  for (const unit of units) {
    const size = unitSize(unit, u);
    if (size.w > maxWidth) {
      return null;
    }
    const row = rows.at(-1);
    if (row && row.width + gap + size.w <= maxWidth) {
      row.units.push(unit);
      row.width += gap + size.w;
      row.height = Math.max(row.height, size.h);
    } else {
      rows.push({ units: [unit], width: size.w, height: size.h });
    }
  }
  return rows;
}

/**
 * Xếp các đơn vị thành hàng trong `area`, hàng căn giữa, hàng giãn đều theo
 * chiều dọc. `null` khi không vừa — người gọi thử cỡ nhỏ hơn hoặc xếp phẳng.
 */
export function layoutLayeredScene(
  area: ZoneRect,
  units: readonly LayerUnit[],
  u: number,
  gap: number
): PlacedLayer[] | null {
  const rows = packRows(units, u, gap, area.w);
  if (!rows) {
    return null;
  }
  const rowsH = rows.reduce((sum, row) => sum + row.height, 0);
  if (rowsH + (rows.length - 1) * gap > area.h) {
    return null;
  }
  // Chừa thừa chia đều cho lề trên, lề dưới và khe giữa các hàng (khe ≥ `gap`).
  const extra = Math.floor(
    (area.h - rowsH - (rows.length - 1) * gap) / (rows.length + 1)
  );
  const placed: PlacedLayer[] = [];
  let top = Math.round(area.y) + extra;
  for (const row of rows) {
    let left = area.x + (area.w - row.width) / 2;
    const cy = Math.round(top + row.height / 2);
    for (const unit of row.units) {
      const size = unitSize(unit, u);
      const cx = Math.round(left + size.w / 2);
      placed.push(
        ...(unit.hiddenIndex === undefined
          ? placeSingle(unit, cx, cy, u)
          : placePair(unit, cx, cy, u, gap))
      );
      left += size.w + gap;
    }
    top += row.height + gap + extra;
  }
  return placed.sort((a, b) => a.index - b.index);
}
