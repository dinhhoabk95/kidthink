/**
 * Bố cục nhóm slot trong sân khấu (`game-layout-engine.md` mục 7.1, Task #277 S7).
 *
 * Engine có nhiều nhóm slot — dải bước và nhạc cụ (GT-034), lưới robot, hàng lệnh
 * và khay lệnh (GT-035), dải mẫu và bảng màu (GT-036) — lấy slot ở đây thay vì
 * tự đặt toạ độ trên canvas 960x540. Hàm thuần (`BR-LAY-01`): chỉ đọc rect sân
 * khấu, band và số ô của từng nhóm, không đọc nội dung (`BR-LAY-06`).
 *
 * ```
 * xếp chồng (mặc định)        tách cột (nhóm đầu có `cols`, chồng không vừa)
 * +------------------+        +---------+----------------+
 * |   nhóm 0         |        |         |   nhóm 1       |
 * |   nhóm 1         |        | nhóm 0  |   nhóm 2       |
 * |   nhóm 2         |        |         |                |
 * +------------------+        +---------+----------------+
 * ```
 *
 * Mọi nhóm dùng chung một cạnh ô, không dưới sàn chạm (`BR-LAY-03`). Bước ô bằng
 * cạnh cộng `SLOT_GAP_PX`, nên hai vùng chạm luôn cách nhau đúng khoảng đó
 * (`BR-LAY-05`). Nhãn dưới ô (`drawSlotLabel`) có dải riêng khi nhóm khai
 * `hasLabels`, để chữ không đè lên hàng kế.
 */

import type { AgeBand } from "#src/contracts/types";
import { getTouchFloor, type LogicSpace, SLOT_GAP_PX } from "./constants.js";
import { computeStageZones, type ZoneRect } from "./stage-zones.js";
import type { Slot, SlotRole } from "./types.js";

/** Cạnh ô lớn nhất — ô to hơn thì nhóm nhỏ chiếm hết sân khấu. */
export const STAGE_GROUP_CELL_MAX_PX = 96;

/** Bước giảm cạnh ô khi tìm cỡ vừa sân khấu. */
const CELL_STEP_PX = 4;

/** Dải dành cho nhãn dưới ô: lề 4 của `drawSlotLabel` cộng một dòng chữ ở sàn đọc. */
export const STAGE_LABEL_ROW_PX = 36;

export interface StageGroupSpec {
  readonly count: number;
  readonly role: SlotRole;
  /** Số cột cố định (lưới). Bỏ trống thì một hàng chứa được bao nhiêu ô thì chứa. */
  readonly cols?: number;
  /** Ô có nhãn vẽ dưới thân — chừa dải `STAGE_LABEL_ROW_PX` dưới mỗi hàng. */
  readonly hasLabels?: boolean;
}

export interface StageGroupsInput {
  readonly stage: ZoneRect;
  readonly ageBand: AgeBand;
  readonly groups: readonly StageGroupSpec[];
}

interface GroupBlock {
  readonly perRow: number;
  readonly rows: number;
  readonly w: number;
  readonly h: number;
}

interface PlacedColumn {
  readonly rect: ZoneRect;
  readonly groupIndexes: readonly number[];
}

type Arrangement = "stacked" | "split";

/**
 * Sân khấu cho session chưa được shell cấp vùng (test, bề mặt cũ): cùng hàm vùng
 * với trang chơi ở tỉ lệ 1 — không có toạ độ thứ hai cho cùng một khung.
 */
export function resolveStageRect(
  space: LogicSpace,
  ageBand: AgeBand,
  stage?: ZoneRect
): ZoneRect {
  if (stage) {
    return stage;
  }
  return computeStageZones({
    logicW: space.w,
    logicH: space.h,
    ageBand,
    cssPerLogic: 1,
    needsTray: false,
    needsCommit: true,
  }).stage;
}

function measureGroup(
  group: StageGroupSpec,
  cell: number,
  availW: number,
  withLabels: boolean
): GroupBlock {
  const pitch = cell + SLOT_GAP_PX;
  const fitPerRow = Math.max(1, Math.floor((availW + SLOT_GAP_PX) / pitch));
  const perRow = Math.max(1, Math.min(group.count, group.cols ?? fitPerRow));
  const rows = Math.ceil(group.count / perRow);
  const rowH = cell + (withLabels && group.hasLabels ? STAGE_LABEL_ROW_PX : 0);
  return {
    perRow,
    rows,
    w: perRow * cell + (perRow - 1) * SLOT_GAP_PX,
    h: rows * rowH + (rows - 1) * SLOT_GAP_PX,
  };
}

function columnHeight(blocks: readonly GroupBlock[]): number {
  const sum = blocks.reduce((acc, block) => acc + block.h, 0);
  return sum + Math.max(0, blocks.length - 1) * SLOT_GAP_PX;
}

function planColumns(
  arrangement: Arrangement,
  area: ZoneRect,
  groups: readonly StageGroupSpec[],
  cell: number
): PlacedColumn[] | null {
  const all = groups.map((_, index) => index);
  if (arrangement === "stacked") {
    return [{ rect: area, groupIndexes: all }];
  }
  const first = groups[0];
  if (!(first?.cols && groups.length > 1)) {
    return null;
  }
  const leftW = first.cols * cell + (first.cols - 1) * SLOT_GAP_PX;
  const rightW = area.w - leftW - SLOT_GAP_PX;
  if (rightW < cell) {
    return null;
  }
  return [
    { rect: { ...area, w: leftW }, groupIndexes: [0] },
    {
      rect: { ...area, x: area.x + leftW + SLOT_GAP_PX, w: rightW },
      groupIndexes: all.slice(1),
    },
  ];
}

function measureColumns(
  columns: readonly PlacedColumn[],
  groups: readonly StageGroupSpec[],
  cell: number,
  withLabels: boolean
): Map<number, GroupBlock> | null {
  const blocks = new Map<number, GroupBlock>();
  for (const column of columns) {
    const measured: GroupBlock[] = [];
    for (const index of column.groupIndexes) {
      const group = groups[index];
      if (!group) {
        return null;
      }
      const block = measureGroup(group, cell, column.rect.w, withLabels);
      if (block.w > column.rect.w) {
        return null;
      }
      blocks.set(index, block);
      measured.push(block);
    }
    if (columnHeight(measured) > column.rect.h) {
      return null;
    }
  }
  return blocks;
}

interface LayoutPlan {
  readonly cell: number;
  readonly withLabels: boolean;
  readonly columns: readonly PlacedColumn[];
  readonly blocks: ReadonlyMap<number, GroupBlock>;
}

function findPlan(
  area: ZoneRect,
  groups: readonly StageGroupSpec[],
  floor: number
): LayoutPlan {
  const maxCell = Math.max(floor, STAGE_GROUP_CELL_MAX_PX);
  // Thứ tự ưu tiên: giữ nhãn trước, rồi ô to trước, rồi xếp chồng trước tách cột.
  for (const withLabels of [true, false]) {
    for (let cell = maxCell; cell >= floor; cell -= CELL_STEP_PX) {
      for (const arrangement of ["stacked", "split"] as const) {
        const columns = planColumns(arrangement, area, groups, cell);
        const blocks = columns
          ? measureColumns(columns, groups, cell, withLabels)
          : null;
        if (columns && blocks) {
          return { cell, withLabels, columns, blocks };
        }
      }
    }
  }
  // Không cỡ nào vừa: giữ sàn chạm và tràn sân khấu (`BR-LAY-04` cấm thu nhỏ).
  const columns: PlacedColumn[] = [
    { rect: area, groupIndexes: groups.map((_, index) => index) },
  ];
  const blocks = new Map<number, GroupBlock>(
    groups.map((group, index) => [
      index,
      measureGroup(group, floor, area.w, false),
    ])
  );
  return { cell: floor, withLabels: false, columns, blocks };
}

function placeGroup(
  group: StageGroupSpec,
  block: GroupBlock,
  plan: LayoutPlan,
  origin: { readonly x: number; readonly y: number },
  firstIndex: number
): Slot[] {
  const { cell } = plan;
  const rowH =
    cell + (plan.withLabels && group.hasLabels ? STAGE_LABEL_ROW_PX : 0);
  const slots: Slot[] = [];
  for (let i = 0; i < group.count; i++) {
    const row = Math.floor(i / block.perRow);
    const col = i % block.perRow;
    const inRow = Math.min(block.perRow, group.count - row * block.perRow);
    const rowW = inRow * cell + (inRow - 1) * SLOT_GAP_PX;
    const rowStartX = origin.x + Math.round((block.w - rowW) / 2);
    slots.push({
      index: firstIndex + i,
      role: group.role,
      x: rowStartX + col * (cell + SLOT_GAP_PX) + cell / 2,
      y: origin.y + row * (rowH + SLOT_GAP_PX) + cell / 2,
      w: cell,
      h: cell,
      hitW: cell,
      hitH: cell,
      page: 0,
    });
  }
  return slots;
}

/** Chỉ số slot đầu tiên của mỗi nhóm — slot đánh số liên tục theo thứ tự nhóm. */
function firstIndexes(groups: readonly StageGroupSpec[]): number[] {
  const starts: number[] = [];
  let next = 0;
  for (const group of groups) {
    starts.push(next);
    next += group.count;
  }
  return starts;
}

export function computeStageGroupsLayout(input: StageGroupsInput): Slot[] {
  const groups = input.groups.filter((group) => group.count > 0);
  if (groups.length === 0) {
    return [];
  }
  const { stage } = input;
  // Lề trong một `SLOT_GAP_PX`: thân đất sét có bóng và gờ dày vài px.
  const area: ZoneRect = {
    x: stage.x + SLOT_GAP_PX,
    y: stage.y + SLOT_GAP_PX,
    w: Math.max(0, stage.w - 2 * SLOT_GAP_PX),
    h: Math.max(0, stage.h - 2 * SLOT_GAP_PX),
  };
  const plan = findPlan(area, groups, getTouchFloor(input.ageBand));
  const starts = firstIndexes(groups);

  const slots: Slot[] = [];
  for (const column of plan.columns) {
    const blocks = column.groupIndexes.map((index) => plan.blocks.get(index));
    const used = columnHeight(blocks.filter((b) => b !== undefined));
    // Chỗ thừa chia đều trên, giữa và dưới các nhóm.
    const spare = Math.max(0, column.rect.h - used);
    const spacer = Math.floor(spare / (column.groupIndexes.length + 1));
    let y = column.rect.y + spacer;
    for (const index of column.groupIndexes) {
      const group = groups[index];
      const block = plan.blocks.get(index);
      if (!(group && block)) {
        continue;
      }
      const x = column.rect.x + Math.round((column.rect.w - block.w) / 2);
      slots.push(
        ...placeGroup(group, block, plan, { x, y }, starts[index] ?? 0)
      );
      y += block.h + SLOT_GAP_PX + spacer;
    }
  }
  return slots.sort((a, b) => a.index - b.index);
}
