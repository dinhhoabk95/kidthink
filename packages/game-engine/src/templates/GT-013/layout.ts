import type { AgeBand } from "#src/contracts/types";
import type { GameActionValue } from "#src/game-session";
import type { EngineView, ViewEntity } from "#src/interaction";
import type { LogicSpace } from "#src/layout/constants";
import { resolveExactGridLayout } from "#src/layout/registry";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import type { SceneBox } from "#src/render/index.js";
import { deriveStream } from "#src/rng/mulberry32";
import type { DegradationState } from "#src/systems/degradation";
import {
  canMove,
  cellKey,
  cellTowards,
  findRouteThrough,
  isJunction,
  type MazeCell,
  type MazeGrid,
  type MazeSide,
} from "#src/systems/maze-system";
import type { GT013Content } from "./template.js";

export const TOUCH_PULSE_MS = 180;
export const BLOCKED_FLASH_MS = 400;
export const STEP_POP_MS = 260;
export const WIN_HALO_MS = 600;
export const MISSING_REQ_PULSE_MS = 900;
export const ARROW_GLYPHS: Record<MazeSide, string> = {
  n: "⬆️",
  e: "➡️",
  s: "⬇️",
  w: "⬅️",
};
const ALL_SIDES: readonly MazeSide[] = ["n", "e", "s", "w"];

export interface GT013Clock {
  logicMs: number;
  stepAtMs: number;
  backtrackAtMs: number;
  blockedCell: MazeCell | null;
  blockedWallSide: MazeSide | null;
  blockedAtMs: number;
  missingRequiredUntilMs: number;
  submitRetryUntilMs: number;
  winAtMs: number;
  closeAtMs: number;
  touchingSlotIndex: number | null;
  touchingUntilMs: number;
  hoveredSlotIndex: number | null;
  activeHintLevel: 0 | 1 | 2 | 3;
}

const CLOCKS = new WeakMap<object, GT013Clock>();

function makeClock(): GT013Clock {
  return {
    logicMs: 0,
    stepAtMs: -9999,
    backtrackAtMs: -9999,
    blockedCell: null,
    blockedWallSide: null,
    blockedAtMs: -9999,
    missingRequiredUntilMs: -9999,
    submitRetryUntilMs: -9999,
    winAtMs: -9999,
    closeAtMs: -9999,
    touchingSlotIndex: null,
    touchingUntilMs: -9999,
    hoveredSlotIndex: null,
    activeHintLevel: 0,
  };
}

export function clockOf(owner: object): GT013Clock {
  let clk = CLOCKS.get(owner);
  if (!clk) {
    clk = makeClock();
    CLOCKS.set(owner, clk);
  }
  return clk;
}

export function resetClock(owner: object): void {
  CLOCKS.set(owner, makeClock());
}

export function tickGT013Clock(clk: GT013Clock, deltaMs: number): void {
  clk.logicMs += Math.max(0, deltaMs);
  if (clk.blockedCell && clk.logicMs - clk.blockedAtMs >= BLOCKED_FLASH_MS) {
    clk.blockedCell = null;
    clk.blockedWallSide = null;
    clk.blockedAtMs = -9999;
  }
  if (clk.touchingSlotIndex !== null && clk.logicMs >= clk.touchingUntilMs) {
    clk.touchingSlotIndex = null;
    clk.touchingUntilMs = -9999;
  }
}

export function extractMazeCell(d: GameActionValue): MazeCell | null {
  const row =
    typeof d === "object" && d !== null ? Reflect.get(d, "row") : null;
  const col =
    typeof d === "object" && d !== null ? Reflect.get(d, "col") : null;
  return typeof row === "number" && typeof col === "number"
    ? { row, col }
    : null;
}

export function extractMazeSide(d: GameActionValue): MazeSide | null {
  const s = typeof d === "object" && d !== null ? Reflect.get(d, "side") : null;
  return s === "n" || s === "e" || s === "s" || s === "w" ? s : null;
}

export function extractMazeCells(d: GameActionValue): MazeCell[] {
  const raw =
    typeof d === "object" && d !== null ? Reflect.get(d, "cells") : null;
  const arr = Array.isArray(raw) ? raw.map(extractMazeCell) : [];
  return arr.filter((c): c is MazeCell => c !== null);
}

export function resolvePointerCoords(
  p: { readonly x: number; readonly y: number } | number | null,
  y?: number
): { readonly x: number; readonly y: number } | null {
  if (typeof p === "number") {
    return typeof y === "number" ? { x: p, y } : null;
  }
  return p;
}

export function sameCell(a: MazeCell, b: MazeCell): boolean {
  return a.row === b.row && a.col === b.col;
}

const SIDE_MAP: Record<string, MazeSide> = {
  "-1,0": "n",
  "1,0": "s",
  "0,1": "e",
  "0,-1": "w",
};
export function neighborSide(from: MazeCell, to: MazeCell): MazeSide | null {
  return SIDE_MAP[`${to.row - from.row},${to.col - from.col}`] ?? null;
}

export function cellToSlotIndex(
  c: MazeCell,
  w: number,
  n: number
): number | null {
  const idx = c.row * w + c.col;
  return c.row >= 0 && c.col >= 0 && c.col < w && idx < n ? idx : null;
}

export function deriveGT013DecorGrains(
  s: number,
  n: number
): readonly number[] {
  const rng = deriveStream(s, "cells");
  return Array.from({ length: n }, () => rng.next());
}

export function computeGT013Slots(p: {
  readonly grid: MazeGrid;
  readonly ageBand: AgeBand;
  readonly logic: LogicSpace;
  readonly stage?: ZoneRect;
  readonly cssPerLogic?: number;
}): readonly Slot[] {
  const fn = resolveExactGridLayout(p.grid.cols, p.grid.rows);
  return fn({ slotCount: p.grid.rows * p.grid.cols, ...p });
}

export function computeRemainingRoute(
  g: MazeGrid,
  path: readonly MazeCell[],
  req: readonly MazeCell[]
): MazeCell[] {
  const cur = path.at(-1) ?? g.start;
  const vis = new Set(path.map(cellKey));
  const unvis = req.filter((rc) => !vis.has(cellKey(rc)));
  const full = findRouteThrough(g, unvis, cur);
  const prev = path.at(-2);
  const back = prev && full?.[1] && sameCell(full[1], prev);
  const side = back && prev ? neighborSide(cur, prev) : null;
  if (side) {
    const g2 = { ...g, walls: [...g.walls, { ...cur, side }] };
    const detour = findRouteThrough(g2, unvis, cur);
    if (detour && detour.length > 1) {
      return detour.slice(1);
    }
  }
  return full && full.length > 1 ? full.slice(1) : [];
}

export function computeHintCells(
  g: MazeGrid,
  ahead: readonly MazeCell[],
  lv: 1 | 2 | 3
): MazeCell[] {
  if (lv <= 2) {
    return ahead.slice(0, lv);
  }
  const jIdx = ahead.findIndex((c) => isJunction(g, c));
  return jIdx >= 0 ? ahead.slice(0, jIdx + 1) : [...ahead];
}

function toSpoken(c: MazeCell, ct: GT013Content): string {
  const pos = `Hàng ${c.row + 1} cột ${c.col + 1}`;
  if (sameCell(c, ct.grid.start)) {
    return `Ô xuất phát, ${pos}`;
  }
  if (sameCell(c, ct.grid.goal)) {
    const g = ct.goal_glyph;
    return g ? `Ô đích, lá cờ số ${g}, ${pos}` : `Ô đích, ${pos}`;
  }
  return ct.required_cells.some((r) => sameCell(r, c))
    ? `Ô phải đi qua, ${pos}`
    : pos;
}

function cellRole(c: MazeCell, ct: GT013Content): ViewEntity["role"] {
  const isReq = ct.required_cells.some((r) => sameCell(r, c));
  if (sameCell(c, ct.grid.goal) || isReq) {
    return "target";
  }
  return sameCell(c, ct.grid.start) ? "source" : "neutral";
}

function cellState(
  w: boolean,
  p: boolean,
  b: boolean,
  t: boolean
): ViewEntity["state"] {
  if (w && p) {
    return "correct";
  }
  if (b) {
    return "incorrect";
  }
  if (t && !p) {
    return "selected";
  }
  return p ? "active" : "idle";
}

export function buildGT013View(
  ct: GT013Content,
  slots: readonly Slot[],
  path: readonly MazeCell[],
  clk: GT013Clock,
  won: boolean,
  closed: boolean
): EngineView {
  const { rows, cols, start } = ct.grid;
  const entities: ViewEntity[] = [];
  const pathKeys = new Set(path.map(cellKey));
  const head = path.at(-1) ?? start;
  const activeIdx = clk.touchingSlotIndex ?? clk.hoveredSlotIndex;

  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    const r = Math.floor(i / cols);
    const c = i % cols;
    if (!slot || r >= rows || c >= cols) {
      continue;
    }
    const cell = { row: r, col: c };
    const inPath = pathKeys.has(cellKey(cell));
    const blk = clk.blockedCell !== null && sameCell(clk.blockedCell, cell);
    const tch = !(won || closed) && activeIdx === i;
    const side = ct.input_mode === "arrows" ? neighborSide(head, cell) : null;

    entities.push({
      id: `cell_${r}_${c}`,
      slotIndex: i,
      role: cellRole(cell, ct),
      state: cellState(won, inPath, blk, tch),
      x: slot.x,
      y: slot.y,
      w: slot.w,
      h: slot.h,
      hitShape: "square",
      spokenLabel: toSpoken(cell, ct),
      ...(side ? { glyph: ARROW_GLYPHS[side] } : {}),
    });
  }
  return { activePrompt: ct.prompt, entities };
}

export interface GT013OpenNeighbor {
  readonly cell: MazeCell;
  readonly side: MazeSide;
  readonly isBacktrack: boolean;
}

export interface GT013RenderView {
  readonly grid: MazeGrid;
  readonly box: SceneBox;
  readonly stageRect?: ZoneRect;
  readonly path: readonly MazeCell[];
  readonly head: MazeCell;
  readonly requiredCells: readonly MazeCell[];
  readonly visitedKeys: ReadonlySet<string>;
  readonly inputMode: "draw" | "arrows";
  readonly isWon: boolean;
  readonly isRoundClosed: boolean;
  readonly solutionRoute: readonly MazeCell[];
  readonly hintCells: readonly MazeCell[];
  readonly activeHintLevel: 0 | 1 | 2 | 3;
  readonly openNeighbors: readonly GT013OpenNeighbor[];
  readonly blockedCell: MazeCell | null;
  readonly blockedWall: MazeGrid["walls"][number] | null;
  readonly blockedProgress: number;
  readonly stepPopProgress: number;
  readonly winProgress: number;
  readonly missingRequiredAlpha: number;
  readonly pressedCell: MazeCell | null;
  readonly decorGrains: readonly number[];
  readonly timeMs: number;
  readonly degraded: {
    readonly disableShadows: boolean;
    readonly disableParticles: boolean;
  };
}

export interface GT013RenderInput {
  readonly content: GT013Content;
  readonly box: SceneBox;
  readonly stageRect?: ZoneRect;
  readonly path: readonly MazeCell[];
  readonly solutionRoute: readonly MazeCell[];
  readonly decorGrains: readonly number[];
  readonly clk: GT013Clock;
  readonly isWon: boolean;
  readonly isRoundClosed: boolean;
  readonly degradation: DegradationState | null;
  readonly timeMs: number;
}

function decay(nowMs: number, startMs: number, spanMs: number): number {
  const el = nowMs - startMs;
  return el >= 0 && el < spanMs ? 1 - el / spanMs : 0;
}

export function buildGT013RenderView(p: GT013RenderInput): GT013RenderView {
  const { grid, required_cells: req, input_mode: inputMode } = p.content;
  const head = p.path.at(-1) ?? grid.start;
  const prev = p.path.at(-2) ?? null;
  const openNeighbors = ALL_SIDES.map((s) => ({
    cell: cellTowards(head, s),
    side: s,
  }))
    .filter(({ cell }) => canMove(grid, head, cell))
    .map((n) => ({
      ...n,
      isBacktrack: prev !== null && sameCell(n.cell, prev),
    }));
  const hl = p.isWon || p.isRoundClosed ? 0 : p.clk.activeHintLevel;
  const rem = hl > 0 ? computeRemainingRoute(grid, p.path, req) : [];
  const mRem = p.clk.missingRequiredUntilMs - p.clk.logicMs;
  const aIdx = p.clk.touchingSlotIndex ?? p.clk.hoveredSlotIndex;
  const ws = p.clk.blockedWallSide;
  const bProg = decay(p.clk.logicMs, p.clk.blockedAtMs, BLOCKED_FLASH_MS);
  const wProg = decay(p.clk.logicMs, p.clk.winAtMs, WIN_HALO_MS);
  return {
    grid,
    box: p.box,
    stageRect: p.stageRect,
    path: p.path,
    head,
    requiredCells: req,
    visitedKeys: new Set(p.path.map(cellKey)),
    inputMode,
    isWon: p.isWon,
    isRoundClosed: p.isRoundClosed,
    solutionRoute: p.solutionRoute,
    hintCells: hl === 0 ? [] : computeHintCells(grid, rem, hl),
    activeHintLevel: hl,
    openNeighbors,
    blockedCell: p.clk.blockedCell,
    blockedWall: ws ? { row: head.row, col: head.col, side: ws } : null,
    blockedProgress: p.clk.blockedCell ? bProg : 0,
    stepPopProgress: decay(p.clk.logicMs, p.clk.stepAtMs, STEP_POP_MS),
    winProgress: p.isWon ? wProg : 0,
    missingRequiredAlpha:
      mRem > 0 ? Math.min(1, mRem / MISSING_REQ_PULSE_MS) : 0,
    pressedCell:
      aIdx !== null && aIdx >= 0
        ? { row: Math.floor(aIdx / grid.cols), col: aIdx % grid.cols }
        : null,
    decorGrains: p.decorGrains,
    timeMs: p.timeMs,
    degraded: {
      disableShadows: p.degradation?.soft_shadows_enabled === false,
      disableParticles: p.degradation?.particles_enabled === false,
    },
  };
}
