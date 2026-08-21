/**
 * `mazeSystem` — lưới ô, tường, đường đi hợp lệ, phát hiện ngõ cụt.
 * Mục 7.4 của [`montessori-template-batch.md`](../../../../docs/specs/01-platform/montessori-template-batch.md).
 *
 * System này **độc lập với khuôn** (`BR-MTB-15`): mọi thứ ở đây nhận `MazeGrid`
 * thuần dữ liệu và không nhập gì từ `templates/`. `GT-013` dựng lên nó, không
 * ngược lại.
 *
 * Kiểm soát lỗi tự thân: nét vẽ **dừng ở tường** thay vì báo sai, và khi nét vẽ
 * kẹt trong một ngõ cụt thì nó lùi về ngã ba gần nhất. Không nhánh nào ở đây phát
 * ra "đúng" hay "sai" — đó là việc của Session.
 */

export type MazeSide = "n" | "e" | "s" | "w";

export interface MazeCell {
  readonly row: number;
  readonly col: number;
}

export interface MazeWall extends MazeCell {
  readonly side: MazeSide;
}

export interface MazeGrid {
  readonly rows: number;
  readonly cols: number;
  readonly walls: readonly MazeWall[];
  readonly start: MazeCell;
  readonly goal: MazeCell;
}

const SIDES: readonly MazeSide[] = ["n", "e", "s", "w"];

const DELTA: Record<MazeSide, MazeCell> = {
  n: { row: -1, col: 0 },
  e: { row: 0, col: 1 },
  s: { row: 1, col: 0 },
  w: { row: 0, col: -1 },
};

const OPPOSITE: Record<MazeSide, MazeSide> = {
  n: "s",
  e: "w",
  s: "n",
  w: "e",
};

/** Khoá ô dùng cho Set và Map — `"<row>,<col>"`. */
export function cellKey(cell: MazeCell): string {
  return `${cell.row},${cell.col}`;
}

export function sameCell(a: MazeCell, b: MazeCell): boolean {
  return a.row === b.row && a.col === b.col;
}

/** Ô kề theo một hướng — không kiểm tường, không kiểm biên. */
export function cellTowards(cell: MazeCell, side: MazeSide): MazeCell {
  const delta = DELTA[side];
  return { row: cell.row + delta.row, col: cell.col + delta.col };
}

export function isInsideGrid(grid: MazeGrid, cell: MazeCell): boolean {
  return (
    cell.row >= 0 &&
    cell.row < grid.rows &&
    cell.col >= 0 &&
    cell.col < grid.cols
  );
}

/**
 * Tường khai một phía chặn **cả hai chiều**: `{ row: 0, col: 0, side: "e" }` và
 * `{ row: 0, col: 1, side: "w" }` là cùng một bức tường.
 */
function blockedEdges(grid: MazeGrid): Set<string> {
  const edges = new Set<string>();
  for (const wall of grid.walls) {
    edges.add(`${wall.row},${wall.col},${wall.side}`);
    const delta = DELTA[wall.side];
    edges.add(
      `${wall.row + delta.row},${wall.col + delta.col},${OPPOSITE[wall.side]}`
    );
  }
  return edges;
}

function sideBetween(from: MazeCell, to: MazeCell): MazeSide | null {
  for (const side of SIDES) {
    const delta = DELTA[side];
    if (from.row + delta.row === to.row && from.col + delta.col === to.col) {
      return side;
    }
  }
  return null;
}

function canMoveWith(
  grid: MazeGrid,
  edges: Set<string>,
  from: MazeCell,
  to: MazeCell
): boolean {
  if (!(isInsideGrid(grid, from) && isInsideGrid(grid, to))) {
    return false;
  }
  const side = sideBetween(from, to);
  if (side === null) {
    return false;
  }
  return !edges.has(`${from.row},${from.col},${side}`);
}

/** Ô kề, trong lưới, và không có tường chắn giữa hai ô. */
export function canMove(grid: MazeGrid, from: MazeCell, to: MazeCell): boolean {
  return canMoveWith(grid, blockedEdges(grid), from, to);
}

function neighborsWith(
  grid: MazeGrid,
  edges: Set<string>,
  cell: MazeCell
): MazeCell[] {
  const out: MazeCell[] = [];
  for (const side of SIDES) {
    const delta = DELTA[side];
    const next = { row: cell.row + delta.row, col: cell.col + delta.col };
    if (canMoveWith(grid, edges, cell, next)) {
      out.push(next);
    }
  }
  return out;
}

/** Các ô đi được từ `cell` — theo thứ tự bắc, đông, nam, tây. */
export function openNeighbors(grid: MazeGrid, cell: MazeCell): MazeCell[] {
  return neighborsWith(grid, blockedEdges(grid), cell);
}

function reconstructPath(
  cameFrom: Map<string, MazeCell | null>,
  current: MazeCell
): MazeCell[] {
  const path: MazeCell[] = [];
  let step: MazeCell | null | undefined = current;
  while (step) {
    path.unshift(step);
    step = cameFrom.get(cellKey(step)) ?? null;
  }
  return path;
}

function bfsWith(
  grid: MazeGrid,
  edges: Set<string>,
  from: MazeCell,
  to: MazeCell
): MazeCell[] | null {
  if (!(isInsideGrid(grid, from) && isInsideGrid(grid, to))) {
    return null;
  }
  const cameFrom = new Map<string, MazeCell | null>([[cellKey(from), null]]);
  const queue: MazeCell[] = [from];
  let head = 0;

  while (head < queue.length) {
    const current = queue[head];
    head++;
    if (!current) {
      break;
    }
    if (sameCell(current, to)) {
      return reconstructPath(cameFrom, current);
    }
    for (const next of neighborsWith(grid, edges, current)) {
      if (!cameFrom.has(cellKey(next))) {
        cameFrom.set(cellKey(next), current);
        queue.push(next);
      }
    }
  }
  return null;
}

/** Đường ngắn nhất giữa hai ô, hoặc `null` khi không có đường nào. */
export function findPath(
  grid: MazeGrid,
  from: MazeCell,
  to: MazeCell
): MazeCell[] | null {
  return bfsWith(grid, blockedEdges(grid), from, to);
}

/** Mọi ô tới được từ ô đầu. Vùng bị bịt kín không nằm trong danh sách này. */
export function reachableCells(grid: MazeGrid): MazeCell[] {
  const edges = blockedEdges(grid);
  const seen = new Set<string>([cellKey(grid.start)]);
  const queue: MazeCell[] = [grid.start];
  let head = 0;
  while (head < queue.length) {
    const current = queue[head];
    head++;
    if (!current) {
      break;
    }
    for (const next of neighborsWith(grid, edges, current)) {
      if (!seen.has(cellKey(next))) {
        seen.add(cellKey(next));
        queue.push(next);
      }
    }
  }
  return queue;
}

function permutations<T>(items: readonly T[]): T[][] {
  if (items.length <= 1) {
    return [[...items]];
  }
  return items.flatMap((item, index) =>
    permutations([...items.slice(0, index), ...items.slice(index + 1)]).map(
      (rest) => [item, ...rest]
    )
  );
}

function chainSegments(
  grid: MazeGrid,
  edges: Set<string>,
  waypoints: readonly MazeCell[]
): MazeCell[] | null {
  const first = waypoints[0];
  if (!first) {
    return null;
  }
  const route: MazeCell[] = [first];
  for (let i = 1; i < waypoints.length; i++) {
    const prev = waypoints[i - 1];
    const curr = waypoints[i];
    if (!(prev && curr)) {
      return null;
    }
    const segment = bfsWith(grid, edges, prev, curr);
    if (!segment) {
      return null;
    }
    route.push(...segment.slice(1));
  }
  return route;
}

/**
 * Một đường từ ô đầu tới ô đích **đi qua đủ mọi ô bắt buộc**, hoặc `null`.
 * Đường được phép đi lại ô cũ: thu thập vật phẩm rồi quay ra là dạng bài nguồn.
 */
export function findRouteThrough(
  grid: MazeGrid,
  requiredCells: readonly MazeCell[],
  from: MazeCell = grid.start
): MazeCell[] | null {
  const edges = blockedEdges(grid);
  for (const order of permutations(requiredCells)) {
    const route = chainSegments(grid, edges, [from, ...order, grid.goal]);
    if (route) {
      return route;
    }
  }
  return null;
}

/** Đường hợp lệ: bắt đầu ở ô đầu, kết ở ô đích, mỗi bước đi được, đủ ô bắt buộc. */
export function isValidRoute(
  grid: MazeGrid,
  path: readonly MazeCell[],
  requiredCells: readonly MazeCell[]
): boolean {
  const first = path.at(0);
  const last = path.at(-1);
  if (
    !(first && last && sameCell(first, grid.start) && sameCell(last, grid.goal))
  ) {
    return false;
  }
  const edges = blockedEdges(grid);
  for (let i = 1; i < path.length; i++) {
    const prev = path[i - 1];
    const curr = path[i];
    if (!(prev && curr && canMoveWith(grid, edges, prev, curr))) {
      return false;
    }
  }
  const visited = new Set(path.map(cellKey));
  return requiredCells.every((cell) => visited.has(cellKey(cell)));
}

/** Ngõ cụt: đúng một lối ra, và không phải ô đầu hay ô đích. */
export function isDeadEnd(grid: MazeGrid, cell: MazeCell): boolean {
  if (sameCell(cell, grid.start) || sameCell(cell, grid.goal)) {
    return false;
  }
  return openNeighbors(grid, cell).length === 1;
}

/** Số ngõ cụt trẻ có thể đi vào — chỉ đếm ô tới được từ ô đầu. */
export function countDeadEnds(grid: MazeGrid): number {
  return reachableCells(grid).filter((cell) => isDeadEnd(grid, cell)).length;
}

/** Ngã ba: ô có từ ba lối trở lên. */
export function isJunction(grid: MazeGrid, cell: MazeCell): boolean {
  return openNeighbors(grid, cell).length >= 3;
}

/**
 * Vị trí ngã ba gần nhất tính ngược từ đầu nét vẽ. Không có ngã ba nào trên nét
 * vẽ thì lùi hẳn về ô đầu — nét vẽ không bao giờ mất sạch.
 */
export function nearestJunctionIndex(
  grid: MazeGrid,
  path: readonly MazeCell[]
): number {
  for (let i = path.length - 1; i > 0; i--) {
    const cell = path[i];
    if (cell && isJunction(grid, cell)) {
      return i;
    }
  }
  return 0;
}

export type MazeStepStatus = "moved" | "rewound" | "blocked";
export type MazeBlockedReason = "outside" | "not_adjacent" | "wall";

export interface MazeStepResult {
  readonly status: MazeStepStatus;
  readonly path: readonly MazeCell[];
  /** Vì sao nét vẽ dừng — chỉ có khi `status` là `blocked`. */
  readonly blocked_reason?: MazeBlockedReason;
  /** Ngã ba mà nét vẽ lùi về sau khi kẹt trong ngõ cụt. */
  readonly retreated_to?: MazeCell;
}

/**
 * Nét vẽ đang chạy trên một lưới. Vẫn độc lập với khuôn: nó không phát event,
 * không chấm điểm, không biết `difficulty_params` là gì.
 */
export class MazePathTracker {
  private readonly grid: MazeGrid;
  private path: MazeCell[];

  constructor(grid: MazeGrid) {
    this.grid = grid;
    this.path = [grid.start];
  }

  getPath(): readonly MazeCell[] {
    return [...this.path];
  }

  getHead(): MazeCell {
    return this.path.at(-1) ?? this.grid.start;
  }

  reset(): void {
    this.path = [this.grid.start];
  }

  step(cell: MazeCell): MazeStepResult {
    const previous = this.path.at(-2);
    if (previous && sameCell(cell, previous)) {
      this.path = this.path.slice(0, -1);
      return { status: "rewound", path: this.getPath() };
    }
    const reason = this.blockedReason(cell);
    if (reason) {
      return this.blockedResult(reason);
    }
    this.path = [...this.path, cell];
    return { status: "moved", path: this.getPath() };
  }

  /**
   * Lùi nét vẽ về ngã ba gần nhất. Gọi thẳng được từ nút "vẽ lại" của giao diện,
   * không chỉ từ nhánh đâm tường.
   */
  retreatToJunction(): MazeCell {
    const index = nearestJunctionIndex(this.grid, this.path);
    this.path = this.path.slice(0, index + 1);
    return this.getHead();
  }

  isComplete(requiredCells: readonly MazeCell[]): boolean {
    return isValidRoute(this.grid, this.path, requiredCells);
  }

  private blockedReason(cell: MazeCell): MazeBlockedReason | null {
    if (!isInsideGrid(this.grid, cell)) {
      return "outside";
    }
    if (sideBetween(this.getHead(), cell) === null) {
      return "not_adjacent";
    }
    return canMove(this.grid, this.getHead(), cell) ? null : "wall";
  }

  private blockedResult(reason: MazeBlockedReason): MazeStepResult {
    if (reason !== "wall" || !isDeadEnd(this.grid, this.getHead())) {
      return {
        status: "blocked",
        path: this.getPath(),
        blocked_reason: reason,
      };
    }
    const retreatedTo = this.retreatToJunction();
    return {
      status: "blocked",
      path: this.getPath(),
      blocked_reason: reason,
      retreated_to: retreatedTo,
    };
  }
}
