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
  drawClocheScene,
  drawPromptText,
  drawSceneBackground,
  drawSlotItem,
  drawSubPromptText,
  drawWoodenTokenDock,
  type ItemVisualState,
  updateParticles,
} from "#src/render/index.js";
import type { DegradationState } from "#src/systems/degradation";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import { FlashTimer } from "#src/systems/timer-system";
import type { GT012Content, GT012Difficulty } from "./template.js";

export class FlashRecallSession extends TemplateGameSession<
  GT012Content,
  GT012Difficulty
> {
  degradation: DegradationState | null = null;
  private renderParticles: Particle[] = [];
  private readonly renderItemStates: Map<string, ItemVisualState> = new Map();

  private readonly timer: FlashTimer;
  private selectedValue: number | null = null;
  private wasVisible = false;

  constructor(
    content: GT012Content,
    difficulty: GT012Difficulty,
    layoutSeed = 0
  ) {
    super(content, difficulty, layoutSeed);
    this.timer = new FlashTimer({
      flashMs: difficulty.flash_ms,
      allowReplay: difficulty.allow_replay,
    });
  }

  setupEntities(): void {
    this.selectedValue = null;
    this.timer.reset();
    this.timer.start();
    this.wasVisible = true;
    this.isWon = false;

    this.recordEvent("game_started", {
      template_code: "GT-012",
      item_count: this.content.flash_items.length,
      flash_ms: this.timer.getDurationMs(),
    });

    this.recordEvent("flash_shown", {
      duration_ms: this.timer.getDurationMs(),
    });
  }

  getFlashItems(): GT012Content["flash_items"] {
    return this.content.flash_items;
  }

  getArrangement(): GT012Content["arrangement"] {
    return this.content.arrangement;
  }

  getOptions(): GT012Content["options"] {
    return this.content.options;
  }

  isFlashVisible(): boolean {
    return this.timer.isVisible();
  }

  canReplay(): boolean {
    return this.timer.canReplay();
  }

  replayFlash(): boolean {
    const ok = this.timer.replay();
    if (ok) {
      this.wasVisible = true;
      this.recordEvent("flash_replayed", {});
      this.recordEvent("flash_shown", {
        duration_ms: this.timer.getDurationMs(),
      });
    }
    return ok;
  }

  update(deltaMs: number): void {
    const prevState = this.timer.getState();
    this.timer.tick(deltaMs);
    const currState = this.timer.getState();

    if (prevState === "running" && currState === "expired" && this.wasVisible) {
      this.wasVisible = false;
      this.recordEvent("flash_hidden", {
        elapsed_ms: this.timer.getElapsedMs(),
      });
    }
  }

  selectValue(value: number): boolean {
    this.selectedValue = value;
    const isCorrect = value === this.content.flash_items.length;

    this.recordEvent("value_selected", {
      value,
      is_correct: isCorrect,
    });

    if (this.checkWinCondition()) {
      this.winSession();
    }

    return isCorrect;
  }

  getSelectedValue(): number | null {
    return this.selectedValue;
  }

  validateAction(action: GameAction): ActionResult {
    if (action.type === "replay_flash") {
      return ACTION_IGNORED;
    }
    if (action.type === "select_value") {
      if (typeof action.data !== "number") {
        return ACTION_RETRY;
      }
      const val = action.data;
      return val === this.content.flash_items.length
        ? ACTION_CORRECT
        : ACTION_RETRY;
    }
    return ACTION_IGNORED;
  }

  override toAction(gesture: Gesture): GameAction | null {
    if (gesture.type !== "tap") {
      return null;
    }
    if (this.timer.isVisible()) {
      return null;
    }
    for (let i = 0; i < this.content.options.length; i++) {
      const slot = this.slots[i];
      const opt = this.content.options[i];
      if (!(slot && opt)) {
        continue;
      }
      const dx = Math.abs(gesture.x - slot.x);
      const dy = Math.abs(gesture.y - slot.y);
      const radius = Math.max(slot.hitW ?? slot.w, slot.hitH ?? slot.h) / 2;
      if (dx <= radius && dy <= radius) {
        return {
          type: "select_value",
          data: opt.value,
        };
      }
    }
    return null;
  }

  override commit(action: GameAction): void {
    if (action.type === "select_value" && typeof action.data === "number") {
      this.selectValue(action.data);
    } else if (action.type === "replay_flash") {
      this.replayFlash();
    }
  }

  override getView(): EngineView {
    if (this.timer.isVisible()) {
      const entities: ViewEntity[] = [];
      this.content.flash_items.forEach((item, i) => {
        const slot = this.slots[i];
        if (!slot) {
          return;
        }
        entities.push({
          id: item.item_id,
          slotIndex: i,
          role: "neutral",
          state: "idle",
          x: slot.x,
          y: slot.y,
          w: slot.w,
          h: slot.h,
        });
      });
      return {
        activePrompt: "Nhìn nhanh!",
        entities,
      };
    }

    const entities: ViewEntity[] = [];
    this.content.options.forEach((opt, i) => {
      const slot = this.slots[i];
      if (!slot) {
        return;
      }
      let state: ViewEntity["state"] = "idle";
      if (this.selectedValue === opt.value) {
        state = opt.is_correct ? "correct" : "incorrect";
      }
      entities.push({
        id: `opt-${opt.value}`,
        slotIndex: i,
        role: "source",
        state,
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
      });
    });

    return {
      activePrompt: "Bé nhớ có bao nhiêu đồ vật?",
      entities,
    };
  }

  override checkWinCondition(): boolean {
    if (this.selectedValue === null) {
      return false;
    }
    return this.selectedValue === this.content.flash_items.length;
  }

  override destroy(): void {
    super.destroy();
    this.timer.reset();
    this.selectedValue = null;
    this.wasVisible = false;
  }

  protected computeSlots(ageBand: "3-4" | "4-5" | "5-6"): readonly Slot[] {
    const layoutFn = resolveLayout("grid");
    return layoutFn({
      slotCount: Math.max(
        this.content.flash_items.length,
        this.content.options.length
      ),
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

    const plateSlot: Slot = {
      index: 0,
      x: rs.LOGIC_WIDTH / 2,
      y: rs.LOGIC_HEIGHT * 0.38,
      w: 220,
      h: 220,
      hitW: 220,
      hitH: 220,
      page: 0,
      role: "target",
    };

    // Hai pha: đang loé thì mở nắp cloche thấy vật; hết loé thì đậy nắp cloche và hiện thẻ chọn.
    if (this.timer.isVisible()) {
      drawSubPromptText(ctx, rs, "Nhìn nhanh!");
      drawClocheScene(ctx, plateSlot, true);
      this.content.flash_items.forEach((item, i) => {
        const slot = this.slots[i];
        if (!slot) {
          return;
        }
        drawSlotItem(ctx, rs, slot, { id: item.item_id, asset: item.asset });
      });
      this.drawRenderFeedback(rs, ctx);
      return;
    }

    drawSubPromptText(ctx, rs, "Bé nhớ có bao nhiêu đồ vật?");
    drawClocheScene(ctx, plateSlot, false);
    drawWoodenTokenDock(ctx, rs);

    this.content.options.forEach((opt, i) => {
      const slot = this.slots[i];
      if (!slot) {
        return;
      }
      let state: "correct" | "wrong" | "idle" = "idle";
      if (this.selectedValue === opt.value) {
        state = opt.is_correct ? "correct" : "wrong";
      }
      drawSlotItem(ctx, rs, slot, {
        id: `opt-${opt.value}`,
        text: String(opt.value),
        state,
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

export const GT012Session = FlashRecallSession;
export default FlashRecallSession;
