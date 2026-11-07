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
import type { EngineView, Gesture, ViewEntity } from "#src/interaction";
import { resolveAssetLabels } from "#src/labels/spoken-keyword";
import { findHitSlotIndex, TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import { resolveLayout } from "#src/layout/registry";
import { dockRectAroundSlots, insetDrawSize } from "#src/layout/slot-fit";
import type { Slot } from "#src/layout/types";
import {
  boxFromSlots,
  drawEquationTray,
  drawLabelText,
  drawMontessoriControlOfErrorPill,
  drawSceneBackground,
  drawSlotItem,
  drawWoodenTokenDock,
  resolveEmojiGlyph,
  sceneBox,
} from "#src/render/index.js";
import type { MascotPose } from "#src/render/mascot";
import type { DegradationState } from "#src/systems/degradation";
import {
  type ControlOfErrorDiagnostics,
  MontessoriExploreTracker,
} from "#src/systems/montessori-explore-system";
import { MoodPulse } from "#src/systems/mood-pulse";
import type { RenderSystem } from "#src/systems/render-system";
import { WRONG_FLASH_MS, WrongFlash } from "#src/systems/wrong-flash";
import { evaluateQuestionAnswer, solveEquationSystem } from "./solver.js";
import type { GT010Content, GT010Difficulty } from "./template.js";

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

  private readonly exploreTracker = new MontessoriExploreTracker({
    milestoneTarget: 2,
  });

  private readonly pinnedSymbols: Map<string, number> = new Map();
  private selectedValue: number | null = null;
  /** Dòng luật trẻ vừa chạm tra cứu — phóng to, không tính là trả lời. */
  private lookedUpEquationId: string | null = null;
  private glyphBySymbolId: Map<string, string> = new Map();
  private symbolById: Map<string, GT010Content["symbols"][number]> = new Map();
  private readonly wrongFlash = new WrongFlash();
  private readonly mood = new MoodPulse();
  private lastFrameMs = 0;

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
    this.lastFrameMs = 0;
    this.isWon = false;
    this.symbolById = new Map(
      this.content.symbols.map((s) => [s.symbol_id, s])
    );
    this.glyphBySymbolId = new Map(
      this.content.symbols.map((s) => {
        if (s.asset.kind === "emoji") {
          return [s.symbol_id, resolveEmojiGlyph(s.asset.ref) ?? "?"];
        }
        const labels = resolveAssetLabels(s.asset);
        return [s.symbol_id, labels.glyph ?? labels.label ?? "?"];
      })
    );

    this.recordEvent("game_started", {
      template_code: "GT-010",
      equation_count: this.content.equations.length,
      symbol_count: this.content.symbols.length,
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
    return this.content.options;
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
    this.recordEvent("equation_solved", {
      symbol_id: symbolId,
      value,
    });
  }

  /** Trẻ chạm dòng luật để tra: phóng to dòng đó, không ghi event, không chấm. */
  lookUpRule(equationId: string): void {
    if (!this.content.equations.some((eq) => eq.equation_id === equationId)) {
      return;
    }
    this.lookedUpEquationId =
      this.lookedUpEquationId === equationId ? null : equationId;
    this.exploreTracker.recordExploreAction("rule_lookup");
  }

  selectValue(value: number): boolean {
    this.lookedUpEquationId = null;
    this.selectedValue = value;
    const opt = this.content.options.find((o) => o.value === value);
    const isCorrect = opt?.is_correct ?? false;

    this.recordEvent("value_selected", {
      value,
      is_correct: isCorrect,
    });

    if (isCorrect) {
      this.wrongFlash.clear();
      this.queueSfx("price_bell");
      this.exploreTracker.recordCorrectAttempt();
    } else {
      this.wrongFlash.trigger(this.lastFrameMs);
      this.mood.set("wonder", GT010_WONDER_MS);
      const expected = this.getExpectedAnswer();
      const enteredSandbox = this.exploreTracker.recordWrongAttempt({
        reasonVi: `Giá trị ${value} chưa khớp phép thay thế (cần ${expected})`,
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
    }

    if (this.checkWinCondition()) {
      this.winSession();
    }

    return isCorrect;
  }

  private autoPinFirstSolvedSymbol(): void {
    const symbolIds = this.content.symbols.map((s) => s.symbol_id);
    const firstSol = solveEquationSystem(symbolIds, this.content.equations)[0];
    if (!firstSol) {
      return;
    }
    const firstSymbolId = symbolIds[0];
    if (firstSymbolId && !this.pinnedSymbols.has(firstSymbolId)) {
      const solvedVal = firstSol.values[firstSymbolId];
      if (solvedVal !== undefined) {
        this.pinnedSymbols.set(firstSymbolId, solvedVal);
      }
    }
  }

  override storyLine(): string {
    return GT010_STORY_LINE;
  }

  /** Nghiêng đầu sau giá chưa đúng (`BR-E010-06`). */
  override mascotMood(): MascotPose | null {
    return this.isWon ? null : this.mood.current();
  }

  update(deltaMs: number): void {
    this.mood.tick(deltaMs);
    this.exploreTracker.tick(deltaMs);
    this.lastFrameMs += deltaMs;
    if (
      this.selectedValue !== null &&
      this.wrongFlash.hasExpired(this.lastFrameMs)
    ) {
      this.selectedValue = null;
      this.wrongFlash.clear();
    }
  }

  getSelectedValue(): number | null {
    return this.selectedValue;
  }

  getExpectedAnswer(): number {
    const symbolIds = this.content.symbols.map((s) => s.symbol_id);
    const solutions = solveEquationSystem(symbolIds, this.content.equations);
    const firstSol = solutions[0];
    if (!firstSol) {
      return 0;
    }
    return evaluateQuestionAnswer(firstSol, this.content.question);
  }

  validateAction(action: GameAction): ActionResult {
    if (action.type === "pin_symbol") {
      return ACTION_IGNORED;
    }
    if (action.type === "look_up_rule") {
      return typeof action.data === "string" &&
        this.content.equations.some((eq) => eq.equation_id === action.data)
        ? { valid: true, feedback: "none" }
        : ACTION_IGNORED;
    }
    if (action.type === "select_value") {
      if (typeof action.data !== "number") {
        return ACTION_RETRY;
      }
      const val = action.data;
      const opt = this.content.options.find((o) => o.value === val);
      return opt?.is_correct ? ACTION_CORRECT : ACTION_RETRY;
    }
    return ACTION_IGNORED;
  }

  override checkWinCondition(): boolean {
    if (this.selectedValue === null) {
      return false;
    }
    const opt = this.content.options.find(
      (o) => o.value === this.selectedValue
    );
    return opt?.is_correct === true;
  }

  override destroy(): void {
    super.destroy();
    this.pinnedSymbols.clear();
    this.selectedValue = null;
  }

  protected computeSlots(ageBand: AgeBand): readonly Slot[] {
    const layoutFn = resolveLayout("equation-rows");
    return insetDrawSize(
      layoutFn({
        slotCount: this.content.options.length,
        targetCount: this.content.equations.length + 1,
        ageBand,
        logic: this.logicSpace,
        stage: this.stageRect,
        cssPerLogic: this.cssPerLogic,
      }),
      this.stageRect
    );
  }

  override toAction(gesture: Gesture): GameAction | null {
    if (gesture.type !== "tap") {
      return null;
    }
    const eqRow = findHitSlotIndex(
      this.slots.slice(0, this.content.equations.length),
      gesture.x,
      gesture.y,
      "square",
      TAP_TOLERANCE_PX
    );
    const equation = eqRow >= 0 ? this.content.equations[eqRow] : undefined;
    if (equation) {
      return { type: "look_up_rule", data: equation.equation_id };
    }
    const optionSlots = this.slots.slice(this.content.equations.length + 1);
    const idx = findHitSlotIndex(
      optionSlots,
      gesture.x,
      gesture.y,
      "circle",
      TAP_TOLERANCE_PX
    );
    const opt = idx >= 0 ? this.content.options[idx] : undefined;
    return opt ? { type: "select_value", data: opt.value } : null;
  }

  override getHintTargetIndex(): number | null {
    const idx = this.content.options.findIndex((o) => o.is_correct);
    if (idx < 0) {
      return null;
    }
    const optionSlots = this.slots.slice(this.content.equations.length + 1);
    const slot = optionSlots[idx];
    return slot ? this.slots.indexOf(slot) : idx;
  }

  override getHintTargetForLevel(level: HintLevel): HintTarget | null {
    if (this.checkWinCondition()) {
      return null;
    }
    const questionSymbolIds =
      this.content.question.kind === "value"
        ? [this.content.question.symbol_id]
        : this.content.question.symbol_ids;
    const qSymbols = new Set(questionSymbolIds);
    const relatedEquations = this.content.equations.filter((eq) =>
      eq.left.some((sym) => qSymbols.has(sym))
    );
    const ruleIds = (
      relatedEquations.length > 0 ? relatedEquations : this.content.equations
    ).map((eq) => eq.equation_id);
    if (level === 1) {
      return {
        kind: "region",
        ids: ruleIds.length > 0 ? [ruleIds[0] ?? "rule-row-0"] : ["rule-row-0"],
      };
    }
    if (level === 2) {
      return {
        kind: "region",
        ids: [...questionSymbolIds.map((sym) => `question:${sym}`), ...ruleIds],
      };
    }
    return this.getHintTarget();
  }

  override commit(action: GameAction): void {
    if (action.type === "look_up_rule" && typeof action.data === "string") {
      this.lookUpRule(action.data);
      return;
    }
    if (action.type === "select_value" && typeof action.data === "number") {
      this.selectValue(action.data);
    }
  }

  private toOptionState(
    opt: GT010Content["options"][number]
  ): ViewEntity["state"] {
    if (this.selectedValue !== opt.value) {
      return "idle";
    }
    if (opt.is_correct) {
      return "correct";
    }
    // Dấu sai chỉ sống trong nhịp, không phụ thuộc khung vẽ có dọn hay chưa.
    return this.wrongFlash.isActive(this.lastFrameMs) ? "incorrect" : "idle";
  }

  /** Dòng luật: tra cứu thì sáng chọn, vừa chọn sai thì sáng nhẹ mời tra lại. */
  private toEquationState(equationId: string): ViewEntity["state"] {
    if (this.lookedUpEquationId === equationId) {
      return "selected";
    }
    return this.wrongFlash.isActive(this.lastFrameMs) ? "active" : "idle";
  }

  private formatQuestionLhs(): string {
    const glyphOf = (symbolId: string): string =>
      this.glyphBySymbolId.get(symbolId) ?? "?";
    if (this.content.question.kind === "value") {
      return glyphOf(this.content.question.symbol_id);
    }
    return this.content.question.symbol_ids.map(glyphOf).join(" + ");
  }

  private formatEquationSpokenLhs(
    eq: GT010Content["equations"][number]
  ): string {
    const symbolMap =
      this.symbolById.size === this.content.symbols.length
        ? this.symbolById
        : new Map(this.content.symbols.map((s) => [s.symbol_id, s]));
    return eq.left
      .map((symId) => {
        const sym = symbolMap.get(symId);
        if (!sym) {
          return "hình";
        }
        return resolveAssetLabels(sym.asset).spokenLabel;
      })
      .join(" cộng ");
  }

  override getView(): EngineView {
    const eqSlots = this.slots.slice(0, this.content.equations.length);
    const optionSlots = this.slots.slice(this.content.equations.length + 1);
    const entities: ViewEntity[] = [];
    const glyphOf = (symbolId: string): string =>
      this.glyphBySymbolId.get(symbolId) ?? "?";

    this.content.equations.forEach((eq, i) => {
      const slot = eqSlots[i];
      if (!slot) {
        return;
      }
      const lhs = eq.left.map(glyphOf).join(" + ");
      const spokenLhs = this.formatEquationSpokenLhs(eq);
      entities.push({
        id: eq.equation_id,
        slotIndex: this.slots.indexOf(slot),
        role: "neutral",
        state: this.toEquationState(eq.equation_id),
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
        hitShape: "square",
        label: `${lhs} = ${eq.right_value}`,
        spokenLabel: `${spokenLhs} bằng ${eq.right_value}`,
      });
    });

    this.content.options.forEach((opt, i) => {
      const slot = optionSlots[i];
      if (!slot) {
        return;
      }
      const optLabel = String(opt.value);
      entities.push({
        id: `opt-${i}`,
        slotIndex: this.slots.indexOf(slot),
        role: "source",
        state: this.toOptionState(opt),
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
        label: optLabel,
        spokenLabel: `Số ${optLabel}`,
      });
    });

    return {
      activePrompt: this.content.prompt,
      entities,
    };
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    this.lastFrameMs = timeMs;
    if (this.selectedValue !== null && this.wrongFlash.hasExpired(timeMs)) {
      this.selectedValue = null;
      this.wrongFlash.clear();
    }

    drawSceneBackground(ctx, rs, this.themeId);
    const targetSlots = this.slots.slice(0, this.content.equations.length + 1);
    const eqSlots = targetSlots.slice(0, this.content.equations.length);
    const questionSlot = targetSlots[this.content.equations.length];
    const optionSlots = this.slots.slice(this.content.equations.length + 1);
    const eqBox = boxFromSlots(targetSlots);
    if (eqBox) {
      drawEquationTray(ctx, eqBox);
    }
    drawWoodenTokenDock(
      ctx,
      rs,
      dockRectAroundSlots(optionSlots, this.stageRect)
    );
    const glyphOf = (symbolId: string): string =>
      this.glyphBySymbolId.get(symbolId) ?? "?";

    this.content.equations.forEach((eq, i) => {
      const slot = eqSlots[i];
      if (!slot) {
        return;
      }
      const lhs = eq.left.map(glyphOf).join(" + ");
      const pinned = eq.left
        .map((id) => this.pinnedSymbols.get(id))
        .filter((v): v is number => v !== undefined);
      const hint =
        pinned.length === eq.left.length ? `  (${pinned.join(" + ")})` : "";
      drawLabelText(
        ctx,
        `${lhs} = ${eq.right_value}${hint}`,
        slot.x,
        slot.y,
        this.lookedUpEquationId === eq.equation_id ? 36 : 28
      );
    });

    let questionX = 480;
    let questionY = 260;
    if (questionSlot) {
      questionX = questionSlot.x;
      questionY = questionSlot.y;
    } else if (eqBox) {
      questionX = eqBox.x + eqBox.w / 2;
      questionY = eqBox.y + eqBox.h - 24;
    }
    drawLabelText(
      ctx,
      `${this.formatQuestionLhs()} = ?`,
      questionX,
      questionY,
      30
    );

    this.content.options.forEach((opt, i) => {
      const slot = optionSlots[i];
      if (!slot) {
        return;
      }
      let state: "correct" | "wrong" | "idle" = "idle";
      if (this.selectedValue === opt.value) {
        state = opt.is_correct ? "correct" : "wrong";
      }
      drawSlotItem(ctx, rs, slot, {
        id: `opt-${i}`,
        text: String(opt.value),
        state,
      });

      if (state === "wrong" && this.wrongFlash.started) {
        const elapsed = this.wrongFlash.elapsedMs(timeMs);
        if (elapsed < WRONG_FLASH_MS) {
          rs.drawRetryRing(
            ctx,
            slot.x,
            slot.y,
            Math.min(slot.hitW, slot.hitH) / 2 + 4,
            elapsed / WRONG_FLASH_MS
          );
        }
      }
    });

    drawMontessoriControlOfErrorPill(
      ctx,
      this.stageRect ?? sceneBox(rs),
      this.exploreTracker,
      rs.viewport?.scale
    );
  }
}

export const GT010Session = SubstitutionSession;
export default SubstitutionSession;
