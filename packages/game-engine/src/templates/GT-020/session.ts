import type { AgeBand } from "#src/contracts/types";
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
} from "#src/render/index";
import type { MascotPose } from "#src/render/mascot";
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

/** Khung chuyện đọc một lần ở vòng đầu (`BR-E020-07`, `BR-FBK-16`). */
export const GT020_STORY_LINE =
  "Gấu Con giấu các bạn dưới thẻ, bé lật tìm hai bạn giống nhau nhé!";

export class GT020Session extends TemplateGameSession<
  GT020Content,
  GT020Difficulty
> {
  override readonly usesPromptZone = true;
  degradation: DegradationState | null = null;

  readonly cardSystem = new CardSystem();
  private readonly pairingMechanic = new PairingMechanic();
  displayCards: readonly FlatCard[] = [];
  private peekRemainingMs = 0;
  private hasOpenMismatch = false;
  private mismatchElapsedMs = 0;

  setupEntities(): void {
    this.isWon = false;
    this.hasOpenMismatch = false;
    this.mismatchElapsedMs = 0;
    // Mở màn: lật ngửa cả bàn `peek_all_initial_ms` rồi úp (`BR-E020-05`).
    this.peekRemainingMs = this.difficulty.peek_all_initial_ms;
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

  /** Cả bàn đang ngửa để xem trước — chưa nhận chạm (`BR-E020-05`). */
  isPeeking(): boolean {
    return this.peekRemainingMs > 0;
  }

  /** Lật thẻ úp là nước đi hợp lệ; cặp lệch không phải lỗi (`BR-E020-04`). */
  private validateTapCard(cardId: string): ActionResult {
    if (this.isPeeking()) {
      return ACTION_IGNORED;
    }
    const card = this.cardSystem.getCard(cardId);
    return card?.state === "face_down" ? ACTION_CORRECT : ACTION_IGNORED;
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
    // Tiếng lật chỉ khi thẻ thật sự lật ngoài giai đoạn xem trước (`BR-E020-07`).
    if (!this.isPeeking()) {
      this.queueSfx("card_flip");
    }

    this.recordEvent("pair_selected", {
      card_id: cardId,
      state: result.state,
      is_second_flip: result.isSecondFlip,
    });

    if (result.isSecondFlip && result.isMatch) {
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
      this.hasOpenMismatch = true;
      this.mismatchElapsedMs = 0;
    }

    return result;
  }

  closeMismatch(): void {
    this.cardSystem.closeMismatch();
    this.hasOpenMismatch = false;
    this.mismatchElapsedMs = 0;
  }

  update(deltaMs: number): void {
    if (this.peekRemainingMs > 0) {
      this.peekRemainingMs = Math.max(0, this.peekRemainingMs - deltaMs);
    }
    if (!this.hasOpenMismatch) {
      return;
    }
    this.mismatchElapsedMs += Math.max(0, deltaMs);
    if (this.mismatchElapsedMs >= this.difficulty.flip_back_delay_ms) {
      this.closeMismatch();
    }
  }

  override storyLine(): string {
    return GT020_STORY_LINE;
  }

  /** Gấu Con nghiêng đầu nhớ lại khi một thẻ ngửa đang chờ cặp (`BR-E020-07`). */
  override mascotMood(): MascotPose | null {
    if (this.isWon || this.isPeeking()) {
      return null;
    }
    if (this.hasOpenMismatch) {
      return "wonder";
    }
    const faceUp = this.displayCards.filter(
      (c) => this.cardSystem.getCard(c.cardId)?.state === "face_up"
    );
    return faceUp.length === 1 ? "wonder" : null;
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
      const cardState = this.effectiveCardState(card.cardId);
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

  /** Trạng thái thẻ thấy được: xem trước thì mọi thẻ chưa ghép đều ngửa. */
  private effectiveCardState(cardId: string): string {
    const state = this.cardSystem.getCard(cardId)?.state ?? "face_down";
    return this.isPeeking() && state === "face_down" ? "face_up" : state;
  }

  override getHintTargetIndex(): number | null {
    if (this.isWon || this.isPeeking()) {
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

  private renderCardSlot(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    card: FlatCard,
    slot: Slot
  ): void {
    const state = this.effectiveCardState(card.cardId);
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
    drawSlotItem(
      ctx,
      rs,
      slot,
      {
        id: card.cardId,
        asset: card.asset,
        state: state === "matched" ? "correct" : "selected",
      },
      "square"
    );
  }

  render(ctx: CanvasRenderingContext2D, rs: RenderSystem): void {
    drawSceneBackground(ctx, rs, this.themeId);
    this.displayCards.forEach((card, i) => {
      const slot = this.slots[i];
      if (slot) {
        this.renderCardSlot(ctx, rs, card, slot);
      }
    });
  }
}
