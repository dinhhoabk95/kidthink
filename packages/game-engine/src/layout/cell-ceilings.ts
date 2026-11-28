import type { AgeBand } from "#src/contracts/types";

/**
 * Trần số ô mỗi vòng theo band tuổi (`BR-LAY-12` / `BR-PSZ-13`).
 *
 * Nguồn duy nhất của bảng trần: bộ dựng nội dung (`@mindkid/content`), cổng
 * corpus và cổng sức chứa khung thật (`shell-frame-capacity.test.ts`) cùng đọc
 * ở đây, không chép số ở nơi khác. Số đo ở khung play thật (hộp canvas 338x507
 * và 368x711 ở 360x640 / 390x844, sàn chạm 96/76/64 CSS) bằng layout engine
 * thật — xem `cell-ceilings.test.ts`, test đo lại từng số: vừa ở trần, tràn ở
 * trần + 1 (khi trần chưa chạm mức tối đa của engine).
 *
 * Band không có trong bảng của một chiều là band bị cấm với engine đó (không đo).
 * Bộ dựng áp **trần chặt nhất** qua mọi band (`strictestCellCeiling`): level seed
 * không gắn với một band khi cổng đo, nên một level phải vừa ở band nhỏ nhất.
 */
export type BandCeiling = Readonly<Partial<Record<AgeBand, number>>>;

export interface CellCeilingTable {
  /** Số lựa chọn (ô ứng viên) của ma trận. */
  readonly "GT-011": {
    readonly options: BandCeiling;
    readonly matrix_cells: BandCeiling;
  };
  /** Cạnh lưới sudoku mini: 2, 3 hoặc 4. */
  readonly "GT-015": { readonly grid_size: BandCeiling };
  /** Số lựa chọn đáp án đếm khối. */
  readonly "GT-017": { readonly options: BandCeiling };
  /** Số mảnh của mẫu đối xứng (mỗi mảnh: một ô tham chiếu, một ô đích, một lựa chọn). */
  readonly "GT-021": { readonly pieces: BandCeiling };
  /** Số vật cảnh trong tranh (vùng chạm không chồng nhau). */
  readonly "GT-022": { readonly scene_objects: BandCeiling };
  /** Số vật mỗi bên tranh. */
  readonly "GT-025": { readonly objects_per_side: BandCeiling };
  /** Số thẻ lệnh tối đa và số cột lưới đường đi. */
  readonly "GT-035": {
    readonly max_commands: BandCeiling;
    readonly grid_cols: BandCeiling;
  };
  /** Số ký hiệu trên bảng và số bản sao đích (tỉ lệ đích ≤ 35%, `BR-E037-12`). */
  readonly "GT-037": {
    readonly item_count: BandCeiling;
    readonly target_copies: BandCeiling;
  };
}

export type CellCeilingCode = keyof CellCeilingTable;

export const CELL_CEILINGS: CellCeilingTable = {
  "GT-011": {
    options: { "3-4": 2, "4-5": 6, "5-6": 6 },
    matrix_cells: { "3-4": 4, "4-5": 9, "5-6": 9 },
  },
  "GT-015": { grid_size: { "3-4": 3, "4-5": 4, "5-6": 4 } },
  "GT-017": { options: { "3-4": 4, "4-5": 6, "5-6": 6 } },
  "GT-021": { pieces: { "3-4": 3, "4-5": 4, "5-6": 6 } },
  "GT-022": { scene_objects: { "3-4": 5, "4-5": 12, "5-6": 12 } },
  "GT-025": { objects_per_side: { "3-4": 3, "4-5": 4, "5-6": 5 } },
  "GT-035": {
    max_commands: { "5-6": 4 },
    grid_cols: { "5-6": 4 },
  },
  "GT-037": {
    item_count: { "4-5": 8, "5-6": 12 },
    target_copies: { "4-5": 2, "5-6": 4 },
  },
};

/** Trần của một chiều ở một band; `undefined` nếu band bị cấm với engine đó. */
export function cellCeilingOf(
  ceiling: BandCeiling,
  band: AgeBand
): number | undefined {
  return ceiling[band];
}

/** Trần chặt nhất qua mọi band được phép của chiều đó. */
export function strictestCellCeiling(ceiling: BandCeiling): number {
  const values = Object.values(ceiling);
  if (values.length === 0) {
    throw new Error("Bảng trần rỗng: chiều này không có band nào");
  }
  return Math.min(...values);
}

/** Giá trị một chiều đo được trên một vòng; thiếu chiều thì bỏ qua. */
export type CellMeasures = Readonly<Record<string, number | undefined>>;

type PackRecord = Readonly<
  Record<string, string | number | boolean | object | null | undefined>
>;

function lengthOf(value: PackRecord[string]): number | undefined {
  return Array.isArray(value) ? value.length : undefined;
}

function numberOf(value: PackRecord[string]): number | undefined {
  return typeof value === "number" ? value : undefined;
}

function isPackRecord(value: object): value is PackRecord {
  return !Array.isArray(value);
}

function recordOf(value: PackRecord[string]): PackRecord | undefined {
  return typeof value === "object" && value !== null && isPackRecord(value)
    ? value
    : undefined;
}

/**
 * Đọc các chiều có trần từ một vòng (`content_pack` + `difficulty_params`).
 * Mỗi engine một bộ đọc; engine không có trần trả `{}`.
 */
export function measureCells(
  code: string,
  content: PackRecord,
  difficulty: PackRecord
): CellMeasures {
  switch (code) {
    case "GT-011": {
      const matrix = recordOf(content.matrix);
      const rows = matrix ? numberOf(matrix.rows) : undefined;
      const cols = matrix ? numberOf(matrix.cols) : undefined;
      return {
        options: lengthOf(content.options),
        matrix_cells:
          rows !== undefined && cols !== undefined ? rows * cols : undefined,
      };
    }
    case "GT-015":
      return { grid_size: numberOf(content.grid_size) };
    case "GT-017":
      return { options: lengthOf(content.options) };
    case "GT-021":
      return { pieces: lengthOf(content.reference_pattern) };
    case "GT-022":
      return { scene_objects: lengthOf(content.scene_objects) };
    case "GT-025":
      return { objects_per_side: lengthOf(content.left_objects) };
    case "GT-035": {
      const grid = recordOf(content.grid);
      return {
        max_commands: numberOf(difficulty.max_commands),
        grid_cols: grid ? numberOf(grid.cols) : undefined,
      };
    }
    case "GT-037":
      return {
        item_count: numberOf(content.item_count),
        target_copies: numberOf(content.target_copies),
      };
    default:
      return {};
  }
}

function isCeilingCode(code: string): code is CellCeilingCode {
  return code in CELL_CEILINGS;
}

/**
 * Các chiều của một vòng vượt trần chặt nhất. Rỗng nghĩa là vừa. Cổng corpus
 * và `assertWithinCellCeilings` của bộ dựng dùng chung hàm này.
 */
export function cellCeilingViolations(
  code: string,
  content: PackRecord,
  difficulty: PackRecord
): string[] {
  if (!isCeilingCode(code)) {
    return [];
  }
  const measures = measureCells(code, content, difficulty);
  const table: Readonly<Record<string, BandCeiling>> = CELL_CEILINGS[code];
  const violations: string[] = [];
  for (const [kind, ceiling] of Object.entries(table)) {
    const value = measures[kind];
    if (value === undefined) {
      continue;
    }
    const limit = strictestCellCeiling(ceiling);
    if (value > limit) {
      violations.push(`${code}.${kind} = ${value} vượt trần ${limit}`);
    }
  }
  return violations;
}

/** Ném lỗi khi một vòng vượt trần số ô (`BR-LAY-12`). */
export function assertWithinCellCeilings(
  code: string,
  content: PackRecord,
  difficulty: PackRecord
): void {
  const violations = cellCeilingViolations(code, content, difficulty);
  if (violations.length > 0) {
    throw new Error(`[BR-LAY-12] ${violations.join("; ")}`);
  }
}
