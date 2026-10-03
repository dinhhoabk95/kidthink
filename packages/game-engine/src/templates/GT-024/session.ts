import type { AgeBand } from "#src/contracts/types";
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
import { resolveTouchFloor } from "#src/layout/constants";
import { resolveLayout } from "#src/layout/registry";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import { OrderingMechanic } from "#src/mechanics/ordering-mechanic";
import {
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
  type TraceWaypoint,
} from "#src/systems/trace-system";
import {
  applyStageFit,
  fitContentToStage,
  isPointInStage,
} from "./stage-fit.js";
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
  override readonly usesPromptZone = true;
  degradation: DegradationState | null = null;
  private renderParticles: Particle[] = [];
  private readonly renderItemStates: Map<string, ItemVisualState> = new Map();

  readonly traceSystem = new TraceSystem();
  /** Waypoint ở toạ độ logic của khung nhìn (đã co vào `zones.stage` nếu có). */
  private screenWaypoints: readonly TraceWaypoint[] = [];
  /** Dung sai chạm ở toạ độ logic; không nhỏ hơn nửa sàn chạm (`BR-PSZ-04`). */
  private tolerancePx = 0;
  /** Chỉ số slot chạm của từng waypoint; mặc định mỗi waypoint một slot. */
  private slotOfWaypoint: readonly number[] = [];
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
    this.screenWaypoints = waypoints;
    this.slotOfWaypoint = waypoints.map((_, i) => i);
    this.tolerancePx = this.difficulty.tolerance_px;
    this.traceSystem.init(waypoints, this.tolerancePx);

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
      return dist <= this.tolerancePx ? ACTION_CORRECT : ACTION_RETRY;
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
    const tolerance = this.tolerancePx;

    if (gesture.type === "stroke") {
      // Nét phải bắt đầu và đi trong stage — không vẽ từ vùng hành động hay HUD.
      const first = gesture.points[0];
      if (!(first && isPointInStage(first.x, first.y, this.stageRect))) {
        return null;
      }
      const inStage = gesture.points.filter((pt) =>
        isPointInStage(pt.x, pt.y, this.stageRect)
      );
      const hitPt = findHitStrokePoint(inStage, target, tolerance);
      if (hitPt) {
        return {
          type: "trace_point",
          data: { x: hitPt.x, y: hitPt.y },
        };
      }
    } else if (
      gesture.type === "tap" &&
      isPointInStage(gesture.x, gesture.y, this.stageRect) &&
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
    const entities: ViewEntity[] = this.screenWaypoints.map((w, idx) => {
      let state: EntityVisual = "idle";
      if (w.order < currentOrder) {
        state = "correct";
      } else if (w.order === currentOrder) {
        state = "active";
      }
      return {
        id: w.id,
        slotIndex: this.slotOfWaypoint[idx] ?? idx,
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

  override getHintTargetIndex(): number | null {
    if (this.isWon) {
      return null;
    }
    const currentTarget = this.traceSystem.getCurrentTargetWaypoint();
    if (!currentTarget) {
      return null;
    }
    const idx = this.screenWaypoints.findIndex(
      (w) => w.id === currentTarget.id
    );
    return idx >= 0 ? (this.slotOfWaypoint[idx] ?? idx) : null;
  }

  protected computeSlots(ageBand: AgeBand): readonly Slot[] {
    if (this.stageRect) {
      return this.fitWaypointsToStage(this.stageRect, ageBand);
    }
    const layoutFn = resolveLayout("grid");
    return layoutFn({
      slotCount: this.content.waypoints.length,
      ageBand,
      logic: this.logicSpace,
    });
  }

  /**
   * Co waypoint vào stage và dựng slot chạm đúng tại từng waypoint, nên gợi ý
   * và vòng nhấn theo `getHintTargetIndex` rơi đúng điểm cần nối.
   */
  private fitWaypointsToStage(
    stage: ZoneRect,
    ageBand: AgeBand
  ): readonly Slot[] {
    const floor = resolveTouchFloor(ageBand, this.cssPerLogic);
    const fit = fitContentToStage(stage, floor / 2, this.content.waypoints);
    this.screenWaypoints = this.content.waypoints.map((w) =>
      applyStageFit(w, fit)
    );
    this.tolerancePx = Math.max(
      this.difficulty.tolerance_px * fit.scale,
      floor / 2
    );
    this.traceSystem.rescale(this.screenWaypoints, this.tolerancePx);
    const hit = Math.round(floor);
    // Waypoint trùng toạ độ (nét đóng hình) dùng chung một slot chạm.
    const slots: Slot[] = [];
    this.slotOfWaypoint = this.screenWaypoints.map((w) => {
      const same = slots.find((slot) => slot.x === w.x && slot.y === w.y);
      if (same) {
        return same.index;
      }
      slots.push({
        index: slots.length,
        x: w.x,
        y: w.y,
        w: hit,
        h: hit,
        hitW: hit,
        hitH: hit,
        page: 0,
        role: "target",
      });
      return slots.length - 1;
    });
    return slots;
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
    drawSceneBackground(ctx, rs, this.themeId);
    if (!this.stageRect) {
      drawSubPromptText(ctx, rs, this.content.shape_name);
    }
    drawWaypointPath(
      ctx,
      this.screenWaypoints,
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
