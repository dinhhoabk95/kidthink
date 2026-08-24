import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "#src/game-session";
import { SelectionMechanic } from "#src/mechanics/selection-mechanic";
import { deriveStream } from "#src/rng/mulberry32";
import {
  type FindResult,
  type SceneObject,
  SceneSystem,
} from "#src/systems/scene-system";
import type { GT022Content, GT022Difficulty } from "./template.js";

export class GT022Session extends TemplateGameSession<
  GT022Content,
  GT022Difficulty
> {
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
}

export default GT022Session;
