import type { AgeBand } from "#src/contracts/types";
import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "#src/game-session";
import type {
  EngineView,
  EntityVisual,
  Gesture,
  ViewEntity,
} from "#src/interaction";
import { resolveLayout } from "#src/layout/registry";
import { dockRectAroundSlots } from "#src/layout/slot-fit";
import type { Slot } from "#src/layout/types";
import {
  drawLiquidCup,
  drawSceneBackground,
  drawSubPromptText,
  drawWoodenTokenDock,
  spawnParticlesAtSlot,
  updateParticles,
} from "#src/render/index.js";
import type { DegradationState } from "#src/systems/degradation";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import type { GT032Content, GT032Cup, GT032Difficulty } from "./template.js";

interface GT032ActionPayload {
  readonly cup_id?: string;
  readonly id?: string;
  readonly option_id?: string;
  readonly delta?: number;
  readonly fill_units?: number;
}

export class GT032Session extends TemplateGameSession<
  GT032Content,
  GT032Difficulty
> {
  override readonly usesPromptZone = true;

  degradation: DegradationState | null = null;
  selectedCupId: string | null = null;
  isWin = false;
  showHintMarks = false;

  private readonly cupFills: Map<string, number> = new Map();
  private particles: Particle[] = [];

  constructor(
    content: GT032Content,
    difficulty: GT032Difficulty,
    layoutSeed = 0,
    themeId?: string
  ) {
    super(content, difficulty, layoutSeed, themeId);
    for (const cup of content.cups) {
      this.cupFills.set(cup.cup_id, cup.fill_units);
    }
  }

  setupEntities(): void {
    this.selectedCupId = null;
    this.isWin = false;
    this.showHintMarks = false;
    this.particles = [];
    this.cupFills.clear();
    for (const cup of this.content.cups) {
      this.cupFills.set(cup.cup_id, cup.fill_units);
    }
    this.recordEvent("game_started", {
      template_code: "GT-032",
      question_type: this.content.question_type,
      cup_count: this.content.cups.length,
    });
  }

  getCupFill(cupId: string): number {
    const tracked = this.cupFills.get(cupId);
    if (tracked !== undefined) {
      return tracked;
    }
    const cup = this.content.cups.find((c) => c.cup_id === cupId);
    return cup?.fill_units ?? 0;
  }

  getTargetFill(cup: GT032Cup): number {
    return cup.target_units ?? this.content.target_units ?? cup.capacity_units;
  }

  override getHintTargetIndex(): number | null {
    if (this.isWin || this.isWon) {
      return null;
    }
    if (this.content.question_type === "pour_to_mark") {
      const idx = this.content.cups.findIndex((c) => !this.isCupCorrect(c));
      return idx >= 0 ? idx : 0;
    }
    const idx = this.content.cups.findIndex((c) => this.isCupCorrect(c));
    return idx >= 0 ? idx : null;
  }

  protected computeSlots(band: AgeBand): readonly Slot[] {
    const layoutFn = resolveLayout("grid");
    return layoutFn({
      slotCount: this.content.cups.length,
      ageBand: band,
      logic: this.logicSpace,
      stage: this.stageRect,
      cssPerLogic: this.cssPerLogic,
    });
  }

  isCupCorrect(cup: GT032Cup): boolean {
    const qType = this.content.question_type;
    const cups = this.content.cups;
    const fill = this.getCupFill(cup.cup_id);

    if (qType === "more") {
      const maxFill = Math.max(...cups.map((c) => this.getCupFill(c.cup_id)));
      return fill === maxFill;
    }

    if (qType === "less") {
      const minFill = Math.min(...cups.map((c) => this.getCupFill(c.cup_id)));
      return fill === minFill;
    }

    if (qType === "same") {
      const matchingCount = cups.filter(
        (c) => this.getCupFill(c.cup_id) === fill
      ).length;
      return matchingCount >= 2;
    }

    return fill === this.getTargetFill(cup);
  }

  private resolvePourTargetCup(cupId?: string): GT032Cup | null {
    if (cupId) {
      return this.content.cups.find((c) => c.cup_id === cupId) ?? null;
    }
    if (this.selectedCupId) {
      const selected = this.content.cups.find(
        (c) => c.cup_id === this.selectedCupId
      );
      if (selected) {
        return selected;
      }
    }
    return (
      this.content.cups.find((c) => !this.isCupCorrect(c)) ??
      this.content.cups[0] ??
      null
    );
  }

  private computeNextPourFill(
    cup: GT032Cup,
    data: GT032ActionPayload
  ): number | null {
    const current = this.getCupFill(cup.cup_id);
    if (data.fill_units !== undefined) {
      if (
        !Number.isInteger(data.fill_units) ||
        data.fill_units < 0 ||
        data.fill_units > cup.capacity_units
      ) {
        return null;
      }
      return data.fill_units;
    }
    const delta = data.delta ?? 0;
    if (!Number.isFinite(delta) || delta === 0) {
      return null;
    }
    const stepDelta =
      delta > 0
        ? Math.max(1, Math.round(delta))
        : Math.min(-1, Math.round(delta));
    const next = Math.max(0, Math.min(cup.capacity_units, current + stepDelta));
    return next === current ? null : next;
  }

  private validateAdjustCup(data: GT032ActionPayload): ActionResult {
    if (this.content.question_type !== "pour_to_mark") {
      return ACTION_IGNORED;
    }
    const cup = this.resolvePourTargetCup(
      data.cup_id ?? data.id ?? data.option_id
    );
    if (!cup) {
      return ACTION_IGNORED;
    }
    const nextFill = this.computeNextPourFill(cup, data);
    if (nextFill === null) {
      return ACTION_IGNORED;
    }
    return ACTION_CORRECT;
  }

  private validateSelectCup(cupId: string): ActionResult {
    const cup = this.content.cups.find((c) => c.cup_id === cupId);
    if (!cup) {
      return ACTION_IGNORED;
    }

    if (this.isCupCorrect(cup)) {
      return ACTION_CORRECT;
    }

    return ACTION_RETRY;
  }

  validateAction(action: GameAction): ActionResult {
    if (this.isWin || this.isWon) {
      return ACTION_IGNORED;
    }

    const type = action.type;
    const data = (
      typeof action.data === "object" && action.data !== null ? action.data : {}
    ) as GT032ActionPayload;

    if (
      type === "select_cup" ||
      type === "tap_cup" ||
      type === "choose_cup" ||
      type === "select_option"
    ) {
      const cupId = data.cup_id ?? data.id ?? data.option_id ?? "";
      return this.validateSelectCup(cupId);
    }

    if (type === "adjust_cup" || type === "pour_cup") {
      return this.validateAdjustCup(data);
    }

    if (type === "show_hint") {
      return ACTION_CORRECT;
    }

    return ACTION_IGNORED;
  }

  private isPourGoalSatisfied(activeCup: GT032Cup): boolean {
    const cupsWithExplicitTarget = this.content.cups.filter(
      (c) => c.target_units !== undefined
    );
    if (cupsWithExplicitTarget.length > 0) {
      return cupsWithExplicitTarget.every((c) => this.isCupCorrect(c));
    }
    return this.isCupCorrect(activeCup);
  }

  private commitAdjustCup(data: GT032ActionPayload): void {
    if (this.content.question_type !== "pour_to_mark") {
      return;
    }
    const cup = this.resolvePourTargetCup(
      data.cup_id ?? data.id ?? data.option_id
    );
    if (!cup) {
      return;
    }
    const nextFill = this.computeNextPourFill(cup, data);
    if (nextFill === null) {
      return;
    }
    this.cupFills.set(cup.cup_id, nextFill);
    this.selectedCupId = cup.cup_id;
    const reachedTarget = this.isCupCorrect(cup);
    this.recordEvent("liquid_poured", {
      cup_id: cup.cup_id,
      fill_units: nextFill,
      target_units: this.getTargetFill(cup),
      is_correct: reachedTarget,
    });

    if (this.isPourGoalSatisfied(cup)) {
      this.isWin = true;
      this.isWon = true;
      const cupIdx = this.content.cups.findIndex(
        (c) => c.cup_id === cup.cup_id
      );
      const slot = this.slots[cupIdx];
      if (slot) {
        this.particles.push(...spawnParticlesAtSlot(slot, 16));
      }
      this.recordEvent("game_completed", { score: 100 });
      this.winSession();
    }
  }

  private commitSelectCup(cupId: string): void {
    const cup = this.content.cups.find((c) => c.cup_id === cupId);
    if (!cup) {
      return;
    }

    if (this.content.question_type === "pour_to_mark") {
      this.selectedCupId = cup.cup_id;
    }

    const correct = this.isCupCorrect(cup);
    this.recordEvent("cup_selected", {
      cup_id: cup.cup_id,
      fill_units: this.getCupFill(cup.cup_id),
      is_correct: correct,
    });

    if (correct) {
      this.isWin = true;
      this.isWon = true;
      this.selectedCupId = cupId;
      const cupIdx = this.content.cups.findIndex((c) => c.cup_id === cupId);
      const slot = this.slots[cupIdx];
      if (slot) {
        this.particles.push(...spawnParticlesAtSlot(slot, 16));
      }
      this.recordEvent("game_completed", { score: 100 });
      this.winSession();
    }
  }

  override commit(action: GameAction): void {
    const type = action.type;
    const data = (
      typeof action.data === "object" && action.data !== null ? action.data : {}
    ) as GT032ActionPayload;

    if (
      type === "select_cup" ||
      type === "tap_cup" ||
      type === "choose_cup" ||
      type === "select_option"
    ) {
      const cupId = data.cup_id ?? data.id ?? data.option_id ?? "";
      this.commitSelectCup(cupId);
      return;
    }

    if (type === "adjust_cup" || type === "pour_cup") {
      this.commitAdjustCup(data);
      return;
    }

    if (type === "show_hint") {
      this.showHintMarks = true;
    }
  }

  override toAction(gesture: Gesture): GameAction | null {
    if (gesture.type === "adjust") {
      return this.toAdjustAction(gesture);
    }
    if (gesture.type === "tap") {
      return this.toTapAction(gesture.x, gesture.y);
    }
    return null;
  }

  private toAdjustAction(
    gesture: Extract<Gesture, { type: "adjust" }>
  ): GameAction | null {
    if (this.content.question_type !== "pour_to_mark") {
      return null;
    }
    const targetCup = this.resolvePourTargetCup();
    if (!(targetCup && Number.isFinite(gesture.delta)) || gesture.delta === 0) {
      return null;
    }
    return {
      type: "adjust_cup",
      data: { cup_id: targetCup.cup_id, delta: gesture.delta },
    };
  }

  private toTapAction(x: number, y: number): GameAction | null {
    const hitTolerance = 24;
    for (let i = 0; i < this.content.cups.length; i++) {
      const cup = this.content.cups[i];
      const slot = this.slots[i];
      if (!(cup && slot)) {
        continue;
      }
      const hw = (slot.hitW ?? slot.w) / 2 + hitTolerance;
      const hh = (slot.hitH ?? slot.h) / 2 + hitTolerance;
      if (Math.abs(x - slot.x) <= hw && Math.abs(y - slot.y) <= hh) {
        return {
          type: "select_cup",
          data: { cup_id: cup.cup_id },
        };
      }
    }
    return null;
  }

  override getView(): EngineView {
    const entities: ViewEntity[] = [];

    for (let i = 0; i < this.content.cups.length; i++) {
      const cup = this.content.cups[i];
      const slot = this.slots[i];
      if (!(cup && slot)) {
        continue;
      }

      let state: EntityVisual = "idle";
      if (this.selectedCupId === cup.cup_id) {
        state = this.isCupCorrect(cup) ? "correct" : "selected";
      }

      entities.push({
        id: cup.cup_id,
        slotIndex: i,
        role: "source",
        state,
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
      });
    }

    return {
      activePrompt: this.content.prompt,
      entities,
    };
  }

  override checkWinCondition(): boolean {
    return this.isWin || this.isWon;
  }

  getSelectedCupId(): string | null {
    return this.selectedCupId;
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    _timeMs: number
  ): void {
    drawSceneBackground(ctx, rs, this.themeId);

    if (!this.stageRect) {
      const subPrompt = this.isWin
        ? "Bé giỏi lắm! Đúng rồi!"
        : "Chạm vào cốc bé chọn nhé";
      drawSubPromptText(ctx, rs, subPrompt);
    }

    drawWoodenTokenDock(
      ctx,
      rs,
      dockRectAroundSlots(this.slots, this.stageRect)
    );

    for (let i = 0; i < this.content.cups.length; i++) {
      const cup = this.content.cups[i];
      const slot = this.slots[i];
      if (cup && slot) {
        drawLiquidCup(ctx, rs, slot, {
          cupId: cup.cup_id,
          shape: cup.shape,
          capacityUnits: cup.capacity_units,
          fillUnits: this.getCupFill(cup.cup_id),
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
