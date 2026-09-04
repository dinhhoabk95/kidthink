import type { AgeBand } from "#src/contracts/types";
import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "#src/game-session";
import { resolveLayout } from "#src/layout/registry";
import type { Slot } from "#src/layout/types";
import type { DegradationState } from "#src/systems/degradation";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import {
  drawLiquidCup,
  drawPromptText,
  drawSceneBackground,
  drawSubPromptText,
  drawWoodenTokenDock,
  spawnParticlesAtSlot,
  updateParticles,
} from "../shared-render.js";
import type { GT032Content, GT032Cup, GT032Difficulty } from "./template.js";

export class GT032Session extends TemplateGameSession<
  GT032Content,
  GT032Difficulty
> {
  degradation: DegradationState | null = null;
  selectedCupId: string | null = null;
  isWin = false;
  showHintMarks = false;

  private particles: Particle[] = [];

  setupEntities(): void {
    this.selectedCupId = null;
    this.isWin = false;
    this.showHintMarks = false;
    this.particles = [];
    this.recordEvent("game_started", {
      template_code: "GT-032",
      question_type: this.content.question_type,
      cup_count: this.content.cups.length,
    });
  }

  protected computeSlots(band: AgeBand): readonly Slot[] {
    const layoutFn = resolveLayout("horizontal-row");
    return layoutFn({
      slotCount: this.content.cups.length,
      ageBand: band,
    });
  }

  isCupCorrect(cup: GT032Cup): boolean {
    const qType = this.content.question_type;
    const cups = this.content.cups;

    if (qType === "more") {
      const maxFill = Math.max(...cups.map((c) => c.fill_units));
      return cup.fill_units === maxFill;
    }

    if (qType === "less") {
      const minFill = Math.min(...cups.map((c) => c.fill_units));
      return cup.fill_units === minFill;
    }

    if (qType === "same") {
      const matchingCount = cups.filter(
        (c) => c.fill_units === cup.fill_units
      ).length;
      return matchingCount >= 2;
    }

    return cup.fill_units === cup.capacity_units;
  }

  private handleSelectCup(cupId: string): ActionResult {
    const cup = this.content.cups.find((c) => c.cup_id === cupId);
    if (!cup) {
      return ACTION_IGNORED;
    }

    const correct = this.isCupCorrect(cup);
    this.recordEvent("cup_selected", {
      cup_id: cup.cup_id,
      fill_units: cup.fill_units,
      is_correct: correct,
    });

    if (correct) {
      this.isWin = true;
      this.selectedCupId = cupId;
      const cupIdx = this.content.cups.findIndex((c) => c.cup_id === cupId);
      const slot = this.slots[cupIdx];
      if (slot) {
        this.particles.push(...spawnParticlesAtSlot(slot, 16));
      }
      return ACTION_CORRECT;
    }

    return ACTION_RETRY;
  }

  validateAction(action: GameAction): ActionResult {
    if (this.isWin) {
      return ACTION_IGNORED;
    }

    const type = action.type;
    const data = (action.data as Record<string, unknown>) ?? {};

    if (
      type === "select_cup" ||
      type === "tap_cup" ||
      type === "choose_cup" ||
      type === "select_option"
    ) {
      const cupId =
        (data.cup_id as string) ||
        (data.id as string) ||
        (data.option_id as string) ||
        "";
      return this.handleSelectCup(cupId);
    }

    if (type === "show_hint") {
      this.showHintMarks = true;
      return ACTION_CORRECT;
    }

    return ACTION_IGNORED;
  }

  override checkWinCondition(): boolean {
    return this.isWin;
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    _timeMs: number
  ): void {
    drawSceneBackground(ctx, rs);
    drawPromptText(ctx, rs, this.content.prompt);

    const subPrompt = this.isWin
      ? "Bé giỏi lắm! Đúng rồi!"
      : "Chạm vào cốc bé chọn nhé";
    drawSubPromptText(ctx, rs, subPrompt);

    drawWoodenTokenDock(ctx, rs);

    for (let i = 0; i < this.content.cups.length; i++) {
      const cup = this.content.cups[i];
      const slot = this.slots[i];
      if (cup && slot) {
        drawLiquidCup(ctx, rs, slot, {
          cupId: cup.cup_id,
          shape: cup.shape,
          capacityUnits: cup.capacity_units,
          fillUnits: cup.fill_units,
          color: cup.color,
          isSelected: this.selectedCupId === cup.cup_id,
          showHintMarks: this.showHintMarks,
        });
      }
    }

    if (this.degradation?.particles_enabled !== false) {
      this.particles = updateParticles(this.particles);
      rs.drawParticles(ctx, this.particles);
    }
  }
}
