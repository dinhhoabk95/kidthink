import type { AgeBand } from "#src/contracts/types";
import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  type HintDemoStep,
  type HintLevel,
  type HintTarget,
  TemplateGameSession,
} from "#src/game-session";
import type { EngineView, Gesture } from "#src/interaction";
import { findHitSlotIndex, TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import { dockRectAroundSlots, splitCaption } from "#src/layout/slot-fit";
import type { Slot } from "#src/layout/types";
import {
  drawGT027ItemCard,
  drawGT027RuleBanner,
} from "#src/render/gt-027-shapes";
import {
  drawSceneBackground,
  drawStoryCharacterInStage,
  drawWoodenTokenDock,
} from "#src/render/index.js";
import type { MascotPose } from "#src/render/mascot";
import type { DegradationState } from "#src/systems/degradation";
import { MoodPulse } from "#src/systems/mood-pulse";
import type { RenderSystem } from "#src/systems/render-system";
import { type RuleDefinition, RuleSystem } from "#src/systems/rule-system";
import {
  buildGT027RenderFrame,
  buildGT027View,
  clearGT027ItemStampsOnSwitch,
  clearGT027WrongFlashForItem,
  computeGT027Slots,
  extractGT027ItemId,
  type GT027Item,
  isGT027BannerWrongFlashing,
  matchesGT027RuleConfig,
  resetGT027Clock,
  resolveGT027DemoSequence,
  resolveGT027HintTarget,
  resolveGT027HintTargetIndex,
  resolveGT027UnselectedValidIndices,
  resolveRoundItems,
  tickGT027Clock,
  triggerGT027CorrectPulse,
  triggerGT027WrongFlash,
} from "./layout.js";
import type { GT027Content, GT027Difficulty } from "./template.js";

interface CardItem {
  readonly id: string;
  readonly color: string;
  readonly shape: string;
  readonly size?: string;
}

export const GT027_STORY_LINE =
  "Cáo Con làm trọng tài, cứ thổi còi là luật chơi đổi. Bé nghe còi, nghe kỹ luật mới rồi chọn đúng hình nhé!";
export const GT027_HAPPY_MS = 700;
export const GT027_WONDER_MS = 1500;

export class GT027Session extends TemplateGameSession<
  GT027Content,
  GT027Difficulty
> {
  degradation: DegradationState | null = null;
  override readonly usesPromptZone = true;

  private ruleSystem!: RuleSystem<CardItem>;
  private roundSetupCount = 0;
  private roundItems: readonly GT027Item[] = [];
  private successfulTrialCount = 0;
  private targetSuccessTotal = 0;
  private isClosedOnMiss = false;
  private activeHintLevel: 0 | HintLevel = 0;
  private hoveredSlotIndex: number | null = null;
  private readonly mood = new MoodPulse();

  override storyLine(): string {
    return GT027_STORY_LINE;
  }

  override mascotMood(): MascotPose | null {
    return this.isWon ? null : this.mood.current();
  }

  override isTrialBased(): boolean {
    return true;
  }

  override isAcceptingInput(): boolean {
    const blocked = this.isClosedOnMiss || this.isSignaling();
    return !blocked && super.isAcceptingInput();
  }

  getRoundItems(): readonly GT027Item[] {
    return this.roundItems.length > 0 ? this.roundItems : this.content.items;
  }

  isBannerWrongFlashing(): boolean {
    return isGT027BannerWrongFlashing(this);
  }

  private isInputOpen(): boolean {
    const done = this.checkWinCondition() || this.isClosedOnMiss;
    return !(done || this.isSignaling());
  }

  setupEntities(): void {
    const gen = this.roundSetupCount;
    this.roundSetupCount += 1;
    this.roundItems = resolveRoundItems(
      this.content.items,
      gen,
      this.layoutSeed
    );
    this.mood.clear();
    resetGT027Clock(this);
    this.renderItemStates.clear();
    this.isWon = false;
    this.isClosedOnMiss = false;
    this.successfulTrialCount = 0;
    this.activeHintLevel = 0;
    this.hoveredSlotIndex = null;

    const rules: RuleDefinition<CardItem>[] = this.content.rules.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      signalText: r.signal_text,
      signalAudioPrompt: r.signal_audio_text,
      validator: (item: CardItem) => matchesGT027RuleConfig(r, item),
    }));

    this.ruleSystem = new RuleSystem<CardItem>({
      rules,
      switchAfterTrials: this.content.switch_after_trials,
      signalDurationMs: this.difficulty.signal_duration_ms,
    });
    const switchAfter = this.content.switch_after_trials;
    this.targetSuccessTotal = this.content.rules.length * switchAfter;
    this.recordEvent("round_started", {
      round_index: gen,
      initial_rule: rules[0]?.id,
    });
  }

  getActiveRule(): RuleDefinition<CardItem> | null {
    return this.ruleSystem?.getActiveRule() ?? null;
  }

  isSignaling(): boolean {
    return this.ruleSystem?.isSignaling() ?? false;
  }

  getSignalInfo(): { text: string; audioPrompt?: string } | null {
    return this.ruleSystem?.getSignalInfo() ?? null;
  }

  validateAction(action: GameAction): ActionResult {
    if (!this.isInputOpen()) {
      return ACTION_IGNORED;
    }
    if (action.type !== "select_item" && action.type !== "tap_card") {
      return ACTION_IGNORED;
    }
    const itemId = extractGT027ItemId(action.data);
    const items = this.getRoundItems();
    const item = itemId ? items.find((i) => i.id === itemId) : undefined;
    if (!(item && this.ruleSystem)) {
      return ACTION_IGNORED;
    }
    const ok = this.ruleSystem.getActiveRule().validator(item);
    return ok ? ACTION_CORRECT : ACTION_RETRY;
  }

  onSelectItem(itemId: string): ActionResult {
    if (!this.isInputOpen()) {
      return ACTION_IGNORED;
    }
    const item = this.getRoundItems().find((i) => i.id === itemId);
    if (!(item && this.ruleSystem)) {
      return ACTION_IGNORED;
    }

    const evalResult = this.ruleSystem.evaluate(item);
    if (!evalResult.valid) {
      this.setRenderItemState(itemId, "wrong");
      triggerGT027WrongFlash(this, itemId);
      this.mood.set("wonder", GT027_WONDER_MS);
      this.recordEvent("item_selected", {
        item_id: itemId,
        is_correct: false,
        rule_id: this.ruleSystem.getActiveRule().id,
      });
      if (this.difficulty.allow_retry === false) {
        this.isClosedOnMiss = true;
        this.completeSession();
      }
      return ACTION_RETRY;
    }

    this.activeHintLevel = 0;
    clearGT027WrongFlashForItem(this, itemId);
    triggerGT027CorrectPulse(this, itemId);
    this.setRenderItemState(itemId, "correct");
    this.successfulTrialCount++;
    this.mood.set("happy", GT027_HAPPY_MS);
    this.recordEvent("item_selected", {
      item_id: itemId,
      is_correct: true,
      rule_id: this.ruleSystem.getActiveRule().id,
      trial_count: this.successfulTrialCount,
      target_total: this.targetSuccessTotal,
    });

    if (evalResult.triggeredSwitch) {
      if (this.successfulTrialCount < this.targetSuccessTotal) {
        this.queueSfx("rule_whistle");
        this.mood.set("listen", this.difficulty.signal_duration_ms);
      }
      this.renderItemStates.clear();
      clearGT027ItemStampsOnSwitch(this);
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
    if (gesture.type !== "tap" || !this.isInputOpen()) {
      return null;
    }
    const hitIdx = findHitSlotIndex(
      this.slots,
      gesture.x,
      gesture.y,
      "square",
      TAP_TOLERANCE_PX
    );
    const items = this.getRoundItems();
    const item = hitIdx >= 0 ? items[hitIdx] : undefined;
    if (!(item && this.ruleSystem)) {
      return null;
    }
    if (this.getRenderItemState(item.id) === "correct") {
      const rule = this.ruleSystem.getActiveRule();
      const unselected = resolveGT027UnselectedValidIndices(
        items,
        (it) => rule.validator(it),
        (id) => this.getRenderItemState(id)
      );
      if (unselected.some((idx) => idx !== hitIdx)) {
        return null;
      }
    }
    return { type: "select_item", data: { item_id: item.id } };
  }

  override commit(action: GameAction): void {
    if (action.type === "select_item" || action.type === "tap_card") {
      const itemId = extractGT027ItemId(action.data);
      if (typeof itemId === "string") {
        this.onSelectItem(itemId);
      }
    }
  }

  setPointerOver(x: number, y: number): void {
    if (!this.isAcceptingInput()) {
      this.hoveredSlotIndex = null;
      return;
    }
    const idx = findHitSlotIndex(this.slots, x, y, "square", TAP_TOLERANCE_PX);
    this.hoveredSlotIndex = idx >= 0 ? idx : null;
  }

  clearPointerOver(): void {
    this.hoveredSlotIndex = null;
  }

  override getView(): EngineView {
    return buildGT027View(
      this,
      this.slots,
      this.getRoundItems(),
      this.content.prompt,
      this.hoveredSlotIndex,
      (id) => this.getRenderItemState(id)
    );
  }

  // biome-ignore lint/suspicious/noConfusingVoidType: void needed for compatibility with update
  update(deltaMs: number): ActionResult | void | null {
    this.mood.tick(deltaMs);
    tickGT027Clock(this, deltaMs, (expiredId) => {
      if (this.getRenderItemState(expiredId) === "wrong") {
        this.setRenderItemState(expiredId, "idle");
      }
    });
    this.ruleSystem?.tick(deltaMs);
    return null;
  }

  override checkWinCondition(): boolean {
    return (
      !this.isClosedOnMiss &&
      this.targetSuccessTotal > 0 &&
      this.successfulTrialCount >= this.targetSuccessTotal
    );
  }

  override destroy(): void {
    super.destroy();
    this.renderItemStates.clear();
    resetGT027Clock(this);
  }

  override onHintCleared(): void {
    this.activeHintLevel = 0;
  }

  override getHintTargetIndex(): number | null {
    const activeRule = this.ruleSystem?.getActiveRule();
    if (!activeRule) {
      return null;
    }
    return resolveGT027HintTargetIndex(
      this.getRoundItems(),
      (it) => activeRule.validator(it),
      (id) => this.getRenderItemState(id),
      this.isInputOpen()
    );
  }

  override getHintTargetForLevel(level: HintLevel): HintTarget | null {
    const activeRule = this.ruleSystem?.getActiveRule();
    if (!activeRule) {
      this.activeHintLevel = 0;
      return null;
    }
    const ruleIdx = this.ruleSystem.getCurrentRuleIndex();
    const ruleConfig = this.content.rules[ruleIdx] ?? this.content.rules[0];
    const target = resolveGT027HintTarget(
      level,
      this.getRoundItems(),
      ruleConfig,
      (it) => activeRule.validator(it),
      (id) => this.getRenderItemState(id),
      this.isInputOpen()
    );
    this.activeHintLevel = target ? level : 0;
    return target;
  }

  override getHintDemoSequence(
    level: HintLevel
  ): readonly HintDemoStep[] | null {
    const activeRule = this.ruleSystem?.getActiveRule();
    if (!activeRule) {
      return null;
    }
    const cur = this.ruleSystem.getCorrectInCurrentRule();
    const rem = Math.max(0, this.content.switch_after_trials - cur);
    return resolveGT027DemoSequence(
      level,
      this.getRoundItems(),
      (it) => activeRule.validator(it),
      (id) => this.getRenderItemState(id),
      this.isInputOpen(),
      rem
    );
  }

  protected computeSlots(ageBand: AgeBand): readonly Slot[] {
    return computeGT027Slots(
      this.stageRect,
      this.logicSpace,
      this.getRoundItems().length,
      ageBand,
      this.cssPerLogic
    );
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    drawSceneBackground(ctx, rs, this.themeId);
    const split = this.stageRect ? splitCaption(this.stageRect) : undefined;
    const bodyRect = split?.body;
    drawWoodenTokenDock(ctx, rs, dockRectAroundSlots(this.slots, bodyRect));

    const rule = this.ruleSystem.getActiveRule();
    const signal = this.ruleSystem.getSignalInfo();
    const ruleIdx = this.ruleSystem.getCurrentRuleIndex();
    const frame = buildGT027RenderFrame({
      host: this,
      stageRect: this.stageRect,
      captionRect: split?.caption,
      slots: this.slots,
      items: this.getRoundItems(),
      bannerText: signal?.text ?? rule.description,
      ruleConfig: this.content.rules[ruleIdx] ?? this.content.rules[0],
      isSignaling: this.ruleSystem.isSignaling(),
      signalProgress: this.ruleSystem.getSignalProgress(),
      completedSteps: this.ruleSystem.getCorrectInCurrentRule(),
      switchAfterTrials: this.content.switch_after_trials,
      isClosedOnMiss: this.isClosedOnMiss,
      hintLevel: this.activeHintLevel,
      hintIdx: this.activeHintLevel >= 2 ? this.getHintTargetIndex() : null,
      hoveredIndex: this.hoveredSlotIndex,
      particlesEnabled: this.degradation?.particles_enabled ?? true,
      softShadowsEnabled: this.degradation?.soft_shadows_enabled ?? true,
      timeMs,
      isValid: (it) => rule.validator(it),
      getRenderState: (id) => this.getRenderItemState(id),
    });

    drawGT027RuleBanner(ctx, rs, frame.banner);
    drawStoryCharacterInStage(ctx, "fox", bodyRect, this.slots);
    for (const card of frame.cards) {
      drawGT027ItemCard(ctx, rs, card);
    }
  }
}
