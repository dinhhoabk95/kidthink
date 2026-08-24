import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "#src/game-session";
import {
  type CubeCoord,
  computeTopView,
  countHiddenCubes,
  type RotationAngle,
  sortCubesForRender,
} from "#src/systems/isometric-system";
import type { GT017Content, GT017Difficulty } from "./template.js";

export class BlockStackSession extends TemplateGameSession<
  GT017Content,
  GT017Difficulty
> {
  private currentRotation: RotationAngle = 0;
  private selectedOptionId: string | null = null;

  setupEntities(): void {
    this.currentRotation = 0;
    this.selectedOptionId = null;
    this.isWon = false;

    this.recordEvent("game_started", {
      template_code: "GT-017",
      cube_count: this.content.model.length,
      question: this.content.question,
    });
  }

  getModel(): readonly CubeCoord[] {
    return this.content.model;
  }

  getQuestion(): GT017Content["question"] {
    return this.content.question;
  }

  getOptions(): GT017Content["options"] {
    return this.content.options;
  }

  getCurrentRotation(): RotationAngle {
    return this.currentRotation;
  }

  getSelectedOptionId(): string | null {
    return this.selectedOptionId;
  }

  getRenderableCubes(): CubeCoord[] {
    return sortCubesForRender(this.content.model, this.currentRotation);
  }

  getTopView(): number[][] {
    return computeTopView(this.content.model);
  }

  getHiddenCubeCount(): number {
    return countHiddenCubes(this.content.model, this.currentRotation);
  }

  rotateModel(direction: "cw" | "ccw" = "cw"): RotationAngle {
    if (!this.difficulty.allow_rotate) {
      return this.currentRotation;
    }

    const angles: readonly RotationAngle[] = [0, 90, 180, 270];
    const currIdx = angles.indexOf(this.currentRotation);
    const nextIdx = direction === "cw" ? (currIdx + 1) % 4 : (currIdx + 3) % 4;

    this.currentRotation = angles[nextIdx];

    this.recordEvent("model_rotated", {
      angle: this.currentRotation,
      hidden_cubes_remaining: this.getHiddenCubeCount(),
    });

    return this.currentRotation;
  }

  selectOption(optionId: string): boolean {
    const opt = this.content.options.find((o) => o.option_id === optionId);
    if (!opt) {
      return false;
    }

    this.selectedOptionId = optionId;

    this.recordEvent("option_selected", {
      option_id: optionId,
      is_correct: opt.is_correct,
    });

    if (this.checkWinCondition()) {
      this.winSession();
    }

    return opt.is_correct;
  }

  validateAction(action: GameAction): ActionResult {
    if (action.type === "rotate_model") {
      return ACTION_IGNORED;
    }
    if (action.type === "select_option") {
      if (typeof action.data !== "string") {
        return ACTION_RETRY;
      }
      const id = action.data;
      const opt = this.content.options.find((o) => o.option_id === id);
      return opt?.is_correct ? ACTION_CORRECT : ACTION_RETRY;
    }
    return ACTION_IGNORED;
  }

  override checkWinCondition(): boolean {
    if (!this.selectedOptionId) {
      return false;
    }
    const opt = this.content.options.find(
      (o) => o.option_id === this.selectedOptionId
    );
    return opt?.is_correct === true;
  }

  override destroy(): void {
    super.destroy();
    this.selectedOptionId = null;
    this.currentRotation = 0;
  }
}

export const GT017Session = BlockStackSession;
export default BlockStackSession;
