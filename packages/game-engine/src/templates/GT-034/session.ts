import type { AgeBand } from "#src/contracts/types";
import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  type HintLevel,
  type HintTarget,
  TemplateGameSession,
} from "#src/game-session";
import type {
  EngineView,
  EntityVisual,
  Gesture,
  ViewEntity,
} from "#src/interaction";
import { resolveAssetLabels } from "#src/labels/spoken-keyword";
import { isPointInSlot, TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import {
  computeStageGroupsLayout,
  resolveStageRect,
} from "#src/layout/stage-groups";
import type { Slot } from "#src/layout/types";
import {
  drawSceneBackground,
  drawSlotItem,
  drawSubPromptText,
  spawnParticlesAtSlot,
  updateParticles,
} from "#src/render/index.js";
import type { MascotPose } from "#src/render/mascot";
import { type BeatInstrument, BeatSystem } from "#src/systems/beat-system";
import type { DegradationState } from "#src/systems/degradation";
import { MoodPulse } from "#src/systems/mood-pulse";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import { SFXEngine } from "#src/systems/sfx-engine";
import type { GT034Content, GT034Difficulty } from "./template.js";

/** Ký hiệu pad nhịp nghỉ. */
const REST_GLYPH = "🤫";
/** Trượt nhịp liên tiếp từng này lần thì bỏ chấm nhịp (`BR-E034-07`). */
const TIMING_WAIVE_AFTER = 3;
/** Mỗi lần trượt nhịp nới dung sai thêm tỉ lệ này. */
const TIMING_WIDEN_STEP = 0.5;
/** Gõ/nghỉ hợp lệ nhưng chưa chấm: chấm cả chuỗi khi gõ đủ bước (`BR-E034-06`). */
const QUIET_OK: ActionResult = Object.freeze({
  valid: true,
  feedback: "none",
});

type SequenceOutcome = "ok" | "wrong" | "timing";

interface GT034ActionPayload {
  readonly instrument_id?: string;
  readonly id?: string;
  /** Thời điểm chạm (ms) của cử chỉ; thiếu thì bước đó không bị chấm nhịp. */
  readonly time_ms?: number;
}

/** Khung chuyện đọc một lần ở vòng đầu (`BR-E034-09`, `BR-FBK-16`). */
export const GT034_STORY_LINE =
  "Dế Mèn gõ trống, gõ phách, gõ mõ thành một điệu vui. Bé nghe điệu của Dế Mèn rồi gõ lại đúng nhịp nhé!";

/** Mascot vui ngắn sau mỗi nhịp gõ, như nhau dù đúng hay sai. */
export const GT034_HAPPY_MS = 500;
/** Mascot nghiêng đầu sau khi chuỗi đủ bước mà chưa đúng. */
export const GT034_WONDER_MS = 1500;

export class GT034Session extends TemplateGameSession<
  GT034Content,
  GT034Difficulty
> {
  /** Nút ở `zones.action` là nút nghe mẫu (`BR-PSZ-05`); chuỗi tự chấm khi đủ bước. */
  override readonly needsCommit = true;
  override readonly usesPromptZone = true;
  override get commitIcon(): "listen" {
    return "listen";
  }

  override canCommit(): boolean {
    return (
      !(this.isWin || this.isWon || this.isPlayingPattern) &&
      this.replaysUsed < this.replayLimit
    );
  }

  degradation: DegradationState | null = null;
  userSteps: (string | null)[] = [];
  stepTimesMs: (number | null)[] = [];
  timingMisses = 0;
  replaysUsed = 0;
  showVisualPattern = false;
  isPlayingPattern = false;
  activePlayingIndex: number | null = null;
  playbackElapsedSec = 0;
  isWin = false;
  /** Giây đã chạy của mẫu gợi ý `L3` (nửa tốc độ, lặp); null = không phát (`BR-E034-10`). */
  private hintPlaybackSec: number | null = null;

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

  /** Nhịp thực dùng: độ khó thắng content khi có khai (`BR-E034-11`). */
  get tempoBpm(): number {
    return this.difficulty.tempo_bpm ?? this.content.tempo_bpm;
  }

  override storyLine(): string {
    return GT034_STORY_LINE;
  }

  /**
   * `wonder` sau chuỗi chưa đúng, `listen` suốt lúc phát mẫu, còn lại `happy`
   * ngắn sau mỗi nhịp gõ — không báo trước phách đúng (`BR-E034-09`).
   */
  override mascotMood(): MascotPose | null {
    if (this.isWon) {
      return null;
    }
    // Đang phát mẫu thì trẻ phải nghe: `listen` thắng mọi phản ứng còn lại.
    return this.isPlayingPattern ? "listen" : this.mood.current();
  }

  setupEntities(): void {
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
    this.hintPlaybackSec = null;
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

  override destroy(): void {
    this.sfxEngine.dispose();
    super.destroy();
  }

  /** Một phách của mẫu gợi ý `L3`: nửa tốc độ nên gấp đôi phách thường. */
  private get hintBeatSec(): number {
    return this.beatSystem.beatDurationSec * 2;
  }

  /** Ô bước đang sáng trong mẫu gợi ý `L3`; null khi không phát hoặc đang nghỉ giữa hai vòng. */
  getHintPlaybackIndex(): number | null {
    if (this.hintPlaybackSec === null) {
      return null;
    }
    const idx = Math.floor(this.hintPlaybackSec / this.hintBeatSec);
    return idx < this.content.target_pattern.length ? idx : null;
  }

  /** Ô bước sáng: mẫu đang phát (lượt nghe) hoặc mẫu gợi ý `L3`. */
  private get litStepIndex(): number | null {
    return this.activePlayingIndex ?? this.getHintPlaybackIndex();
  }

  private startHintPlayback(): void {
    this.hintPlaybackSec = 0;
    this.playHintSequence();
  }

  private playHintSequence(): void {
    const recipes = this.beatSystem
      .buildNoteRecipes(this.content.target_pattern)
      .map((r) => ({ ...r, delaySec: r.delaySec * 2 }));
    this.sfxEngine.playSequence(recipes);
  }

  override onHintCleared(): void {
    this.stopHintPlayback();
  }

  private stopHintPlayback(): void {
    this.hintPlaybackSec = null;
  }

  /**
   * `L1` ô bước kế sáng (chưa chỉ nhạc cụ) · `L2` nhạc cụ đúng nháy · `L3` như `L2`
   * kèm mẫu phát lại nửa tốc độ, lặp (`BR-E034-10`).
   */
  override getHintTargetForLevel(level: HintLevel): HintTarget | null {
    if (level === 3 && !(this.isWin || this.isWon)) {
      if (this.hintPlaybackSec === null) {
        this.startHintPlayback();
      }
    } else {
      this.stopHintPlayback();
    }
    if (level !== 1) {
      return this.getHintTarget();
    }
    const idx = this.getHintTargetIndex();
    if (idx === null) {
      return null;
    }
    const patternLen = this.content.target_pattern.length;
    // Đã gõ lệch: ô cần gỡ là ô bước cuối; chưa thì ô bước kế.
    const stepIdx = idx < patternLen ? idx : this.userSteps.length;
    return { kind: "region", ids: [`step_${stepIdx}`] };
  }

  override getHintTargetIndex(): number | null {
    if (this.isWin || this.isWon) {
      return null;
    }
    const patternLen = this.content.target_pattern.length;
    // Đã gõ lệch mẫu: bước kế là gỡ bước cuối (chạm vào nó), không gõ thêm.
    const hasWrongStep = this.userSteps.some(
      (step, i) => step !== this.content.target_pattern[i]
    );
    if (hasWrongStep || this.userSteps.length >= patternLen) {
      return this.userSteps.length > 0 && hasWrongStep
        ? this.userSteps.length - 1
        : null;
    }
    const nextInstId = this.content.target_pattern[this.userSteps.length];
    if (nextInstId === null && this.hasRestPad) {
      return patternLen + this.content.instruments.length;
    }
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
      cssPerLogic: this.cssPerLogic,
      groups: [
        {
          count: this.content.target_pattern.length,
          role: "target",
          hasLabels: true,
        },
        {
          count: this.content.instruments.length + (this.hasRestPad ? 1 : 0),
          role: "source",
          hasLabels: true,
        },
      ],
    });
  }

  update(deltaMs: number): void {
    this.mood.tick(deltaMs);
    this.particles = updateParticles(this.particles);
    this.tickHintPlayback(deltaMs);

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
      this.revealPatternWhenExhausted();
      return;
    }

    const currentIndex = Math.floor(this.playbackElapsedSec / beatSec);
    this.activePlayingIndex =
      currentIndex < this.content.target_pattern.length ? currentIndex : null;
  }

  private tickHintPlayback(deltaMs: number): void {
    if (this.hintPlaybackSec === null) {
      return;
    }
    if (this.isPlayingPattern) {
      this.stopHintPlayback();
      return;
    }
    const loopSec = (this.content.target_pattern.length + 1) * this.hintBeatSec;
    this.hintPlaybackSec += deltaMs / 1000;
    if (this.hintPlaybackSec >= loopSec) {
      this.hintPlaybackSec -= loopSec;
      this.playHintSequence();
    }
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

  private get toleranceMs(): number {
    return (
      this.beatSystem.getTimingToleranceMs() *
      (1 + TIMING_WIDEN_STEP * this.timingMisses)
    );
  }

  /** Chấm cả chuỗi: nội dung trước, rồi nhịp gõ giữa hai bước liền nhau (`BR-E034-07`). */
  private judge(
    steps: readonly (string | null)[],
    times: readonly (number | null)[]
  ): SequenceOutcome {
    if (!this.verifyPatternMatched(steps)) {
      return "wrong";
    }
    if (this.timingMisses >= TIMING_WAIVE_AFTER) {
      return "ok";
    }
    const beatMs = this.beatSystem.beatDurationSec * 1000;
    for (let i = 1; i < times.length; i++) {
      const prev = times[i - 1];
      const cur = times[i];
      if (
        prev !== null &&
        prev !== undefined &&
        cur !== null &&
        cur !== undefined &&
        Math.abs(cur - prev - beatMs) > this.toleranceMs
      ) {
        return "timing";
      }
    }
    return "ok";
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

  /** Bước vừa gõ chỉ có phán quyết khi nó khép chuỗi; giữa chừng không báo đúng sai. */
  private verdictForNextStep(
    step: string | null,
    timeMs: number | undefined
  ): ActionResult {
    const nextSteps = [...this.userSteps, step];
    if (nextSteps.length < this.content.target_pattern.length) {
      return QUIET_OK;
    }
    const nextTimes = [...this.stepTimesMs, timeMs ?? null];
    return this.judge(nextSteps, nextTimes) === "ok"
      ? ACTION_CORRECT
      : ACTION_RETRY;
  }

  private validateTapInstrument(
    instrumentId: string,
    timeMs: number | undefined
  ): ActionResult {
    const instrument = this.content.instruments.find(
      (inst) => inst.instrument_id === instrumentId
    );
    if (
      !instrument ||
      this.userSteps.length >= this.content.target_pattern.length
    ) {
      return ACTION_IGNORED;
    }

    return this.verdictForNextStep(instrumentId, timeMs);
  }

  private validateTapRest(timeMs: number | undefined): ActionResult {
    if (this.userSteps.length >= this.content.target_pattern.length) {
      return ACTION_IGNORED;
    }
    return this.verdictForNextStep(null, timeMs);
  }

  private validateInstrumentAction(data: GT034ActionPayload): ActionResult {
    const instrumentId = data.instrument_id ?? data.id ?? "";
    return this.validateTapInstrument(instrumentId, data.time_ms);
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
        return this.validateTapRest(data.time_ms);
      case "undo_beat":
      case "undo_step":
      case "undo":
        return this.userSteps.length === 0 ? ACTION_IGNORED : ACTION_CORRECT;
      case "clear_sequence":
      case "reset":
        return ACTION_CORRECT;
      case "submit_sequence":
      case "submit":
        return this.judge(this.userSteps, this.stepTimesMs) === "ok"
          ? ACTION_CORRECT
          : ACTION_RETRY;
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
      tempo_bpm: this.tempoBpm,
      pattern_length: this.content.target_pattern.length,
      is_replay: this.replaysUsed > 1,
      round_index: 0,
    });
  }

  /** Hết lượt nghe thì mẫu hiện bằng hình, âm không phát thêm (`BR-E034-08`). */
  private revealPatternWhenExhausted(): void {
    if (this.replaysUsed >= this.replayLimit) {
      this.showVisualPattern = true;
    }
  }

  /** Nghe lại mẫu sau một lượt hụt, nếu còn lượt nghe (`BR-E034-08`). */
  private replayAfterMiss(): void {
    if (this.difficulty.allow_replay !== false && this.canCommit()) {
      this.commitPlayPattern();
    }
  }

  private commitStepCompletion(stepIndex: number): void {
    if (this.userSteps.length !== this.content.target_pattern.length) {
      return;
    }

    const outcome = this.judge(this.userSteps, this.stepTimesMs);
    if (outcome === "ok") {
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
      return;
    }

    this.sfxEngine.play("amber_soft");
    this.mood.set("wonder", GT034_WONDER_MS);
    if (outcome === "timing") {
      // Đúng nội dung nhưng lệch nhịp: dải xoá sạch để gõ lại theo nhịp mẫu.
      this.timingMisses++;
      this.recordEvent("timing_missed", {
        misses: this.timingMisses,
        tolerance_ms: Math.round(this.toleranceMs),
      });
      this.userSteps = [];
      this.stepTimesMs = [];
    }
    this.replayAfterMiss();
  }

  private commitTapInstrument(
    instrumentId: string,
    timeMs: number | undefined
  ): void {
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
    const expected = this.content.target_pattern[stepIndex];

    const singleRecipe = this.beatSystem.buildNoteRecipes([instrumentId])[0];
    if (singleRecipe) {
      this.sfxEngine.playSequence([singleRecipe]);
    }

    this.mood.set("happy", GT034_HAPPY_MS);
    this.userSteps.push(instrumentId);
    this.stepTimesMs.push(timeMs ?? null);

    this.recordEvent("beat_tapped", {
      instrument_id: instrumentId,
      step_index: stepIndex,
      is_correct: instrumentId === expected,
      round_index: 0,
    });

    this.commitStepCompletion(stepIndex);
  }

  private commitTapRest(timeMs: number | undefined): void {
    if (this.userSteps.length >= this.content.target_pattern.length) {
      return;
    }

    const stepIndex = this.userSteps.length;
    // Nhịp nghỉ không có nhạc cụ nên mõ gõ nhẹ; như nhau dù đúng hay sai chỗ nghỉ.
    this.queueSfx("wood_beat");
    this.mood.set("happy", GT034_HAPPY_MS);
    this.userSteps.push(null);
    this.stepTimesMs.push(timeMs ?? null);

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
    const isCorrect = this.judge(this.userSteps, this.stepTimesMs) === "ok";

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
      this.mood.set("wonder", GT034_WONDER_MS);
    }
  }

  override commit(action: GameAction): void {
    this.stopHintPlayback();
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
        this.commitTapInstrument(
          data.instrument_id ?? data.id ?? "",
          data.time_ms
        );
        break;
      case "tap_rest":
      case "rest":
        this.commitTapRest(data.time_ms);
        break;
      case "undo_beat":
      case "undo_step":
      case "undo":
        this.userSteps.pop();
        this.stepTimesMs.pop();
        break;
      case "clear_sequence":
      case "reset":
        this.userSteps = [];
        this.stepTimesMs = [];
        break;
      case "submit_sequence":
      case "submit":
        this.commitSubmitSequence();
        break;
      default:
        break;
    }
  }

  /** Pad "Nghỉ": chỉ có khi mẫu có nhịp nghỉ, nếu không không có gì để bấm. */
  private get hasRestPad(): boolean {
    return this.content.target_pattern.includes(null);
  }

  private get restPadSlot(): Slot | undefined {
    return this.hasRestPad
      ? this.slots[
          this.content.target_pattern.length + this.content.instruments.length
        ]
      : undefined;
  }

  private findTappedInstrumentId(
    gx: number,
    gy: number,
    patternLen: number,
    instCount: number
  ): string | null {
    for (let i = 0; i < instCount; i++) {
      const inst = this.content.instruments[i];
      const slot = this.slots[patternLen + i];
      if (!(inst && slot)) {
        continue;
      }
      if (isPointInSlot(slot, gx, gy, "circle", TAP_TOLERANCE_PX)) {
        return inst.instrument_id;
      }
    }
    return null;
  }

  private isTappedLastStep(gx: number, gy: number): boolean {
    if (this.userSteps.length === 0) {
      return false;
    }
    const slot = this.slots[this.userSteps.length - 1];
    if (!slot) {
      return false;
    }
    return isPointInSlot(slot, gx, gy, "circle", TAP_TOLERANCE_PX);
  }

  override toAction(gesture: Gesture): GameAction | null {
    // Chạm nút ở `zones.action` tới đây thành `commit` (`BR-PSZ-05`): nghe mẫu.
    if (gesture.type === "commit") {
      return { type: "play_pattern", data: {} };
    }
    if (gesture.type !== "tap") {
      return null;
    }

    const patternLen = this.content.target_pattern.length;
    const instCount = this.content.instruments.length;

    const instId = this.findTappedInstrumentId(
      gesture.x,
      gesture.y,
      patternLen,
      instCount
    );
    if (instId) {
      return {
        type: "tap_instrument",
        data: { instrument_id: instId, time_ms: gesture.timeMs },
      };
    }

    const restSlot = this.restPadSlot;
    if (
      restSlot &&
      isPointInSlot(restSlot, gesture.x, gesture.y, "circle", TAP_TOLERANCE_PX)
    ) {
      return { type: "tap_rest", data: { time_ms: gesture.timeMs } };
    }

    if (this.isTappedLastStep(gesture.x, gesture.y)) {
      return { type: "undo_beat", data: {} };
    }

    return null;
  }

  private buildStepEntity(index: number, slot: Slot): ViewEntity {
    let state: EntityVisual = "idle";
    if (this.litStepIndex === index) {
      state = "selected";
    } else if (this.userSteps[index] !== undefined) {
      // Đã gõ, chưa chấm: chấm cả chuỗi khi đủ bước (`BR-E034-06`).
      state = "active";
    }

    const userStep = this.userSteps[index];
    const matchedInst = userStep
      ? this.content.instruments.find((item) => item.instrument_id === userStep)
      : undefined;
    const assetLabels = matchedInst
      ? resolveAssetLabels(matchedInst.asset)
      : undefined;
    const stepName =
      matchedInst?.name_vi ??
      assetLabels?.spokenLabel ??
      (typeof userStep === "string" ? userStep : undefined);

    let spokenLabel = `Bước ${index + 1}`;
    let label = `${index + 1}`;
    if (stepName) {
      spokenLabel = `Bước ${index + 1}: ${stepName}`;
      label = stepName;
    } else if (userStep === null) {
      spokenLabel = `Bước ${index + 1}: nghỉ`;
      label = "Nghỉ";
    }

    return {
      id: `step_${index}`,
      slotIndex: index,
      role: "neutral",
      state,
      x: slot.x,
      y: slot.y,
      w: slot.w,
      h: slot.h,
      hitShape: "circle",
      glyph: assetLabels?.glyph,
      label,
      spokenLabel,
      spokenAudioPath: assetLabels?.spokenAudioPath,
    };
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
      entities.push(this.buildStepEntity(i, slot));
    }

    for (let i = 0; i < instCount; i++) {
      const inst = this.content.instruments[i];
      const slot = this.slots[patternLen + i];
      if (!(inst && slot)) {
        continue;
      }
      const { glyph, label, spokenLabel, spokenAudioPath } = resolveAssetLabels(
        inst.asset
      );
      const displayLabel = inst.name_vi ?? label ?? inst.instrument_id;
      entities.push({
        id: inst.instrument_id,
        slotIndex: patternLen + i,
        role: "source",
        state: "idle",
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
        hitShape: "circle",
        glyph,
        label: displayLabel,
        spokenLabel: inst.name_vi ?? spokenLabel ?? displayLabel,
        spokenAudioPath,
      });
    }

    const restSlot = this.restPadSlot;
    if (restSlot) {
      entities.push({
        id: "pad_rest",
        slotIndex: patternLen + instCount,
        role: "source",
        state: "idle",
        x: restSlot.x,
        y: restSlot.y,
        w: restSlot.w,
        h: restSlot.h,
        hitShape: "circle",
        glyph: REST_GLYPH,
        label: "Nghỉ",
        spokenLabel: "Nghỉ một nhịp",
      });
    }

    return {
      activePrompt: this.content.prompt,
      entities,
      focusIndex: this.getHintTargetIndex() ?? undefined,
    };
  }

  override checkWinCondition(): boolean {
    return this.isWin || this.isWon;
  }

  render(ctx: CanvasRenderingContext2D, rs: RenderSystem): void {
    drawSceneBackground(ctx, rs, this.themeId);
    // Có khung thì lời dẫn thuộc shell (`BR-PSZ-01`); số lượt nghe không hiện (`BR-PSZ-06`).
    if (!this.stageRect) {
      drawSubPromptText(
        ctx,
        rs,
        `Đã nghe: ${this.replaysUsed}/${this.replayLimit} | Nhịp: ${this.tempoBpm} BPM`
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
    const isActive = this.litStepIndex === index;
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
        label: "Nghỉ",
        state: isActive ? "selected" : "idle",
      });
      return;
    }

    if (this.showVisualPattern || isActive) {
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

    const restSlot = this.restPadSlot;
    if (restSlot) {
      drawSlotItem(ctx, rs, restSlot, {
        id: "pad_rest",
        text: REST_GLYPH,
        label: "Nghỉ",
        state: "idle",
      });
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
