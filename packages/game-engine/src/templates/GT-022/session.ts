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
import { SelectionMechanic } from "#src/mechanics/selection-mechanic";
import {
  drawPromptText,
  drawSceneBackground,
  drawSceneObjectAt,
  type ItemVisualState,
  sceneBox,
  updateParticles,
} from "#src/render/index.js";
import { deriveStream } from "#src/rng/mulberry32";
import type { DegradationState } from "#src/systems/degradation";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import {
  type FindResult,
  type SceneObject,
  SceneSystem,
} from "#src/systems/scene-system";
import type { GT022Content, GT022Difficulty } from "./template.js";

function findHitSceneObject(
  objects: readonly SceneObject[],
  x: number,
  y: number,
  tolerance = 24
): SceneObject | null {
  for (let i = objects.length - 1; i >= 0; i--) {
    const obj = objects[i];
    if (!obj) {
      continue;
    }
    const hw = obj.width / 2 + tolerance;
    const hh = obj.height / 2 + tolerance;
    if (Math.abs(x - obj.x) <= hw && Math.abs(y - obj.y) <= hh) {
      return obj;
    }
  }
  return null;
}

export class GT022Session extends TemplateGameSession<
  GT022Content,
  GT022Difficulty
> {
  degradation: DegradationState | null = null;
  private renderParticles: Particle[] = [];
  private readonly renderItemStates: Map<string, ItemVisualState> = new Map();

  readonly sceneSystem = new SceneSystem();
  private readonly selectionMechanic = new SelectionMechanic();
  resolvedObjects: SceneObject[] = [];

  setupEntities(): void {
    this.isWon = false;
    this.selectionMechanic.reset();

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

  private validateTapObject(data: unknown): ActionResult {
    const itemId =
      typeof data === "object" && data !== null
        ? Reflect.get(data, "item_id")
        : undefined;
    if (typeof itemId !== "string" || itemId.length === 0) {
      return ACTION_IGNORED;
    }
    const obj = this.resolvedObjects.find((o) => o.id === itemId);
    if (!obj) {
      return ACTION_IGNORED;
    }
    return obj.isTarget ? ACTION_CORRECT : ACTION_RETRY;
  }

  private validateRevealObject(data: unknown): ActionResult {
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

  override toAction(gesture: Gesture): GameAction | null {
    if (gesture.type === "tap") {
      const hitObj = findHitSceneObject(
        this.resolvedObjects,
        gesture.x,
        gesture.y
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

  override getView(): EngineView {
    const entities: ViewEntity[] = this.resolvedObjects.map((obj, i) => {
      const state = this.sceneSystem.getObjectState(obj.id);
      let visual: EntityVisual = "idle";
      if (state?.isFound) {
        visual = "correct";
      }
      return {
        id: obj.id,
        slotIndex: i,
        role: "source",
        state: visual,
        x: obj.x,
        y: obj.y,
        w: obj.width,
        h: obj.height,
      };
    });
    return {
      activePrompt: this.content.prompt,
      entities,
    };
  }

  protected computeSlots(ageBand: "3-4" | "4-5" | "5-6"): readonly Slot[] {
    const layoutFn = resolveLayout("free-scene");
    return layoutFn({
      slotCount: this.content.scene_objects.length,
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
    // free-scene: toạ độ tới từ content (đã ở không gian logic), ô nào thiếu
    // toạ độ thì rơi về slot của layout.
    const scene = sceneBox(rs);
    const assetById = new Map(
      this.content.scene_objects.map((o) => [o.id, o.asset])
    );
    this.resolvedObjects.forEach((obj, i) => {
      const state = this.sceneSystem.getObjectState(obj.id);
      // Vật ẩn sau lớp phủ chỉ hiện sau khi trẻ lật ra — ❌ NEVER vẽ sẵn.
      if (obj.isHidden && state?.isRevealed !== true) {
        return;
      }
      drawSceneObjectAt(
        ctx,
        rs,
        scene,
        { id: obj.id, asset: assetById.get(obj.id), x: obj.x, y: obj.y },
        this.slots[i],
        { found: state?.isFound === true }
      );
    });
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

export default GT022Session;
