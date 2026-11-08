import type { AgeBand } from "#src/contracts/types";
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
import { resolveAssetLabels } from "#src/labels/spoken-keyword";
import { findHitSlotIndex, TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import { resolveLayout } from "#src/layout/registry";
import {
  dockRectAroundSlots,
  insetDrawSize,
  splitCaption,
} from "#src/layout/slot-fit";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import {
  CARD_FLIP_MS,
  cardFlipPose,
  drawCircleOutline,
  drawSceneBackground,
  drawSlotItem,
  drawStoryCharacterInStage,
  drawSubPromptText,
  drawWoodenTokenDock,
} from "#src/render/index.js";
import type { MascotPose } from "#src/render/mascot";
import type { DegradationState } from "#src/systems/degradation";
import { designTokens } from "#src/systems/designTokens";
import { MoodPulse } from "#src/systems/mood-pulse";
import type { RenderSystem } from "#src/systems/render-system";
import { type RuleDefinition, RuleSystem } from "#src/systems/rule-system";
import { WrongFlash } from "#src/systems/wrong-flash";
import type { GT027Content, GT027Difficulty } from "./template.js";

function resolveRuleColorToken(color: string): string | null {
  switch (color.toLowerCase()) {
    case "red":
    case "đỏ":
    case "berry":
      return designTokens.colors.montessori.coral;
    case "blue":
    case "xanh dương":
    case "xanh":
    case "sky":
      return designTokens.colors.brand[500];
    case "yellow":
    case "vàng":
    case "amber":
      return designTokens.colors.montessori.amber;
    case "green":
    case "xanh lá":
    case "mint":
      return designTokens.colors.semantic.success[500];
    case "purple":
    case "tím":
    case "indigo":
      return designTokens.colors.montessori.indigo;
    case "orange":
    case "cam":
      return designTokens.colors.cta[500];
    default:
      return null;
  }
}

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

/** Khung chuyện đọc một lần ở vòng đầu (`BR-E027-05`, `BR-FBK-16`). */
export const GT027_STORY_LINE =
  "Cáo Con làm trọng tài, cứ thổi còi là luật chơi đổi. Bé nghe còi, nghe kỹ luật mới rồi chọn đúng hình nhé!";

/** Mascot vui sau mỗi lần chọn đúng. */
export const GT027_HAPPY_MS = 700;
/** Mascot nghiêng đầu sau lần chọn sai. */
export const GT027_WONDER_MS = 1500;

export class GT027Session extends TemplateGameSession<
  GT027Content,
  GT027Difficulty
> {
  degradation: DegradationState | null = null;

  override readonly usesPromptZone = true;

  private ruleSystem!: RuleSystem<CardItem>;
  private successfulTrialCount = 0;
  private targetSuccessTotal = 0;
  private lastFrameMs = 0;
  private wrongItemId: string | null = null;
  private readonly wrongFlash = new WrongFlash();

  private readonly mood = new MoodPulse();
  /** Mặt thẻ luật đang hiện và mặt trước đó, mốc đồng hồ khung lúc đổi (`BR-E027-06`). */
  private ruleFaceText: string | undefined;
  private previousRuleFaceText = "";
  private ruleFlipStartMs = Number.NEGATIVE_INFINITY;

  override storyLine(): string {
    return GT027_STORY_LINE;
  }

  /** Nghe luật mới suốt lúc báo đổi luật; ngoài ra chỉ đáp lại lượt chọn (`BR-E027-05`). */
  override mascotMood(): MascotPose | null {
    return this.isWon ? null : this.mood.current();
  }

  override isTrialBased(): boolean {
    return true;
  }

  setupEntities(): void {
    this.mood.clear();
    this.ruleFaceText = undefined;
    this.ruleFlipStartMs = Number.NEGATIVE_INFINITY;
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
      this.wrongItemId = itemId;
      this.wrongFlash.trigger(this.lastFrameMs);
      this.mood.set("wonder", GT027_WONDER_MS);
      this.recordEvent("item_selected", {
        item_id: itemId,
        is_correct: false,
        rule_id: this.ruleSystem.getActiveRule().id,
      });
      return ACTION_RETRY;
    }

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

    if (
      evalResult.triggeredSwitch &&
      this.successfulTrialCount < this.targetSuccessTotal
    ) {
      // Còi đổi luật là thông tin hợp lệ, không lộ đáp án (`BR-E027-05`).
      this.queueSfx("rule_whistle");
      this.mood.set("listen", this.difficulty.signal_duration_ms);
    }

    if (evalResult.triggeredSwitch) {
      this.renderItemStates.clear();
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

    const hitIndex = findHitSlotIndex(
      this.slots,
      gesture.x,
      gesture.y,
      "circle",
      TAP_TOLERANCE_PX
    );
    if (hitIndex === -1) {
      return null;
    }
    const item = this.content.items[hitIndex];
    if (!item) {
      return null;
    }
    return {
      type: "select_item",
      data: { item_id: item.id },
    };
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
        ...resolveAssetLabels(item.asset),
      });
    }

    return {
      activePrompt: this.content.prompt,
      entities,
    };
  }

  /** Hết nhịp sai thì vật về trung tính (cùng đồng hồ khung với lúc kích). */
  private expireWrongFlash(): void {
    if (!this.wrongFlash.hasExpired(this.lastFrameMs)) {
      return;
    }
    if (this.wrongItemId) {
      this.setRenderItemState(this.wrongItemId, "idle");
    }
    this.wrongFlash.clear();
    this.wrongItemId = null;
  }

  // biome-ignore lint/suspicious/noConfusingVoidType: void needed for compatibility with update
  update(deltaMs: number): ActionResult | void | null {
    this.lastFrameMs += deltaMs;
    this.mood.tick(deltaMs);
    this.expireWrongFlash();
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
    super.destroy();
    this.renderItemStates.clear();
  }

  override getHintTargetIndex(): number | null {
    if (this.isWon) {
      return null;
    }
    const activeRule = this.ruleSystem?.getActiveRule();
    if (!activeRule) {
      return null;
    }
    const unselectedIdx = this.content.items.findIndex(
      (item) =>
        this.getRenderItemState(item.id) !== "correct" &&
        activeRule.validator(item)
    );
    if (unselectedIdx >= 0) {
      return unselectedIdx;
    }
    const validIdx = this.content.items.findIndex((item) =>
      activeRule.validator(item)
    );
    return validIdx >= 0 ? validIdx : null;
  }

  protected computeSlots(ageBand: AgeBand): readonly Slot[] {
    const layoutFn = resolveLayout("grid");
    const bodyRect = this.stageRect
      ? splitCaption(this.stageRect).body
      : undefined;
    return insetDrawSize(
      layoutFn({
        slotCount: this.content.items.length,
        ageBand,
        logic: this.logicSpace,
        stage: bodyRect,
        cssPerLogic: this.cssPerLogic,
      }),
      bodyRect ?? this.stageRect
    );
  }

  /**
   * Thẻ luật lật bằng co `scaleX` quanh tâm khi mặt chữ đổi (luật đổi hoặc hết
   * báo hiệu): nửa đầu mặt cũ, nửa sau mặt mới. Lật chỉ theo việc luật đổi —
   * thông tin trẻ cần biết, không liên quan đáp án (`BR-E027-06`).
   */
  private drawRuleCard(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    text: string,
    caption: ZoneRect | undefined,
    timeMs: number
  ): void {
    if (this.ruleFaceText !== undefined && this.ruleFaceText !== text) {
      this.previousRuleFaceText = this.ruleFaceText;
      this.ruleFlipStartMs = timeMs;
    }
    this.ruleFaceText = text;
    const elapsed = timeMs - this.ruleFlipStartMs;
    if (elapsed >= CARD_FLIP_MS) {
      drawSubPromptText(ctx, rs, text, caption);
      return;
    }
    const pose = cardFlipPose(elapsed, rs.reducedMotion);
    const centerX = caption ? caption.x + caption.w / 2 : rs.LOGIC_WIDTH / 2;
    ctx.save();
    ctx.translate(centerX, 0);
    ctx.scale(pose.scaleX, 1);
    ctx.translate(-centerX, 0);
    drawSubPromptText(
      ctx,
      rs,
      pose.showsNewFace ? text : this.previousRuleFaceText,
      caption
    );
    ctx.restore();
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    this.lastFrameMs = timeMs;
    this.expireWrongFlash();
    drawSceneBackground(ctx, rs, this.themeId);

    const bodyRect = this.stageRect
      ? splitCaption(this.stageRect).body
      : undefined;
    drawWoodenTokenDock(ctx, rs, dockRectAroundSlots(this.slots, bodyRect));

    // Tiến độ không vẽ trên canvas (`BR-PSZ-06`).
    const rule = this.ruleSystem.getActiveRule();
    const signal = this.ruleSystem.getSignalInfo();
    // Luật đang hiệu lực phải hiện thường trực: trẻ đổi luật giữa chừng, không
    // ai được yêu cầu nhớ luật cũ.
    this.drawRuleCard(
      ctx,
      rs,
      signal?.text ?? rule.description,
      this.stageRect ? splitCaption(this.stageRect).caption : undefined,
      timeMs
    );
    // Cáo Con ở góc trống của thân sân khấu, không đè thẻ luật (`BR-E027-06`).
    drawStoryCharacterInStage(ctx, "fox", bodyRect, this.slots);

    if (this.wrongFlash.isActive(timeMs) && this.wrongItemId) {
      const wrongIndex = this.content.items.findIndex(
        (it) => it.id === this.wrongItemId
      );
      const slot = this.slots[wrongIndex];
      if (slot) {
        const progress = this.wrongFlash.progress(timeMs);
        rs.drawRetryRing(
          ctx,
          slot.x,
          slot.y,
          Math.max(slot.w, slot.h) / 2 + 4,
          progress
        );
      }
    }

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
      const colorToken = resolveRuleColorToken(item.color);
      if (colorToken) {
        drawCircleOutline(ctx, slot, colorToken, 4, -2);
      }
    });
  }
}
