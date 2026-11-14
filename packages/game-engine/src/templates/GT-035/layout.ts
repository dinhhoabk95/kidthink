import type { AgeBand } from "#src/contracts/types";
import type { HintDemoStep, HintLevel, HintTarget } from "#src/game-session";
import type { EngineView, ViewEntity } from "#src/interaction";
import { resolveAssetSpeech } from "#src/labels/spoken-keyword";
import type { LogicSpace } from "#src/layout/constants";
import {
  computeStageGroupsLayout,
  resolveStageRect,
  STAGE_LABEL_ROW_PX,
} from "#src/layout/stage-groups";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import { alpha } from "#src/render/color-utils";
import {
  drawGT035CommandCard,
  drawGT035GridCell,
  drawGT035MapBoard,
  type GT035CommandCardParams,
  type GT035MapBoardParams,
  withGT035StageClip,
} from "#src/render/gt-035-shapes";
import {
  drawProgressDots,
  drawSceneBackground,
  getColorsForState,
} from "#src/render/index.js";
import {
  absoluteFacing,
  type CommandItem,
  type CommandQueueConfig,
  type CommandQueueSystem,
  type CommandType,
  type ExecutionResult,
  executeProgram,
  expandCommands,
  type RobotState,
} from "#src/systems/command-queue-system";
import type { DegradationState } from "#src/systems/degradation";
import { designTokens } from "#src/systems/designTokens";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import type { GT035Collectible, GT035Content } from "./template.js";

export const GT035_STEP_MS = 600;
export const GT035_DEMO_STEPS = 3;
type Canvas2D = CanvasRenderingContext2D;
type ExecutionStep = ExecutionResult["steps"][number];

export interface GT035Clock {
  activeHintLevel: HintLevel | 0;
  hoveredEntityId: string | null;
  simMs: number;
  winStampSimMs: number | null;
}

const CLOCKS = new WeakMap<object, GT035Clock>();

export function getGT035Clock(key: object): GT035Clock {
  let c = CLOCKS.get(key);
  if (!c) {
    c = {
      simMs: 0,
      hoveredEntityId: null,
      activeHintLevel: 0,
      winStampSimMs: null,
    };
    CLOCKS.set(key, c);
  }
  return c;
}
export const peekGT035Clock = (key: object): GT035Clock | undefined =>
  CLOCKS.get(key);
export const deleteGT035Clock = (key: object): void => {
  CLOCKS.delete(key);
};
export function resetGT035Clock(key: object): void {
  const c = getGT035Clock(key);
  c.hoveredEntityId = null;
  c.activeHintLevel = 0;
  c.winStampSimMs = null;
}

export interface GT035LayoutHost {
  readonly activeExecutingStep: number | null;
  readonly activePaletteCommands: readonly CommandType[];
  readonly cachedShortestSolution: readonly CommandItem[] | null;
  readonly collectedItemIds: readonly string[];
  readonly collectibleMap: ReadonlyMap<string, GT035Collectible>;
  readonly content: GT035Content;
  readonly cssPerLogic: number;
  readonly degradation: DegradationState | null;
  readonly execClockMs: number;
  readonly execCursor: number;
  readonly execPhase: "running" | "bump";
  readonly execSteps: readonly ExecutionStep[];
  readonly isExecuting: boolean;
  readonly isWin: boolean;
  readonly isWon: boolean;
  readonly logicSpace: LogicSpace;
  readonly maxCommands: number;
  readonly obstacleSet: ReadonlySet<string>;
  readonly particles: readonly Particle[];
  readonly queueConfig: CommandQueueConfig;
  readonly queueSystem: CommandQueueSystem;
  readonly robotState: RobotState;
  readonly roundClosedOnWrong: boolean;
  readonly slots: readonly Slot[];
  readonly stageRect: ZoneRect | undefined;
  readonly themeId: string | undefined;
}

const COMMAND_SPOKEN: Record<CommandType, string> = {
  forward: "Tiến",
  turn_left: "Xoay trái",
  turn_right: "Xoay phải",
  loop: "Lặp 2x",
  go_up: "Đi lên",
  go_right: "Đi sang phải",
  go_down: "Đi xuống",
  go_left: "Đi sang trái",
};
const COMMAND_ICONS: Record<CommandType, string> = {
  forward: "⬆️",
  turn_left: "↩️",
  turn_right: "↪️",
  loop: "🔁",
  go_up: "⬆️",
  go_right: "➡️",
  go_down: "⬇️",
  go_left: "⬅️",
};
const DEFAULT_GOAL_ASSET = { kind: "emoji", ref: "⭐" } as const;
const FACING_VI: Record<RobotState["facing"], string> = {
  up: "lên trên",
  right: "sang phải",
  down: "xuống dưới",
  left: "sang trái",
};
const FACING_ARROWS: Record<RobotState["facing"], string> = {
  up: "↑",
  right: "→",
  down: "↓",
  left: "←",
};

function toCircleViewEntity(
  slot: Slot,
  slotIndex: number,
  info: Omit<
    ViewEntity,
    "slotIndex" | "x" | "y" | "w" | "h" | "hitShape" | "hitW" | "hitH"
  >
): ViewEntity {
  return {
    ...info,
    slotIndex,
    x: slot.x,
    y: slot.y,
    w: slot.w,
    h: slot.h,
    hitW: slot.hitW,
    hitH: slot.hitH,
    hitShape: "circle",
  };
}

export function computeGT035Slots(
  logicSpace: LogicSpace,
  band: AgeBand,
  stageRect: ZoneRect | undefined,
  cssPerLogic: number,
  content: GT035Content,
  maxCommands: number,
  paletteLength: number
): readonly Slot[] {
  const { rows, cols } = content.grid;
  return computeStageGroupsLayout({
    stage: resolveStageRect(logicSpace, band, stageRect),
    ageBand: band,
    cssPerLogic,
    groups: [
      { count: rows * cols, role: "target", cols, hasLabels: true },
      { count: maxCommands, role: "target" },
      { count: paletteLength, role: "source" },
    ],
  });
}

export function getDisplayFacing(host: GT035LayoutHost): RobotState["facing"] {
  if (host.isExecuting || host.queueSystem.commandCount === 0) {
    return host.robotState.facing;
  }
  const order: RobotState["facing"][] = ["up", "right", "down", "left"];
  let idx = order.indexOf(host.content.start.facing);
  for (const cmd of expandCommands(host.queueSystem.queue).expanded) {
    const abs = absoluteFacing(cmd);
    if (abs !== null) {
      idx = order.indexOf(abs);
    } else if (cmd === "turn_right") {
      idx = (idx + 1) % 4;
    } else if (cmd === "turn_left") {
      idx = (idx + 3) % 4;
    }
  }
  return order[idx] ?? host.robotState.facing;
}

function findMismatchIndex(host: GT035LayoutHost): number {
  const sol = host.cachedShortestSolution;
  if (!sol) {
    return -1;
  }
  return host.queueSystem.queue.findIndex((c, i) => {
    const w = sol[i];
    return !w || w.type !== c.type || (w.count ?? 2) !== (c.count ?? 2);
  });
}

export function resolveGT035HintTargetIndex(
  host: GT035LayoutHost
): number | null {
  if (host.isWin || host.isWon || host.isExecuting || host.roundClosedOnWrong) {
    return null;
  }
  const { rows, cols } = host.content.grid;
  const mismatchIdx = findMismatchIndex(host);
  if (mismatchIdx >= 0) {
    return rows * cols + mismatchIdx;
  }
  const nextCmd =
    host.cachedShortestSolution?.[host.queueSystem.commandCount]?.type;
  const palIdx = nextCmd ? host.activePaletteCommands.indexOf(nextCmd) : -1;
  return palIdx >= 0 ? rows * cols + host.maxCommands + palIdx : null;
}

export function resolveNextHintCellIndex(host: GT035LayoutHost): number | null {
  if (
    resolveGT035HintTargetIndex(host) === null ||
    !host.cachedShortestSolution
  ) {
    return null;
  }
  const sol = host.cachedShortestSolution;
  const mismatchIdx = findMismatchIndex(host);
  const count = mismatchIdx >= 0 ? mismatchIdx : host.queueSystem.commandCount;
  const here = executeProgram(host.queueConfig, sol.slice(0, count)).finalState;
  for (let n = count + 1; n <= sol.length; n++) {
    const there = executeProgram(host.queueConfig, sol.slice(0, n)).finalState;
    if (there.col !== here.col || there.row !== here.row) {
      return there.row * host.content.grid.cols + there.col;
    }
  }
  return null;
}

export function resolveGT035HintDestinationIndex(
  host: GT035LayoutHost
): number | null {
  const targetIdx = resolveGT035HintTargetIndex(host);
  const { rows, cols } = host.content.grid;
  if (targetIdx === null || targetIdx < rows * cols + host.maxCommands) {
    return null;
  }
  const count = host.queueSystem.commandCount;
  return count < host.maxCommands ? rows * cols + count : null;
}

export function resolveGT035HintTargetForLevel(
  host: GT035LayoutHost,
  level: HintLevel
): HintTarget | null {
  const index = resolveGT035HintTargetIndex(host);
  if (index === null) {
    return null;
  }
  if (level === 1) {
    const cell = resolveNextHintCellIndex(host);
    return cell === null
      ? null
      : { kind: "region", ids: [`grid_cell_${cell}`] };
  }
  if (level === 2) {
    return { kind: "slot", index };
  }
  const toIndex = resolveGT035HintDestinationIndex(host);
  return toIndex === null
    ? { kind: "slot", index }
    : { kind: "slot", index, toIndex };
}

export function resolveGT035HintDemoSequence(
  host: GT035LayoutHost,
  level: HintLevel
): readonly HintDemoStep[] | null {
  if (level !== 3 || resolveGT035HintTargetIndex(host) === null) {
    return null;
  }
  const sol = host.cachedShortestSolution;
  const prefixMatch =
    sol?.length !== undefined &&
    host.queueSystem.queue.every((c, i) => {
      const w = sol[i];
      return (
        w !== undefined &&
        w.type === c.type &&
        (w.count ?? 2) === (c.count ?? 2)
      );
    });
  if (!(sol && prefixMatch)) {
    return null;
  }
  const { rows, cols } = host.content.grid;
  const count = host.queueSystem.commandCount;
  const last = Math.min(sol.length, host.maxCommands, count + GT035_DEMO_STEPS);
  const steps: HintDemoStep[] = [];
  for (let n = count; n < last; n++) {
    const type = sol[n]?.type;
    const palIdx = type ? host.activePaletteCommands.indexOf(type) : -1;
    if (palIdx < 0) {
      break;
    }
    steps.push({
      from: rows * cols + host.maxCommands + palIdx,
      to: rows * cols + n,
    });
  }
  return steps.length > 0 ? steps : null;
}

function describeGridCell(
  host: GT035LayoutHost,
  col: number,
  row: number
): Pick<ViewEntity, "glyph" | "spokenLabel"> {
  const pos = `Ô hàng ${row + 1} cột ${col + 1}`;
  if (host.robotState.col === col && host.robotState.row === row) {
    return {
      glyph: "🤖",
      spokenLabel: `${pos}: Robot đang hướng ${FACING_VI[getDisplayFacing(host)]}`,
    };
  }
  if (host.content.goal.col === col && host.content.goal.row === row) {
    const { glyph } = resolveAssetSpeech(
      host.content.goal.asset ?? DEFAULT_GOAL_ASSET
    );
    return { glyph, spokenLabel: `${pos}: Đích đến` };
  }
  const key = `${col},${row}`;
  if (host.obstacleSet.has(key)) {
    return { glyph: "🪨", spokenLabel: `${pos}: Vật cản` };
  }
  const cand = host.collectibleMap.get(key);
  if (cand && !host.collectedItemIds.includes(cand.id)) {
    const { glyph, spokenLabel = "Vật phẩm" } = resolveAssetSpeech(cand.asset);
    return { glyph, spokenLabel: `${pos}: ${spokenLabel}` };
  }
  return { spokenLabel: `${pos} đang trống` };
}

function queueEntityState(
  host: GT035LayoutHost,
  i: number,
  hasCmd: boolean,
  hovered: string | null
): ViewEntity["state"] {
  if (host.isWin && hasCmd) {
    return "correct";
  }
  if (host.activeExecutingStep === i) {
    return host.execPhase === "bump" ? "incorrect" : "active";
  }
  if (hovered === `queue_${i}`) {
    return "active";
  }
  return hasCmd ? "selected" : "idle";
}

function appendQueueEntities(
  host: GT035LayoutHost,
  entities: ViewEntity[],
  gridCount: number,
  hovered: string | null
): void {
  for (let i = 0; i < host.maxCommands; i++) {
    const s = host.slots[gridCount + i];
    if (!s) {
      continue;
    }
    const cmd = host.queueSystem.queue[i];
    const spoken = cmd ? COMMAND_SPOKEN[cmd.type] : undefined;
    entities.push(
      toCircleViewEntity(s, gridCount + i, {
        id: `queue_${i}`,
        role: "target",
        state: queueEntityState(host, i, Boolean(cmd), hovered),
        glyph: cmd ? COMMAND_ICONS[cmd.type] : undefined,
        label: spoken ? undefined : `${i + 1}`,
        spokenLabel: spoken
          ? `Bước ${i + 1}: ${spoken}`
          : `Ô lệnh số ${i + 1} đang trống`,
      })
    );
  }
}

export function buildGT035View(
  host: GT035LayoutHost,
  clock: GT035Clock | undefined,
  focusIndex: number | undefined
): EngineView {
  const entities: ViewEntity[] = [];
  const { rows, cols } = host.content.grid;
  const gridCount = rows * cols;
  const hovered = clock?.hoveredEntityId ?? null;
  for (let i = 0; i < gridCount; i++) {
    const s = host.slots[i];
    if (s) {
      entities.push(
        toCircleViewEntity(s, i, {
          id: `grid_cell_${i}`,
          role: "neutral",
          state: "idle",
          ...describeGridCell(host, i % cols, Math.floor(i / cols)),
        })
      );
    }
  }
  appendQueueEntities(host, entities, gridCount, hovered);
  const palStart = gridCount + host.maxCommands;
  for (let p = 0; p < host.activePaletteCommands.length; p++) {
    const s = host.slots[palStart + p];
    const cmd = host.activePaletteCommands[p];
    if (s && cmd) {
      entities.push(
        toCircleViewEntity(s, palStart + p, {
          id: `pal_${cmd}`,
          role: "source",
          state: hovered === `pal_${cmd}` ? "active" : "idle",
          glyph: COMMAND_ICONS[cmd],
          spokenLabel: `Lệnh ${COMMAND_SPOKEN[cmd]}`,
        })
      );
    }
  }
  return { activePrompt: host.content.prompt, entities, focusIndex };
}

function walkedCells(host: GT035LayoutHost): ReadonlySet<string> {
  const cells = new Set<string>();
  if (!(host.isExecuting || host.isWin)) {
    return cells;
  }
  cells.add(`${host.content.start.col},${host.content.start.row}`);
  for (const step of host.execSteps.slice(0, host.execCursor)) {
    cells.add(`${step.toState.col},${step.toState.row}`);
  }
  return cells;
}

function gridLabel(host: GT035LayoutHost, text: string): string | undefined {
  const { rows, cols } = host.content.grid;
  const [first, below] = [host.slots[0], host.slots[cols]];
  if (rows < 2 || !(first && below)) {
    return text;
  }
  return below.y - first.y - first.h >= STAGE_LABEL_ROW_PX ? text : undefined;
}

function computeBoardAndRails(
  gridSlots: readonly Slot[],
  queueSlots: readonly Slot[],
  cols: number,
  cmdCount: number,
  zone: ZoneRect
): Omit<GT035MapBoardParams, "softShadowsEnabled"> {
  let [x0, y0, x1, y1] = [zone.x + zone.w, zone.y + zone.h, zone.x, zone.y];
  for (const s of gridSlots) {
    x0 = Math.min(x0, s.x - s.w / 2 - 8);
    y0 = Math.min(y0, s.y - s.h / 2 - 8);
    x1 = Math.max(x1, s.x + s.w / 2 + 8);
    y1 = Math.max(y1, s.y + s.h / 2 + 8);
  }
  const bx = Math.max(zone.x + 2, x0);
  const by = Math.max(zone.y + 2, y0);
  const bw = Math.max(40, Math.min(x1 - bx, zone.x + zone.w - 2 - bx));
  const bh = Math.max(40, Math.min(y1 - by, zone.y + zone.h - 2 - by));
  const gridLines: (readonly [number, number, number, number])[] = [];
  for (let i = 0; i < gridSlots.length; i++) {
    const s = gridSlots[i];
    if (!s) {
      continue;
    }
    const right = i % cols < cols - 1 ? gridSlots[i + 1] : undefined;
    const down = gridSlots[i + cols];
    if (right) {
      gridLines.push([s.x, s.y, right.x, right.y]);
    }
    if (down) {
      gridLines.push([s.x, s.y, down.x, down.y]);
    }
  }
  const railSegments: {
    readonly line: readonly [number, number, number, number];
    readonly active: boolean;
  }[] = [];
  for (let i = 0; i < queueSlots.length - 1; i++) {
    const [a, b] = [queueSlots[i], queueSlots[i + 1]];
    if (a && b && Math.abs(a.y - b.y) <= a.h * 0.5) {
      railSegments.push({ line: [a.x, a.y, b.x, b.y], active: i < cmdCount });
    }
  }
  return { boardRect: { x: bx, y: by, w: bw, h: bh }, gridLines, railSegments };
}

function resolveGridCellKind(
  host: GT035LayoutHost,
  col: number,
  row: number
): {
  readonly kind: "empty" | "robot" | "goal" | "obstacle" | "collectible";
  readonly asset: GT035Content["goal"]["asset"];
} {
  if (host.robotState.col === col && host.robotState.row === row) {
    return { kind: "robot", asset: undefined };
  }
  if (host.content.goal.col === col && host.content.goal.row === row) {
    return {
      kind: "goal",
      asset: host.content.goal.asset ?? DEFAULT_GOAL_ASSET,
    };
  }
  const key = `${col},${row}`;
  if (host.obstacleSet.has(key)) {
    return { kind: "obstacle", asset: { kind: "emoji", ref: "🪨" } };
  }
  const cand = host.collectibleMap.get(key);
  if (cand && !host.collectedItemIds.includes(cand.id)) {
    return { kind: "collectible", asset: cand.asset };
  }
  return { kind: "empty", asset: undefined };
}

interface GT035Pass {
  readonly clock: GT035Clock | undefined;
  readonly hintCellIdx: number | null;
  readonly hintLevel: HintLevel | 0;
  readonly hintSlotIdx: number | null;
  readonly lampGlow: number;
  readonly pulsePhase: number;
  readonly stageZone: ZoneRect;
  readonly trail: ReadonlySet<string>;
  readonly winElapsed: number;
}

function resolveQueueCardStyle(
  host: GT035LayoutHost,
  rs: RenderSystem,
  pass: GT035Pass,
  i: number,
  hasCmd: boolean,
  hovered: string | null
): Pick<GT035CommandCardParams, "fill" | "border" | "ringColor" | "liftY"> {
  const base = getColorsForState(hasCmd ? "selected" : "idle");
  if (host.isWin && hasCmd) {
    const sem = designTokens.colors.semantic.success;
    const wave = !rs.reducedMotion && Math.floor(pass.winElapsed / 180) === i;
    return {
      fill: sem[100],
      border: sem[500],
      ringColor: wave ? sem[500] : undefined,
      liftY: 0,
    };
  }
  if (host.activeExecutingStep === i) {
    const bumped = host.execPhase === "bump";
    const border = bumped
      ? designTokens.colors.retry[500]
      : designTokens.colors.montessori.amber;
    return {
      fill: bumped
        ? designTokens.colors.retry[100]
        : designTokens.colors.montessori.amberLight,
      border,
      ringColor: border,
      liftY: bumped ? 0 : -2,
    };
  }
  if (hovered === `queue_${i}`) {
    return {
      fill: base.fill,
      border: base.border,
      ringColor: base.border,
      liftY: -2,
    };
  }
  return { fill: base.fill, border: base.border, liftY: 0 };
}

function renderGridCells(
  host: GT035LayoutHost,
  ctx: Canvas2D,
  rs: RenderSystem,
  pass: GT035Pass
): void {
  const { rows, cols } = host.content.grid;
  const amber = designTokens.colors.montessori.amber;
  for (let idx = 0; idx < rows * cols; idx++) {
    const slot = host.slots[idx];
    if (!slot) {
      continue;
    }
    const [c, r] = [idx % cols, Math.floor(idx / cols)];
    const { kind, asset } = resolveGridCellKind(host, c, r);
    const facing = kind === "robot" ? getDisplayFacing(host) : undefined;
    drawGT035GridCell(ctx, rs, {
      slot,
      kind,
      asset,
      facing,
      cellLabel: facing ? gridLabel(host, FACING_ARROWS[facing]) : undefined,
      lampGlow: pass.lampGlow,
      isWalked: pass.trail.has(`${c},${r}`),
      hintColor:
        pass.hintCellIdx === idx
          ? alpha(amber, 0.5 + 0.45 * pass.pulsePhase)
          : undefined,
      stageZone: pass.stageZone,
    });
  }
}

function renderPaletteCards(
  host: GT035LayoutHost,
  ctx: Canvas2D,
  rs: RenderSystem,
  pass: GT035Pass,
  palStart: number
): void {
  const hovered = pass.clock?.hoveredEntityId ?? null;
  const amber = designTokens.colors.montessori.amber;
  const base = getColorsForState("idle");
  for (let p = 0; p < host.activePaletteCommands.length; p++) {
    const slot = host.slots[palStart + p];
    const cmd = host.activePaletteCommands[p];
    if (!(slot && cmd)) {
      continue;
    }
    const isHov = hovered === `pal_${cmd}`;
    const isHint = pass.hintLevel >= 2 && pass.hintSlotIdx === palStart + p;
    drawGT035CommandCard(ctx, rs, {
      slot,
      index: p,
      command: cmd,
      fill: base.fill,
      border: base.border,
      ringColor: isHov ? base.border : undefined,
      liftY: isHov ? -2 : 0,
      fontPx: 16,
      hintColor: isHint
        ? alpha(amber, 0.55 + 0.4 * pass.pulsePhase)
        : undefined,
      stageZone: pass.stageZone,
    });
  }
}

function renderCards(
  host: GT035LayoutHost,
  ctx: Canvas2D,
  rs: RenderSystem,
  pass: GT035Pass
): void {
  const { rows, cols } = host.content.grid;
  const gridCount = rows * cols;
  const hovered = pass.clock?.hoveredEntityId ?? null;
  const emerald = designTokens.colors.montessori.emerald;
  for (let i = 0; i < host.maxCommands; i++) {
    const slot = host.slots[gridCount + i];
    if (!slot) {
      continue;
    }
    const cmd = host.queueSystem.queue[i];
    const isHint = pass.hintLevel >= 3 && i === host.queueSystem.commandCount;
    drawGT035CommandCard(ctx, rs, {
      slot,
      index: i,
      command: cmd?.type,
      ghostCommand:
        host.roundClosedOnWrong && !cmd
          ? host.cachedShortestSolution?.[i]?.type
          : undefined,
      ...resolveQueueCardStyle(host, rs, pass, i, Boolean(cmd), hovered),
      fontPx: Math.min(
        slot.h * 0.56,
        Math.max(18, Math.ceil(16 / Math.max(0.4, host.cssPerLogic)))
      ),
      hintColor: isHint
        ? alpha(emerald, 0.55 + 0.4 * pass.pulsePhase)
        : undefined,
      hintDashed: isHint,
      stageZone: pass.stageZone,
    });
  }
  renderPaletteCards(host, ctx, rs, pass, gridCount + host.maxCommands);
}

export function renderGT035Scene(
  host: GT035LayoutHost,
  ctx: Canvas2D,
  rs: RenderSystem,
  timeMs: number,
  clock: GT035Clock | undefined
): void {
  drawSceneBackground(ctx, rs, host.themeId);
  if (!host.stageRect) {
    drawProgressDots(ctx, rs, {
      done: host.queueSystem.commandCount,
      total: host.maxCommands,
    });
  }
  const stageZone = resolveStageRect(host.logicSpace, "5-6", host.stageRect);
  const { rows, cols } = host.content.grid;
  const gridCount = rows * cols;
  const hintLevel = clock?.activeHintLevel ?? 0;
  const winStampSimMs = clock?.winStampSimMs ?? null;
  const pass: GT035Pass = {
    clock,
    pulsePhase: rs.reducedMotion ? 0.5 : 0.5 + 0.5 * Math.sin(timeMs / 240),
    trail: walkedCells(host),
    lampGlow:
      !rs.reducedMotion &&
      host.isExecuting &&
      host.execPhase === "running" &&
      host.execClockMs < GT035_STEP_MS / 2
        ? 1
        : 0,
    hintLevel,
    hintCellIdx: hintLevel === 1 ? resolveNextHintCellIndex(host) : null,
    hintSlotIdx: hintLevel >= 2 ? resolveGT035HintTargetIndex(host) : null,
    stageZone,
    winElapsed:
      winStampSimMs != null && clock
        ? Math.max(0, clock.simMs - winStampSimMs)
        : 0,
  };
  withGT035StageClip(ctx, stageZone, () => {
    const chrome = computeBoardAndRails(
      host.slots.slice(0, gridCount),
      host.slots.slice(gridCount, gridCount + host.maxCommands),
      cols,
      host.queueSystem.commandCount,
      stageZone
    );
    drawGT035MapBoard(ctx, {
      ...chrome,
      softShadowsEnabled: host.degradation?.soft_shadows_enabled !== false,
    });
    renderGridCells(host, ctx, rs, pass);
    renderCards(host, ctx, rs, pass);
  });
  if (
    host.particles.length > 0 &&
    host.degradation?.particles_enabled !== false
  ) {
    rs.drawParticles(ctx, [...host.particles]);
  }
}
