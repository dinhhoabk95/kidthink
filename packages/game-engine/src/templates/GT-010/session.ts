import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "../../game-session.js";
import { evaluateQuestionAnswer, solveEquationSystem } from "./solver.js";
import type { GT010Content, GT010Difficulty } from "./template.js";

export class SubstitutionSession extends TemplateGameSession<
  GT010Content,
  GT010Difficulty
> {
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
    if (solutions.length === 0) {
      return 0;
    }
    return evaluateQuestionAnswer(solutions[0], this.content.question);
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
}

export const GT010Session = SubstitutionSession;
export default SubstitutionSession;
