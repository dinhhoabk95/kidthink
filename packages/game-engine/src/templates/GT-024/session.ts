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
import { resolveAssetLabels } from "#src/labels/spoken-keyword.js";
import { resolveTouchFloor } from "#src/layout/constants";
import { TAP_TOLERANCE_PX } from "#src/layout/hit-test.js";
import { resolveLayout } from "#src/layout/registry";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import { OrderingMechanic } from "#src/mechanics/ordering-mechanic";
import {
  drawSceneBackground,
  drawSubPromptText,
  drawWaypointPath,
} from "#src/render/index.js";
import type { DegradationState } from "#src/systems/degradation";
import type { RenderSystem } from "#src/systems/render-system";
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

const WAYPOINT_VIEW_RADIUS_PX = 24;
const DROP_INTERPOLATION_STEPS = 16;

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

function interpolateSegment(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number
): { readonly x: number; readonly y: number }[] {
  const points: { readonly x: number; readonly y: number }[] = [];
  for (let i = 0; i <= DROP_INTERPOLATION_STEPS; i++) {
    const t = i / DROP_INTERPOLATION_STEPS;
    points.push({
      x: fromX + (toX - fromX) * t,
      y: fromY + (toY - fromY) * t,
    });
  }
  return points;
}

export class GT024Session extends TemplateGameSession<
  GT024Content,
  GT024Difficulty
> {
  override readonly usesPromptZone = true;
  degradation: DegradationState | null = null;

  readonly traceSystem = new TraceSystem();
  /** Waypoint ở toạ độ logic của khung nhìn (đã co vào `zones.stage` nếu có). */
  private screenWaypoints: readonly TraceWaypoint[] = [];
  /** Dung sai chạm ở toạ độ logic; không nhỏ hơn nửa sàn chạm (`BR-PSZ-04`). */
  private tolerancePx = 0;
  /** Chỉ số slot chạm của từng waypoint; mặc định mỗi waypoint một slot. */
  private slotOfWaypoint: readonly number[] = [];
  private readonly orderingMechanic = new OrderingMechanic();
  private lastFrameMs = 0;
  private wrongWaypointTimestamp = 0;

  update(deltaMs: number): void {
    this.lastFrameMs += deltaMs;
  }

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

  private validateTapWaypoint(
    data: { index?: number } | undefined
  ): ActionResult {
    const hitIdx = data?.index;
    const target = this.traceSystem.getCurrentTargetWaypoint();
    const expectedIdx = target
      ? this.screenWaypoints.findIndex((w) => w.id === target.id)
      : -1;
    if (typeof hitIdx === "number" && hitIdx >= 0 && hitIdx !== expectedIdx) {
      return ACTION_RETRY;
    }
    return ACTION_IGNORED;
  }

  private validateTracePoint(data: object | null | undefined): ActionResult {
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

  validateAction(action: GameAction): ActionResult {
    if (action.type === "tap_waypoint") {
      return this.validateTapWaypoint(
        action.data as { index?: number } | undefined
      );
    }
    if (action.type === "trace_point" || action.type === "point_touched") {
      return this.validateTracePoint(action.data as object | null | undefined);
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

  private toTargetTraceAction(
    pt: { readonly x: number; readonly y: number },
    target: TraceWaypoint
  ): GameAction {
    const dist = Math.hypot(target.x - pt.x, target.y - pt.y);
    return {
      type: "trace_point",
      data:
        dist <= this.tolerancePx
          ? { x: pt.x, y: pt.y }
          : { x: target.x, y: target.y },
    };
  }

  private toStrokeAction(
    gesture: Extract<Gesture, { type: "stroke" }>,
    target: TraceWaypoint,
    hitTolerance: number
  ): GameAction | null {
    const first = gesture.points[0];
    if (!(first && isPointInStage(first.x, first.y, this.stageRect))) {
      return null;
    }
    const inStage = gesture.points.filter((pt) =>
      isPointInStage(pt.x, pt.y, this.stageRect)
    );
    const hitPt = findHitStrokePoint(inStage, target, hitTolerance);
    return hitPt ? this.toTargetTraceAction(hitPt, target) : null;
  }

  private toDropAction(
    gesture: Extract<Gesture, { type: "drop" }>,
    target: TraceWaypoint,
    hitTolerance: number
  ): GameAction | null {
    if (
      !(
        isPointInStage(gesture.fromX, gesture.fromY, this.stageRect) &&
        isPointInStage(gesture.toX, gesture.toY, this.stageRect)
      )
    ) {
      return null;
    }
    const pts = interpolateSegment(
      gesture.fromX,
      gesture.fromY,
      gesture.toX,
      gesture.toY
    );
    const hitPt = findHitStrokePoint(pts, target, hitTolerance);
    return hitPt ? this.toTargetTraceAction(hitPt, target) : null;
  }

  private toTapAction(
    gesture: Extract<Gesture, { type: "tap" }>,
    target: TraceWaypoint,
    hitTolerance: number
  ): GameAction | null {
    if (!isPointInStage(gesture.x, gesture.y, this.stageRect)) {
      return null;
    }
    if (
      Math.hypot(target.x - gesture.x, target.y - gesture.y) <= hitTolerance
    ) {
      return this.toTargetTraceAction(gesture, target);
    }
    const hitIdx = this.screenWaypoints.findIndex(
      (w) => Math.hypot(w.x - gesture.x, w.y - gesture.y) <= hitTolerance
    );
    if (hitIdx >= 0) {
      return {
        type: "tap_waypoint",
        data: { index: hitIdx },
      };
    }
    return null;
  }

  override toAction(gesture: Gesture): GameAction | null {
    const target = this.traceSystem.getCurrentTargetWaypoint();
    if (!target) {
      return null;
    }
    const hitTolerance = Math.max(
      this.tolerancePx,
      WAYPOINT_VIEW_RADIUS_PX + TAP_TOLERANCE_PX
    );

    if (gesture.type === "stroke") {
      return this.toStrokeAction(gesture, target, hitTolerance);
    }
    if (gesture.type === "drop") {
      return this.toDropAction(gesture, target, hitTolerance);
    }
    if (gesture.type === "tap") {
      return this.toTapAction(gesture, target, hitTolerance);
    }
    return null;
  }

  override commit(action: GameAction): void {
    if (action.type === "tap_waypoint") {
      this.wrongWaypointTimestamp = this.lastFrameMs;
      return;
    }
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
    const usedIds = new Set<string>();
    const entities: ViewEntity[] = this.screenWaypoints.map((w, idx) => {
      let state: EntityVisual = "idle";
      if (w.order < currentOrder) {
        state = "correct";
      } else if (w.order === currentOrder) {
        state = "active";
      }
      const id = usedIds.has(w.id) ? `${w.id}:${idx}` : w.id;
      usedIds.add(id);
      return {
        id,
        slotIndex: this.slotOfWaypoint[idx] ?? idx,
        role: "target",
        state,
        x: w.x,
        y: w.y,
        w: 48,
        h: 48,
        ...(w.label ? resolveAssetLabels({ kind: "text", text: w.label }) : {}),
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

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    this.lastFrameMs = timeMs;
    drawSceneBackground(ctx, rs, this.themeId);
    if (!this.stageRect) {
      drawSubPromptText(ctx, rs, this.content.shape_name);
    }
    drawWaypointPath(
      ctx,
      this.screenWaypoints,
      this.traceSystem.getCurrentOrderIndex()
    );

    if (this.wrongWaypointTimestamp > 0) {
      const elapsed = timeMs - this.wrongWaypointTimestamp;
      if (elapsed < 400) {
        const target = this.traceSystem.getCurrentTargetWaypoint();
        if (target) {
          rs.drawRetryRing(
            ctx,
            target.x,
            target.y,
            WAYPOINT_VIEW_RADIUS_PX + 8,
            elapsed / 400
          );
        }
      } else {
        this.wrongWaypointTimestamp = 0;
      }
    }
  }
}
