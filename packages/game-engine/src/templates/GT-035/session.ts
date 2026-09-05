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
import { getTouchFloor } from "#src/layout/constants";
import type { Slot } from "#src/layout/types";
import {
  type CommandQueueConfig,
  CommandQueueSystem,
  type CommandType,
  type ExecutionResult,
  executeProgram,
  type RobotState,
} from "#src/systems/command-queue-system";
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
      maxCommands: this.difficulty.max_commands ?? 8,
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
      difficulty: this.difficulty.max_commands ?? 8,
      age_band: "5-6",
      device: "tablet",
      reduced_motion: false,
      round_index: 0,
    });
  }

  protected computeSlots(band: AgeBand): readonly Slot[] {
    const floor = getTouchFloor(band);
    const slots: Slot[] = [];
    const { rows, cols } = this.content.grid;

    // 1. Grid slots (Tâm tại (320, 240))
    const cellSize = Math.min(68, 360 / Math.max(rows, cols));
    const gridStartX = 300 - (cols * cellSize) / 2;
    const gridStartY = 240 - (rows * cellSize) / 2;

    let slotIdx = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        slots.push({
          index: slotIdx++,
          role: "target",
          x: gridStartX + c * cellSize + cellSize / 2,
          y: gridStartY + r * cellSize + cellSize / 2,
          w: cellSize - 4,
          h: cellSize - 4,
          hitW: Math.max(cellSize, floor),
          hitH: Math.max(cellSize, floor),
          page: 0,
        });
      }
    }

    // 2. Command queue slots (8 ô dọc phía bên phải)
    const maxCmd = this.difficulty.max_commands ?? 8;
    const queueStartX = 620;
    const queueStartY = 220;
    const qSlotSize = 52;

    for (let i = 0; i < maxCmd; i++) {
      const qCol = i % 4;
      const qRow = Math.floor(i / 4);
      slots.push({
        index: slotIdx++,
        role: "target",
        x: queueStartX + qCol * (qSlotSize + 8) + qSlotSize / 2,
        y: queueStartY + qRow * (qSlotSize + 12) + qSlotSize / 2,
        w: qSlotSize,
        h: qSlotSize,
        hitW: Math.max(qSlotSize, floor),
        hitH: Math.max(qSlotSize, floor),
        page: 0,
      });
    }

    // 3. Command palette buttons (khay dưới)
    const allowed = this.content.allowed_commands;
    const palStartX = 480 - (allowed.length * 90) / 2;
    for (let p = 0; p < allowed.length; p++) {
      slots.push({
        index: slotIdx++,
        role: "source",
        x: palStartX + p * 90 + 45,
        y: 450,
        w: 80,
        h: 60,
        hitW: Math.max(80, floor),
        hitH: Math.max(60, floor),
        page: 0,
      });
    }

    // 4. Run program button slot
    slots.push({
      index: slotIdx++,
      role: "source",
      x: 780,
      y: 120,
      w: 96,
      h: 56,
      hitW: Math.max(96, floor),
      hitH: Math.max(56, floor),
      page: 0,
    });

    return slots;
  }

  update(_deltaMs: number): void {
    this.particles = updateParticles(this.particles);
  }

  private validateAddCommand(cmd?: CommandType): ActionResult {
    if (
      this.isExecuting ||
      !cmd ||
      !this.content.allowed_commands.includes(cmd)
    ) {
      return ACTION_IGNORED;
    }
    const maxCmd = this.difficulty.max_commands ?? 8;
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
      !this.content.allowed_commands.includes(command)
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
    const allowed = this.content.allowed_commands;
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
    if (gesture.type !== "tap") {
      return null;
    }

    const hitTolerance = 24;
    const { rows, cols } = this.content.grid;
    const gridSlotCount = rows * cols;
    const maxCmd = this.difficulty.max_commands ?? 8;
    const allowed = this.content.allowed_commands;
    const runSlotIdx = gridSlotCount + maxCmd + allowed.length;

    // Check Run button
    const runSlot = this.slots[runSlotIdx];
    if (runSlot) {
      const hw = (runSlot.hitW ?? runSlot.w) / 2 + hitTolerance;
      const hh = (runSlot.hitH ?? runSlot.h) / 2 + hitTolerance;
      if (
        Math.abs(gesture.x - runSlot.x) <= hw &&
        Math.abs(gesture.y - runSlot.y) <= hh
      ) {
        return { type: "run_program", data: {} };
      }
    }

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
    const allowed = this.content.allowed_commands;
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
    const maxCmd = this.difficulty.max_commands ?? 8;
    const allowed = this.content.allowed_commands;

    this.appendGridEntities(entities, gridSlotCount);
    this.appendQueueEntities(entities, gridSlotCount, maxCmd);
    this.appendPaletteEntities(entities, gridSlotCount + maxCmd);

    // Run slot
    const runSlot = this.slots[gridSlotCount + maxCmd + allowed.length];
    if (runSlot) {
      entities.push({
        id: "run_btn",
        slotIndex: gridSlotCount + maxCmd + allowed.length,
        role: "source",
        state: this.isExecuting ? "selected" : "idle",
        x: runSlot.x,
        y: runSlot.y,
        w: runSlot.w,
        h: runSlot.h,
      });
    }

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
    drawSceneBackground(ctx, rs);
    drawPromptText(ctx, rs, this.content.prompt);
    drawSubPromptText(
      ctx,
      rs,
      `Đã xếp: ${this.queueSystem.commandCount}/${this.difficulty.max_commands ?? 8} lệnh`
    );

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
    const maxCmd = this.difficulty.max_commands ?? 8;
    const queueSlots = this.slots.slice(gridSlotCount, gridSlotCount + maxCmd);

    if (queueSlots.length > 0) {
      drawWoodenTokenDock(ctx, rs);
    }

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
    const maxCmd = this.difficulty.max_commands ?? 8;
    const paletteStartIdx = rows * cols + maxCmd;
    const allowed = this.content.allowed_commands;

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
