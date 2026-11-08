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
import {
  CONTENT_TOP_PX,
  resolveTouchFloor,
  SAFE_MARGIN_PX,
} from "#src/layout/constants";
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
  drawStoryCharacterInStage,
  drawWoodenTokenDock,
  type ItemVisualState,
  sceneBox,
} from "#src/render/index.js";
import type { MascotPose } from "#src/render/mascot";
import { deriveStream } from "#src/rng/mulberry32";
import { shuffle } from "#src/rng/shuffle";
import type { DegradationState } from "#src/systems/degradation";
import { designTokens } from "#src/systems/designTokens";
import {
  type ControlOfErrorDiagnostics,
  MontessoriExploreTracker,
} from "#src/systems/montessori-explore-system";
import { MoodPulse } from "#src/systems/mood-pulse";
import type { RenderSystem } from "#src/systems/render-system";
import { WrongFlash } from "#src/systems/wrong-flash";
import {
  CANDY_DEFAULT_ASSET,
  type CandyEndpoint,
  CandySplit,
  computeCandySlots,
  drawCandySplit,
} from "./candy-split.js";
import type { GT007Content, GT007Difficulty } from "./template.js";

/** Cạnh ô tổng và ô phần lớn nhất trên sân khấu — cùng cỡ ô của `number-bond-tree`. */
const TREE_CELL_MAX_PX = 96;

export const FIBONACCI_SEQUENCE = [1, 1, 2, 3, 5, 8, 13, 21] as const;

/** Khoảng chạm thêm quanh vùng chạm của slot (`GT-007.md` §6). */
const HIT_TOLERANCE_PX = TAP_TOLERANCE_PX;

/** Vùng chạm tối thiểu của ô phần ở bố cục cũ — rộng hơn thân ô vẽ. */
const LEGACY_PART_HIT: MinHitSize = { w: 100, h: 100 };

function isCandyEndpoint(
  value: object | string | number | boolean | null | undefined
): value is CandyEndpoint {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const kind = Reflect.get(value, "kind");
  if (kind === "plate") {
    return true;
  }
  return kind === "tray" && typeof Reflect.get(value, "index") === "number";
}

function extractOptionId(data: GameActionValue): string | undefined {
  if (typeof data === "object" && data !== null && "option_id" in data) {
    const val = Reflect.get(data, "option_id");
    return typeof val === "string" ? val : undefined;
  }
  return undefined;
}

/** Khung chuyện đọc một lần ở vòng đầu (`BR-E007-05`, `BR-FBK-16`). */
export const GT007_STORY_LINE =
  "Khỉ Nhỏ chia kẹo cho hai bạn. Một bạn đã có phần rồi, bé chọn phần kẹo còn lại cho bạn kia nhé!";

/** Mascot reo ngắn sau phần đúng (`BR-E007-05`). */
export const GT007_CHEER_MS = 1000;
/** Mascot nghiêng đầu sau phần chưa đúng. */
export const GT007_WONDER_MS = 1500;

/** Level chơi bằng kẹo thật thay vì bảng chọn số (`BR-E007-06`). */
function isCandyContent(content: GT007Content): boolean {
  return content.representation === "discrete-object";
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
  private readonly wrongFlash = new WrongFlash();
  private readonly mood = new MoodPulse();
  private lastFrameMs = 0;
  private displayOptions: readonly GT007Content["options"][number][] = [];

  filledParts: Map<string, number> = new Map();

  /** Vật thật (`BR-E007-06`): ô tổng và hai khay ở sân khấu, không có khay lựa chọn. */
  private candy: CandySplit | null = null;
  /** Slot đã chạm chọn làm nguồn của lối chạm-chạm ở chế độ vật thật. */
  private stagedCandySlot: number | null = null;

  /** Lựa chọn nằm trong khay, cây tách gộp đứng trên sân khấu (`BR-PSZ-01`). */
  override readonly needsTray: boolean = !isCandyContent(this.content);

  /** Số vật nguồn trong khay của vòng — shell đo chiều cao khay (`BR-PSZ-13`). */
  override get trayItemCount(): number {
    if (isCandyContent(this.content)) {
      return 0;
    }
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
    this.wrongFlash.clear();
    this.mood.clear();
    this.lastFrameMs = 0;
    this.isWon = false;
    this.candy = isCandyContent(this.content)
      ? new CandySplit(
          this.content.whole.value,
          this.content.parts.map((part) => ({
            id: part.id,
            locked: !part.is_target,
            goal: part.value,
            initial: part.value,
          }))
        )
      : null;
    this.stagedCandySlot = null;
    this.displayOptions =
      Reflect.get(this.difficulty, "shuffle_items") === true
        ? shuffle(this.content.options, deriveStream(this.layoutSeed, "items"))
        : [...this.content.options];
  }

  override storyLine(): string {
    return GT007_STORY_LINE;
  }

  /** Reo sau phần đúng, nghiêng đầu sau phần sai (`BR-E007-05`). */
  override mascotMood(): MascotPose | null {
    return this.isWon ? null : this.mood.current();
  }

  update(deltaMs: number): void {
    this.mood.tick(deltaMs);
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
    return this.candy
      ? this.validateCandyAction(action)
      : this.validateChoiceAction(action);
  }

  private validateChoiceAction(action: GameAction): ActionResult {
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
      this.queueSfx("candy_drop");
      this.mood.set("cheer", GT007_CHEER_MS);
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
      // Tổng chưa khớp: nhịp hổ phách trên ô tổng, lựa chọn đứng yên (BR-E007-04).
      this.wrongFlash.trigger(this.lastFrameMs);
      this.mood.set("wonder", GT007_WONDER_MS);
    }
  }

  onItemPlaced(itemId: string, slotId?: string): void {
    this.onPartFilled(itemId, slotId);
  }

  override checkWinCondition(): boolean {
    if (this.candy) {
      return this.isWon;
    }
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
    if (this.candy) {
      return this.computeCandyLayout(ageBand, this.candy);
    }
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
    if (this.candy) {
      return this.toCandyAction(gesture);
    }
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
    if (this.candy) {
      const step = this.candy.nextStep();
      return step ? this.candySlotIndex(step.from) : null;
    }
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
    if (this.candy) {
      const step = this.candy.nextStep();
      return step ? this.candySlotIndex(step.to) : null;
    }
    const partIdx = this.content.parts.findIndex(
      (part) => part.is_target && !this.filledParts.has(part.id)
    );
    const slot = this.targetSlots[partIdx + 1];
    const index = partIdx >= 0 && slot ? this.slots.indexOf(slot) : -1;
    return index >= 0 ? index : null;
  }

  override commit(action: GameAction): void {
    if (this.candy) {
      this.commitCandyAction(action);
      return;
    }
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
    if (this.candy) {
      return this.getCandyView(this.candy);
    }
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
        state: this.wrongFlash.isActive(this.lastFrameMs)
          ? "incorrect"
          : "idle",
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

  // ── Chế độ vật thật (`BR-E007-06..09`) ──────────────────────────────

  private computeCandyLayout(
    ageBand: AgeBand,
    candy: CandySplit
  ): readonly Slot[] {
    const touchFloor = resolveTouchFloor(ageBand, this.cssPerLogic);
    const stage = this.stageRect ?? {
      x: SAFE_MARGIN_PX,
      y: CONTENT_TOP_PX,
      w: this.logicSpace.w - 2 * SAFE_MARGIN_PX,
      h: this.logicSpace.h - CONTENT_TOP_PX - SAFE_MARGIN_PX,
    };
    return computeCandySlots(stage, touchFloor, candy.trays.length);
  }

  /** Slot của một đầu mút: ô tổng là slot 0, khay `i` là slot `i + 1`. */
  private candySlotIndex(point: CandyEndpoint): number | null {
    const slot = this.slots[point.kind === "plate" ? 0 : point.index + 1];
    return slot ? this.slots.indexOf(slot) : null;
  }

  private candyEndpointAt(x: number, y: number): CandyEndpoint | null {
    const index = findNearestHitSlot(this.slots, x, y, HIT_TOLERANCE_PX);
    if (index < 0) {
      return null;
    }
    return index === 0 ? { kind: "plate" } : { kind: "tray", index: index - 1 };
  }

  private toCandyAction(gesture: Gesture): GameAction | null {
    if (gesture.type === "drop") {
      const from = this.candyEndpointAt(gesture.fromX, gesture.fromY);
      const to = this.candyEndpointAt(gesture.toX, gesture.toY);
      return from && to ? this.candyMoveAction(from, to) : null;
    }
    if (gesture.type !== "tap") {
      return null;
    }
    const tapped = this.candyEndpointAt(gesture.x, gesture.y);
    if (!tapped) {
      return null;
    }
    const slot = tapped.kind === "plate" ? 0 : tapped.index + 1;
    const staged = this.stagedCandySlot;
    if (staged === null) {
      this.stagedCandySlot = this.canStageCandy(tapped) ? slot : null;
      return null;
    }
    if (staged === slot) {
      this.stagedCandySlot = null;
      return null;
    }
    const from: CandyEndpoint =
      staged === 0 ? { kind: "plate" } : { kind: "tray", index: staged - 1 };
    return this.candyMoveAction(from, tapped);
  }

  /** Nguồn chạm-chạm: ô tổng còn vật chưa chia, hoặc khay đích đang có vật. */
  private canStageCandy(point: CandyEndpoint): boolean {
    const candy = this.candy;
    if (!candy) {
      return false;
    }
    if (point.kind === "plate") {
      return candy.remaining > 0;
    }
    return !candy.trays[point.index]?.locked && candy.countOf(point.index) > 0;
  }

  private candyMoveAction(from: CandyEndpoint, to: CandyEndpoint): GameAction {
    return { type: "move_candy", data: { from, to } };
  }

  private parseCandyMove(
    action: GameAction
  ): { from: CandyEndpoint; to: CandyEndpoint } | null {
    if (action.type !== "move_candy" || typeof action.data !== "object") {
      return null;
    }
    const from = Reflect.get(action.data ?? {}, "from");
    const to = Reflect.get(action.data ?? {}, "to");
    return isCandyEndpoint(from) && isCandyEndpoint(to) ? { from, to } : null;
  }

  private validateCandyAction(action: GameAction): ActionResult {
    const move = this.parseCandyMove(action);
    if (!(move && this.candy)) {
      return ACTION_IGNORED;
    }
    const outcome = this.candy.preview(move.from, move.to);
    if (outcome === "moved") {
      return ACTION_CORRECT;
    }
    return outcome === "locked" ? ACTION_RETRY : ACTION_IGNORED;
  }

  private commitCandyAction(action: GameAction): void {
    const move = this.parseCandyMove(action);
    const candy = this.candy;
    this.stagedCandySlot = null;
    if (!(move && candy)) {
      return;
    }
    const outcome = candy.move(move.from, move.to);
    if (outcome === "locked") {
      this.onCandyLocked(candy);
      return;
    }
    if (outcome !== "moved") {
      return;
    }
    if (move.to.kind === "tray") {
      const part = this.content.parts[move.to.index];
      this.recordEvent("part_filled", {
        part_id: part?.id ?? "",
        value: candy.countOf(move.to.index),
      });
      if (move.from.kind === "plate") {
        this.queueSfx("candy_drop");
        this.mood.set("cheer", GT007_CHEER_MS);
      }
    }
    if (candy.isWon()) {
      this.exploreTracker.recordCorrectAttempt();
      this.winSession();
    }
  }

  /** Vật vào khay khoá: tổng sẽ vượt `whole`, báo trên ô tổng (`BR-E007-08`). */
  private onCandyLocked(candy: CandySplit): void {
    const expectedWhole = this.content.whole.value;
    const actualSum = expectedWhole + 1;
    this.exploreTracker.recordWrongAttempt({
      reasonVi: `Khay này đã đủ phần rồi, thêm vào thì nhiều hơn ${expectedWhole}`,
      targetId: this.content.whole.id,
      actualValue: actualSum,
      expectedValue: expectedWhole,
    });
    this.recordEvent("control_of_error", {
      actual_sum: actualSum,
      expected_whole: expectedWhole,
      remaining: candy.remaining,
      micro_sandbox: this.exploreTracker.isMicroSandboxActive(),
    });
    this.wrongFlash.trigger(this.lastFrameMs);
    this.mood.set("wonder", GT007_WONDER_MS);
  }

  private getCandyView(candy: CandySplit): EngineView {
    const spoken = (value: number): string => String(value);
    const entities: ViewEntity[] = this.slots.map((slot, i) => {
      const isPlate = i === 0;
      const count = isPlate ? candy.whole : candy.countOf(i - 1);
      const staged = this.stagedCandySlot === i;
      let state: ViewEntity["state"] = "idle";
      if (isPlate && this.wrongFlash.isActive(this.lastFrameMs)) {
        state = "incorrect";
      } else if (staged) {
        state = "selected";
      }
      return {
        id: isPlate
          ? this.content.whole.id
          : (this.content.parts[i - 1]?.id ?? `tray_${i}`),
        slotIndex: this.slots.indexOf(slot),
        role: isPlate ? "source" : "target",
        state,
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
        hitShape: "square",
        label: spoken(count),
        spokenLabel: formatSpokenLabel(spoken(count)),
      };
    });
    return { entities, activePrompt: this.content.prompt };
  }

  private renderCandy(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    candy: CandySplit
  ): void {
    drawCandySplit(ctx, rs, {
      state: candy,
      slots: this.slots,
      asset: this.content.whole.asset ?? CANDY_DEFAULT_ASSET,
      won: this.isWon,
    });
    drawMontessoriControlOfErrorPill(
      ctx,
      this.stageRect ?? sceneBox(rs),
      this.exploreTracker,
      rs.viewport?.scale
    );
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    this.lastFrameMs = timeMs;
    drawSceneBackground(ctx, rs, this.themeId);
    const zones = pickTrayZones(this.stageRect, this.trayRect);
    // Khỉ Nhỏ vẽ ngay sau nền, ở góc trống ngoài vùng chạm (`BR-E007-10`).
    drawStoryCharacterInStage(
      ctx,
      "monkey",
      zones?.stage ?? this.stageRect,
      this.slots
    );
    if (this.candy) {
      this.renderCandy(ctx, rs, this.candy);
      return;
    }
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
          state: this.wrongFlash.isActive(timeMs) ? "wrong" : "idle",
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
      const rawState = this.getRenderItemState(opt.id);
      let state: ItemVisualState = rawState;
      if (this.stagedOptionId === opt.id && rawState === "idle") {
        state = "selected";
      }
      drawSlotItem(ctx, rs, slot, {
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
