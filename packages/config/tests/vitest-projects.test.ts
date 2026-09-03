import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  PROJECT_ROOTS,
  REPO_ROOT,
  resolveProjectForTestFile,
  scanTestFiles,
} from "./helpers/vitest-projects-scanner.ts";

describe("vitest projects coverage gate (#204.5)", () => {
  it("mọi file test trong repo phải thuộc đúng 1 project và không bị bỏ sót", () => {
    const testFiles = scanTestFiles(REPO_ROOT);
    expect(testFiles.length).toBeGreaterThan(300);

    const unassigned: string[] = [];
    const multiAssigned: { file: string; projects: string[] }[] = [];

    for (const file of testFiles) {
      const relPath = path.relative(REPO_ROOT, file);
      const matchedProjects = PROJECT_ROOTS.filter((p) =>
        relPath.startsWith(`${p.prefix}/`)
      );

      if (matchedProjects.length === 0) {
        unassigned.push(relPath);
      } else if (matchedProjects.length > 1) {
        multiAssigned.push({
          file: relPath,
          projects: matchedProjects.map((p) => p.name),
        });
      }
    }

    expect(
      unassigned,
      `Có ${unassigned.length} file test không thuộc project vitest nào:\n${unassigned.join("\n")}`
    ).toEqual([]);

    expect(
      multiAssigned,
      `Có file test thuộc nhiều hơn 1 project:\n${JSON.stringify(multiAssigned, null, 2)}`
    ).toEqual([]);
  });

  it("ca âm: file test nằm ngoài project roots bị bắt lỗi", () => {
    const fakeRelPath = "orphaned-tests/my.test.ts";
    const resolved = resolveProjectForTestFile(fakeRelPath);
    expect(resolved).toBeNull();
  });
});
