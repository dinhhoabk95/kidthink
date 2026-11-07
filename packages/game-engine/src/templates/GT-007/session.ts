import { formatSpokenLabel } from "@mindkid/shared/preschool-terminology";
import type { AgeBand } from "#src/contracts/types";
import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  type GameActionValue,
  TemplateGameSession,
} from "#src/game-session";
import type { EngineView, Gesture, ViewEntity } from "#src/interaction";
import { resolveTouchFloor } from "#src/layout/constants";
import { TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import { resolveLayout } from "#src/layout/registry";
import { computeStageTreeSlots } from "#src/layout/stage-targets";
import {
  computeTraySourceSlots,
  findNearestHitSlot,
  type MinHitSize,
  pickTrayZones,
} from "#src/layout/tray-layout";
import type { Slot } from "#src/layout/types";
import {
  drawEmptyTargetSlot,
  drawMatchLine,
  drawMontessoriControlOfErrorPill,
  drawQuantityRepresentation,
  drawSceneBackground,
  drawSlotItem,
  drawWoodenTokenDock,
  type ItemVisualState,
  sceneBox,
} from "#src/render/index.js";
import { deriveStream } from "#src/rng/mulberry32";
import { shuffle } from "#src/rng/shuffle";
import type { DegradationState } from "#src/systems/degradation";
import { designTokens } from "#src/systems/designTokens";
import {
  type ControlOfErrorDiagnostics,
  MontessoriExploreTracker,
} from "#src/systems/montessori-explore-system";
import type { RenderSystem } from "#src/systems/render-system";
import { WrongFlash } from "#src/systems/wrong-flash";
import type { GT007Content, GT007Difficulty } from "./template.js";

/** Cạnh ô tổng và ô phần lớn nhất trên sân khấu — cùng cỡ ô của `number-bond-tree`. */
const TREE_CELL_MAX_PX = 96;

export const FIBONACCI_SEQUENCE = [1, 1, 2, 3, 5, 8, 13, 21] as const;

/** Khoảng chạm thêm quanh vùng chạm của slot (`GT-007.md` §6). */
const HIT_TOLERANCE_PX = TAP_TOLERANCE_PX;

/** Vùng chạm tối thiểu của ô phần ở bố cục cũ — rộng hơn thân ô vẽ. */
const LEGACY_PART_HIT: MinHitSize = { w: 100, h: 100 };

function extractOptionId(data: GameActionValue): string | undefined {
  if (typeof data === "object" && data !== null && "option_id" in data) {
    const val = Reflect.get(data, "option_id");
    return typeof val === "string" ? val : undefined;
  }
  return undefined;
}

export class GT007Session extends TemplateGameSession<
  GT007Content,
  GT007Difficulty
> {
  degradation: DegradationState | null = null;
  private readonly exploreTracker = new MontessoriExploreTracker({
    milestoneTarget: 2,
  });

  private previewedOptionId: string | null = null;
  private stagedOptionId: string | null = null;
  private wrongOptionId: string | null = null;
  private readonly wrongFlash = new WrongFlash();
  private lastFrameMs = 0;
  private displayOptions: readonly GT007Content["options"][number][] = [];

  filledParts: Map<string, number> = new Map();

  /** Lựa chọn nằm trong khay, cây tách gộp đứng trên sân khấu (`BR-PSZ-01`). */
  override readonly needsTray = true;

  /** Số vật nguồn trong khay của vòng — shell đo chiều cao khay (`BR-PSZ-13`). */
  override get trayItemCount(): number {
    return (
      this.displayOptions.length > 0
        ? this.displayOptions
        : this.content.options
    ).length;
  }
  override readonly usesPromptZone = true;

  override takePillNarration(): string | null {
    return this.exploreTracker.takePillNarration();
  }

  setupEntities(): void {
    this.filledParts.clear();
    this.exploreTracker.reset(false);
    this.previewedOptionId = null;
    this.stagedOptionId = null;
    this.wrongOptionId = null;
    this.wrongFlash.clear();
    this.lastFrameMs = 0;
    this.isWon = false;
    this.displayOptions =
      Reflect.get(this.difficulty, "shuffle_items") === true
        ? shuffle(this.content.options, deriveStream(this.layoutSeed, "items"))
        : [...this.content.options];
  }

  update(deltaMs: number): void {
    this.exploreTracker.tick(deltaMs);
  }

  startExplorePhase(): void {
    this.exploreTracker.reset(true);
  }

  getExploreTracker(): MontessoriExploreTracker {
    return this.exploreTracker;
  }

  getControlOfError(): ControlOfErrorDiagnostics | null {
    return this.exploreTracker.getControlOfErrorDiagnostics();
  }

  isMicroSandboxActive(): boolean {
    return this.exploreTracker.isMicroSandboxActive();
  }

  getPreviewedOptionId(): string | null {
    return this.previewedOptionId;
  }

  previewOption(optionId: string): {
    optionValue: number;
    resultingSum: number;
    expectedWhole: number;
  } | null {
    const options =
      this.displayOptions.length > 0
        ? this.displayOptions
        : this.content.options;
    const option = options.find((o) => o.id === optionId);
    if (!option) {
      return null;
    }
    const knownSum = this.content.parts
      .filter((p) => !p.is_target)
      .reduce((acc, p) => acc + p.value, 0);
    const resultingSum = knownSum + option.value;
    this.previewedOptionId = optionId;
    this.exploreTracker.recordExploreAction("bond_previewed");
    this.recordEvent("option_previewed", {
      option_id: optionId,
      option_value: option.value,
      resulting_sum: resultingSum,
      expected_whole: this.content.whole.value,
    });
    return {
      optionValue: option.value,
      resultingSum,
      expectedWhole: this.content.whole.value,
    };
  }

  getStagedOptionId(): string | null {
    return this.stagedOptionId;
  }

  validateAction(action: GameAction): ActionResult {
    if (action.type === "fill_part" || action.type === "tap_option") {
      const optionId = extractOptionId(action.data);
      const options =
        this.displayOptions.length > 0
          ? this.displayOptions
          : this.content.options;
      const option = options.find((o) => o.id === optionId);

      if (!option) {
        return ACTION_RETRY;
      }

      let targetPartId: string | undefined;
      if (
        action.data &&
        typeof action.data === "object" &&
        "part_id" in action.data
      ) {
        const pVal = Reflect.get(action.data, "part_id");
        if (typeof pVal === "string") {
          targetPartId = pVal;
        }
      }
      targetPartId ??= this.getTargetPartId();
      const targetPart = this.content.parts.find((p) => p.id === targetPartId);

      if (
        option.is_correct &&
        targetPart &&
        option.value === targetPart.value
      ) {
        return ACTION_CORRECT;
      }

      return ACTION_RETRY;
    }

    return ACTION_IGNORED;
  }

  private getTargetPartId(): string {
    const targetPart = this.content.parts.find((p) => p.is_target);
    return targetPart ? targetPart.id : (this.content.parts[0]?.id ?? "part_0");
  }

  onPartFilled(optionId: string, partId?: string): void {
    const targetId = partId ?? this.getTargetPartId();
    const targetPart = this.content.parts.find((p) => p.id === targetId);
    const options =
      this.displayOptions.length > 0
        ? this.displayOptions
        : this.content.options;
    const option = options.find((o) => o.id === optionId);
    if (!(option && targetPart)) {
      return;
    }

    const isCorrect = Boolean(
      option.is_correct && option.value === targetPart.value
    );

    this.recordEvent("bond_selected", {
      option_id: optionId,
      part_id: targetId,
      is_correct: isCorrect,
    });

    if (isCorrect) {
      this.exploreTracker.recordCorrectAttempt();
      this.filledParts.set(targetId, option.value);
      this.recordEvent("part_filled", {
        part_id: targetId,
        value: option.value,
      });

      if (this.checkWinCondition()) {
        this.winSession();
      }
    } else {
      const knownSum = this.content.parts
        .filter((p) => !p.is_target)
        .reduce((acc, p) => acc + p.value, 0);
      const actualSum = knownSum + option.value;
      const expectedWhole = this.content.whole.value;
      this.exploreTracker.recordWrongAttempt({
        reasonVi: `Gộp ${knownSum} và ${option.value} được ${actualSum} (cần ${expectedWhole})`,
        targetId,
        actualValue: actualSum,
        expectedValue: expectedWhole,
      });
      this.recordEvent("control_of_error", {
        option_id: optionId,
        actual_sum: actualSum,
        expected_whole: expectedWhole,
        micro_sandbox: this.exploreTracker.isMicroSandboxActive(),
      });
      this.wrongOptionId = optionId;
      this.wrongFlash.trigger(this.lastFrameMs);
    }
  }

  onItemPlaced(itemId: string, slotId?: string): void {
    this.onPartFilled(itemId, slotId);
  }

  override checkWinCondition(): boolean {
    const targetParts = this.content.parts.filter((p) => p.is_target);
    if (targetParts.length === 0) {
      return true;
    }

    return targetParts.every((tp) => {
      const filledVal = this.filledParts.get(tp.id);
      return filledVal === tp.value;
    });
  }

  protected computeSlots(ageBand: AgeBand): readonly Slot[] {
    const options =
      this.displayOptions.length > 0
        ? this.displayOptions
        : this.content.options;
    const zones = pickTrayZones(this.stageRect, this.trayRect);
    if (zones) {
      const touchFloor = resolveTouchFloor(ageBand, this.cssPerLogic);
      const tree = computeStageTreeSlots({
        partCount: this.content.parts.length,
        stage: zones.stage,
        touchFloor,
        maxCell: TREE_CELL_MAX_PX,
      });
      const optionSlots = computeTraySourceSlots(
        options.length,
        zones.tray,
        touchFloor,
        tree.length
      );
      return [...tree, ...optionSlots];
    }
    const layoutKey =
      this.content.layout === "ten-frame-split" ||
      this.content.representation === "ten-frame"
        ? "ten-frame-split"
        : "number-bond-tree";
    const layoutFn = resolveLayout(layoutKey);
    return layoutFn({
      slotCount: options.length,
      targetCount: this.content.parts.length,
      ageBand,
      logic: this.logicSpace,
    });
  }

  private findDraggedOption(
    x: number,
    y: number,
    sources: readonly Slot[],
    hitTolerance: number
  ): GT007Content["options"][number] | null {
    const options =
      this.displayOptions.length > 0
        ? this.displayOptions
        : this.content.options;
    const index = findNearestHitSlot(
      sources.slice(0, options.length),
      x,
      y,
      hitTolerance
    );
    return options[index] ?? null;
  }

  private findTargetPart(
    x: number,
    y: number,
    targets: readonly Slot[],
    hitTolerance: number
  ): GT007Content["parts"][number] | null {
    const isInFrame = pickTrayZones(this.stageRect, this.trayRect) !== null;
    const open = this.content.parts.flatMap((part, i) => {
      const slot = targets[i + 1];
      return slot && part.is_target && !this.filledParts.has(part.id)
        ? [{ part, slot }]
        : [];
    });
    const hit = findNearestHitSlot(
      open.map((entry) => entry.slot),
      x,
      y,
      hitTolerance,
      isInFrame ? undefined : LEGACY_PART_HIT
    );
    return open[hit]?.part ?? null;
  }

  private toDropAction(
    gesture: Extract<Gesture, { type: "drop" }>,
    sources: readonly Slot[],
    targets: readonly Slot[],
    hitTolerance: number
  ): GameAction | null {
    const opt = this.findDraggedOption(
      gesture.fromX,
      gesture.fromY,
      sources,
      hitTolerance
    );
    if (!opt) {
      return null;
    }
    const part = this.findTargetPart(
      gesture.toX,
      gesture.toY,
      targets,
      hitTolerance
    );
    if (!part) {
      return null;
    }
    return {
      type: "fill_part",
      data: {
        option_id: opt.id,
        part_id: part.id,
      },
    };
  }

  private handleTapTarget(
    gesture: Extract<Gesture, { type: "tap" }>,
    targets: readonly Slot[],
    hitTolerance: number
  ): GameAction | null {
    if (!this.stagedOptionId) {
      return null;
    }
    const part = this.findTargetPart(
      gesture.x,
      gesture.y,
      targets,
      hitTolerance
    );
    if (!part) {
      return null;
    }
    return {
      type: "fill_part",
      data: {
        option_id: this.stagedOptionId,
        part_id: part.id,
      },
    };
  }

  private handleTapSource(
    gesture: Extract<Gesture, { type: "tap" }>,
    sources: readonly Slot[],
    hitTolerance: number
  ): void {
    const opt = this.findDraggedOption(
      gesture.x,
      gesture.y,
      sources,
      hitTolerance
    );
    if (!opt) {
      return;
    }
    this.stagedOptionId = this.stagedOptionId === opt.id ? null : opt.id;
  }

  private toTapAction(
    gesture: Extract<Gesture, { type: "tap" }>,
    sources: readonly Slot[],
    targets: readonly Slot[],
    hitTolerance: number
  ): GameAction | null {
    const targetAction = this.handleTapTarget(gesture, targets, hitTolerance);
    if (targetAction) {
      return targetAction;
    }
    this.handleTapSource(gesture, sources, hitTolerance);
    return null;
  }

  override toAction(gesture: Gesture): GameAction | null {
    const hitTolerance = HIT_TOLERANCE_PX;
    const sources = this.sourceSlots;
    const targets = this.targetSlots;

    if (gesture.type === "drop") {
      return this.toDropAction(gesture, sources, targets, hitTolerance);
    }
    if (gesture.type === "tap") {
      return this.toTapAction(gesture, sources, targets, hitTolerance);
    }
    return null;
  }

  override getHintTargetIndex(): number | null {
    const options =
      this.displayOptions.length > 0
        ? this.displayOptions
        : this.content.options;
    const idx = options.findIndex((o) => o.is_correct);
    const sourceSlot = this.sourceSlots[idx];
    return sourceSlot ? this.slots.indexOf(sourceSlot) : null;
  }

  /** Bước đúng là kéo đáp án đúng vào ô thiếu (phần `is_target` chưa điền). */
  override getHintDestinationIndex(): number | null {
    const partIdx = this.content.parts.findIndex(
      (part) => part.is_target && !this.filledParts.has(part.id)
    );
    const slot = this.targetSlots[partIdx + 1];
    const index = partIdx >= 0 && slot ? this.slots.indexOf(slot) : -1;
    return index >= 0 ? index : null;
  }

  override commit(action: GameAction): void {
    if (
      action.type === "fill_part" &&
      action.data &&
      typeof action.data === "object"
    ) {
      const data = action.data as { option_id?: string; part_id?: string };
      if (data.option_id) {
        this.onPartFilled(data.option_id, data.part_id);
        this.stagedOptionId = null;
      }
    }
  }

  private toOptionEntityState(
    optId: string,
    rawState: ItemVisualState
  ): ViewEntity["state"] {
    const now = this.lastFrameMs;
    if (this.wrongOptionId === optId && this.wrongFlash.isActive(now)) {
      return "incorrect";
    }
    if (this.stagedOptionId === optId || rawState === "selected") {
      return "selected";
    }
    if (rawState === "correct") {
      return "correct";
    }
    if (rawState === "wrong") {
      return "incorrect";
    }
    return "idle";
  }

  override getView(): EngineView {
    const entities: ViewEntity[] = [];
    const targets = this.targetSlots;
    const sources = this.sourceSlots;
    const options =
      this.displayOptions.length > 0
        ? this.displayOptions
        : this.content.options;

    const rawIds = [
      this.content.whole.id,
      ...this.content.parts.map((p) => p.id),
      ...options.map((o) => o.id),
    ];
    const needPrefix = new Set(rawIds).size !== rawIds.length;

    const wholeSlot = targets[0];
    if (wholeSlot) {
      const wholeLabel = String(this.content.whole.value);
      entities.push({
        id: needPrefix
          ? `whole:${this.content.whole.id}`
          : this.content.whole.id,
        slotIndex: this.slots.indexOf(wholeSlot),
        role: "target",
        state: "idle",
        x: wholeSlot.x,
        y: wholeSlot.y,
        w: wholeSlot.w,
        h: wholeSlot.h,
        label: wholeLabel,
        spokenLabel: formatSpokenLabel(wholeLabel),
      });
    }

    this.content.parts.forEach((part, i) => {
      const slot = targets[i + 1];
      if (!slot) {
        return;
      }
      const isFilled = this.filledParts.has(part.id);
      const isHiddenTarget = part.is_target && !isFilled;
      const partVal = this.filledParts.get(part.id) ?? part.value;
      const partLabel = isHiddenTarget ? "?" : String(partVal);
      const partSpokenLabel = isHiddenTarget
        ? "Ô trống"
        : formatSpokenLabel(String(partVal));
      entities.push({
        id: needPrefix ? `part:${part.id}` : part.id,
        slotIndex: this.slots.indexOf(slot),
        role: "target",
        state: isFilled ? "correct" : "idle",
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
        label: partLabel,
        spokenLabel: partSpokenLabel,
      });
    });

    options.forEach((opt, i) => {
      const slot = sources[i];
      if (!slot) {
        return;
      }
      const rawState = this.getRenderItemState(opt.id);
      const optLabel = String(opt.value);
      entities.push({
        id: needPrefix ? `opt:${opt.id}` : opt.id,
        slotIndex: this.slots.indexOf(slot),
        role: "source",
        state: this.toOptionEntityState(opt.id, rawState),
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
        label: optLabel,
        spokenLabel: formatSpokenLabel(optLabel),
      });
    });

    return {
      entities,
      activePrompt: this.content.prompt,
    };
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    this.lastFrameMs = timeMs;
    drawSceneBackground(ctx, rs, this.themeId);
    const zones = pickTrayZones(this.stageRect, this.trayRect);
    if (zones) {
      // Lời dẫn do shell vẽ; lựa chọn nằm trên khay của khung năm vùng.
      drawWoodenTokenDock(ctx, rs, zones.tray);
    }
    const targets = this.targetSlots;
    const sources = this.sourceSlots;

    const isTenFrame =
      this.content.layout === "ten-frame-split" ||
      this.content.representation === "ten-frame";

    // Slot 0 của number-bond-tree / ten-frame-split là ô tổng, các ô sau là nhánh.
    const wholeSlot = targets[0];
    if (wholeSlot) {
      if (isTenFrame) {
        drawQuantityRepresentation(ctx, rs, wholeSlot, {
          kind: "ten-frame",
          count: this.content.whole.value,
        });
      } else {
        this.content.parts.forEach((_, i) => {
          const slot = targets[i + 1];
          if (slot) {
            drawMatchLine(
              ctx,
              wholeSlot.x,
              wholeSlot.y,
              slot.x,
              slot.y,
              designTokens.colors.montessori.woodBevel
            );
          }
        });
        drawSlotItem(ctx, rs, wholeSlot, {
          id: this.content.whole.id,
          text: String(this.content.whole.value),
        });
      }
    }

    this.content.parts.forEach((part, i) => {
      const slot = targets[i + 1];
      if (!slot) {
        return;
      }
      const filled = this.filledParts.get(part.id);
      if (part.is_target && filled === undefined) {
        drawEmptyTargetSlot(ctx, slot);
        return;
      }
      const partVal = filled ?? part.value;
      if (isTenFrame) {
        drawQuantityRepresentation(ctx, rs, slot, {
          kind: "ten-frame",
          count: partVal,
        });
      } else {
        drawSlotItem(ctx, rs, slot, {
          id: part.id,
          text: String(partVal),
          state: filled === undefined ? "idle" : "correct",
        });
      }
    });

    const options =
      this.displayOptions.length > 0
        ? this.displayOptions
        : this.content.options;
    options.forEach((opt, i) => {
      const slot = sources[i];
      if (!slot) {
        return;
      }
      const now = timeMs;
      const isWrong =
        this.wrongOptionId === opt.id && this.wrongFlash.isActive(now);
      const shakeX =
        isWrong && !rs.reducedMotion
          ? Math.sin(this.wrongFlash.elapsedMs(now) / 30) * 4
          : 0;
      const renderSlot = shakeX === 0 ? slot : { ...slot, x: slot.x + shakeX };
      const rawState = this.getRenderItemState(opt.id);
      let state: ItemVisualState = rawState;
      if (isWrong) {
        state = "wrong";
      } else if (this.stagedOptionId === opt.id && rawState === "idle") {
        state = "selected";
      }
      drawSlotItem(ctx, rs, renderSlot, {
        id: opt.id,
        text: String(opt.value),
        state,
      });
    });

    const stageBox = zones?.stage ?? this.stageRect ?? sceneBox(rs);
    drawMontessoriControlOfErrorPill(
      ctx,
      stageBox,
      this.exploreTracker,
      rs.viewport?.scale
    );
  }
}
