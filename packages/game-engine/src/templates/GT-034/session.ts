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
import {
  computeStageGroupsLayout,
  resolveStageRect,
} from "#src/layout/stage-groups";
import type { Slot } from "#src/layout/types";
import {
  drawPromptText,
  drawSceneBackground,
  drawSlotItem,
  drawSubPromptText,
  spawnParticlesAtSlot,
  updateParticles,
} from "#src/render/index.js";
import { type BeatInstrument, BeatSystem } from "#src/systems/beat-system";
import type { DegradationState } from "#src/systems/degradation";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import { SFXEngine } from "#src/systems/sfx-engine";
import type { GT034Content, GT034Difficulty } from "./template.js";

interface GT034ActionPayload {
  readonly instrument_id?: string;
  readonly id?: string;
}

export class GT034Session extends TemplateGameSession<
  GT034Content,
  GT034Difficulty
> {
  /** Nút ở `zones.action` là nút nghe mẫu (`BR-PSZ-05`); chuỗi tự chấm khi đủ bước. */
  override readonly needsCommit = true;
  override readonly commitIcon = "listen";

  override canCommit(): boolean {
    return !(this.isWin || this.isWon || this.isPlayingPattern);
  }

  degradation: DegradationState | null = null;
  userSteps: (string | null)[] = [];
  replaysUsed = 0;
  showVisualPattern = false;
  isPlayingPattern = false;
  activePlayingIndex: number | null = null;
  playbackElapsedSec = 0;
  isWin = false;

  private particles: Particle[] = [];
  private readonly beatSystem: BeatSystem;
  private readonly sfxEngine: SFXEngine;

  constructor(
    content: GT034Content,
    difficulty: GT034Difficulty,
    _ageBandOrSeed?: AgeBand | number
  ) {
    super(content, difficulty);

    const instruments: BeatInstrument[] = content.instruments.map((inst) => ({
      instrument_id: inst.instrument_id,
      freq: inst.freq,
      type: inst.type,
      name_vi: inst.name_vi,
    }));

    this.beatSystem = new BeatSystem({
      tempo_bpm: content.tempo_bpm,
      instruments,
      age_band: "5-6",
    });

    this.sfxEngine = new SFXEngine();
  }

  setupEntities(): void {
    this.userSteps = [];
    this.replaysUsed = 0;
    this.showVisualPattern = false;
    this.isPlayingPattern = false;
    this.activePlayingIndex = null;
    this.playbackElapsedSec = 0;
    this.isWin = false;
    this.particles = [];

    this.recordEvent("game_started", {
      template_code: "GT-034",
      difficulty: this.difficulty.pattern_length ?? 4,
      age_band: "5-6",
      device: "tablet",
      reduced_motion: false,
      round_index: 0,
    });
  }

  override getHintTargetIndex(): number | null {
    if (this.isWin || this.isWon) {
      return null;
    }
    const patternLen = this.content.target_pattern.length;
    if (this.userSteps.length >= patternLen) {
      return null;
    }
    const nextInstId = this.content.target_pattern[this.userSteps.length];
    if (nextInstId) {
      const instIdx = this.content.instruments.findIndex(
        (inst) => inst.instrument_id === nextInstId
      );
      if (instIdx >= 0) {
        return patternLen + instIdx;
      }
    }
    return null;
  }

  protected computeSlots(band: AgeBand): readonly Slot[] {
    // Dải bước trên, nhạc cụ dưới — trong sân khấu của khung (`BR-PSZ-01`).
    // Nút nghe mẫu không còn là slot: shell vẽ ở `zones.action` (`BR-PSZ-05`).
    return computeStageGroupsLayout({
      stage: resolveStageRect(this.logicSpace, band, this.stageRect),
      ageBand: band,
      groups: [
        {
          count: this.content.target_pattern.length,
          role: "target",
          hasLabels: true,
        },
        {
          count: this.content.instruments.length,
          role: "source",
          hasLabels: true,
        },
      ],
    });
  }

  update(deltaMs: number): void {
    this.particles = updateParticles(this.particles);

    if (!this.isPlayingPattern) {
      return;
    }

    this.playbackElapsedSec += deltaMs / 1000;
    const beatSec = this.beatSystem.beatDurationSec;
    const totalDuration = this.content.target_pattern.length * beatSec;

    if (this.playbackElapsedSec >= totalDuration) {
      this.isPlayingPattern = false;
      this.activePlayingIndex = null;
      this.playbackElapsedSec = 0;
      return;
    }

    const currentIndex = Math.floor(this.playbackElapsedSec / beatSec);
    this.activePlayingIndex =
      currentIndex < this.content.target_pattern.length ? currentIndex : null;
  }

  private verifyPatternMatched(
    steps: readonly (string | null)[] = this.userSteps
  ): boolean {
    const target = this.content.target_pattern;
    if (steps.length !== target.length) {
      return false;
    }
    for (let i = 0; i < target.length; i++) {
      if (steps[i] !== target[i]) {
        return false;
      }
    }
    return true;
  }

  private get replayLimit(): number {
    return this.difficulty.replay_limit ?? 3;
  }

  private validatePlayPattern(): ActionResult {
    if (this.replaysUsed >= this.replayLimit) {
      return ACTION_IGNORED;
    }
    return ACTION_CORRECT;
  }

  private validateTapInstrument(instrumentId: string): ActionResult {
    const instrument = this.content.instruments.find(
      (inst) => inst.instrument_id === instrumentId
    );
    if (
      !instrument ||
      this.userSteps.length >= this.content.target_pattern.length
    ) {
      return ACTION_IGNORED;
    }

    if (this.userSteps.length + 1 === this.content.target_pattern.length) {
      const nextSteps = [...this.userSteps, instrumentId];
      return this.verifyPatternMatched(nextSteps)
        ? ACTION_CORRECT
        : ACTION_RETRY;
    }

    return ACTION_CORRECT;
  }

  private validateTapRest(): ActionResult {
    if (this.userSteps.length >= this.content.target_pattern.length) {
      return ACTION_IGNORED;
    }

    if (this.userSteps.length + 1 === this.content.target_pattern.length) {
      const nextSteps = [...this.userSteps, null];
      return this.verifyPatternMatched(nextSteps)
        ? ACTION_CORRECT
        : ACTION_RETRY;
    }

    return ACTION_CORRECT;
  }

  private validateInstrumentAction(data: GT034ActionPayload): ActionResult {
    const instrumentId = data.instrument_id ?? data.id ?? "";
    return this.validateTapInstrument(instrumentId);
  }

  validateAction(action: GameAction): ActionResult {
    if (this.isWin || this.isWon) {
      return ACTION_IGNORED;
    }

    const type = action.type;
    const data = (
      typeof action.data === "object" && action.data !== null ? action.data : {}
    ) as GT034ActionPayload;

    switch (type) {
      case "play_pattern":
      case "replay_pattern":
      case "listen":
        return this.validatePlayPattern();
      case "show_hint":
        return ACTION_CORRECT;
      case "tap_instrument":
      case "play_instrument":
      case "tap_item":
        return this.validateInstrumentAction(data);
      case "tap_rest":
      case "rest":
        return this.validateTapRest();
      case "undo_beat":
      case "undo_step":
      case "undo":
        return this.userSteps.length === 0 ? ACTION_IGNORED : ACTION_CORRECT;
      case "clear_sequence":
      case "reset":
        return ACTION_CORRECT;
      case "submit_sequence":
      case "submit":
        return this.verifyPatternMatched() ? ACTION_CORRECT : ACTION_RETRY;
      default:
        return ACTION_IGNORED;
    }
  }

  private commitPlayPattern(): void {
    if (this.replaysUsed >= this.replayLimit) {
      this.showVisualPattern = true;
      return;
    }

    this.replaysUsed++;
    this.isPlayingPattern = true;
    this.playbackElapsedSec = 0;
    this.activePlayingIndex = 0;

    const recipes = this.beatSystem.buildNoteRecipes(
      this.content.target_pattern
    );
    this.sfxEngine.playSequence(recipes);

    this.recordEvent("pattern_played", {
      tempo_bpm: this.content.tempo_bpm,
      pattern_length: this.content.target_pattern.length,
      is_replay: this.replaysUsed > 1,
      round_index: 0,
    });
  }

  private commitStepCompletion(stepIndex: number): void {
    if (this.userSteps.length !== this.content.target_pattern.length) {
      return;
    }

    if (this.verifyPatternMatched()) {
      this.isWin = true;
      this.isWon = true;
      this.recordEvent("game_completed", {
        duration_ms: 12_000,
        rounds_total: 1,
        rounds_correct: 1,
      });
      this.sfxEngine.play("pop_celebrate");
      const lastSlot = this.slots[stepIndex];
      if (lastSlot) {
        this.particles.push(...spawnParticlesAtSlot(lastSlot, 20));
      }
      this.winSession();
    } else {
      this.sfxEngine.play("amber_soft");
    }
  }

  private commitTapInstrument(instrumentId: string): void {
    const instrument = this.content.instruments.find(
      (inst) => inst.instrument_id === instrumentId
    );
    if (
      !instrument ||
      this.userSteps.length >= this.content.target_pattern.length
    ) {
      return;
    }

    const stepIndex = this.userSteps.length;
    this.userSteps.push(instrumentId);

    const singleRecipe = this.beatSystem.buildNoteRecipes([instrumentId])[0];
    if (singleRecipe) {
      this.sfxEngine.playSequence([singleRecipe]);
    }

    const isStepCorrect =
      this.content.target_pattern[stepIndex] === instrumentId;
    this.recordEvent("beat_tapped", {
      instrument_id: instrumentId,
      step_index: stepIndex,
      is_correct: isStepCorrect,
      round_index: 0,
    });

    this.commitStepCompletion(stepIndex);
  }

  private commitTapRest(): void {
    if (this.userSteps.length >= this.content.target_pattern.length) {
      return;
    }

    const stepIndex = this.userSteps.length;
    this.userSteps.push(null);

    const isStepCorrect = this.content.target_pattern[stepIndex] === null;
    this.recordEvent("beat_tapped", {
      instrument_id: "rest",
      step_index: stepIndex,
      is_correct: isStepCorrect,
      round_index: 0,
    });

    this.commitStepCompletion(stepIndex);
  }

  private commitSubmitSequence(): void {
    const isCorrect = this.verifyPatternMatched();

    this.recordEvent("sequence_submitted", {
      is_correct: isCorrect,
      round_index: 0,
    });

    if (isCorrect) {
      this.isWin = true;
      this.isWon = true;
      this.recordEvent("game_completed", {
        duration_ms: 12_000,
        rounds_total: 1,
        rounds_correct: 1,
      });
      this.sfxEngine.play("pop_celebrate");
      this.winSession();
    } else {
      this.sfxEngine.play("amber_soft");
    }
  }

  override commit(action: GameAction): void {
    const type = action.type;
    const data = (
      typeof action.data === "object" && action.data !== null ? action.data : {}
    ) as GT034ActionPayload;

    switch (type) {
      case "play_pattern":
      case "replay_pattern":
      case "listen":
        this.commitPlayPattern();
        break;
      case "show_hint":
        this.showVisualPattern = true;
        break;
      case "tap_instrument":
      case "play_instrument":
      case "tap_item":
        this.commitTapInstrument(data.instrument_id ?? data.id ?? "");
        break;
      case "tap_rest":
      case "rest":
        this.commitTapRest();
        break;
      case "undo_beat":
      case "undo_step":
      case "undo":
        this.userSteps.pop();
        break;
      case "clear_sequence":
      case "reset":
        this.userSteps = [];
        break;
      case "submit_sequence":
      case "submit":
        this.commitSubmitSequence();
        break;
      default:
        break;
    }
  }

  private findTappedInstrumentId(
    gx: number,
    gy: number,
    tol: number,
    patternLen: number,
    instCount: number
  ): string | null {
    for (let i = 0; i < instCount; i++) {
      const inst = this.content.instruments[i];
      const slot = this.slots[patternLen + i];
      if (!(inst && slot)) {
        continue;
      }
      const hw = (slot.hitW ?? slot.w) / 2 + tol;
      const hh = (slot.hitH ?? slot.h) / 2 + tol;
      if (Math.abs(gx - slot.x) <= hw && Math.abs(gy - slot.y) <= hh) {
        return inst.instrument_id;
      }
    }
    return null;
  }

  private isTappedLastStep(gx: number, gy: number, tol: number): boolean {
    if (this.userSteps.length === 0) {
      return false;
    }
    const slot = this.slots[this.userSteps.length - 1];
    if (!slot) {
      return false;
    }
    const hw = (slot.hitW ?? slot.w) / 2 + tol;
    const hh = (slot.hitH ?? slot.h) / 2 + tol;
    return Math.abs(gx - slot.x) <= hw && Math.abs(gy - slot.y) <= hh;
  }

  override toAction(gesture: Gesture): GameAction | null {
    // Chạm nút ở `zones.action` tới đây thành `commit` (`BR-PSZ-05`): nghe mẫu.
    if (gesture.type === "commit") {
      return { type: "play_pattern", data: {} };
    }
    if (gesture.type !== "tap") {
      return null;
    }

    const hitTolerance = 24;
    const patternLen = this.content.target_pattern.length;
    const instCount = this.content.instruments.length;

    const instId = this.findTappedInstrumentId(
      gesture.x,
      gesture.y,
      hitTolerance,
      patternLen,
      instCount
    );
    if (instId) {
      return {
        type: "tap_instrument",
        data: { instrument_id: instId },
      };
    }

    if (this.isTappedLastStep(gesture.x, gesture.y, hitTolerance)) {
      return { type: "undo_beat", data: {} };
    }

    return null;
  }

  override getView(): EngineView {
    const entities: ViewEntity[] = [];
    const patternLen = this.content.target_pattern.length;
    const instCount = this.content.instruments.length;

    for (let i = 0; i < patternLen; i++) {
      const slot = this.slots[i];
      if (!slot) {
        continue;
      }
      let state: EntityVisual = "idle";
      if (this.activePlayingIndex === i) {
        state = "selected";
      } else if (this.userSteps[i] !== undefined) {
        state = "correct";
      }
      entities.push({
        id: `step_${i}`,
        slotIndex: i,
        role: "target",
        state,
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
      });
    }

    for (let i = 0; i < instCount; i++) {
      const inst = this.content.instruments[i];
      const slot = this.slots[patternLen + i];
      if (!(inst && slot)) {
        continue;
      }
      entities.push({
        id: inst.instrument_id,
        slotIndex: patternLen + i,
        role: "source",
        state: "idle",
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
    return this.isWin || this.isWon || this.verifyPatternMatched();
  }

  render(ctx: CanvasRenderingContext2D, rs: RenderSystem): void {
    drawSceneBackground(ctx, rs, this.themeId);
    // Có khung thì lời dẫn thuộc shell (`BR-PSZ-01`); số lượt nghe không hiện (`BR-PSZ-06`).
    if (!this.stageRect) {
      drawPromptText(ctx, rs, this.content.prompt);
      drawSubPromptText(
        ctx,
        rs,
        `Đã nghe: ${this.replaysUsed}/${this.replayLimit} | Nhịp: ${this.content.tempo_bpm} BPM`
      );
    }

    this.renderTrackSteps(ctx, rs);
    this.renderInstrumentDock(ctx, rs);

    if (
      this.particles.length > 0 &&
      this.degradation?.particles_enabled !== false
    ) {
      rs.drawParticles(ctx, this.particles);
    }
  }

  private renderTrackSteps(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem
  ): void {
    const patternLen = this.content.target_pattern.length;
    for (let i = 0; i < patternLen; i++) {
      const slot = this.slots[i];
      if (slot) {
        this.renderSingleTrackStep(ctx, rs, i, slot);
      }
    }
  }

  private renderSingleTrackStep(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    index: number,
    slot: Slot
  ): void {
    const isActive = this.activePlayingIndex === index;
    const userStep = this.userSteps[index];

    if (userStep) {
      const inst = this.content.instruments.find(
        (item) => item.instrument_id === userStep
      );
      drawSlotItem(ctx, rs, slot, {
        id: userStep,
        asset: inst?.asset,
        label: inst?.name_vi ?? userStep,
        state: isActive ? "selected" : "idle",
      });
      return;
    }

    if (userStep === null) {
      drawSlotItem(ctx, rs, slot, {
        id: `step-rest-${index}`,
        label: "NGHỈ",
        state: isActive ? "selected" : "idle",
      });
      return;
    }

    if (this.showVisualPattern) {
      const targetStep = this.content.target_pattern[index];
      const inst = this.content.instruments.find(
        (item) => item.instrument_id === targetStep
      );
      drawSlotItem(ctx, rs, slot, {
        id: targetStep ?? `step-target-${index}`,
        asset: inst?.asset,
        label: inst?.name_vi ?? targetStep ?? undefined,
        state: isActive ? "selected" : "idle",
      });
      return;
    }

    drawSlotItem(ctx, rs, slot, {
      id: `step-empty-${index}`,
      text: `${index + 1}`,
      state: isActive ? "selected" : "idle",
    });
  }

  private renderInstrumentDock(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem
  ): void {
    const patternLen = this.content.target_pattern.length;
    const instCount = this.content.instruments.length;
    const sourceSlots = this.slots.slice(patternLen, patternLen + instCount);

    if (sourceSlots.length === 0) {
      return;
    }

    for (let i = 0; i < sourceSlots.length; i++) {
      const slot = sourceSlots[i];
      const inst = this.content.instruments[i];
      if (!(slot && inst)) {
        continue;
      }

      drawSlotItem(ctx, rs, slot, {
        id: inst.instrument_id,
        asset: inst.asset,
        label: inst.name_vi ?? inst.instrument_id,
        state: "idle",
      });
    }
  }

  override completeSession(): void {
    this.recordEvent("game_completed", {
      duration_ms: 12_000,
      rounds_total: 1,
      rounds_correct: this.checkWinCondition() ? 1 : 0,
    });
    super.completeSession();
  }
}
