import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Spec sở hữu: docs/specs/05-content/montessori-game-level-batch.md mục 7.5
 * Rule sở hữu: BR-MGL-01, D-RQ
 *
 * Ba chỗ cùng nói một con số về corpus Montessori: bảng tra dạng bài, mục 7.5 của spec,
 * và chính seeder. Trước T99 WP99.0 chúng lệch nhau (57 · 33 · 24 so với 59 · 34 · 25),
 * và không cổng nào bắt. Cổng này đếm lại từ nguồn rồi so với số đã viết.
 */

export interface MontessoriCorpusViolation {
  readonly rule: string;
  readonly source: string;
  readonly message: string;
}

export interface CorpusCounts {
  readonly total: number;
  readonly accepted: number;
  readonly deferred: number;
  readonly batchA: number;
  readonly batchB: number;
  readonly workbooks: number;
  readonly sourceByCompetency: Readonly<Record<string, number>>;
  readonly acceptedByCompetency: Readonly<Record<string, number>>;
  readonly duplicates: readonly string[];
}

export interface SeededCounts {
  readonly activityTypes: number;
  readonly levels: number;
  readonly typesByCompetency: Readonly<Record<string, number>>;
  readonly levelsByCompetency: Readonly<Record<string, number>>;
}

const TABLE_ROW_REGEX = /^\|\s*`(WB\d{2}-D\d)`\s*\|([^\n]*)$/gm;
const DEFERRED_CELL = "*Hoãn*";
const BATCH_A_CELL = "**Nhận (Lô A)**";
const SPEC_SECTION_START = "### 7.5";
const SPEC_SECTION_END = "### 7.6";
const SPEC_ROW_REGEX = /^\|\s*(C[1-6])\s*\|([^\n]*)$/gm;
const SPEC_TOTAL_REGEX = /^\|\s*\*\*Tổng\*\*\s*\|([^\n]*)$/m;
const SUMMARY_ROW_REGEX = /^\|\s*([^|]+?)\s*\|\s*\*{0,2}(\d+)\*{0,2}\s*\|$/gm;
const WB_CODE_REGEX = /WB\d{2}-D\d/g;
const LEVEL_CODE_REGEX = /code:\s*"(GL-(C[1-6])-[A-Z0-9-]+)"/g;
const COMPETENCY_DIR_REGEX = /^c[1-6]$/;
const MONTESSORI_SEEDER_PREFIX = "seed-mont-";

function bump(counter: Record<string, number>, key: string): void {
  counter[key] = (counter[key] ?? 0) + 1;
}

function cells(row: string): string[] {
  return row.split("|").map((c) => c.trim());
}

interface CorpusRowState {
  seen: Set<string>;
  duplicates: string[];
  workbooks: Set<string>;
  sourceByCompetency: Record<string, number>;
  acceptedByCompetency: Record<string, number>;
  accepted: number;
  deferred: number;
  batchA: number;
  batchB: number;
}

function processCorpusRow(
  code: string,
  matchRow: string,
  state: CorpusRowState
): void {
  const [, competency, , , , status] = cells(matchRow);
  if (state.seen.has(code)) {
    state.duplicates.push(code);
  }
  state.seen.add(code);
  state.workbooks.add(code.slice(0, 4));
  if (competency) {
    bump(state.sourceByCompetency, competency);
  }
  if (status === DEFERRED_CELL) {
    state.deferred++;
    return;
  }
  state.accepted++;
  if (competency) {
    bump(state.acceptedByCompetency, competency);
  }
  if (status === BATCH_A_CELL) {
    state.batchA++;
  } else {
    state.batchB++;
  }
}

/** Đếm lại từ mục 1 của bảng tra — nguồn sự thật cho mọi con số khác. */
export function countCorpusTable(markdown: string): CorpusCounts {
  const state: CorpusRowState = {
    sourceByCompetency: {},
    acceptedByCompetency: {},
    seen: new Set<string>(),
    duplicates: [],
    workbooks: new Set<string>(),
    accepted: 0,
    deferred: 0,
    batchA: 0,
    batchB: 0,
  };

  TABLE_ROW_REGEX.lastIndex = 0;
  let match = TABLE_ROW_REGEX.exec(markdown);
  while (match !== null) {
    const code = match[1];
    const matchRow = match[2];
    if (code && matchRow) {
      processCorpusRow(code, matchRow, state);
    }
    match = TABLE_ROW_REGEX.exec(markdown);
  }

  return {
    total: state.seen.size,
    accepted: state.accepted,
    deferred: state.deferred,
    batchA: state.batchA,
    batchB: state.batchB,
    workbooks: state.workbooks.size,
    sourceByCompetency: state.sourceByCompetency,
    acceptedByCompetency: state.acceptedByCompetency,
    duplicates: state.duplicates,
  };
}

interface SeedTally {
  readonly activityTypes: Set<string>;
  readonly typesByCompetency: Record<string, number>;
  readonly levelsByCompetency: Record<string, number>;
  levels: number;
}

function tallySeederFile(
  content: string,
  competency: string,
  tally: SeedTally
): void {
  for (const code of content.match(WB_CODE_REGEX) ?? []) {
    if (!tally.activityTypes.has(code)) {
      tally.activityTypes.add(code);
      bump(tally.typesByCompetency, competency);
    }
  }
  LEVEL_CODE_REGEX.lastIndex = 0;
  let level = LEVEL_CODE_REGEX.exec(content);
  while (level !== null) {
    tally.levels++;
    if (level[2]) {
      bump(tally.levelsByCompetency, level[2]);
    }
    level = LEVEL_CODE_REGEX.exec(content);
  }
}

function seederFiles(dirPath: string): string[] {
  return readdirSync(dirPath)
    .sort()
    .filter((file) => file.startsWith(MONTESSORI_SEEDER_PREFIX));
}

function competencyDirs(seedContentDir: string): string[] {
  return readdirSync(seedContentDir)
    .sort()
    .filter(
      (dir) =>
        COMPETENCY_DIR_REGEX.test(dir) &&
        statSync(join(seedContentDir, dir)).isDirectory()
    );
}

/** Đếm lại từ chính seeder: dạng bài đã soạn và level đã soạn của lô Montessori. */
export function countSeededLevels(seedContentDir: string): SeededCounts {
  const tally: SeedTally = {
    activityTypes: new Set(),
    typesByCompetency: {},
    levelsByCompetency: {},
    levels: 0,
  };

  for (const dir of competencyDirs(seedContentDir)) {
    const dirPath = join(seedContentDir, dir);
    for (const file of seederFiles(dirPath)) {
      tallySeederFile(
        readFileSync(join(dirPath, file), "utf8"),
        dir.toUpperCase(),
        tally
      );
    }
  }

  return {
    activityTypes: tally.activityTypes.size,
    levels: tally.levels,
    typesByCompetency: tally.typesByCompetency,
    levelsByCompetency: tally.levelsByCompetency,
  };
}

function compare(
  violations: MontessoriCorpusViolation[],
  rule: string,
  source: string,
  label: string,
  written: number | undefined,
  measured: number
): void {
  if (written !== measured) {
    violations.push({
      rule,
      source,
      message: `${label}: viết ${written ?? "thiếu"}, đo được ${measured}.`,
    });
  }
}

function readSummary(markdown: string): Record<string, number> {
  const summary: Record<string, number> = {};
  SUMMARY_ROW_REGEX.lastIndex = 0;
  let row = SUMMARY_ROW_REGEX.exec(markdown);
  while (row !== null) {
    if (row[1] && row[2]) {
      summary[row[1].replaceAll("*", "").trim()] = Number(row[2]);
    }
    row = SUMMARY_ROW_REGEX.exec(markdown);
  }
  return summary;
}

function checkTableSummary(
  markdown: string,
  counts: CorpusCounts
): MontessoriCorpusViolation[] {
  const violations: MontessoriCorpusViolation[] = [];
  const summary = readSummary(markdown);
  const table = "activity-types-table.md";
  compare(
    violations,
    "D-RQ",
    table,
    "Tổng số dạng bài trong nguồn",
    summary["Tổng số dạng bài trong nguồn"],
    counts.total
  );
  compare(
    violations,
    "D-RQ",
    table,
    "Số workbook",
    summary["Số workbook"],
    counts.workbooks
  );
  compare(
    violations,
    "D-RQ",
    table,
    "Dạng bài Lô A nhận đợt này",
    summary["Dạng bài Lô A nhận đợt này"],
    counts.batchA
  );
  compare(
    violations,
    "D-RQ",
    table,
    "Dạng bài Lô B nhận đợt này",
    summary["Dạng bài Lô B nhận đợt này"],
    counts.batchB
  );
  compare(
    violations,
    "D-RQ",
    table,
    "Tổng nhận đợt này",
    summary["Tổng nhận đợt này"],
    counts.accepted
  );
  compare(
    violations,
    "D-RQ",
    table,
    "Dạng bài hoãn sang đợt sau (`D-RQ`)",
    summary["Dạng bài hoãn sang đợt sau (`D-RQ`)"],
    counts.deferred
  );
  for (const code of counts.duplicates) {
    violations.push({
      rule: "BR-MGL-02",
      source: table,
      message: `Mã dạng bài ${code} xuất hiện nhiều lần — mã phải là duy nhất.`,
    });
  }
  return violations;
}

function checkSpecTable(
  specMarkdown: string,
  counts: CorpusCounts,
  seeded: SeededCounts
): MontessoriCorpusViolation[] {
  const violations: MontessoriCorpusViolation[] = [];
  const start = specMarkdown.indexOf(SPEC_SECTION_START);
  if (start === -1) {
    throw new Error(
      `Không tìm thấy mục ${SPEC_SECTION_START} trong spec lô level`
    );
  }
  const end = specMarkdown.indexOf(SPEC_SECTION_END, start);
  const section = specMarkdown.slice(start, end === -1 ? undefined : end);
  const spec = "montessori-game-level-batch.md §7.5";

  SPEC_ROW_REGEX.lastIndex = 0;
  let row = SPEC_ROW_REGEX.exec(section);
  while (row !== null) {
    const competency = row[1];
    const rowContent = row[2];
    if (competency && rowContent) {
      const [source, , acceptedCell, seededTypes, seededLevels] =
        cells(rowContent);
      compare(
        violations,
        "D-RQ",
        spec,
        `${competency} dạng bài trong nguồn`,
        Number(source),
        counts.sourceByCompetency[competency] ?? 0
      );
      compare(
        violations,
        "D-RQ",
        spec,
        `${competency} dạng bài nhận đợt này`,
        Number(acceptedCell),
        counts.acceptedByCompetency[competency] ?? 0
      );
      compare(
        violations,
        "BR-MGL-01",
        spec,
        `${competency} dạng bài đã soạn`,
        Number(seededTypes),
        seeded.typesByCompetency[competency] ?? 0
      );
      compare(
        violations,
        "BR-MGL-01",
        spec,
        `${competency} level đã soạn`,
        Number(seededLevels),
        seeded.levelsByCompetency[competency] ?? 0
      );
    }
    row = SPEC_ROW_REGEX.exec(section);
  }

  const totalRow = SPEC_TOTAL_REGEX.exec(section);
  if (totalRow?.[1]) {
    const [source, , acceptedCell, seededTypes, seededLevels] = cells(
      totalRow[1]
    ).map((c) => c.replaceAll("*", ""));
    compare(
      violations,
      "D-RQ",
      spec,
      "Tổng dạng bài trong nguồn",
      Number(source),
      counts.total
    );
    compare(
      violations,
      "D-RQ",
      spec,
      "Tổng dạng bài nhận đợt này",
      Number(acceptedCell),
      counts.accepted
    );
    compare(
      violations,
      "BR-MGL-01",
      spec,
      "Tổng dạng bài đã soạn",
      Number(seededTypes),
      seeded.activityTypes
    );
    compare(
      violations,
      "BR-MGL-01",
      spec,
      "Tổng level đã soạn",
      Number(seededLevels),
      seeded.levels
    );
  }
  return violations;
}

export interface MontessoriCorpusSources {
  readonly tableMarkdown: string;
  readonly specMarkdown: string;
  readonly seeded: SeededCounts;
}

export function scanMontessoriCorpusSources(
  sources: MontessoriCorpusSources
): MontessoriCorpusViolation[] {
  const counts = countCorpusTable(sources.tableMarkdown);
  return [
    ...checkTableSummary(sources.tableMarkdown, counts),
    ...checkSpecTable(sources.specMarkdown, counts, sources.seeded),
  ];
}

export interface MontessoriCorpusPaths {
  readonly tableFile: string;
  readonly specFile: string;
  readonly seedContentDir: string;
}

export function scanMontessoriCorpusGates(
  paths: MontessoriCorpusPaths
): MontessoriCorpusViolation[] {
  return scanMontessoriCorpusSources({
    tableMarkdown: readFileSync(paths.tableFile, "utf8"),
    specMarkdown: readFileSync(paths.specFile, "utf8"),
    seeded: countSeededLevels(paths.seedContentDir),
  });
}
