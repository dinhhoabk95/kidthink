import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "#src/game-session";
import { type RuleDefinition, RuleSystem } from "#src/systems/rule-system";
import type { GT027Content, GT027Difficulty } from "./template.js";

interface CardItem {
  id: string;
  color: string;
  shape: string;
  size?: string;
}

export class GT027Session extends TemplateGameSession<
  GT027Content,
  GT027Difficulty
> {
  private ruleSystem!: RuleSystem<CardItem>;
  private readonly selectedItemIds = new Set<string>();
  private targetSuccessTotal = 0;

  setupEntities(): void {
    this.isWon = false;
    this.selectedItemIds.clear();

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
        const itemId =
          typeof action.data === "object" && action.data !== null
            ? (Reflect.get(action.data, "item_id") ??
              Reflect.get(action.data, "id"))
            : undefined;

        if (typeof itemId !== "string") {
          return ACTION_IGNORED;
        }

        const item = this.content.items.find((i) => i.id === itemId);
        if (!item) {
          return ACTION_IGNORED;
        }

        const evalResult = this.ruleSystem.evaluate(item);

        if (!evalResult.valid) {
          this.recordEvent("item_selected", {
            item_id: itemId,
            is_correct: false,
            rule_id: this.ruleSystem.getActiveRule().id,
          });
          return ACTION_RETRY;
        }

        this.selectedItemIds.add(itemId);
        this.recordEvent("item_selected", {
          item_id: itemId,
          is_correct: true,
          rule_id: this.ruleSystem.getActiveRule().id,
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

        if (this.selectedItemIds.size >= this.targetSuccessTotal) {
          this.isWon = true;
          this.recordEvent("round_completed", { round_index: 0 });
          this.completeSession();
        }

        return ACTION_CORRECT;
      }
      default:
        return ACTION_IGNORED;
    }
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
    return this.isWon;
  }

  override destroy(): void {
    this.selectedItemIds.clear();
  }
}
