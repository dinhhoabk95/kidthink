import {
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "#src/game-session";
import type { EngineView, Gesture, ViewEntity } from "#src/interaction";
import {
  getTouchFloor,
  LOGIC_HEIGHT,
  LOGIC_WIDTH,
} from "#src/layout/constants";
import { resolveLayout } from "#src/layout/registry";
import type { Slot } from "#src/layout/types";
import { SelectionMechanic } from "#src/mechanics/selection-mechanic";
import {
  drawCentralTargetCard,
  drawPromptText,
  drawSceneBackground,
  drawSlotItem,
  drawWoodenTokenDock,
  type ItemVisualState,
  spawnParticlesAtSlot,
  updateParticles,
} from "#src/render/index.js";
import { deriveStream } from "#src/rng/mulberry32";
import { shuffle } from "#src/rng/shuffle";
import type { DegradationState } from "#src/systems/degradation";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import type { GT001Content, GT001Difficulty } from "./template.js";

type OptionItem = GT001Content["options"][number];

export class GT001Session extends TemplateGameSession<
  GT001Content,
  GT001Difficulty
> {
  selectedItemId: string | null = null;
  displayOptions: readonly OptionItem[] = [];
  private readonly mechanic = new SelectionMechanic({ mode: "single" });
  degradation: DegradationState | null = null;
  private particles: Particle[] = [];
  private itemStates: Map<string, ItemVisualState> = new Map();
  private wrongItemId: string | null = null;
  private wrongTimestamp = 0;

  constructor(
    content: GT001Content,
    difficulty: GT001Difficulty,
    layoutSeed = 0,
    themeId?: string
  ) {
    super(content, difficulty, layoutSeed, themeId);
  }
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

  protected computeSlots(ageBand: "3-4" | "4-5" | "5-6"): readonly Slot[] {
    const count = this.displayOptions.length;
    if (this.content.target_item && count > 0) {
      const touchFloor = getTouchFloor(ageBand);
      const dockH = 130;
      const dockY = LOGIC_HEIGHT - dockH - 12;
      const centerY = dockY + dockH / 2;
      const gap = 24;
      const slotW = Math.max(
        touchFloor,
        Math.min(104, (LOGIC_WIDTH * 0.8 - (count - 1) * gap) / count)
      );
      const slotH = slotW;
      const totalW = count * slotW + (count - 1) * gap;
      const startX = (LOGIC_WIDTH - totalW) / 2;
      const slots: Slot[] = [];
      for (let i = 0; i < count; i++) {
        slots.push({
          index: i,
          x: Math.round(startX + i * (slotW + gap) + slotW / 2),
          y: Math.round(centerY),
          w: Math.round(slotW),
          h: Math.round(slotH),
          hitW: Math.max(touchFloor, Math.round(slotW)),
          hitH: Math.max(touchFloor, Math.round(slotH)),
          page: 0,
          role: "source",
        });
      }
      return slots;
    }

    const layoutFn = resolveLayout("grid");
    return layoutFn({
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
    if (this.selectedItemId === itemId) {
      return;
    }
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

  override getView(): EngineView {
    const entities: ViewEntity[] = [];
    const stateMap: Record<
      string,
      "idle" | "selected" | "correct" | "incorrect"
    > = {
      wrong: "incorrect",
      correct: "correct",
      selected: "selected",
    };

    for (let i = 0; i < this.displayOptions.length; i++) {
      const opt = this.displayOptions[i];
      const slot = this.slots[i];
      if (!(opt && slot)) {
        continue;
      }
      const rawState = this.getItemState(opt.item_id);
      const state = stateMap[rawState] ?? "idle";
      entities.push({
        id: opt.item_id,
        slotIndex: i,
        role: "source",
        state,
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
      });
    }
    return {
      entities,
      activePrompt: this.content.prompt,
    };
  }

  override toAction(gesture: Gesture): GameAction | null {
    if (gesture.type !== "tap") {
      return null;
    }

    const hitTolerance = 24;
    for (let i = 0; i < this.slots.length; i++) {
      const slot = this.slots[i];
      const opt = this.displayOptions[i];
      if (!(slot && opt)) {
        continue;
      }

      const halfW = Math.max(slot.hitW, slot.w) / 2 + hitTolerance;
      const halfH = Math.max(slot.hitH, slot.h) / 2 + hitTolerance;

      if (
        Math.abs(gesture.x - slot.x) <= halfW &&
        Math.abs(gesture.y - slot.y) <= halfH
      ) {
        return {
          type: "select_item",
          data: { item_id: opt.item_id },
        };
      }
    }

    return null;
  }

  override commit(action: GameAction): void {
    if (
      action.type === "select_item" &&
      action.data &&
      typeof action.data === "object" &&
      "item_id" in action.data
    ) {
      const itemId = String((action.data as { item_id: unknown }).item_id);
      this.onItemLocked(itemId);
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
    drawSceneBackground(ctx, rs, this.themeId);
    drawPromptText(ctx, rs, this.content.prompt);
    if (this.content.target_item) {
      drawCentralTargetCard(ctx, rs, this.content.target_item.asset);
    }
    drawWoodenTokenDock(ctx, rs);
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
      drawSlotItem(
        ctx,
        rs,
        slot,
        {
          id: opt.item_id,
          asset: opt.asset,
          state,
        },
        "circle"
      );
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
