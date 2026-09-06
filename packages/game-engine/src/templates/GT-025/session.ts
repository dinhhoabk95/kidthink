import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "#src/game-session";
import type { EngineView, Gesture, ViewEntity } from "#src/interaction";
import { resolveLayout } from "#src/layout/registry";
import type { Slot } from "#src/layout/types";
import {
  drawDividerLine,
  drawPromptText,
  drawSceneBackground,
  drawSceneObjectAt,
  type ItemVisualState,
  sceneBox,
  updateParticles,
} from "#src/render/index.js";
import type { DegradationState } from "#src/systems/degradation";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import type { GT025Content, GT025Difficulty } from "./template.js";

interface ResolvedDifferenceObject {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly role: "source" | "target";
  readonly slotIndex: number;
}

function findHitDifferenceObject(
  objects: readonly ResolvedDifferenceObject[],
  x: number,
  y: number,
  tolerance = 24
): ResolvedDifferenceObject | null {
  for (let i = objects.length - 1; i >= 0; i--) {
    const obj = objects[i];
    if (!obj) {
      continue;
    }
    const hw = obj.w / 2 + tolerance;
    const hh = obj.h / 2 + tolerance;
    if (Math.abs(x - obj.x) <= hw && Math.abs(y - obj.y) <= hh) {
      return obj;
    }
  }
  return null;
}

export class GT025Session extends TemplateGameSession<
  GT025Content,
  GT025Difficulty
> {
  degradation: DegradationState | null = null;
  private renderParticles: Particle[] = [];
  private readonly renderItemStates: Map<string, ItemVisualState> = new Map();

  private readonly foundDifferenceIds = new Set<string>();
  private readonly foundLeftIds = new Set<string>();
  private readonly foundRightIds = new Set<string>();
  resolvedObjects: ResolvedDifferenceObject[] = [];

  setupEntities(): void {
    this.isWon = false;
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
      const x = obj.x ?? slot?.x ?? 200;
      const y = obj.y ?? slot?.y ?? 250;
      resolved.push({
        id: obj.id,
        x,
        y,
        w: 64,
        h: 64,
        role: "source",
        slotIndex: slot?.index ?? i,
      });
    });

    this.content.right_objects.forEach((obj, i) => {
      const slot = targets[i];
      const x = obj.x === undefined ? (slot?.x ?? 680) : obj.x + 480;
      const y = obj.y ?? slot?.y ?? 250;
      resolved.push({
        id: obj.id,
        x,
        y,
        w: 64,
        h: 64,
        role: "target",
        slotIndex: slot?.index ?? this.content.left_objects.length + i,
      });
    });

    this.resolvedObjects = resolved;
  }

  private validateTapObject(data: unknown): ActionResult {
    const objectId =
      typeof data === "object" && data !== null
        ? (Reflect.get(data, "object_id") ?? Reflect.get(data, "item_id"))
        : undefined;

    if (typeof objectId !== "string") {
      return ACTION_IGNORED;
    }

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

  onTapObject(objectId: string): ActionResult {
    const diff = this.content.differences.find(
      (d) => d.left_id === objectId || d.right_id === objectId
    );

    if (!diff) {
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
      case "select_item":
        return this.validateTapObject(action.data);
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
      const data = action.data;
      const objectId =
        typeof data === "object" && data !== null
          ? (Reflect.get(data, "object_id") ?? Reflect.get(data, "item_id"))
          : undefined;
      if (typeof objectId === "string") {
        this.onTapObject(objectId);
      }
    }
  }

  override getView(): EngineView {
    const entities: ViewEntity[] = this.resolvedObjects.map((obj) => {
      const isFound =
        obj.role === "source"
          ? this.foundLeftIds.has(obj.id)
          : this.foundRightIds.has(obj.id);
      return {
        id: obj.id,
        slotIndex: obj.slotIndex,
        role: obj.role,
        state: isFound ? "correct" : "idle",
        x: obj.x,
        y: obj.y,
        w: obj.w,
        h: obj.h,
      };
    });
    return {
      activePrompt: this.content.prompt,
      entities,
    };
  }

  getFoundCount(): number {
    return this.foundDifferenceIds.size;
  }

  override destroy(): void {
    this.foundDifferenceIds.clear();
    this.foundLeftIds.clear();
    this.foundRightIds.clear();
  }

  protected computeSlots(ageBand: "3-4" | "4-5" | "5-6"): readonly Slot[] {
    const layoutFn = resolveLayout("split-columns");
    return layoutFn({
      slotCount: this.content.left_objects.length,
      targetCount: this.content.right_objects.length,
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
    drawSceneBackground(ctx, rs, this.themeId);
    drawPromptText(ctx, rs, this.content.prompt);
    const scene = sceneBox(rs);
    const half = { x: scene.x, y: scene.y, w: scene.w / 2, h: scene.h };
    const rightHalf = {
      x: scene.w / 2,
      y: scene.y,
      w: scene.w / 2,
      h: scene.h,
    };
    const sources = this.sourceSlots;
    const targets = this.targetSlots;

    drawDividerLine(ctx, scene.w / 2, scene.y, scene.w / 2, scene.y + scene.h);

    this.content.left_objects.forEach((obj, i) => {
      drawSceneObjectAt(ctx, rs, half, obj, sources[i], {
        found: this.foundLeftIds.has(obj.id),
      });
    });
    this.content.right_objects.forEach((obj, i) => {
      drawSceneObjectAt(ctx, rs, rightHalf, obj, targets[i], {
        found: this.foundRightIds.has(obj.id),
      });
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
