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
import { findHitSlotIndex, TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import { hasSlotsOutsideStage } from "#src/layout/stage-groups";
import type { Slot } from "#src/layout/types";
import { spawnParticlesAtSlot, updateParticles } from "#src/render/index.js";
import type { MascotPose } from "#src/render/mascot";
import { createRng } from "#src/rng/mulberry32";
import {
  type CommandItem,
  type CommandQueueConfig,
  CommandQueueSystem,
  type CommandType,
  type ExecutionResult,
  findShortestSolution,
  type RobotState,
} from "#src/systems/command-queue-system";
import type { DegradationState } from "#src/systems/degradation";
import { MoodPulse } from "#src/systems/mood-pulse";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import {
  buildGT035View,
  computeGT035Slots,
  deleteGT035Clock,
  type GT035LayoutHost,
  getDisplayFacing,
  getGT035Clock,
  peekGT035Clock,
  renderGT035Scene,
  resetGT035Clock,
  resolveGT035HintDemoSequence,
  resolveGT035HintDestinationIndex,
  resolveGT035HintTargetForLevel,
  resolveGT035HintTargetIndex,
} from "./layout.js";
import type {
  GT035Collectible,
  GT035Content,
  GT035Difficulty,
} from "./template.js";

export const GT035_STEP_MS = 600;

export const GT035_STORY_LINE =
  "Robot Bíp đi tìm ngôi sao. Bé xếp các thẻ lệnh rồi bấm chạy, Robot Bíp sẽ đi từng bước theo lệnh nhé!";
export const GT035_WONDER_MS = 1500;

const QUIET_OK: ActionResult = Object.freeze({ valid: true, feedback: "none" });
type ExecutionStep = ExecutionResult["steps"][number];

const ALL_COMMANDS: ReadonlySet<string> = new Set<CommandType>([
  "forward",
  "turn_left",
  "turn_right",
  "loop",
  "go_up",
  "go_right",
  "go_down",
  "go_left",
]);

function isCommandType(val: string): val is CommandType {
  return ALL_COMMANDS.has(val);
}

function readActionPayload(action: GameAction): {
  readonly command?: CommandType;
  readonly index?: number;
} {
  if (typeof action.data !== "object" || action.data === null) {
    return {};
  }
  const rawCmd = Reflect.get(action.data, "command");
  const rawIdx = Reflect.get(action.data, "index");
  return {
    command:
      typeof rawCmd === "string" && isCommandType(rawCmd) ? rawCmd : undefined,
    index: typeof rawIdx === "number" ? rawIdx : undefined,
  };
}

function readDifficultyCommands(diff: GT035Difficulty): readonly CommandType[] {
  const raw = Reflect.get(diff, "allowed_commands");
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.filter(
    (item): item is CommandType =>
      typeof item === "string" && isCommandType(item)
  );
}

export class GT035Session extends TemplateGameSession<
  GT035Content,
  GT035Difficulty
> {
  private static readonly DEFAULT_ALLOWED_COMMANDS: readonly CommandType[] = [
    "forward",
    "turn_left",
    "turn_right",
    "loop",
  ];

  override readonly needsCommit = true;
  override readonly usesPromptZone = true;

  degradation: DegradationState | null = null;
  robotState: RobotState;
  isExecuting = false;
  activeExecutingStep: number | null = null;
  collectedItemIds: string[] = [];
  executionResult: ExecutionResult | null = null;
  isWin = false;

  private execSteps: readonly ExecutionStep[] = [];
  private execOwners: readonly number[] = [];
  private execCursor = 0;
  private execClockMs = 0;
  private execPhase: "running" | "bump" = "running";
  private roundClosedOnWrong = false;
  private activePaletteCommands: readonly CommandType[] = [];
  private prevPaletteOrder: readonly CommandType[] = [];

  readonly queueSystem: CommandQueueSystem;
  private readonly obstacleSet: ReadonlySet<string>;
  private readonly collectibleMap: ReadonlyMap<string, GT035Collectible>;
  private readonly mood = new MoodPulse();
  private particles: Particle[] = [];
  private cachedShortestSolution: readonly CommandItem[] | null | undefined =
    undefined;

  constructor(
    content: GT035Content,
    difficulty: GT035Difficulty,
    seedOrBand?: number | AgeBand,
    themeId?: string
  ) {
    super(
      content,
      difficulty,
      typeof seedOrBand === "number" ? seedOrBand : 0,
      themeId
    );
    this.robotState = { ...content.start };
    this.obstacleSet = new Set(
      content.obstacles.map((o) => `${o.col},${o.row}`)
    );
    this.collectibleMap = new Map(
      content.collectibles.map((c) => [`${c.col},${c.row}`, c])
    );
    this.activePaletteCommands = this.computeBaseAllowedCommands();
    this.queueSystem = new CommandQueueSystem(this.queueConfig);
  }

  private computeBaseAllowedCommands(): readonly CommandType[] {
    const fromContent = this.content.allowed_commands;
    let base: readonly CommandType[];
    if (Array.isArray(fromContent) && fromContent.length > 0) {
      base = fromContent;
    } else {
      const fromDiff = readDifficultyCommands(this.difficulty);
      base =
        fromDiff.length > 0 ? fromDiff : GT035Session.DEFAULT_ALLOWED_COMMANDS;
    }
    return this.difficulty.allow_loop === false
      ? base.filter((c) => c !== "loop")
      : base;
  }

  private get maxCommands(): number {
    return this.difficulty.max_commands ?? 8;
  }

  private get queueConfig(): CommandQueueConfig {
    return {
      rows: this.content.grid.rows,
      cols: this.content.grid.cols,
      start: this.content.start,
      goal: this.content.goal,
      obstacles: this.content.obstacles,
      collectibles: this.content.collectibles,
      maxCommands: this.maxCommands,
    };
  }

  private get layoutHost(): GT035LayoutHost {
    return {
      activeExecutingStep: this.activeExecutingStep,
      activePaletteCommands: this.activePaletteCommands,
      cachedShortestSolution: this.cachedShortestSolution ?? null,
      collectedItemIds: this.collectedItemIds,
      collectibleMap: this.collectibleMap,
      content: this.content,
      cssPerLogic: this.cssPerLogic ?? 1,
      degradation: this.degradation,
      execClockMs: this.execClockMs,
      execCursor: this.execCursor,
      execPhase: this.execPhase,
      execSteps: this.execSteps,
      isExecuting: this.isExecuting,
      isWin: this.isWin,
      isWon: this.isWon,
      logicSpace: this.logicSpace,
      maxCommands: this.maxCommands,
      obstacleSet: this.obstacleSet,
      particles: this.particles,
      queueConfig: this.queueConfig,
      queueSystem: this.queueSystem,
      robotState: this.robotState,
      roundClosedOnWrong: this.roundClosedOnWrong,
      slots: this.slots,
      stageRect: this.stageRect,
      themeId: this.themeId,
    };
  }

  getEvents(): ReturnType<TemplateGameSession["getTelemetry"]>["events"] {
    return this.events;
  }

  override requiresPortrait(): boolean {
    const isLandscape = this.logicSpace.w >= this.logicSpace.h;
    return isLandscape && this.overflowsStage();
  }

  overflowsStage(): boolean {
    return (
      this.stageRect !== undefined &&
      hasSlotsOutsideStage(this.slots, this.stageRect)
    );
  }

  override get commitIcon(): "play" | "stop" {
    return this.isExecuting ? "stop" : "play";
  }

  override isAcceptingInput(): boolean {
    return !(this.isWin || this.isWon || this.roundClosedOnWrong);
  }

  override canCommit(): boolean {
    if (this.isWin || this.isWon || this.roundClosedOnWrong) {
      return false;
    }
    return this.isExecuting || this.queueSystem.commandCount > 0;
  }

  override getHintTarget(): HintTarget | null {
    return this.isExecuting ? null : super.getHintTarget();
  }

  override onScaffoldEscalated(level: HintLevel): void {
    getGT035Clock(this).activeHintLevel = level;
  }

  override onHintCleared(): void {
    const clock = peekGT035Clock(this);
    if (clock) {
      clock.activeHintLevel = 0;
    }
  }

  setupEntities(): void {
    this.robotState = { ...this.content.start };
    this.isExecuting = false;
    this.activeExecutingStep = null;
    this.collectedItemIds = [];
    this.executionResult = null;
    this.isWin = false;
    this.roundClosedOnWrong = false;
    this.execSteps = [];
    this.execOwners = [];
    this.execCursor = 0;
    this.execClockMs = 0;
    this.execPhase = "running";
    this.particles = [];
    this.cachedShortestSolution = undefined;
    this.mood.clear();
    this.queueSystem.clear();
    resetGT035Clock(this);

    const base = this.computeBaseAllowedCommands();
    if (this.roundGeneration >= 1 && this.layoutSeed > 0 && base.length >= 2) {
      const rng = createRng(this.layoutSeed + this.roundGeneration * 997);
      const shuffled = [...base];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = rng.nextInt(i + 1);
        const tmp = shuffled[i];
        const swap = shuffled[j];
        if (tmp && swap) {
          shuffled[i] = swap;
          shuffled[j] = tmp;
        }
      }
      if (shuffled.every((cmd, idx) => cmd === this.prevPaletteOrder[idx])) {
        const first = shuffled.shift();
        if (first) {
          shuffled.push(first);
        }
      }
      this.activePaletteCommands = shuffled;
    } else {
      this.activePaletteCommands = base;
    }
    this.prevPaletteOrder = this.activePaletteCommands;

    this.recordEvent("game_started", {
      template_code: "GT-035",
      difficulty: this.maxCommands,
      age_band: "5-6",
      device: "tablet",
      reduced_motion: false,
      round_index: 0,
    });
  }

  override storyLine(): string {
    return GT035_STORY_LINE;
  }

  override mascotMood(): MascotPose | null {
    return this.isWon ? null : this.mood.current();
  }

  override destroy(): void {
    deleteGT035Clock(this);
    super.destroy();
  }

  private ensureCachedSolution(): readonly CommandItem[] | null {
    if (this.cachedShortestSolution === undefined) {
      this.cachedShortestSolution = findShortestSolution(
        this.queueConfig,
        this.activePaletteCommands
      );
    }
    return this.cachedShortestSolution;
  }

  override getHintTargetIndex(): number | null {
    if (!this.isAcceptingInput() || this.isExecuting) {
      return null;
    }
    this.ensureCachedSolution();
    return resolveGT035HintTargetIndex(this.layoutHost);
  }

  override getHintTargetForLevel(level: HintLevel): HintTarget | null {
    if (!this.isAcceptingInput() || this.isExecuting) {
      return null;
    }
    this.ensureCachedSolution();
    return resolveGT035HintTargetForLevel(this.layoutHost, level);
  }

  override getHintDemoSequence(
    level: HintLevel
  ): readonly HintDemoStep[] | null {
    if (level !== 3 || !this.isAcceptingInput() || this.isExecuting) {
      return null;
    }
    this.ensureCachedSolution();
    return resolveGT035HintDemoSequence(this.layoutHost, level);
  }

  override getHintDestinationIndex(): number | null {
    if (!this.isAcceptingInput() || this.isExecuting) {
      return null;
    }
    this.ensureCachedSolution();
    return resolveGT035HintDestinationIndex(this.layoutHost);
  }

  protected computeSlots(band: AgeBand): readonly Slot[] {
    return computeGT035Slots(
      this.logicSpace,
      band,
      this.stageRect,
      this.cssPerLogic ?? 1,
      this.content,
      this.maxCommands,
      this.activePaletteCommands.length
    );
  }

  update(deltaMs: number): ActionResult | null {
    getGT035Clock(this).simMs += deltaMs;
    this.mood.tick(deltaMs);
    this.particles = updateParticles(this.particles);
    if (!(this.isExecuting && this.executionResult)) {
      return null;
    }
    this.execClockMs += deltaMs;
    while (this.execClockMs >= GT035_STEP_MS) {
      this.execClockMs -= GT035_STEP_MS;
      const verdict = this.advanceExecutionBeat(this.executionResult);
      if (verdict) {
        return verdict;
      }
      if (!this.isExecuting) {
        return null;
      }
    }
    return null;
  }

  getDisplayFacing(): RobotState["facing"] {
    return getDisplayFacing(this.layoutHost);
  }

  private ownersOfExpandedSteps(): number[] {
    const owners: number[] = [];
    this.queueSystem.queue.forEach((cmd, i) => {
      if (cmd.type === "loop") {
        const repeats = Math.max(1, (cmd.count ?? 2) - 1);
        for (let r = 0; r < repeats; r++) {
          owners.push(i);
        }
        return;
      }
      owners.push(i);
    });
    return owners;
  }

  private advanceExecutionBeat(result: ExecutionResult): ActionResult | null {
    if (this.execPhase === "bump") {
      this.isExecuting = false;
      this.activeExecutingStep = null;
      if (this.difficulty.allow_retry === false) {
        this.roundClosedOnWrong = true;
        this.ensureCachedSolution();
        this.completeSession();
        return null;
      }
      this.robotState = { ...this.content.start };
      this.collectedItemIds = [];
      return null;
    }
    const step = this.execSteps[this.execCursor];
    if (step) {
      this.queueSfx("robot_beep");
      this.robotState = { ...step.toState };
      if (
        step.collectedId &&
        !this.collectedItemIds.includes(step.collectedId)
      ) {
        this.collectedItemIds = [...this.collectedItemIds, step.collectedId];
      }
      this.activeExecutingStep = this.execOwners[step.stepIndex] ?? null;
      this.execCursor++;
      return null;
    }
    return this.finishExecution(result);
  }

  private finishExecution(result: ExecutionResult): ActionResult {
    if (result.success) {
      this.isExecuting = false;
      this.activeExecutingStep = null;
      this.isWin = true;
      this.isWon = true;
      const clock = getGT035Clock(this);
      clock.winStampSimMs = clock.simMs;
      this.recordEvent("game_completed", {
        duration_ms: 12_000,
        rounds_total: 1,
        rounds_correct: 1,
      });
      const { cols } = this.content.grid;
      const goalSlot =
        this.slots[this.content.goal.row * cols + this.content.goal.col];
      if (goalSlot) {
        this.particles.push(...spawnParticlesAtSlot(goalSlot, 25));
      }
      this.winSession();
      return ACTION_CORRECT;
    }
    this.recordEvent("program_failed", {
      failed_step: result.failedAtStep ?? -1,
      reason: result.failureReason ?? "unknown",
      round_index: 0,
    });
    this.mood.set("wonder", GT035_WONDER_MS);
    this.robotState = { ...result.finalState };
    this.activeExecutingStep =
      result.failedAtStep === undefined
        ? null
        : (this.execOwners[result.failedAtStep] ?? null);
    this.execPhase = "bump";
    return ACTION_RETRY;
  }

  validateAction(action: GameAction): ActionResult {
    if (!this.isAcceptingInput()) {
      return ACTION_IGNORED;
    }
    const data = readActionPayload(action);
    switch (action.type) {
      case "add_command":
      case "tap_command":
      case "command":
        return this.isExecuting ||
          !data.command ||
          !this.activePaletteCommands.includes(data.command) ||
          this.queueSystem.commandCount >= this.maxCommands
          ? ACTION_IGNORED
          : QUIET_OK;
      case "remove_command":
      case "undo":
        return this.isExecuting || this.queueSystem.commandCount === 0
          ? ACTION_IGNORED
          : QUIET_OK;
      case "clear_commands":
      case "reset":
        return this.isExecuting ? ACTION_IGNORED : QUIET_OK;
      case "run_program":
      case "run":
        return this.isExecuting || this.queueSystem.commandCount === 0
          ? ACTION_IGNORED
          : QUIET_OK;
      case "stop_program":
        return this.isExecuting ? QUIET_OK : ACTION_IGNORED;
      default:
        return ACTION_IGNORED;
    }
  }

  private clearActiveHintClock(): void {
    const clock = peekGT035Clock(this);
    if (clock) {
      clock.activeHintLevel = 0;
    }
  }

  private commitAddCommand(command?: CommandType): void {
    if (
      !command ||
      this.isExecuting ||
      !this.activePaletteCommands.includes(command) ||
      !this.queueSystem.addCommand({ type: command })
    ) {
      return;
    }
    this.clearActiveHintClock();
    this.recordEvent("command_added", {
      command,
      command_index: this.queueSystem.commandCount - 1,
      round_index: 0,
    });
  }

  private commitRemoveCommand(index?: number): void {
    if (this.isExecuting || this.queueSystem.commandCount === 0) {
      return;
    }
    const removeIdx =
      typeof index === "number" && index >= 0
        ? index
        : this.queueSystem.commandCount - 1;
    const removed = this.queueSystem.removeCommand(removeIdx);
    if (removed) {
      this.clearActiveHintClock();
      this.recordEvent("command_removed", {
        command: removed.type,
        command_index: removeIdx,
        round_index: 0,
      });
    }
  }

  private commitRunProgram(): void {
    if (this.isExecuting || this.queueSystem.commandCount === 0) {
      return;
    }
    this.clearActiveHintClock();
    this.recordEvent("program_run", {
      command_count: this.queueSystem.commandCount,
      round_index: 0,
    });
    const result = this.queueSystem.run();
    this.executionResult = result;
    this.execSteps = result.steps;
    this.execOwners = this.ownersOfExpandedSteps();
    this.execCursor = 0;
    this.execClockMs = 0;
    this.execPhase = "running";
    this.robotState = { ...this.content.start };
    this.collectedItemIds = [];
    this.activeExecutingStep = null;
    this.isExecuting = true;
  }

  private commitStopProgram(): void {
    if (!this.isExecuting) {
      return;
    }
    this.recordEvent("program_stopped", {
      at_step: this.execCursor,
      command_count: this.queueSystem.commandCount,
      round_index: 0,
    });
    this.robotState = { ...this.content.start };
    this.collectedItemIds = [];
    this.activeExecutingStep = null;
    this.isExecuting = false;
    this.executionResult = null;
    this.execSteps = [];
    this.execOwners = [];
    this.execCursor = 0;
    this.execClockMs = 0;
    this.execPhase = "running";
  }

  override commit(action: GameAction): void {
    if (!this.isAcceptingInput()) {
      return;
    }
    const data = readActionPayload(action);
    switch (action.type) {
      case "add_command":
      case "tap_command":
      case "command":
        this.commitAddCommand(data.command);
        break;
      case "remove_command":
      case "undo":
        this.commitRemoveCommand(data.index);
        break;
      case "clear_commands":
      case "reset":
        if (!this.isExecuting) {
          this.clearActiveHintClock();
          this.queueSystem.clear();
          this.robotState = { ...this.content.start };
        }
        break;
      case "run_program":
      case "run":
        this.commitRunProgram();
        break;
      case "stop_program":
        this.commitStopProgram();
        break;
      default:
        break;
    }
  }

  private hitEntityAt(
    x: number,
    y: number
  ): {
    readonly id: string;
    readonly command?: CommandType;
    readonly queueIdx?: number;
  } | null {
    const { rows, cols } = this.content.grid;
    const gridCount = rows * cols;
    const palStart = gridCount + this.maxCommands;
    const palIdx = findHitSlotIndex(
      this.slots.slice(palStart, palStart + this.activePaletteCommands.length),
      x,
      y,
      "circle",
      TAP_TOLERANCE_PX
    );
    const palCmd = palIdx >= 0 ? this.activePaletteCommands[palIdx] : undefined;
    if (palCmd) {
      return { id: `pal_${palCmd}`, command: palCmd };
    }
    const qIdx = findHitSlotIndex(
      this.slots.slice(gridCount, palStart),
      x,
      y,
      "circle",
      TAP_TOLERANCE_PX
    );
    return qIdx >= 0 ? { id: `queue_${qIdx}`, queueIdx: qIdx } : null;
  }

  setPointerOver(x: number, y: number): void {
    if (!this.isAcceptingInput()) {
      return;
    }
    const hit = this.hitEntityAt(x, y);
    getGT035Clock(this).hoveredEntityId = hit?.id ?? null;
  }

  clearPointerOver(): void {
    const clock = peekGT035Clock(this);
    if (clock) {
      clock.hoveredEntityId = null;
    }
  }

  override toAction(gesture: Gesture): GameAction | null {
    if (!this.isAcceptingInput()) {
      return null;
    }
    if (gesture.type === "commit") {
      return this.isExecuting
        ? { type: "stop_program", data: {} }
        : { type: "run_program", data: {} };
    }
    if (this.isExecuting) {
      return null;
    }
    if (gesture.type === "drop") {
      const fromHit = this.hitEntityAt(gesture.fromX, gesture.fromY);
      const toHit = this.hitEntityAt(gesture.toX, gesture.toY);
      return fromHit?.command && toHit?.queueIdx !== undefined
        ? { type: "add_command", data: { command: fromHit.command } }
        : null;
    }
    if (gesture.type !== "tap") {
      return null;
    }
    const hit = this.hitEntityAt(gesture.x, gesture.y);
    if (hit?.command) {
      return { type: "add_command", data: { command: hit.command } };
    }
    return hit?.queueIdx !== undefined &&
      hit.queueIdx < this.queueSystem.commandCount
      ? { type: "remove_command", data: { index: hit.queueIdx } }
      : null;
  }

  override getView(): EngineView {
    return buildGT035View(
      this.layoutHost,
      peekGT035Clock(this),
      this.getHintTargetIndex() ?? undefined
    );
  }

  override checkWinCondition(): boolean {
    return this.isWin || this.isWon;
  }

  render(ctx: CanvasRenderingContext2D, rs: RenderSystem, timeMs = 0): void {
    renderGT035Scene(this.layoutHost, ctx, rs, timeMs, peekGT035Clock(this));
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
