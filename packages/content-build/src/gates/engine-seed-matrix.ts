/**
 * Cổng kiểm tra ma trận seed mục 13 (Task #263 T13, BR-CSM-03).
 *
 * Kiểm tra đối chiếu bảng ma trận seed mục 13 của 37 phiếu engine với corpus level thực tế.
 * Phát hiện các ô thủng (thiếu level theo band x thinking tag).
 * Chế độ ratchet: quản lý số lượng ô thủng qua baseline, cấm tăng nợ.
 */

import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  ALL_TEMPLATES,
  type GameTemplate,
} from "@mindkid/game-engine/registry";
import type { AgeBand, SkillSeed } from "@mindkid/shared";
import type { ContentSeed } from "../types.js";

export interface SeedMatrixCellTarget {
  readonly tag: string;
  readonly target: number;
}

export interface SeedMatrixBandTarget {
  readonly band: AgeBand;
  readonly cells: readonly SeedMatrixCellTarget[];
  readonly totalTarget?: number;
}

export interface EngineSeedMatrixSpec {
  readonly engineCode: string;
  readonly bands: readonly SeedMatrixBandTarget[];
}

export interface SeedMatrixDeficit {
  readonly engine: string;
  readonly band: AgeBand;
  readonly tag: string;
  readonly actual: number;
  readonly target: number;
}

export interface SeedMatrixBaselineConfig {
  readonly max_deficits: number;
  readonly baseline_deficits: readonly {
    readonly engine: string;
    readonly band: AgeBand;
    readonly tag: string;
    readonly deficit: number;
  }[];
}

export interface SeedMatrixReport {
  readonly totalEngines: number;
  readonly totalTargetCells: number;
  readonly totalHoles: number;
  readonly maxDeficits: number;
  readonly passed: boolean;
  readonly deficits: readonly SeedMatrixDeficit[];
  readonly newHoles: readonly SeedMatrixDeficit[];
  readonly violations: readonly string[];
}

export const ERR_MISSING_SECTION_13 = "ERR_MISSING_SECTION_13";
export const ERR_MISSING_TABLE = "ERR_MISSING_TABLE";
export const ERR_MISSING_TAG_COLUMNS = "ERR_MISSING_TAG_COLUMNS";
export const ERR_NON_NUMERIC_CELL = "ERR_NON_NUMERIC_CELL";
export const ERR_MISSING_VALID_BAND = "ERR_MISSING_VALID_BAND";
export const ERR_EMPTY_SOURCE = "ERR_EMPTY_SOURCE";

const REGEX_SECTION_13 = /## 13\. Ma trận seed mục tiêu([\s\S]*?)(?=## 14\.|$)/;
const REGEX_NUMERIC_TARGET = /(?:≥|>=)?\s*(\d+)/;

export function toAgeBand(min: number, max: number): AgeBand | null {
  if (min === 3 && max === 4) {
    return "3-4";
  }
  if (min === 4 && max === 5) {
    return "4-5";
  }
  if (min === 5 && max === 6) {
    return "5-6";
  }
  return null;
}

export function getValidBandsForTemplate(template: {
  age_min?: number;
  age_max?: number;
  banned_age_bands?: readonly AgeBand[];
}): readonly AgeBand[] {
  const allBands: readonly { band: AgeBand; min: number; max: number }[] = [
    { band: "3-4", min: 3, max: 4 },
    { band: "4-5", min: 4, max: 5 },
    { band: "5-6", min: 5, max: 6 },
  ];
  return allBands
    .filter(({ band, min, max }) => {
      if (template.banned_age_bands?.includes(band)) {
        return false;
      }
      if (typeof template.age_min === "number" && min < template.age_min) {
        return false;
      }
      if (typeof template.age_max === "number" && max > template.age_max) {
        return false;
      }
      return true;
    })
    .map((b) => b.band);
}

function parseMatrixHeaders(
  headerLine: string,
  engineCode: string
): { tags: readonly string[]; hasTotal: boolean } {
  const headers = headerLine
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
  if (headers.length === 0 || !headers[0]?.toLowerCase().includes("band")) {
    throw new Error(
      `${ERR_MISSING_TABLE}: phiếu ${engineCode} bảng mục 13 cột đầu tiên phải là Band`
    );
  }

  const hasTotal = (headers.at(-1) ?? "").toLowerCase().includes("tổng");
  const tagHeaders = hasTotal ? headers.slice(1, -1) : headers.slice(1);

  if (tagHeaders.length === 0) {
    throw new Error(
      `${ERR_MISSING_TAG_COLUMNS}: phiếu ${engineCode} bảng mục 13 thiếu cột tag`
    );
  }

  const tags = tagHeaders.map((th) => {
    const cleaned = th.replace(/[`'"]/g, "").trim();
    if (!cleaned) {
      throw new Error(
        `${ERR_MISSING_TAG_COLUMNS}: phiếu ${engineCode} bảng mục 13 có cột tag rỗng`
      );
    }
    return cleaned;
  });

  return { tags, hasTotal };
}

function parseMatrixRow(
  rLine: string,
  tags: readonly string[],
  hasTotal: boolean,
  engineCode: string
): SeedMatrixBandTarget | null {
  const cols = rLine
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
  if (cols.length < 2) {
    return null;
  }

  const rawBand = (cols[0] ?? "").replace(/[`'"]/g, "").trim() as AgeBand;
  const cellTargets: SeedMatrixCellTarget[] = [];

  for (let i = 0; i < tags.length; i++) {
    const tag = tags[i] ?? "";
    const valStr = cols[i + 1] ?? "";
    const trimmed = valStr.trim();
    if (trimmed === "—" || trimmed === "-" || trimmed === "") {
      continue;
    }

    const numMatch = trimmed.match(REGEX_NUMERIC_TARGET);
    if (!numMatch?.[1]) {
      throw new Error(
        `${ERR_NON_NUMERIC_CELL}: phiếu ${engineCode} band ${rawBand} tag ${tag} ("${valStr}")`
      );
    }
    const target = Number.parseInt(numMatch[1], 10);
    cellTargets.push({ tag, target });
  }

  let totalTarget: number | undefined;
  if (hasTotal && cols.length > tags.length + 1) {
    const totStr = cols[tags.length + 1] ?? "";
    const totMatch = totStr.match(REGEX_NUMERIC_TARGET);
    if (totMatch?.[1]) {
      totalTarget = Number.parseInt(totMatch[1], 10);
    }
  }

  return { band: rawBand, cells: cellTargets, totalTarget };
}

/**
 * Parse bảng ma trận seed từ nội dung markdown của phiếu engine.
 */
export function parseSeedMatrixFromSpec(
  content: string,
  engineCode: string,
  template?: GameTemplate
): EngineSeedMatrixSpec {
  const match = content.match(REGEX_SECTION_13);
  if (!match) {
    throw new Error(
      `${ERR_MISSING_SECTION_13}: phiếu ${engineCode} thiếu Mục 13: Ma trận seed mục tiêu`
    );
  }

  const section = match[1] ?? "";
  const lines = section
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const tableLines = lines.filter((l) => l.startsWith("|") && l.endsWith("|"));
  if (tableLines.length < 3) {
    throw new Error(
      `${ERR_MISSING_TABLE}: phiếu ${engineCode} Mục 13 không có bảng hợp lệ`
    );
  }

  const { tags, hasTotal } = parseMatrixHeaders(
    tableLines[0] ?? "",
    engineCode
  );
  const rowLines = tableLines.slice(2);
  const bands: SeedMatrixBandTarget[] = [];
  const foundBands = new Set<string>();

  for (const rLine of rowLines) {
    const row = parseMatrixRow(rLine, tags, hasTotal, engineCode);
    if (row) {
      foundBands.add(row.band);
      bands.push(row);
    }
  }

  if (template) {
    const validBands = getValidBandsForTemplate(template);
    for (const vb of validBands) {
      if (!foundBands.has(vb)) {
        throw new Error(
          `${ERR_MISSING_VALID_BAND}: phiếu ${engineCode} thiếu hàng cho band ${vb}`
        );
      }
    }
  }

  return { engineCode, bands };
}

/**
 * Đọc baseline config từ file JSON.
 */
export function loadSeedMatrixBaseline(): SeedMatrixBaselineConfig {
  const configPath = resolve(
    import.meta.dirname,
    "../thresholds/seed-matrix-baseline.json"
  );
  const raw = readFileSync(configPath, "utf-8");
  return JSON.parse(raw) as SeedMatrixBaselineConfig;
}

export function buildSkillThinkingMap(
  skills: readonly SkillSeed[]
): ReadonlyMap<string, ReadonlySet<string>> {
  const map = new Map<string, ReadonlySet<string>>();
  for (const s of skills) {
    if (s.identity?.code && s.identity.thinking_processes) {
      map.set(s.identity.code, new Set(s.identity.thinking_processes));
    }
  }
  return map;
}

function levelMatchesTag(
  level: ContentSeed<unknown, unknown>,
  tag: string,
  skillThinkingMap?: ReadonlyMap<string, ReadonlySet<string>>
): boolean {
  if ((level.header.thinking_tags || []).includes(tag)) {
    return true;
  }
  if (skillThinkingMap) {
    for (const sc of level.header.skill_codes) {
      if (skillThinkingMap.get(sc)?.has(tag)) {
        return true;
      }
    }
  }
  return false;
}

function evaluateEngineDeficits(
  spec: EngineSeedMatrixSpec,
  engineLevels: readonly ContentSeed<unknown, unknown>[],
  skillThinkingMap?: ReadonlyMap<string, ReadonlySet<string>>
): { cellCount: number; deficits: SeedMatrixDeficit[] } {
  let cellCount = 0;
  const deficits: SeedMatrixDeficit[] = [];

  for (const b of spec.bands) {
    const bandLevels = engineLevels.filter((l) => {
      const band = toAgeBand(l.header.age_min, l.header.age_max);
      return band === b.band;
    });

    for (const cell of b.cells) {
      cellCount++;
      const actual = bandLevels.filter((l) =>
        levelMatchesTag(l, cell.tag, skillThinkingMap)
      ).length;

      if (actual < cell.target) {
        deficits.push({
          engine: spec.engineCode,
          band: b.band,
          tag: cell.tag,
          actual,
          target: cell.target,
        });
      }
    }
  }

  return { cellCount, deficits };
}

/**
 * Đánh giá ma trận seed mục 13 của 37 phiếu engine đối chiếu với corpus levels.
 */
export function evaluateEngineSeedMatrix(
  levels: readonly ContentSeed<unknown, unknown>[],
  specsDir: string,
  baseline?: SeedMatrixBaselineConfig,
  skillThinkingMap?: ReadonlyMap<string, ReadonlySet<string>>
): SeedMatrixReport {
  if (levels.length === 0) {
    throw new Error(ERR_EMPTY_SOURCE);
  }

  const baselineConfig = baseline ?? loadSeedMatrixBaseline();
  const baselineHoleKeys = new Set(
    baselineConfig.baseline_deficits.map(
      (d) => `${d.engine}::${d.band}::${d.tag}`
    )
  );

  const specFiles = readdirSync(specsDir)
    .filter((f) => f.startsWith("GT-") && f.endsWith(".md"))
    .sort();

  if (specFiles.length === 0) {
    throw new Error(
      `Không tìm thấy phiếu engine nào trong thư mục: ${specsDir}`
    );
  }

  let totalTargetCells = 0;
  const deficits: SeedMatrixDeficit[] = [];
  const newHoles: SeedMatrixDeficit[] = [];
  const violations: string[] = [];

  for (const file of specFiles) {
    const engineCode = file.replace(".md", "");
    const template = ALL_TEMPLATES[engineCode];
    const filePath = join(specsDir, file);
    const content = readFileSync(filePath, "utf-8");
    const spec = parseSeedMatrixFromSpec(content, engineCode, template);

    const engineLevels = levels.filter(
      (l) => l.header.template_code === engineCode
    );

    const result = evaluateEngineDeficits(spec, engineLevels, skillThinkingMap);
    totalTargetCells += result.cellCount;

    for (const d of result.deficits) {
      deficits.push(d);
      const holeKey = `${d.engine}::${d.band}::${d.tag}`;
      if (!baselineHoleKeys.has(holeKey)) {
        newHoles.push(d);
        violations.push(
          `Ô thủng mới ngoài baseline: ${d.engine} band ${d.band} tag '${d.tag}' (có ${d.actual}, cần ${d.target})`
        );
      }
    }
  }

  if (deficits.length > baselineConfig.max_deficits) {
    violations.push(
      `Tổng số ô thủng ${deficits.length} vượt trần ratchet (${baselineConfig.max_deficits})`
    );
  }

  return {
    totalEngines: specFiles.length,
    totalTargetCells,
    totalHoles: deficits.length,
    maxDeficits: baselineConfig.max_deficits,
    passed: violations.length === 0,
    deficits,
    newHoles,
    violations,
  };
}

/**
 * Định dạng báo cáo kiểm tra ma trận seed.
 */
export function formatSeedMatrixReport(report: SeedMatrixReport): string {
  const lines: string[] = [];
  lines.push("=== CỔNG CHECK:ENGINE-SEED-MATRIX (Task #263 T13) ===");
  lines.push(`Tổng số phiếu engine đã quét: ${report.totalEngines}`);
  lines.push(`Tổng số ô có mục tiêu: ${report.totalTargetCells}`);
  lines.push(
    `Số ô thủng: ${report.totalHoles} (trần ratchet: ${report.maxDeficits})`
  );

  if (report.deficits.length > 0) {
    lines.push("\nDanh sách các ô thủng:");
    for (const d of report.deficits) {
      lines.push(
        `  ${d.engine} ${d.band} ${d.tag}: có ${d.actual}, cần ${d.target}`
      );
    }
  }

  if (report.violations.length > 0) {
    lines.push("\nCác vi phạm:");
    for (const v of report.violations) {
      lines.push(`  ✗ ${v}`);
    }
  }

  if (report.passed) {
    lines.push(
      "\n✓ Tất cả các ô thủng nằm trong baseline nợ chuyển tiếp và không vượt trần."
    );
  } else {
    lines.push("\n✗ Cổng không đạt chuẩn ma trận seed ratchet.");
  }

  return lines.join("\n");
}
