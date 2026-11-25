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
import { resolveLayout } from "#src/layout/registry";
import { dockRectAroundSlots, insetDrawSize } from "#src/layout/slot-fit";
import type { Slot } from "#src/layout/types";
import {
  drawGT010EquationExpression,
  drawGT010LookupBridge,
  drawGT010MarketBoard,
  drawGT010OptionToken,
  drawGT010RuleRowBackdrop,
} from "#src/render/gt-010-shapes";
import {
  boxFromSlots,
  drawMontessoriControlOfErrorPill,
  drawPriceTag,
  drawSceneBackground,
  drawStoryCharacterInStage,
  drawWoodenTokenDock,
  sceneBox,
  spawnParticlesAtSlot,
} from "#src/render/index.js";
import type { MascotPose } from "#src/render/mascot";
import type { DegradationState } from "#src/systems/degradation";
import {
  type ControlOfErrorDiagnostics,
  MontessoriExploreTracker,
} from "#src/systems/montessori-explore-system";
import { MoodPulse } from "#src/systems/mood-pulse";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import { WrongFlash } from "#src/systems/wrong-flash";
import {
  buildGT010View,
  buildSymbolMaps,
  findGT010HoveredSlot,
  type GT010ViewInput,
  getGT010Clock,
  getOptionState,
  getRuleState,
  resetGT010Clock,
  resolveDisplayOptions,
  resolveGT010TapAction,
  resolveHighlightedSymbolIds,
  resolveHintedRuleIds,
  resolveLookupBridgeSlots,
  resolveQuestionSymbolIds,
  resolveRelatedEquations,
  resolveRevealProgress,
  resolveSolvedState,
  resolveWrongFlashProgress,
  stepGT010Particles,
} from "./layout.js";
import type { GT010Content, GT010Difficulty } from "./template.js";

type Opt = GT010Content["options"][number];
const EXPLORE_OPTS = { milestoneTarget: 2 } as const;

/** Khung chuyện đọc một lần ở vòng đầu (`BR-E010-06`, `BR-FBK-16`). */
export const GT010_STORY_LINE =
  "Cô Gà Mái bán hàng ở chợ. Bé xem bảng giá rồi tìm giá của món còn thiếu nhé!";

/** Mascot nghiêng đầu sau giá chưa đúng (`BR-E010-06`). */
export const GT010_WONDER_MS = 1500;

export class SubstitutionSession extends TemplateGameSession<
  GT010Content,
  GT010Difficulty
> {
  override readonly usesPromptZone = true;
  degradation: DegradationState | null = null;

  private readonly exploreTracker = new MontessoriExploreTracker(EXPLORE_OPTS);
  private readonly pinnedSymbols: Map<string, number> = new Map();
  private selectedValue: number | null = null;
  private lookedUpEquationId: string | null = null;
  private symMaps = buildSymbolMaps(this.content.symbols);
  private solvedState = resolveSolvedState(this.content);
  private displayOptions = resolveDisplayOptions(
    this.content.options,
    this.layoutSeed
  );
  private readonly wrongFlash = new WrongFlash();
  private readonly mood = new MoodPulse();
  private isRoundClosed = false;
  private scaffoldHintLevel: 0 | 1 | 2 | 3 = 0;
  private particles: Particle[] = [];

  private getActiveOptions(): readonly Opt[] {
    return this.displayOptions.length > 0
      ? this.displayOptions
      : this.content.options;
  }
  override takePillNarration(): string | null {
    return this.exploreTracker.takePillNarration();
  }

  setupEntities(): void {
    this.exploreTracker.reset(false);
    this.pinnedSymbols.clear();
    this.selectedValue = null;
    this.lookedUpEquationId = null;
    this.wrongFlash.clear();
    this.mood.clear();
    this.isWon = false;
    this.isRoundClosed = false;
    this.scaffoldHintLevel = 0;
    this.particles = [];
    resetGT010Clock(this);
    getGT010Clock(this);
    const { options, symbols, equations } = this.content;
    this.displayOptions = resolveDisplayOptions(options, this.layoutSeed);
    this.symMaps = buildSymbolMaps(symbols);
    this.solvedState = resolveSolvedState(this.content);
    this.recordEvent("game_started", {
      template_code: "GT-010",
      equation_count: equations.length,
      symbol_count: symbols.length,
    });
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
  getSymbols(): GT010Content["symbols"] {
    return this.content.symbols;
  }
  getEquations(): GT010Content["equations"] {
    return this.content.equations;
  }
  getQuestion(): GT010Content["question"] {
    return this.content.question;
  }
  getOptions(): GT010Content["options"] {
    return [...this.getActiveOptions()];
  }
  getPinnedSymbolValue(symbolId: string): number | undefined {
    return this.pinnedSymbols.get(symbolId);
  }
  getPinnedSymbols(): ReadonlyMap<string, number> {
    return this.pinnedSymbols;
  }
  pinSymbolValue(symbolId: string, value: number): void {
    this.pinnedSymbols.set(symbolId, value);
    this.exploreTracker.recordExploreAction("symbol_pinned");
    this.recordEvent("equation_solved", { symbol_id: symbolId, value });
  }
  setTouchingSlot(slotIndex: number | null): void {
    getGT010Clock(this).touchingSlotIndex =
      this.isWon || this.isRoundClosed ? null : slotIndex;
  }
  getTouchingSlot(): number | null {
    return getGT010Clock(this).touchingSlotIndex;
  }
  getHoveredSlot(): number | null {
    return getGT010Clock(this).hoveredSlotIndex;
  }
  setPointerOver(x: number, y: number): void {
    if (this.isWon || this.isRoundClosed) {
      this.clearPointerOver();
      return;
    }
    const idx = findGT010HoveredSlot(
      this.slots,
      this.content.equations.length,
      x,
      y
    );
    getGT010Clock(this).hoveredSlotIndex = idx;
  }
  clearPointerOver(): void {
    const clk = getGT010Clock(this);
    clk.hoveredSlotIndex = null;
    clk.touchingSlotIndex = null;
  }
  override isAcceptingInput(): boolean {
    return super.isAcceptingInput() && !this.isWon && !this.isRoundClosed;
  }
  override dispatch(gesture: Gesture): ActionResult | undefined {
    return this.isWon || this.isRoundClosed
      ? ACTION_IGNORED
      : super.dispatch(gesture);
  }
  override onScaffoldEscalated(
    level: HintLevel,
    _trigger: "timer" | "miss_streak"
  ): void {
    this.scaffoldHintLevel = level;
  }
  override onHintCleared(): void {
    this.scaffoldHintLevel = 0;
  }

  lookUpRule(equationId: string): void {
    const hasEq = this.content.equations.some(
      (eq) => eq.equation_id === equationId
    );
    if (this.isWon || this.isRoundClosed || !hasEq) {
      return;
    }
    this.lookedUpEquationId =
      this.lookedUpEquationId === equationId ? null : equationId;
    this.exploreTracker.recordExploreAction("rule_lookup");
  }

  private spawnSlotBurst(slot: Slot | undefined): void {
    if (!slot || this.degradation?.particles_enabled === false) {
      return;
    }
    const burst = spawnParticlesAtSlot(slot, 12);
    this.particles.push(...stepGT010Particles(burst, 0.1, this.stageRect));
  }

  selectValue(value: number): boolean {
    if (this.isWon || this.isRoundClosed) {
      return false;
    }
    const clk = getGT010Clock(this);
    this.lookedUpEquationId = null;
    this.selectedValue = value;
    const opts = this.getActiveOptions();
    const optIdx = opts.findIndex((o) => o.value === value);
    const isCorrect = opts[optIdx]?.is_correct ?? false;
    this.recordEvent("value_selected", { value, is_correct: isCorrect });

    if (isCorrect) {
      this.wrongFlash.clear();
      this.mood.clear();
      this.scaffoldHintLevel = 0;
      this.queueSfx("price_bell");
      this.exploreTracker.recordCorrectAttempt();
      clk.winAtMs = clk.logicMs;
      this.spawnSlotBurst(
        this.slots[this.content.equations.length + 1 + optIdx]
      );
    } else {
      this.wrongFlash.trigger(clk.logicMs);
      this.mood.set("wonder", GT010_WONDER_MS);
      const expected = this.getExpectedAnswer();
      const enteredSandbox = this.exploreTracker.recordWrongAttempt({
        reasonVi: "Chưa đúng rồi, bé thử số khác nhé!",
        actualValue: value,
        expectedValue: expected,
      });
      if (enteredSandbox || this.exploreTracker.isMicroSandboxActive()) {
        this.autoPinFirstSolvedSymbol();
      }
      this.recordEvent("control_of_error", {
        selected_value: value,
        expected_value: expected,
        micro_sandbox: this.exploreTracker.isMicroSandboxActive(),
      });
      if (!this.difficulty.allow_retry) {
        this.isRoundClosed = true;
        this.scaffoldHintLevel = 0;
        clk.closeAtMs = clk.logicMs;
        this.completeSession();
      }
    }
    if (this.checkWinCondition()) {
      this.winSession();
    }
    return isCorrect;
  }

  private autoPinFirstSolvedSymbol(): void {
    const firstId = this.content.symbols[0]?.symbol_id;
    const val = firstId
      ? this.solvedState.solvedSymbolMap.get(firstId)
      : undefined;
    if (firstId && val !== undefined && !this.pinnedSymbols.has(firstId)) {
      this.pinnedSymbols.set(firstId, val);
    }
  }

  override storyLine(): string {
    return GT010_STORY_LINE;
  }
  override mascotMood(): MascotPose | null {
    return this.isWon ? null : this.mood.current();
  }
  getSelectedValue(): number | null {
    return this.selectedValue;
  }

  update(deltaMs: number): void {
    const clk = getGT010Clock(this);
    if (deltaMs > 0) {
      clk.logicMs += deltaMs;
    }
    this.mood.tick(deltaMs);
    this.exploreTracker.tick(deltaMs);
    this.particles = stepGT010Particles(
      this.particles,
      deltaMs,
      this.stageRect
    );
    const expired = this.wrongFlash.hasExpired(clk.logicMs);
    if (this.selectedValue !== null && !this.isWon && expired) {
      this.selectedValue = null;
      this.wrongFlash.clear();
    }
  }

  getExpectedAnswer(): number {
    return this.solvedState.expectedAnswer;
  }

  validateAction(action: GameAction): ActionResult {
    if (this.isWon || this.isRoundClosed || action.type === "pin_symbol") {
      return ACTION_IGNORED;
    }
    if (action.type === "look_up_rule") {
      const ok =
        typeof action.data === "string" &&
        this.content.equations.some((eq) => eq.equation_id === action.data);
      return ok ? { valid: true, feedback: "none" } : ACTION_IGNORED;
    }
    if (action.type === "select_value") {
      if (typeof action.data !== "number") {
        return ACTION_RETRY;
      }
      const opt = this.getActiveOptions().find((o) => o.value === action.data);
      return opt?.is_correct ? ACTION_CORRECT : ACTION_RETRY;
    }
    return ACTION_IGNORED;
  }

  override checkWinCondition(): boolean {
    const s = this.selectedValue;
    return (
      s !== null &&
      this.getActiveOptions().some((o) => o.value === s && o.is_correct)
    );
  }
  override destroy(): void {
    resetGT010Clock(this);
    super.destroy();
    this.pinnedSymbols.clear();
    this.selectedValue = null;
    this.particles = [];
  }

  protected computeSlots(ageBand: AgeBand): readonly Slot[] {
    const raw = resolveLayout("equation-rows")({
      slotCount: this.getActiveOptions().length,
      targetCount: this.content.equations.length + 1,
      ageBand,
      logic: this.logicSpace,
      stage: this.stageRect,
      cssPerLogic: this.cssPerLogic,
    });
    return insetDrawSize(raw, this.stageRect);
  }

  override toAction(gesture: Gesture): GameAction | null {
    return this.isWon || this.isRoundClosed
      ? null
      : resolveGT010TapAction(this.toViewInput(), gesture);
  }

  override getHintTargetIndex(): number | null {
    if (this.isWon || this.isRoundClosed) {
      return null;
    }
    const idx = this.getActiveOptions().findIndex((o) => o.is_correct);
    if (idx < 0) {
      return null;
    }
    const slot = this.slots[this.content.equations.length + 1 + idx];
    return slot ? this.slots.indexOf(slot) : idx;
  }

  override getHintTargetForLevel(level: HintLevel): HintTarget | null {
    if (this.isWon || this.isRoundClosed || this.checkWinCondition()) {
      return null;
    }
    const ruleIds = resolveRelatedEquations(this.content).map(
      (eq) => eq.equation_id
    );
    if (level === 1) {
      return { kind: "region", ids: [ruleIds[0] ?? "rule-row-0"] };
    }
    if (level === 2) {
      return { kind: "region", ids: ["question-row", ...ruleIds] };
    }
    return this.getHintTarget();
  }

  override commit(action: GameAction): void {
    if (this.isWon || this.isRoundClosed) {
      return;
    }
    const { type, data } = action;
    if (type === "look_up_rule" && typeof data === "string") {
      this.lookUpRule(data);
    } else if (type === "select_value" && typeof data === "number") {
      this.selectValue(data);
    }
  }

  private toViewInput(clk = getGT010Clock(this)): GT010ViewInput {
    const hLv = this.scaffoldHintLevel;
    return {
      c: this.content,
      opts: this.getActiveOptions(),
      slots: this.slots,
      gMap: this.symMaps.glyphBySymbolId,
      sMap: this.symMaps.symbolById,
      lId: this.lookedUpEquationId,
      sel: this.selectedValue,
      wrong: this.wrongFlash.isActive(clk.logicMs),
      tIdx: clk.touchingSlotIndex ?? clk.hoveredSlotIndex,
      hints: resolveHintedRuleIds(this.content, hLv),
    };
  }
  override getView(): EngineView {
    return buildGT010View(this.toViewInput());
  }

  private buildTokens(ids: readonly string[], hi: ReadonlySet<string>) {
    const solvedMap = this.solvedState.solvedSymbolMap;
    return ids.map((id) => {
      const solved = this.pinnedSymbols.get(id) ?? solvedMap.get(id);
      const glyph = this.symMaps.glyphBySymbolId.get(id) ?? "?";
      return {
        symbolId: id,
        glyph,
        isHighlighted: hi.has(id),
        solvedValue: solved,
      };
    });
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    const clk = getGT010Clock(this);
    const wp = resolveWrongFlashProgress(this.wrongFlash, clk.logicMs);
    const v = this.toViewInput(clk);

    drawSceneBackground(ctx, rs, this.themeId);
    // Cô Gà Mái vẽ ngay sau nền, ở góc trống ngoài vùng chạm (`BR-E010-07`).
    drawStoryCharacterInStage(ctx, "hen", this.stageRect, this.slots);

    const eqN = this.content.equations.length;
    const targetSlots = this.slots.slice(0, eqN + 1);
    const eqSlots = targetSlots.slice(0, eqN);
    const qSlot = targetSlots[eqN];
    const optSlots = this.slots.slice(eqN + 1);
    const eqBox = boxFromSlots(targetSlots);
    if (eqBox) {
      drawGT010MarketBoard(ctx, rs, eqBox, this.stageRect);
    }
    drawWoodenTokenDock(ctx, rs, dockRectAroundSlots(optSlots, this.stageRect));

    const hLv = this.scaffoldHintLevel;
    const hi = resolveHighlightedSymbolIds(this.content, v.lId, hLv);

    this.content.equations.forEach((eq, i) => {
      const slot = eqSlots[i];
      if (!slot) {
        return;
      }
      drawPriceTag(ctx, slot, eq.right_value);
      const st = getRuleState(v, eq.equation_id, this.slots.indexOf(slot));
      drawGT010RuleRowBackdrop(ctx, rs, slot, st, timeMs / 180);
      const pin = eq.left.flatMap((id) => this.pinnedSymbols.get(id) ?? []);
      const hint =
        pin.length === eq.left.length ? `  (${pin.join(" + ")})` : "";
      const tokens = this.buildTokens(eq.left, hi);
      const lookedUp = v.lId === eq.equation_id;
      const spec = { tokens, rhs: String(eq.right_value), hint, lookedUp };
      drawGT010EquationExpression(ctx, rs, slot, spec);
    });

    if (qSlot) {
      drawPriceTag(ctx, qSlot, 0);
      const qState = hLv >= 2 ? "hinted" : "idle";
      drawGT010RuleRowBackdrop(ctx, rs, qSlot, qState, timeMs / 180);
      const tokens = this.buildTokens(
        resolveQuestionSymbolIds(this.content.question),
        hi
      );
      const reveal = resolveRevealProgress(clk, rs.reducedMotion);
      const answer = this.getExpectedAnswer();
      const qSpec = { tokens, rhs: "?", question: true, reveal, answer };
      drawGT010EquationExpression(ctx, rs, qSlot, qSpec);
    }

    const bSlots = resolveLookupBridgeSlots(this.content, eqSlots, v.lId, hLv);
    drawGT010LookupBridge(ctx, rs, bSlots, qSlot, this.stageRect, timeMs / 240);

    const winEl =
      clk.winAtMs === null ? null : Math.max(0, clk.logicMs - clk.winAtMs);
    v.opts.forEach((opt, i) => {
      const slot = optSlots[i];
      if (!slot) {
        return;
      }
      const st = getOptionState(v, opt, this.slots.indexOf(slot));
      const wrongProgress = st === "wrong" ? wp : null;
      const winElapsedMs = st === "correct" ? winEl : null;
      const anim = { timeMs, wrongProgress, winElapsedMs };
      drawGT010OptionToken(ctx, rs, slot, opt.value, st, anim, this.stageRect);
    });

    if (this.degradation?.particles_enabled !== false && !rs.reducedMotion) {
      rs.drawParticles(ctx, this.particles);
    }
    const pillBox = this.stageRect ?? sceneBox(rs);
    const tracker = this.exploreTracker;
    drawMontessoriControlOfErrorPill(ctx, pillBox, tracker, rs.viewport?.scale);
  }
}

export const GT010Session = SubstitutionSession;
export default SubstitutionSession;
