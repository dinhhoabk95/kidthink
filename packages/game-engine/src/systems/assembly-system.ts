/**
 * assemblySystem — Quản lý lắp ráp bộ phận vào điểm neo/khung ghép cho construct (GT-023).
 * Độc lập hoàn toàn với template (BR-LVB-12, BR-MTB-15).
 */

export interface AssemblyAnchor {
  readonly anchorId: string;
  readonly x: number;
  readonly y: number;
  readonly acceptedPartId: string;
  readonly label?: string;
}

export interface AssemblyPart {
  readonly partId: string;
  readonly targetAnchorId: string;
  readonly name?: string;
}

export interface AssemblyPlacementResult {
  readonly valid: boolean;
  readonly isAnchorMatch: boolean;
  readonly isComplete: boolean;
  readonly snappedAnchorId?: string;
}

export class AssemblySystem {
  private readonly anchors: Map<string, AssemblyAnchor> = new Map();
  private readonly parts: Map<string, AssemblyPart> = new Map();
  private readonly placements: Map<string, string> = new Map(); // anchorId -> partId

  init(
    anchors: readonly AssemblyAnchor[],
    parts: readonly AssemblyPart[]
  ): void {
    this.anchors.clear();
    this.parts.clear();
    this.placements.clear();

    for (const a of anchors) {
      this.anchors.set(a.anchorId, a);
    }
    for (const p of parts) {
      this.parts.set(p.partId, p);
    }
  }

  getAnchor(anchorId: string): AssemblyAnchor | undefined {
    return this.anchors.get(anchorId);
  }

  getPart(partId: string): AssemblyPart | undefined {
    return this.parts.get(partId);
  }

  getPlacements(): ReadonlyMap<string, string> {
    return this.placements;
  }

  findNearestAnchor(
    x: number,
    y: number,
    snapRadiusPx = 60
  ): AssemblyAnchor | null {
    let nearest: AssemblyAnchor | null = null;
    let minDist = snapRadiusPx;

    for (const anchor of this.anchors.values()) {
      const dist = Math.hypot(anchor.x - x, anchor.y - y);
      if (dist <= minDist) {
        minDist = dist;
        nearest = anchor;
      }
    }
    return nearest;
  }

  assemblePart(partId: string, anchorId: string): AssemblyPlacementResult {
    const anchor = this.anchors.get(anchorId);
    const part = this.parts.get(partId);

    if (!(anchor && part)) {
      return { valid: false, isAnchorMatch: false, isComplete: false };
    }

    const isMatch =
      anchor.acceptedPartId === partId && part.targetAnchorId === anchorId;
    if (isMatch) {
      this.placements.set(anchorId, partId);
    }

    const isComplete = this.isAllAssembled();
    return {
      valid: true,
      isAnchorMatch: isMatch,
      isComplete,
      snappedAnchorId: anchorId,
    };
  }

  removePart(anchorId: string): void {
    this.placements.delete(anchorId);
  }

  isAllAssembled(): boolean {
    if (this.anchors.size === 0 || this.placements.size < this.anchors.size) {
      return false;
    }
    for (const [anchorId, anchor] of this.anchors.entries()) {
      const placedPartId = this.placements.get(anchorId);
      if (placedPartId !== anchor.acceptedPartId) {
        return false;
      }
    }
    return true;
  }
}
