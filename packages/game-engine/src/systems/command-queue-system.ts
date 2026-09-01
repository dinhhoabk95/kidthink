/**
 * Hệ thống hàng đợi lệnh và máy trạng thái robot cho GT-035 (command-sequence).
 *
 * Tuân thủ các nguyên tắc:
 * - Pure TypeScript không phụ thuộc framework UI hay Canvas.
 * - Deterministic, hỗ trợ snapshot và replay không có độ trôi.
 * - BR-E035-01: Chế độ soạn cấm chấm điểm và cấm gợi ý đúng sai trước khi chạy.
 * - BR-E035-02: Chứng minh có lời giải hợp lệ trong trần lệnh <= 8.
 * - BR-E035-03: Thực thi từng bước với feedback dừng rõ ràng.
 * - BR-E035-04: Cấm lồng loop trong loop.
 */

export type CommandType = "forward" | "turn_left" | "turn_right" | "loop";

export type FacingDirection = "up" | "right" | "down" | "left";

export interface GridCoord {
  col: number;
  row: number;
}

export interface RobotState extends GridCoord {
  facing: FacingDirection;
}

export interface CollectibleItem extends GridCoord {
  id: string;
}

export interface CommandItem {
  type: CommandType;
  count?: number; // Cho lệnh loop (mặc định 2)
}

export interface ExecutionStepLog {
  stepIndex: number;
  command: CommandType;
  fromState: RobotState;
  toState: RobotState;
  collectedId?: string;
}

export interface ExecutionResult {
  success: boolean;
  finalState: RobotState;
  steps: ExecutionStepLog[];
  collectedIds: string[];
  failedAtStep?: number;
  failureReason?:
    | "out_of_bounds"
    | "obstacle_collision"
    | "not_at_goal"
    | "missing_collectibles"
    | "nested_loop_error";
}

export interface CommandQueueConfig {
  rows: number;
  cols: number;
  start: RobotState;
  goal: GridCoord;
  obstacles?: GridCoord[];
  collectibles?: CollectibleItem[];
  maxCommands?: number;
}

export const MAX_CODE_COMMANDS = 8;
const FACING_ORDER: readonly FacingDirection[] = [
  "up",
  "right",
  "down",
  "left",
];

export function turnDirection(
  current: FacingDirection,
  turn: "turn_left" | "turn_right"
): FacingDirection {
  const currentIndex = FACING_ORDER.indexOf(current);
  if (turn === "turn_right") {
    return FACING_ORDER[(currentIndex + 1) % 4] ?? "up";
  }
  return FACING_ORDER[(currentIndex + 3) % 4] ?? "up";
}

export function moveForward(state: RobotState): GridCoord {
  switch (state.facing) {
    case "up":
      return { col: state.col, row: state.row - 1 };
    case "right":
      return { col: state.col + 1, row: state.row };
    case "down":
      return { col: state.col, row: state.row + 1 };
    default:
      return { col: state.col - 1, row: state.row };
  }
}

function processLoopCommand(
  cmd: CommandItem,
  result: CommandType[],
  prevIsLoop: boolean
): { error?: string } {
  if (prevIsLoop) {
    return { error: "BR-E035-04: Cấm lồng hoặc liên tiếp lệnh loop" };
  }
  if (result.length === 0) {
    return {
      error: "Lệnh loop phải có ít nhất một lệnh đứng trước để lặp lại",
    };
  }

  const targetCmd = result.at(-1);
  if (!targetCmd) {
    return { error: "Lệnh lặp không hợp lệ" };
  }

  const repeatCount = Math.max(1, (cmd.count ?? 2) - 1);
  for (let r = 0; r < repeatCount; r++) {
    result.push(targetCmd);
  }
  return {};
}

/**
 * Mở rộng chuỗi lệnh phẳng từ mảng lệnh chứa loop.
 * BR-E035-04: Cấm lồng loop trong loop.
 */
export function expandCommands(commands: readonly CommandItem[]): {
  expanded: CommandType[];
  error?: string;
} {
  const result: CommandType[] = [];
  let prevIsLoop = false;

  for (const cmd of commands) {
    if (!cmd) {
      continue;
    }

    if (cmd.type === "loop") {
      const { error } = processLoopCommand(cmd, result, prevIsLoop);
      if (error) {
        return { expanded: [], error };
      }
      prevIsLoop = true;
    } else {
      result.push(cmd.type);
      prevIsLoop = false;
    }
  }

  return { expanded: result };
}

function executeForwardStep(
  currentState: RobotState,
  cmdType: CommandType,
  stepIndex: number,
  config: CommandQueueConfig,
  obstacleSet: Set<string>,
  collectibleMap: Map<string, string>,
  collectedIds: Set<string>
): {
  errorResult?: ExecutionResult;
  nextState: RobotState;
  stepLog?: ExecutionStepLog;
} {
  const nextPos = moveForward(currentState);

  if (
    nextPos.col < 0 ||
    nextPos.col >= config.cols ||
    nextPos.row < 0 ||
    nextPos.row >= config.rows
  ) {
    return {
      errorResult: {
        success: false,
        finalState: currentState,
        steps: [],
        collectedIds: Array.from(collectedIds),
        failedAtStep: stepIndex,
        failureReason: "out_of_bounds",
      },
      nextState: currentState,
    };
  }

  if (obstacleSet.has(`${nextPos.col},${nextPos.row}`)) {
    return {
      errorResult: {
        success: false,
        finalState: currentState,
        steps: [],
        collectedIds: Array.from(collectedIds),
        failedAtStep: stepIndex,
        failureReason: "obstacle_collision",
      },
      nextState: currentState,
    };
  }

  const nextState: RobotState = {
    col: nextPos.col,
    row: nextPos.row,
    facing: currentState.facing,
  };

  const collected = collectibleMap.get(`${nextState.col},${nextState.row}`);
  if (collected) {
    collectedIds.add(collected);
  }

  const stepLog: ExecutionStepLog = {
    stepIndex,
    command: cmdType,
    fromState: { ...currentState },
    toState: nextState,
    collectedId: collected,
  };

  return { nextState, stepLog };
}

function checkFinalProgramOutcome(
  currentState: RobotState,
  goal: GridCoord,
  collectedIds: Set<string>,
  collectibleCount: number,
  steps: ExecutionStepLog[]
): ExecutionResult {
  const atGoal = currentState.col === goal.col && currentState.row === goal.row;
  const allCollected = collectedIds.size === collectibleCount;

  if (!allCollected) {
    return {
      success: false,
      finalState: currentState,
      steps,
      collectedIds: Array.from(collectedIds),
      failureReason: "missing_collectibles",
    };
  }

  if (!atGoal) {
    return {
      success: false,
      finalState: currentState,
      steps,
      collectedIds: Array.from(collectedIds),
      failureReason: "not_at_goal",
    };
  }

  return {
    success: true,
    finalState: currentState,
    steps,
    collectedIds: Array.from(collectedIds),
  };
}

/**
 * Trình chạy chương trình lệnh robot đơn nhất dùng chung giữa Runtime Session,
 * Refine Validator và Level Generator (BR-E035-02).
 */
function runCommandLoop(
  expanded: readonly CommandType[],
  initialState: RobotState,
  config: CommandQueueConfig,
  obstacleSet: Set<string>,
  collectibleMap: Map<string, string>,
  collectedIds: Set<string>
): {
  finalState: RobotState;
  steps: ExecutionStepLog[];
  earlyError?: ExecutionResult;
} {
  let currentState: RobotState = { ...initialState };
  const steps: ExecutionStepLog[] = [];

  for (let i = 0; i < expanded.length; i++) {
    const cmdType = expanded[i];
    if (!cmdType) {
      continue;
    }
    const fromState = { ...currentState };

    if (cmdType === "turn_left" || cmdType === "turn_right") {
      const nextFacing = turnDirection(currentState.facing, cmdType);
      currentState = { ...currentState, facing: nextFacing };
      steps.push({
        stepIndex: i,
        command: cmdType,
        fromState,
        toState: currentState,
      });
    } else if (cmdType === "forward") {
      const { errorResult, nextState, stepLog } = executeForwardStep(
        currentState,
        cmdType,
        i,
        config,
        obstacleSet,
        collectibleMap,
        collectedIds
      );

      if (errorResult) {
        return {
          finalState: currentState,
          steps,
          earlyError: {
            ...errorResult,
            steps,
          },
        };
      }

      currentState = nextState;
      if (stepLog) {
        steps.push(stepLog);
      }
    }
  }

  return { finalState: currentState, steps };
}

/**
 * Trình chạy chương trình lệnh robot đơn nhất dùng chung giữa Runtime Session,
 * Refine Validator và Level Generator (BR-E035-02).
 */
export function executeProgram(
  config: CommandQueueConfig,
  commands: readonly CommandItem[]
): ExecutionResult {
  const { start, goal, obstacles = [], collectibles = [] } = config;

  const { expanded, error } = expandCommands(commands);
  if (error) {
    return {
      success: false,
      finalState: start,
      steps: [],
      collectedIds: [],
      failureReason: "nested_loop_error",
    };
  }

  const collectedIds = new Set<string>();
  const obstacleSet = new Set(obstacles.map((o) => `${o.col},${o.row}`));
  const collectibleMap = new Map(
    collectibles.map((c) => [`${c.col},${c.row}`, c.id])
  );

  const startItem = collectibleMap.get(`${start.col},${start.row}`);
  if (startItem) {
    collectedIds.add(startItem);
  }

  const { finalState, steps, earlyError } = runCommandLoop(
    expanded,
    start,
    config,
    obstacleSet,
    collectibleMap,
    collectedIds
  );

  if (earlyError) {
    return earlyError;
  }

  return checkFinalProgramOutcome(
    finalState,
    goal,
    collectedIds,
    collectibles.length,
    steps
  );
}

function pushNextBranchCommands(
  current: CommandItem[],
  basicCommands: readonly CommandType[],
  canLoop: boolean,
  queue: CommandItem[][]
): void {
  for (const cmd of basicCommands) {
    queue.push([...current, { type: cmd }]);
  }

  if (canLoop && current.length > 0) {
    const lastCmd = current.at(-1);
    if (lastCmd && lastCmd.type !== "loop") {
      queue.push([...current, { type: "loop", count: 2 }]);
    }
  }
}

/**
 * Trình giải duyệt BFS tìm chuỗi lệnh ngắn nhất thoả mãn điều kiện.
 */
export function findShortestSolution(
  config: CommandQueueConfig,
  allowedCommands: readonly CommandType[] = [
    "forward",
    "turn_left",
    "turn_right",
    "loop",
  ]
): readonly CommandItem[] | null {
  const maxCommands = config.maxCommands ?? MAX_CODE_COMMANDS;
  const queue: CommandItem[][] = [[]];

  const canLoop = allowedCommands.includes("loop");
  const basicCommands: CommandType[] = allowedCommands.filter(
    (c) => c !== "loop"
  );

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      break;
    }

    if (current.length > 0) {
      const res = executeProgram(config, current);
      if (res.success) {
        return current;
      }
    }

    if (current.length >= maxCommands) {
      continue;
    }

    pushNextBranchCommands(current, basicCommands, canLoop, queue);
  }

  return null;
}

/**
 * Hệ thống quản lý hàng lệnh cho Game Session.
 * BR-E035-01: Chế độ soạn cấm chấm điểm và cấm gợi ý đúng sai.
 */
export class CommandQueueSystem {
  private commands: CommandItem[] = [];
  private readonly config: CommandQueueConfig;
  private readonly maxCommands: number;

  constructor(config: CommandQueueConfig) {
    this.config = config;
    this.maxCommands = Math.min(
      config.maxCommands ?? MAX_CODE_COMMANDS,
      MAX_CODE_COMMANDS
    );
  }

  get commandCount(): number {
    return this.commands.length;
  }

  get queue(): readonly CommandItem[] {
    return this.commands;
  }

  get isFull(): boolean {
    return this.commands.length >= this.maxCommands;
  }

  addCommand(command: CommandItem): boolean {
    if (this.isFull) {
      return false;
    }

    if (command.type === "loop") {
      if (this.commands.length === 0) {
        return false;
      }
      const last = this.commands.at(-1);
      if (last?.type === "loop") {
        return false;
      }
    }

    this.commands.push(command);
    return true;
  }

  removeCommand(index: number): CommandItem | null {
    if (index < 0 || index >= this.commands.length) {
      return null;
    }
    const [removed] = this.commands.splice(index, 1);
    return removed ?? null;
  }

  clear(): void {
    this.commands = [];
  }

  run(): ExecutionResult {
    return executeProgram(this.config, this.commands);
  }
}
