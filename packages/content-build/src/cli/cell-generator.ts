import fs from "node:fs";
import { repoPath } from "@mindkid/config/paths";
import type { AgeBand } from "@mindkid/game-engine/contracts";
import { getLevelGenerator } from "@mindkid/game-engine/generators";
import { ALL_TEMPLATES } from "@mindkid/game-engine/registry";
import { AGE_BANDS } from "@mindkid/shared";
import { ALL_SEED_LEVELS } from "#src/index";

export interface CellReport {
  readonly templateCode: string;
  readonly band: AgeBand;
  readonly existingComps: readonly string[];
  readonly missingComps: readonly string[];
  readonly isDeficit: boolean;
}

export interface CellSpec {
  engine: string;
  band: AgeBand;
  competency: string;
}

const VALID_BANDS = AGE_BANDS;
const VALID_COMPS: readonly string[] = ["C1", "C2", "C3", "C4", "C5", "C6"];
const MANUAL_ONLY_ENGINES = new Set(["GT-013", "GT-015"]);

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

function extractLevelCompetencies(skillCodes?: readonly string[]): Set<string> {
  const comps = new Set<string>();
  for (const s of skillCodes ?? []) {
    comps.add(s.slice(0, 2));
  }
  if (comps.size === 0) {
    comps.add("C1");
  }
  return comps;
}

function buildLevelCoverage(): Map<string, Set<string>> {
  const levelCoverage = new Map<string, Set<string>>();

  for (const level of ALL_SEED_LEVELS) {
    const tCode = level.header.template_code;
    const min = level.header.age_min ?? 3;
    const max = level.header.age_max ?? 6;
    const matchedBands = getMatchedBands(min, max);
    const comps = extractLevelCompetencies(level.header.skill_codes);

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

export function generateMatrixReport(): {
  totalCells: number;
  deficitCells: number;
  reports: CellReport[];
} {
  const levelCoverage = buildLevelCoverage();
  const reports: CellReport[] = [];
  let totalCells = 0;
  let deficitCells = 0;

  for (const template of Object.values(ALL_TEMPLATES)) {
    const banned = new Set(template.banned_age_bands ?? []);
    const validBands = VALID_BANDS.filter((b) => !banned.has(b));

    for (const band of validBands) {
      totalCells++;
      const key = `${template.code}::${band}`;
      const existing = Array.from(levelCoverage.get(key) ?? []).sort();
      const missing = VALID_COMPS.filter((c) => !existing.includes(c));
      const isDeficit = existing.length < 3;

      if (isDeficit) {
        deficitCells++;
      }

      reports.push({
        templateCode: template.code,
        band,
        existingComps: existing,
        missingComps: missing,
        isDeficit,
      });
    }
  }

  return { totalCells, deficitCells, reports };
}

function parseCellComponents(cellStr: string): {
  engine: string;
  bandStr: string;
  comp: string;
} {
  const parts = cellStr.split("/");
  if (parts.length !== 3) {
    throw new Error(
      "Cú pháp --cell phải là <engine>/<band>/<lĩnh vực>, ví dụ: GT-014/4-5/C3"
    );
  }
  return {
    engine: parts[0] ?? "",
    bandStr: parts[1] ?? "",
    comp: parts[2] ?? "",
  };
}

function validateEngineAndBand(engine: string, bandStr: string): AgeBand {
  if (MANUAL_ONLY_ENGINES.has(engine)) {
    throw new Error(
      `Engine ${engine} là dạng bài chỉ soạn tay, không hỗ trợ sinh tự động qua --cell.`
    );
  }

  const template = ALL_TEMPLATES[engine];
  if (!template) {
    throw new Error(`Engine '${engine}' không tồn tại trong ALL_TEMPLATES.`);
  }

  if (!VALID_BANDS.includes(bandStr as AgeBand)) {
    throw new Error(
      `Age band '${bandStr}' không hợp lệ. Phải là 3-4, 4-5 hoặc 5-6.`
    );
  }
  const band = bandStr as AgeBand;

  if (template.banned_age_bands?.includes(band)) {
    throw new Error(`Engine '${engine}' cấm age band '${band}'.`);
  }

  const generator = getLevelGenerator(engine);
  if (generator && !generator.axes.age_band.includes(band)) {
    throw new Error(
      `Engine '${engine}' không hỗ trợ band '${band}'. Band hợp lệ: ${generator.axes.age_band.join(", ")}.`
    );
  }

  return band;
}

function checkAllocationProhibition(
  engine: string,
  comp: string,
  configPath?: string
): void {
  const filePath =
    configPath ??
    repoPath(
      "packages/content-build/src/thresholds/engine-competency-allocation.json"
    );

  if (!fs.existsSync(filePath)) {
    return;
  }

  const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const engConf = raw.engines?.find((e: { code: string }) => e.code === engine);
  if (!engConf) {
    return;
  }

  const prohibited =
    engConf.prohibited_competencies?.map((p: { comp: string }) => p.comp) ?? [];
  if (prohibited.includes(comp)) {
    throw new Error(
      `Engine '${engine}' cấm phục vụ lĩnh vực '${comp}' theo bản đồ tương hợp.`
    );
  }
}

function checkCellCapacity(engine: string, band: AgeBand): void {
  const matrix = generateMatrixReport();
  const cellReport = matrix.reports.find(
    (r: CellReport) => r.templateCode === engine && r.band === band
  );
  if (cellReport && !cellReport.isDeficit) {
    throw new Error(
      `Ô ${engine}/${band} đã đạt K=3, không thể sinh thêm qua --cell.`
    );
  }
}

export function validateCellSpec(
  cellStr: string,
  configPath?: string
): CellSpec {
  const { engine, bandStr, comp } = parseCellComponents(cellStr);
  const band = validateEngineAndBand(engine, bandStr);

  if (!VALID_COMPS.includes(comp)) {
    throw new Error(`Lĩnh vực '${comp}' không hợp lệ. Phải là C1..C6.`);
  }

  checkAllocationProhibition(engine, comp, configPath);
  checkCellCapacity(engine, band);

  return { engine, band, competency: comp };
}

export function printCellMatrixReport(): void {
  const result = generateMatrixReport();
  console.log(
    "=== BÁO CÁO Ô MA TRẬN LEVEL CẦN SINH (TASK #161 / BR-LGK-12) ==="
  );
  console.log(`Tổng số ô hợp lệ: ${result.totalCells}`);
  console.log(`Số ô còn thiếu (chưa đủ K=3): ${result.deficitCells}`);
  console.log(
    "------------------------------------------------------------------"
  );
  console.log("Template | Band | Đã có | Còn thiếu | Ghi chú");
  console.log(
    "------------------------------------------------------------------"
  );

  for (const r of result.reports) {
    const padT = r.templateCode.padEnd(8);
    const padB = r.band.padEnd(4);
    const padE = (r.existingComps.join(",") || "(trống)").padEnd(10);
    const padM = (r.missingComps.join(",") || "(đủ)").padEnd(15);
    const note = MANUAL_ONLY_ENGINES.has(r.templateCode) ? "soạn tay" : "";
    console.log(`${padT} | ${padB} | ${padE} | ${padM} | ${note}`);
  }
}
