import type { AgeBand } from "#src/contracts/types";
import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "#src/game-session";
import type { EngineView, Gesture, ViewEntity } from "#src/interaction";
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
import {
  type CommandQueueConfig,
  CommandQueueSystem,
  type CommandType,
  type ExecutionResult,
  executeProgram,
  findShortestSolution,
  type RobotState,
} from "#src/systems/command-queue-system";
import type { DegradationState } from "#src/systems/degradation";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import { SFXEngine } from "#src/systems/sfx-engine";
import type {
  GT035Collectible,
  GT035Content,
  GT035Difficulty,
} from "./template.js";

const COMMAND_LABELS: Record<CommandType, string> = {
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

interface GT035ActionPayload {
  readonly command?: CommandType;
  readonly index?: number;
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

  private get allowedCommands(): readonly CommandType[] {
    const fromContent = this.content.allowed_commands;
    if (fromContent && Array.isArray(fromContent) && fromContent.length > 0) {
      return fromContent;
    }
    const fromDiff = (
      this.difficulty as { readonly allowed_commands?: readonly CommandType[] }
    ).allowed_commands;
    if (fromDiff && Array.isArray(fromDiff) && fromDiff.length > 0) {
      return fromDiff;
    }
    return GT035Session.DEFAULT_ALLOWED_COMMANDS;
  }

  /** Nút ở `zones.action` là nút chạy chương trình (`BR-PSZ-05`). */
  override readonly needsCommit = true;
  override readonly usesPromptZone = true;
  override readonly commitIcon = "play";

  override canCommit(): boolean {
    return (
      !(this.isWin || this.isWon || this.isExecuting) &&
      this.queueSystem.commandCount > 0
    );
  }

  degradation: DegradationState | null = null;

  robotState: RobotState;
  isExecuting = false;
  activeExecutingStep: number | null = null;
  collectedItemIds: string[] = [];
  executionResult: ExecutionResult | null = null;
  isWin = false;

  readonly queueSystem: CommandQueueSystem;
  private readonly sfxEngine: SFXEngine;
  private particles: Particle[] = [];

  constructor(
    content: GT035Content,
    difficulty: GT035Difficulty,
    _ageBandOrSeed?: AgeBand | number
  ) {
    super(content, difficulty);

    this.robotState = { ...content.start };
    this.queueSystem = new CommandQueueSystem({
      rows: content.grid.rows,
      cols: content.grid.cols,
      start: content.start,
      goal: content.goal,
      obstacles: content.obstacles,
      collectibles: content.collectibles,
      maxCommands: difficulty.max_commands ?? 8,
    });

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
    this.particles = [];
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

  override getHintTargetIndex(): number | null {
    if (this.isWin || this.isWon || this.isExecuting) {
      return null;
    }
    const sol = findShortestSolution(this.queueConfig);
    const { rows, cols } = this.content.grid;
    const gridCount = rows * cols;
    const queueCount = this.maxCommands;
    const allowed = this.allowedCommands;

    // Đủ lệnh thì bước kế là nút chạy ở `zones.action` — không phải slot của
    // sân khấu (`BR-PSZ-05`), nên không có ô nào để chỉ.
    const currentCmdCount = this.queueSystem.commandCount;
    const nextCmd = sol?.[currentCmdCount]?.type;
    if (!nextCmd) {
      return null;
    }
    const palIdx = allowed.indexOf(nextCmd);
    return palIdx >= 0 ? gridCount + queueCount + palIdx : null;
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
      groups: [
        { count: rows * cols, role: "target", cols, hasLabels: true },
        { count: this.maxCommands, role: "target", hasLabels: true },
        {
          count: this.allowedCommands.length,
          role: "source",
          hasLabels: true,
        },
      ],
    });
  }

  update(_deltaMs: number): void {
    this.particles = updateParticles(this.particles);
  }

  private validateAddCommand(cmd?: CommandType): ActionResult {
    if (this.isExecuting || !cmd || !this.allowedCommands.includes(cmd)) {
      return ACTION_IGNORED;
    }
    const maxCmd = this.maxCommands;
    if (this.queueSystem.commandCount >= maxCmd) {
      return ACTION_IGNORED;
    }
    return ACTION_CORRECT;
  }

  private validateRemoveCommand(): ActionResult {
    if (this.isExecuting || this.queueSystem.commandCount === 0) {
      return ACTION_IGNORED;
    }
    return ACTION_CORRECT;
  }

  private validateRunProgram(): ActionResult {
    if (this.isExecuting || this.queueSystem.commandCount === 0) {
      return ACTION_IGNORED;
    }
    const res = executeProgram(this.queueConfig, [...this.queueSystem.queue]);
    return res.success ? ACTION_CORRECT : ACTION_RETRY;
  }

  validateAction(action: GameAction): ActionResult {
    if (this.isWin || this.isWon) {
      return ACTION_IGNORED;
    }

    const type = action.type;
    const data = (
      typeof action.data === "object" && action.data !== null ? action.data : {}
    ) as GT035ActionPayload;

    switch (type) {
      case "add_command":
      case "tap_command":
      case "command":
        return this.validateAddCommand(data.command);
      case "remove_command":
      case "undo":
        return this.validateRemoveCommand();
      case "clear_commands":
      case "reset":
        return this.isExecuting ? ACTION_IGNORED : ACTION_CORRECT;
      case "run_program":
      case "run":
        return this.validateRunProgram();
      default:
        return ACTION_IGNORED;
    }
  }

  private commitAddCommand(command?: CommandType): void {
    if (
      !command ||
      this.isExecuting ||
      !this.allowedCommands.includes(command)
    ) {
      return;
    }

    const added = this.queueSystem.addCommand({ type: command });
    if (!added) {
      return;
    }

    const cmdIdx = this.queueSystem.commandCount - 1;
    this.recordEvent("command_added", {
      command,
      command_index: cmdIdx,
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
    if (!removed) {
      return;
    }

    this.recordEvent("command_removed", {
      command: removed.type,
      command_index: removeIdx,
      round_index: 0,
    });
  }

  private commitClearCommands(): void {
    if (this.isExecuting) {
      return;
    }
    this.queueSystem.clear();
    this.robotState = { ...this.content.start };
  }

  private commitRunProgram(): void {
    if (this.isExecuting || this.queueSystem.commandCount === 0) {
      return;
    }

    this.recordEvent("program_run", {
      command_count: this.queueSystem.commandCount,
      round_index: 0,
    });

    const result = this.queueSystem.run();
    this.executionResult = result;
    this.robotState = result.finalState;
    this.collectedItemIds = [...result.collectedIds];

    if (result.success) {
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
      return;
    }

    this.recordEvent("program_failed", {
      failed_step: result.failedAtStep ?? -1,
      reason: result.failureReason ?? "unknown",
      round_index: 0,
    });
    this.sfxEngine.play("amber_soft");
  }

  override commit(action: GameAction): void {
    const type = action.type;
    const data = (
      typeof action.data === "object" && action.data !== null ? action.data : {}
    ) as GT035ActionPayload;

    switch (type) {
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
      default:
        break;
    }
  }

  private findTappedPaletteCommand(
    gx: number,
    gy: number,
    tol: number,
    palStartIndex: number
  ): CommandType | null {
    const allowed = this.allowedCommands;
    for (let p = 0; p < allowed.length; p++) {
      const slot = this.slots[palStartIndex + p];
      const cmd = allowed[p];
      if (!(slot && cmd)) {
        continue;
      }
      const hw = (slot.hitW ?? slot.w) / 2 + tol;
      const hh = (slot.hitH ?? slot.h) / 2 + tol;
      if (Math.abs(gx - slot.x) <= hw && Math.abs(gy - slot.y) <= hh) {
        return cmd;
      }
    }
    return null;
  }

  private findTappedQueueIndex(
    gx: number,
    gy: number,
    tol: number,
    queueStartIndex: number,
    maxCmd: number
  ): number | null {
    for (let i = 0; i < maxCmd; i++) {
      const slot = this.slots[queueStartIndex + i];
      if (!slot) {
        continue;
      }
      const hw = (slot.hitW ?? slot.w) / 2 + tol;
      const hh = (slot.hitH ?? slot.h) / 2 + tol;
      if (Math.abs(gx - slot.x) <= hw && Math.abs(gy - slot.y) <= hh) {
        return i;
      }
    }
    return null;
  }

  override toAction(gesture: Gesture): GameAction | null {
    // Chạm nút ở `zones.action` tới đây thành `commit` (`BR-PSZ-05`): chạy chương trình.
    if (gesture.type === "commit") {
      return { type: "run_program", data: {} };
    }
    if (gesture.type !== "tap") {
      return null;
    }

    const hitTolerance = 24;
    const { rows, cols } = this.content.grid;
    const gridSlotCount = rows * cols;
    const maxCmd = this.maxCommands;

    // Check Palette buttons
    const palCmd = this.findTappedPaletteCommand(
      gesture.x,
      gesture.y,
      hitTolerance,
      gridSlotCount + maxCmd
    );
    if (palCmd) {
      return { type: "add_command", data: { command: palCmd } };
    }

    // Check Queue slots (tapping removes command)
    const queueIdx = this.findTappedQueueIndex(
      gesture.x,
      gesture.y,
      hitTolerance,
      gridSlotCount,
      maxCmd
    );
    if (queueIdx !== null && queueIdx < this.queueSystem.commandCount) {
      return { type: "remove_command", data: { index: queueIdx } };
    }

    return null;
  }

  private appendGridEntities(
    entities: ViewEntity[],
    gridSlotCount: number
  ): void {
    for (let i = 0; i < gridSlotCount; i++) {
      const slot = this.slots[i];
      if (!slot) {
        continue;
      }
      entities.push({
        id: `grid_cell_${i}`,
        slotIndex: i,
        role: "target",
        state: "idle",
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
      });
    }
  }

  private appendQueueEntities(
    entities: ViewEntity[],
    gridSlotCount: number,
    maxCmd: number
  ): void {
    for (let i = 0; i < maxCmd; i++) {
      const slot = this.slots[gridSlotCount + i];
      if (!slot) {
        continue;
      }
      entities.push({
        id: `queue_${i}`,
        slotIndex: gridSlotCount + i,
        role: "target",
        state: i < this.queueSystem.commandCount ? "selected" : "idle",
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
      });
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
      entities.push({
        id: `pal_${cmd}`,
        slotIndex: palStartIndex + p,
        role: "source",
        state: "idle",
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
      });
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
      drawPromptText(ctx, rs, this.content.prompt);
      drawSubPromptText(
        ctx,
        rs,
        `Đã xếp: ${this.queueSystem.commandCount}/${this.maxCommands} lệnh`
      );
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
    const obstacleSet = new Set(
      this.content.obstacles.map((o) => `${o.col},${o.row}`)
    );
    const collectibleMap = new Map(
      this.content.collectibles.map((c) => [`${c.col},${c.row}`, c])
    );

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const slotIdx = r * cols + c;
        const slot = this.slots[slotIdx];
        if (slot) {
          this.renderGridCell(ctx, rs, slot, c, r, obstacleSet, collectibleMap);
        }
      }
    }
  }

  private renderGridCell(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    slot: Slot,
    col: number,
    row: number,
    obstacleSet: Set<string>,
    collectibleMap: Map<string, GT035Collectible>
  ): void {
    const isRobotHere =
      this.robotState.col === col && this.robotState.row === row;
    const isGoal =
      this.content.goal.col === col && this.content.goal.row === row;
    const isObstacle = obstacleSet.has(`${col},${row}`);
    const collectible = collectibleMap.get(`${col},${row}`);
    const isCollected =
      collectible && this.collectedItemIds.includes(collectible.id);

    if (isRobotHere) {
      drawSlotItem(ctx, rs, slot, {
        id: "robot",
        asset: { kind: "emoji", ref: "🤖" },
        label: this.robotState.facing.toUpperCase(),
        state: "selected",
      });
      return;
    }

    if (isGoal) {
      drawSlotItem(ctx, rs, slot, {
        id: "goal",
        asset: this.content.goal.asset ?? {
          kind: "emoji",
          ref: "⭐",
        },
        label: "ĐÍCH",
        state: "idle",
      });
      return;
    }

    if (isObstacle) {
      drawSlotItem(ctx, rs, slot, {
        id: `obs-${col}-${row}`,
        asset: { kind: "emoji", ref: "🪨" },
        state: "idle",
      });
      return;
    }

    if (collectible && !isCollected) {
      drawSlotItem(ctx, rs, slot, {
        id: collectible.id,
        asset: collectible.asset,
        state: "idle",
      });
      return;
    }

    drawSlotItem(ctx, rs, slot, {
      id: `cell-${col}-${row}`,
      state: "idle",
    });
  }

  private renderCommandQueue(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem
  ): void {
    const { rows, cols } = this.content.grid;
    const gridSlotCount = rows * cols;
    const maxCmd = this.maxCommands;
    const queueSlots = this.slots.slice(gridSlotCount, gridSlotCount + maxCmd);

    const commands = this.queueSystem.queue;
    for (let i = 0; i < queueSlots.length; i++) {
      const slot = queueSlots[i];
      const cmd = commands[i];
      if (!slot) {
        continue;
      }

      if (cmd) {
        drawSlotItem(ctx, rs, slot, {
          id: `queue-${i}`,
          asset: { kind: "emoji", ref: COMMAND_ICONS[cmd.type] },
          label: COMMAND_LABELS[cmd.type],
          state: "selected",
        });
      } else {
        drawSlotItem(ctx, rs, slot, {
          id: `empty-queue-${i}`,
          text: `${i + 1}`,
          state: "idle",
        });
      }
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
        asset: { kind: "emoji", ref: COMMAND_ICONS[cmd] },
        label: COMMAND_LABELS[cmd],
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
