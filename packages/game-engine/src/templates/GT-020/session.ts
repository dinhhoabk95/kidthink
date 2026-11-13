import type { AgeBand } from "#src/contracts/types";
import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "#src/game-session";
import type { EngineView, Gesture } from "#src/interaction";
import { findHitSlotIndex, TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import type { Slot } from "#src/layout/types";
import { PairingMechanic } from "#src/mechanics/pairing-mechanic";
import type { MascotPose } from "#src/render/mascot";
import {
  type CardItem,
  CardSystem,
  type FlipResult,
} from "#src/systems/card-system";
import type { DegradationState } from "#src/systems/degradation";
import type {
  HintDemoStep,
  HintLevel,
  HintTarget,
} from "#src/systems/hint-ladder";
import type { RenderSystem } from "#src/systems/render-system";
import {
  buildGT020HintDemoSequence,
  buildGT020HintTarget,
  buildGT020View,
  clearGT020Clock,
  clearGT020Hint,
  computeGT020Slots,
  escalateGT020Scaffold,
  type FlatCard,
  type GT020HintContext,
  type GT020ViewContext,
  getGT020Clock,
  markGT020CardSeen,
  markGT020PairMatched,
  renderGT020Board,
  resolveGT020HintPair,
  shuffleGT020Cards,
  tickGT020Clock,
} from "./layout.js";
import type { GT020Content, GT020Difficulty } from "./template.js";

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
  private roundClosedOnWrong = false;

  setupEntities(): void {
    this.isWon = false;
    this.hasOpenMismatch = false;
    this.mismatchElapsedMs = 0;
    this.roundClosedOnWrong = false;
    this.peekRemainingMs = this.difficulty.peek_all_initial_ms;

    this.displayCards = shuffleGT020Cards(
      this,
      this.content.pairs,
      this.layoutSeed,
      this.roundGeneration
    );

    const cardItems: CardItem[] = this.displayCards.map((c) => ({
      id: c.cardId,
      pairKey: c.pairKey,
    }));

    this.cardSystem.init(cardItems);
    this.pairingMechanic.reset();

    this.recordEvent("round_started", {
      round_index: 0,
      total_pairs: this.content.pairs.length,
      card_count: this.displayCards.length,
    });
  }

  /** Cả bàn đang ngửa để xem trước — chưa nhận chạm (`BR-E020-05`). */
  isPeeking(): boolean {
    return this.peekRemainingMs > 0;
  }

  override isAcceptingInput(): boolean {
    return (
      !(this.isPeeking() || this.isWon || this.roundClosedOnWrong) &&
      super.isAcceptingInput()
    );
  }

  /** Lật thẻ úp là nước đi hợp lệ; cặp lệch không phải lỗi (`BR-E020-04`). */
  private validateTapCard(cardId: string): ActionResult {
    if (this.isPeeking() || this.isWon || this.roundClosedOnWrong) {
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
    if (this.isWon || this.roundClosedOnWrong) {
      return null;
    }
    if (this.hasOpenMismatch) {
      this.closeMismatch();
    }
    const result = this.cardSystem.flipCard(cardId);
    if (!result) {
      return null;
    }
    markGT020CardSeen(this, cardId);
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
        markGT020PairMatched(this, pair.pair_key, this.displayCards);
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
      if (this.difficulty.allow_retry === false) {
        this.roundClosedOnWrong = true;
        getGT020Clock(this).autoRevealRemainingMs = Math.max(
          this.difficulty.flip_back_delay_ms,
          1200
        );
      }
    }

    return result;
  }

  closeMismatch(): void {
    this.cardSystem.closeMismatch();
    this.hasOpenMismatch = false;
    this.mismatchElapsedMs = 0;
  }

  update(deltaMs: number): void {
    const step = Math.max(0, deltaMs);
    tickGT020Clock(this, step);
    if (this.peekRemainingMs > 0) {
      this.peekRemainingMs = Math.max(0, this.peekRemainingMs - step);
    }
    if (!this.hasOpenMismatch) {
      return;
    }
    this.mismatchElapsedMs += step;
    if (this.mismatchElapsedMs >= this.difficulty.flip_back_delay_ms) {
      this.closeMismatch();
    }
  }

  setPointerOver(x: number, y: number): void {
    const hitIdx = findHitSlotIndex(
      this.slots.slice(0, this.displayCards.length),
      x,
      y,
      "square",
      TAP_TOLERANCE_PX
    );
    const hovered =
      hitIdx === null ? null : (this.displayCards[hitIdx]?.cardId ?? null);
    getGT020Clock(this).hoveredCardId = hovered;
  }

  clearPointerOver(): void {
    getGT020Clock(this).hoveredCardId = null;
  }

  override storyLine(): string {
    return GT020_STORY_LINE;
  }

  /** Gấu Con nghiêng đầu nhớ lại khi một thẻ ngửa đang chờ cặp (`BR-E020-07`). */
  override mascotMood(): MascotPose | null {
    if (this.isWon || this.isPeeking() || this.roundClosedOnWrong) {
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

  private hintContext(): GT020HintContext {
    return {
      session: this,
      displayCards: this.displayCards,
      cardSystem: this.cardSystem,
      isWon: this.isWon,
      isPeeking: this.isPeeking(),
      roundClosedOnWrong: this.roundClosedOnWrong,
      hasOpenMismatch: this.hasOpenMismatch,
    };
  }

  private viewContext(): GT020ViewContext {
    return {
      ...this.hintContext(),
      prompt: this.content.prompt,
      slots: this.slots,
      mismatchElapsedMs: this.mismatchElapsedMs,
      flipBackDelayMs: this.difficulty.flip_back_delay_ms,
      themeId: this.themeId,
      degradation: this.degradation,
    };
  }

  override onScaffoldEscalated(level: HintLevel): void {
    escalateGT020Scaffold(this.hintContext(), level);
  }

  override onHintCleared(): void {
    clearGT020Hint(this);
  }

  override getHintTargetForLevel(level: HintLevel): HintTarget | null {
    return buildGT020HintTarget(this.hintContext(), level);
  }

  override getHintTargetIndex(): number | null {
    return resolveGT020HintPair(this.hintContext())?.nextTapIdx ?? null;
  }

  override getHintDemoSequence(
    level: HintLevel
  ): readonly HintDemoStep[] | null {
    return buildGT020HintDemoSequence(this.hintContext(), level);
  }

  override getView(): EngineView {
    return buildGT020View(this.viewContext());
  }

  protected computeSlots(ageBand: AgeBand): readonly Slot[] {
    return computeGT020Slots(
      this,
      this.displayCards.length,
      ageBand,
      this.logicSpace,
      this.stageRect,
      this.cssPerLogic ?? 1
    );
  }

  render(ctx: CanvasRenderingContext2D, rs: RenderSystem, timeMs = 0): void {
    renderGT020Board(ctx, rs, this.viewContext(), timeMs);
  }

  override destroy(): void {
    clearGT020Clock(this);
    super.destroy();
  }
}
