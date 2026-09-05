import { type AgeBand, ALL_TEMPLATES } from "@mindkid/game-engine/registry";
import { ALL_SEED_LEVELS } from "../src/index.js";

export interface CellReport {
  readonly templateCode: string;
  readonly band: AgeBand;
  readonly existingComps: readonly string[];
  readonly missingComps: readonly string[];
  readonly isDeficit: boolean;
}

const ALL_BANDS: readonly AgeBand[] = ["3-4", "4-5", "5-6"];
const ALL_COMPS: readonly string[] = ["C1", "C2", "C3", "C4", "C5", "C6"];

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
    const validBands = ALL_BANDS.filter((b) => !banned.has(b));

    for (const band of validBands) {
      totalCells++;
      const key = `${template.code}::${band}`;
      const existing = Array.from(levelCoverage.get(key) ?? []).sort();
      const missing = ALL_COMPS.filter((c) => !existing.includes(c));
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

function main(): void {
  const result = generateMatrixReport();
  console.log(
    "=== BÁO CÁO NGÂN SÁCH MA TRẬN 6 LĨNH VỰC × BAND TUỔI (TASK #157) ==="
  );
  console.log(`Tổng số ô hợp lệ: ${result.totalCells}`);
  console.log(`Số ô chưa đủ K=3: ${result.deficitCells}`);
  console.log(
    "------------------------------------------------------------------"
  );
  console.log("Template | Band | Lĩnh vực đã có | Lĩnh vực còn thiếu");
  console.log(
    "------------------------------------------------------------------"
  );

  for (const r of result.reports.slice(0, 30)) {
    const padT = r.templateCode.padEnd(8);
    const padB = r.band.padEnd(4);
    const padE = r.existingComps.join(",").padEnd(14);
    const padM = r.missingComps.join(",");
    console.log(`${padT} | ${padB} | ${padE} | ${padM}`);
  }

  if (result.reports.length > 30) {
    console.log(`... và ${result.reports.length - 30} ô khác.`);
  }
}

if (process.env.NODE_ENV !== "test") {
  main();
}
