import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "#src/game-session";
import type { EngineView, Gesture, ViewEntity } from "#src/interaction";
import { resolveLayout } from "#src/layout/registry";
import type { Slot } from "#src/layout/types";
import type { DegradationState } from "#src/systems/degradation";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import {
  drawLabelText,
  drawPromptText,
  drawSceneBackground,
  drawSlotItem,
  drawWoodenTokenDock,
  type ItemVisualState,
  resolveEmojiGlyph,
  updateParticles,
} from "../shared-render.js";
import { boxFromSlots, drawEquationTray } from "../shared-render-shapes.js";
import { evaluateQuestionAnswer, solveEquationSystem } from "./solver.js";
import type { GT010Content, GT010Difficulty } from "./template.js";

export class SubstitutionSession extends TemplateGameSession<
  GT010Content,
  GT010Difficulty
> {
  degradation: DegradationState | null = null;
  private renderParticles: Particle[] = [];
  private readonly renderItemStates: Map<string, ItemVisualState> = new Map();

  private readonly pinnedSymbols: Map<string, number> = new Map();
  private selectedValue: number | null = null;

  setupEntities(): void {
    this.pinnedSymbols.clear();
    this.selectedValue = null;
    this.isWon = false;

    this.recordEvent("game_started", {
      template_code: "GT-010",
      equation_count: this.content.equations.length,
      symbol_count: this.content.symbols.length,
    });
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
    this.recordEvent("equation_solved", {
      symbol_id: symbolId,
      value,
    });
  }

  selectValue(value: number): boolean {
    this.selectedValue = value;
    const opt = this.content.options.find((o) => o.value === value);
    const isCorrect = opt?.is_correct ?? false;

    this.recordEvent("value_selected", {
      value,
      is_correct: isCorrect,
    });

    if (this.checkWinCondition()) {
      this.winSession();
    }

    return isCorrect;
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

  protected computeSlots(ageBand: "3-4" | "4-5" | "5-6"): readonly Slot[] {
    const layoutFn = resolveLayout("equation-rows");
    return layoutFn({
      slotCount: this.content.options.length,
      targetCount: this.content.equations.length,
      ageBand,
    });
  }

  override toAction(gesture: Gesture): GameAction | null {
    if (gesture.type !== "tap") {
      return null;
    }
    const hitTolerance = 24;
    const optionSlots = this.slots.filter((s) => s.role === "source");
    for (let i = 0; i < this.content.options.length; i++) {
      const opt = this.content.options[i];
      const slot = optionSlots[i];
      if (!(opt && slot)) {
        continue;
      }
      const hw = Math.max(slot.hitW, slot.w) / 2 + hitTolerance;
      const hh = Math.max(slot.hitH, slot.h) / 2 + hitTolerance;
      if (
        Math.abs(gesture.x - slot.x) <= hw &&
        Math.abs(gesture.y - slot.y) <= hh
      ) {
        return { type: "select_value", data: opt.value };
      }
    }
    return null;
  }

  override commit(action: GameAction): void {
    if (action.type === "select_value" && typeof action.data === "number") {
      this.selectValue(action.data);
    }
  }

  private toOptionState(
    opt: GT010Content["options"][number]
  ): ViewEntity["state"] {
    if (this.selectedValue === opt.value) {
      return opt.is_correct ? "correct" : "incorrect";
    }
    return "idle";
  }

  override getView(): EngineView {
    const eqSlots = this.slots.filter((s) => s.role === "target");
    const optionSlots = this.slots.filter((s) => s.role === "source");
    const entities: ViewEntity[] = [];

    this.content.equations.forEach((eq, i) => {
      const slot = eqSlots[i];
      if (!slot) {
        return;
      }
      entities.push({
        id: eq.equation_id,
        slotIndex: this.slots.indexOf(slot),
        role: "target",
        state: "idle",
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
      });
    });

    this.content.options.forEach((opt, i) => {
      const slot = optionSlots[i];
      if (!slot) {
        return;
      }
      entities.push({
        id: `opt-${i}`,
        slotIndex: this.slots.indexOf(slot),
        role: "source",
        state: this.toOptionState(opt),
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
      });
    });

    return {
      activePrompt: this.content.prompt,
      entities,
    };
  }

  setRenderItemState(itemId: string, state: ItemVisualState): void {
    this.renderItemStates.set(itemId, state);
  }

  getRenderItemState(itemId: string): ItemVisualState {
    return this.renderItemStates.get(itemId) ?? "idle";
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    _timeMs: number
  ): void {
    drawSceneBackground(ctx, rs);
    drawPromptText(ctx, rs, this.content.prompt);
    const eqSlots = this.slots.filter((s) => s.role === "target");
    const optionSlots = this.slots.filter((s) => s.role === "source");
    const eqBox = boxFromSlots(eqSlots);
    if (eqBox) {
      drawEquationTray(ctx, eqBox);
    }
    drawWoodenTokenDock(ctx, rs);
    const glyphOf = (symbolId: string): string => {
      const sym = this.content.symbols.find((s) => s.symbol_id === symbolId);
      if (sym?.asset.kind !== "emoji") {
        return "?";
      }
      return resolveEmojiGlyph(sym.asset.ref) ?? "?";
    };

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
        28
      );
    });

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
    });
    this.drawRenderFeedback(rs, ctx);
  }

  private drawRenderFeedback(
    rs: RenderSystem,
    ctx: CanvasRenderingContext2D
  ): void {
    if (this.degradation?.particles_enabled === false) {
      return;
    }
    this.renderParticles = updateParticles(this.renderParticles);
    rs.drawParticles(ctx, this.renderParticles);
  }
}

export const GT010Session = SubstitutionSession;
export default SubstitutionSession;
