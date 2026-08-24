import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  findImportPathViolations,
  readImportPathDebt,
} from "#src/lint-import-paths";

const FIXTURES_ROOT = path.join(
  import.meta.dirname,
  "fixtures",
  "import-paths"
);

function scanFixture(folder: string) {
  const dir = path.join(FIXTURES_ROOT, folder);
  return findImportPathViolations([dir], dir);
}

describe("lint:import-paths (BR-MPA-08)", () => {
  it("ca âm: phát hiện module specifier parent-relative '../'", () => {
    const findings = scanFixture("bad");
    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings.some((f) => f.specifier.startsWith("../"))).toBe(true);
  });

  it("không báo lỗi khi dùng alias hợp lệ hoặc same-directory import './'", () => {
    const findings = scanFixture("good");
    expect(findings).toEqual([]);
  });

  it("bỏ qua file có khai báo exempt", () => {
    const findings = scanFixture("exempt");
    expect(findings).toEqual([]);
  });

  it("sổ nợ import-path-debt.json tồn tại và có định dạng hợp lệ", () => {
    const debt = readImportPathDebt();
    expect(Array.isArray(debt)).toBe(true);
    expect(debt).toEqual([]);
  });
});

describe("Cổng lint:import-paths trên repo thật (BR-MPA-08)", () => {
  it("không có vi phạm import path nào ngoài danh sách trong sổ nợ", () => {
    const currentFindings = findImportPathViolations();
    const debtSet = new Set(readImportPathDebt());

    const unexpected = currentFindings.filter((f) => !debtSet.has(f.key));
    expect(unexpected).toEqual([]);
  });
});
