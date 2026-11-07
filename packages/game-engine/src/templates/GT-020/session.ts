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
import type { Slot } from "#src/layout/types";
import { PairingMechanic } from "#src/mechanics/pairing-mechanic";
import {
  drawLabelText,
  drawSceneBackground,
  drawSlotItem,
  getColorsForState,
  type ItemVisualState,
} from "#src/render/index";
import { deriveStream } from "#src/rng/mulberry32";
import { shuffle } from "#src/rng/shuffle";
import {
  type CardItem,
  CardSystem,
  type FlipResult,
} from "#src/systems/card-system";
import type { DegradationState } from "#src/systems/degradation";
import type { RenderSystem } from "#src/systems/render-system";
import type { GT020Content, GT020Difficulty } from "./template.js";

interface FlatCard {
  readonly cardId: string;
  readonly pairKey: string;
  readonly asset: GT020Content["pairs"][number]["card_a"]["asset"];
}

export class GT020Session extends TemplateGameSession<
  GT020Content,
  GT020Difficulty
> {
  override readonly usesPromptZone = true;
  degradation: DegradationState | null = null;

  readonly cardSystem = new CardSystem();
  private readonly pairingMechanic = new PairingMechanic();
  displayCards: readonly FlatCard[] = [];
  private mismatchCardId: string | null = null;
  private mismatchTimestamp = 0;
  private hasOpenMismatch = false;
  private mismatchElapsedMs = 0;
  private lastFrameMs = 0;

  setupEntities(): void {
    this.isWon = false;
    this.mismatchCardId = null;
    this.mismatchTimestamp = 0;
    this.hasOpenMismatch = false;
    this.mismatchElapsedMs = 0;
    this.lastFrameMs = 0;
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

  private validateTapCard(cardId: string): ActionResult {
    const card = this.cardSystem.getCard(cardId);
    if (card?.state !== "face_down") {
      return ACTION_IGNORED;
    }
    if (!this.hasOpenMismatch) {
      const openCard = this.cardSystem
        .getAllCards()
        .find((c) => c.state === "face_up");
      if (openCard && openCard.id !== cardId) {
        return openCard.pairKey === card.pairKey
          ? ACTION_CORRECT
          : ACTION_RETRY;
      }
    }
    return ACTION_CORRECT;
  }

  validateAction(action: GameAction): ActionResult {
    if (action.type !== "tap_card" && action.type !== "flip_card") {
      return ACTION_IGNORED;
    }
    const data = action.data;
    if (typeof data !== "object" || data === null) {
      return ACTION_IGNORED;
    }
    const cardId = Reflect.get(data, "card_id");
    if (typeof cardId !== "string" || cardId.length === 0) {
      return ACTION_IGNORED;
    }
    return this.validateTapCard(cardId);
  }

  onTapCard(cardId: string): FlipResult | null {
    if (this.hasOpenMismatch) {
      this.closeMismatch();
    }
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
      this.hasOpenMismatch = false;
      this.mismatchElapsedMs = 0;
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
      this.mismatchTimestamp = this.lastFrameMs;
      this.hasOpenMismatch = true;
      this.mismatchElapsedMs = 0;
    }

    return result;
  }

  closeMismatch(): void {
    this.cardSystem.closeMismatch();
    this.hasOpenMismatch = false;
    this.mismatchElapsedMs = 0;
    this.mismatchCardId = null;
  }

  update(deltaMs: number): void {
    if (!this.hasOpenMismatch) {
      return;
    }
    this.mismatchElapsedMs += Math.max(0, deltaMs);
    if (this.mismatchElapsedMs >= 400) {
      this.mismatchCardId = null;
    }
    if (this.mismatchElapsedMs >= this.difficulty.flip_back_delay_ms) {
      this.closeMismatch();
    }
  }

  override checkWinCondition(): boolean {
    return this.cardSystem.isAllMatched();
  }

  override toAction(gesture: Gesture): GameAction | null {
    if (gesture.type === "tap") {
      const hitIdx = findHitSlotIndex(
        this.slots.slice(0, this.displayCards.length),
        gesture.x,
        gesture.y,
        "square",
        TAP_TOLERANCE_PX
      );
      if (hitIdx !== null) {
        const card = this.displayCards[hitIdx];
        if (card) {
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
      const labels =
        cardState === "face_down" ? {} : resolveAssetLabels(card.asset);
      return {
        id: card.cardId,
        slotIndex: i,
        role: "source",
        state,
        x: slot?.x ?? 0,
        y: slot?.y ?? 0,
        w: slot?.w ?? 80,
        h: slot?.h ?? 80,
        hitShape: "square",
        ...labels,
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

  protected computeSlots(ageBand: AgeBand): readonly Slot[] {
    const layoutName =
      this.displayCards.length === 4 ? "grid" : "card-flip-grid";
    const layoutFn = resolveLayout(layoutName);
    return layoutFn({
      slotCount: this.displayCards.length,
      ageBand,
      logic: this.logicSpace,
      stage: this.stageRect,
      cssPerLogic: this.cssPerLogic,
    });
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
      isMismatch && elapsed < 400 && !rs.reducedMotion
        ? Math.sin(elapsed * 0.05) * 4
        : 0;
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
      rs.drawRetryRing(
        ctx,
        slot.x + shakeX,
        slot.y,
        Math.min(slot.hitW, slot.hitH) / 2 + 4,
        elapsed / 400
      );
    }
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    this.lastFrameMs = timeMs;
    if (this.mismatchCardId && timeMs - this.mismatchTimestamp >= 400) {
      this.mismatchCardId = null;
    }
    drawSceneBackground(ctx, rs, this.themeId);
    this.displayCards.forEach((card, i) => {
      const slot = this.slots[i];
      if (slot) {
        this.renderCardSlot(ctx, rs, card, slot, timeMs);
      }
    });
  }
}
