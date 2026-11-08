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
  type AntCrawl,
  type AvoidBox,
  antCrawl,
  antNestBox,
  antNestPoint,
  antPerchPoint,
  type CrawlPoint,
  drawAntNest,
  drawCrawlingAnt,
  drawSceneBackground,
  drawSubPromptText,
  drawWaypointPath,
} from "#src/render/index.js";
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
  applyStageFit,
  fitContentToStage,
  isPointInStage,
} from "./stage-fit.js";
import type { GT024Content, GT024Difficulty } from "./template.js";

const WAYPOINT_VIEW_RADIUS_PX = 24;
const DROP_INTERPOLATION_STEPS = 16;
const GUIDE_BOX_STEP_PX = 10;
const GUIDE_BOX_HALF_PX = 6;

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

/** Khung chuyện đọc một lần ở vòng đầu (`BR-E024-04`, `BR-FBK-16`). */
export const GT024_STORY_LINE =
  "Kiến Nhỏ bị lạc, chưa tìm thấy đường về tổ. Bé nối các điểm theo thứ tự để dẫn Kiến Nhỏ về tổ nhé!";

/** Mascot vui sau mỗi điểm nối đúng. */
export const GT024_HAPPY_MS = 700;
/** Mascot nghiêng đầu sau lần chạm nhầm điểm. */
export const GT024_WONDER_MS = 1200;

/** Các hộp nhỏ rải dọc nét dẫn nối các điểm mốc, để kiến không đứng trên nét. */
function guideBoxes(points: readonly CrawlPoint[]): AvoidBox[] {
  const boxes: AvoidBox[] = [];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    if (!(a && b)) {
      continue;
    }
    const steps = Math.max(
      1,
      Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / GUIDE_BOX_STEP_PX)
    );
    for (let k = 0; k <= steps; k++) {
      boxes.push({
        x: a.x + ((b.x - a.x) * k) / steps,
        y: a.y + ((b.y - a.y) * k) / steps,
        halfW: GUIDE_BOX_HALF_PX,
        halfH: GUIDE_BOX_HALF_PX,
      });
    }
  }
  return boxes;
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
  /** Nửa cạnh ô chạm của mỗi waypoint (px logic), kiến và tổ phải tránh. */
  private hitHalf = WAYPOINT_VIEW_RADIUS_PX;
  /** Chỗ tổ và chỗ kiến đậu đã tính (bất biến trong một vòng); `undefined` = chưa tính. */
  private placement:
    | { nest: CrawlPoint | null; perch: CrawlPoint | null }
    | undefined;
  /** Chỉ số slot chạm của từng waypoint; mặc định mỗi waypoint một slot. */
  private slotOfWaypoint: readonly number[] = [];
  private readonly orderingMechanic = new OrderingMechanic();
  private lastFrameMs = 0;
  private wrongWaypointTimestamp = 0;

  private readonly mood = new MoodPulse();
  /** Kiến bò dọc nét đã vẽ (`BR-E024-06`); `null` tới khi vẽ khung đầu. */
  private ant: {
    readonly from: CrawlPoint;
    readonly fromReached: number;
    readonly reached: number;
    readonly startMs: number;
  } | null = null;

  get hitHalfPx(): number {
    return this.hitHalf;
  }

  /**
   * Chỗ tổ và chỗ kiến đậu: ngoài hộp chạm của mọi waypoint và trọn trong sân
   * khấu (`BR-E024-08`). Tổ đặt trước, kiến đậu tránh cả tổ.
   */
  private computePlacement(): {
    nest: CrawlPoint | null;
    perch: CrawlPoint | null;
  } {
    const wps = this.screenWaypoints;
    const first = wps[0];
    const last = wps.at(-1);
    if (!(first && last)) {
      return { nest: null, perch: null };
    }
    const boxes: AvoidBox[] = wps.map((w) => ({
      x: w.x,
      y: w.y,
      halfW: this.hitHalf,
      halfH: this.hitHalf,
    }));
    const cx = wps.reduce((sum, w) => sum + w.x, 0) / wps.length;
    const cy = wps.reduce((sum, w) => sum + w.y, 0) / wps.length;
    const stage = this.stageRect ?? undefined;
    const centre = { x: cx, y: cy };
    const guides = guideBoxes(wps);
    // Tổ và kiến ưu tiên chỗ không nằm trên nét dẫn nối các điểm; hết chỗ thì chỉ
    // cần tránh ô chạm.
    const nest =
      antNestPoint(last, stage, [...boxes, ...guides], centre) ??
      antNestPoint(last, stage, boxes, centre);
    const withNest = nest ? [...boxes, antNestBox(nest)] : boxes;
    const perch =
      antPerchPoint(first, wps[1], stage, [...withNest, ...guides]) ??
      antPerchPoint(first, wps[1], stage, withNest);
    return { nest, perch };
  }

  private getPlacement(): {
    nest: CrawlPoint | null;
    perch: CrawlPoint | null;
  } {
    this.placement ??= this.computePlacement();
    return this.placement;
  }

  override storyLine(): string {
    return GT024_STORY_LINE;
  }

  /** Chỉ phản ứng sau khi nối hoặc chạm nhầm, không báo trước (`BR-E024-04`). */
  override mascotMood(): MascotPose | null {
    return this.isWon ? null : this.mood.current();
  }

  update(deltaMs: number): void {
    this.lastFrameMs += deltaMs;
    this.mood.tick(deltaMs);
  }

  setupEntities(): void {
    this.mood.clear();
    this.ant = null;
    this.placement = undefined;
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
      this.queueSfx("ant_step");
      this.mood.set("happy", GT024_HAPPY_MS);
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
      this.mood.set("wonder", GT024_WONDER_MS);
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
    this.hitHalf = Math.max(WAYPOINT_VIEW_RADIUS_PX, hit / 2);
    this.placement = undefined;
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

  /** Chỗ kiến đứng khi đã nối `reached` điểm: điểm vừa nối, hoặc chỗ đậu trước điểm đầu (có thể không có). */
  private antHome(reached: number): CrawlPoint | null {
    if (!this.screenWaypoints[0]) {
      return null;
    }
    return this.screenWaypoints[reached - 1] ?? this.getPlacement().perch;
  }

  /** Đường kiến đang bò: chỗ cũ rồi từng điểm vừa nối; chỉ điểm đã nối, không điểm nào sau đó. */
  private antPath(): readonly CrawlPoint[] {
    const ant = this.ant;
    if (!ant) {
      return [];
    }
    const home = this.antHome(ant.reached);
    if (!home) {
      return [];
    }
    if (ant.reached <= ant.fromReached) {
      return [home];
    }
    return [
      ant.from,
      ...this.screenWaypoints.slice(Math.max(0, ant.fromReached), ant.reached),
    ];
  }

  private antState(timeMs: number, reducedMotion: boolean): AntCrawl | null {
    const reached = Math.min(
      this.traceSystem.getCurrentOrderIndex(),
      this.screenWaypoints.length
    );
    const home = this.antHome(reached);
    if (!home) {
      return null;
    }
    if (!this.ant) {
      this.ant = { from: home, fromReached: reached, reached, startMs: timeMs };
    } else if (this.ant.reached !== reached) {
      const now = antCrawl(
        this.antPath(),
        timeMs - this.ant.startMs,
        reducedMotion
      );
      this.ant = {
        from: now ?? home,
        fromReached: this.ant.reached,
        reached,
        startMs: timeMs,
      };
    }
    return antCrawl(this.antPath(), timeMs - this.ant.startMs, reducedMotion);
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
    // Tổ kiến cạnh điểm cuối, chỉ khi điểm cuối đã có số (`BR-E024-06`, `BR-E024-08`).
    const nest = this.getPlacement().nest;
    if (nest && this.difficulty.show_numbered_dots) {
      drawAntNest(ctx, nest.x, nest.y);
    }
    drawWaypointPath(
      ctx,
      this.screenWaypoints,
      this.traceSystem.getCurrentOrderIndex(),
      {
        showGuideLines: this.difficulty.show_guide_lines,
        showNumberedDots: this.difficulty.show_numbered_dots,
      }
    );

    const crawl = this.antState(timeMs, rs.reducedMotion);
    if (crawl) {
      drawCrawlingAnt(ctx, crawl);
    }

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
