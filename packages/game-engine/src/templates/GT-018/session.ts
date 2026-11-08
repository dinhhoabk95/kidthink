import type { AgeBand } from "#src/contracts/types";
import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  type HintTarget,
  TemplateGameSession,
} from "#src/game-session";
import type {
  EngineView,
  EntityVisual,
  Gesture,
  ViewEntity,
} from "#src/interaction";
import { resolveAssetLabels } from "#src/labels/spoken-keyword";
import {
  findHitSlotIndex as findHitIndex,
  TAP_TOLERANCE_PX,
} from "#src/layout/hit-test";
import { computeMutedStripLayout } from "#src/layout/muted-strip";
import { resolveLayout } from "#src/layout/registry";
import {
  dockRectAroundSlots,
  insetDrawSize,
  splitCaption,
  splitFigure,
} from "#src/layout/slot-fit";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import { OrderingMechanic } from "#src/mechanics/ordering-mechanic";
import { SelectionMechanic } from "#src/mechanics/selection-mechanic";
import {
  drawGlyphInSlot,
  drawGramophone,
  drawSceneBackground,
  drawSlotItem,
  drawStripChipCard,
  drawSubPromptText,
  drawWoodenTokenDock,
} from "#src/render/index";
import type { MascotPose } from "#src/render/mascot";
import type { DegradationState } from "#src/systems/degradation";
import type { RenderSystem } from "#src/systems/render-system";
import { WrongFlash } from "#src/systems/wrong-flash";
import type { GT018Content, GT018Difficulty } from "./template";

/** Cạnh vuông của máy hát (logic px). */
const GRAMOPHONE_SIZE_PX = 130;

function findHitOptionId(
  slots: readonly Slot[],
  options: readonly { item_id: string }[],
  x: number,
  y: number
): string | null {
  const index = findHitIndex(
    slots.slice(0, options.length),
    x,
    y,
    "circle",
    TAP_TOLERANCE_PX
  );
  return index >= 0 ? (options[index]?.item_id ?? null) : null;
}

/** Khung chuyện đọc một lần ở vòng đầu (`BR-E018-04`, `BR-FBK-16`). */
export const GT018_STORY_LINE =
  "Thỏ bảo: bé nghe thật kỹ rồi làm đúng theo lời Thỏ nhé!";

/** Mascot nhảy ngắn theo mỗi lần chạm hoặc xếp, đúng hay sai như nhau. */
export const GT018_HOP_MS = 600;
/** Mascot nghiêng đầu "nghe lại nhé" sau một đáp án chưa đúng. */
export const GT018_WONDER_MS = 1500;

export class GT018Session extends TemplateGameSession<
  GT018Content,
  GT018Difficulty
> {
  degradation: DegradationState | null = null;

  private readonly selectionMechanic = new SelectionMechanic({
    mode: "single",
  });
  private readonly orderingMechanic = new OrderingMechanic();
  selectedItemId: string | null = null;
  private readonly wrongFlash = new WrongFlash();
  private lastFrameMs = 0;
  private wrongItemId: string | null = null;
  private isSequenceWrong = false;
  private stagedStepIndex: number | null = null;
  private reactionPose: MascotPose | null = null;
  private reactionRemainingMs = 0;

  override readonly usesPromptZone = true;

  /**
   * Nút ở `zones.action` chỉ có khi trẻ xếp thứ tự (`response_mode === "sequence"`):
   * `commit` → `submit_order`. Chế độ chọn chấm ngay khi chạm (`BR-PSZ-05`).
   */
  override readonly needsCommit: boolean;

  constructor(
    content: GT018Content,
    difficulty: GT018Difficulty,
    layoutSeed = 0,
    themeId?: string
  ) {
    super(content, difficulty, layoutSeed, themeId);
    this.needsCommit = content.response_mode === "sequence";
  }

  setupEntities(): void {
    this.isWon = false;
    this.selectedItemId = null;
    this.wrongFlash.clear();
    this.lastFrameMs = 0;
    this.wrongItemId = null;
    this.isSequenceWrong = false;
    this.stagedStepIndex = null;
    this.reactionPose = null;
    this.reactionRemainingMs = 0;
    this.selectionMechanic.reset();

    if (this.content.response_mode === "sequence") {
      const initialSeq = this.content.options.map((opt) => opt.item_id);
      this.orderingMechanic.setInitialSequence(initialSeq);
    }

    this.recordEvent("round_started", {
      round_index: 0,
      mode: this.content.response_mode,
      item_count: this.content.options.length,
    });
  }

  validateAction(action: GameAction): ActionResult {
    if (this.content.response_mode === "sequence") {
      const targetSeq = this.content.target_sequence ?? [];
      if (action.type === "reorder_step") {
        return this.orderingMechanic.validate(action, targetSeq);
      }
      if (
        action.type === "submit_order" ||
        action.type === "sequence_submitted"
      ) {
        return this.orderingMechanic.validate(action, targetSeq);
      }
      return ACTION_IGNORED;
    }

    const items = this.content.options.map((opt) => ({
      id: opt.item_id,
      isCorrect: opt.is_correct === true,
    }));

    if (action.type === "tap_option" || action.type === "select_item") {
      return this.selectionMechanic.validate(action, items);
    }

    return ACTION_IGNORED;
  }

  onItemSelect(itemId: string): ActionResult {
    if (this.content.response_mode !== "select") {
      return ACTION_IGNORED;
    }
    this.selectedItemId = itemId;
    this.selectionMechanic.select(itemId);
    const option = this.content.options.find((opt) => opt.item_id === itemId);
    const isCorrect = option?.is_correct === true;

    this.recordEvent("item_selected", {
      item_id: itemId,
      is_correct: isCorrect,
    });

    if (isCorrect) {
      this.wrongFlash.clear();
      this.wrongItemId = null;
      this.queueSfx("rabbit_hop");
      this.recordEvent("round_completed", { round_index: 0 });
      this.winSession();
      return ACTION_CORRECT;
    }

    this.react("wonder", GT018_WONDER_MS);
    this.wrongFlash.trigger(this.lastFrameMs);
    this.wrongItemId = itemId;
    this.setRenderItemState(itemId, "wrong");
    return ACTION_RETRY;
  }

  onReorderStep(fromIndex: number, toIndex: number): boolean {
    if (this.content.response_mode !== "sequence") {
      return false;
    }
    const moved = this.orderingMechanic.reorder(fromIndex, toIndex);
    if (moved) {
      this.react("happy", GT018_HOP_MS);
    }
    return moved;
  }

  onSubmitSequence(): ActionResult {
    if (this.content.response_mode !== "sequence") {
      return ACTION_IGNORED;
    }
    const targetSeq = this.content.target_sequence ?? [];
    const isMatch = this.orderingMechanic.isSequenceCorrect(targetSeq);

    this.recordEvent("sequence_submitted", {
      is_correct: isMatch,
      sequence: this.orderingMechanic.getCurrentSequence(),
    });

    if (isMatch) {
      this.queueSfx("rabbit_hop");
      this.wrongFlash.clear();
      this.isSequenceWrong = false;
      this.recordEvent("round_completed", { round_index: 0 });
      this.winSession();
      return ACTION_CORRECT;
    }

    this.react("wonder", GT018_WONDER_MS);
    this.wrongFlash.trigger(this.lastFrameMs);
    this.isSequenceWrong = true;
    for (const opt of this.content.options) {
      this.setRenderItemState(opt.item_id, "wrong");
    }
    return ACTION_RETRY;
  }

  private clearWrongState(): void {
    if (this.wrongItemId) {
      this.setRenderItemState(this.wrongItemId, "idle");
      this.selectionMechanic.reset();
      if (this.selectedItemId === this.wrongItemId) {
        this.selectedItemId = null;
      }
      this.wrongItemId = null;
    }
    if (this.isSequenceWrong) {
      for (const opt of this.content.options) {
        this.setRenderItemState(opt.item_id, "idle");
      }
      this.isSequenceWrong = false;
    }
  }

  private react(pose: MascotPose, ms: number): void {
    this.reactionPose = pose;
    this.reactionRemainingMs = ms;
  }

  override storyLine(): string {
    return GT018_STORY_LINE;
  }

  /**
   * Nhảy theo lượt chạm hoặc xếp (đúng sai như nhau), nghiêng đầu sau đáp án
   * chưa đúng. Cấm — NEVER có dáng hay cue trước khi trẻ làm (`BR-E018-04`).
   */
  override mascotMood(): MascotPose | null {
    return this.reactionRemainingMs > 0 && !this.isWon
      ? this.reactionPose
      : null;
  }

  update(deltaMs: number): void {
    if (this.reactionRemainingMs > 0) {
      this.reactionRemainingMs = Math.max(
        0,
        this.reactionRemainingMs - deltaMs
      );
    }
    this.lastFrameMs += deltaMs;
    if (this.wrongFlash.hasExpired(this.lastFrameMs)) {
      this.wrongFlash.clear();
      this.clearWrongState();
    }
  }

  override destroy(): void {
    super.destroy();
    this.selectedItemId = null;
    this.wrongItemId = null;
    this.wrongFlash.clear();
    this.isSequenceWrong = false;
    this.stagedStepIndex = null;
  }

  override checkWinCondition(): boolean {
    if (this.content.response_mode === "sequence") {
      // Xếp đúng chưa đủ: trẻ phải nộp bằng `commit` (`onSubmitSequence`).
      return this.isWon;
    }
    const items = this.content.options.map((opt) => ({
      id: opt.item_id,
      isCorrect: opt.is_correct === true,
    }));
    return this.selectionMechanic.isSelectionComplete(items);
  }

  private toSequenceAction(gesture: Gesture): GameAction | null {
    if (gesture.type === "drop") {
      const fromIdx = findHitIndex(
        this.slots,
        gesture.fromX,
        gesture.fromY,
        "square",
        TAP_TOLERANCE_PX
      );
      const toIdx = findHitIndex(
        this.slots,
        gesture.toX,
        gesture.toY,
        "square",
        TAP_TOLERANCE_PX
      );
      if (fromIdx >= 0 && toIdx >= 0 && fromIdx !== toIdx) {
        return {
          type: "reorder_step",
          data: { from_index: fromIdx, to_index: toIdx },
        };
      }
    }
    if (gesture.type === "tap") {
      const hitIdx = findHitIndex(
        this.slots,
        gesture.x,
        gesture.y,
        "square",
        TAP_TOLERANCE_PX
      );
      if (hitIdx >= 0) {
        if (this.stagedStepIndex === null) {
          this.stagedStepIndex = hitIdx;
          return null;
        }
        if (this.stagedStepIndex !== hitIdx) {
          const from = this.stagedStepIndex;
          this.stagedStepIndex = null;
          return {
            type: "reorder_step",
            data: { from_index: from, to_index: hitIdx },
          };
        }
        this.stagedStepIndex = null;
        return null;
      }
    }
    if (gesture.type === "commit") {
      return { type: "submit_order", data: null };
    }
    return null;
  }

  override toAction(gesture: Gesture): GameAction | null {
    if (this.content.response_mode === "sequence") {
      return this.toSequenceAction(gesture);
    }
    if (gesture.type === "tap") {
      const hitId = findHitOptionId(
        this.slots,
        this.content.options,
        gesture.x,
        gesture.y
      );
      if (hitId) {
        return { type: "tap_option", data: { item_id: hitId } };
      }
    }
    return null;
  }

  /** `BR-E018-05`: âm đề tự phát khi mở vòng chỉ khi `auto_play_audio` bật. */
  override getOpeningAudioText(): string | null {
    return this.difficulty.auto_play_audio
      ? this.content.audio_prompt.text
      : null;
  }

  override getHintTargetIndex(): number | null {
    if (this.content.response_mode === "select") {
      const idx = this.content.options.findIndex((o) => o.is_correct === true);
      return idx >= 0 ? idx : null;
    }
    return 0;
  }

  override getHintTarget(): HintTarget | null {
    if (this.content.response_mode === "sequence") {
      if (this.slots.length === 0) {
        return { kind: "action" };
      }
      const targetSeq = (this.content.target_sequence ?? []).map(String);
      if (this.orderingMechanic.isSequenceCorrect(targetSeq)) {
        return { kind: "action" };
      }
      const current = this.orderingMechanic.getCurrentSequence();
      for (let i = 0; i < current.length; i++) {
        if (current[i] !== targetSeq[i]) {
          return { kind: "slot", index: i };
        }
      }
      return { kind: "action" };
    }
    return super.getHintTarget();
  }

  private commitReorder(data: GameAction["data"]): void {
    this.stagedStepIndex = null;
    if (typeof data !== "object" || data === null) {
      return;
    }
    const from = Number(Reflect.get(data, "from_index"));
    const to = Number(Reflect.get(data, "to_index"));
    if (!(Number.isNaN(from) || Number.isNaN(to))) {
      this.onReorderStep(from, to);
    }
  }

  private commitItemSelect(data: GameAction["data"]): void {
    if (typeof data !== "object" || data === null) {
      return;
    }
    const itemId = Reflect.get(data, "item_id");
    if (typeof itemId === "string") {
      this.onItemSelect(itemId);
    }
  }

  override commit(action: GameAction): void {
    if (action.type === "reorder_step") {
      this.commitReorder(action.data);
      return;
    }
    if (action.type === "tap_option" || action.type === "select_item") {
      this.commitItemSelect(action.data);
      return;
    }
    if (
      action.type === "submit_order" ||
      action.type === "sequence_submitted"
    ) {
      this.onSubmitSequence();
    }
  }

  override getView(): EngineView {
    const entities: ViewEntity[] = this.content.options.map((opt, i) => {
      const slot = this.slots[i];
      const selected =
        this.selectedItemId === opt.item_id ||
        this.selectionMechanic.isSelected(opt.item_id);
      let state: EntityVisual = "idle";
      if (selected) {
        state = opt.is_correct ? "correct" : "incorrect";
      }
      return {
        id: opt.item_id,
        slotIndex: i,
        role: "source",
        state,
        x: slot?.x ?? 0,
        y: slot?.y ?? 0,
        w: slot?.w ?? 80,
        h: slot?.h ?? 80,
        ...resolveAssetLabels(opt.asset),
      };
    });

    const gram = this.gramophoneGeometry();
    entities.push({
      id: "gramophone",
      slotIndex: -1,
      role: "neutral",
      state: "idle",
      x: gram.cx,
      y: gram.cy,
      w: gram.size,
      h: gram.size,
      label: "Máy phát âm",
      spokenLabel: this.content.audio_prompt.text,
    });

    return {
      activePrompt: this.content.prompt,
      entities,
    };
  }

  protected computeSlots(ageBand: AgeBand): readonly Slot[] {
    const layoutFn = resolveLayout("grid");
    return insetDrawSize(
      layoutFn({
        slotCount: this.content.options.length,
        ageBand,
        logic: this.logicSpace,
        stage: this.stageRect ? this.optionsArea(this.stageRect) : undefined,
        cssPerLogic: this.cssPerLogic,
      }),
      this.stageRect
    );
  }

  /** Stage trừ dải nhãn và máy hát: phần còn lại cho dock phương án. */
  private optionsArea(stage: ZoneRect): ZoneRect {
    const showCaption =
      !this.stageRect ||
      this.content.audio_prompt.text.trim() !== this.content.prompt.trim();
    const body = showCaption ? splitCaption(stage).body : stage;
    return splitFigure(body, GRAMOPHONE_SIZE_PX).rest;
  }

  /** Khung hình của máy hát (không tính dải chỉ dẫn): một nguồn cho chạm và vẽ. */
  private figureRect(): ZoneRect {
    if (!this.stageRect) {
      // Chưa có sân khấu từ shell: khung giả quanh vị trí mặc định cũ.
      return {
        x: this.logicSpace.w / 2 - 160,
        y: this.logicSpace.h * 0.32 - GRAMOPHONE_SIZE_PX / 2,
        w: 320,
        h: GRAMOPHONE_SIZE_PX + 20,
      };
    }
    const showCaption =
      this.content.audio_prompt.text.trim() !== this.content.prompt.trim();
    return splitFigure(
      showCaption ? splitCaption(this.stageRect).body : this.stageRect,
      GRAMOPHONE_SIZE_PX
    ).figure;
  }

  /**
   * Các vật mà lời đọc gọi tên, theo thứ tự nói — kênh thị giác thay âm thanh.
   * Rỗng khi còn tiếng (`BR-E018-06`). Nguồn: `audio_prompt.strip_item_ids`;
   * thiếu thì `sequence` lấy `target_sequence` (lời đọc là chuỗi thao tác),
   * còn `select` rỗng — không suy từ `is_correct`, vì lời đọc có thể là câu đố
   * (quy luật, tiếng kêu) mà phương án đúng chính là đáp án.
   */
  getInstructionStrip(): readonly GT018Content["options"][number][] {
    if (this.isAudioEnabled()) {
      return [];
    }
    const ids =
      this.content.audio_prompt.strip_item_ids ??
      (this.content.response_mode === "sequence"
        ? (this.content.target_sequence ?? [])
        : []);
    return ids.flatMap((id) => {
      const opt = this.content.options.find((o) => o.item_id === id);
      return opt ? [opt] : [];
    });
  }

  /** Tâm và cạnh của máy hát; thu nhỏ khi tắt tiếng để chừa chỗ cho dải. */
  private gramophoneGeometry(): { cx: number; cy: number; size: number } {
    const strip = this.getInstructionStrip();
    const figure = this.figureRect();
    if (strip.length > 0) {
      // +1 chip cho biểu tượng loa tắt tiếng ở đầu dải.
      return computeMutedStripLayout(figure, strip.length + 1).gramophone;
    }
    const size = this.stageRect
      ? Math.min(GRAMOPHONE_SIZE_PX, figure.w, figure.h)
      : GRAMOPHONE_SIZE_PX;
    return this.stageRect
      ? { cx: figure.x + figure.w / 2, cy: figure.y + figure.h / 2, size }
      : { cx: this.logicSpace.w / 2, cy: this.logicSpace.h * 0.32, size };
  }

  private gramophoneSlot(): Slot {
    const g = this.gramophoneGeometry();
    return {
      index: 0,
      x: g.cx,
      y: g.cy,
      w: g.size,
      h: g.size,
      hitW: g.size,
      hitH: g.size,
      page: 0,
      role: "target",
    };
  }

  /** Dải biểu tượng chỉ dẫn khi tắt tiếng: loa gạch chéo rồi từng bước. */
  private drawInstructionStrip(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem
  ): void {
    const strip = this.getInstructionStrip();
    if (strip.length === 0) {
      return;
    }
    const layout = computeMutedStripLayout(this.figureRect(), strip.length + 1);
    layout.chips.forEach((chip, i) => {
      const slot: Slot = {
        index: 0,
        x: chip.cx,
        y: chip.cy,
        w: chip.size * 0.78,
        h: chip.size * 0.78,
        hitW: chip.size,
        hitH: chip.size,
        page: 0,
        role: "target",
      };
      drawStripChipCard(ctx, chip, i === 0);
      if (i === 0) {
        drawGlyphInSlot(ctx, "🔇", slot);
        return;
      }
      const opt = strip[i - 1];
      if (opt) {
        drawSlotItem(ctx, rs, slot, {
          id: `strip-${opt.item_id}`,
          asset: opt.asset,
        });
      }
    });
  }

  private renderOptionSlot(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    opt: GT018Content["options"][number],
    slot: Slot,
    chosenOrder: readonly string[]
  ): void {
    const orderIndex = chosenOrder.indexOf(opt.item_id);
    const isItemWrong =
      (this.wrongItemId === opt.item_id || this.isSequenceWrong) &&
      this.wrongFlash.isActive(this.lastFrameMs);
    const selected =
      !isItemWrong &&
      (this.selectedItemId === opt.item_id ||
        this.selectionMechanic.isSelected(opt.item_id));

    let state = this.getRenderItemState(opt.item_id);
    if (isItemWrong) {
      state = "wrong";
    } else if (selected) {
      state = "selected";
    }

    drawSlotItem(ctx, rs, slot, {
      id: opt.item_id,
      asset: opt.asset,
      label: orderIndex >= 0 ? String(orderIndex + 1) : undefined,
      state,
    });

    if (isItemWrong) {
      rs.drawRetryRing(
        ctx,
        slot.x,
        slot.y,
        (slot.w ?? 64) / 2,
        this.wrongFlash.progress(this.lastFrameMs)
      );
    }
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    this.lastFrameMs = timeMs;
    drawSceneBackground(ctx, rs, this.themeId);
    const showCaption =
      !this.stageRect ||
      this.content.audio_prompt.text.trim() !== this.content.prompt.trim();
    if (showCaption) {
      drawSubPromptText(
        ctx,
        rs,
        this.content.audio_prompt.text,
        this.stageRect ? splitCaption(this.stageRect).caption : undefined
      );
    }

    drawGramophone(ctx, this.gramophoneSlot(), false);
    this.drawInstructionStrip(ctx, rs);
    drawWoodenTokenDock(
      ctx,
      rs,
      dockRectAroundSlots(this.slots, this.stageRect)
    );

    const chosenOrder =
      this.content.response_mode === "sequence"
        ? this.orderingMechanic.getCurrentSequence()
        : [];

    for (let i = 0; i < this.content.options.length; i++) {
      const opt = this.content.options[i];
      const slot = this.slots[i];
      if (opt && slot) {
        this.renderOptionSlot(ctx, rs, opt, slot, chosenOrder);
      }
    }
  }
}
