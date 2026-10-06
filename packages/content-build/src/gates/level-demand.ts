/**
 * Độ phủ và cổng sinh level theo sổ cầu.
 *
 * Con số báo cáo là số ô đã lấp trên tổng ô của lộ trình — không bao giờ là
 * tổng hàng `game_levels`, vì kho đầy mà ô trống vẫn là nợ. Level không thuộc
 * kỹ năng nào của sổ cầu là level mồ côi: nằm trong kho, không được gieo vào
 * lộ trình.
 */

import type { RoadmapBand } from "@mindkid/content";
import type {
  ContentDemandLedger,
  DemandCell,
  DemandLevel,
} from "./content-demand.js";

export interface CoverageRow {
  readonly roadmap_code: string;
  readonly band: RoadmapBand;
  readonly cells: number;
  readonly filled_cells: number;
  readonly debt_cells: number;
}

export function isCellFilled(cell: DemandCell): boolean {
  return cell.filled_by.length >= cell.level_quota;
}

export function summarizeCoverage(ledger: ContentDemandLedger): CoverageRow[] {
  const rows = new Map<string, CoverageRow>();
  for (const cell of ledger.cells) {
    const previous = rows.get(cell.roadmap_code);
    const filled = isCellFilled(cell) ? 1 : 0;
    rows.set(cell.roadmap_code, {
      roadmap_code: cell.roadmap_code,
      band: cell.band,
      cells: (previous?.cells ?? 0) + 1,
      filled_cells: (previous?.filled_cells ?? 0) + filled,
      debt_cells: (previous?.debt_cells ?? 0) + 1 - filled,
    });
  }
  return [...rows.values()];
}

export function formatCoverage(rows: readonly CoverageRow[]): string[] {
  return rows.map(
    (row) =>
      `${row.roadmap_code} (band ${row.band}): ${row.filled_cells}/${row.cells} ô đã lấp, nợ ${row.debt_cells}`
  );
}

export function findOrphanLevels(
  ledger: ContentDemandLedger,
  levels: readonly DemandLevel[]
): string[] {
  const demanded = new Set(ledger.cells.map((cell) => cell.skill_code));
  return levels
    .filter((level) => !level.skill_codes.some((code) => demanded.has(code)))
    .map((level) => level.code)
    .sort();
}

export interface GenerationTarget {
  readonly skill_code: string;
  readonly band: RoadmapBand;
  readonly engine: string;
}

export type GenerationVerdict =
  | { readonly ok: true; readonly debt_cells: readonly DemandCell[] }
  | {
      readonly ok: false;
      readonly reason: "no_cell" | "no_debt" | "engine_not_valid";
      readonly message: string;
    };

export function checkGenerationTarget(
  ledger: ContentDemandLedger,
  target: GenerationTarget
): GenerationVerdict {
  const cells = ledger.cells.filter(
    (cell) =>
      cell.role === "practice" &&
      cell.skill_code === target.skill_code &&
      cell.band === target.band
  );
  if (cells.length === 0) {
    return {
      ok: false,
      reason: "no_cell",
      message: `Kỹ năng ${target.skill_code} không có ô thực hành nào ở band ${target.band} trong sổ cầu — level sinh ra sẽ mồ côi.`,
    };
  }
  const debt = cells.filter((cell) => !isCellFilled(cell));
  if (debt.length === 0) {
    return {
      ok: false,
      reason: "no_debt",
      message: `Mọi ô thực hành của ${target.skill_code} ở band ${target.band} đã lấp — không sinh thêm.`,
    };
  }
  const valid = debt.filter((cell) =>
    cell.template_codes.includes(target.engine)
  );
  if (valid.length === 0) {
    return {
      ok: false,
      reason: "engine_not_valid",
      message: `Khuôn ${target.engine} không nằm trong ma trận tương hợp của ${target.skill_code} ở các ô còn thiếu.`,
    };
  }
  return { ok: true, debt_cells: valid };
}

export interface DebtIncrease {
  readonly roadmap_code: string;
  readonly before: number;
  readonly after: number;
}

export function findDebtIncreases(
  committed: ContentDemandLedger,
  derived: ContentDemandLedger
): DebtIncrease[] {
  const before = new Map(
    summarizeCoverage(committed).map((row) => [row.roadmap_code, row])
  );
  const increases: DebtIncrease[] = [];
  for (const row of summarizeCoverage(derived)) {
    const old = before.get(row.roadmap_code);
    if (old !== undefined && row.debt_cells > old.debt_cells) {
      increases.push({
        roadmap_code: row.roadmap_code,
        before: old.debt_cells,
        after: row.debt_cells,
      });
    }
  }
  return increases;
}
