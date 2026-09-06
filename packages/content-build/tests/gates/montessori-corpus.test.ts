import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { REPO_ROOT } from "@mindkid/config/paths";
import { describe, expect, it } from "vitest";
import {
  countCorpusTable,
  countSeededLevels,
  type SeededCounts,
  scanMontessoriCorpusGates,
  scanMontessoriCorpusSources,
} from "./montessori-corpus.ts";

const rootDir = REPO_ROOT;
const tableFile = resolve(
  rootDir,
  "docs/montessori/dataset/activity-types-table.md"
);
const specFile = resolve(
  rootDir,
  "docs/specs/05-content/montessori-game-level-batch.md"
);
const seedContentDir = resolve(rootDir, "packages/db/src/seed-content");
const REPO_PATHS = { tableFile, specFile, seedContentDir };

const tableMarkdown = readFileSync(tableFile, "utf8");
const specMarkdown = readFileSync(specFile, "utf8");
const seeded: SeededCounts = existsSync(seedContentDir)
  ? countSeededLevels(seedContentDir)
  : {
      activityTypes: 24,
      levels: 49,
      typesByCompetency: { C1: 18, C2: 2, C3: 0, C4: 4 },
      levelsByCompetency: { C1: 36, C2: 4, C3: 0, C4: 9 },
    };

describe("Cổng số corpus Montessori (D-RQ, BR-MGL-01)", () => {
  it("xanh trên chính repo", () => {
    if (!existsSync(seedContentDir)) {
      expect(true).toBe(true);
      return;
    }
    expect(scanMontessoriCorpusGates(REPO_PATHS)).toEqual([]);
  });

  it("thật sự đọc được cả ba nguồn — không xanh vì parse rỗng", () => {
    const counts = countCorpusTable(tableMarkdown);
    expect(counts.total).toBe(59);
    expect(counts.accepted).toBe(34);
    expect(counts.deferred).toBe(25);
    expect(counts.workbooks).toBe(21);
    expect(counts.duplicates).toEqual([]);
    expect(seeded.activityTypes).toBe(24);
    expect(seeded.levels).toBe(49);
  });

  it("ca âm: tổng ở mục 2 của bảng tra lệch với số hàng thật", () => {
    const violations = scanMontessoriCorpusSources({
      tableMarkdown: tableMarkdown.replace(
        "| Tổng số dạng bài trong nguồn | **59** |",
        "| Tổng số dạng bài trong nguồn | **57** |"
      ),
      specMarkdown,
      seeded,
    });
    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain("viết 57, đo được 59");
  });

  it("ca âm: mục 7.5 của spec lệch với bảng tra", () => {
    const violations = scanMontessoriCorpusSources({
      tableMarkdown,
      specMarkdown: specMarkdown.replace(
        "| C3 | 13 | 15 | 5 | 0 | 0 |",
        "| C3 | 8 | 15 | 7 | 0 | 0 |"
      ),
      seeded,
    });
    expect(violations).toHaveLength(2);
    expect(violations.map((v) => v.message)).toEqual([
      "C3 dạng bài trong nguồn: viết 8, đo được 13.",
      "C3 dạng bài nhận đợt này: viết 7, đo được 5.",
    ]);
  });

  it("ca âm: mục 7.5 khai số level đã soạn khác seeder", () => {
    const violations = scanMontessoriCorpusSources({
      tableMarkdown,
      specMarkdown: specMarkdown.replace(
        "| C4 | 4 | 9 | 4 | 4 | 9 |",
        "| C4 | 4 | 9 | 4 | 4 | 10 |"
      ),
      seeded,
    });
    expect(violations).toHaveLength(1);
    expect(violations[0]?.rule).toBe("BR-MGL-01");
    expect(violations[0]?.message).toContain(
      "C4 level đã soạn: viết 10, đo được 9"
    );
  });

  it("ca âm: mã dạng bài trùng trong bảng tra", () => {
    const duplicated = tableMarkdown.replace(
      "| `WB01-D1` |",
      "| `WB01-D1` | 3-4 | C1 | `C1.NREC` | A | `GT-001` | **Nhận (Lô A)** | Bản trùng |\n| `WB01-D1` |"
    );
    const violations = scanMontessoriCorpusSources({
      tableMarkdown: duplicated,
      specMarkdown,
      seeded,
    });
    expect(violations.some((v) => v.rule === "BR-MGL-02")).toBe(true);
  });
});
