import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "#src/game-session";
import { resolveLayout } from "#src/layout/registry";
import type { Slot } from "#src/layout/types";
import type { DegradationState } from "#src/systems/degradation";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import {
  drawDividerLine,
  drawPromptText,
  drawSceneBackground,
  type ItemVisualState,
  sceneBox,
  updateParticles,
} from "../shared-render.js";
import { drawSceneObjectAt } from "../shared-render-shapes.js";
import type { GT025Content, GT025Difficulty } from "./template.js";

export class GT025Session extends TemplateGameSession<
  GT025Content,
  GT025Difficulty
> {
  slots: readonly Slot[] = [];
  degradation: DegradationState | null = null;
  private renderParticles: Particle[] = [];
  private readonly renderItemStates: Map<string, ItemVisualState> = new Map();

  private readonly foundDifferenceIds = new Set<string>();

  setupEntities(): void {
    this.isWon = false;
    this.foundDifferenceIds.clear();

    this.recordEvent("round_started", {
      round_index: 0,
      total_differences: this.content.differences.length,
    });
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

  getFoundCount(): number {
    return this.foundDifferenceIds.size;
  }

  override destroy(): void {
    this.foundDifferenceIds.clear();
  }

  resolveSlots(ageBand: "3-4" | "4-5" | "5-6"): void {
    const layoutFn = resolveLayout("split-columns");
    this.slots = layoutFn({
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
    drawSceneBackground(ctx, rs);
    drawPromptText(ctx, rs, this.content.prompt);
    const scene = sceneBox(rs);
    const half = { x: scene.x, y: scene.y, w: scene.w / 2, h: scene.h };
    const rightHalf = {
      x: scene.w / 2,
      y: scene.y,
      w: scene.w / 2,
      h: scene.h,
    };
    const sources = this.slots.filter((s) => s.role === "source");
    const targets = this.slots.filter((s) => s.role === "target");

    drawDividerLine(ctx, scene.w / 2, scene.y, scene.w / 2, scene.y + scene.h);

    const foundLeft = new Set(
      this.content.differences
        .filter((d) => this.foundDifferenceIds.has(d.id))
        .map((d) => d.left_id)
    );
    const foundRight = new Set(
      this.content.differences
        .filter((d) => this.foundDifferenceIds.has(d.id))
        .map((d) => d.right_id)
    );

    this.content.left_objects.forEach((obj, i) => {
      drawSceneObjectAt(ctx, rs, half, obj, sources[i], {
        found: foundLeft.has(obj.id),
      });
    });
    this.content.right_objects.forEach((obj, i) => {
      drawSceneObjectAt(ctx, rs, rightHalf, obj, targets[i], {
        found: foundRight.has(obj.id),
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
