/**
 * traceSystem — Quản lý đường vẽ, chuỗi điểm neo checkpoint cho trace-path (GT-024).
 * Độc lập hoàn toàn với template (BR-LVB-12, BR-MTB-15).
 */

export interface TracePoint {
  readonly x: number;
  readonly y: number;
}

export interface TraceWaypoint {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly order: number;
  readonly label?: string;
}

export interface TracePathResult {
  readonly valid: boolean;
  readonly currentCheckpointIndex: number;
  readonly isComplete: boolean;
  readonly reachedWaypointId?: string;
}

export class TraceSystem {
  private waypoints: TraceWaypoint[] = [];
  private currentOrderIndex = 0;
  private tolerancePx = 40;

  init(waypoints: readonly TraceWaypoint[], tolerancePx = 40): void {
    this.waypoints = [...waypoints].sort((a, b) => a.order - b.order);
    this.currentOrderIndex = 0;
    this.tolerancePx = tolerancePx;
  }

  getWaypoints(): readonly TraceWaypoint[] {
    return this.waypoints;
  }

  getCurrentTargetWaypoint(): TraceWaypoint | undefined {
    return this.waypoints[this.currentOrderIndex];
  }

  getCurrentOrderIndex(): number {
    return this.currentOrderIndex;
  }

  getTotalWaypoints(): number {
    return this.waypoints.length;
  }

  isComplete(): boolean {
    return (
      this.waypoints.length > 0 &&
      this.currentOrderIndex >= this.waypoints.length
    );
  }

  checkPoint(point: TracePoint): TracePathResult {
    if (this.isComplete()) {
      return {
        valid: true,
        currentCheckpointIndex: this.currentOrderIndex,
        isComplete: true,
      };
    }

    const target = this.waypoints[this.currentOrderIndex];
    if (!target) {
      return {
        valid: false,
        currentCheckpointIndex: this.currentOrderIndex,
        isComplete: false,
      };
    }

    const dist = Math.hypot(target.x - point.x, target.y - point.y);
    if (dist <= this.tolerancePx) {
      const reachedId = target.id;
      this.currentOrderIndex++;
      const isComplete = this.currentOrderIndex >= this.waypoints.length;
      return {
        valid: true,
        currentCheckpointIndex: this.currentOrderIndex,
        isComplete,
        reachedWaypointId: reachedId,
      };
    }

    return {
      valid: false,
      currentCheckpointIndex: this.currentOrderIndex,
      isComplete: false,
    };
  }
}
