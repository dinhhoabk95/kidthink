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
  type ClockAngles,
  type ClockTime,
  formatClockTime,
  isSameTime,
  timeToAngles,
} from "#src/systems/rotation-system";
import {
  drawPromptText,
  drawSceneBackground,
  drawSlotItem,
  type ItemVisualState,
  sceneBox,
  updateParticles,
} from "../shared-render.js";
import { drawClockFace, insetBox, squareBox } from "../shared-render-shapes.js";
import type { GT016Content, GT016Difficulty } from "./template.js";

export class ClockHandsSession extends TemplateGameSession<
  GT016Content,
  GT016Difficulty
> {
  slots: readonly Slot[] = [];
  degradation: DegradationState | null = null;
  private renderParticles: Particle[] = [];
  private readonly renderItemStates: Map<string, ItemVisualState> = new Map();

  private currentTime: ClockTime;
  private selectedOptionIndex: number | null = null;
  private readonly matchedCardIds: Set<string> = new Set();

  constructor(
    content: GT016Content,
    difficulty: GT016Difficulty,
    layoutSeed = 0
  ) {
    super(content, difficulty, layoutSeed);
    this.currentTime = content.initial_time ?? {
      hour: content.target_time.hour,
      minute: content.target_time.minute,
    };
  }

  setupEntities(): void {
    this.currentTime = this.content.initial_time ?? {
      hour: this.content.target_time.hour,
      minute: this.content.target_time.minute,
    };
    this.selectedOptionIndex = null;
    this.matchedCardIds.clear();
    this.isWon = false;

    this.recordEvent("game_started", {
      template_code: "GT-016",
      mode: this.content.mode,
      target_time: formatClockTime(this.content.target_time),
    });
  }

  getCurrentTime(): ClockTime {
    return this.currentTime;
  }

  getAngles(): ClockAngles {
    return timeToAngles(this.currentTime);
  }

  getMode(): GT016Content["mode"] {
    return this.content.mode;
  }

  getOptions(): GT016Content["options"] {
    return this.content.options;
  }

  getActivityCards(): GT016Content["activity_cards"] {
    return this.content.activity_cards;
  }

  setHour(hour: number): void {
    const clampedHour = Math.max(1, Math.min(12, Math.round(hour)));
    this.currentTime = { ...this.currentTime, hour: clampedHour };
    this.recordEvent("hand_rotated", {
      hand: "hour",
      time: formatClockTime(this.currentTime),
    });
  }

  setMinute(minute: 0 | 30): void {
    this.currentTime = { ...this.currentTime, minute };
    this.recordEvent("hand_rotated", {
      hand: "minute",
      time: formatClockTime(this.currentTime),
    });
  }

  selectOption(index: number): boolean {
    const opt = this.content.options[index];
    if (!opt) {
      return false;
    }

    this.selectedOptionIndex = index;
    this.recordEvent("time_submitted", {
      time: formatClockTime(opt),
      is_correct: opt.is_correct,
    });

    if (this.checkWinCondition()) {
      this.winSession();
    }

    return opt.is_correct;
  }

  submitCurrentTime(): boolean {
    const isCorrect = isSameTime(this.currentTime, this.content.target_time);
    this.recordEvent("time_submitted", {
      time: formatClockTime(this.currentTime),
      is_correct: isCorrect,
    });
    if (this.checkWinCondition()) {
      this.winSession();
    }
    return isCorrect;
  }

  matchCard(cardId: string): boolean {
    const card = this.content.activity_cards.find((c) => c.card_id === cardId);
    if (!card) {
      return false;
    }

    if (
      isSameTime(this.currentTime, { hour: card.hour, minute: card.minute })
    ) {
      this.matchedCardIds.add(cardId);
      this.recordEvent("time_submitted", {
        card_id: cardId,
        is_correct: true,
      });
      if (this.checkWinCondition()) {
        this.winSession();
      }
      return true;
    }
    return false;
  }

  validateAction(action: GameAction): ActionResult {
    if (action.type === "set_time") {
      return ACTION_IGNORED;
    }
    if (action.type === "select_option") {
      if (typeof action.data !== "number") {
        return ACTION_RETRY;
      }
      const idx = action.data;
      const opt = this.content.options[idx];
      return opt?.is_correct ? ACTION_CORRECT : ACTION_RETRY;
    }
    if (action.type === "submit_time") {
      return isSameTime(this.currentTime, this.content.target_time)
        ? ACTION_CORRECT
        : ACTION_RETRY;
    }
    return ACTION_IGNORED;
  }

  override checkWinCondition(): boolean {
    if (this.content.mode === "read") {
      if (this.selectedOptionIndex === null) {
        return false;
      }
      const opt = this.content.options[this.selectedOptionIndex];
      return opt?.is_correct === true;
    }
    if (this.content.mode === "set") {
      return isSameTime(this.currentTime, this.content.target_time);
    }
    if (this.content.mode === "match") {
      return (
        this.content.activity_cards.length > 0 &&
        this.matchedCardIds.size === this.content.activity_cards.length
      );
    }
    return false;
  }

  override destroy(): void {
    super.destroy();
    this.selectedOptionIndex = null;
    this.matchedCardIds.clear();
  }

  resolveSlots(ageBand: "3-4" | "4-5" | "5-6"): void {
    const layoutFn = resolveLayout("grid");
    // `options` và `activity_cards` khai `.default([])` trong contract, nhưng
    // session nhận `content_pack` **thô** nên default không bao giờ tới nơi:
    // level ở `mode: "read"` không có `activity_cards`, và đọc thẳng `.length`
    // ném "Cannot read properties of undefined". Bắt được khi chụp thật
    // `GL-C1-ADD-BAL-0001` trên cả ba khung nhìn, 2026-09-01.
    this.slots = layoutFn({
      slotCount: Math.max(
        this.content.options?.length ?? 0,
        this.content.activity_cards?.length ?? 0,
        1
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
    const scene = insetBox(sceneBox(rs), 0.08);
    const faceBox = squareBox({
      x: scene.x,
      y: scene.y,
      w: scene.w,
      h: scene.h * 0.58,
    });
    drawClockFace(ctx, faceBox, this.currentTime);

    if (this.content.mode === "match") {
      this.content.activity_cards.forEach((card, i) => {
        const slot = this.slots[i];
        if (!slot) {
          return;
        }
        drawSlotItem(ctx, rs, slot, {
          id: card.card_id,
          asset: card.asset,
          label: formatClockTime({ hour: card.hour, minute: card.minute }),
          state: this.matchedCardIds.has(card.card_id) ? "correct" : "idle",
        });
      });
      this.drawRenderFeedback(rs, ctx);
      return;
    }

    this.content.options.forEach((opt, i) => {
      const slot = this.slots[i];
      if (!slot) {
        return;
      }
      const chosen = this.selectedOptionIndex === i;
      let state: "correct" | "wrong" | "idle" = "idle";
      if (chosen) {
        state = opt.is_correct ? "correct" : "wrong";
      }
      drawSlotItem(ctx, rs, slot, {
        id: `opt-${i}`,
        text: formatClockTime({ hour: opt.hour, minute: opt.minute }),
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

export const GT016Session = ClockHandsSession;
export default ClockHandsSession;
