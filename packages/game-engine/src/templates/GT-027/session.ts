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
import {
  drawProgressBadge,
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
import { type RuleDefinition, RuleSystem } from "#src/systems/rule-system";
import type { GT027Content, GT027Difficulty } from "./template.js";

interface CardItem {
  id: string;
  color: string;
  shape: string;
  size?: string;
}

interface ItemActionPayload {
  item_id?: string;
  id?: string;
}

function getItemId(data: object | null | undefined): string | undefined {
  if (data && typeof data === "object") {
    const payload = data as ItemActionPayload;
    if (typeof payload.item_id === "string") {
      return payload.item_id;
    }
    if (typeof payload.id === "string") {
      return payload.id;
    }
  }
  return undefined;
}

export class GT027Session extends TemplateGameSession<
  GT027Content,
  GT027Difficulty
> {
  degradation: DegradationState | null = null;
  private renderParticles: Particle[] = [];
  private readonly renderItemStates: Map<string, ItemVisualState> = new Map();

  private ruleSystem!: RuleSystem<CardItem>;
  private successfulTrialCount = 0;
  private targetSuccessTotal = 0;

  setupEntities(): void {
    this.isWon = false;
    this.successfulTrialCount = 0;

    const rules: RuleDefinition<CardItem>[] = this.content.rules.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      signalText: r.signal_text,
      signalAudioPrompt: r.signal_audio_text,
      validator: (item: CardItem) => {
        if (r.dimension === "color") {
          return item.color === r.target_value;
        }
        if (r.dimension === "shape") {
          return item.shape === r.target_value;
        }
        if (r.dimension === "size") {
          return item.size === r.target_value;
        }
        return false;
      },
    }));

    this.ruleSystem = new RuleSystem<CardItem>({
      rules,
      switchAfterTrials: this.content.switch_after_trials,
      signalDurationMs: this.difficulty.signal_duration_ms,
    });

    // Total target successes needed = number of rules * switch_after_trials
    this.targetSuccessTotal =
      this.content.rules.length * this.content.switch_after_trials;

    this.recordEvent("round_started", {
      round_index: 0,
      initial_rule: rules[0]?.id,
    });
  }

  getActiveRule() {
    return this.ruleSystem?.getActiveRule() ?? null;
  }

  isSignaling() {
    return this.ruleSystem?.isSignaling() ?? false;
  }

  getSignalInfo() {
    return this.ruleSystem?.getSignalInfo() ?? null;
  }

  validateAction(action: GameAction): ActionResult {
    switch (action.type) {
      case "select_item":
      case "tap_card": {
        const itemId = getItemId(action.data as object | null | undefined);

        if (typeof itemId !== "string") {
          return ACTION_IGNORED;
        }

        const item = this.content.items.find((i) => i.id === itemId);
        if (!(item && this.ruleSystem)) {
          return ACTION_IGNORED;
        }

        if (this.ruleSystem.isSignaling()) {
          return ACTION_IGNORED;
        }

        const rule = this.ruleSystem.getActiveRule();
        const isValid = rule.validator(item);
        return isValid ? ACTION_CORRECT : ACTION_RETRY;
      }
      default:
        return ACTION_IGNORED;
    }
  }

  onSelectItem(itemId: string): ActionResult {
    const item = this.content.items.find((i) => i.id === itemId);
    if (!(item && this.ruleSystem)) {
      return ACTION_IGNORED;
    }

    if (this.ruleSystem.isSignaling()) {
      return ACTION_IGNORED;
    }

    const evalResult = this.ruleSystem.evaluate(item);

    if (!evalResult.valid) {
      this.setRenderItemState(itemId, "wrong");
      this.recordEvent("item_selected", {
        item_id: itemId,
        is_correct: false,
        rule_id: this.ruleSystem.getActiveRule().id,
      });
      return ACTION_RETRY;
    }

    this.setRenderItemState(itemId, "correct");
    this.successfulTrialCount++;
    this.recordEvent("item_selected", {
      item_id: itemId,
      is_correct: true,
      rule_id: this.ruleSystem.getActiveRule().id,
      trial_count: this.successfulTrialCount,
      target_total: this.targetSuccessTotal,
    });

    if (evalResult.triggeredSwitch) {
      // Báo hiệu đổi luật bằng âm thanh và hình ảnh (BR-TGB-07)
      const newRule = this.ruleSystem.getActiveRule();
      this.recordEvent("item_selected", {
        item_id: itemId,
        new_rule_id: newRule.id,
        signal_text: newRule.signalText,
        is_rule_switch: true,
      });
    }

    if (this.successfulTrialCount >= this.targetSuccessTotal) {
      this.isWon = true;
      this.recordEvent("round_completed", { round_index: 0 });
      this.winSession();
    }

    return ACTION_CORRECT;
  }

  override toAction(gesture: Gesture): GameAction | null {
    if (gesture.type !== "tap") {
      return null;
    }

    const hitTolerance = 24;
    for (let i = 0; i < this.slots.length; i++) {
      const slot = this.slots[i];
      const item = this.content.items[i];
      if (!(slot && item)) {
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
          data: { item_id: item.id },
        };
      }
    }

    return null;
  }

  override commit(action: GameAction): void {
    if (action.type === "select_item" || action.type === "tap_card") {
      const itemId = getItemId(action.data as object | null | undefined);
      if (typeof itemId === "string") {
        this.onSelectItem(itemId);
      }
    }
  }

  override getView(): EngineView {
    const entities: ViewEntity[] = [];
    for (let i = 0; i < this.content.items.length; i++) {
      const item = this.content.items[i];
      const slot = this.slots[i];
      if (!(item && slot)) {
        continue;
      }
      const renderState = this.getRenderItemState(item.id);
      let state: EntityVisual = "idle";
      if (renderState === "correct") {
        state = "correct";
      } else if (renderState === "wrong") {
        state = "incorrect";
      } else if (renderState === "selected") {
        state = "selected";
      }

      entities.push({
        id: item.id,
        slotIndex: slot.index,
        role: "source",
        state,
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
      });
    }

    return {
      activePrompt: this.content.prompt,
      entities,
    };
  }

  // biome-ignore lint/suspicious/noConfusingVoidType: void needed for compatibility with update
  update(deltaMs: number): ActionResult | void | null {
    if (!this.ruleSystem) {
      return null;
    }
    this.ruleSystem.tick(deltaMs);
    return null;
  }

  override checkWinCondition(): boolean {
    return (
      this.targetSuccessTotal > 0 &&
      this.successfulTrialCount >= this.targetSuccessTotal
    );
  }

  override destroy(): void {
    this.renderItemStates.clear();
  }

  protected computeSlots(ageBand: "3-4" | "4-5" | "5-6"): readonly Slot[] {
    const layoutFn = resolveLayout("grid");
    return layoutFn({
      slotCount: this.content.items.length,
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
    drawProgressBadge(
      ctx,
      rs,
      this.successfulTrialCount,
      this.targetSuccessTotal
    );
    const rule = this.ruleSystem.getActiveRule();
    const signal = this.ruleSystem.getSignalInfo();
    // Luật đang hiệu lực phải hiện thường trực: trẻ đổi luật giữa chừng, không
    // ai được yêu cầu nhớ luật cũ.
    drawSubPromptText(ctx, rs, signal?.text ?? rule.description);
    drawWoodenTokenDock(ctx, rs);

    this.content.items.forEach((item, i) => {
      const slot = this.slots[i];
      if (!slot) {
        return;
      }
      drawSlotItem(ctx, rs, slot, {
        id: item.id,
        asset: item.asset,
        state: this.getRenderItemState(item.id),
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
