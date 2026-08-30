import {
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "#src/game-session";
import { resolveLayout } from "#src/layout/registry";
import type { Slot } from "#src/layout/types";
import { SelectionMechanic } from "#src/mechanics/selection-mechanic";
import { deriveStream } from "#src/rng/mulberry32";
import { shuffle } from "#src/rng/shuffle";
import type { DegradationState } from "#src/systems/degradation";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import {
  drawCheckMark,
  drawEmojiContent,
  drawPlaceholderBox,
  drawPromptText,
  drawSceneBackground,
  getColorsForState,
  type ItemVisualState,
  spawnParticlesAtSlot,
  updateParticles,
} from "../shared-render.js";
import type { GT001Content, GT001Difficulty } from "./template.js";

type OptionItem = GT001Content["options"][number];

export class GT001Session extends TemplateGameSession<
  GT001Content,
  GT001Difficulty
> {
  selectedItemId: string | null = null;
  displayOptions: readonly OptionItem[] = [];
  private readonly mechanic = new SelectionMechanic({ mode: "single" });
  slots: readonly Slot[] = [];
  degradation: DegradationState | null = null;
  private particles: Particle[] = [];
  private itemStates: Map<string, ItemVisualState> = new Map();
  private wrongItemId: string | null = null;
  private wrongTimestamp = 0;
  /**
   * Mốc thời gian của khung vẽ gần nhất.
   *
   * `render()` nhận `performance.now()` (`core.ts:16`), còn `onItemLocked` chạy
   * ngoài vòng vẽ. Ghi mốc bằng `Date.now()` như bản trước làm `elapsed` âm
   * khoảng 1,79e12 — luôn `< 400`, nên hiệu ứng rung sai đáp án chạy MÃI sau
   * lần chạm sai đầu tiên. Hai mốc phải cùng một đồng hồ.
   */
  private lastFrameMs = 0;

  setupEntities(): void {
    this.selectedItemId = null;
    this.mechanic.reset();
    this.isWon = false;
    this.particles = [];
    this.itemStates = new Map();
    this.wrongItemId = null;
    this.wrongTimestamp = 0;
    if (this.difficulty.shuffle_items === false) {
      this.displayOptions = [...this.content.options];
    } else {
      const rng = deriveStream(this.layoutSeed, "items");
      this.displayOptions = shuffle(this.content.options, rng);
    }
  }

  resolveSlots(ageBand: "3-4" | "4-5" | "5-6"): void {
    const layoutFn = resolveLayout("grid");
    this.slots = layoutFn({
      slotCount: this.displayOptions.length,
      ageBand,
    });
  }

  private getItemState(itemId: string): ItemVisualState {
    return this.itemStates.get(itemId) ?? "idle";
  }

  setItemState(itemId: string, state: ItemVisualState): void {
    this.itemStates.set(itemId, state);
  }

  private findOption(itemId: string) {
    return this.content.options.find((opt) => opt.item_id === itemId);
  }

  validateAction(action: GameAction): ActionResult {
    const items = this.content.options.map((opt) => ({
      id: opt.item_id,
      isCorrect: opt.is_correct,
    }));
    return this.mechanic.validate(action, items);
  }

  onItemLocked(itemId: string): void {
    this.selectedItemId = itemId;
    this.mechanic.select(itemId);
    const isCorrect = this.findOption(itemId)?.is_correct === true;
    this.recordEvent("item_selected", {
      item_id: itemId,
      is_correct: isCorrect,
    });
    if (isCorrect) {
      this.setItemState(itemId, "correct");
      const idx = this.displayOptions.findIndex((o) => o.item_id === itemId);
      const slot = this.slots[idx];
      if (slot) {
        this.particles.push(...spawnParticlesAtSlot(slot, 8));
      }
      this.winSession();
    } else {
      this.setItemState(itemId, "wrong");
      this.wrongItemId = itemId;
      this.wrongTimestamp = this.lastFrameMs;
    }
  }

  override checkWinCondition(): boolean {
    const items = this.content.options.map((opt) => ({
      id: opt.item_id,
      isCorrect: opt.is_correct,
    }));
    return this.mechanic.isSelectionComplete(items);
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    this.lastFrameMs = timeMs;
    const slots = this.slots;
    drawSceneBackground(ctx, rs);
    drawPromptText(ctx, rs, this.content.prompt);
    this.drawInteractive(rs, ctx, slots);
    this.drawFeedback(rs, ctx, slots, timeMs);
  }

  private drawInteractive(
    rs: RenderSystem,
    ctx: CanvasRenderingContext2D,
    slots: readonly Slot[]
  ): void {
    for (let i = 0; i < this.displayOptions.length; i++) {
      const opt = this.displayOptions[i];
      const slot = slots[i];
      if (!(slot && opt)) {
        continue;
      }
      const state = this.getItemState(opt.item_id);
      const { fill, border } = getColorsForState(state);
      const r = Math.min(slot.hitW, slot.hitH) / 2;
      rs.drawClayBody(ctx, slot.x, slot.y, r, fill, border);

      if (opt.asset.kind === "emoji") {
        drawEmojiContent(ctx, opt.asset.ref, slot);
      } else {
        drawPlaceholderBox(ctx, slot);
      }

      if (state === "selected" || state === "correct") {
        drawCheckMark(ctx, slot);
      }
    }
  }

  private drawFeedback(
    rs: RenderSystem,
    ctx: CanvasRenderingContext2D,
    slots: readonly Slot[],
    timeMs: number
  ): void {
    if (this.degradation?.particles_enabled === false) {
      return;
    }

    this.particles = updateParticles(this.particles);
    rs.drawParticles(ctx, this.particles);

    if (this.wrongItemId) {
      const elapsed = timeMs - this.wrongTimestamp;
      if (elapsed < 400) {
        const idx = this.displayOptions.findIndex(
          (o) => o.item_id === this.wrongItemId
        );
        const slot = slots[idx];
        if (slot) {
          const shakeX = Math.sin(elapsed * 0.05) * 4;
          rs.drawScaffoldingHighlight(
            ctx,
            slot.x + shakeX,
            slot.y,
            Math.min(slot.hitW, slot.hitH) / 2 + 4,
            (elapsed % 1000) / 1000
          );
        }
      }
    }
  }
}

export default GT001Session;
