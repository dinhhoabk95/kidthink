import type { AgeBand } from "#src/contracts/types";
import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  type HintDemoStep,
  type HintTarget,
  TemplateGameSession,
} from "#src/game-session";
import type { EngineView, Gesture } from "#src/interaction";
import { resolveTouchFloor } from "#src/layout/constants";
import { TAP_TOLERANCE_PX } from "#src/layout/hit-test.js";
import { resolveLayout } from "#src/layout/registry";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import { OrderingMechanic } from "#src/mechanics/ordering-mechanic";
import type { CrawlPoint } from "#src/render/index.js";
import type { MascotPose } from "#src/render/mascot";
import type { DegradationState } from "#src/systems/degradation";
import { MoodPulse } from "#src/systems/mood-pulse";
import type { RenderSystem } from "#src/systems/render-system";
import {
  type TracePathResult,
  type TracePoint,
  TraceSystem,
  type TraceWaypoint,
} from "#src/systems/trace-system";
import {
  buildGT024ViewEntities,
  type GT024RenderHost,
  getGT024Clock,
  gt024FitMargin,
  markGT024Reached,
  renderGT024,
  resetGT024Clock,
  tickGT024Clock,
  triggerGT024Wrong,
} from "./layout.js";
import {
  applyStageFit,
  buildDeduplicatedSlots,
  computeAntPlacement,
  fitContentToStage,
  isPointInStage,
  readNum,
  readPointArray,
  resolveGT024GestureAction,
  resolveGT024HintDemoSequence,
  resolveGT024HintDestinationIndex,
  resolveGT024HintTargetForLevel,
  resolveGT024HintTargetIndex,
} from "./stage-fit.js";
import type { GT024Content, GT024Difficulty } from "./template.js";

const WAYPOINT_VIEW_RADIUS_PX = 24;

export const GT024_STORY_LINE =
  "Kiến Nhỏ bị lạc, chưa tìm thấy đường về tổ. Bé nối các điểm theo thứ tự để dẫn Kiến Nhỏ về tổ nhé!";

export const GT024_HAPPY_MS = 700;
export const GT024_WONDER_MS = 1200;

export class GT024Session
  extends TemplateGameSession<GT024Content, GT024Difficulty>
  implements GT024RenderHost
{
  override readonly usesPromptZone = true;
  degradation: DegradationState | null = null;

  readonly traceSystem = new TraceSystem();
  private screenWaypoints: readonly TraceWaypoint[] = [];
  private tolerancePx = 0;
  private hitHalf = WAYPOINT_VIEW_RADIUS_PX;
  private placement: {
    nest: CrawlPoint | null;
    perch: CrawlPoint | null;
  } = { nest: null, perch: null };
  private slotOfWaypoint: readonly number[] = [];
  private readonly orderingMechanic = new OrderingMechanic();
  private readonly mood = new MoodPulse();
  private roundClosedOnWrong = false;

  get hitHalfPx(): number {
    return this.hitHalf;
  }

  getScreenWaypoints(): readonly TraceWaypoint[] {
    return this.screenWaypoints;
  }

  getSlotOfWaypoint(): readonly number[] {
    return this.slotOfWaypoint;
  }

  getStageBounds(): ZoneRect | undefined {
    return this.stageRect;
  }

  getCurrentOrderIndex(): number {
    return this.traceSystem.getCurrentOrderIndex();
  }

  getPlacement(): { nest: CrawlPoint | null; perch: CrawlPoint | null } {
    return this.placement;
  }

  isRoundClosedOnWrong(): boolean {
    return this.roundClosedOnWrong;
  }

  override isAcceptingInput(): boolean {
    return !(this.isWon || this.roundClosedOnWrong);
  }

  override storyLine(): string {
    return GT024_STORY_LINE;
  }

  override mascotMood(): MascotPose | null {
    return this.isWon ? null : this.mood.current();
  }

  update(deltaMs: number): void {
    tickGT024Clock(this, deltaMs);
    this.mood.tick(deltaMs);
  }

  setupEntities(): void {
    this.mood.clear();
    resetGT024Clock(this);
    this.isWon = false;
    this.roundClosedOnWrong = false;

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
    this.placement = computeAntPlacement(
      this.screenWaypoints,
      this.hitHalf,
      this.stageRect
    );

    this.recordEvent("round_started", {
      round_index: 0,
      shape_name: this.content.shape_name,
      waypoint_count: waypoints.length,
    });
  }

  private validateTapWaypoint(data: GameAction["data"]): ActionResult {
    const hitIdx = readNum(data, "index");
    const strokePts = readPointArray(data, "strokePoints");
    const expectedIdx = this.traceSystem.getCurrentOrderIndex();
    if (
      hitIdx !== null &&
      hitIdx >= 0 &&
      (hitIdx !== expectedIdx || strokePts.length >= 2)
    ) {
      return ACTION_RETRY;
    }
    return ACTION_IGNORED;
  }

  private validateTracePoint(data: GameAction["data"]): ActionResult {
    const x = readNum(data, "x");
    const y = readNum(data, "y");
    if (x === null || y === null) {
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
    if (!this.isAcceptingInput()) {
      return ACTION_IGNORED;
    }
    if (action.type === "tap_waypoint") {
      return this.validateTapWaypoint(action.data);
    }
    if (action.type === "trace_point" || action.type === "point_touched") {
      return this.validateTracePoint(action.data);
    }
    if (action.type === "trace_multi") {
      const pts = readPointArray(action.data, "points");
      return pts.length >= 2 ? ACTION_CORRECT : ACTION_IGNORED;
    }
    return ACTION_IGNORED;
  }

  onTracePoint(point: TracePoint): TracePathResult {
    if (!this.isAcceptingInput()) {
      return {
        valid: false,
        currentCheckpointIndex: this.traceSystem.getCurrentOrderIndex(),
        isComplete: this.traceSystem.isComplete(),
      };
    }
    const targetIdx = this.traceSystem.getCurrentOrderIndex();
    const result = this.traceSystem.checkPoint(point);

    if (result.valid && result.reachedWaypointId) {
      markGT024Reached(this, targetIdx);
      this.queueSfx("ant_step");
      this.mood.set("happy", GT024_HAPPY_MS);
      this.recordEvent("checkpoint_reached", {
        waypoint_id: result.reachedWaypointId,
        checkpoint_index: result.currentCheckpointIndex,
        total_waypoints: this.traceSystem.getTotalWaypoints(),
      });

      if (result.isComplete && !this.isWon) {
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
    return !this.roundClosedOnWrong && this.traceSystem.isComplete();
  }

  override toAction(gesture: Gesture): GameAction | null {
    if (!this.isAcceptingInput()) {
      return null;
    }
    const hitTolerance = Math.max(
      this.tolerancePx,
      WAYPOINT_VIEW_RADIUS_PX + TAP_TOLERANCE_PX
    );
    return resolveGT024GestureAction(
      this,
      gesture,
      this.tolerancePx,
      hitTolerance
    );
  }

  override commit(action: GameAction): void {
    if (!this.isAcceptingInput()) {
      return;
    }
    if (action.type === "tap_waypoint") {
      const cur = this.traceSystem.getCurrentOrderIndex();
      const hitIdx = readNum(action.data, "index") ?? cur;
      const strokePts = readPointArray(action.data, "strokePoints");
      triggerGT024Wrong(this, [hitIdx, cur], strokePts);
      this.mood.set("wonder", GT024_WONDER_MS);
      if (this.difficulty.allow_retry === false) {
        this.roundClosedOnWrong = true;
        this.completeSession();
      }
      return;
    }
    if (action.type === "trace_multi") {
      for (const pt of readPointArray(action.data, "points")) {
        this.onTracePoint(pt);
      }
      return;
    }
    if (action.type === "trace_point" || action.type === "point_touched") {
      const x = readNum(action.data, "x");
      const y = readNum(action.data, "y");
      if (x !== null && y !== null) {
        this.onTracePoint({ x, y });
      }
    }
  }

  setPointerOver(x: number, y: number): void {
    const c = getGT024Clock(this);
    if (!(this.isAcceptingInput() && isPointInStage(x, y, this.stageRect))) {
      c.hoveredIndex = null;
      return;
    }
    const tol = Math.max(
      this.tolerancePx,
      WAYPOINT_VIEW_RADIUS_PX + TAP_TOLERANCE_PX
    );
    const idx = this.screenWaypoints.findIndex(
      (w) => Math.hypot(w.x - x, w.y - y) <= tol
    );
    c.hoveredIndex = idx >= 0 ? idx : null;
  }

  clearPointerOver(): void {
    getGT024Clock(this).hoveredIndex = null;
  }

  override onScaffoldEscalated(level: 1 | 2 | 3): void {
    getGT024Clock(this).scaffoldLevel = level;
  }

  override onHintCleared(): void {
    getGT024Clock(this).scaffoldLevel = 0;
  }

  override getView(): EngineView {
    return {
      activePrompt: this.content.prompt,
      entities: buildGT024ViewEntities(this),
    };
  }

  override getHintTargetIndex(): number | null {
    return resolveGT024HintTargetIndex(this);
  }

  override getHintDestinationIndex(): number | null {
    return resolveGT024HintDestinationIndex(this);
  }

  override getHintTarget(): HintTarget | null {
    const cur = this.getCurrentOrderIndex();
    const to = this.getHintDestinationIndex();
    if (cur > 0 && to !== null) {
      const from = this.slotOfWaypoint[cur - 1] ?? cur - 1;
      return { kind: "slot", index: from, toIndex: to };
    }
    return super.getHintTarget();
  }

  override getHintTargetForLevel(level: 1 | 2 | 3): HintTarget | null {
    return resolveGT024HintTargetForLevel(this, level);
  }

  override getHintDemoSequence(
    level: 1 | 2 | 3
  ): readonly HintDemoStep[] | null {
    return resolveGT024HintDemoSequence(this, level);
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

  private fitWaypointsToStage(
    stage: ZoneRect,
    ageBand: AgeBand
  ): readonly Slot[] {
    const floor = resolveTouchFloor(ageBand, this.cssPerLogic);
    const preHitHalf = Math.max(WAYPOINT_VIEW_RADIUS_PX, Math.round(floor) / 2);
    const fit = fitContentToStage(
      stage,
      gt024FitMargin(preHitHalf),
      this.content.waypoints
    );
    this.screenWaypoints = this.content.waypoints.map((w) =>
      applyStageFit(w, fit)
    );
    this.tolerancePx = Math.max(
      this.difficulty.tolerance_px * fit.scale,
      floor / 2
    );
    this.traceSystem.rescale(this.screenWaypoints, this.tolerancePx);
    const hit = Math.round(floor);
    this.hitHalf = Math.max(WAYPOINT_VIEW_RADIUS_PX, hit / 2);
    this.placement = computeAntPlacement(
      this.screenWaypoints,
      this.hitHalf,
      stage
    );
    const dedup = buildDeduplicatedSlots(this.screenWaypoints, hit);
    this.slotOfWaypoint = dedup.slotOfWaypoint;
    return dedup.slots;
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    renderGT024(this, ctx, rs, timeMs);
  }
}
