import type { AgeBand } from "#src/contracts/types";
import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  type HintLevel,
  type HintTarget,
  TemplateGameSession,
} from "#src/game-session";
import type { EngineView, Gesture } from "#src/interaction";
import { pickTrayZones } from "#src/layout/tray-layout";
import type { Slot } from "#src/layout/types";
import {
  drawGT007BondConnector,
  drawGT007OptionToken,
  drawGT007PartSocket,
  drawGT007WholeFrame,
} from "#src/render/gt-007-shapes";
import {
  drawMontessoriControlOfErrorPill,
  drawQuantityRepresentation,
  drawSceneBackground,
  drawStoryCharacterInStage,
  drawWoodenTokenDock,
  sceneBox,
  spawnParticlesAtSlot,
} from "#src/render/index.js";
import type { MascotPose } from "#src/render/mascot";
import { deriveStream } from "#src/rng/mulberry32";
import { shuffle } from "#src/rng/shuffle";
import type { DegradationState } from "#src/systems/degradation";
import {
  type ControlOfErrorDiagnostics,
  MontessoriExploreTracker,
} from "#src/systems/montessori-explore-system";
import { MoodPulse } from "#src/systems/mood-pulse";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import { WrongFlash } from "#src/systems/wrong-flash";
import {
  buildGT007CandyView,
  CANDY_DEFAULT_ASSET,
  type CandySplit,
  candySlotIndex,
  computeCandyStageSlots,
  createCandySplit,
  drawCandySplit,
  parseCandyMoveData,
  resolveCandyGesture,
} from "#src/templates/GT-007/candy-split";
import {
  buildGT007ChoiceView,
  canOptionSatisfyBond,
  computeChoiceSlots,
  computeKnownSum,
  extractOptionId,
  extractPartId,
  findGT007ChoiceOption,
  findGT007HoveredSlot,
  findGT007TargetPart,
  type GT007OptionPreview,
  getGT007Clock,
  isBondChoiceComplete,
  isCandyContent,
  isTenFrameContent,
  resetGT007Clock,
  resolveNextTargetPartId,
  resolveOptionEntityState,
  resolveOptionVisualState,
  resolvePartPopScale,
  resolveWrongFlashProgress,
  stepParticlesWithinStage,
} from "#src/templates/GT-007/layout";
import type {
  GT007Content,
  GT007Difficulty,
} from "#src/templates/GT-007/template";

type Opt = GT007Content["options"][number];
type Part = GT007Content["parts"][number];

export const FIBONACCI_SEQUENCE = [1, 1, 2, 3, 5, 8, 13, 21] as const;
export const GT007_STORY_LINE =
  "Khỉ Nhỏ chia kẹo cho hai bạn. Một bạn đã có phần rồi, bé chọn phần kẹo còn lại cho bạn kia nhé!";
export const GT007_CHEER_MS = 1000;
export const GT007_WONDER_MS = 1500;

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
  private logicClockMs = 0;
  private isRoundClosed = false;
  private touchingSlotIndex: number | null = null;
  private hoveredSlotIndex: number | null = null;
  private particles: Particle[] = [];
  private displayOptions: readonly Opt[] = [];

  filledParts: Map<string, number> = new Map();
  private readonly filledOptionIds = new Map<string, string>();
  private candy: CandySplit | null = null;
  private stagedCandySlot: number | null = null;

  override readonly needsTray: boolean = !isCandyContent(this.content);
  override readonly usesPromptZone = true;

  override get trayItemCount(): number {
    return isCandyContent(this.content) ? 0 : this.getOptions().length;
  }

  private getOptions(): readonly Opt[] {
    return this.displayOptions.length > 0
      ? this.displayOptions
      : this.content.options;
  }

  override takePillNarration(): string | null {
    return this.exploreTracker.takePillNarration();
  }

  setupEntities(): void {
    this.filledParts.clear();
    this.filledOptionIds.clear();
    this.exploreTracker.reset(false);
    this.previewedOptionId = null;
    this.stagedOptionId = null;
    this.wrongFlash.clear();
    this.mood.clear();
    this.logicClockMs = 0;
    this.isRoundClosed = false;
    this.touchingSlotIndex = null;
    this.hoveredSlotIndex = null;
    this.particles = [];
    this.isWon = false;
    resetGT007Clock(this);
    this.candy = createCandySplit(this.content);
    this.stagedCandySlot = null;
    const shuf = Reflect.get(this.difficulty, "shuffle_items") === true;
    const rng = deriveStream(this.layoutSeed, "items");
    this.displayOptions = shuf
      ? shuffle(this.content.options, rng)
      : [...this.content.options];
  }

  override destroy(): void {
    resetGT007Clock(this);
    super.destroy();
  }

  override storyLine(): string {
    return GT007_STORY_LINE;
  }

  override mascotMood(): MascotPose | null {
    return this.isWon || this.isRoundClosed ? null : this.mood.current();
  }

  update(deltaMs: number): void {
    if (deltaMs > 0) {
      this.logicClockMs += deltaMs;
    }
    if (this.wrongFlash.hasExpired(this.logicClockMs)) {
      this.wrongFlash.clear();
    }
    this.mood.tick(deltaMs);
    this.exploreTracker.tick(deltaMs);
    const stage =
      pickTrayZones(this.stageRect, this.trayRect)?.stage ?? this.stageRect;
    this.particles = stepParticlesWithinStage(this.particles, deltaMs, stage);
  }

  setTouchingSlot(slotIndex: number | null): void {
    this.touchingSlotIndex =
      this.isWon || this.isRoundClosed ? null : slotIndex;
  }

  getTouchingSlot(): number | null {
    return this.touchingSlotIndex;
  }

  setPointerOver(x: number, y: number): void {
    if (this.isWon || this.isRoundClosed) {
      this.clearPointerOver();
      return;
    }
    this.hoveredSlotIndex = findGT007HoveredSlot(
      this.slots,
      this.candy !== null,
      x,
      y
    );
  }

  clearPointerOver(): void {
    this.hoveredSlotIndex = null;
    this.touchingSlotIndex = null;
  }

  getHoveredSlot(): number | null {
    return this.hoveredSlotIndex;
  }

  override isAcceptingInput(): boolean {
    return super.isAcceptingInput() && !this.isRoundClosed;
  }

  override dispatch(gesture: Gesture): ActionResult | undefined {
    return this.isWon || this.isRoundClosed
      ? ACTION_IGNORED
      : super.dispatch(gesture);
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

  previewOption(optionId: string): GT007OptionPreview | null {
    const option = this.getOptions().find((o) => o.id === optionId);
    if (!option) {
      return null;
    }
    const resultingSum =
      computeKnownSum(this.content, this.filledParts) + option.value;
    const expectedWhole = this.content.whole.value;
    this.previewedOptionId = optionId;
    this.exploreTracker.recordExploreAction("bond_previewed");
    this.recordEvent("option_previewed", {
      option_id: optionId,
      option_value: option.value,
      resulting_sum: resultingSum,
      expected_whole: expectedWhole,
    });
    return { optionValue: option.value, resultingSum, expectedWhole };
  }

  getStagedOptionId(): string | null {
    return this.stagedOptionId;
  }

  private getTargetPartId(): string {
    return resolveNextTargetPartId(this.content, this.filledParts);
  }

  private canSatisfy(targetId: string, option: Opt): boolean {
    const opts = this.getOptions();
    return canOptionSatisfyBond(
      this.content,
      this.filledParts,
      this.filledOptionIds,
      targetId,
      option,
      opts
    );
  }

  validateAction(action: GameAction): ActionResult {
    if (this.isWon || this.isRoundClosed) {
      return ACTION_IGNORED;
    }
    if (this.candy) {
      return this.validateCandyAction(action);
    }
    if (action.type !== "fill_part" && action.type !== "tap_option") {
      return ACTION_IGNORED;
    }
    const optionId = extractOptionId(action.data);
    const option = this.getOptions().find((o) => o.id === optionId);
    if (!option) {
      return ACTION_RETRY;
    }
    const targetId = extractPartId(action.data) ?? this.getTargetPartId();
    return this.canSatisfy(targetId, option) ? ACTION_CORRECT : ACTION_RETRY;
  }

  private spawnSlotBurst(slot: Slot | undefined): void {
    if (!slot || this.degradation?.particles_enabled === false) {
      return;
    }
    const stage =
      pickTrayZones(this.stageRect, this.trayRect)?.stage ?? this.stageRect;
    this.particles.push(
      ...stepParticlesWithinStage(spawnParticlesAtSlot(slot, 6), 0.1, stage)
    );
  }

  private recordWrongBond(
    reasonVi: string,
    targetId: string,
    actualSum: number,
    payload: Record<string, string | number | boolean>
  ): void {
    const expectedValue = this.content.whole.value;
    this.exploreTracker.recordWrongAttempt({
      reasonVi,
      targetId,
      actualValue: actualSum,
      expectedValue,
    });
    this.recordEvent("control_of_error", {
      ...payload,
      actual_sum: actualSum,
      expected_whole: expectedValue,
      micro_sandbox: this.exploreTracker.isMicroSandboxActive(),
    });
    this.wrongFlash.trigger(this.logicClockMs);
    this.mood.set("wonder", GT007_WONDER_MS);
    if (!this.difficulty.allow_retry) {
      this.isRoundClosed = true;
      this.stagedOptionId = null;
      this.completeSession();
    }
  }

  onPartFilled(optionId: string, partId?: string): void {
    if (this.isWon || this.isRoundClosed) {
      return;
    }
    const targetId = partId ?? this.getTargetPartId();
    const targetPart = this.content.parts.find((p) => p.id === targetId);
    const option = this.getOptions().find((o) => o.id === optionId);
    if (!(option && targetPart?.is_target)) {
      return;
    }
    const isCorrect = this.canSatisfy(targetId, option);
    this.recordEvent("bond_selected", {
      option_id: optionId,
      part_id: targetId,
      is_correct: isCorrect,
    });
    if (isCorrect) {
      this.wrongFlash.clear();
      this.exploreTracker.recordCorrectAttempt();
      this.filledParts.set(targetId, option.value);
      this.filledOptionIds.set(targetId, option.id);
      const clock = getGT007Clock(this);
      clock.partPopAtMs.set(targetId, this.logicClockMs);
      const partIdx = this.content.parts.findIndex((p) => p.id === targetId);
      this.spawnSlotBurst(this.targetSlots[partIdx + 1]);
      this.queueSfx("candy_drop");
      this.mood.set("cheer", GT007_CHEER_MS);
      this.recordEvent("part_filled", {
        part_id: targetId,
        value: option.value,
      });
      if (this.checkWinCondition()) {
        clock.winAtMs = this.logicClockMs;
        this.winSession();
      }
      return;
    }
    const known = computeKnownSum(this.content, this.filledParts, targetId);
    const actual = known + option.value;
    const reason = `Gộp ${known} và ${option.value} được ${actual} (cần ${this.content.whole.value})`;
    this.recordWrongBond(reason, targetId, actual, { option_id: optionId });
  }

  onItemPlaced(itemId: string, slotId?: string): void {
    this.onPartFilled(itemId, slotId);
  }

  override checkWinCondition(): boolean {
    return this.candy
      ? this.isWon
      : isBondChoiceComplete(this.content, this.filledParts);
  }

  protected computeSlots(ageBand: AgeBand): readonly Slot[] {
    if (this.candy) {
      return computeCandyStageSlots(
        this.candy,
        ageBand,
        this.cssPerLogic,
        this.logicSpace,
        this.stageRect
      );
    }
    return computeChoiceSlots(
      this.content,
      this.getOptions().length,
      ageBand,
      this.cssPerLogic,
      this.logicSpace,
      this.stageRect,
      this.trayRect
    );
  }

  private hitOption(x: number, y: number): Opt | null {
    const src = this.sourceSlots;
    return findGT007ChoiceOption(
      this.getOptions(),
      src,
      this.filledOptionIds,
      x,
      y
    );
  }

  private hitPart(x: number, y: number, inc = false): Part | null {
    const inF = pickTrayZones(this.stageRect, this.trayRect) !== null;
    const t = this.targetSlots;
    return findGT007TargetPart(
      this.content,
      t,
      this.filledParts,
      inF,
      x,
      y,
      inc
    );
  }

  private toTapAction(
    gesture: Extract<Gesture, { type: "tap" }>
  ): GameAction | null {
    if (this.stagedOptionId) {
      const part = this.hitPart(gesture.x, gesture.y, true);
      if (part) {
        return {
          type: "fill_part",
          data: { option_id: this.stagedOptionId, part_id: part.id },
        };
      }
    }
    const opt = this.hitOption(gesture.x, gesture.y);
    if (opt) {
      this.wrongFlash.clear();
      this.stagedOptionId = this.stagedOptionId === opt.id ? null : opt.id;
      const clock = getGT007Clock(this);
      clock.stagedAtMs =
        this.stagedOptionId === null ? null : this.logicClockMs;
      return null;
    }
    const filled = this.hitPart(gesture.x, gesture.y, true);
    if (filled && this.filledParts.has(filled.id)) {
      this.filledParts.delete(filled.id);
      this.filledOptionIds.delete(filled.id);
      this.wrongFlash.clear();
    }
    return null;
  }

  override toAction(gesture: Gesture): GameAction | null {
    if (this.isWon || this.isRoundClosed) {
      return null;
    }
    if (this.candy) {
      const stg = this.stagedCandySlot;
      const step = resolveCandyGesture(this.candy, this.slots, gesture, stg);
      if (step.clearWrong) {
        this.wrongFlash.clear();
      }
      this.stagedCandySlot = step.stagedSlot;
      return step.action;
    }
    if (gesture.type === "drop") {
      const opt = this.hitOption(gesture.fromX, gesture.fromY);
      const part = opt ? this.hitPart(gesture.toX, gesture.toY, true) : null;
      return opt && part
        ? { type: "fill_part", data: { option_id: opt.id, part_id: part.id } }
        : null;
    }
    return gesture.type === "tap" ? this.toTapAction(gesture) : null;
  }

  override getHintTargetIndex(): number | null {
    if (this.isWon || this.isRoundClosed) {
      return null;
    }
    if (this.candy) {
      const step = this.candy.nextStep();
      return step ? candySlotIndex(this.slots, step.from) : null;
    }
    const targetId = this.getTargetPartId();
    const idx = this.getOptions().findIndex((o) =>
      this.canSatisfy(targetId, o)
    );
    const sourceSlot = this.sourceSlots[idx];
    return sourceSlot ? this.slots.indexOf(sourceSlot) : null;
  }

  override getHintDestinationIndex(): number | null {
    if (this.isWon || this.isRoundClosed) {
      return null;
    }
    if (this.candy) {
      const step = this.candy.nextStep();
      return step ? candySlotIndex(this.slots, step.to) : null;
    }
    const partIdx = this.content.parts.findIndex(
      (part) => part.is_target && !this.filledParts.has(part.id)
    );
    const slot = this.targetSlots[partIdx + 1];
    const index = partIdx >= 0 && slot ? this.slots.indexOf(slot) : -1;
    return index >= 0 ? index : null;
  }

  private isStagedSourceValid(hintSrcSlotIdx: number): boolean {
    if (this.candy) {
      return this.stagedCandySlot === hintSrcSlotIdx;
    }
    const opt = this.getOptions().find((o) => o.id === this.stagedOptionId);
    return opt ? this.canSatisfy(this.getTargetPartId(), opt) : false;
  }

  override getHintTargetForLevel(level: HintLevel): HintTarget | null {
    const srcIdx = this.getHintTargetIndex();
    const destIdx = this.getHintDestinationIndex();
    if (srcIdx === null) {
      return null;
    }
    if (level === 1) {
      const useDest = destIdx !== null && this.isStagedSourceValid(srcIdx);
      return { kind: "slot", index: useDest ? destIdx : srcIdx };
    }
    return destIdx === null
      ? { kind: "slot", index: srcIdx }
      : { kind: "slot", index: srcIdx, toIndex: destIdx };
  }

  override commit(action: GameAction): void {
    if (this.isWon || this.isRoundClosed) {
      return;
    }
    if (this.candy) {
      this.commitCandyAction(action);
      return;
    }
    if (action.type === "fill_part") {
      const optionId = extractOptionId(action.data);
      const partId = extractPartId(action.data);
      if (optionId) {
        this.onPartFilled(optionId, partId);
        this.stagedOptionId = null;
        getGT007Clock(this).stagedAtMs = null;
      }
    }
  }

  override getView(): EngineView {
    const isWrong = this.wrongFlash.isActive(this.logicClockMs);
    if (this.candy) {
      const stg = this.stagedCandySlot;
      return buildGT007CandyView(
        this.candy,
        this.content,
        this.slots,
        isWrong,
        stg
      );
    }
    const stFn = (id: string) =>
      resolveOptionEntityState(
        id,
        this.stagedOptionId,
        this.filledOptionIds,
        this.getRenderItemState(id)
      );
    return buildGT007ChoiceView(
      this.content,
      this.getOptions(),
      this.slots,
      this.filledParts,
      isWrong,
      stFn
    );
  }

  private validateCandyAction(action: GameAction): ActionResult {
    const move =
      action.type === "move_candy" ? parseCandyMoveData(action.data) : null;
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
    const move =
      action.type === "move_candy" ? parseCandyMoveData(action.data) : null;
    const candy = this.candy;
    this.stagedCandySlot = null;
    if (!(move && candy)) {
      return;
    }
    const outcome = candy.move(move.from, move.to);
    if (outcome === "locked") {
      const expected = this.content.whole.value;
      const reason = `Khay này đã đủ phần rồi, thêm vào thì nhiều hơn ${expected}`;
      this.recordWrongBond(reason, this.content.whole.id, expected + 1, {
        remaining: candy.remaining,
      });
      return;
    }
    if (outcome !== "moved") {
      return;
    }
    this.wrongFlash.clear();
    if (move.to.kind === "tray") {
      const part = this.content.parts[move.to.index];
      this.recordEvent("part_filled", {
        part_id: part?.id ?? "",
        value: candy.countOf(move.to.index),
      });
      this.spawnSlotBurst(this.slots[move.to.index + 1]);
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

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    drawSceneBackground(ctx, rs, this.themeId);
    const zones = pickTrayZones(this.stageRect, this.trayRect);
    const stageZone = zones?.stage ?? this.stageRect ?? null;
    const stg = stageZone ?? undefined;
    drawStoryCharacterInStage(ctx, "monkey", stg, this.slots);
    const wrongProgress = resolveWrongFlashProgress(
      this.wrongFlash,
      this.logicClockMs
    );

    if (this.candy) {
      drawCandySplit(ctx, rs, {
        state: this.candy,
        slots: this.slots,
        asset: this.content.whole.asset ?? CANDY_DEFAULT_ASSET,
        won: this.isWon,
        wrongProgress,
        stagedSlot: this.stagedCandySlot,
        touchingSlot: this.touchingSlotIndex,
        hoveredSlot: this.hoveredSlotIndex,
      });
    } else {
      if (zones) {
        drawWoodenTokenDock(ctx, rs, zones.tray);
      }
      this.drawTreeBond(ctx, rs, timeMs, wrongProgress, stageZone);
    }
    if (this.degradation?.particles_enabled !== false) {
      rs.drawParticles(ctx, this.particles);
    }
    const pillBox = stageZone ?? sceneBox(rs);
    drawMontessoriControlOfErrorPill(
      ctx,
      pillBox,
      this.exploreTracker,
      rs.viewport?.scale
    );
  }

  private drawTreeBond(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number,
    wrongProgress: number | null,
    stageZone: Slot | { x: number; y: number; w: number; h: number } | null
  ): void {
    const targets = this.targetSlots;
    const wholeSlot = targets[0];
    const isTenFrame = isTenFrameContent(this.content);
    const clock = getGT007Clock(this);
    const logicMs = this.logicClockMs;

    if (wholeSlot) {
      this.content.parts.forEach((part, i) => {
        const s = targets[i + 1];
        if (s) {
          const ok = !part.is_target || this.filledParts.has(part.id);
          drawGT007BondConnector(ctx, wholeSlot, s, ok, this.isWon);
        }
      });
      if (isTenFrame) {
        const count = this.content.whole.value;
        drawQuantityRepresentation(ctx, rs, wholeSlot, {
          kind: "ten-frame",
          count,
        });
      }
      drawGT007WholeFrame(ctx, rs, wholeSlot, {
        label: String(this.content.whole.value),
        isTenFrame,
        isWon: this.isWon,
        wrongProgress,
        stage: stageZone,
      });
    }

    this.content.parts.forEach((part, i) => {
      const slot = targets[i + 1];
      if (!slot) {
        return;
      }
      const filled = this.filledParts.get(part.id);
      const isFilled = filled !== undefined;
      const reveal = this.isRoundClosed && !this.isWon && part.is_target;
      const partVal = filled ?? part.value;
      if (isTenFrame && (!part.is_target || isFilled || reveal)) {
        drawQuantityRepresentation(ctx, rs, slot, {
          kind: "ten-frame",
          count: partVal,
        });
      }
      const popAt = clock.partPopAtMs.get(part.id);
      const popDelta = popAt === undefined ? null : logicMs - popAt;
      drawGT007PartSocket(ctx, slot, {
        valueText: String(partVal),
        isTarget: part.is_target,
        isFilled,
        isHovered: this.hoveredSlotIndex === this.slots.indexOf(slot),
        isStagedReady: this.stagedOptionId !== null,
        isSolutionReveal: reveal,
        isTenFrame,
        popScale: resolvePartPopScale(popDelta, rs.reducedMotion),
      });
    });

    const sources = this.sourceSlots;
    const stgElapsed =
      clock.stagedAtMs === null ? null : logicMs - clock.stagedAtMs;
    this.getOptions().forEach((opt, i) => {
      const slot = sources[i];
      if (slot) {
        const touch = this.touchingSlotIndex === this.slots.indexOf(slot);
        const raw = this.getRenderItemState(opt.id);
        const state = resolveOptionVisualState(
          opt.id,
          this.stagedOptionId,
          this.filledOptionIds,
          raw,
          touch
        );
        drawGT007OptionToken(ctx, rs, slot, String(opt.value), {
          state,
          timeMs,
          stagedElapsedMs: stgElapsed,
        });
      }
    });
  }
}
