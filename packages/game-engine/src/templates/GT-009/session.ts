import {
  ACTION_IGNORED,
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "#src/game-session";
import { resolveLayout } from "#src/layout/registry";
import type { Slot } from "#src/layout/types";
import { SelectionMechanic } from "#src/mechanics/selection-mechanic";
import type { DegradationState } from "#src/systems/degradation";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import {
  drawLabelText,
  drawPromptText,
  drawSceneBackground,
  drawSlotItem,
  getColorsForState,
  type ItemVisualState,
  updateParticles,
} from "../shared-render.js";
import { survivingCandidates } from "./deduction.js";
import type { GT009Content, GT009Difficulty } from "./template.js";

/**
 * `GT-009` — loại trừ theo manh mối.
 *
 * Kiểm soát lỗi tự thân (`BR-MTB-14`): chạm một manh mối làm mọi ứng viên vi phạm
 * nó **mờ đi và mang dấu gạch, vẫn hiển thị**. Trẻ nhìn tập thu hẹp dần và tự đi
 * tới đáp án; hệ thống không báo sai lần nào trước đó.
 */
export class GT009Session extends TemplateGameSession<
  GT009Content,
  GT009Difficulty
> {
  slots: readonly Slot[] = [];
  degradation: DegradationState | null = null;
  private renderParticles: Particle[] = [];
  private readonly renderItemStates: Map<string, ItemVisualState> = new Map();

  private readonly mechanic = new SelectionMechanic({ mode: "single" });
  private readonly revealedClueIds: string[] = [];
  private readonly eliminatedIds: Set<string> = new Set();

  setupEntities(): void {
    this.mechanic.reset();
    this.revealedClueIds.length = 0;
    this.eliminatedIds.clear();
    this.isWon = false;
  }

  /** Manh mối đã lật, theo thứ tự trẻ chạm. */
  getRevealedClueIds(): readonly string[] {
    return [...this.revealedClueIds];
  }

  /** Ứng viên đã bị gạch — vẫn hiển thị, chỉ mờ đi. */
  getEliminatedIds(): readonly string[] {
    return Array.from(this.eliminatedIds);
  }

  /** Ứng viên còn sống sau các manh mối đã lật. */
  getSurvivingIds(): readonly string[] {
    return survivingCandidates(this.content, this.revealedClueIds).map(
      (c) => c.candidate_id
    );
  }

  /**
   * Trẻ chạm một manh mối: gạch mọi ứng viên vi phạm nó. Không phản hồi đúng sai.
   */
  onClueRevealed(clueId: string): void {
    const clue = this.content.clues.find((c) => c.clue_id === clueId);
    if (!clue || this.revealedClueIds.includes(clueId)) {
      return;
    }
    this.revealedClueIds.push(clueId);

    const surviving = new Set(this.getSurvivingIds());
    const newlyEliminated = this.content.candidates
      .map((c) => c.candidate_id)
      .filter((id) => !(surviving.has(id) || this.eliminatedIds.has(id)));

    this.recordEvent("clue_revealed", {
      clue_id: clueId,
      revealed_count: this.revealedClueIds.length,
      remaining_count: surviving.size,
    });

    for (const candidateId of newlyEliminated) {
      this.eliminatedIds.add(candidateId);
      this.recordEvent("candidate_eliminated", {
        candidate_id: candidateId,
        clue_id: clueId,
      });
    }
  }

  /**
   * Đích của ba bậc gợi ý (điều kiện nghiệm thu 15). Cả ba bậc trỏ vào **manh mối
   * chưa dùng** — L1 nhấp nháy nó, L2 ghost hand chạm nó rồi gạch nhóm vi phạm,
   * L3 lặp lại chậm. Hết manh mối chưa dùng thì trỏ vào manh mối cuối.
   */
  getScaffoldHint(level: 1 | 2 | 3): {
    clue_id: string;
    eliminates: readonly string[];
    ghost_hand: boolean;
    slow_repeat: boolean;
  } | null {
    const nextClue =
      this.content.clues.find(
        (c) => !this.revealedClueIds.includes(c.clue_id)
      ) ?? this.content.clues.at(-1);
    if (!nextClue) {
      return null;
    }
    const stillAlive = new Set(this.getSurvivingIds());
    return {
      clue_id: nextClue.clue_id,
      eliminates: this.content.candidates
        .map((c) => c.candidate_id)
        .filter(
          (id) =>
            stillAlive.has(id) &&
            !survivingCandidates(this.content, [
              ...this.revealedClueIds,
              nextClue.clue_id,
            ]).some((c) => c.candidate_id === id)
        ),
      ghost_hand: level >= 2,
      slow_repeat: level === 3,
    };
  }

  validateAction(action: GameAction): ActionResult {
    if (action.type === "reveal_clue") {
      return ACTION_IGNORED;
    }
    return this.mechanic.validate(action, this.selectionItems());
  }

  onCandidateSelected(candidateId: string): void {
    this.mechanic.select(candidateId);
    if (this.checkWinCondition()) {
      this.winSession();
    }
  }

  override checkWinCondition(): boolean {
    return this.mechanic.isSelectionComplete(this.selectionItems());
  }

  private selectionItems(): { id: string; isCorrect: boolean }[] {
    return this.content.candidates.map((c) => ({
      id: c.candidate_id,
      isCorrect: c.candidate_id === this.content.answer_candidate_id,
    }));
  }

  resolveSlots(ageBand: "3-4" | "4-5" | "5-6"): void {
    const layoutFn = resolveLayout("clue-board");
    this.slots = layoutFn({
      slotCount: this.content.candidates.length,
      targetCount: this.content.clues.length,
      ageBand,
    });
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
    // clue-board xếp dải manh mối trước, rồi tới bàn ứng viên.
    const clueSlots = this.slots.slice(0, this.content.clues.length);
    const boardSlots = this.slots.slice(this.content.clues.length);

    this.content.clues.forEach((clue, i) => {
      const slot = clueSlots[i];
      if (!slot) {
        return;
      }
      const revealed = this.revealedClueIds.includes(clue.clue_id);
      const { fill, border } = getColorsForState(
        revealed ? "selected" : "idle"
      );
      rs.drawClayBody(
        ctx,
        slot.x,
        slot.y,
        Math.min(slot.w, slot.h) / 2,
        fill,
        border,
        "square"
      );
      drawLabelText(ctx, revealed ? clue.text : "?", slot.x, slot.y, 16);
    });

    this.content.candidates.forEach((cand, i) => {
      const slot = boardSlots[i];
      if (!slot) {
        return;
      }
      const eliminated = this.eliminatedIds.has(cand.candidate_id);
      let state = this.getRenderItemState(cand.candidate_id);
      if (eliminated) {
        state = "locked";
      } else if (this.mechanic.isSelected(cand.candidate_id)) {
        state = "selected";
      }
      if (cand.asset) {
        drawSlotItem(ctx, rs, slot, {
          id: cand.candidate_id,
          asset: cand.asset,
          label: String(cand.value),
          state,
        });
      } else {
        drawSlotItem(ctx, rs, slot, {
          id: cand.candidate_id,
          text: String(cand.value),
          state,
        });
      }
      if (eliminated) {
        drawLabelText(ctx, "❌", slot.x, slot.y, 32);
      }
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

export default GT009Session;
