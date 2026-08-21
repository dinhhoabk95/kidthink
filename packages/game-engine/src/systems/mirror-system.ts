/**
 * mirrorSystem — Tính toán toạ độ và kiểm tra đối xứng cho mirror-complete (GT-021).
 * Độc lập hoàn toàn với template (BR-LVB-12, BR-MTB-15).
 */

export type MirrorAxis = "vertical" | "horizontal";

export interface MirrorPoint {
  readonly x: number;
  readonly y: number;
}

export interface GridCoord {
  readonly col: number;
  readonly row: number;
}

export interface SymmetricSlotPair {
  readonly referenceSlotId: string;
  readonly targetSlotId: string;
  readonly expectedAssetRef: string;
}

/**
 * Tính điểm đối xứng qua trục (vertical: x = axisCoord, horizontal: y = axisCoord).
 */
export function computeMirroredPoint(
  point: MirrorPoint,
  axis: MirrorAxis,
  axisCoord: number
): MirrorPoint {
  if (axis === "vertical") {
    return {
      x: 2 * axisCoord - point.x,
      y: point.y,
    };
  }
  return {
    x: point.x,
    y: 2 * axisCoord - point.y,
  };
}

/**
 * Kiểm tra 2 điểm có đối xứng nhau qua trục không (trong phạm vi dung sai pixel).
 */
export function isMirroredPointMatch(
  pt1: MirrorPoint,
  pt2: MirrorPoint,
  axis: MirrorAxis,
  axisCoord: number,
  tolerancePx = 20
): boolean {
  const expected = computeMirroredPoint(pt1, axis, axisCoord);
  const dx = Math.abs(expected.x - pt2.x);
  const dy = Math.abs(expected.y - pt2.y);
  return dx <= tolerancePx && dy <= tolerancePx;
}

/**
 * Tính toạ độ ô đối xứng trong lưới ma trận.
 */
export function getSymmetricGridPosition(
  coord: GridCoord,
  totalCols: number,
  totalRows: number,
  axis: MirrorAxis = "vertical"
): GridCoord {
  if (axis === "vertical") {
    return {
      col: totalCols - 1 - coord.col,
      row: coord.row,
    };
  }
  return {
    col: coord.col,
    row: totalRows - 1 - coord.row,
  };
}

/**
 * Quản lý trạng thái ghép đối xứng cho session mirror-complete.
 */
export class MirrorSystem {
  private requiredPairs: SymmetricSlotPair[] = [];
  private readonly placements: Map<string, string> = new Map(); // targetSlotId -> placedAssetRef

  init(pairs: readonly SymmetricSlotPair[]): void {
    this.requiredPairs = [...pairs];
    this.placements.clear();
  }

  place(targetSlotId: string, assetRef: string): boolean {
    const pair = this.requiredPairs.find(
      (p) => p.targetSlotId === targetSlotId
    );
    if (!pair) {
      return false;
    }
    this.placements.set(targetSlotId, assetRef);
    return pair.expectedAssetRef === assetRef;
  }

  remove(targetSlotId: string): void {
    this.placements.delete(targetSlotId);
  }

  getPlacement(targetSlotId: string): string | undefined {
    return this.placements.get(targetSlotId);
  }

  countPlaced(): number {
    return this.placements.size;
  }

  isComplete(): boolean {
    if (
      this.requiredPairs.length === 0 ||
      this.placements.size < this.requiredPairs.length
    ) {
      return false;
    }
    return this.requiredPairs.every((pair) => {
      const placed = this.placements.get(pair.targetSlotId);
      return placed === pair.expectedAssetRef;
    });
  }
}
