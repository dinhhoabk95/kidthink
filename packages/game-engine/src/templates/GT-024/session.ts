import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "#src/game-session";
import { resolveLayout } from "#src/layout/registry";
import type { Slot } from "#src/layout/types";
import { OrderingMechanic } from "#src/mechanics/ordering-mechanic";
import type { DegradationState } from "#src/systems/degradation";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import {
  type TracePathResult,
  type TracePoint,
  TraceSystem,
} from "#src/systems/trace-system";
import {
  drawPromptText,
  drawSceneBackground,
  drawSubPromptText,
  type ItemVisualState,
  updateParticles,
} from "../shared-render.js";
import { drawWaypointPath } from "../shared-render-shapes.js";
import type { GT024Content, GT024Difficulty } from "./template.js";

export class GT024Session extends TemplateGameSession<
  GT024Content,
  GT024Difficulty
> {
  slots: readonly Slot[] = [];
  degradation: DegradationState | null = null;
  private renderParticles: Particle[] = [];
  private readonly renderItemStates: Map<string, ItemVisualState> = new Map();

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

  resolveSlots(ageBand: "3-4" | "4-5" | "5-6"): void {
    const layoutFn = resolveLayout("grid");
    this.slots = layoutFn({
      slotCount: this.content.waypoints.length,
      ageBand,
    });
  }

  setRenderItemState(itemId: string, state: ItemVisualState): void {
    this.renderItemStates.set(itemId, state);
  }

  getRenderItemState(itemId: string): ItemVisualState {
    return this.renderItemStates.get(itemId) ?? "idle";
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    _timeMs: number
  ): void {
    drawSceneBackground(ctx, rs);
    drawPromptText(ctx, rs, this.content.prompt);
    drawSubPromptText(ctx, rs, this.content.shape_name);
    drawWaypointPath(
      ctx,
      this.content.waypoints,
      this.traceSystem.getCurrentOrderIndex()
    );
    this.drawRenderFeedback(rs, ctx);
  }

  private drawRenderFeedback(
    rs: RenderSystem,
    ctx: CanvasRenderingContext2D
  ): void {
    if (this.degradation?.particles_enabled === false) {
      return;
    }
    this.renderParticles = updateParticles(this.renderParticles);
    rs.drawParticles(ctx, this.renderParticles);
  }
}

export default GT024Session;
