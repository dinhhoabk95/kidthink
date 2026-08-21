/**
 * sceneSystem — Quản lý vật thể, trạng thái ẩn/hiện, phát hiện mục tiêu trong cảnh (GT-022).
 * Độc lập hoàn toàn với template (BR-LVB-12, BR-MTB-15).
 */

export interface SceneObject {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly isTarget: boolean;
  readonly isHidden?: boolean; // ẩn sau lớp phủ
  readonly layer?: number; // z-index
}

export interface SceneObjectState {
  readonly id: string;
  readonly isTarget: boolean;
  isFound: boolean;
  isRevealed: boolean;
}

export interface FindResult {
  readonly valid: boolean;
  readonly isTarget: boolean;
  readonly isNewFind: boolean;
}

export class SceneSystem {
  private readonly objects: Map<string, SceneObjectState> = new Map();
  private readonly targetIds: Set<string> = new Set();
  private foundCount = 0;

  init(objects: readonly SceneObject[]): void {
    this.objects.clear();
    this.targetIds.clear();
    this.foundCount = 0;

    for (const obj of objects) {
      this.objects.set(obj.id, {
        id: obj.id,
        isTarget: obj.isTarget,
        isFound: false,
        isRevealed: !obj.isHidden,
      });
      if (obj.isTarget) {
        this.targetIds.add(obj.id);
      }
    }
  }

  revealObject(id: string): boolean {
    const obj = this.objects.get(id);
    if (!obj || obj.isRevealed) {
      return false;
    }
    obj.isRevealed = true;
    return true;
  }

  findTarget(id: string): FindResult {
    const obj = this.objects.get(id);
    if (!obj) {
      return { valid: false, isTarget: false, isNewFind: false };
    }
    if (!obj.isTarget) {
      return { valid: false, isTarget: false, isNewFind: false };
    }
    if (obj.isFound) {
      return { valid: true, isTarget: true, isNewFind: false };
    }
    obj.isFound = true;
    this.foundCount++;
    return { valid: true, isTarget: true, isNewFind: true };
  }

  getFoundCount(): number {
    return this.foundCount;
  }

  getTotalTargets(): number {
    return this.targetIds.size;
  }

  isAllFound(): boolean {
    return this.targetIds.size > 0 && this.foundCount === this.targetIds.size;
  }

  getObjectState(id: string): SceneObjectState | undefined {
    return this.objects.get(id);
  }
}
