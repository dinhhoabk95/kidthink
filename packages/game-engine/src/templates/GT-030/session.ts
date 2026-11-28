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
import {
  findHitSlotIndex,
  isPointInSlot,
  TAP_TOLERANCE_PX,
} from "#src/layout/hit-test.js";
import type { Slot } from "#src/layout/types";
import { spawnParticlesAtSlot, updateParticles } from "#src/render/index.js";
import type { MascotPose } from "#src/render/mascot";
import type { DegradationState } from "#src/systems/degradation";
import { MoodPulse } from "#src/systems/mood-pulse";
import type { RenderSystem } from "#src/systems/render-system";
import {
  buildGT030View,
  type GapFlash,
  type GT030AnswerOption,
  type GT030LayoutHost,
  getGT030Clock,
  renderGT030Frame,
  resetGT030Clock,
  resolveDisplayOptions,
  resolveGT030HintDemoSequence,
  resolveGT030HintDestinationIndex,
  resolveGT030HintTargetForLevel,
  resolveGT030HintTargetIndex,
} from "./layout.js";
import type { GT030Content, GT030Difficulty } from "./template.js";
import {
  computeGT030Slots,
  FIRST_OPTION_SLOT,
  SOURCE_SLOT,
  STRIP_SLOT,
} from "./zone-layout.js";

export type { GapFlash } from "./layout.js";

interface GT030ActionPayload {
  readonly id?: string;
  /** Độ lệch ngang có dấu (px) giữa chỗ thả và mép cần nối; thiếu = đặt đúng mép. */
  readonly offset_px?: number;
  readonly option_id?: string;
  readonly value?: number;
}

/** Dung sai bám dính tối thiểu (px) để ngón tay run nhẹ vẫn bám (`BR-E030-05`). */
const MIN_SNAP_PX = 8;
/** Thời gian khe/chồng còn hiện (ms). */
const GAP_FLASH_MS = 1500;

/** Khung chuyện đọc một lần ở vòng đầu (`BR-E030-07`, `BR-FBK-16`). */
export const GT030_STORY_LINE =
  "Sâu Nhỏ muốn biết mọi thứ dài bao nhiêu. Bé xếp các đơn vị nối liền nhau để đo giúp Sâu Nhỏ nhé!";

/** Mascot vui sau mỗi đơn vị nối khít. */
export const GT030_HAPPY_MS = 700;
/** Mascot nghiêng đầu sau khe/chồng hoặc số đo chưa đúng. */
export const GT030_WONDER_MS = 1500;

function parseGT030ActionPayload(raw: GameAction["data"]): GT030ActionPayload {
  if (typeof raw !== "object" || raw === null) {
    return {};
  }
  const optionId = Reflect.get(raw, "option_id");
  const id = Reflect.get(raw, "id");
  const value = Reflect.get(raw, "value");
  const offsetPx = Reflect.get(raw, "offset_px");
  return {
    ...(typeof optionId === "string" ? { option_id: optionId } : {}),
    ...(typeof id === "string" ? { id } : {}),
    ...(typeof value === "number" ? { value } : {}),
    ...(typeof offsetPx === "number" ? { offset_px: offsetPx } : {}),
  };
}

export class GT030Session
  extends TemplateGameSession<GT030Content, GT030Difficulty>
  implements GT030LayoutHost
{
  override readonly needsTray = true;

  /** Số vật nguồn trong khay của vòng — shell đo chiều cao khay (`BR-PSZ-13`). */
  override get trayItemCount(): number {
    return 1;
  }

  /** Nhãn dụng cụ vẽ dưới vật trong khay (`BR-PSZ-13`). */
  override get trayHasLabels(): boolean {
    return true;
  }
  override readonly usesPromptZone = true;

  degradation: DegradationState | null = null;
  displayOptions: readonly GT030AnswerOption[];
  placedUnitsCount = 0;
  selectedOptionId: string | null = null;
  roundClosedOnWrong = false;
  isWin = false;

  private gapFlash: (GapFlash & { readonly untilMs: number }) | null = null;
  private readonly mood = new MoodPulse();

  constructor(
    content: GT030Content,
    difficulty: GT030Difficulty,
    layoutSeed = 0,
    themeId?: string
  ) {
    super(content, difficulty, layoutSeed, themeId);
    this.displayOptions = [...content.answer_options];
  }

  override storyLine(): string {
    return GT030_STORY_LINE;
  }

  /** Chỉ phản ứng sau khi đặt hoặc chọn số đo, không báo trước (`BR-E030-07`). */
  override mascotMood(): MascotPose | null {
    return this.isWon ? null : this.mood.current();
  }

  override isAcceptingInput(): boolean {
    return !(this.isWin || this.isWon || this.roundClosedOnWrong);
  }

  isRoundClosedOnWrong(): boolean {
    return this.roundClosedOnWrong;
  }

  getDisplayOptions(): readonly GT030AnswerOption[] {
    return this.displayOptions;
  }

  getSelectedOptionId(): string | null {
    return this.selectedOptionId;
  }

  override onScaffoldEscalated(
    level: HintLevel,
    _trigger: "timer" | "miss_streak"
  ): void {
    getGT030Clock(this).activeHintLevel = level;
  }

  onHintTriggered(level: HintLevel): void {
    getGT030Clock(this).activeHintLevel = level;
  }

  override onHintCleared(): void {
    getGT030Clock(this).activeHintLevel = 0;
  }

  setPointerOver(x: number, y: number): void {
    const clock = getGT030Clock(this);
    if (!this.isAcceptingInput()) {
      clock.hoveredSlot = null;
      return;
    }
    const targetLength = this.content.object.length_in_units;
    if (this.placedUnitsCount >= targetLength) {
      for (let i = 0; i < this.displayOptions.length; i++) {
        const slotIdx = FIRST_OPTION_SLOT + i;
        const slot = this.slots[slotIdx];
        if (slot && isPointInSlot(slot, x, y, "square", TAP_TOLERANCE_PX)) {
          clock.hoveredSlot = slotIdx;
          return;
        }
      }
    }
    const source = this.slots[SOURCE_SLOT];
    if (source && isPointInSlot(source, x, y, "square", TAP_TOLERANCE_PX)) {
      clock.hoveredSlot = SOURCE_SLOT;
      return;
    }
    const strip = this.slots[STRIP_SLOT];
    if (strip && isPointInSlot(strip, x, y, "square", TAP_TOLERANCE_PX)) {
      clock.hoveredSlot = STRIP_SLOT;
      return;
    }
    clock.hoveredSlot = null;
  }

  clearPointerOver(): void {
    getGT030Clock(this).hoveredSlot = null;
  }

  update(deltaMs: number): void {
    const clock = getGT030Clock(this);
    clock.elapsedMs += deltaMs;
    clock.animalElapsedMs += deltaMs;
    if (clock.particles.length > 0) {
      clock.particles = updateParticles(clock.particles);
    }
    this.mood.tick(deltaMs);
    this.expireWrongFlashes(clock.elapsedMs);
    this.expireGapFlash(clock.elapsedMs);
  }

  /** Hết nhịp sai thì ô đáp án về trung tính (cùng đồng hồ khung với lúc kích). */
  private expireWrongFlashes(nowMs: number): void {
    const clock = getGT030Clock(this);
    if (clock.wrongOptionFlash.hasExpired(nowMs)) {
      clock.wrongOptionFlash.clear();
      if (!this.roundClosedOnWrong) {
        this.selectedOptionId = null;
      }
    }
    if (clock.wrongPlaceFlash.hasExpired(nowMs)) {
      clock.wrongPlaceFlash.clear();
    }
  }

  private expireGapFlash(nowMs: number): void {
    if (this.gapFlash && nowMs >= this.gapFlash.untilMs) {
      this.gapFlash = null;
    }
  }

  /** Khe/chồng đang hiện, hoặc `null`. */
  getGapFlash(): GapFlash | null {
    return this.gapFlash
      ? {
          kind: this.gapFlash.kind,
          slotIndex: this.gapFlash.slotIndex,
          widthPx: this.gapFlash.widthPx,
        }
      : null;
  }

  /** Cạnh một đơn vị trên dải đo (px logic); 0 khi chưa dựng bố cục. */
  getUnitWidth(): number {
    const strip = this.slots[STRIP_SLOT];
    return strip ? strip.w / this.content.object.length_in_units : 0;
  }

  /** Hoành độ tâm ô thứ `i` (từ 0) trên dải đo: đơn vị nối liền từ mép trái. */
  getCellCenterX(i: number): number {
    const strip = this.slots[STRIP_SLOT];
    if (!strip) {
      return 0;
    }
    const u = this.getUnitWidth();
    return strip.x - strip.w / 2 + (i + 0.5) * u;
  }

  /** Dung sai bám dính (px) quanh mép cần nối: `gap_tolerance_pct` của cạnh đơn vị. */
  private snapTolerancePx(): number {
    return Math.max(
      MIN_SNAP_PX,
      (this.getUnitWidth() * this.difficulty.gap_tolerance_pct) / 100
    );
  }

  /** Tâm ô kế tiếp trên dải đo (chỗ đơn vị tiếp theo nối vào), hoặc `null`. */
  getNextCellCenter(): { readonly x: number; readonly y: number } | null {
    const strip = this.slots[STRIP_SLOT];
    return strip
      ? { x: this.getCellCenterX(this.placedUnitsCount), y: strip.y }
      : null;
  }

  setupEntities(): void {
    this.placedUnitsCount = 0;
    this.selectedOptionId = null;
    this.roundClosedOnWrong = false;
    this.isWin = false;
    this.mood.clear();
    this.gapFlash = null;
    resetGT030Clock(this);
    this.displayOptions = resolveDisplayOptions(
      this.content.answer_options,
      this.displayOptions,
      this.layoutSeed,
      this.roundGeneration
    );
    this.recordEvent("game_started", {
      template_code: "GT-030",
      target_length: this.content.object.length_in_units,
      unit_id: this.content.unit.unit_id,
    });
  }

  override destroy(): void {
    resetGT030Clock(this);
    super.destroy();
  }

  override getHintTargetIndex(): number | null {
    return resolveGT030HintTargetIndex(this);
  }

  /** Đơn vị phải kéo tới dải đo cho tới khi xếp đủ. */
  override getHintDestinationIndex(): number | null {
    return resolveGT030HintDestinationIndex(this);
  }

  /**
   * Bàn tay ma kéo dọc dải đo tới mép: đích là tâm ô kế tiếp (chỗ đơn vị sau nối
   * liền vào mép các đơn vị đã đặt), không phải giữa dải (`BR-E030-10`).
   */
  override getHintDestinationPoint(): {
    readonly x: number;
    readonly y: number;
  } | null {
    return this.getHintDestinationIndex() === null
      ? null
      : this.getNextCellCenter();
  }

  override getHintTargetForLevel(level: HintLevel): HintTarget | null {
    getGT030Clock(this).activeHintLevel = level;
    return resolveGT030HintTargetForLevel(this, level);
  }

  override getHintDemoSequence(
    level: HintLevel
  ): readonly HintDemoStep[] | null {
    return resolveGT030HintDemoSequence(this, level);
  }

  protected computeSlots(band: AgeBand): readonly Slot[] {
    return computeGT030Slots(this, band);
  }

  private resolveOption(
    data: GT030ActionPayload
  ): GT030AnswerOption | undefined {
    const optionId =
      data.option_id ??
      data.id ??
      (data.value === undefined ? "" : `opt_${data.value}`);
    return this.displayOptions.find(
      (o) =>
        o.option_id === optionId ||
        (data.value !== undefined && o.value === data.value)
    );
  }

  private validatePlaceAction(data: GT030ActionPayload): ActionResult {
    if (this.placedUnitsCount >= this.content.object.length_in_units) {
      return ACTION_RETRY;
    }
    if (
      data.offset_px !== undefined &&
      Math.abs(data.offset_px) > this.snapTolerancePx()
    ) {
      return ACTION_RETRY;
    }
    return ACTION_QUIET_OK;
  }

  private validateRemoveAction(): ActionResult {
    if (this.placedUnitsCount <= 0) {
      return ACTION_IGNORED;
    }
    return ACTION_QUIET_OK;
  }

  private validateOptionAction(data: GT030ActionPayload): ActionResult {
    if (this.placedUnitsCount < this.content.object.length_in_units) {
      return ACTION_QUIET_OK;
    }
    const option = this.resolveOption(data);
    if (!option) {
      return ACTION_IGNORED;
    }
    return option.is_correct ? ACTION_CORRECT : ACTION_RETRY;
  }

  validateAction(action: GameAction): ActionResult {
    if (!this.isAcceptingInput()) {
      return ACTION_IGNORED;
    }
    const type = action.type;
    const data = parseGT030ActionPayload(action.data);

    if (
      type === "place_unit" ||
      type === "tap_unit" ||
      type === "drag_unit" ||
      type === "snap_unit"
    ) {
      return this.validatePlaceAction(data);
    }

    if (type === "remove_unit" || type === "undo_unit") {
      return this.validateRemoveAction();
    }

    if (type === "select_option" || type === "choose_answer") {
      return this.validateOptionAction(data);
    }

    return ACTION_IGNORED;
  }

  private commitOptionSelection(data: GT030ActionPayload): void {
    const targetLength = this.content.object.length_in_units;
    if (this.placedUnitsCount < targetLength) {
      return;
    }
    const option = this.resolveOption(data);
    if (!option) {
      return;
    }

    const clock = getGT030Clock(this);
    clock.activeHintLevel = 0;
    clock.hoveredSlot = null;
    this.selectedOptionId = option.option_id;
    this.recordEvent("answer_selected", {
      option_id: option.option_id,
      value: option.value,
      is_correct: option.is_correct,
    });

    if (option.is_correct) {
      this.isWin = true;
      this.isWon = true;
      clock.winAtMs = clock.elapsedMs;
      const optIndex = this.displayOptions.indexOf(option);
      const slotIndex = FIRST_OPTION_SLOT + optIndex;
      const slot = this.slots[slotIndex];
      if (slot && this.degradation?.particles_enabled !== false) {
        clock.particles.push(...spawnParticlesAtSlot(slot, 12));
      }
      this.recordEvent("game_completed", { score: 100 });
      this.winSession();
    } else {
      clock.wrongOptionFlash.trigger(clock.elapsedMs);
      this.mood.set("wonder", GT030_WONDER_MS);
      if (this.difficulty.allow_retry === false) {
        this.roundClosedOnWrong = true;
        clock.closeAtMs = clock.elapsedMs;
        this.recordEvent("game_completed", { score: 0 });
        this.completeSession();
      }
    }
  }

  /** Một lần thả: bám dính khi đủ gần mép, không thì để lại khe/chồng nhìn thấy. */
  private commitPlace(offset: number | undefined): void {
    const clock = getGT030Clock(this);
    const targetLength = this.content.object.length_in_units;
    if (this.placedUnitsCount >= targetLength) {
      clock.wrongPlaceFlash.trigger(clock.elapsedMs);
      return;
    }
    if (offset !== undefined && Math.abs(offset) > this.snapTolerancePx()) {
      const unit = this.getUnitWidth();
      this.gapFlash = {
        kind: offset > 0 ? "gap" : "overlap",
        slotIndex: STRIP_SLOT,
        widthPx: Math.min(Math.abs(offset), unit || Math.abs(offset)),
        untilMs: clock.elapsedMs + GAP_FLASH_MS,
      };
      this.mood.set("wonder", GT030_WONDER_MS);
      return;
    }
    this.gapFlash = null;
    clock.activeHintLevel = 0;
    clock.lastSnapAtMs = clock.elapsedMs;
    this.placedUnitsCount++;
    this.queueSfx("clip_link");
    this.mood.set("happy", GT030_HAPPY_MS);
    this.recordEvent("unit_placed", {
      slot_index: this.placedUnitsCount,
      placed_count: this.placedUnitsCount,
      target_count: targetLength,
    });
  }

  override commit(action: GameAction): void {
    if (!this.isAcceptingInput()) {
      return;
    }
    const type = action.type;
    const data = parseGT030ActionPayload(action.data);

    if (
      type === "place_unit" ||
      type === "tap_unit" ||
      type === "drag_unit" ||
      type === "snap_unit"
    ) {
      this.commitPlace(data.offset_px);
      return;
    }

    if (type === "remove_unit" || type === "undo_unit") {
      if (this.placedUnitsCount > 0) {
        const removedIndex = this.placedUnitsCount;
        this.placedUnitsCount--;
        this.selectedOptionId = null;
        getGT030Clock(this).activeHintLevel = 0;
        this.recordEvent("unit_removed", {
          slot_index: removedIndex,
          placed_count: this.placedUnitsCount,
        });
      }
      return;
    }

    if (type === "select_option" || type === "choose_answer") {
      this.commitOptionSelection(data);
    }
  }

  /** Đích chạm khay và đáp án; chọn theo tâm gần nhất (`BR-ENG-06`). */
  private tapTargets(): { slot: Slot; action: GameAction }[] {
    const targetLength = this.content.object.length_in_units;
    const targets: { slot: Slot; action: GameAction }[] = [];
    const source = this.slots[SOURCE_SLOT];
    if (source) {
      targets.push({ slot: source, action: { type: "place_unit", data: {} } });
    }
    if (this.placedUnitsCount >= targetLength) {
      this.displayOptions.forEach((opt, i) => {
        const slot = this.slots[FIRST_OPTION_SLOT + i];
        if (slot) {
          targets.push({
            slot,
            action: {
              type: "select_option",
              data: { option_id: opt.option_id, value: opt.value },
            },
          });
        }
      });
    }
    return targets;
  }

  /** Chạm dải đo: phần đã đặt gỡ đơn vị cuối, phần trống đặt đúng mép kế. */
  private toStripTap(
    gesture: Extract<Gesture, { type: "tap" }>
  ): GameAction | null {
    const strip = this.slots[STRIP_SLOT];
    if (
      !(
        strip &&
        isPointInSlot(strip, gesture.x, gesture.y, "square", TAP_TOLERANCE_PX)
      )
    ) {
      return null;
    }
    const placedEdgeX =
      strip.x - strip.w / 2 + this.placedUnitsCount * this.getUnitWidth();
    if (this.placedUnitsCount > 0 && gesture.x < placedEdgeX) {
      return { type: "remove_unit", data: {} };
    }
    return { type: "place_unit", data: {} };
  }

  private toTapAction(
    gesture: Extract<Gesture, { type: "tap" }>
  ): GameAction | null {
    const targets = this.tapTargets();
    const index = findHitSlotIndex(
      targets.map((t) => t.slot),
      gesture.x,
      gesture.y,
      "square",
      TAP_TOLERANCE_PX
    );
    return targets[index]?.action ?? this.toStripTap(gesture);
  }

  /**
   * Kéo từ khay đơn vị lên dải đo (`BR-ENG-06`, `BR-E030-08`): một lần thả là
   * một đơn vị. Chỗ thả tự do dọc dải; lệch bao nhiêu so với mép cần nối thì
   * mang theo `offset_px`. Cặp chạm–chạm của shell (tâm khay → tâm dải) là đặt đúng mép.
   */
  private toDropAction(
    gesture: Extract<Gesture, { type: "drop" }>
  ): GameAction | null {
    const source = this.slots[SOURCE_SLOT];
    const strip = this.slots[STRIP_SLOT];
    if (!(source && strip)) {
      return null;
    }
    if (
      !isPointInSlot(
        source,
        gesture.fromX,
        gesture.fromY,
        "square",
        TAP_TOLERANCE_PX
      )
    ) {
      return null;
    }
    if (this.placedUnitsCount >= this.content.object.length_in_units) {
      return { type: "place_unit", data: {} };
    }
    const stagedTap =
      gesture.fromX === source.x &&
      gesture.fromY === source.y &&
      gesture.toX === strip.x &&
      gesture.toY === strip.y;
    if (stagedTap) {
      return { type: "place_unit", data: {} };
    }
    if (Math.abs(gesture.toY - strip.y) > strip.hitH / 2 + TAP_TOLERANCE_PX) {
      return null;
    }
    const offset = Math.round(
      gesture.toX - this.getCellCenterX(this.placedUnitsCount)
    );
    // `BR-ENG-19`, `BR-E030-06`: thả trong vùng hút thì engine tự căn vào mép.
    if (Math.abs(offset) <= this.dropSnapRadiusPx(strip)) {
      return { type: "place_unit", data: {} };
    }
    return { type: "place_unit", data: { offset_px: offset } };
  }

  /**
   * Vùng hút quanh tâm ô kế tiếp: dung sai `gap_tolerance_pct`, nhưng không hẹp
   * hơn nửa sàn chạm của band, và không rộng quá nửa cạnh đơn vị — chiều cao vùng chạm của dải đo chính là sàn
   * chạm theo band (`BR-E030-08`).
   */
  private dropSnapRadiusPx(strip: Slot): number {
    return Math.max(
      this.snapTolerancePx(),
      Math.min(strip.hitH / 2, this.getUnitWidth() / 2)
    );
  }

  override toAction(gesture: Gesture): GameAction | null {
    if (!this.isAcceptingInput()) {
      return null;
    }
    if (gesture.type === "drop") {
      return this.toDropAction(gesture);
    }
    return gesture.type === "tap" ? this.toTapAction(gesture) : null;
  }

  override getView(): EngineView {
    return buildGT030View(this);
  }

  override checkWinCondition(): boolean {
    return this.isWin || this.isWon;
  }

  getPlacedUnitsCount(): number {
    return this.placedUnitsCount;
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    _timeMs: number
  ): void {
    renderGT030Frame(this, ctx, rs);
  }
}
