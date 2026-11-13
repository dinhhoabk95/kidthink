import type { AgeBand } from "#src/contracts/types";
import {
  ACTION_IGNORED,
  type ActionResult,
  type GameAction,
  type HintDemoStep,
  type HintLevel,
  type HintTarget,
  TemplateGameSession,
} from "#src/game-session";
import type { EngineView, Gesture } from "#src/interaction";
import { findHitSlotIndex, TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import { dockRectAroundSlots, trayBoxWithin } from "#src/layout/slot-fit";
import type { Slot } from "#src/layout/types";
import { SelectionMechanic } from "#src/mechanics/selection-mechanic";
import {
  drawGT011BlankSocket,
  drawGT011HintAxes,
  drawGT011MatrixGridGrooves,
  drawGT011SlotOverlay,
  drawGT011WaveAndInspect,
  type GT011GridContext,
} from "#src/render/gt-011-shapes";
import {
  boxFromSlots,
  drawClippedToZone,
  drawMatchGlow,
  drawMontessoriControlOfErrorPill,
  drawRoundedBoxOutline,
  drawSceneBackground,
  drawShapeTray,
  drawSlotItem,
  drawStoryCharacterInStage,
  drawWoodenTokenDock,
  matchGlowAlpha,
} from "#src/render/index.js";
import type { MascotPose } from "#src/render/mascot";
import type { ItemVisualState, SceneBox } from "#src/render/types";
import type { DegradationState } from "#src/systems/degradation";
import {
  type ControlOfErrorDiagnostics,
  MontessoriExploreTracker,
} from "#src/systems/montessori-explore-system";
import { MoodPulse } from "#src/systems/mood-pulse";
import type { RenderSystem } from "#src/systems/render-system";
import { WRONG_FLASH_MS, WrongFlash } from "#src/systems/wrong-flash";
import {
  buildGT011ViewEntities,
  computeGT011Slots,
  type GT011ClockState,
  type GT011HintResolveContext,
  type GT011OptionItem,
  getGT011Clock,
  resetGT011Clock,
  resolveGT011DisplayOptions,
  resolveGT011EffectiveStage,
  resolveGT011FallbackBadgeIndex,
  resolveGT011HintDemoSequence,
  resolveGT011HintTargetForLevel,
  resolveGT011InspectState,
  resolveGT011OptionDrawSlot,
  resolveGT011OptionVisualState,
  resolveGT011WaveProgress,
  resolveGT011WrongElapsedMs,
  resolveGT011WrongReasonVi,
  spawnGT011CelebrateParticles,
  stepGT011Particles,
} from "./layout.js";
import { colMatches, findBlankCell, rowMatches } from "./matrix-rule.js";
import type { GT011Content, GT011Difficulty } from "./template.js";

export interface MatrixPreview {
  readonly option_id: string;
  readonly row_matches: boolean;
  readonly col_matches: boolean;
}

/** Khung chuyện đọc một lần ở vòng đầu (`BR-E011-05`, `BR-FBK-16`). */
export const GT011_STORY_LINE =
  "Bướm Nhỏ trồng luống hoa, mỗi hàng và mỗi cột phải có đủ các loại, không trùng nhau. Bé chọn cho ô còn trống nhé!";

/** Mascot nghiêng đầu sau lựa chọn chưa đúng (`BR-E011-05`). */
export const GT011_WONDER_MS = 1500;

function readProp(
  data: GameAction["data"],
  key: string
): string | number | undefined {
  if (typeof data !== "object" || data === null) {
    return undefined;
  }
  const v: string | number | undefined = Reflect.get(data, key);
  return typeof v === "string" || typeof v === "number" ? v : undefined;
}

export class GT011Session extends TemplateGameSession<
  GT011Content,
  GT011Difficulty
> {
  override readonly usesPromptZone = true;
  degradation: DegradationState | null = null;

  private readonly mechanic = new SelectionMechanic({ mode: "single" });
  private readonly exploreTracker = new MontessoriExploreTracker({
    milestoneTarget: 2,
  });
  private displayOptions: readonly GT011OptionItem[] = [];
  private preview: MatrixPreview | null = null;
  private wrongOptionId: string | null = null;
  private readonly wrongFlash = new WrongFlash();
  private readonly mood = new MoodPulse();
  private isRoundClosed = false;
  private revealedCorrectOnClose = false;
  private activeHintLevel: 0 | HintLevel = 0;

  constructor(
    content: GT011Content,
    difficulty: GT011Difficulty,
    layoutSeed = 0,
    themeId?: string
  ) {
    super(content, difficulty, layoutSeed, themeId);
    this.displayOptions = resolveGT011DisplayOptions(
      this.content.options,
      this.layoutSeed
    );
  }

  override takePillNarration(): string | null {
    return this.exploreTracker.takePillNarration();
  }

  override isAcceptingInput(): boolean {
    return !(this.isWon || this.isRoundClosed);
  }

  setupEntities(): void {
    this.displayOptions = resolveGT011DisplayOptions(
      this.content.options,
      this.layoutSeed
    );
    this.mechanic.reset();
    this.exploreTracker.reset(false);
    this.preview = null;
    this.wrongOptionId = null;
    this.wrongFlash.clear();
    this.mood.clear();
    this.isWon = false;
    this.isRoundClosed = false;
    this.revealedCorrectOnClose = false;
    this.activeHintLevel = 0;
    this.renderItemStates.clear();
    resetGT011Clock(this);
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

  getDisplayOptions(): readonly GT011OptionItem[] {
    return this.displayOptions;
  }

  override storyLine(): string {
    return GT011_STORY_LINE;
  }

  override mascotMood(): MascotPose | null {
    return this.isWon ? null : this.mood.current();
  }

  override onScaffoldEscalated(level: HintLevel): void {
    this.activeHintLevel = level;
  }

  override onHintCleared(): void {
    this.activeHintLevel = 0;
  }

  setTouchingSlot(index: number | null): void {
    getGT011Clock(this).touchingSlotIndex = index;
  }

  getTouchingSlot(): number | null {
    return getGT011Clock(this).touchingSlotIndex;
  }

  private hit(
    s: readonly Slot[],
    x: number,
    y: number,
    sh: "circle" | "square"
  ): number {
    return findHitSlotIndex(s, x, y, sh, TAP_TOLERANCE_PX);
  }

  setPointerOver(
    xOrPt: number | { readonly x: number; readonly y: number } | null,
    y?: number
  ): void {
    const clock = getGT011Clock(this);
    let pt: { readonly x: number; readonly y: number } | null = null;
    if (typeof xOrPt === "number") {
      if (typeof y === "number") {
        pt = { x: xOrPt, y };
      }
    } else {
      pt = xOrPt;
    }
    if (!(pt && this.isAcceptingInput())) {
      clock.hoveredSlotIndex = null;
      return;
    }
    const n = this.content.matrix.rows * this.content.matrix.cols;
    const oIdx = this.hit(this.slots.slice(n), pt.x, pt.y, "circle");
    if (oIdx >= 0) {
      clock.hoveredSlotIndex = n + oIdx;
      return;
    }
    const cIdx = this.hit(this.slots.slice(0, n), pt.x, pt.y, "square");
    clock.hoveredSlotIndex = cIdx >= 0 ? cIdx : null;
  }

  clearPointerOver(): void {
    const clock = getGT011Clock(this);
    clock.hoveredSlotIndex = null;
    clock.touchingSlotIndex = null;
  }

  update(deltaMs: number): void {
    const dt = Math.max(0, deltaMs);
    const clock = getGT011Clock(this);
    clock.logicMs += dt;
    this.mood.tick(dt);
    this.exploreTracker.tick(dt);
    stepGT011Particles(clock.particles, this.stageBounds());
    if (
      this.wrongOptionId &&
      this.isAcceptingInput() &&
      this.wrongFlash.hasExpired(clock.logicMs)
    ) {
      this.setRenderItemState(this.wrongOptionId, "idle");
      this.mechanic.reset();
      this.preview = null;
      this.wrongOptionId = null;
      this.wrongFlash.clear();
    }
  }

  getBlankCell(): { row: number; col: number } {
    const b = findBlankCell(this.content.matrix);
    return { row: b?.row ?? 0, col: b?.col ?? 0 };
  }

  getPreview(): MatrixPreview | null {
    return this.preview;
  }

  onOptionPreviewed(optionId: string): MatrixPreview | null {
    const opt = this.isAcceptingInput()
      ? this.displayOptions.find((o) => o.option_id === optionId)
      : undefined;
    if (!opt) {
      return null;
    }
    this.activeHintLevel = 0;
    const clock = getGT011Clock(this);
    clock.previewLogicMs = clock.logicMs;
    this.exploreTracker.recordExploreAction("matrix_previewed");
    const row_matches = rowMatches(this.content.matrix, opt.asset);
    const col_matches = colMatches(this.content.matrix, opt.asset);
    this.preview = { option_id: optionId, row_matches, col_matches };
    this.recordEvent("option_previewed", { ...this.preview });
    return this.preview;
  }

  validateAction(action: GameAction): ActionResult {
    if (!this.isAcceptingInput()) {
      return ACTION_IGNORED;
    }
    if (action.type === "inspect_cell") {
      const idx = readProp(action.data, "slot_index");
      const n = this.content.matrix.rows * this.content.matrix.cols;
      return typeof idx === "number" &&
        Number.isInteger(idx) &&
        idx >= 0 &&
        idx < n
        ? { valid: true, feedback: "none" }
        : ACTION_IGNORED;
    }
    return this.mechanic.validate(action, this.selectionItems());
  }

  override toAction(g: Gesture): GameAction | null {
    if (!this.isAcceptingInput()) {
      return null;
    }
    const n = this.content.matrix.rows * this.content.matrix.cols;
    const cSlots = this.slots.slice(0, n);
    const oSlots = this.slots.slice(n);
    if (g.type === "drop") {
      const fIdx = this.hit(oSlots, g.fromX, g.fromY, "circle");
      const tIdx = this.hit(cSlots, g.toX, g.toY, "square");
      const opt = fIdx >= 0 ? this.displayOptions[fIdx] : undefined;
      return opt && tIdx >= 0
        ? { type: "select_item", data: { item_id: opt.option_id } }
        : null;
    }
    if (g.type !== "tap") {
      return null;
    }
    const idx = this.hit(oSlots, g.x, g.y, "circle");
    const opt = idx >= 0 ? this.displayOptions[idx] : undefined;
    if (opt) {
      return { type: "select_item", data: { item_id: opt.option_id } };
    }
    const cIdx = this.hit(cSlots, g.x, g.y, "square");
    return cIdx >= 0
      ? { type: "inspect_cell", data: { slot_index: cIdx } }
      : null;
  }

  override getHintTargetIndex(): number | null {
    const idx = this.isAcceptingInput()
      ? this.displayOptions.findIndex((o) => o.is_correct)
      : -1;
    if (idx < 0) {
      return null;
    }
    const n = this.content.matrix.rows * this.content.matrix.cols;
    return this.slots.length > n ? n + idx : idx;
  }

  override getHintDestinationIndex(): number | null {
    if (!this.isAcceptingInput()) {
      return null;
    }
    const b = this.getBlankCell();
    return b.row * this.content.matrix.cols + b.col;
  }

  private hintContext(level: HintLevel): GT011HintResolveContext {
    const { cells, rows, cols } = this.content.matrix;
    const accepting = this.isAcceptingInput();
    const blank = this.getBlankCell();
    const correctIdx = this.getHintTargetIndex();
    const fallback = this.getHintTarget();
    return { level, accepting, cells, rows, cols, blank, correctIdx, fallback };
  }

  override getHintTargetForLevel(level: HintLevel): HintTarget | null {
    return resolveGT011HintTargetForLevel(this.hintContext(level));
  }

  override getHintDemoSequence(
    level: HintLevel
  ): readonly HintDemoStep[] | null {
    return resolveGT011HintDemoSequence(this.hintContext(level));
  }

  override commit(action: GameAction): void {
    if (!this.isAcceptingInput()) {
      return;
    }
    if (action.type === "inspect_cell") {
      const idx = readProp(action.data, "slot_index");
      if (typeof idx === "number" && Number.isInteger(idx)) {
        const clk = getGT011Clock(this);
        clk.inspectSlotIndex = idx;
        clk.inspectLogicMs = clk.logicMs;
        this.activeHintLevel = 0;
      }
      return;
    }
    const itemId = readProp(action.data, "item_id");
    if (typeof itemId === "string" && itemId.length > 0) {
      this.onOptionPreviewed(itemId);
      this.onOptionSelected(itemId);
    }
  }

  override getView(): EngineView {
    const n = this.content.matrix.rows * this.content.matrix.cols;
    return {
      activePrompt: this.content.prompt,
      entities: buildGT011ViewEntities({
        cells: this.content.matrix.cells,
        displayOptions: this.displayOptions,
        cellSlots: this.slots.slice(0, n),
        optionSlots: this.slots.slice(n),
        cols: this.content.matrix.cols,
        cellCount: n,
        previewOptionId: this.preview?.option_id ?? null,
        isOptionSelected: (id) => this.mechanic.isSelected(id),
      }),
    };
  }

  onOptionSelected(optionId: string): void {
    const opt = this.isAcceptingInput()
      ? this.displayOptions.find((o) => o.option_id === optionId)
      : undefined;
    if (!opt) {
      return;
    }
    this.activeHintLevel = 0;
    const clk = getGT011Clock(this);
    if (this.wrongOptionId && this.wrongOptionId !== optionId) {
      this.setRenderItemState(this.wrongOptionId, "idle");
    }
    this.mechanic.reset();
    this.mechanic.select(optionId);
    if (opt.is_correct) {
      this.applyCorrect(opt.option_id, clk);
    } else {
      this.applyWrong(opt, clk);
    }
    this.recordEvent("option_selected", {
      option_id: optionId,
      is_correct: opt.is_correct,
    });
    if (this.checkWinCondition()) {
      this.winSession();
    } else if (!this.difficulty.allow_retry) {
      this.isRoundClosed = true;
      this.revealedCorrectOnClose = true;
      clk.winLogicMs = clk.logicMs;
      this.completeSession();
    }
  }

  private applyCorrect(id: string, clk: GT011ClockState): void {
    this.wrongOptionId = null;
    this.wrongFlash.clear();
    this.setRenderItemState(id, "correct");
    clk.winLogicMs = clk.logicMs;
    const b = this.getBlankCell();
    const bSlot = this.slots[b.row * this.content.matrix.cols + b.col];
    const pOn = this.degradation?.particles_enabled ?? true;
    clk.particles = spawnGT011CelebrateParticles(
      bSlot,
      this.stageBounds(),
      pOn
    );
    this.queueSfx("seed_plop");
    this.exploreTracker.recordCorrectAttempt();
  }

  private applyWrong(opt: GT011OptionItem, clk: GT011ClockState): void {
    const id = opt.option_id;
    this.wrongOptionId = id;
    this.wrongFlash.trigger(clk.logicMs);
    clk.wrongTriggerSeq += 1;
    this.setRenderItemState(id, "wrong");
    this.mood.set("wonder", GT011_WONDER_MS);
    const rMatch = rowMatches(this.content.matrix, opt.asset);
    const cMatch = colMatches(this.content.matrix, opt.asset);
    const reasonVi = resolveGT011WrongReasonVi(rMatch, cMatch);
    this.exploreTracker.recordWrongAttempt({
      reasonVi,
      targetId: id,
      actualValue: id,
    });
    this.recordEvent("control_of_error", {
      option_id: id,
      row_matches: rMatch,
      col_matches: cMatch,
      micro_sandbox: this.exploreTracker.isMicroSandboxActive(),
    });
  }

  override checkWinCondition(): boolean {
    return (
      !this.isRoundClosed &&
      this.mechanic.isSelectionComplete(this.selectionItems())
    );
  }

  private selectionItems(): { id: string; isCorrect: boolean }[] {
    return this.displayOptions.map((o) => ({
      id: o.option_id,
      isCorrect: o.is_correct,
    }));
  }

  private optBaseIdx(opt: GT011OptionItem): number {
    const idx = this.content.options.findIndex(
      (o) => o.option_id === opt.option_id
    );
    return idx >= 0 ? idx : 0;
  }

  private stageBounds(): SceneBox {
    const eff = resolveGT011EffectiveStage(
      this.stageRect,
      this.slots,
      this.logicSpace
    );
    const { w, h } = this.logicSpace;
    return eff ?? { x: 0, y: 0, w, h };
  }

  protected computeSlots(ageBand: AgeBand): readonly Slot[] {
    return computeGT011Slots({
      optionCount: this.displayOptions.length,
      matrixRows: this.content.matrix.rows,
      matrixCols: this.content.matrix.cols,
      ageBand,
      logicSpace: this.logicSpace,
      stageRect: this.stageRect,
      cssPerLogic: this.cssPerLogic,
    });
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    drawSceneBackground(ctx, rs, this.themeId);
    const effStage = resolveGT011EffectiveStage(
      this.stageRect,
      this.slots,
      this.logicSpace
    );
    const draw = (): void => this.renderStage(ctx, rs, timeMs);
    if (effStage) {
      drawClippedToZone(ctx, effStage, draw);
    } else {
      draw();
    }
  }

  private renderStage(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    const clk = getGT011Clock(this);
    const wEl = resolveGT011WrongElapsedMs(this, this.wrongFlash, timeMs);
    const wOn =
      Boolean(this.wrongOptionId) &&
      this.wrongFlash.started &&
      wEl < WRONG_FLASH_MS;
    const wPr = wOn ? Math.min(1, Math.max(0, wEl / WRONG_FLASH_MS)) : null;
    const solved = this.isWon || this.revealedCorrectOnClose;
    const insp = resolveGT011InspectState(clk);
    const wave = resolveGT011WaveProgress(clk, solved, rs.reducedMotion);
    const effStage = resolveGT011EffectiveStage(
      this.stageRect,
      this.slots,
      this.logicSpace
    );

    drawStoryCharacterInStage(ctx, "butterfly", this.stageRect, this.slots);
    const { rows, cols } = this.content.matrix;
    const n = rows * cols;
    const cSlots = this.slots.slice(0, n);
    const oSlots = this.slots.slice(n);
    const b = this.getBlankCell();
    const g: GT011GridContext = {
      cellSlots: cSlots,
      rows,
      cols,
      blankRow: b.row,
      blankCol: b.col,
    };
    const mBox = boxFromSlots(cSlots);
    if (mBox) {
      drawShapeTray(ctx, trayBoxWithin(mBox, this.stageRect));
    }
    drawGT011MatrixGridGrooves(ctx, rs, g);
    drawWoodenTokenDock(ctx, rs, dockRectAroundSlots(oSlots, effStage));
    this.renderMatrixPreviewHighlight(ctx, rs, g, timeMs);
    drawGT011HintAxes(
      ctx,
      g,
      this.activeHintLevel,
      rs.reducedMotion ? 0 : timeMs
    );
    drawGT011WaveAndInspect(ctx, g, wave, insp);
    this.renderCells(ctx, rs, g, timeMs, clk, solved, insp?.slotIndex ?? null);
    this.renderOpts(ctx, rs, oSlots, n, clk, wOn, wPr);
    if (
      !rs.reducedMotion &&
      (this.degradation?.particles_enabled ?? true) &&
      clk.particles.length > 0
    ) {
      rs.drawParticles(ctx, clk.particles);
    }
    drawMontessoriControlOfErrorPill(
      ctx,
      this.stageBounds(),
      this.exploreTracker,
      rs.viewport?.scale
    );
  }

  private renderCells(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    g: GT011GridContext,
    timeMs: number,
    clk: GT011ClockState,
    solved: boolean,
    inspIdx: number | null
  ): void {
    for (const c of this.content.matrix.cells) {
      const idx = c.row * g.cols + c.col;
      const s = g.cellSlots[idx];
      if (!s) {
        continue;
      }
      if (c.asset === null) {
        this.renderBlankCell(ctx, rs, s, timeMs, solved);
        continue;
      }
      const d =
        inspIdx === idx && !rs.reducedMotion
          ? { ...s, w: s.w + 4, h: s.h + 4 }
          : s;
      drawSlotItem(
        ctx,
        rs,
        d,
        { id: `c${c.row}-${c.col}`, asset: c.asset, state: "locked" },
        "square"
      );
      const fallbackBadgeIndex = resolveGT011FallbackBadgeIndex(
        c.asset,
        (c.row + c.col) % g.cols
      );
      drawGT011SlotOverlay(ctx, d, {
        visualState: "idle",
        isHovered: clk.hoveredSlotIndex === idx,
        fallbackBadgeIndex,
      });
    }
  }

  private renderOpts(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    oSlots: readonly Slot[],
    n: number,
    clk: GT011ClockState,
    wOn: boolean,
    wPr: number | null
  ): void {
    const b = this.stageBounds();
    this.displayOptions.forEach((opt, i) => {
      const s = oSlots[i];
      if (!s) {
        return;
      }
      const idx = n + i;
      const isHovered = clk.hoveredSlotIndex === idx;
      const isWr = opt.option_id === this.wrongOptionId;
      const st = resolveGT011OptionVisualState({
        isWon: this.isWon,
        isCorrect: opt.is_correct,
        isWrongFlashing: isWr && wOn,
        isTouching: clk.touchingSlotIndex === idx,
        isPreviewed: this.preview?.option_id === opt.option_id,
      });
      const d = resolveGT011OptionDrawSlot(s, {
        visualState: st,
        isHovered,
        wrongProg: isWr ? wPr : null,
        reducedMotion: rs.reducedMotion,
        isDimmedByL3:
          this.activeHintLevel === 3 && !opt.is_correct && st === "idle",
      });
      drawSlotItem(ctx, rs, d, {
        id: opt.option_id,
        asset: opt.asset,
        state: st,
      });
      const fallbackBadgeIndex = resolveGT011FallbackBadgeIndex(
        opt.asset,
        this.optBaseIdx(opt)
      );
      drawGT011SlotOverlay(ctx, d, {
        visualState: st,
        isHovered,
        fallbackBadgeIndex,
      });
      if (isWr && wPr !== null) {
        const maxR = Math.min(
          s.x - b.x - 2,
          b.x + b.w - s.x - 2,
          s.y - b.y - 2,
          b.y + b.h - s.y - 2,
          Math.min(s.hitW, s.hitH) / 2 + 4
        );
        rs.drawRetryRing(ctx, s.x, s.y, Math.max(8, maxR), wPr);
      }
    });
  }

  private renderBlankCell(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    s: Slot,
    timeMs: number,
    solved: boolean
  ): void {
    const fOpt = solved
      ? this.displayOptions.find((o) => o.is_correct)
      : this.displayOptions.find(
          (o) => o.option_id === this.preview?.option_id
        );
    drawGT011BlankSocket(ctx, s, {
      timeMs,
      reducedMotion: rs.reducedMotion,
      hasPreview: Boolean(fOpt),
      isSolved: solved,
    });
    if (fOpt) {
      const st: ItemVisualState = solved ? "correct" : "selected";
      drawSlotItem(
        ctx,
        rs,
        s,
        { id: "preview", asset: fOpt.asset, state: st },
        "square"
      );
      const fallbackBadgeIndex = resolveGT011FallbackBadgeIndex(
        fOpt.asset,
        this.optBaseIdx(fOpt)
      );
      drawGT011SlotOverlay(ctx, s, {
        visualState: st,
        isHovered: false,
        fallbackBadgeIndex,
      });
    }
  }

  private renderMatrixPreviewHighlight(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    g: GT011GridContext,
    timeMs: number
  ): void {
    if (!this.preview) {
      return;
    }
    const glow = matchGlowAlpha(timeMs, rs.reducedMotion);
    if (this.preview.row_matches) {
      const rBox = boxFromSlots(
        g.cellSlots.filter((_, i) => Math.floor(i / g.cols) === g.blankRow)
      );
      if (rBox) {
        drawMatchGlow(ctx, rBox, glow);
        drawRoundedBoxOutline(ctx, rBox);
      }
    }
    if (this.preview.col_matches) {
      const cBox = boxFromSlots(
        g.cellSlots.filter((_, i) => i % g.cols === g.blankCol)
      );
      if (cBox) {
        drawMatchGlow(ctx, cBox, glow);
        drawRoundedBoxOutline(ctx, cBox);
      }
    }
  }
}

export default GT011Session;
