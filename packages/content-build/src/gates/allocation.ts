import fs from "node:fs";
import { repoPath } from "@mindkid/config/paths";
import { type AgeBand, ALL_TEMPLATES } from "@mindkid/game-engine/registry";
import { AGE_BANDS } from "@mindkid/shared";
import { z } from "zod";
import { ALL_SEED_LEVELS } from "#src/catalog";
import type { ContentSeed } from "#src/types";

export const EngineAffinityItemSchema = z.object({
  comp: z.string(),
  reason: z.string(),
});

export const EngineAffinityEntrySchema = z.object({
  code: z.string(),
  name: z.string(),
  mechanic: z.string(),
  allowed_competencies: z.array(EngineAffinityItemSchema),
  prohibited_competencies: z.array(EngineAffinityItemSchema),
});

export const CellExceptionSchema = z.object({
  engine: z.string(),
  band: z.enum(AGE_BANDS),
  reason: z.string().min(1),
  decided_by: z.string().min(1),
  date: z.string().min(1),
});

export const EngineAllocationConfigSchema = z.object({
  date: z.string(),
  version: z.string(),
  k: z.number().int().min(1),
  exception_cap: z.number().int().min(0),
  description: z.string(),
  engines: z.array(EngineAffinityEntrySchema),
  exceptions: z.array(CellExceptionSchema).default([]),
});

export type CellException = z.infer<typeof CellExceptionSchema>;
export type EngineAllocationConfig = z.infer<
  typeof EngineAllocationConfigSchema
>;

export interface AllocationCellDeficit {
  readonly cell: string;
  readonly engine: string;
  readonly band: AgeBand;
  readonly actualCount: number;
  readonly requiredCount: number;
  readonly existingCompetencies: readonly string[];
  readonly missingCompetencies: readonly string[];
}

export interface AllocationProhibitedViolation {
  readonly key: string;
  readonly levelCode: string;
  readonly engine: string;
  readonly competency: string;
  readonly message: string;
}

export interface AllocationCheckResult {
  readonly valid: boolean;
  readonly k: number;
  readonly totalCells: number;
  readonly deficitCells: number;
  readonly violations: readonly string[];
  readonly exceptionsCount: number;
  readonly exceptionCap: number;
  readonly exceptions: readonly CellException[];
  readonly cellDeficits: readonly AllocationCellDeficit[];
  readonly prohibitedViolations: readonly AllocationProhibitedViolation[];
}

const ALL_BANDS = AGE_BANDS;
const DEFAULT_COMPETENCIES = ["C1", "C2", "C3", "C4", "C5", "C6"] as const;

function getMatchedBands(min: number, max: number): AgeBand[] {
  const matchedBands: AgeBand[] = [];
  if (min <= 4 && max >= 3) {
    matchedBands.push("3-4");
  }
  if (min <= 5 && max >= 4) {
    matchedBands.push("4-5");
  }
  if (min <= 6 && max >= 5) {
    matchedBands.push("5-6");
  }
  return matchedBands;
}

function buildAffinityMaps(
  engines: readonly z.infer<typeof EngineAffinityEntrySchema>[]
): {
  prohibitedMap: Map<string, Set<string>>;
  allowedMap: Map<string, readonly string[]>;
} {
  const prohibitedMap = new Map<string, Set<string>>();
  const allowedMap = new Map<string, readonly string[]>();
  for (const eng of engines) {
    prohibitedMap.set(
      eng.code,
      new Set(eng.prohibited_competencies.map((p) => p.comp))
    );
    allowedMap.set(
      eng.code,
      eng.allowed_competencies.map((a) => a.comp)
    );
  }
  return { prohibitedMap, allowedMap };
}

function extractLevelCompetencies(
  level: ContentSeed,
  prohibitedMap: Map<string, Set<string>>,
  prohibitedViolations: AllocationProhibitedViolation[],
  violations: string[]
): Set<string> {
  const tCode = level.header.template_code;
  const proSet = prohibitedMap.get(tCode);
  const comps = new Set<string>();

  for (const s of level.header.skill_codes ?? []) {
    const comp = s.slice(0, 2);
    if (proSet?.has(comp)) {
      const msg = `[BR-ECA-03] Level ${level.header.code} thuộc engine ${tCode} gắn lĩnh vực bị cấm: ${comp}`;
      violations.push(msg);
      prohibitedViolations.push({
        key: `${level.header.code}::${tCode}::${comp}`,
        levelCode: level.header.code,
        engine: tCode,
        competency: comp,
        message: msg,
      });
    }
    comps.add(comp);
  }

  if (comps.size === 0) {
    comps.add("C1");
  }

  return comps;
}

function processLevelsCoverage(
  levels: readonly ContentSeed[],
  prohibitedMap: Map<string, Set<string>>,
  prohibitedViolations: AllocationProhibitedViolation[],
  violations: string[]
): Map<string, Set<string>> {
  const levelCoverage = new Map<string, Set<string>>();

  for (const level of levels) {
    const tCode = level.header.template_code;
    const min = level.header.age_min ?? 3;
    const max = level.header.age_max ?? 6;
    const matchedBands = getMatchedBands(min, max);
    const comps = extractLevelCompetencies(
      level,
      prohibitedMap,
      prohibitedViolations,
      violations
    );

    for (const band of matchedBands) {
      const key = `${tCode}::${band}`;
      let current = levelCoverage.get(key);
      if (!current) {
        current = new Set();
        levelCoverage.set(key, current);
      }
      for (const c of comps) {
        current.add(c);
      }
    }
  }

  return levelCoverage;
}

function buildCellDeficit(
  engine: string,
  band: AgeBand,
  existing: Set<string>,
  allowed: readonly string[],
  k: number
): { deficit: AllocationCellDeficit; violationMessage: string } {
  const cellKey = `${engine}::${band}`;
  const existingList = [...existing].sort();
  const missingList = allowed.filter((c) => !existing.has(c));
  const existingStr =
    existingList.length > 0 ? existingList.join(", ") : "trống";
  return {
    deficit: {
      cell: cellKey,
      engine,
      band,
      actualCount: existing.size,
      requiredCount: k,
      existingCompetencies: existingList,
      missingCompetencies: missingList,
    },
    violationMessage: `[BR-ECA-02] Ô ${cellKey} có ${existing.size}/${k} lĩnh vực (${existingStr}), thiếu: ${missingList.join(", ")}`,
  };
}

function evaluateCells(
  levelCoverage: Map<string, Set<string>>,
  allowedMap: Map<string, readonly string[]>,
  exceptionMap: Set<string>,
  k: number,
  violations: string[]
): {
  totalCells: number;
  deficitCells: number;
  cellDeficits: AllocationCellDeficit[];
} {
  let totalCells = 0;
  let deficitCells = 0;
  const cellDeficits: AllocationCellDeficit[] = [];

  for (const template of Object.values(ALL_TEMPLATES)) {
    const banned = new Set(template.banned_age_bands ?? []);
    const validBands = ALL_BANDS.filter((b) => !banned.has(b));
    const allowed = allowedMap.get(template.code) ?? DEFAULT_COMPETENCIES;

    for (const band of validBands) {
      totalCells++;
      const cellKey = `${template.code}::${band}`;
      if (exceptionMap.has(cellKey)) {
        continue;
      }

      const existing = levelCoverage.get(cellKey) ?? new Set<string>();
      if (existing.size < k) {
        deficitCells++;
        const { deficit, violationMessage } = buildCellDeficit(
          template.code,
          band,
          existing,
          allowed,
          k
        );
        cellDeficits.push(deficit);
        violations.push(violationMessage);
      }
    }
  }

  return { totalCells, deficitCells, cellDeficits };
}

function resolveAllocationConfig(
  configOrPath?: string | EngineAllocationConfig
): EngineAllocationConfig {
  if (typeof configOrPath === "object" && configOrPath !== null) {
    return EngineAllocationConfigSchema.parse(configOrPath);
  }
  const filePath =
    configOrPath ??
    repoPath(
      "packages/content-build/src/thresholds/engine-competency-allocation.json"
    );

  if (!fs.existsSync(filePath)) {
    throw new Error(`Không tìm thấy file cấu hình: ${filePath}`);
  }

  const rawJson = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return EngineAllocationConfigSchema.parse(rawJson);
}

export function runEngineAllocationGate(
  configOrPath?: string | EngineAllocationConfig,
  customLevels?: readonly ContentSeed[]
): AllocationCheckResult {
  const config = resolveAllocationConfig(configOrPath);
  const levels = customLevels ?? ALL_SEED_LEVELS;
  if (levels.length === 0) {
    throw new Error(
      "BR-ECA-08: Nguồn corpus level rỗng hoặc không đọc được, dừng tiến trình."
    );
  }

  const violations: string[] = [];
  const prohibitedViolations: AllocationProhibitedViolation[] = [];

  if (config.exceptions.length > config.exception_cap) {
    violations.push(
      `[BR-ECA-07] Số lượng ngoại lệ (${config.exceptions.length}) vượt quá trần cho phép (${config.exception_cap})`
    );
  }

  const exceptionMap = new Set<string>();
  for (const ex of config.exceptions) {
    exceptionMap.add(`${ex.engine}::${ex.band}`);
  }

  const { prohibitedMap, allowedMap } = buildAffinityMaps(config.engines);
  const levelCoverage = processLevelsCoverage(
    levels,
    prohibitedMap,
    prohibitedViolations,
    violations
  );
  const { totalCells, deficitCells, cellDeficits } = evaluateCells(
    levelCoverage,
    allowedMap,
    exceptionMap,
    config.k,
    violations
  );

  const valid = violations.length === 0 && deficitCells === 0;

  return {
    valid,
    k: config.k,
    totalCells,
    deficitCells,
    violations,
    exceptionsCount: config.exceptions.length,
    exceptionCap: config.exception_cap,
    exceptions: config.exceptions,
    cellDeficits,
    prohibitedViolations,
  };
}

export const EngineAllocationDebtSchema = z.object({
  recorded_at: z.string().min(1),
  note: z.string().min(1),
  max_deficit_cells: z.number().int().min(0),
  max_prohibited_violations: z.number().int().min(0),
  deficit_cells: z.array(z.string().min(1)),
  prohibited_levels: z.array(z.string().min(1)),
});

export type EngineAllocationDebt = z.infer<typeof EngineAllocationDebtSchema>;

export interface EngineAllocationDebtEvaluation {
  readonly passed: boolean;
  readonly newDeficitCells: readonly AllocationCellDeficit[];
  readonly newProhibitedViolations: readonly AllocationProhibitedViolation[];
  readonly unexcusedViolations: readonly string[];
  readonly staleDebt: readonly string[];
}

const ALLOCATION_DEBT_PATH =
  "packages/content-build/src/thresholds/engine-allocation-debt.json";

export function loadEngineAllocationDebt(
  customPath?: string
): EngineAllocationDebt {
  const filePath = customPath ?? repoPath(ALLOCATION_DEBT_PATH);
  if (!fs.existsSync(filePath)) {
    return {
      recorded_at: "",
      note: "Không tìm thấy engine-allocation-debt.json — trần mặc định 0.",
      max_deficit_cells: 0,
      max_prohibited_violations: 0,
      deficit_cells: [],
      prohibited_levels: [],
    };
  }
  const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return EngineAllocationDebtSchema.parse(raw);
}

export function evaluateEngineAllocationWithDebt(
  result: AllocationCheckResult,
  debt: EngineAllocationDebt = loadEngineAllocationDebt()
): EngineAllocationDebtEvaluation {
  const debtCells = new Set(debt.deficit_cells);
  const debtProhibited = new Set(debt.prohibited_levels);

  const newDeficitCells = result.cellDeficits.filter(
    (d) => !debtCells.has(d.cell)
  );
  const newProhibitedViolations = result.prohibitedViolations.filter(
    (p) => !debtProhibited.has(p.key)
  );

  const unexcusedViolations: string[] = [
    ...result.violations.filter((v) => v.startsWith("[BR-ECA-07]")),
    ...newDeficitCells.map(
      (d) =>
        `[BR-ECA-02] Ô thiếu mới ngoài baseline: ${d.cell} (có ${d.actualCount}/${d.requiredCount} lĩnh vực, thiếu: ${d.missingCompetencies.join(", ")})`
    ),
    ...newProhibitedViolations.map((p) => p.message),
  ];

  if (result.deficitCells > debt.max_deficit_cells) {
    unexcusedViolations.push(
      `[BR-ECA-02] Tổng số ô thiếu (${result.deficitCells}) vượt trần baseline (${debt.max_deficit_cells})`
    );
  }
  if (result.prohibitedViolations.length > debt.max_prohibited_violations) {
    unexcusedViolations.push(
      `[BR-ECA-03] Tổng số level gắn lĩnh vực cấm (${result.prohibitedViolations.length}) vượt trần baseline (${debt.max_prohibited_violations})`
    );
  }

  const seenCells = new Set(result.cellDeficits.map((d) => d.cell));
  const seenProhibited = new Set(result.prohibitedViolations.map((p) => p.key));
  const staleDebt: string[] = [];

  for (const cell of debt.deficit_cells) {
    if (!seenCells.has(cell)) {
      staleDebt.push(
        `[DEBT-STALE] Ô ${cell} đã đạt đủ K=${result.k} lĩnh vực, cần gỡ khỏi engine-allocation-debt.json`
      );
    }
  }
  for (const key of debt.prohibited_levels) {
    if (!seenProhibited.has(key)) {
      staleDebt.push(
        `[DEBT-STALE] Mục nợ lĩnh vực cấm ${key} đã được sửa, cần gỡ khỏi engine-allocation-debt.json`
      );
    }
  }

  return {
    passed: unexcusedViolations.length === 0 && staleDebt.length === 0,
    newDeficitCells,
    newProhibitedViolations,
    unexcusedViolations,
    staleDebt,
  };
}

export function formatEngineAllocationReport(
  result: AllocationCheckResult
): string {
  const lines: string[] = [];
  lines.push(`check:engine-allocation  K=${result.k}`);
  lines.push(
    `  Tổng ô: ${result.totalCells}, đạt: ${result.totalCells - result.deficitCells}, thiếu: ${result.deficitCells}`
  );
  lines.push(
    `  Ngoại lệ đang bật (BR-ECA-06): ${result.exceptionsCount}/${result.exceptionCap}`
  );
  for (const ex of result.exceptions) {
    lines.push(
      `    • ${ex.engine}::${ex.band} — ${ex.reason} (duyệt: ${ex.decided_by}, ngày: ${ex.date})`
    );
  }

  if (result.cellDeficits.length > 0) {
    lines.push("  Danh sách ô thiếu lĩnh vực (BR-ECA-02 / BR-ECA-09):");
    for (const d of result.cellDeficits) {
      const existingStr =
        d.existingCompetencies.length > 0
          ? d.existingCompetencies.join(", ")
          : "trống";
      lines.push(
        `    - ${d.cell}: có ${d.actualCount}/${d.requiredCount} (${existingStr}) -> thiếu [${d.missingCompetencies.join(", ")}]`
      );
    }
  }

  if (result.prohibitedViolations.length > 0) {
    lines.push(
      `  Vi phạm lĩnh vực bị cấm (BR-ECA-03): ${result.prohibitedViolations.length} level`
    );
    for (const p of result.prohibitedViolations) {
      lines.push(`    - ${p.message}`);
    }
  }

  return lines.join("\n");
}

export function reportEngineAllocation(): boolean {
  try {
    const result = runEngineAllocationGate();
    console.log(formatEngineAllocationReport(result));
    return result.valid;
  } catch (err) {
    console.error("Lỗi khi chạy check:engine-allocation:", err);
    return false;
  }
}
