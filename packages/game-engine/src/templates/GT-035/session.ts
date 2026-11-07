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
import { resolveAssetLabels } from "#src/labels/spoken-keyword";
import { findHitSlotIndex, TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import {
  computeStageGroupsLayout,
  hasSlotsOutsideStage,
  resolveStageRect,
  STAGE_LABEL_ROW_PX,
} from "#src/layout/stage-groups";
import type { Slot } from "#src/layout/types";
import {
  drawSceneBackground,
  drawSlotItem,
  drawSubPromptText,
  getColorsForState,
  spawnParticlesAtSlot,
  updateParticles,
} from "#src/render/index.js";
import {
  type CommandItem,
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
    if (Array.isArray(fromContent) && fromContent.length > 0) {
      return fromContent;
    }
    const fromDiff = (
      this.difficulty as { readonly allowed_commands?: readonly CommandType[] }
    ).allowed_commands;
    return Array.isArray(fromDiff) && fromDiff.length > 0
      ? fromDiff
      : GT035Session.DEFAULT_ALLOWED_COMMANDS;
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
    this.particles = [];
    this.cachedShortestSolution = undefined;
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

  override destroy(): void {
    this.sfxEngine.dispose();
    super.destroy();
  }

  override getHintTargetIndex(): number | null {
    if (this.isWin || this.isWon || this.isExecuting) {
      return null;
    }
    if (this.cachedShortestSolution === undefined) {
      this.cachedShortestSolution = findShortestSolution(this.queueConfig);
    }
    const sol = this.cachedShortestSolution;
    const nextCmd = sol?.[this.queueSystem.commandCount]?.type;
    const palIdx = nextCmd ? this.allowedCommands.indexOf(nextCmd) : -1;
    const { rows, cols } = this.content.grid;
    return palIdx >= 0 ? rows * cols + this.maxCommands + palIdx : null;
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
        { count: this.maxCommands, role: "target", hasLabels: true },
        {
          count: this.allowedCommands.length,
          role: "source",
          hasLabels: true,
        },
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

  update(_deltaMs: number): void {
    this.particles = updateParticles(this.particles);
  }

  private validateAddCommand(cmd?: CommandType): ActionResult {
    return this.isExecuting ||
      !cmd ||
      !this.allowedCommands.includes(cmd) ||
      this.queueSystem.commandCount >= this.maxCommands
      ? ACTION_IGNORED
      : ACTION_CORRECT;
  }

  private validateRemoveCommand(): ActionResult {
    return this.isExecuting || this.queueSystem.commandCount === 0
      ? ACTION_IGNORED
      : ACTION_CORRECT;
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
      !this.allowedCommands.includes(command) ||
      !this.queueSystem.addCommand({ type: command })
    ) {
      return;
    }
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
    this.robotState = { ...this.content.start };
    if (this.queueSystem.isFull) {
      this.queueSystem.removeCommand(this.queueSystem.commandCount - 1);
    }
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
    if (this.isExecuting) {
      return null;
    }
    if (gesture.type === "commit") {
      return { type: "run_program", data: {} };
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
  ): Pick<ViewEntity, "glyph" | "label" | "spokenLabel"> {
    const pos = `Ô hàng ${row + 1} cột ${col + 1}`;
    if (this.robotState.col === col && this.robotState.row === row) {
      return {
        glyph: "🤖",
        label: "Robot",
        spokenLabel: `${pos}: Robot đang hướng ${FACING_SPOKEN_VI[this.robotState.facing]}`,
      };
    }
    if (this.content.goal.col === col && this.content.goal.row === row) {
      const { glyph } = resolveAssetLabels(
        this.content.goal.asset ?? DEFAULT_GOAL_ASSET
      );
      return { glyph, label: "Đích", spokenLabel: `${pos}: Đích đến` };
    }
    const cellKey = `${col},${row}`;
    if (this.obstacleSet.has(cellKey)) {
      return { glyph: "🪨", label: "Vật cản", spokenLabel: `${pos}: Vật cản` };
    }
    const candidateColItem = this.collectibleMap.get(cellKey);
    const colItem =
      candidateColItem && !this.collectedItemIds.includes(candidateColItem.id)
        ? candidateColItem
        : undefined;
    if (colItem) {
      const {
        glyph,
        label = "Vật phẩm",
        spokenLabel = "Vật phẩm",
      } = resolveAssetLabels(colItem.asset);
      return { glyph, label, spokenLabel: `${pos}: ${spokenLabel}` };
    }
    return {
      label: `Ô ${row + 1}-${col + 1}`,
      spokenLabel: `${pos} đang trống`,
    };
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
      const cmdLabel = cmd ? COMMAND_LABELS[cmd.type] : undefined;
      entities.push(
        toCircleViewEntity(slot, gridSlotCount + i, {
          id: `queue_${i}`,
          role: "target",
          state: i < this.queueSystem.commandCount ? "selected" : "idle",
          glyph: cmd ? COMMAND_ICONS[cmd.type] : undefined,
          label: cmdLabel ?? `${i + 1}`,
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
      const cmdLabel = COMMAND_LABELS[cmd];
      entities.push(
        toCircleViewEntity(slot, palStartIndex + p, {
          id: `pal_${cmd}`,
          role: "source",
          state: "idle",
          glyph: COMMAND_ICONS[cmd],
          label: cmdLabel,
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
        label: this.gridLabel(
          FACING_ARROWS[this.robotState.facing.toLowerCase()] ?? "→"
        ),
        state: "selected",
      });
    } else if (this.content.goal.col === col && this.content.goal.row === row) {
      drawSlotItem(ctx, rs, slot, {
        id: "goal",
        asset: this.content.goal.asset ?? DEFAULT_GOAL_ASSET,
        label: this.gridLabel("Đích"),
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
              label: COMMAND_LABELS[cmd.type],
              state: "selected",
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
