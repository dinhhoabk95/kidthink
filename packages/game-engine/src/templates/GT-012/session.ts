import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "../../game-session.js";
import { FlashTimer } from "../../systems/timer-system.js";
import type { GT012Content, GT012Difficulty } from "./template.js";

export class FlashRecallSession extends TemplateGameSession<
  GT012Content,
  GT012Difficulty
> {
  private readonly timer: FlashTimer;
  private selectedValue: number | null = null;
  private wasVisible = false;

  constructor(
    content: GT012Content,
    difficulty: GT012Difficulty,
    layoutSeed = 0
  ) {
    super(content, difficulty, layoutSeed);
    this.timer = new FlashTimer({
      flashMs: difficulty.flash_ms,
      allowReplay: difficulty.allow_replay,
    });
  }

  setupEntities(): void {
    this.selectedValue = null;
    this.timer.reset();
    this.timer.start();
    this.wasVisible = true;
    this.isWon = false;

    this.recordEvent("game_started", {
      template_code: "GT-012",
      item_count: this.content.flash_items.length,
      flash_ms: this.timer.getDurationMs(),
    });

    this.recordEvent("flash_shown", {
      duration_ms: this.timer.getDurationMs(),
    });
  }

  getFlashItems(): GT012Content["flash_items"] {
    return this.content.flash_items;
  }

  getArrangement(): GT012Content["arrangement"] {
    return this.content.arrangement;
  }

  getOptions(): GT012Content["options"] {
    return this.content.options;
  }

  isFlashVisible(): boolean {
    return this.timer.isVisible();
  }

  canReplay(): boolean {
    return this.timer.canReplay();
  }

  replayFlash(): boolean {
    const ok = this.timer.replay();
    if (ok) {
      this.wasVisible = true;
      this.recordEvent("flash_replayed", {});
      this.recordEvent("flash_shown", {
        duration_ms: this.timer.getDurationMs(),
      });
    }
    return ok;
  }

  update(deltaMs: number): void {
    const prevState = this.timer.getState();
    this.timer.tick(deltaMs);
    const currState = this.timer.getState();

    if (prevState === "running" && currState === "expired" && this.wasVisible) {
      this.wasVisible = false;
      this.recordEvent("flash_hidden", {
        elapsed_ms: this.timer.getElapsedMs(),
      });
    }
  }

  selectValue(value: number): boolean {
    this.selectedValue = value;
    const isCorrect = value === this.content.flash_items.length;

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

  validateAction(action: GameAction): ActionResult {
    if (action.type === "replay_flash") {
      return ACTION_IGNORED;
    }
    if (action.type === "select_value") {
      if (typeof action.data !== "number") {
        return ACTION_RETRY;
      }
      const val = action.data;
      return val === this.content.flash_items.length
        ? ACTION_CORRECT
        : ACTION_RETRY;
    }
    return ACTION_IGNORED;
  }

  override checkWinCondition(): boolean {
    if (this.selectedValue === null) {
      return false;
    }
    return this.selectedValue === this.content.flash_items.length;
  }

  override destroy(): void {
    super.destroy();
    this.timer.reset();
    this.selectedValue = null;
    this.wasVisible = false;
  }
}

export const GT012Session = FlashRecallSession;
export default FlashRecallSession;
