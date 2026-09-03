import type { AgeBand } from "#src/contracts/types";
import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "#src/game-session";
import type { Slot } from "#src/layout/types";
import {
  CommandQueueSystem,
  type CommandType,
  type ExecutionResult,
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

export class GT035Session extends TemplateGameSession<
  GT035Content,
  GT035Difficulty
> {
  slots: Slot[] = [];
  degradation: DegradationState | null = null;

  robotState: RobotState;
  isExecuting = false;
  activeExecutingStep: number | null = null;
  collectedItemIds: string[] = [];
  executionResult: ExecutionResult | null = null;
  isWin = false;

  private readonly queueSystem: CommandQueueSystem;
  private readonly sfxEngine: SFXEngine;
  private particles: Particle[] = [];

  constructor(
    content: GT035Content,
    difficulty: GT035Difficulty,
    _ageBand: AgeBand = "5-6"
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

  setupEntities(): void {
    this.resolveSlots("5-6");
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

  resolveSlots(_band: AgeBand): void {
    this.slots = [];
    const { rows, cols } = this.content.grid;

    // 1. Grid slots (Tâm tại (320, 240))
    const cellSize = Math.min(68, 360 / Math.max(rows, cols));
    const gridStartX = 300 - (cols * cellSize) / 2;
    const gridStartY = 240 - (rows * cellSize) / 2;

    let slotIdx = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        this.slots.push({
          index: slotIdx++,
          role: "target",
          x: gridStartX + c * cellSize + cellSize / 2,
          y: gridStartY + r * cellSize + cellSize / 2,
          w: cellSize - 4,
          h: cellSize - 4,
          hitW: cellSize,
          hitH: cellSize,
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
      this.slots.push({
        index: slotIdx++,
        role: "target",
        x: queueStartX + qCol * (qSlotSize + 8) + qSlotSize / 2,
        y: queueStartY + qRow * (qSlotSize + 12) + qSlotSize / 2,
        w: qSlotSize,
        h: qSlotSize,
        hitW: qSlotSize,
        hitH: qSlotSize,
        page: 0,
      });
    }

    // 3. Command palette buttons (khay dưới)
    const allowed = this.content.allowed_commands;
    const palStartX = 480 - (allowed.length * 90) / 2;
    for (let p = 0; p < allowed.length; p++) {
      this.slots.push({
        index: slotIdx++,
        role: "source",
        x: palStartX + p * 90 + 45,
        y: 450,
        w: 80,
        h: 60,
        hitW: 80,
        hitH: 60,
        page: 0,
      });
    }

    // 4. Run program button slot
    this.slots.push({
      index: slotIdx++,
      role: "source",
      x: 780,
      y: 120,
      w: 96,
      h: 56,
      hitW: 96,
      hitH: 56,
      page: 0,
    });
  }

  update(_deltaMs: number): void {
    this.particles = updateParticles(this.particles);
  }

  validateAction(action: GameAction): ActionResult {
    const type = action.type;
    const data = (action.data as Record<string, unknown>) ?? {};

    switch (type) {
      case "add_command":
      case "tap_command":
      case "command": {
        const cmd = data.command as CommandType;
        return this.handleAddCommand(cmd);
      }
      case "remove_command":
      case "undo": {
        const index = typeof data.index === "number" ? data.index : -1;
        return this.handleRemoveCommand(index);
      }
      case "clear_commands":
      case "reset":
        return this.handleClearCommands();
      case "run_program":
      case "run":
        return this.handleRunProgram();
      default:
        return ACTION_IGNORED;
    }
  }

  private handleAddCommand(command: CommandType): ActionResult {
    if (this.isExecuting || !this.content.allowed_commands.includes(command)) {
      return ACTION_IGNORED;
    }

    const added = this.queueSystem.addCommand({ type: command });
    if (!added) {
      return ACTION_IGNORED;
    }

    const cmdIdx = this.queueSystem.commandCount - 1;
    this.recordEvent("command_added", {
      command,
      command_index: cmdIdx,
      round_index: 0,
    });

    return ACTION_CORRECT;
  }

  private handleRemoveCommand(index: number): ActionResult {
    if (this.isExecuting || this.queueSystem.commandCount === 0) {
      return ACTION_IGNORED;
    }

    const removeIdx = index >= 0 ? index : this.queueSystem.commandCount - 1;
    const removed = this.queueSystem.removeCommand(removeIdx);
    if (!removed) {
      return ACTION_IGNORED;
    }

    this.recordEvent("command_removed", {
      command: removed.type,
      command_index: removeIdx,
      round_index: 0,
    });

    return ACTION_CORRECT;
  }

  private handleClearCommands(): ActionResult {
    if (this.isExecuting) {
      return ACTION_IGNORED;
    }
    this.queueSystem.clear();
    this.robotState = { ...this.content.start };
    return ACTION_CORRECT;
  }

  private handleRunProgram(): ActionResult {
    if (this.isExecuting || this.queueSystem.commandCount === 0) {
      return ACTION_IGNORED;
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
      this.recordEvent("game_completed", {
        duration_ms: 12_000,
        rounds_total: 1,
        rounds_correct: 1,
      });
      this.sfxEngine.play("pop_celebrate");

      // Spawn particles at Goal
      const goalSlot = this.getGoalSlot();
      if (goalSlot) {
        this.particles.push(...spawnParticlesAtSlot(goalSlot, 25));
      }

      return ACTION_CORRECT;
    }

    this.recordEvent("program_failed", {
      failed_step: result.failedAtStep ?? -1,
      reason: result.failureReason ?? "unknown",
      round_index: 0,
    });

    this.sfxEngine.play("amber_soft");
    return ACTION_RETRY;
  }

  private getGoalSlot(): Slot | undefined {
    const { cols } = this.content.grid;
    const goalIdx = this.content.goal.row * cols + this.content.goal.col;
    return this.slots[goalIdx];
  }

  override checkWinCondition(): boolean {
    return this.isWin;
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
