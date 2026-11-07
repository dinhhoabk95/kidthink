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
  drawGramophone,
  drawSceneBackground,
  drawSlotItem,
  drawSubPromptText,
  drawWoodenTokenDock,
} from "#src/render/index";
import type { DegradationState } from "#src/systems/degradation";
import type { RenderSystem } from "#src/systems/render-system";
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
  private wrongTimerMs = 0;
  private wrongItemId: string | null = null;
  private isSequenceWrong = false;
  private stagedStepIndex: number | null = null;

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
    this.wrongTimerMs = 0;
    this.wrongItemId = null;
    this.isSequenceWrong = false;
    this.stagedStepIndex = null;
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
      this.wrongTimerMs = 0;
      this.wrongItemId = null;
      this.recordEvent("round_completed", { round_index: 0 });
      this.winSession();
      return ACTION_CORRECT;
    }

    this.wrongTimerMs = 400;
    this.wrongItemId = itemId;
    this.setRenderItemState(itemId, "wrong");
    return ACTION_RETRY;
  }

  onReorderStep(fromIndex: number, toIndex: number): boolean {
    if (this.content.response_mode !== "sequence") {
      return false;
    }
    return this.orderingMechanic.reorder(fromIndex, toIndex);
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
      this.wrongTimerMs = 0;
      this.isSequenceWrong = false;
      this.recordEvent("round_completed", { round_index: 0 });
      this.winSession();
      return ACTION_CORRECT;
    }

    this.wrongTimerMs = 400;
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

  update(deltaMs: number): void {
    if (this.wrongTimerMs <= 0) {
      return;
    }
    this.wrongTimerMs = Math.max(0, this.wrongTimerMs - deltaMs);
    if (this.wrongTimerMs === 0) {
      this.clearWrongState();
    }
  }

  override destroy(): void {
    super.destroy();
    this.selectedItemId = null;
    this.wrongItemId = null;
    this.wrongTimerMs = 0;
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

    const showCaption =
      !this.stageRect ||
      this.content.audio_prompt.text.trim() !== this.content.prompt.trim();
    const figure = this.stageRect
      ? splitFigure(
          showCaption ? splitCaption(this.stageRect).body : this.stageRect,
          GRAMOPHONE_SIZE_PX
        ).figure
      : null;
    const size = figure
      ? Math.min(GRAMOPHONE_SIZE_PX, figure.w, figure.h)
      : GRAMOPHONE_SIZE_PX;
    entities.push({
      id: "gramophone",
      slotIndex: -1,
      role: "neutral",
      state: "idle",
      x: figure ? figure.x + figure.w / 2 : this.logicSpace.w / 2,
      y: figure ? figure.y + figure.h / 2 : this.logicSpace.h * 0.32,
      w: size,
      h: size,
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

  private gramophoneSlot(rs: RenderSystem): Slot {
    const showCaption =
      !this.stageRect ||
      this.content.audio_prompt.text.trim() !== this.content.prompt.trim();
    const figure = this.stageRect
      ? splitFigure(
          showCaption ? splitCaption(this.stageRect).body : this.stageRect,
          GRAMOPHONE_SIZE_PX
        ).figure
      : null;
    const size = figure
      ? Math.min(GRAMOPHONE_SIZE_PX, figure.w, figure.h)
      : GRAMOPHONE_SIZE_PX;
    return {
      index: 0,
      x: figure ? figure.x + figure.w / 2 : rs.LOGIC_WIDTH / 2,
      y: figure ? figure.y + figure.h / 2 : rs.LOGIC_HEIGHT * 0.32,
      w: size,
      h: size,
      hitW: size,
      hitH: size,
      page: 0,
      role: "target",
    };
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
      this.wrongTimerMs > 0;
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
        1 - this.wrongTimerMs / 400
      );
    }
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    _timeMs: number
  ): void {
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

    drawGramophone(ctx, this.gramophoneSlot(rs), false);
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
