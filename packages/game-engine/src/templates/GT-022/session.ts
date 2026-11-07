import type { AgeBand } from "#src/contracts/types";
import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  type GameActionValue,
  TemplateGameSession,
} from "#src/game-session";
import type {
  EngineView,
  EntityVisual,
  Gesture,
  ViewEntity,
} from "#src/interaction";
import { resolveAssetLabels } from "#src/labels/spoken-keyword";
import { resolveTouchFloor } from "#src/layout/constants";
import { TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import { resolveLayout } from "#src/layout/registry";
import { insetDrawSize } from "#src/layout/slot-fit";
import type { Slot } from "#src/layout/types";
import { SelectionMechanic } from "#src/mechanics/selection-mechanic";
import {
  drawLabelText,
  drawSceneBackground,
  drawSceneObjectAt,
  sceneBox,
} from "#src/render/index";
import { deriveStream } from "#src/rng/mulberry32";
import type { DegradationState } from "#src/systems/degradation";
import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";
import {
  type FindResult,
  type SceneObject,
  SceneSystem,
} from "#src/systems/scene-system";
import { WRONG_FLASH_MS, WrongFlash } from "#src/systems/wrong-flash";
import type { GT022Content, GT022Difficulty } from "./template";

function findHitSceneObject(
  objects: readonly SceneObject[],
  x: number,
  y: number,
  tolerance = TAP_TOLERANCE_PX
): SceneObject | null {
  let best: SceneObject | null = null;
  let bestDistSq = Number.POSITIVE_INFINITY;
  for (let i = objects.length - 1; i >= 0; i--) {
    const obj = objects[i];
    if (!obj) {
      continue;
    }
    const hw = obj.width / 2 + tolerance;
    const hh = obj.height / 2 + tolerance;
    if (Math.abs(x - obj.x) <= hw && Math.abs(y - obj.y) <= hh) {
      const dx = x - obj.x;
      const dy = y - obj.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < bestDistSq) {
        bestDistSq = distSq;
        best = obj;
      }
    }
  }
  return best;
}

export class GT022Session extends TemplateGameSession<
  GT022Content,
  GT022Difficulty
> {
  override readonly usesPromptZone = true;

  degradation: DegradationState | null = null;

  readonly sceneSystem = new SceneSystem();
  private readonly selectionMechanic = new SelectionMechanic();
  resolvedObjects: SceneObject[] = [];
  private assetById = new Map<
    string,
    GT022Content["scene_objects"][number]["asset"]
  >();
  private wrongItemId: string | null = null;
  private readonly wrongFlash = new WrongFlash();
  private lastFrameMs = 0;

  setupEntities(): void {
    this.isWon = false;
    this.wrongItemId = null;
    this.wrongFlash.clear();
    this.lastFrameMs = 0;
    this.selectionMechanic.reset();
    this.assetById = new Map(
      this.content.scene_objects.map((o) => [o.id, o.asset])
    );

    const rng = deriveStream(this.layoutSeed, "items");
    this.resolvedObjects = this.content.scene_objects.map((obj, idx) => {
      // Deterministic layout coordinates if not explicitly supplied (BR-LVB-11)
      const x = obj.x ?? Math.round(100 + rng.next() * 760); // safe zone
      const y = obj.y ?? Math.round(100 + rng.next() * 340);

      return {
        id: obj.id,
        x,
        y,
        width: 64,
        height: 64,
        isTarget: obj.is_target,
        isHidden: obj.is_hidden,
        layer: idx,
      };
    });

    this.sceneSystem.init(this.resolvedObjects);

    this.recordEvent("round_started", {
      round_index: 0,
      total_targets: this.sceneSystem.getTotalTargets(),
      total_objects: this.resolvedObjects.length,
    });
  }

  private validateTapObject(data: GameActionValue): ActionResult {
    const itemId =
      typeof data === "object" && data !== null
        ? Reflect.get(data, "item_id")
        : undefined;
    if (typeof itemId !== "string" || itemId.length === 0) {
      return ACTION_IGNORED;
    }
    const state = this.sceneSystem.getObjectState(itemId);
    if (state?.isFound === true) {
      return ACTION_IGNORED;
    }
    const obj = this.resolvedObjects.find((o) => o.id === itemId);
    if (!obj) {
      return ACTION_IGNORED;
    }
    return obj.isTarget ? ACTION_CORRECT : ACTION_RETRY;
  }

  private validateRevealObject(data: GameActionValue): ActionResult {
    const itemId =
      typeof data === "object" && data !== null
        ? Reflect.get(data, "item_id")
        : undefined;
    return typeof itemId === "string" && itemId.length > 0
      ? ACTION_CORRECT
      : ACTION_IGNORED;
  }

  validateAction(action: GameAction): ActionResult {
    if (action.type === "tap_object" || action.type === "select_item") {
      return this.validateTapObject(action.data);
    }

    if (action.type === "reveal_object") {
      return this.validateRevealObject(action.data);
    }

    return ACTION_IGNORED;
  }

  onRevealObject(itemId: string): boolean {
    const revealed = this.sceneSystem.revealObject(itemId);
    if (revealed) {
      this.recordEvent("item_revealed", { item_id: itemId });
    }
    return revealed;
  }

  onTapObject(itemId: string): FindResult {
    const result = this.sceneSystem.findTarget(itemId);

    this.recordEvent("item_selected", {
      item_id: itemId,
      is_target: result.isTarget,
      is_new_find: result.isNewFind,
      found_count: this.sceneSystem.getFoundCount(),
      total_targets: this.sceneSystem.getTotalTargets(),
    });

    if (result.isNewFind) {
      this.selectionMechanic.select(itemId);
    } else if (!result.isTarget) {
      this.wrongItemId = itemId;
      this.wrongFlash.trigger(this.lastFrameMs);
    }

    if (this.checkWinCondition()) {
      this.recordEvent("round_completed", { round_index: 0 });
      this.winSession();
    }

    return result;
  }

  override checkWinCondition(): boolean {
    return this.sceneSystem.isAllFound();
  }

  /**
   * `BR-E022-04`: có stage thì vật vẽ ở slot của layout, nên vùng chạm lấy tâm
   * và hộp chạm của slot đó; `x`/`y` của content chỉ còn cho cảnh không slot.
   */
  protected override computeRoundDerived(): void {
    if (!this.stageRect) {
      return;
    }
    this.resolvedObjects = this.resolvedObjects.map((obj, i) => {
      const slot = this.slots[i];
      return slot
        ? { ...obj, x: slot.x, y: slot.y, width: slot.hitW, height: slot.hitH }
        : obj;
    });
  }

  override toAction(gesture: Gesture): GameAction | null {
    if (gesture.type === "tap") {
      const hitObj = findHitSceneObject(
        this.resolvedObjects,
        gesture.x,
        gesture.y,
        TAP_TOLERANCE_PX
      );
      if (hitObj) {
        const state = this.sceneSystem.getObjectState(hitObj.id);
        if (hitObj.isHidden && state?.isRevealed !== true) {
          return { type: "reveal_object", data: { item_id: hitObj.id } };
        }
        return { type: "tap_object", data: { item_id: hitObj.id } };
      }
    }
    return null;
  }

  override commit(action: GameAction): void {
    if (action.type === "tap_object" || action.type === "select_item") {
      const data = action.data;
      const itemId =
        typeof data === "object" && data !== null
          ? Reflect.get(data, "item_id")
          : undefined;
      if (typeof itemId === "string") {
        this.onTapObject(itemId);
      }
    } else if (action.type === "reveal_object") {
      const data = action.data;
      const itemId =
        typeof data === "object" && data !== null
          ? Reflect.get(data, "item_id")
          : undefined;
      if (typeof itemId === "string") {
        this.onRevealObject(itemId);
      }
    }
  }

  private resolveAssetById(): ReadonlyMap<
    string,
    GT022Content["scene_objects"][number]["asset"]
  > {
    if (this.assetById.size === this.content.scene_objects.length) {
      return this.assetById;
    }
    return new Map(this.content.scene_objects.map((o) => [o.id, o.asset]));
  }

  override getView(): EngineView {
    const assetById = this.resolveAssetById();
    const entities: ViewEntity[] = this.resolvedObjects.map((obj, i) => {
      const state = this.sceneSystem.getObjectState(obj.id);
      let visual: EntityVisual = "idle";
      if (state?.isFound) {
        visual = "correct";
      }
      const isCovered = obj.isHidden && state?.isRevealed !== true;
      const asset = assetById.get(obj.id);
      const labels = !isCovered && asset ? resolveAssetLabels(asset) : {};
      return {
        id: obj.id,
        slotIndex: i,
        role: "source",
        state: visual,
        x: obj.x,
        y: obj.y,
        w: obj.width,
        h: obj.height,
        ...labels,
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
    const idx = this.resolvedObjects.findIndex((obj) => {
      const state = this.sceneSystem.getObjectState(obj.id);
      return obj.isTarget && !state?.isFound;
    });
    return idx >= 0 ? idx : null;
  }

  protected computeSlots(ageBand: AgeBand): readonly Slot[] {
    const layoutFn = resolveLayout("free-scene");
    const rawSlots = layoutFn({
      slotCount: this.content.scene_objects.length,
      ageBand,
      logic: this.logicSpace,
      stage: this.stageRect,
      cssPerLogic: this.cssPerLogic,
    });
    if (this.stageRect) {
      const touchFloor = resolveTouchFloor(ageBand, this.cssPerLogic);
      const displaySize = Math.max(touchFloor, 84);
      return rawSlots.map((s) => ({
        ...s,
        w: Math.max(s.w, displaySize),
        h: Math.max(s.h, displaySize),
        hitW: Math.max(s.hitW, displaySize),
        hitH: Math.max(s.hitH, displaySize),
      }));
    }
    return insetDrawSize(rawSlots, this.stageRect);
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    this.lastFrameMs = timeMs;
    if (this.wrongItemId && this.wrongFlash.hasExpired(timeMs)) {
      this.wrongItemId = null;
    }
    drawSceneBackground(ctx, rs, this.themeId);
    // free-scene: toạ độ tới từ content (đã ở không gian logic), ô nào thiếu
    // toạ độ thì rơi về slot của layout.
    const scene = sceneBox(rs);
    const assetById = this.resolveAssetById();
    this.resolvedObjects.forEach((obj, i) => {
      const state = this.sceneSystem.getObjectState(obj.id);
      const slot = this.slots[i] ?? {
        index: i,
        x: obj.x,
        y: obj.y,
        w: obj.width,
        h: obj.height,
        hitW: obj.width,
        hitH: obj.height,
        page: 0,
        role: "neutral" as const,
      };

      // Vật ẩn sau lớp phủ chỉ hiện sau khi trẻ lật ra — vẽ đám mây mềm có dấu ? để bé biết vị trí có thể chạm vào lật mở!
      if (obj.isHidden && state?.isRevealed !== true) {
        const radius = Math.min(slot.w ?? 64, slot.h ?? 64) / 2;
        rs.drawClayBody(
          ctx,
          slot.x,
          slot.y,
          radius,
          designTokens.colors.scene.mist,
          designTokens.colors.competency.c4,
          "circle"
        );
        drawLabelText(ctx, "?", slot.x, slot.y, 24);
        return;
      }
      drawSceneObjectAt(
        ctx,
        rs,
        scene,
        {
          id: obj.id,
          asset: assetById.get(obj.id),
          // Có stage thì slot của layout đã nằm trong stage (`BR-PSZ-01`);
          // toạ độ content thuộc không gian scene cũ nên bỏ.
          ...(this.stageRect ? {} : { x: obj.x, y: obj.y }),
        },
        slot,
        { found: state?.isFound === true }
      );

      if (obj.id === this.wrongItemId) {
        this.drawWrongHighlight(ctx, rs, obj, i, timeMs);
      }
    });
  }

  private drawWrongHighlight(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    obj: { x: number; y: number },
    index: number,
    timeMs: number
  ): void {
    const elapsed = this.wrongFlash.elapsedMs(timeMs);
    if (elapsed >= WRONG_FLASH_MS) {
      return;
    }
    // Có stage thì neo vào slot của layout, không phải toạ độ content.
    const anchor = this.stageRect ? this.slots[index] : undefined;
    rs.drawRetryRing(
      ctx,
      anchor?.x ?? obj.x,
      anchor?.y ?? obj.y,
      36,
      elapsed / WRONG_FLASH_MS
    );
  }
}
