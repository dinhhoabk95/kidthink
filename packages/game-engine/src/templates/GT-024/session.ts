import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "#src/game-session";
import { OrderingMechanic } from "#src/mechanics/ordering-mechanic";
import {
  type TracePathResult,
  type TracePoint,
  TraceSystem,
} from "#src/systems/trace-system";
import type { GT024Content, GT024Difficulty } from "./template.js";

export class GT024Session extends TemplateGameSession<
  GT024Content,
  GT024Difficulty
> {
  readonly traceSystem = new TraceSystem();
  private readonly orderingMechanic = new OrderingMechanic();

  setupEntities(): void {
    this.isWon = false;

    const waypoints = this.content.waypoints.map((w) => ({
      id: w.id,
      x: w.x,
      y: w.y,
      order: w.order,
      label: w.label,
    }));

    this.orderingMechanic.setInitialSequence(waypoints.map((w) => w.id));
    this.traceSystem.init(waypoints, this.difficulty.tolerance_px);

    this.recordEvent("round_started", {
      round_index: 0,
      shape_name: this.content.shape_name,
      waypoint_count: waypoints.length,
    });
  }

  validateAction(action: GameAction): ActionResult {
    if (action.type === "trace_point" || action.type === "point_touched") {
      const data = action.data;
      const x =
        typeof data === "object" && data !== null
          ? Reflect.get(data, "x")
          : undefined;
      const y =
        typeof data === "object" && data !== null
          ? Reflect.get(data, "y")
          : undefined;
      if (typeof x !== "number" || typeof y !== "number") {
        return ACTION_IGNORED;
      }
      const target = this.traceSystem.getCurrentTargetWaypoint();
      if (!target) {
        return ACTION_IGNORED;
      }
      const dist = Math.hypot(target.x - x, target.y - y);
      return dist <= this.difficulty.tolerance_px
        ? ACTION_CORRECT
        : ACTION_RETRY;
    }

    return ACTION_IGNORED;
  }

  onTracePoint(point: TracePoint): TracePathResult {
    const result = this.traceSystem.checkPoint(point);

    if (result.valid && result.reachedWaypointId) {
      this.recordEvent("checkpoint_reached", {
        waypoint_id: result.reachedWaypointId,
        checkpoint_index: result.currentCheckpointIndex,
        total_waypoints: this.traceSystem.getTotalWaypoints(),
      });

      if (result.isComplete) {
        this.recordEvent("trace_completed", {
          shape_name: this.content.shape_name,
        });
        this.recordEvent("round_completed", { round_index: 0 });
        this.winSession();
      }
    }

    return result;
  }

  override checkWinCondition(): boolean {
    return this.traceSystem.isComplete();
  }
}

export default GT024Session;
