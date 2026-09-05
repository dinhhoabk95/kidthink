import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "#src/game-session";
import type {
  EngineView,
  EntityVisual,
  Gesture,
  ViewEntity,
} from "#src/interaction";
import { resolveLayout } from "#src/layout/registry";
import type { Slot } from "#src/layout/types";
import { OrderingMechanic } from "#src/mechanics/ordering-mechanic";
import {
  drawPromptText,
  drawSceneBackground,
  drawSubPromptText,
  drawWaypointPath,
  type ItemVisualState,
  updateParticles,
} from "#src/render/index.js";
import type { DegradationState } from "#src/systems/degradation";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import {
  type TracePathResult,
  type TracePoint,
  TraceSystem,
} from "#src/systems/trace-system";
import type { GT024Content, GT024Difficulty } from "./template.js";

function findHitStrokePoint(
  points: readonly { readonly x: number; readonly y: number }[],
  target: { readonly x: number; readonly y: number },
  tolerance: number
): { readonly x: number; readonly y: number } | null {
  for (const pt of points) {
    if (Math.hypot(target.x - pt.x, target.y - pt.y) <= tolerance) {
      return pt;
    }
  }
  return null;
}

export class GT024Session extends TemplateGameSession<
  GT024Content,
  GT024Difficulty
> {
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

  override toAction(gesture: Gesture): GameAction | null {
    const target = this.traceSystem.getCurrentTargetWaypoint();
    if (!target) {
      return null;
    }
    const tolerance = this.difficulty.tolerance_px;

    if (gesture.type === "stroke") {
      const hitPt = findHitStrokePoint(gesture.points, target, tolerance);
      if (hitPt) {
        return {
          type: "trace_point",
          data: { x: hitPt.x, y: hitPt.y },
        };
      }
    } else if (
      gesture.type === "tap" &&
      Math.hypot(target.x - gesture.x, target.y - gesture.y) <= tolerance
    ) {
      return {
        type: "trace_point",
        data: { x: gesture.x, y: gesture.y },
      };
    }

    return null;
  }

  override commit(action: GameAction): void {
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
      if (typeof x === "number" && typeof y === "number") {
        this.onTracePoint({ x, y });
      }
    }
  }

  override getView(): EngineView {
    const currentOrder = this.traceSystem.getCurrentOrderIndex();
    const entities: ViewEntity[] = this.content.waypoints.map((w, idx) => {
      let state: EntityVisual = "idle";
      if (w.order < currentOrder) {
        state = "correct";
      } else if (w.order === currentOrder) {
        state = "active";
      }
      return {
        id: w.id,
        slotIndex: idx,
        role: "target",
        state,
        x: w.x,
        y: w.y,
        w: 48,
        h: 48,
      };
    });
    return {
      activePrompt: this.content.prompt,
      entities,
    };
  }

  protected computeSlots(ageBand: "3-4" | "4-5" | "5-6"): readonly Slot[] {
    const layoutFn = resolveLayout("grid");
    return layoutFn({
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
