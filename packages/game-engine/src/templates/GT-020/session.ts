import {
  ACTION_CORRECT,
  ACTION_IGNORED,
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
import { PairingMechanic } from "#src/mechanics/pairing-mechanic";
import {
  drawLabelText,
  drawPromptText,
  drawSceneBackground,
  drawSlotItem,
  getColorsForState,
  type ItemVisualState,
  updateParticles,
} from "#src/render/index.js";
import { deriveStream } from "#src/rng/mulberry32";
import { shuffle } from "#src/rng/shuffle";
import {
  type CardItem,
  CardSystem,
  type FlipResult,
} from "#src/systems/card-system";
import type { DegradationState } from "#src/systems/degradation";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import type { GT020Content, GT020Difficulty } from "./template.js";

export interface FlatCard {
  readonly cardId: string;
  readonly pairKey: string;
  readonly asset: GT020Content["pairs"][number]["card_a"]["asset"];
}

function isPointInSlot(
  slot: Slot,
  x: number,
  y: number,
  tolerance = 24
): boolean {
  const hw = (slot.hitW ?? slot.w) / 2 + tolerance;
  const hh = (slot.hitH ?? slot.h) / 2 + tolerance;
  return Math.abs(x - slot.x) <= hw && Math.abs(y - slot.y) <= hh;
}

export class GT020Session extends TemplateGameSession<
  GT020Content,
  GT020Difficulty
> {
  degradation: DegradationState | null = null;
  private renderParticles: Particle[] = [];
  private readonly renderItemStates: Map<string, ItemVisualState> = new Map();

  readonly cardSystem = new CardSystem();
  private readonly pairingMechanic = new PairingMechanic();
  displayCards: readonly FlatCard[] = [];
  private mismatchCardId: string | null = null;
  private mismatchTimestamp = 0;

  setupEntities(): void {
    this.isWon = false;
    this.mismatchCardId = null;
    this.mismatchTimestamp = 0;
    const flat: FlatCard[] = this.content.pairs.flatMap((p) => [
      { cardId: p.card_a.card_id, pairKey: p.pair_key, asset: p.card_a.asset },
      { cardId: p.card_b.card_id, pairKey: p.pair_key, asset: p.card_b.asset },
    ]);

    const rng = deriveStream(this.layoutSeed, "items");
    this.displayCards = shuffle(flat, rng);

    const cardItems: CardItem[] = flat.map((c) => ({
      id: c.cardId,
      pairKey: c.pairKey,
    }));

    this.cardSystem.init(cardItems);
    this.pairingMechanic.reset();

    this.recordEvent("round_started", {
      round_index: 0,
      total_pairs: this.content.pairs.length,
      card_count: flat.length,
    });
  }

  validateAction(action: GameAction): ActionResult {
    if (action.type === "tap_card" || action.type === "flip_card") {
      const data = action.data;
      const cardId =
        typeof data === "object" && data !== null
          ? Reflect.get(data, "card_id")
          : undefined;
      if (typeof cardId !== "string" || cardId.length === 0) {
        return ACTION_IGNORED;
      }
      const card = this.cardSystem.getCard(cardId);
      if (card?.state !== "face_down") {
        return ACTION_IGNORED;
      }
      return ACTION_CORRECT;
    }

    return ACTION_IGNORED;
  }

  onTapCard(cardId: string): FlipResult | null {
    const result = this.cardSystem.flipCard(cardId);
    if (!result) {
      return null;
    }

    this.recordEvent("pair_selected", {
      card_id: cardId,
      state: result.state,
      is_second_flip: result.isSecondFlip,
    });

    if (result.isSecondFlip && result.isMatch) {
      this.mismatchCardId = null;
      const pair = this.content.pairs.find(
        (p) => p.pair_key === result.matchedPairKey
      );
      if (pair) {
        this.pairingMechanic.match(pair.card_a.card_id, pair.card_b.card_id);
      }
      this.recordEvent("pair_matched", {
        pair_key: result.matchedPairKey,
        matches_count: this.cardSystem.getMatchesCount(),
        total_pairs: this.cardSystem.getTotalPairs(),
      });

      if (this.cardSystem.isAllMatched()) {
        this.recordEvent("round_completed", { round_index: 0 });
        this.winSession();
      }
    } else if (result.isSecondFlip && !result.isMatch) {
      this.mismatchCardId = cardId;
      this.mismatchTimestamp = performance.now();
    }

    return result;
  }

  closeMismatch(): void {
    this.cardSystem.closeMismatch();
  }

  override checkWinCondition(): boolean {
    return this.cardSystem.isAllMatched();
  }

  override toAction(gesture: Gesture): GameAction | null {
    if (gesture.type === "tap") {
      for (let i = 0; i < this.displayCards.length; i++) {
        const slot = this.slots[i];
        const card = this.displayCards[i];
        if (slot && card && isPointInSlot(slot, gesture.x, gesture.y)) {
          return { type: "tap_card", data: { card_id: card.cardId } };
        }
      }
    }
    return null;
  }

  override commit(action: GameAction): void {
    if (action.type === "tap_card" || action.type === "flip_card") {
      const data = action.data;
      const cardId =
        typeof data === "object" && data !== null
          ? Reflect.get(data, "card_id")
          : undefined;
      if (typeof cardId === "string") {
        this.onTapCard(cardId);
      }
    }
  }

  override getView(): EngineView {
    const entities: ViewEntity[] = this.displayCards.map((card, i) => {
      const slot = this.slots[i];
      const cardState =
        this.cardSystem.getCard(card.cardId)?.state ?? "face_down";
      let state: EntityVisual = "idle";
      if (cardState === "matched") {
        state = "correct";
      } else if (cardState === "face_up") {
        state = "selected";
      }
      return {
        id: card.cardId,
        slotIndex: i,
        role: "source",
        state,
        x: slot?.x ?? 0,
        y: slot?.y ?? 0,
        w: slot?.w ?? 80,
        h: slot?.h ?? 80,
      };
    });
    return {
      activePrompt: this.content.prompt,
      entities,
    };
  }

  override getHintTargetIndex(): number | null {
    if (this.isWon) {
      return null;
    }
    const faceUpCard = this.displayCards.find((c) => {
      const state = this.cardSystem.getCard(c.cardId)?.state;
      return state === "face_up";
    });
    if (faceUpCard) {
      const matchingIdx = this.displayCards.findIndex((c) => {
        const state = this.cardSystem.getCard(c.cardId)?.state;
        return c.pairKey === faceUpCard.pairKey && state === "face_down";
      });
      if (matchingIdx >= 0) {
        return matchingIdx;
      }
    }
    const firstFaceDown = this.displayCards.findIndex((c) => {
      const state = this.cardSystem.getCard(c.cardId)?.state;
      return state === "face_down";
    });
    return firstFaceDown >= 0 ? firstFaceDown : null;
  }

  protected computeSlots(ageBand: "3-4" | "4-5" | "5-6"): readonly Slot[] {
    const layoutFn = resolveLayout("card-flip-grid");
    return layoutFn({
      slotCount: this.displayCards.length,
      ageBand,
      logic: this.logicSpace,
    });
  }

  setRenderItemState(itemId: string, state: ItemVisualState): void {
    this.renderItemStates.set(itemId, state);
  }

  getRenderItemState(itemId: string): ItemVisualState {
    return this.renderItemStates.get(itemId) ?? "idle";
  }

  private getCardItemState(
    state: string,
    isMismatch: boolean
  ): ItemVisualState {
    if (state === "matched") {
      return "correct";
    }
    if (isMismatch) {
      return "wrong";
    }
    return "selected";
  }

  private renderCardSlot(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    card: FlatCard,
    slot: Slot,
    timeMs: number
  ): void {
    const state = this.cardSystem.getCard(card.cardId)?.state ?? "face_down";
    if (state === "face_down") {
      // Mặt úp: thân bài trơn, ❌ NEVER lộ asset — đó là cả trò chơi.
      const { fill, border } = getColorsForState("locked");
      rs.drawClayBody(
        ctx,
        slot.x,
        slot.y,
        Math.min(slot.w, slot.h) / 2,
        fill,
        border,
        "square"
      );
      drawLabelText(ctx, "?", slot.x, slot.y, 28);
      return;
    }
    const isMismatch = card.cardId === this.mismatchCardId;
    const elapsed = isMismatch ? timeMs - this.mismatchTimestamp : 0;
    const shakeX =
      isMismatch && elapsed < 400 ? Math.sin(elapsed * 0.05) * 4 : 0;
    const drawSlot = shakeX === 0 ? slot : { ...slot, x: slot.x + shakeX };

    drawSlotItem(
      ctx,
      rs,
      drawSlot,
      {
        id: card.cardId,
        asset: card.asset,
        state: this.getCardItemState(state, isMismatch),
      },
      "square"
    );

    if (isMismatch && elapsed < 400) {
      rs.drawScaffoldingHighlight(
        ctx,
        slot.x + shakeX,
        slot.y,
        Math.min(slot.hitW, slot.hitH) / 2 + 4,
        (elapsed % 1000) / 1000
      );
    }
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    if (this.mismatchCardId && timeMs - this.mismatchTimestamp >= 400) {
      this.mismatchCardId = null;
    }
    drawSceneBackground(ctx, rs, this.themeId);
    drawPromptText(ctx, rs, this.content.prompt);
    this.displayCards.forEach((card, i) => {
      const slot = this.slots[i];
      if (slot) {
        this.renderCardSlot(ctx, rs, card, slot, timeMs);
      }
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

export default GT020Session;
