import type { AgeBand } from "#src/contracts/types";
import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_QUIET_OK,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  type HintDemoStep,
  type HintLevel,
  type HintTarget,
  TemplateGameSession,
} from "#src/game-session";
import type { EngineView, Gesture } from "#src/interaction";
import { isPointInSlot, TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import { splitCaption } from "#src/layout/slot-fit";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import { spawnParticlesAtSlot, updateParticles } from "#src/render/index";
import type { MascotPose } from "#src/render/mascot";
import type { DegradationState } from "#src/systems/degradation";
import type { RenderSystem } from "#src/systems/render-system";
import {
  buildGT029View,
  elapsedSince,
  type GT029ActionPayload,
  type GT029LayoutHost,
  getGT029Clock,
  makeStamp,
  narrowActionPayload,
  renderGT029Frame,
  resetGT029Clock,
  resolveDisplayItems,
  resolveDisplayOptions,
  resolveGT029DemoSequence,
  resolveGT029HintTargetForLevel,
  resolveGT029HintTargetIndex,
  WRONG_FLASH_DURATION_MS,
} from "./layout.js";
import type { GT029Content, GT029Difficulty } from "./template.js";
import { computeGT029Slots, computeRemovedDockRects } from "./zone-layout.js";

/** Khung chuyện đọc một lần ở vòng đầu (`BR-E029-06`, `BR-FBK-16`). */
export const GT029_STORY_LINE =
  "Mèo Mướp đói bụng rồi, bé bớt đồ ăn cho Mèo rồi đếm xem còn lại mấy nhé!";

/** Mascot reo ngắn khi Mèo ăn một vật (`BR-E029-06`). */
export const GT029_MUNCH_MS = 1000;
/** Mascot nghiêng đầu sau đáp án chưa đúng. */
export const GT029_WONDER_MS = 1500;

export class GT029Session
  extends TemplateGameSession<GT029Content, GT029Difficulty>
  implements GT029LayoutHost
{
  override readonly usesPromptZone = true;

  degradation: DegradationState | null = null;
  removedItemIds: Set<string> = new Set();
  selectedOptionId: string | null = null;
  isWin = false;

  private items: GT029Content["initial_items"] = this.content.initial_items;
  private options: GT029Content["answer_options"] = this.content.answer_options;
  private roundClosedOnWrong = false;
  private reactionPose: MascotPose | null = null;
  private reactionRemainingMs = 0;

  private react(pose: MascotPose, ms: number): void {
    this.reactionPose = pose;
    this.reactionRemainingMs = ms;
  }

  override storyLine(): string {
    return GT029_STORY_LINE;
  }

  override mascotMood(): MascotPose | null {
    return this.reactionRemainingMs > 0 && !this.isWon
      ? this.reactionPose
      : null;
  }

  getDisplayItems(): GT029Content["initial_items"] {
    return this.items;
  }

  getDisplayOptions(): GT029Content["answer_options"] {
    return this.options;
  }

  isRoundClosedOnWrong(): boolean {
    return this.roundClosedOnWrong;
  }

  override isAcceptingInput(): boolean {
    return !(this.checkWinCondition() || this.roundClosedOnWrong);
  }

  setPointerOver(x: number, y: number): void {
    const clock = getGT029Clock(this);
    if (!this.isAcceptingInput()) {
      clock.hoveredId = null;
      return;
    }
    if (this.removedItemIds.size >= this.content.remove_count) {
      const totalItems = this.items.length;
      for (let i = 0; i < this.options.length; i++) {
        const slot = this.slots[totalItems + i];
        const opt = this.options[i];
        if (
          slot &&
          opt &&
          isPointInSlot(slot, x, y, "square", TAP_TOLERANCE_PX)
        ) {
          clock.hoveredId = opt.option_id;
          return;
        }
      }
    }
    for (let i = 0; i < this.items.length; i++) {
      const slot = this.itemSlotFor(i);
      const item = this.items[i];
      if (
        slot &&
        item &&
        isPointInSlot(slot, x, y, "circle", TAP_TOLERANCE_PX)
      ) {
        clock.hoveredId = item.item_id;
        return;
      }
    }
    clock.hoveredId = null;
  }

  clearPointerOver(): void {
    getGT029Clock(this).hoveredId = null;
  }

  override destroy(): void {
    super.destroy();
    this.removedItemIds.clear();
    this.selectedOptionId = null;
    resetGT029Clock(this);
  }

  override onScaffoldEscalated(level: HintLevel): void {
    getGT029Clock(this).activeHintLevel = level;
  }

  onHintTriggered(level: HintLevel): void {
    getGT029Clock(this).activeHintLevel = level;
  }

  override onHintCleared(): void {
    getGT029Clock(this).activeHintLevel = 0;
  }

  update(deltaMs: number): void {
    if (this.reactionRemainingMs > 0) {
      this.reactionRemainingMs = Math.max(
        0,
        this.reactionRemainingMs - deltaMs
      );
    }
    const clock = getGT029Clock(this);
    clock.logicMs += deltaMs;

    if (
      !this.roundClosedOnWrong &&
      clock.wrongOptionStamp &&
      elapsedSince(clock.wrongOptionStamp, clock) >= WRONG_FLASH_DURATION_MS
    ) {
      clock.wrongOptionStamp = null;
      this.selectedOptionId = null;
    }
    if (
      clock.wrongItemStamp &&
      elapsedSince(clock.wrongItemStamp, clock) >= WRONG_FLASH_DURATION_MS
    ) {
      clock.wrongItemStamp = null;
      clock.wrongItemId = null;
    }
    if (
      this.degradation?.particles_enabled !== false &&
      clock.particles.length > 0
    ) {
      clock.particles = updateParticles(clock.particles);
    }
  }

  setupEntities(): void {
    this.removedItemIds.clear();
    this.selectedOptionId = null;
    this.isWin = false;
    this.isWon = false;
    this.roundClosedOnWrong = false;
    this.reactionPose = null;
    this.reactionRemainingMs = 0;

    this.items = resolveDisplayItems(
      this.content,
      this.difficulty,
      this.layoutSeed,
      this.roundGeneration
    );
    this.options = resolveDisplayOptions(
      this.content,
      this.layoutSeed,
      this.roundGeneration
    );

    const clock = resetGT029Clock(this);
    this.items.forEach((it, i) => {
      clock.itemCellTo.set(it.item_id, i);
    });

    this.recordEvent("game_started", {
      template_code: "GT-029",
      initial_count: this.items.length,
      remove_count: this.content.remove_count,
    });
  }

  itemCellIndex(itemIndex: number): number {
    const item = this.items[itemIndex];
    if (!item) {
      return itemIndex;
    }
    const removedOrder = [...this.removedItemIds];
    const removedRank = removedOrder.indexOf(item.item_id);
    if (removedRank >= 0) {
      return this.items.length - 1 - removedRank;
    }
    let remainingRank = 0;
    for (let i = 0; i < itemIndex; i++) {
      const other = this.items[i];
      if (other && !this.removedItemIds.has(other.item_id)) {
        remainingRank++;
      }
    }
    return remainingRank;
  }

  private syncSlide(): void {
    const clock = getGT029Clock(this);
    const moved: [string, number, number][] = [];
    this.items.forEach((it, i) => {
      const cell = this.itemCellIndex(i);
      const prev = clock.itemCellTo.get(it.item_id) ?? cell;
      if (cell !== prev) {
        moved.push([it.item_id, prev, cell]);
      }
    });
    if (moved.length === 0) {
      return;
    }
    clock.itemSlideFrom.clear();
    for (const [id, prev, cell] of moved) {
      const from = this.slots[prev];
      if (from) {
        clock.itemSlideFrom.set(id, { x: from.x, y: from.y });
      }
      clock.itemCellTo.set(id, cell);
    }
    clock.slideStartStamp = makeStamp(clock);
  }

  itemSlotFor(itemIndex: number): Slot | undefined {
    return this.slots[this.itemCellIndex(itemIndex)];
  }

  override getHintTargetIndex(): number | null {
    return resolveGT029HintTargetIndex(this);
  }

  override getHintDestinationIndex(): number | null {
    return null;
  }

  override getHintTargetForLevel(level: HintLevel): HintTarget | null {
    return resolveGT029HintTargetForLevel(this, level);
  }

  override getHintDemoSequence(
    level: HintLevel
  ): readonly HintDemoStep[] | null {
    return resolveGT029DemoSequence(this, level);
  }

  protected computeSlots(band: AgeBand): readonly Slot[] {
    return computeGT029Slots({
      ageBand: band,
      cssPerLogic: this.cssPerLogic,
      logic: this.logicSpace,
      optionCount: this.content.answer_options.length,
      stageRect: this.stageRect,
      totalItems: this.content.initial_items.length,
    });
  }

  private handleItemRemoval(itemId: string): ActionResult {
    const itemExists = this.items.some((it) => it.item_id === itemId);
    if (!itemExists) {
      return ACTION_IGNORED;
    }
    const clock = getGT029Clock(this);
    clock.activeHintLevel = 0;

    if (this.removedItemIds.has(itemId)) {
      this.removedItemIds.delete(itemId);
      this.syncSlide();
      this.selectedOptionId = null;
      this.recordEvent("item_restored", {
        item_id: itemId,
        removed_count: this.removedItemIds.size,
        remaining_needed: this.content.remove_count - this.removedItemIds.size,
      });
      return ACTION_QUIET_OK;
    }

    if (this.removedItemIds.size >= this.content.remove_count) {
      clock.wrongItemId = itemId;
      clock.wrongItemStamp = makeStamp(clock);
      if (this.difficulty.allow_retry === false) {
        this.roundClosedOnWrong = true;
        clock.closeStamp = makeStamp(clock);
        this.completeSession();
      }
      return ACTION_RETRY;
    }

    this.removedItemIds.add(itemId);
    this.syncSlide();
    clock.lastBiteStamp = makeStamp(clock);
    this.queueSfx("cat_munch");
    this.react("cheer", GT029_MUNCH_MS);
    this.recordEvent("item_removed", {
      item_id: itemId,
      removed_count: this.removedItemIds.size,
      target_remove_count: this.content.remove_count,
    });

    return ACTION_QUIET_OK;
  }

  private handleOptionSelection(data: GT029ActionPayload): ActionResult {
    const optionId =
      data.option_id ??
      data.id ??
      (data.value === undefined ? "" : `opt_${data.value}`);

    const option = this.options.find(
      (o) =>
        o.option_id === optionId ||
        (data.value !== undefined && o.value === data.value)
    );
    if (!option) {
      return ACTION_IGNORED;
    }
    if (this.removedItemIds.size < this.content.remove_count) {
      return ACTION_RETRY;
    }

    const clock = getGT029Clock(this);
    clock.activeHintLevel = 0;
    this.selectedOptionId = option.option_id;
    this.recordEvent("answer_selected", {
      option_id: option.option_id,
      value: option.value,
      is_correct: option.is_correct,
    });

    if (option.is_correct) {
      this.isWin = true;
      this.isWon = true;
      clock.winStamp = makeStamp(clock);
      const optIndex = this.options.indexOf(option);
      const slot = this.slots[this.items.length + optIndex];
      if (slot) {
        clock.particles.push(...spawnParticlesAtSlot(slot, 12));
      }
      this.recordEvent("game_completed", { score: 100 });
      this.winSession();
      return ACTION_CORRECT;
    }

    clock.wrongOptionStamp = makeStamp(clock);
    this.react("wonder", GT029_WONDER_MS);
    if (this.difficulty.allow_retry === false) {
      this.roundClosedOnWrong = true;
      clock.closeStamp = makeStamp(clock);
      this.completeSession();
    }
    return ACTION_RETRY;
  }

  private validateItemRemovalAction(data: GT029ActionPayload): ActionResult {
    const itemId = data.item_id ?? data.id;
    if (!itemId) {
      return ACTION_IGNORED;
    }
    const itemExists = this.items.some((it) => it.item_id === itemId);
    if (!itemExists) {
      return ACTION_IGNORED;
    }
    if (this.removedItemIds.has(itemId)) {
      return ACTION_QUIET_OK;
    }
    if (this.removedItemIds.size >= this.content.remove_count) {
      return ACTION_RETRY;
    }
    return ACTION_QUIET_OK;
  }

  private validateOptionSelectionAction(
    data: GT029ActionPayload
  ): ActionResult {
    const optionId =
      data.option_id ??
      data.id ??
      (data.value === undefined ? "" : `opt_${data.value}`);

    const option = this.options.find(
      (o) =>
        o.option_id === optionId ||
        (data.value !== undefined && o.value === data.value)
    );
    if (!option) {
      return ACTION_IGNORED;
    }
    if (this.removedItemIds.size < this.content.remove_count) {
      return ACTION_QUIET_OK;
    }
    return option.is_correct ? ACTION_CORRECT : ACTION_RETRY;
  }

  validateAction(action: GameAction): ActionResult {
    if (!this.isAcceptingInput()) {
      return ACTION_IGNORED;
    }
    const type = action.type;
    const data = narrowActionPayload(action);

    if (
      type === "remove_item" ||
      type === "tap_item" ||
      type === "select_item"
    ) {
      return this.validateItemRemovalAction(data);
    }
    if (type === "select_option" || type === "choose_answer") {
      return this.validateOptionSelectionAction(data);
    }
    return ACTION_IGNORED;
  }

  private findTappedOption(
    gesture: Extract<Gesture, { type: "tap" }>
  ): GameAction | null {
    if (this.removedItemIds.size < this.content.remove_count) {
      return null;
    }
    const totalItems = this.items.length;
    for (let i = 0; i < this.options.length; i++) {
      const slot = this.slots[totalItems + i];
      const opt = this.options[i];
      if (!(slot && opt)) {
        continue;
      }
      if (
        isPointInSlot(slot, gesture.x, gesture.y, "square", TAP_TOLERANCE_PX)
      ) {
        return {
          type: "select_option",
          data: { option_id: opt.option_id, value: opt.value },
        };
      }
    }
    return null;
  }

  private findTappedItem(
    gesture: Extract<Gesture, { type: "tap" }>
  ): GameAction | null {
    for (let i = 0; i < this.items.length; i++) {
      const slot = this.itemSlotFor(i);
      const item = this.items[i];
      if (!(slot && item)) {
        continue;
      }
      if (
        isPointInSlot(slot, gesture.x, gesture.y, "circle", TAP_TOLERANCE_PX)
      ) {
        return {
          type: "remove_item",
          data: { item_id: item.item_id },
        };
      }
    }
    return null;
  }

  private findDroppedItem(
    gesture: Extract<Gesture, { type: "drop" }>
  ): GameAction | null {
    for (let i = 0; i < this.items.length; i++) {
      const slot = this.itemSlotFor(i);
      const item = this.items[i];
      if (!(slot && item)) {
        continue;
      }
      if (
        isPointInSlot(
          slot,
          gesture.fromX,
          gesture.fromY,
          "circle",
          TAP_TOLERANCE_PX
        )
      ) {
        const dragDist = Math.hypot(gesture.toX - slot.x, gesture.toY - slot.y);
        if (dragDist <= slot.w / 2) {
          return null;
        }
        return {
          type: "remove_item",
          data: { item_id: item.item_id },
        };
      }
    }
    return null;
  }

  override toAction(gesture: Gesture): GameAction | null {
    if (!this.isAcceptingInput()) {
      return null;
    }
    if (gesture.type === "drop") {
      return this.findDroppedItem(gesture);
    }
    if (gesture.type !== "tap") {
      return null;
    }
    return this.findTappedOption(gesture) ?? this.findTappedItem(gesture);
  }

  override commit(action: GameAction): void {
    if (!this.isAcceptingInput()) {
      return;
    }
    const type = action.type;
    const data = narrowActionPayload(action);

    if (
      type === "remove_item" ||
      type === "tap_item" ||
      type === "select_item"
    ) {
      const itemId = data.item_id ?? data.id;
      if (typeof itemId === "string") {
        this.handleItemRemoval(itemId);
      }
      return;
    }

    if (type === "select_option" || type === "choose_answer") {
      this.handleOptionSelection(data);
    }
  }

  override getView(): EngineView {
    return buildGT029View(this);
  }

  override checkWinCondition(): boolean {
    return (this.isWin || this.isWon) && !this.roundClosedOnWrong;
  }

  getRemovedCount(): number {
    return this.removedItemIds.size;
  }

  getRemainingCount(): number {
    return this.items.length - this.removedItemIds.size;
  }

  getRemovedDockRects(): ZoneRect[] {
    const removedSlots: Slot[] = [];
    const groupSlots: Slot[] = [];
    this.items.forEach((it, i) => {
      const slot = this.itemSlotFor(i);
      if (slot) {
        (this.removedItemIds.has(it.item_id) ? removedSlots : groupSlots).push(
          slot
        );
      }
    });
    const body = this.stageRect ? splitCaption(this.stageRect).body : undefined;
    return computeRemovedDockRects(removedSlots, groupSlots, body);
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    renderGT029Frame(ctx, rs, this, timeMs);
  }
}
