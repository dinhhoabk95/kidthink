import type { AgeBand } from "#src/contracts/types";
import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "#src/game-session";
import { getTouchFloor } from "#src/layout/constants";
import type { Slot } from "#src/layout/types";
import { type BeatInstrument, BeatSystem } from "#src/systems/beat-system";
import type { DegradationState } from "#src/systems/degradation";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import { SFXEngine } from "#src/systems/sfx-engine";
import {
  drawPromptText,
  drawSceneBackground,
  drawSlotItem,
  drawSubPromptText,
  drawWoodenTokenDock,
  spawnParticlesAtSlot,
  updateParticles,
} from "../shared-render.js";
import type { GT034Content, GT034Difficulty } from "./template.js";

export class GT034Session extends TemplateGameSession<
  GT034Content,
  GT034Difficulty
> {
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
    _ageBand: AgeBand = "5-6"
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
    this.resolveSlots("5-6");
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

  protected computeSlots(band: AgeBand): readonly Slot[] {
    const floor = getTouchFloor(band);
    const slots: Slot[] = [];
    const patternLen = this.content.target_pattern.length;
    const instCount = this.content.instruments.length;

    // 1. Target pattern track slots
    const startX = 480 - (patternLen * 72) / 2;
    for (let i = 0; i < patternLen; i++) {
      slots.push({
        index: i,
        role: "target",
        x: startX + i * 72 + 36,
        y: 220,
        w: 64,
        h: 64,
        hitW: Math.max(64, floor),
        hitH: Math.max(64, floor),
        page: 0,
      });
    }

    // 2. Instrument source slots
    const instStartX = 480 - (instCount * 110) / 2;
    for (let i = 0; i < instCount; i++) {
      const inst = this.content.instruments[i];
      if (!inst) {
        continue;
      }
      slots.push({
        index: patternLen + i,
        role: "source",
        x: instStartX + i * 110 + 55,
        y: 380,
        w: 88,
        h: 88,
        hitW: Math.max(88, floor),
        hitH: Math.max(88, floor),
        page: 0,
      });
    }

    // 3. Replay button slot
    slots.push({
      index: patternLen + instCount,
      role: "source",
      x: 480,
      y: 120,
      w: 64,
      h: 64,
      hitW: Math.max(64, floor),
      hitH: Math.max(64, floor),
      page: 0,
    });

    return slots;
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

  validateAction(action: GameAction): ActionResult {
    const type = action.type;
    const data = (action.data as Record<string, unknown>) ?? {};

    switch (type) {
      case "play_pattern":
      case "replay_pattern":
      case "listen":
        return this.handlePlayPattern(type);
      case "show_hint":
        this.showVisualPattern = true;
        return ACTION_CORRECT;
      case "tap_instrument":
      case "play_instrument":
      case "tap_item": {
        const instrumentId =
          (data.instrument_id as string) || (data.id as string) || "";
        return this.handleTapInstrument(instrumentId);
      }
      case "tap_rest":
      case "rest":
        return this.handleTapRest();
      case "undo_beat":
      case "undo_step":
      case "undo":
        return this.handleUndoBeat();
      case "clear_sequence":
      case "reset":
        return this.handleClearSequence();
      case "submit_sequence":
      case "submit":
        return this.handleSubmitSequence();
      default:
        return ACTION_IGNORED;
    }
  }

  private handlePlayPattern(_type: string): ActionResult {
    const replayLimit = this.difficulty.replay_limit ?? 3;
    if (this.replaysUsed >= replayLimit) {
      this.showVisualPattern = true;
      return ACTION_IGNORED;
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

    return ACTION_CORRECT;
  }

  private handleTapInstrument(instrumentId: string): ActionResult {
    const instrument = this.content.instruments.find(
      (inst) => inst.instrument_id === instrumentId
    );

    if (
      !instrument ||
      this.userSteps.length >= this.content.target_pattern.length
    ) {
      return ACTION_IGNORED;
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

    return this.checkCompletionAtStep(stepIndex);
  }

  private handleTapRest(): ActionResult {
    if (this.userSteps.length >= this.content.target_pattern.length) {
      return ACTION_IGNORED;
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

    return this.checkCompletionAtStep(stepIndex);
  }

  private checkCompletionAtStep(stepIndex: number): ActionResult {
    if (this.userSteps.length !== this.content.target_pattern.length) {
      return ACTION_CORRECT;
    }

    if (this.checkWinCondition()) {
      this.isWin = true;
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
      return ACTION_CORRECT;
    }

    this.sfxEngine.play("amber_soft");
    return ACTION_RETRY;
  }

  private handleUndoBeat(): ActionResult {
    if (this.userSteps.length === 0) {
      return ACTION_IGNORED;
    }

    this.userSteps.pop();
    return ACTION_CORRECT;
  }

  private handleClearSequence(): ActionResult {
    this.userSteps = [];
    return ACTION_CORRECT;
  }

  private handleSubmitSequence(): ActionResult {
    const isCorrect = this.checkWinCondition();

    this.recordEvent("sequence_submitted", {
      is_correct: isCorrect,
      round_index: 0,
    });

    if (isCorrect) {
      this.isWin = true;
      this.recordEvent("game_completed", {
        duration_ms: 12_000,
        rounds_total: 1,
        rounds_correct: 1,
      });
      this.sfxEngine.play("pop_celebrate");
      return ACTION_CORRECT;
    }

    this.sfxEngine.play("amber_soft");
    return ACTION_RETRY;
  }

  override checkWinCondition(): boolean {
    const target = this.content.target_pattern;
    if (this.userSteps.length !== target.length) {
      return false;
    }
    for (let i = 0; i < target.length; i++) {
      if (this.userSteps[i] !== target[i]) {
        return false;
      }
    }
    return true;
  }

  render(ctx: CanvasRenderingContext2D, rs: RenderSystem): void {
    drawSceneBackground(ctx, rs);
    drawPromptText(ctx, rs, this.content.prompt);
    drawSubPromptText(
      ctx,
      rs,
      `Đã nghe: ${this.replaysUsed}/${this.difficulty.replay_limit ?? 3} | Nhịp: ${this.content.tempo_bpm} BPM`
    );

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

    drawWoodenTokenDock(ctx, rs);
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
