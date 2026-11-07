import type { AgeBand } from "#src/contracts/types";
import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "#src/game-session";
import type { EngineView, Gesture, ViewEntity } from "#src/interaction";
import {
  type KeywordAsset,
  resolveAssetLabels,
} from "#src/labels/spoken-keyword";
import { resolveTouchFloor } from "#src/layout/constants";
import { isPointInSlot, TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import { resolveLayout } from "#src/layout/registry";
import { insetDrawSize, splitCaption } from "#src/layout/slot-fit";
import {
  computeSplitGridSlots,
  slotsFitStage,
} from "#src/layout/stage-split-grids";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import {
  drawDividerLine,
  drawProgressDots,
  drawSceneBackground,
  drawSceneObjectAt,
  sceneBox,
} from "#src/render/index.js";
import type { MascotPose } from "#src/render/mascot";
import type { DegradationState } from "#src/systems/degradation";
import type { RenderSystem } from "#src/systems/render-system";
import { WrongFlash } from "#src/systems/wrong-flash";
import type { GT025Content, GT025Difficulty } from "./template.js";

/** Khung chuyện đọc một lần ở vòng đầu (`BR-E025-05`, `BR-FBK-16`). */
export const GT025_STORY_LINE =
  "Gấu Con vẽ hai bức tranh gần giống nhau, bé tìm giúp Gấu Con chỗ khác nhau nhé!";

/** Cạnh ô lớn nhất khi mỗi bên là khối nhiều cột (canvas thấp). */
const SPLIT_CELL_MAX_PX = 120;

interface ResolvedDifferenceObject {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly slot: Slot;
  readonly role: "source" | "target";
  readonly slotIndex: number;
  readonly asset: KeywordAsset;
}

function findHitDifferenceObject(
  objects: readonly ResolvedDifferenceObject[],
  x: number,
  y: number,
  tolerance = TAP_TOLERANCE_PX
): ResolvedDifferenceObject | null {
  for (let i = objects.length - 1; i >= 0; i--) {
    const obj = objects[i];
    if (!obj) {
      continue;
    }
    if (isPointInSlot(obj.slot, x, y, "circle", tolerance)) {
      return obj;
    }
  }
  return null;
}

/** Cột phải của bố cục cũ nằm cách cột trái 480 logic px (chỉ dùng khi không có slot). */
const RIGHT_COLUMN_OFFSET = 480;

export interface GT025ActionPayload {
  readonly object_id?: string;
  readonly item_id?: string;
}

function normalizeObjectId(id: string): string {
  if (id.startsWith("left:")) {
    return id.slice(5);
  }
  if (id.startsWith("right:")) {
    return id.slice(6);
  }
  return id;
}

export class GT025Session extends TemplateGameSession<
  GT025Content,
  GT025Difficulty
> {
  override readonly usesPromptZone = true;

  degradation: DegradationState | null = null;

  private lastFrameMs = 0;
  private readonly foundDifferenceIds = new Set<string>();
  private readonly foundLeftIds = new Set<string>();
  private readonly foundRightIds = new Set<string>();
  private wrongObjectId: string | null = null;
  private readonly wrongFlash = new WrongFlash();
  resolvedObjects: ResolvedDifferenceObject[] = [];

  update(deltaMs: number): void {
    this.lastFrameMs += deltaMs;
  }

  setupEntities(): void {
    this.isWon = false;
    this.wrongFlash.clear();
    this.lastFrameMs = 0;
    this.foundDifferenceIds.clear();
    this.foundLeftIds.clear();
    this.foundRightIds.clear();
    this.updateResolvedObjects();

    this.recordEvent("round_started", {
      round_index: 0,
      total_differences: this.content.differences.length,
    });
  }

  protected override computeRoundDerived(): void {
    this.updateResolvedObjects();
  }

  private updateResolvedObjects(): void {
    const sources = this.sourceSlots;
    const targets = this.targetSlots;
    const resolved: ResolvedDifferenceObject[] = [];

    this.content.left_objects.forEach((obj, i) => {
      const slot = sources[i];
      const resolvedSlot: Slot = slot ?? {
        index: i,
        x: obj.x ?? 200,
        y: obj.y ?? 250,
        w: 64,
        h: 64,
        hitW: 64,
        hitH: 64,
        page: 0,
        role: "source",
      };
      resolved.push({
        id: obj.id,
        x: resolvedSlot.x,
        y: resolvedSlot.y,
        w: resolvedSlot.w,
        h: resolvedSlot.h,
        slot: resolvedSlot,
        role: "source",
        slotIndex: resolvedSlot.index,
        asset: obj.asset,
      });
    });

    this.content.right_objects.forEach((obj, i) => {
      const slot = targets[i];
      const resolvedSlot: Slot = slot ?? {
        index: this.content.left_objects.length + i,
        x: obj.x === undefined ? 680 : obj.x + RIGHT_COLUMN_OFFSET,
        y: obj.y ?? 250,
        w: 64,
        h: 64,
        hitW: 64,
        hitH: 64,
        page: 0,
        role: "target",
      };
      resolved.push({
        id: obj.id,
        x: resolvedSlot.x,
        y: resolvedSlot.y,
        w: resolvedSlot.w,
        h: resolvedSlot.h,
        slot: resolvedSlot,
        role: "target",
        slotIndex: resolvedSlot.index,
        asset: obj.asset,
      });
    });

    this.resolvedObjects = resolved;
  }

  private validateTapObject(
    data: GT025ActionPayload | undefined
  ): ActionResult {
    const rawObjectId = data ? (data.object_id ?? data.item_id) : undefined;

    if (typeof rawObjectId !== "string") {
      return ACTION_IGNORED;
    }

    const objectId = normalizeObjectId(rawObjectId);
    const diff = this.content.differences.find(
      (d) => d.left_id === objectId || d.right_id === objectId
    );

    if (!diff) {
      return ACTION_RETRY;
    }

    if (this.foundDifferenceIds.has(diff.id)) {
      return ACTION_IGNORED;
    }

    return ACTION_CORRECT;
  }

  onTapObject(rawObjectId: string): ActionResult {
    const objectId = normalizeObjectId(rawObjectId);
    const diff = this.content.differences.find(
      (d) => d.left_id === objectId || d.right_id === objectId
    );

    if (!diff) {
      this.wrongObjectId = objectId;
      this.wrongFlash.trigger(this.lastFrameMs);
      this.recordEvent("item_selected", {
        object_id: objectId,
        is_correct: false,
      });
      return ACTION_RETRY;
    }

    if (this.foundDifferenceIds.has(diff.id)) {
      return ACTION_IGNORED;
    }

    this.foundDifferenceIds.add(diff.id);
    this.queueSfx("sparkle_find");
    this.foundLeftIds.add(diff.left_id);
    this.foundRightIds.add(diff.right_id);
    this.recordEvent("item_selected", {
      object_id: objectId,
      is_correct: true,
      difference_id: diff.id,
      found_count: this.foundDifferenceIds.size,
      total_differences: this.content.differences.length,
    });

    if (this.foundDifferenceIds.size >= this.content.differences.length) {
      this.isWon = true;
      this.recordEvent("round_completed", { round_index: 0 });
      this.winSession();
    }

    return ACTION_CORRECT;
  }

  validateAction(action: GameAction): ActionResult {
    switch (action.type) {
      case "tap_object":
      case "select_item": {
        const payload = action.data as GT025ActionPayload | undefined;
        return this.validateTapObject(payload);
      }
      default:
        return ACTION_IGNORED;
    }
  }

  override checkWinCondition(): boolean {
    return (
      this.content.differences.length > 0 &&
      this.foundDifferenceIds.size >= this.content.differences.length
    );
  }

  override toAction(gesture: Gesture): GameAction | null {
    if (gesture.type === "tap") {
      const hitObj = findHitDifferenceObject(
        this.resolvedObjects,
        gesture.x,
        gesture.y
      );
      if (hitObj) {
        return {
          type: "tap_object",
          data: { object_id: hitObj.id },
        };
      }
    }
    return null;
  }

  override commit(action: GameAction): void {
    if (action.type === "tap_object" || action.type === "select_item") {
      const data = action.data as GT025ActionPayload | undefined;
      const rawObjectId = data ? (data.object_id ?? data.item_id) : undefined;
      if (typeof rawObjectId === "string") {
        this.onTapObject(rawObjectId);
      }
    }
  }

  override getView(): EngineView {
    const now = this.lastFrameMs;
    const isWrongNow = this.wrongFlash.isActive(now);
    const seenIds = new Set<string>();
    const entities: ViewEntity[] = this.resolvedObjects.map((obj) => {
      const isFound =
        obj.role === "source"
          ? this.foundLeftIds.has(obj.id)
          : this.foundRightIds.has(obj.id);
      const isWrong = isWrongNow && this.wrongObjectId === obj.id;
      let state: ViewEntity["state"] = "idle";
      if (isFound) {
        state = "correct";
      } else if (isWrong) {
        state = "incorrect";
      }
      const side = obj.role === "source" ? "left" : "right";
      let entityId = obj.id;
      if (seenIds.has(entityId)) {
        entityId = `${side}:${obj.id}`;
      } else {
        seenIds.add(entityId);
      }
      return {
        id: entityId,
        slotIndex: obj.slotIndex,
        role: obj.role,
        state,
        x: obj.x,
        y: obj.y,
        w: obj.w,
        h: obj.h,
        ...resolveAssetLabels(obj.asset),
      };
    });
    return {
      activePrompt: this.content.prompt,
      entities,
    };
  }

  override storyLine(): string {
    return GT025_STORY_LINE;
  }

  /** Gấu Con ngó nghiêng tìm tiếp từ điểm đầu tới điểm cuối (`BR-E025-05`). */
  override mascotMood(): MascotPose | null {
    return this.foundDifferenceIds.size > 0 && !this.checkWinCondition()
      ? "wonder"
      : null;
  }

  getFoundCount(): number {
    return this.foundDifferenceIds.size;
  }

  override destroy(): void {
    super.destroy();
    this.foundDifferenceIds.clear();
    this.foundLeftIds.clear();
    this.foundRightIds.clear();
  }

  override getHintTargetIndex(): number | null {
    if (this.isWon) {
      return null;
    }
    const unfoundDiff = this.content.differences.find(
      (d) => !this.foundDifferenceIds.has(d.id)
    );
    if (!unfoundDiff) {
      return null;
    }
    const targetObj = this.resolvedObjects.find(
      (obj) => obj.id === unfoundDiff.right_id || obj.id === unfoundDiff.left_id
    );
    return targetObj ? targetObj.slotIndex : null;
  }

  /**
   * `show_counter` bật (hoặc `show_difference_counter` tường minh, bí danh cũ
   * của nội dung đã seed) thì bộ đếm điểm khác biệt chiếm dải nhãn ở đỉnh
   * stage (`GT-025.md` N1, mục 11); hai khối cảnh nằm dưới dải đó.
   */
  private showsCounter(): boolean {
    return (
      this.difficulty.show_difference_counter ??
      this.difficulty.show_counter !== false
    );
  }

  private sceneStage(): ZoneRect | undefined {
    const stage = this.stageRect;
    return stage && this.showsCounter() ? splitCaption(stage).body : stage;
  }

  protected computeSlots(ageBand: AgeBand): readonly Slot[] {
    const layoutFn = resolveLayout("split-columns");
    const slots = insetDrawSize(
      layoutFn({
        slotCount: this.content.left_objects.length,
        targetCount: this.content.right_objects.length,
        ageBand,
        logic: this.logicSpace,
        stage: this.sceneStage(),
        cssPerLogic: this.cssPerLogic,
      }),
      this.sceneStage()
    );
    const stage = this.sceneStage();
    if (!stage || slotsFitStage(slots, stage)) {
      return slots;
    }
    // Canvas thấp: hai cột đơn không đủ hàng — mỗi bên thành khối nhiều cột.
    return insetDrawSize(
      computeSplitGridSlots({
        leftCount: this.content.left_objects.length,
        rightCount: this.content.right_objects.length,
        stage,
        touchFloor: resolveTouchFloor(ageBand, this.cssPerLogic),
        maxCell: { w: SPLIT_CELL_MAX_PX, h: SPLIT_CELL_MAX_PX },
        leftRole: "source",
        rightRole: "target",
      }),
      stage
    );
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    this.lastFrameMs = timeMs;
    drawSceneBackground(ctx, rs, this.themeId);
    const scene = this.sceneStage() ?? sceneBox(rs);
    if (this.stageRect && this.showsCounter()) {
      drawProgressDots(
        ctx,
        rs,
        {
          done: this.foundDifferenceIds.size,
          total: this.content.target_count,
        },
        splitCaption(this.stageRect).caption
      );
    }
    const half = { x: scene.x, y: scene.y, w: scene.w / 2, h: scene.h };
    const rightHalf = {
      x: scene.x + scene.w / 2,
      y: scene.y,
      w: scene.w / 2,
      h: scene.h,
    };
    const sources = this.sourceSlots;
    const targets = this.targetSlots;

    drawDividerLine(
      ctx,
      scene.x + scene.w / 2,
      scene.y,
      scene.x + scene.w / 2,
      scene.y + scene.h
    );

    const now = this.lastFrameMs;
    const isWrongNow = this.wrongFlash.isActive(now);

    this.content.left_objects.forEach((obj, i) => {
      drawSceneObjectAt(ctx, rs, half, this.inLayout(obj), sources[i], {
        found: this.foundLeftIds.has(obj.id),
        wrong: isWrongNow && this.wrongObjectId === obj.id,
      });
    });
    this.content.right_objects.forEach((obj, i) => {
      drawSceneObjectAt(ctx, rs, rightHalf, this.inLayout(obj), targets[i], {
        found: this.foundRightIds.has(obj.id),
        wrong: isWrongNow && this.wrongObjectId === obj.id,
      });
    });
  }

  /**
   * Có stage thì slot của layout đã nằm trong stage (`BR-PSZ-01`); toạ độ
   * content thuộc không gian scene cũ nên bỏ để `drawSceneObjectAt` dùng slot.
   */
  private inLayout<T extends { x?: number; y?: number }>(obj: T): T {
    return this.stageRect ? { ...obj, x: undefined, y: undefined } : obj;
  }
}
