import fs from "node:fs";
import { repoPath } from "@mindkid/config/paths";
import { type AgeBand, ALL_TEMPLATES } from "@mindkid/game-engine/registry";
import { z } from "zod";
import { ALL_SEED_LEVELS } from "../catalog.js";
import type { ContentSeed } from "../types.js";

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
  band: z.enum(["3-4", "4-5", "5-6"]),
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

export type EngineAllocationConfig = z.infer<
  typeof EngineAllocationConfigSchema
>;

const ALL_BANDS: readonly AgeBand[] = ["3-4", "4-5", "5-6"];

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

export interface AllocationCheckResult {
  readonly valid: boolean;
  readonly k: number;
  readonly totalCells: number;
  readonly deficitCells: number;
  readonly violations: readonly string[];
  readonly exceptionsCount: number;
}

function buildProhibitedMap(
  engines: readonly z.infer<typeof EngineAffinityEntrySchema>[]
): Map<string, Set<string>> {
  const prohibitedMap = new Map<string, Set<string>>();
  for (const eng of engines) {
    const proSet = new Set(eng.prohibited_competencies.map((p) => p.comp));
    prohibitedMap.set(eng.code, proSet);
  }
  return prohibitedMap;
}

function extractLevelCompetencies(
  level: ContentSeed,
  prohibitedMap: Map<string, Set<string>>,
  violations: string[]
): Set<string> {
  const tCode = level.header.template_code;
  const proSet = prohibitedMap.get(tCode);
  const comps = new Set<string>();

  for (const s of level.header.skill_codes ?? []) {
    const comp = s.slice(0, 2);
    if (proSet?.has(comp)) {
      violations.push(
        `Level ${level.header.code} thuộc engine ${tCode} gắn lĩnh vực bị cấm: ${comp}`
      );
    }
    comps.add(comp);
  }

  if (comps.size === 0) {
    comps.add("C1");
  }

  return comps;
}

function processLevelsCoverage(
  prohibitedMap: Map<string, Set<string>>,
  violations: string[]
): Map<string, Set<string>> {
  const levelCoverage = new Map<string, Set<string>>();

  for (const level of ALL_SEED_LEVELS) {
    const tCode = level.header.template_code;
    const min = level.header.age_min ?? 3;
    const max = level.header.age_max ?? 6;
    const matchedBands = getMatchedBands(min, max);
    const comps = extractLevelCompetencies(level, prohibitedMap, violations);

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

function evaluateCells(
  levelCoverage: Map<string, Set<string>>,
  exceptionMap: Set<string>,
  k: number
): { totalCells: number; deficitCells: number } {
  let totalCells = 0;
  let deficitCells = 0;

  for (const template of Object.values(ALL_TEMPLATES)) {
    const banned = new Set(template.banned_age_bands ?? []);
    const validBands = ALL_BANDS.filter((b) => !banned.has(b));

    for (const band of validBands) {
      totalCells++;
      const cellKey = `${template.code}::${band}`;
      if (exceptionMap.has(cellKey)) {
        continue;
      }

      const existing = levelCoverage.get(cellKey) ?? new Set();
      if (existing.size < k) {
        deficitCells++;
      }
    }
  }

  return { totalCells, deficitCells };
}

export function runEngineAllocationGate(
  configPath?: string
): AllocationCheckResult {
  const filePath =
    configPath ??
    repoPath(
      "packages/content-build/src/thresholds/engine-competency-allocation.json"
    );

  if (!fs.existsSync(filePath)) {
    throw new Error(`Không tìm thấy file cấu hình: ${filePath}`);
  }

  const rawJson = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const config = EngineAllocationConfigSchema.parse(rawJson);
  const violations: string[] = [];

  if (config.exceptions.length > config.exception_cap) {
    violations.push(
      `Số lượng ngoại lệ (${config.exceptions.length}) vượt quá trần cho phép (${config.exception_cap})`
    );
  }

  const exceptionMap = new Set<string>();
  for (const ex of config.exceptions) {
    exceptionMap.add(`${ex.engine}::${ex.band}`);
  }

  const prohibitedMap = buildProhibitedMap(config.engines);
  const levelCoverage = processLevelsCoverage(prohibitedMap, violations);
  const { totalCells, deficitCells } = evaluateCells(
    levelCoverage,
    exceptionMap,
    config.k
  );

  const valid = violations.length === 0 && deficitCells === 0;

  return {
    valid,
    k: config.k,
    totalCells,
    deficitCells,
    violations,
    exceptionsCount: config.exceptions.length,
  };
}

export function reportEngineAllocation(): boolean {
  try {
    const result = runEngineAllocationGate();
    console.log(`check:engine-allocation  K=${result.k}`);
    console.log(
      `  Tổng ô: ${result.totalCells}, đạt: ${result.totalCells - result.deficitCells}, thiếu: ${result.deficitCells}`
    );
    console.log(`  Ngoại lệ đang bật: ${result.exceptionsCount}`);

    if (result.violations.length > 0) {
      console.error("  Các vi phạm phát hiện:");
      for (const v of result.violations) {
        console.error(`    - ${v}`);
      }
    }

    return result.valid;
  } catch (err) {
    console.error("Lỗi khi chạy check:engine-allocation:", err);
    return false;
  }
}

if (
  process.env.NODE_ENV !== "test" &&
  process.argv[1]?.includes("allocation.ts")
) {
  const ok = reportEngineAllocation();
  if (!ok) {
    process.exit(1);
  }
}
