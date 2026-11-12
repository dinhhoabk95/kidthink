import type { AgeBand } from "#src/contracts/types";
import {
  ACTION_IGNORED,
  type ActionResult,
  type GameAction,
  type HintDemoStep,
  type HintLevel,
  type HintTarget,
  TemplateGameSession,
} from "#src/game-session";
import type { EngineView, Gesture, ViewEntity } from "#src/interaction";
import { findHitSlotIndex, TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import type { Slot } from "#src/layout/types";
import { SelectionMechanic } from "#src/mechanics/selection-mechanic";
import {
  drawGT009CandidateOverlay,
  drawGT009ClueCard,
  drawGT009DetectiveBackdrop,
} from "#src/render/gt-009-shapes";
import {
  drawClippedToZone,
  drawMagnifier,
  drawSceneBackground,
  drawSlotItem,
  drawStoryCharacterInStage,
  magnifierPose,
} from "#src/render/index.js";
import type { MascotPose } from "#src/render/mascot";
import type { SceneBox } from "#src/render/types";
import type { DegradationState } from "#src/systems/degradation";
import {
  type ControlOfErrorDiagnostics,
  MontessoriExploreTracker,
} from "#src/systems/montessori-explore-system";
import { MoodPulse } from "#src/systems/mood-pulse";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import { WRONG_FLASH_MS, WrongFlash } from "#src/systems/wrong-flash";
import { survivingCandidates } from "./deduction.js";
import {
  buildGT009DisplayCandidates,
  buildGT009ViewEntities,
  computeGT009Layout,
  findGT009ViolatedClue,
  type GT009CandidateItem,
  type GT009HintState,
  getGT009Clock,
  resetGT009Clock,
  resolveGT009CandidateDrawSlot,
  resolveGT009CandidatePose,
  resolveGT009CandidateStates,
  resolveGT009HintDemoSequence,
  resolveGT009HintState,
  resolveGT009HintTargetForLevel,
  spawnGT009CelebrateParticles,
  stepGT009Particles,
} from "./layout.js";
import type { GT009Content, GT009Difficulty } from "./template.js";

/** Khung chuyện đọc một lần ở vòng đầu (`BR-E009-07`, `BR-FBK-16`). */
export const GT009_STORY_LINE =
  "Chồn Thám Tử đi tìm bạn đang trốn. Bé nghe manh mối, úp những bạn không phải, rồi chọn bạn đang trốn nhé!";

/** Mascot nghe kỹ sau manh mối mới (`BR-E009-07`). */
export const GT009_LISTEN_MS = 1200;
/** Mascot nghiêng đầu sau ứng viên chưa đúng. */
export const GT009_WONDER_MS = 1500;

export class GT009Session extends TemplateGameSession<
  GT009Content,
  GT009Difficulty
> {
  override readonly usesPromptZone = true;

  /** Nút chốt ở `zones.action`; sáng khi trẻ đã úp đủ, chỉ còn một ứng viên. */
  override readonly needsCommit = true;

  degradation: DegradationState | null = null;

  private readonly mechanic = new SelectionMechanic({ mode: "single" });
  private readonly exploreTracker = new MontessoriExploreTracker({
    milestoneTarget: 2,
  });

  private readonly revealedClueIds: string[] = [];
  private readonly eliminatedIds: Set<string> = new Set();
  private displayCandidates: readonly GT009CandidateItem[] = [];
  private clueSlots: readonly Slot[] = [];
  private candidateSlots: readonly Slot[] = [];
  private clueBounds: SceneBox = { x: 0, y: 0, w: 0, h: 0 };
  private boardBounds: SceneBox = { x: 0, y: 0, w: 0, h: 0 };
  private wrongCandidateId: string | null = null;
  private readonly wrongFlash = new WrongFlash();
  private readonly mood = new MoodPulse();
  private isRoundClosed = false;
  private activeHintLevel = 0;
  private hoveredSlotIndex: number | null = null;
  private particles: Particle[] = [];

  override takePillNarration(): string | null {
    return this.exploreTracker.takePillNarration();
  }

  private getActiveCandidates(): readonly GT009CandidateItem[] {
    if (this.displayCandidates.length !== this.content.candidates.length) {
      this.displayCandidates = buildGT009DisplayCandidates(
        this.content.candidates,
        this.layoutSeed
      );
    }
    return this.displayCandidates;
  }

  setupEntities(): void {
    this.mechanic.reset();
    this.exploreTracker.reset(false);
    this.revealedClueIds.length = 0;
    this.eliminatedIds.clear();
    this.wrongCandidateId = null;
    this.wrongFlash.clear();
    this.mood.clear();
    this.isWon = false;
    this.isRoundClosed = false;
    this.activeHintLevel = 0;
    this.hoveredSlotIndex = null;
    this.particles = [];
    this.renderItemStates.clear();
    resetGT009Clock(this);
    this.displayCandidates = buildGT009DisplayCandidates(
      this.content.candidates,
      this.layoutSeed
    );
  }

  override isAcceptingInput(): boolean {
    return !(this.isWon || this.isRoundClosed);
  }

  startExplorePhase(): void {
    this.exploreTracker.reset(true);
  }

  getExploreTracker(): MontessoriExploreTracker {
    return this.exploreTracker;
  }

  getControlOfError(): ControlOfErrorDiagnostics | null {
    return this.exploreTracker.getControlOfErrorDiagnostics();
  }

  isMicroSandboxActive(): boolean {
    return this.exploreTracker.isMicroSandboxActive();
  }

  findViolatedClueForCandidate(
    candidateId: string
  ): GT009Content["clues"][number] | null {
    return findGT009ViolatedClue(this.content, candidateId);
  }

  override storyLine(): string {
    return GT009_STORY_LINE;
  }

  /** Nghe kỹ khi có manh mối mới, nghiêng đầu khi chọn chưa đúng (`BR-E009-07`). */
  override mascotMood(): MascotPose | null {
    return this.isWon ? null : this.mood.current();
  }

  update(deltaMs: number): void {
    const safeDelta = Math.max(0, deltaMs);
    const clock = getGT009Clock(this);
    clock.logicMs += safeDelta;
    this.mood.tick(safeDelta);
    this.exploreTracker.tick(safeDelta);
    if (this.wrongCandidateId && this.wrongFlash.hasExpired(clock.logicMs)) {
      this.setRenderItemState(this.wrongCandidateId, "idle");
      this.wrongCandidateId = null;
    }
    if (this.particles.length > 0) {
      this.particles = stepGT009Particles(
        this.particles,
        safeDelta,
        this.stageRect ?? undefined
      );
    }
  }

  getRevealedClueIds(): readonly string[] {
    return [...this.revealedClueIds];
  }

  getEliminatedIds(): readonly string[] {
    return Array.from(this.eliminatedIds);
  }

  getSurvivingIds(): readonly string[] {
    return survivingCandidates(this.content, this.revealedClueIds).map(
      (c) => c.candidate_id
    );
  }

  private getRemainingIds(): string[] {
    return this.getActiveCandidates()
      .map((c) => c.candidate_id)
      .filter((id) => !this.eliminatedIds.has(id));
  }

  override canCommit(): boolean {
    return (
      !(this.isWon || this.isRoundClosed) && this.getRemainingIds().length === 1
    );
  }

  toggleEliminate(candidateId: string): void {
    if (
      this.isWon ||
      this.isRoundClosed ||
      !this.content.candidates.some((c) => c.candidate_id === candidateId)
    ) {
      return;
    }
    this.activeHintLevel = 0;
    if (this.eliminatedIds.delete(candidateId)) {
      this.wrongCandidateId = null;
      return;
    }
    this.eliminatedIds.add(candidateId);
    this.exploreTracker.recordExploreAction("candidate_eliminated");
    const clue = this.findViolatedClueForCandidate(candidateId);
    if (clue) {
      this.recordEvent("candidate_eliminated", {
        candidate_id: candidateId,
        clue_id: clue.clue_id,
      });
    }
  }

  onClueRevealed(clueId: string, byChild = true): void {
    const clue = this.content.clues.find((c) => c.clue_id === clueId);
    if (!clue || this.revealedClueIds.includes(clueId)) {
      return;
    }
    this.revealedClueIds.push(clueId);
    const clock = getGT009Clock(this);
    clock.clueRevealLogicMs.set(clueId, clock.logicMs);
    if (byChild) {
      this.activeHintLevel = 0;
      this.queueSfx("clue_ping");
      this.mood.set("listen", GT009_LISTEN_MS);
    }
    this.exploreTracker.recordExploreAction("clue_revealed");

    this.recordEvent("clue_revealed", {
      clue_id: clueId,
      revealed_count: this.revealedClueIds.length,
      remaining_count: this.getSurvivingIds().length,
    });
  }

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
    if (this.isWon || this.isRoundClosed) {
      return ACTION_IGNORED;
    }
    if (action.type === "reveal_clue") {
      const clueId = this.readDataString(action, "clue_id");
      return clueId && this.content.clues.some((c) => c.clue_id === clueId)
        ? { valid: true, feedback: "none" }
        : ACTION_IGNORED;
    }
    if (action.type === "toggle_eliminate") {
      const id = this.readDataString(action, "item_id");
      return id && this.content.candidates.some((c) => c.candidate_id === id)
        ? { valid: true, feedback: "none" }
        : ACTION_IGNORED;
    }
    return this.mechanic.validate(action, this.selectionItems());
  }

  private handleWrongCandidate(candidateId: string): void {
    const clock = getGT009Clock(this);
    this.wrongCandidateId = candidateId;
    this.wrongFlash.trigger(clock.logicMs);
    clock.wrongTriggerSeq += 1;
    this.setRenderItemState(candidateId, "wrong");
    this.mood.set("wonder", GT009_WONDER_MS);
    const violatedClue = this.findViolatedClueForCandidate(candidateId);
    const reasonVi = violatedClue
      ? `Chưa khớp manh mối: ${violatedClue.text}`
      : "Ứng viên này đã bị loại bởi manh mối";
    const enteredSandbox = this.exploreTracker.recordWrongAttempt({
      reasonVi,
      targetId: violatedClue?.clue_id ?? candidateId,
      actualValue: candidateId,
      expectedValue: this.content.answer_candidate_id,
    });
    if (
      enteredSandbox &&
      violatedClue &&
      !this.revealedClueIds.includes(violatedClue.clue_id)
    ) {
      this.onClueRevealed(violatedClue.clue_id, false);
    }
    this.recordEvent("control_of_error", {
      candidate_id: candidateId,
      violated_clue_id: violatedClue?.clue_id ?? null,
      micro_sandbox: this.exploreTracker.isMicroSandboxActive(),
    });
    if (!this.difficulty.allow_retry) {
      this.closeRoundOnNoRetry();
    }
  }

  private closeRoundOnNoRetry(): void {
    this.isRoundClosed = true;
    for (const clue of this.content.clues) {
      if (!this.revealedClueIds.includes(clue.clue_id)) {
        this.onClueRevealed(clue.clue_id, false);
      }
    }
    this.completeSession();
  }

  onCandidateSelected(candidateId: string): void {
    if (this.isWon || this.isRoundClosed) {
      return;
    }
    if (candidateId !== this.content.answer_candidate_id) {
      this.handleWrongCandidate(candidateId);
      return;
    }
    const clock = getGT009Clock(this);
    this.wrongCandidateId = null;
    this.exploreTracker.recordCorrectAttempt();
    this.mechanic.select(candidateId);
    this.setRenderItemState(candidateId, "correct");
    clock.winLogicMs = clock.logicMs;
    const candidates = this.getActiveCandidates();
    const idx = candidates.findIndex((c) => c.candidate_id === candidateId);
    const slot =
      (idx >= 0 ? this.candidateSlots[idx] : undefined) ??
      this.slots[this.content.clues.length + Math.max(0, idx)];
    this.particles = spawnGT009CelebrateParticles(
      slot,
      this.degradation?.particles_enabled ?? true
    );
    if (this.checkWinCondition()) {
      this.winSession();
    }
  }

  override checkWinCondition(): boolean {
    return this.mechanic.isSelectionComplete(this.selectionItems());
  }

  private selectionItems(): { id: string; isCorrect: boolean }[] {
    return this.getActiveCandidates().map((c) => ({
      id: c.candidate_id,
      isCorrect: c.candidate_id === this.content.answer_candidate_id,
    }));
  }

  protected computeSlots(ageBand: AgeBand): readonly Slot[] {
    const res = computeGT009Layout({
      clueCount: this.content.clues.length,
      candidateCount: this.content.candidates.length,
      ageBand,
      logicSpace: this.logicSpace,
      stageRect: this.stageRect,
      cssPerLogic: this.cssPerLogic,
    });
    this.clueSlots = res.clueSlots;
    this.candidateSlots = res.candidateSlots;
    this.clueBounds = res.clueBounds;
    this.boardBounds = res.boardBounds;
    this.sourceSlots = res.clueSlots;
    this.targetSlots = res.candidateSlots;
    return res.allSlots;
  }

  setPointerOver(
    point: { readonly x: number; readonly y: number } | null
  ): void {
    if (!(point && this.isAcceptingInput())) {
      this.hoveredSlotIndex = null;
      return;
    }
    const idx = findHitSlotIndex(
      this.slots,
      point.x,
      point.y,
      "square",
      TAP_TOLERANCE_PX
    );
    this.hoveredSlotIndex = idx >= 0 ? idx : null;
  }

  private findHitClue(
    x: number,
    y: number,
    hitTolerance: number
  ): GT009Content["clues"][number] | null {
    const clueSlots = this.slots.slice(0, this.content.clues.length);
    const idx = findHitSlotIndex(clueSlots, x, y, "square", hitTolerance);
    return this.content.clues[idx] ?? null;
  }

  private findHitCandidate(
    x: number,
    y: number,
    hitTolerance: number
  ): GT009CandidateItem | null {
    const candidateSlots = this.slots.slice(this.content.clues.length);
    const idx = findHitSlotIndex(candidateSlots, x, y, "square", hitTolerance);
    return this.getActiveCandidates()[idx] ?? null;
  }

  override toAction(gesture: Gesture): GameAction | null {
    if (this.isWon || this.isRoundClosed) {
      return null;
    }
    if (gesture.type === "commit") {
      const remaining = this.getRemainingIds()[0];
      return this.canCommit() && remaining
        ? { type: "select_item", data: { item_id: remaining } }
        : null;
    }
    if (gesture.type !== "tap") {
      return null;
    }
    const hitClue = this.findHitClue(gesture.x, gesture.y, TAP_TOLERANCE_PX);
    if (hitClue) {
      return { type: "reveal_clue", data: { clue_id: hitClue.clue_id } };
    }
    const hitCand = this.findHitCandidate(
      gesture.x,
      gesture.y,
      TAP_TOLERANCE_PX
    );
    return hitCand
      ? { type: "toggle_eliminate", data: { item_id: hitCand.candidate_id } }
      : null;
  }

  override getHintTargetIndex(): number | null {
    if (this.isWon || this.isRoundClosed) {
      return null;
    }
    const candidates = this.getActiveCandidates();
    const answerId = this.content.answer_candidate_id;
    const clueCount = this.content.clues.length;
    const nextId = this.eliminatedIds.has(answerId)
      ? answerId
      : candidates.find(
          (c) =>
            c.candidate_id !== answerId &&
            !this.eliminatedIds.has(c.candidate_id)
        )?.candidate_id;
    if (!nextId) {
      return null;
    }
    const idx = candidates.findIndex((c) => c.candidate_id === nextId);
    return idx >= 0 ? clueCount + idx : null;
  }

  override onScaffoldEscalated(
    level: HintLevel,
    _trigger: "timer" | "miss_streak"
  ): void {
    this.activeHintLevel = level;
  }

  override onHintCleared(): void {
    this.activeHintLevel = 0;
  }

  override getHintTargetForLevel(level: HintLevel): HintTarget | null {
    if (this.isWon || this.isRoundClosed) {
      return null;
    }
    return resolveGT009HintTargetForLevel({
      level,
      content: this.content,
      candidates: this.getActiveCandidates(),
      revealedClueIds: this.revealedClueIds,
      eliminatedIds: this.eliminatedIds,
      canCommit: this.canCommit(),
      fallbackTarget: () => this.getHintTarget(),
    });
  }

  override getHintDemoSequence(
    level: HintLevel
  ): readonly HintDemoStep[] | null {
    if (this.isWon || this.isRoundClosed) {
      return null;
    }
    return resolveGT009HintDemoSequence({
      level,
      clueCount: this.content.clues.length,
      candidates: this.getActiveCandidates(),
      eliminatedIds: this.eliminatedIds,
      answerId: this.content.answer_candidate_id,
    });
  }

  private readDataString(action: GameAction, key: string): string | undefined {
    if (typeof action.data !== "object" || action.data === null) {
      return undefined;
    }
    const value = Reflect.get(action.data, key);
    return typeof value === "string" ? value : undefined;
  }

  override commit(action: GameAction): void {
    if (this.isWon || this.isRoundClosed) {
      return;
    }
    if (action.type === "reveal_clue") {
      const clueId = this.readDataString(action, "clue_id");
      if (clueId) {
        this.onClueRevealed(clueId);
      }
      return;
    }
    if (action.type === "toggle_eliminate") {
      const id = this.readDataString(action, "item_id");
      if (id) {
        this.toggleEliminate(id);
      }
      return;
    }
    if (
      action.type === "select_item" ||
      action.type === "tap_option" ||
      action.type === "select_candidate"
    ) {
      const itemId =
        this.readDataString(action, "item_id") ??
        this.readDataString(action, "candidate_id");
      if (itemId) {
        this.onCandidateSelected(itemId);
      }
    }
  }

  private toCandidateState(candId: string): ViewEntity["state"] {
    if (this.isWon && candId === this.content.answer_candidate_id) {
      return "correct";
    }
    if (this.eliminatedIds.has(candId) || this.wrongCandidateId === candId) {
      return "incorrect";
    }
    if (this.mechanic.isSelected(candId)) {
      return "selected";
    }
    return "idle";
  }

  override getView(): EngineView {
    return {
      activePrompt: this.content.prompt,
      entities: buildGT009ViewEntities({
        clues: this.content.clues,
        candidates: this.getActiveCandidates(),
        slots: this.slots,
        revealedClueIds: this.revealedClueIds,
        stateForCandidate: (id) => this.toCandidateState(id),
      }),
    };
  }

  private resolveWrongProgress(timeMs: number): {
    readonly isWrongFlashActive: boolean;
    readonly wrongProgress: number | null;
  } {
    const clock = getGT009Clock(this);
    if (
      this.wrongCandidateId !== null &&
      clock.seenTriggerSeq !== clock.wrongTriggerSeq
    ) {
      clock.seenTriggerSeq = clock.wrongTriggerSeq;
      clock.wrongRenderAnchorMs =
        timeMs - this.wrongFlash.elapsedMs(clock.logicMs);
    } else if (this.wrongCandidateId === null) {
      clock.wrongRenderAnchorMs = null;
    }
    const logicElapsed = this.wrongFlash.elapsedMs(clock.logicMs);
    const renderElapsed =
      clock.wrongRenderAnchorMs === null
        ? 0
        : Math.max(0, timeMs - clock.wrongRenderAnchorMs);
    const elapsed = Math.max(logicElapsed, renderElapsed);
    const isWrongFlashActive =
      this.wrongCandidateId !== null && elapsed < WRONG_FLASH_MS;
    return {
      isWrongFlashActive,
      wrongProgress: isWrongFlashActive ? elapsed / WRONG_FLASH_MS : null,
    };
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    const clock = getGT009Clock(this);
    const { isWrongFlashActive, wrongProgress } =
      this.resolveWrongProgress(timeMs);

    drawSceneBackground(ctx, rs, this.themeId);
    const drawStage = (): void => {
      drawStoryCharacterInStage(ctx, "weasel", this.stageRect, this.slots);
      drawGT009DetectiveBackdrop(ctx, this.clueBounds, this.boardBounds);

      const clueCount = this.content.clues.length;
      const clueSlots = this.slots.slice(0, clueCount);
      const boardSlots = this.slots.slice(clueCount);
      const candidates = this.getActiveCandidates();
      const violatedId =
        isWrongFlashActive && this.wrongCandidateId
          ? this.findViolatedClueForCandidate(this.wrongCandidateId)?.clue_id
          : undefined;
      const hintState =
        this.activeHintLevel > 0
          ? resolveGT009HintState({
              content: this.content,
              candidates,
              revealedClueIds: this.revealedClueIds,
              eliminatedIds: this.eliminatedIds,
            })
          : null;

      this.content.clues.forEach((clue, i) => {
        const slot = clueSlots[i];
        if (!slot) {
          return;
        }
        const revealed = this.revealedClueIds.includes(clue.clue_id);
        const revealAnchor = clock.clueRevealLogicMs.get(clue.clue_id);
        const revealElapsedMs =
          revealAnchor === undefined
            ? null
            : Math.max(0, clock.logicMs - revealAnchor);
        drawGT009ClueCard(ctx, rs, slot, {
          clue,
          revealed,
          revealElapsedMs,
          isHovered: this.hoveredSlotIndex === slot.index,
          isHinted:
            this.activeHintLevel >= 1 &&
            hintState?.focusClue?.clue_id === clue.clue_id,
          isViolatedSpotlight: violatedId === clue.clue_id,
        });
      });

      candidates.forEach((cand, i) => {
        const slot = boardSlots[i];
        if (slot) {
          this.renderCandidate(
            ctx,
            rs,
            cand,
            slot,
            timeMs,
            isWrongFlashActive,
            wrongProgress,
            hintState
          );
        }
      });
      candidates.forEach((cand, i) => {
        const slot = boardSlots[i];
        const showWrong =
          cand.candidate_id === this.wrongCandidateId && isWrongFlashActive;
        const showRight =
          this.isWon && cand.candidate_id === this.content.answer_candidate_id;
        if (slot && (showWrong || showRight)) {
          drawMagnifier(ctx, magnifierPose(slot, timeMs, rs.reducedMotion));
        }
      });
      if (
        !rs.reducedMotion &&
        (this.degradation?.particles_enabled ?? true) &&
        this.particles.length > 0
      ) {
        rs.drawParticles(ctx, this.particles);
      }
    };
    if (this.stageRect) {
      drawClippedToZone(ctx, this.stageRect, drawStage);
    } else {
      drawStage();
    }
  }

  private renderCandidate(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    cand: GT009CandidateItem,
    slot: Slot,
    timeMs: number,
    isWrongFlashActive: boolean,
    wrongProgress: number | null,
    hintState: GT009HintState | null
  ): void {
    const eliminated = this.eliminatedIds.has(cand.candidate_id);
    const isHovered = this.hoveredSlotIndex === slot.index;
    const isHintTarget =
      !eliminated &&
      Boolean(hintState?.canvasHintCandidateIds.has(cand.candidate_id));
    const isHinted = this.activeHintLevel >= 2 && isHintTarget;
    const isHintDimmed = this.activeHintLevel === 3 && isHintTarget;
    const { itemState, visualState } = resolveGT009CandidateStates({
      baseState: this.getRenderItemState(cand.candidate_id),
      isCorrect:
        this.isWon && cand.candidate_id === this.content.answer_candidate_id,
      eliminated,
      isWrong:
        cand.candidate_id === this.wrongCandidateId && isWrongFlashActive,
      isSelected: this.mechanic.isSelected(cand.candidate_id),
      isTouching: isHovered,
    });
    const pose = resolveGT009CandidatePose(
      slot.index,
      {
        candidate: cand,
        state: visualState,
        wrongProgress,
        isHintSway: isHinted,
        isHintDimmed,
        timeMs,
      },
      rs.reducedMotion
    );
    const drawSlot = resolveGT009CandidateDrawSlot(slot, pose);
    const hasAsset = Boolean(cand.asset && cand.asset.kind !== "text");
    drawSlotItem(
      ctx,
      rs,
      drawSlot,
      hasAsset
        ? {
            id: cand.candidate_id,
            asset: cand.asset,
            label:
              typeof cand.value === "number" ? String(cand.value) : undefined,
            state: itemState,
          }
        : {
            id: cand.candidate_id,
            text: String(cand.value),
            state: itemState,
          },
      "square"
    );
    drawGT009CandidateOverlay(ctx, rs, {
      slot,
      drawSlot,
      state: itemState,
      eliminated,
      isTouching: visualState === "touching",
      isHovered,
      isHinted,
      isHintDimmed,
      wrongProgress,
    });
  }
}
