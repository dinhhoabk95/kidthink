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
import type { EngineView, Gesture, ViewEntity } from "#src/interaction";
import { resolveAssetSpeech } from "#src/labels/spoken-keyword";
import { findHitSlotIndex, TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import {
  computeStageGroupsLayout,
  hasSlotsOutsideStage,
  resolveStageRect,
  STAGE_LABEL_ROW_PX,
} from "#src/layout/stage-groups";
import type { Slot } from "#src/layout/types";
import {
  drawProgressDots,
  drawSceneBackground,
  drawSlotItem,
  getColorsForState,
  spawnParticlesAtSlot,
  updateParticles,
} from "#src/render/index.js";
import type { MascotPose } from "#src/render/mascot";
import {
  type CommandItem,
  type CommandQueueConfig,
  CommandQueueSystem,
  type CommandType,
  type ExecutionResult,
  executeProgram,
  expandCommands,
  findShortestSolution,
  type RobotState,
} from "#src/systems/command-queue-system";
import type { DegradationState } from "#src/systems/degradation";
import { MoodPulse } from "#src/systems/mood-pulse";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import { SFXEngine } from "#src/systems/sfx-engine";
import type {
  GT035Collectible,
  GT035Content,
  GT035Difficulty,
} from "./template.js";

/** Một lệnh chạy mỗi từng này ms: trẻ theo dõi từng bước, không nhảy tức thì (`BR-E035-08`). */
export const GT035_STEP_MS = 600;

/** Thêm/gỡ lệnh hợp lệ nhưng không báo đúng sai (`BR-E035-01`). */
const QUIET_OK: ActionResult = Object.freeze({
  valid: true,
  feedback: "none",
});

type ExecutionStep = ExecutionResult["steps"][number];

/** Tên lệnh chỉ để đọc thành tiếng; thẻ lệnh vẽ bằng biểu tượng (`BR-E035-10`). */
const COMMAND_SPOKEN: Record<CommandType, string> = {
  forward: "Tiến",
  turn_left: "Xoay trái",
  turn_right: "Xoay phải",
  loop: "Lặp 2x",
};

const COMMAND_ICONS: Record<CommandType, string> = {
  forward: "⬆️",
  turn_left: "⬅️",
  turn_right: "➡️",
  loop: "🔁",
};

const COMMAND_ASSETS: Record<
  CommandType,
  { readonly kind: "emoji"; readonly ref: string }
> = {
  forward: { kind: "emoji", ref: COMMAND_ICONS.forward },
  turn_left: { kind: "emoji", ref: COMMAND_ICONS.turn_left },
  turn_right: { kind: "emoji", ref: COMMAND_ICONS.turn_right },
  loop: { kind: "emoji", ref: COMMAND_ICONS.loop },
};

const ROBOT_ASSET = { kind: "emoji", ref: "🤖" } as const;
const DEFAULT_GOAL_ASSET = { kind: "emoji", ref: "⭐" } as const;
const OBSTACLE_ASSET = { kind: "emoji", ref: "🪨" } as const;

const FACING_SPOKEN_VI: Record<RobotState["facing"], string> = {
  up: "lên trên",
  right: "sang phải",
  down: "xuống dưới",
  left: "sang trái",
};

function toCircleViewEntity(
  slot: Slot,
  slotIndex: number,
  info: Omit<ViewEntity, "slotIndex" | "x" | "y" | "w" | "h" | "hitShape">
): ViewEntity {
  return {
    ...info,
    slotIndex,
    x: slot.x,
    y: slot.y,
    w: slot.w,
    h: slot.h,
    hitShape: "circle",
  };
}

interface GT035ActionPayload {
  readonly command?: CommandType;
  readonly index?: number;
}

const FACING_ARROWS: Record<string, string> = {
  up: "↑",
  right: "→",
  down: "↓",
  left: "←",
};

/** Khung chuyện đọc một lần ở vòng đầu (`BR-E035-11`, `BR-FBK-16`). */
export const GT035_STORY_LINE =
  "Robot Bíp đi tìm ngôi sao. Bé xếp các thẻ lệnh rồi bấm chạy, Robot Bíp sẽ đi từng bước theo lệnh nhé!";

/** Mascot nghiêng đầu sau khi chương trình chạy xong mà chưa tới đích. */
export const GT035_WONDER_MS = 1500;

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

  private get allowedCommands(): readonly CommandType[] {
    const fromContent = this.content.allowed_commands;
    let base: readonly CommandType[];
    if (Array.isArray(fromContent) && fromContent.length > 0) {
      base = fromContent;
    } else {
      const fromDiff = (
        this.difficulty as {
          readonly allowed_commands?: readonly CommandType[];
        }
      ).allowed_commands;
      base =
        Array.isArray(fromDiff) && fromDiff.length > 0
          ? fromDiff
          : GT035Session.DEFAULT_ALLOWED_COMMANDS;
    }
    // `allow_loop` tắt thì bỏ thẻ lặp khỏi khay (`BR-E035-14`).
    return this.difficulty.allow_loop === false
      ? base.filter((c) => c !== "loop")
      : base;
  }

  /** Nút ở `zones.action` là nút chạy chương trình (`BR-PSZ-05`). */
  override readonly needsCommit = true;
  override readonly usesPromptZone = true;

  /**
   * Lưới, hàng lệnh và thẻ lệnh cùng ở sàn chạm không vừa sân khấu landscape
   * thấp (`BR-E035-06`). Chỉ xin khi canvas đang ngang: xoay dọc không cứu được
   * bàn đã tràn ở portrait, và lớp xoay máy không được nhốt trẻ ở portrait.
   */
  override requiresPortrait(): boolean {
    const isLandscape = this.logicSpace.w >= this.logicSpace.h;
    return isLandscape && this.overflowsStage();
  }

  /** Có slot nào có vùng chạm ra ngoài sân khấu không (`BR-PSZ-01`). */
  overflowsStage(): boolean {
    const stage = this.stageRect;
    return stage !== undefined && hasSlotsOutsideStage(this.slots, stage);
  }
  /** ▶ lúc soạn, ■ khi robot đang chạy: bấm lúc đó là dừng (`BR-E035-13`). */
  override get commitIcon(): "play" | "stop" {
    return this.isExecuting ? "stop" : "play";
  }

  override canCommit(): boolean {
    if (this.isWin || this.isWon) {
      return false;
    }
    // Đang chạy: nút là nút dừng, luôn bấm được.
    return this.isExecuting || this.queueSystem.commandCount > 0;
  }

  /** Đang chạy thì gợi ý không trỏ vào nút dừng (`BR-E035-13`). */
  override getHintTarget(): HintTarget | null {
    return this.isExecuting ? null : super.getHintTarget();
  }

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

  readonly queueSystem: CommandQueueSystem;
  private readonly sfxEngine: SFXEngine;
  private readonly obstacleSet: ReadonlySet<string>;
  private readonly collectibleMap: ReadonlyMap<string, GT035Collectible>;
  private particles: Particle[] = [];
  private cachedShortestSolution: readonly CommandItem[] | null | undefined =
    undefined;

  constructor(
    content: GT035Content,
    difficulty: GT035Difficulty,
    _ageBandOrSeed?: AgeBand | number
  ) {
    super(content, difficulty);
    this.robotState = { ...content.start };
    this.obstacleSet = new Set(
      content.obstacles.map((o) => `${o.col},${o.row}`)
    );
    this.collectibleMap = new Map(
      content.collectibles.map((c) => [`${c.col},${c.row}`, c])
    );
    this.queueSystem = new CommandQueueSystem(this.queueConfig);
    this.sfxEngine = new SFXEngine();
  }

  getEvents() {
    return this.events;
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

  setupEntities(): void {
    this.robotState = { ...this.content.start };
    this.isExecuting = false;
    this.activeExecutingStep = null;
    this.collectedItemIds = [];
    this.executionResult = null;
    this.isWin = false;
    this.execSteps = [];
    this.execOwners = [];
    this.execCursor = 0;
    this.execClockMs = 0;
    this.execPhase = "running";
    this.particles = [];
    this.cachedShortestSolution = undefined;
    this.mood.clear();
    this.queueSystem.clear();

    this.recordEvent("game_started", {
      template_code: "GT-035",
      difficulty: this.maxCommands,
      age_band: "5-6",
      device: "tablet",
      reduced_motion: false,
      round_index: 0,
    });
  }

  private readonly mood = new MoodPulse();

  override storyLine(): string {
    return GT035_STORY_LINE;
  }

  /** Chỉ phản ứng sau khi robot chạy xong và hụt, không báo trước (`BR-E035-11`). */
  override mascotMood(): MascotPose | null {
    return this.isWon ? null : this.mood.current();
  }

  override destroy(): void {
    this.sfxEngine.dispose();
    super.destroy();
  }

  override getHintTargetIndex(): number | null {
    if (this.isWin || this.isWon || this.isExecuting) {
      return null;
    }
    if (this.cachedShortestSolution === undefined) {
      this.cachedShortestSolution = findShortestSolution(
        this.queueConfig,
        this.allowedCommands
      );
    }
    const sol = this.cachedShortestSolution;
    const nextCmd = sol?.[this.queueSystem.commandCount]?.type;
    const palIdx = nextCmd ? this.allowedCommands.indexOf(nextCmd) : -1;
    const { rows, cols } = this.content.grid;
    return palIdx >= 0 ? rows * cols + this.maxCommands + palIdx : null;
  }

  /**
   * Ô lưới kế tiếp robot bước vào trên đường ngắn nhất, tính từ số lệnh đã xếp
   * (`BR-E035-12`). Lệnh xoay không đổi ô nên đi tiếp tới lệnh làm robot dời chỗ.
   */
  private nextHintCellIndex(): number | null {
    if (this.getHintTargetIndex() === null) {
      return null;
    }
    const sol = this.cachedShortestSolution;
    if (!sol) {
      return null;
    }
    const count = this.queueSystem.commandCount;
    const here = executeProgram(
      this.queueConfig,
      sol.slice(0, count)
    ).finalState;
    for (let n = count + 1; n <= sol.length; n++) {
      const there = executeProgram(
        this.queueConfig,
        sol.slice(0, n)
      ).finalState;
      if (there.col !== here.col || there.row !== here.row) {
        return there.row * this.content.grid.cols + there.col;
      }
    }
    return null;
  }

  /**
   * `L1` ô lưới kế tiếp sáng (chưa chỉ thẻ) · `L2` thẻ lệnh tương ứng nháy trong khay ·
   * `L3` kéo thẻ đó vào ô trống kế tiếp của hàng lệnh (`BR-E035-12`).
   */
  override getHintTargetForLevel(level: HintLevel): HintTarget | null {
    const index = this.getHintTargetIndex();
    if (index === null) {
      return null;
    }
    if (level === 1) {
      const cell = this.nextHintCellIndex();
      return cell === null
        ? null
        : { kind: "region", ids: [`grid_cell_${cell}`] };
    }
    if (level === 2) {
      return { kind: "slot", index };
    }
    const toIndex = this.getHintDestinationIndex();
    return toIndex === null
      ? { kind: "slot", index }
      : { kind: "slot", index, toIndex };
  }

  /** Bước đúng là kéo lệnh từ khay vào ô trống kế tiếp của hàng lệnh. */
  override getHintDestinationIndex(): number | null {
    if (this.getHintTargetIndex() === null) {
      return null;
    }
    const { rows, cols } = this.content.grid;
    const count = this.queueSystem.commandCount;
    return count < this.maxCommands ? rows * cols + count : null;
  }

  /** Số ô của hàng lệnh — `max_commands` của độ khó. */
  private get maxCommands(): number {
    return this.difficulty.max_commands ?? 8;
  }

  protected computeSlots(band: AgeBand): readonly Slot[] {
    // Lưới robot, hàng lệnh, khay lệnh — trong sân khấu của khung (`BR-PSZ-01`).
    // Nút chạy không còn là slot: shell vẽ ở `zones.action` (`BR-PSZ-05`).
    const { rows, cols } = this.content.grid;
    return computeStageGroupsLayout({
      stage: resolveStageRect(this.logicSpace, band, this.stageRect),
      ageBand: band,
      cssPerLogic: this.cssPerLogic,
      groups: [
        { count: rows * cols, role: "target", cols, hasLabels: true },
        { count: this.maxCommands, role: "target" },
        { count: this.allowedCommands.length, role: "source" },
      ],
    });
  }

  /**
   * Nhãn dưới ô robot và ô đích chỉ vẽ khi khoảng giữa hai hàng lưới còn chỗ cho
   * dải nhãn; layout bỏ dải đó khi sân khấu quá thấp (ô ở sàn chạm), nhãn vẽ tiếp
   * sẽ đè lên hàng dưới.
   */
  private gridLabel(text: string): string | undefined {
    const { rows, cols } = this.content.grid;
    const first = this.slots[0];
    const below = this.slots[cols];
    if (rows < 2 || !(first && below)) {
      return text;
    }
    return below.y - first.y - first.h >= STAGE_LABEL_ROW_PX ? text : undefined;
  }

  update(deltaMs: number): ActionResult | null {
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

  /** Hướng nhân vật đang hiện: lúc soạn, xoay theo các lệnh xoay đã xếp (`N4`). */
  getDisplayFacing(): RobotState["facing"] {
    if (this.isExecuting || this.queueSystem.commandCount === 0) {
      return this.robotState.facing;
    }
    const order: RobotState["facing"][] = ["up", "right", "down", "left"];
    let idx = order.indexOf(this.content.start.facing);
    for (const cmd of expandCommands(this.queueSystem.queue).expanded) {
      if (cmd === "turn_right") {
        idx = (idx + 1) % 4;
      } else if (cmd === "turn_left") {
        idx = (idx + 3) % 4;
      }
    }
    return order[idx] ?? this.robotState.facing;
  }

  /** Thẻ của hàng lệnh sở hữu từng bước đã mở rộng (lệnh `loop` sở hữu các bước lặp). */
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
      // Hụt: nhân vật đã đứng nơi hụt một nhịp, giờ về start; hàng lệnh giữ nguyên.
      this.robotState = { ...this.content.start };
      this.collectedItemIds = [];
      this.activeExecutingStep = null;
      this.isExecuting = false;
      return null;
    }
    const step = this.execSteps[this.execCursor];
    if (step) {
      // Một tiếng "bíp" mỗi nhịp robot đi, đúng hay sai đường như nhau (`BR-E035-11`).
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
      this.recordEvent("game_completed", {
        duration_ms: 12_000,
        rounds_total: 1,
        rounds_correct: 1,
      });
      this.sfxEngine.play("pop_celebrate");
      const goalSlot = this.getGoalSlot();
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
    this.sfxEngine.play("amber_soft");
    this.mood.set("wonder", GT035_WONDER_MS);
    this.robotState = { ...result.finalState };
    this.activeExecutingStep =
      result.failedAtStep === undefined
        ? null
        : (this.execOwners[result.failedAtStep] ?? null);
    this.execPhase = "bump";
    return ACTION_RETRY;
  }

  private validateAddCommand(cmd?: CommandType): ActionResult {
    return this.isExecuting ||
      !cmd ||
      !this.allowedCommands.includes(cmd) ||
      this.queueSystem.commandCount >= this.maxCommands
      ? ACTION_IGNORED
      : QUIET_OK;
  }

  private validateRemoveCommand(): ActionResult {
    return this.isExecuting || this.queueSystem.commandCount === 0
      ? ACTION_IGNORED
      : QUIET_OK;
  }

  /** Bấm chạy chỉ bắt đầu chạy; phán quyết đến ở `update()` khi robot đi xong (`BR-E035-01`). */
  private validateRunProgram(): ActionResult {
    return this.isExecuting || this.queueSystem.commandCount === 0
      ? ACTION_IGNORED
      : QUIET_OK;
  }

  validateAction(action: GameAction): ActionResult {
    if (this.isWin || this.isWon) {
      return ACTION_IGNORED;
    }
    const data = (
      typeof action.data === "object" && action.data !== null ? action.data : {}
    ) as GT035ActionPayload;

    switch (action.type) {
      case "add_command":
      case "tap_command":
      case "command":
        return this.validateAddCommand(data.command);
      case "remove_command":
      case "undo":
        return this.validateRemoveCommand();
      case "clear_commands":
      case "reset":
        return this.isExecuting ? ACTION_IGNORED : QUIET_OK;
      case "run_program":
      case "run":
        return this.validateRunProgram();
      case "stop_program":
        return this.isExecuting ? QUIET_OK : ACTION_IGNORED;
      default:
        return ACTION_IGNORED;
    }
  }

  private commitAddCommand(command?: CommandType): void {
    if (
      !command ||
      this.isExecuting ||
      !this.allowedCommands.includes(command) ||
      !this.queueSystem.addCommand({ type: command })
    ) {
      return;
    }
    this.sfxEngine.play("snap_item");
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
      this.sfxEngine.play("snap_item");
      this.recordEvent("command_removed", {
        command: removed.type,
        command_index: removeIdx,
        round_index: 0,
      });
    }
  }

  private commitClearCommands(): void {
    if (!this.isExecuting) {
      this.queueSystem.clear();
      this.robotState = { ...this.content.start };
    }
  }

  private commitRunProgram(): void {
    if (this.isExecuting || this.queueSystem.commandCount === 0) {
      return;
    }
    this.recordEvent("program_run", {
      command_count: this.queueSystem.commandCount,
      round_index: 0,
    });
    // Kết quả tính một lần bằng trình chạy duy nhất (`BR-E035-02`), rồi phát lại từng bước.
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

  /**
   * Dừng giữa lúc chạy: robot về `start`, hàng lệnh giữ nguyên, không tính sai —
   * không `program_failed`, không `wonder`, không tiếng hổ phách (`BR-E035-13`).
   */
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
    const data = (
      typeof action.data === "object" && action.data !== null ? action.data : {}
    ) as GT035ActionPayload;
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
        this.commitClearCommands();
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

  private findHitInRange(
    gx: number,
    gy: number,
    start: number,
    count: number
  ): number {
    return findHitSlotIndex(
      this.slots.slice(start, start + count),
      gx,
      gy,
      "circle",
      TAP_TOLERANCE_PX
    );
  }

  private findTappedPaletteCommand(
    gx: number,
    gy: number,
    palStartIndex: number
  ): CommandType | null {
    const allowed = this.allowedCommands;
    const hitIdx = this.findHitInRange(gx, gy, palStartIndex, allowed.length);
    return hitIdx >= 0 ? (allowed[hitIdx] ?? null) : null;
  }

  private findTappedQueueIndex(
    gx: number,
    gy: number,
    queueStartIndex: number,
    maxCmd: number
  ): number | null {
    const hitIdx = this.findHitInRange(gx, gy, queueStartIndex, maxCmd);
    return hitIdx >= 0 ? hitIdx : null;
  }

  override toAction(gesture: Gesture): GameAction | null {
    if (gesture.type === "commit") {
      return this.isExecuting
        ? { type: "stop_program", data: {} }
        : { type: "run_program", data: {} };
    }
    if (this.isExecuting) {
      return null;
    }
    const { rows, cols } = this.content.grid;
    const gridSlotCount = rows * cols;
    const maxCmd = this.maxCommands;
    const palStart = gridSlotCount + maxCmd;

    if (gesture.type === "drop") {
      const palCmd = this.findTappedPaletteCommand(
        gesture.fromX,
        gesture.fromY,
        palStart
      );
      const queueIdx = this.findTappedQueueIndex(
        gesture.toX,
        gesture.toY,
        gridSlotCount,
        maxCmd
      );
      return palCmd && queueIdx !== null
        ? { type: "add_command", data: { command: palCmd } }
        : null;
    }
    if (gesture.type !== "tap") {
      return null;
    }
    const palCmd = this.findTappedPaletteCommand(
      gesture.x,
      gesture.y,
      palStart
    );
    if (palCmd) {
      return { type: "add_command", data: { command: palCmd } };
    }
    const queueIdx = this.findTappedQueueIndex(
      gesture.x,
      gesture.y,
      gridSlotCount,
      maxCmd
    );
    return queueIdx !== null && queueIdx < this.queueSystem.commandCount
      ? { type: "remove_command", data: { index: queueIdx } }
      : null;
  }

  private describeGridCell(
    col: number,
    row: number
  ): Pick<ViewEntity, "glyph" | "spokenLabel"> {
    const pos = `Ô hàng ${row + 1} cột ${col + 1}`;
    if (this.robotState.col === col && this.robotState.row === row) {
      return {
        glyph: "🤖",
        spokenLabel: `${pos}: Robot đang hướng ${FACING_SPOKEN_VI[this.getDisplayFacing()]}`,
      };
    }
    if (this.content.goal.col === col && this.content.goal.row === row) {
      const { glyph } = resolveAssetSpeech(
        this.content.goal.asset ?? DEFAULT_GOAL_ASSET
      );
      return { glyph, spokenLabel: `${pos}: Đích đến` };
    }
    const cellKey = `${col},${row}`;
    if (this.obstacleSet.has(cellKey)) {
      return { glyph: "🪨", spokenLabel: `${pos}: Vật cản` };
    }
    const candidateColItem = this.collectibleMap.get(cellKey);
    const colItem =
      candidateColItem && !this.collectedItemIds.includes(candidateColItem.id)
        ? candidateColItem
        : undefined;
    if (colItem) {
      const { glyph, spokenLabel = "Vật phẩm" } = resolveAssetSpeech(
        colItem.asset
      );
      return { glyph, spokenLabel: `${pos}: ${spokenLabel}` };
    }
    return { spokenLabel: `${pos} đang trống` };
  }

  private appendGridEntities(
    entities: ViewEntity[],
    gridSlotCount: number
  ): void {
    const { cols } = this.content.grid;
    for (let i = 0; i < gridSlotCount; i++) {
      const slot = this.slots[i];
      if (!slot) {
        continue;
      }
      entities.push(
        toCircleViewEntity(slot, i, {
          id: `grid_cell_${i}`,
          role: "neutral",
          state: "idle",
          ...this.describeGridCell(i % cols, Math.floor(i / cols)),
        })
      );
    }
  }

  private queueCardEntityState(index: number): ViewEntity["state"] {
    if (this.activeExecutingStep === index) {
      return "active";
    }
    return index < this.queueSystem.commandCount ? "selected" : "idle";
  }

  private appendQueueEntities(
    entities: ViewEntity[],
    gridSlotCount: number,
    maxCmd: number
  ): void {
    const commands = this.queueSystem.queue;
    for (let i = 0; i < maxCmd; i++) {
      const slot = this.slots[gridSlotCount + i];
      if (!slot) {
        continue;
      }
      const cmd = commands[i];
      const cmdLabel = cmd ? COMMAND_SPOKEN[cmd.type] : undefined;
      entities.push(
        toCircleViewEntity(slot, gridSlotCount + i, {
          id: `queue_${i}`,
          role: "target",
          state: this.queueCardEntityState(i),
          glyph: cmd ? COMMAND_ICONS[cmd.type] : undefined,
          label: cmdLabel ? undefined : `${i + 1}`,
          spokenLabel: cmdLabel
            ? `Bước ${i + 1}: ${cmdLabel}`
            : `Ô lệnh số ${i + 1} đang trống`,
        })
      );
    }
  }

  private appendPaletteEntities(
    entities: ViewEntity[],
    palStartIndex: number
  ): void {
    const allowed = this.allowedCommands;
    for (let p = 0; p < allowed.length; p++) {
      const slot = this.slots[palStartIndex + p];
      const cmd = allowed[p];
      if (!(slot && cmd)) {
        continue;
      }
      const cmdLabel = COMMAND_SPOKEN[cmd];
      entities.push(
        toCircleViewEntity(slot, palStartIndex + p, {
          id: `pal_${cmd}`,
          role: "source",
          state: "idle",
          glyph: COMMAND_ICONS[cmd],
          spokenLabel: `Lệnh ${cmdLabel}`,
        })
      );
    }
  }

  override getView(): EngineView {
    const entities: ViewEntity[] = [];
    const { rows, cols } = this.content.grid;
    const gridSlotCount = rows * cols;
    const maxCmd = this.maxCommands;

    this.appendGridEntities(entities, gridSlotCount);
    this.appendQueueEntities(entities, gridSlotCount, maxCmd);
    this.appendPaletteEntities(entities, gridSlotCount + maxCmd);

    return {
      activePrompt: this.content.prompt,
      entities,
      focusIndex: this.getHintTargetIndex() ?? undefined,
    };
  }

  private getGoalSlot(): Slot | undefined {
    const { cols } = this.content.grid;
    const goalIdx = this.content.goal.row * cols + this.content.goal.col;
    return this.slots[goalIdx];
  }

  override checkWinCondition(): boolean {
    return this.isWin || this.isWon;
  }

  render(ctx: CanvasRenderingContext2D, rs: RenderSystem): void {
    drawSceneBackground(ctx, rs, this.themeId);
    // Có khung thì lời dẫn thuộc shell (`BR-PSZ-01`); số lệnh đã xếp đọc từ hàng lệnh.
    if (!this.stageRect) {
      drawProgressDots(ctx, rs, {
        done: this.queueSystem.commandCount,
        total: this.maxCommands,
      });
    }

    this.renderGrid(ctx, rs);
    this.renderCommandQueue(ctx, rs);
    this.renderCommandPalette(ctx, rs);

    if (
      this.particles.length > 0 &&
      this.degradation?.particles_enabled !== false
    ) {
      rs.drawParticles(ctx, this.particles);
    }
  }

  private renderGrid(ctx: CanvasRenderingContext2D, rs: RenderSystem): void {
    const { rows, cols } = this.content.grid;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const slotIdx = r * cols + c;
        const slot = this.slots[slotIdx];
        if (slot) {
          this.renderGridCell(ctx, rs, slot, c, r);
        }
      }
    }
  }

  private renderGridCell(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    slot: Slot,
    col: number,
    row: number
  ): void {
    const cellKey = `${col},${row}`;
    const collectible = this.collectibleMap.get(cellKey);
    if (this.robotState.col === col && this.robotState.row === row) {
      drawSlotItem(ctx, rs, slot, {
        id: "robot",
        asset: ROBOT_ASSET,
        label: this.gridLabel(FACING_ARROWS[this.getDisplayFacing()] ?? "→"),
        state: "selected",
      });
    } else if (this.content.goal.col === col && this.content.goal.row === row) {
      drawSlotItem(ctx, rs, slot, {
        id: "goal",
        asset: this.content.goal.asset ?? DEFAULT_GOAL_ASSET,
        state: "idle",
      });
    } else if (this.obstacleSet.has(cellKey)) {
      drawSlotItem(ctx, rs, slot, {
        id: `obs-${col}-${row}`,
        asset: OBSTACLE_ASSET,
        state: "idle",
      });
    } else if (collectible && !this.collectedItemIds.includes(collectible.id)) {
      drawSlotItem(ctx, rs, slot, {
        id: collectible.id,
        asset: collectible.asset,
        state: "idle",
      });
    } else {
      const radius = Math.min(slot.w, slot.h) / 2;
      const { fill, border } = getColorsForState("idle");
      rs.drawClayBody(ctx, slot.x, slot.y, radius, fill, border, "square");
    }
  }

  private renderCommandQueue(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem
  ): void {
    const { rows, cols } = this.content.grid;
    const gridSlotCount = rows * cols;
    const maxCmd = this.maxCommands;

    const commands = this.queueSystem.queue;
    for (let i = 0; i < maxCmd; i++) {
      const slot = this.slots[gridSlotCount + i];
      const cmd = commands[i];
      if (!slot) {
        continue;
      }

      drawSlotItem(
        ctx,
        rs,
        slot,
        cmd
          ? {
              id: `queue-${i}`,
              asset: COMMAND_ASSETS[cmd.type],
              state: this.activeExecutingStep === i ? "touching" : "selected",
            }
          : { id: `empty-queue-${i}`, text: `${i + 1}`, state: "idle" }
      );
    }
  }

  private renderCommandPalette(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem
  ): void {
    const { rows, cols } = this.content.grid;
    const maxCmd = this.maxCommands;
    const paletteStartIdx = rows * cols + maxCmd;
    const allowed = this.allowedCommands;

    for (let i = 0; i < allowed.length; i++) {
      const slot = this.slots[paletteStartIdx + i];
      const cmd = allowed[i];
      if (!(slot && cmd)) {
        continue;
      }

      drawSlotItem(ctx, rs, slot, {
        id: `pal-${cmd}`,
        asset: COMMAND_ASSETS[cmd],
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
