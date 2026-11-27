import type { AgeBand } from "#src/contracts/types";
import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  type HintDemoStep,
  type HintLevel,
  type HintTarget,
  TemplateGameSession,
} from "#src/game-session";
import type { EngineView, Gesture } from "#src/interaction";
import {
  computeStageGroupsLayout,
  resolveStageRect,
} from "#src/layout/stage-groups";
import type { Slot } from "#src/layout/types";
import { spawnParticlesAtSlot, updateParticles } from "#src/render/index.js";
import type { MascotPose } from "#src/render/mascot";
import { type BeatInstrument, BeatSystem } from "#src/systems/beat-system";
import type { DegradationState } from "#src/systems/degradation";
import { MoodPulse } from "#src/systems/mood-pulse";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import { SFXEngine } from "#src/systems/sfx-engine";
import {
  buildGT034View,
  deleteGT034Clock,
  deriveGT034RoundContent,
  findHoveredGT034Slot,
  type GT034BeatBall,
  getGT034Clock,
  judgeGT034Sequence,
  parseGT034Action,
  resolveGT034GestureAction,
  resolveHintDemoSequence,
  resolveHintForLevel,
  resolveHintTargetIndex,
  TIMING_WIDEN_STEP,
} from "./layout.js";
import { renderGT034Scene } from "./scene.js";
import type { GT034Content, GT034Difficulty } from "./template.js";

export const GT034_STORY_LINE =
  "Dế Mèn gõ trống, gõ phách, gõ mõ thành một điệu vui. Bé nghe điệu của Dế Mèn rồi gõ lại đúng nhịp nhé!";
export const GT034_HAPPY_MS = 500;
export const GT034_WONDER_MS = 1500;
export const GT034_BALL_HOP_MS = 400;

export type { GT034BeatBall } from "./layout.js";

const QUIET_OK: ActionResult = Object.freeze({ valid: true, feedback: "none" });

export class GT034Session extends TemplateGameSession<
  GT034Content,
  GT034Difficulty
> {
  override readonly needsCommit = true;
  override readonly usesPromptZone = true;
  override get commitIcon(): "listen" {
    return "listen";
  }

  userSteps: (string | null)[] = [];
  replaysUsed = 0;
  showVisualPattern = false;
  isWin = false;
  isPlayingPattern = false;
  degradation: DegradationState | null = null;
  stepTimesMs: (number | null)[] = [];
  timingMisses = 0;
  activePlayingIndex: number | null = null;
  playbackElapsedSec = 0;

  private activeContent: GT034Content;
  private hintPlaybackSec: number | null = null;
  private tapHopMs: number | null = null;
  private tapHopStep = 0;
  private particles: Particle[] = [];
  private readonly mood = new MoodPulse();
  private readonly beatSystem: BeatSystem;
  private readonly sfxEngine: SFXEngine;

  constructor(
    content: GT034Content,
    difficulty: GT034Difficulty,
    _ageBandOrSeed?: AgeBand | number
  ) {
    super(content, difficulty);
    this.activeContent = content;
    const instruments: BeatInstrument[] = content.instruments.map((inst) => ({
      instrument_id: inst.instrument_id,
      freq: inst.freq,
      type: inst.type,
      name_vi: inst.name_vi,
    }));
    this.beatSystem = new BeatSystem({
      tempo_bpm: difficulty.tempo_bpm ?? content.tempo_bpm,
      instruments,
      age_band: "5-6",
    });
    this.sfxEngine = new SFXEngine();
  }

  get tempoBpm(): number {
    return this.difficulty.tempo_bpm ?? this.activeContent.tempo_bpm;
  }

  get replayLimit(): number {
    return this.difficulty.replay_limit ?? 2;
  }

  private get hasRestPad(): boolean {
    return this.activeContent.target_pattern.includes(null);
  }

  private get restPadSlot(): Slot | undefined {
    return this.hasRestPad
      ? this.slots[
          this.activeContent.target_pattern.length +
            this.activeContent.instruments.length
        ]
      : undefined;
  }

  private get won(): boolean {
    return this.isWin || this.isWon;
  }

  override canCommit(): boolean {
    return (
      !(this.won || this.isPlayingPattern) &&
      this.replaysUsed < this.replayLimit
    );
  }

  override isAcceptingInput(): boolean {
    return super.isAcceptingInput() && !this.won && !this.isPlayingPattern;
  }

  override storyLine(): string {
    return GT034_STORY_LINE;
  }

  override mascotMood(): MascotPose | null {
    if (this.won) {
      return null;
    }
    return this.isPlayingPattern ? "listen" : this.mood.current();
  }

  setupEntities(): void {
    this.activeContent = deriveGT034RoundContent(
      this.content,
      this.roundGeneration,
      this.layoutSeed
    );
    this.mood.clear();
    this.userSteps = [];
    this.stepTimesMs = [];
    this.timingMisses = 0;
    this.replaysUsed = 0;
    this.showVisualPattern = false;
    this.isPlayingPattern = false;
    this.activePlayingIndex = null;
    this.playbackElapsedSec = 0;
    this.isWin = false;
    this.isWon = false;
    this.hintPlaybackSec = null;
    this.tapHopMs = null;
    this.particles = [];
    getGT034Clock(this, true);
    this.recordEvent("game_started", {
      template_code: "GT-034",
      difficulty: this.difficulty.pattern_length ?? 4,
      age_band: "5-6",
      device: "tablet",
      reduced_motion: false,
      round_index: 0,
    });
  }

  override destroy(): void {
    this.sfxEngine.dispose();
    deleteGT034Clock(this);
    super.destroy();
  }

  private get hintBeatSec(): number {
    return this.beatSystem.beatDurationSec * 2;
  }

  private get litStepIndex(): number | null {
    if (this.isPlayingPattern) {
      return this.activePlayingIndex;
    }
    if (this.hintPlaybackSec === null) {
      return null;
    }
    const idx = Math.floor(this.hintPlaybackSec / this.hintBeatSec);
    return idx < this.activeContent.target_pattern.length ? idx : null;
  }

  getHintPlaybackIndex(): number | null {
    return this.hintPlaybackSec === null ? null : this.litStepIndex;
  }

  getBeatBall(): GT034BeatBall | null {
    if (this.isPlayingPattern && this.activePlayingIndex !== null) {
      return {
        kind: "beat",
        step: this.activePlayingIndex,
        phase: Math.max(
          0,
          Math.min(
            1,
            this.playbackElapsedSec / this.beatSystem.beatDurationSec -
              this.activePlayingIndex
          )
        ),
      };
    }
    if (this.hintPlaybackSec !== null) {
      const step = this.litStepIndex;
      if (step !== null) {
        return {
          kind: "beat",
          step,
          phase: Math.max(
            0,
            Math.min(1, this.hintPlaybackSec / this.hintBeatSec - step)
          ),
        };
      }
    }
    if (this.tapHopMs !== null) {
      return {
        kind: "tap",
        step: this.tapHopStep,
        phase: Math.min(1, this.tapHopMs / GT034_BALL_HOP_MS),
      };
    }
    return null;
  }

  private startHintPlayback(): void {
    this.hintPlaybackSec = 0;
    this.playHintSequence();
  }

  private playHintSequence(): void {
    const recipes = this.beatSystem.buildNoteRecipes(
      this.activeContent.target_pattern
    );
    this.sfxEngine.playSequence(
      recipes.map((r) => ({
        ...r,
        delaySec: r.delaySec * 2,
        durationSec: r.durationSec * 2,
      }))
    );
  }

  override onScaffoldEscalated(level: HintLevel): void {
    getGT034Clock(this).activeHintLevel = level;
    if (level < 3) {
      this.hintPlaybackSec = null;
    } else if (
      !(this.won || this.isPlayingPattern) &&
      this.hintPlaybackSec === null
    ) {
      this.startHintPlayback();
    }
  }

  override onHintCleared(): void {
    getGT034Clock(this).activeHintLevel = 0;
    this.hintPlaybackSec = null;
  }

  override getHintTargetForLevel(level: HintLevel): HintTarget | null {
    if (level < 3) {
      this.hintPlaybackSec = null;
    } else if (
      this.hintPlaybackSec === null &&
      !this.isPlayingPattern &&
      !this.won
    ) {
      this.startHintPlayback();
    }
    return resolveHintForLevel(
      level,
      this.getHintTargetIndex(),
      this.activeContent.target_pattern.length,
      this.userSteps.length
    );
  }

  override getHintTargetIndex(): number | null {
    return resolveHintTargetIndex(
      this.won,
      this.userSteps,
      this.activeContent.target_pattern,
      this.activeContent.instruments,
      this.hasRestPad
    );
  }

  override getHintDemoSequence(
    level: HintLevel
  ): readonly HintDemoStep[] | null {
    return this.isAcceptingInput()
      ? resolveHintDemoSequence(level, this.getHintTargetIndex())
      : null;
  }

  setPointerOver(x: number, y: number): void {
    const clock = getGT034Clock(this);
    clock.hoveredSlotIdx = this.isAcceptingInput()
      ? findHoveredGT034Slot(
          x,
          y,
          this.slots,
          this.activeContent.target_pattern.length,
          this.userSteps.length
        )
      : null;
  }

  clearPointerOver(): void {
    getGT034Clock(this).hoveredSlotIdx = null;
  }

  protected computeSlots(band: AgeBand): readonly Slot[] {
    return computeStageGroupsLayout({
      stage: resolveStageRect(this.logicSpace, band, this.stageRect),
      ageBand: band,
      cssPerLogic: this.cssPerLogic,
      groups: [
        {
          count: this.activeContent.target_pattern.length,
          role: "target",
          hasLabels: true,
        },
        {
          count:
            this.activeContent.instruments.length + (this.hasRestPad ? 1 : 0),
          role: "source",
          hasLabels: true,
        },
      ],
    });
  }

  update(deltaMs: number): void {
    const clock = getGT034Clock(this);
    clock.elapsedMs += deltaMs;
    this.mood.tick(deltaMs);
    this.particles = updateParticles(this.particles);
    if (this.tapHopMs !== null) {
      this.tapHopMs =
        this.tapHopMs + deltaMs >= GT034_BALL_HOP_MS
          ? null
          : this.tapHopMs + deltaMs;
    }
    if (this.hintPlaybackSec !== null) {
      this.hintPlaybackSec += deltaMs / 1000;
      if (
        this.hintPlaybackSec >=
        (this.activeContent.target_pattern.length + 1) * this.hintBeatSec
      ) {
        this.hintPlaybackSec = 0;
        this.playHintSequence();
      }
    }
    if (!this.isPlayingPattern) {
      return;
    }
    this.playbackElapsedSec += deltaMs / 1000;
    const beatSec = this.beatSystem.beatDurationSec;
    if (
      this.playbackElapsedSec >=
      this.activeContent.target_pattern.length * beatSec
    ) {
      this.isPlayingPattern = false;
      this.activePlayingIndex = null;
      this.playbackElapsedSec = 0;
      if (this.replaysUsed >= this.replayLimit) {
        this.showVisualPattern = true;
      }
      return;
    }
    this.activePlayingIndex = Math.min(
      this.activeContent.target_pattern.length - 1,
      Math.floor(this.playbackElapsedSec / beatSec)
    );
  }

  private get toleranceMs(): number {
    return (
      this.beatSystem.getTimingToleranceMs() *
      (1 + this.timingMisses * TIMING_WIDEN_STEP)
    );
  }

  private validateTapAction(
    instrumentId: string | null,
    timeMs: number | undefined
  ): ActionResult {
    const ok =
      instrumentId &&
      this.activeContent.instruments.some(
        (i) => i.instrument_id === instrumentId
      );
    return ok ? this.verdictForNextStep(instrumentId, timeMs) : ACTION_IGNORED;
  }

  validateAction(action: GameAction): ActionResult {
    if (this.won) {
      return ACTION_IGNORED;
    }
    switch (action.type) {
      // Nghe mẫu, gợi ý, xoá dãy là thao tác, không phải câu trả lời — Cấm
      // pop hay ghi `answer_correct` (`BR-EIC-10`).
      case "play_pattern":
      case "replay_pattern":
      case "listen":
        return this.replaysUsed >= this.replayLimit ? ACTION_IGNORED : QUIET_OK;
      case "show_hint":
      case "clear_sequence":
      case "reset":
        return QUIET_OK;
      case "tap_instrument":
      case "play_instrument":
      case "tap_item":
      case "tap": {
        const parsed = parseGT034Action(action);
        return this.validateTapAction(parsed.instrumentId, parsed.timeMs);
      }
      case "tap_rest":
      case "rest":
        return this.verdictForNextStep(null, parseGT034Action(action).timeMs);
      case "undo_beat":
      case "undo_step":
      case "undo":
        return this.userSteps.length > 0 ? ACTION_CORRECT : ACTION_IGNORED;
      case "submit_sequence":
      case "submit":
        return this.judgeCurrent();
      default:
        return ACTION_IGNORED;
    }
  }

  private judgeCurrent(): ActionResult {
    const ok =
      judgeGT034Sequence(
        this.userSteps,
        this.stepTimesMs,
        this.activeContent.target_pattern,
        this.beatSystem.beatDurationSec * 1000,
        this.toleranceMs,
        this.timingMisses
      ) === "ok";
    return ok ? ACTION_CORRECT : ACTION_RETRY;
  }

  private verdictForNextStep(
    stepValue: string | null,
    timeMs: number | undefined
  ): ActionResult {
    const nextIdx = this.userSteps.length;
    const len = this.activeContent.target_pattern.length;
    if (nextIdx >= len) {
      return ACTION_IGNORED;
    }
    if (nextIdx + 1 < len) {
      return QUIET_OK;
    }
    const outcome = judgeGT034Sequence(
      [...this.userSteps, stepValue],
      [...this.stepTimesMs, timeMs ?? null],
      this.activeContent.target_pattern,
      this.beatSystem.beatDurationSec * 1000,
      this.toleranceMs,
      this.timingMisses
    );
    return outcome === "ok" ? ACTION_CORRECT : ACTION_RETRY;
  }

  override commit(action: GameAction): void {
    const clock = getGT034Clock(this);
    const parsed = parseGT034Action(action);
    const { type } = action;
    if (
      type === "play_pattern" ||
      type === "replay_pattern" ||
      type === "listen"
    ) {
      this.commitPlayPattern();
    } else if (type === "show_hint") {
      this.showVisualPattern = true;
    } else if (
      (type === "tap_instrument" ||
        type === "play_instrument" ||
        type === "tap_item" ||
        type === "tap") &&
      parsed.instrumentId
    ) {
      this.commitTap(parsed.instrumentId, parsed.timeMs);
    } else if (type === "tap_rest" || type === "rest") {
      this.commitTap(null, parsed.timeMs);
    } else if (
      type === "undo_beat" ||
      type === "undo_step" ||
      type === "undo"
    ) {
      this.userSteps.pop();
      this.stepTimesMs.pop();
      clock.activeHintLevel = 0;
      this.hintPlaybackSec = null;
      clock.wrongFlashStartMs = null;
      clock.wrongFlashKind = null;
    } else if (type === "clear_sequence" || type === "reset") {
      this.userSteps = [];
      this.stepTimesMs = [];
    } else if (type === "submit_sequence" || type === "submit") {
      this.commitStepCompletion(this.userSteps.length - 1);
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
    this.sfxEngine.playSequence(
      this.beatSystem.buildNoteRecipes(this.activeContent.target_pattern)
    );
    this.recordEvent("pattern_played", {
      tempo_bpm: this.tempoBpm,
      pattern_length: this.activeContent.target_pattern.length,
      is_replay: this.replaysUsed > 1,
      round_index: 0,
    });
  }

  private commitTap(
    instrumentId: string | null,
    timeMs: number | undefined
  ): void {
    if (this.userSteps.length >= this.activeContent.target_pattern.length) {
      return;
    }
    if (instrumentId === null && !this.hasRestPad) {
      return;
    }
    if (
      instrumentId !== null &&
      !this.activeContent.instruments.some(
        (i) => i.instrument_id === instrumentId
      )
    ) {
      return;
    }
    const clock = getGT034Clock(this);
    const stepIndex = this.userSteps.length;
    const instIdx =
      instrumentId === null
        ? this.activeContent.instruments.length
        : this.activeContent.instruments.findIndex(
            (i) => i.instrument_id === instrumentId
          );
    this.userSteps.push(instrumentId);
    this.stepTimesMs.push(timeMs ?? null);
    this.tapHopMs = 0;
    this.tapHopStep = stepIndex;
    this.hintPlaybackSec = null;
    clock.activeHintLevel = 0;
    clock.lastTapMs = clock.elapsedMs;
    clock.lastTappedSlotIdx = stepIndex;
    clock.lastTappedSourceIdx =
      instIdx >= 0 ? this.activeContent.target_pattern.length + instIdx : null;
    clock.wrongFlashStartMs = null;
    clock.wrongFlashKind = null;
    if (instrumentId === null) {
      this.queueSfx("wood_beat");
    } else {
      const recipe = this.beatSystem.buildNoteRecipes([instrumentId])[0];
      if (recipe) {
        this.sfxEngine.playSequence([recipe]);
      }
    }
    this.mood.set("happy", GT034_HAPPY_MS);
    this.commitStepCompletion(stepIndex);
  }

  private commitStepCompletion(stepIndex: number): void {
    if (this.userSteps.length !== this.activeContent.target_pattern.length) {
      return;
    }
    const clock = getGT034Clock(this);
    const outcome = judgeGT034Sequence(
      this.userSteps,
      this.stepTimesMs,
      this.activeContent.target_pattern,
      this.beatSystem.beatDurationSec * 1000,
      this.toleranceMs,
      this.timingMisses
    );
    if (outcome === "ok") {
      this.isWin = true;
      clock.victoryStartMs = clock.elapsedMs;
      clock.activeHintLevel = 0;
      this.recordEvent("game_completed", {
        duration_ms: 12_000,
        rounds_total: 1,
        rounds_correct: 1,
      });
      this.sfxEngine.play("pop_celebrate");
      this.sfxEngine.playSequence(
        this.beatSystem
          .buildNoteRecipes(this.userSteps)
          .map((r) => ({ ...r, delaySec: r.delaySec + 0.18 }))
      );
      const lastSlot = this.slots[stepIndex];
      if (lastSlot && this.degradation?.particles_enabled !== false) {
        this.particles.push(...spawnParticlesAtSlot(lastSlot, 20));
      }
      this.winSession();
      return;
    }
    this.sfxEngine.play("amber_soft");
    this.mood.set("wonder", GT034_WONDER_MS);
    clock.wrongFlashKind = outcome === "timing" ? "timing" : "content";
    clock.wrongFlashStartMs = clock.elapsedMs;
    if (outcome === "timing") {
      this.timingMisses++;
      this.recordEvent("timing_missed", {
        misses: this.timingMisses,
        tolerance_ms: Math.round(this.toleranceMs),
      });
      this.userSteps = [];
      this.stepTimesMs = [];
    }
    if (this.replaysUsed >= this.replayLimit) {
      this.showVisualPattern = true;
    } else if (this.difficulty.allow_replay !== false && this.canCommit()) {
      this.commitPlayPattern();
    }
  }

  override toAction(gesture: Gesture): GameAction | null {
    if (this.won) {
      return null;
    }
    return resolveGT034GestureAction(
      gesture,
      this.slots,
      this.activeContent.instruments,
      this.activeContent.target_pattern.length,
      this.userSteps.length,
      this.restPadSlot
    );
  }

  override getView(): EngineView {
    const clock = getGT034Clock(this);
    const wrongActive =
      clock.wrongFlashStartMs !== null &&
      clock.elapsedMs - clock.wrongFlashStartMs < 520;
    return buildGT034View({
      content: this.activeContent,
      hintTargetIndex:
        clock.activeHintLevel > 0 ? this.getHintTargetIndex() : null,
      hoveredSlotIdx: clock.hoveredSlotIdx,
      isWon: this.won,
      litStepIndex: this.litStepIndex,
      restPadSlot: this.restPadSlot,
      slots: this.slots,
      userSteps: this.userSteps,
      wrongActive,
    });
  }

  override checkWinCondition(): boolean {
    return this.won;
  }

  render(ctx: CanvasRenderingContext2D, rs: RenderSystem): void {
    renderGT034Scene(ctx, rs, {
      ball: this.getBeatBall(),
      clock: getGT034Clock(this),
      content: this.activeContent,
      hintTargetIndex:
        getGT034Clock(this).activeHintLevel > 0
          ? this.getHintTargetIndex()
          : null,
      isWon: this.won,
      litStepIndex: this.litStepIndex,
      logicSpace: { w: this.logicSpace.w, h: this.logicSpace.h },
      particles: this.particles,
      particlesEnabled:
        !rs.reducedMotion && this.degradation?.particles_enabled !== false,
      replayLimit: this.replayLimit,
      replaysUsed: this.replaysUsed,
      restPadSlot: this.restPadSlot,
      showVisualPattern: this.showVisualPattern,
      slots: this.slots,
      stageRect: this.stageRect,
      tempoBpm: this.tempoBpm,
      themeId: this.themeId,
      userSteps: this.userSteps,
    });
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
