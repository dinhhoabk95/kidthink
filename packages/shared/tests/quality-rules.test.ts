import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT_DIR = path.resolve(import.meta.dirname, "../../..");

const TEST_FILE_REGEX = /\.(test|spec)\.ts$/;
const MOCKED_DB_REGEX_1 =
  /vi\.mock\(['"].*(drizzle|postgres|pg|sqlite).*['"]\)/i;
const MOCKED_DB_REGEX_2 =
  /vitest\.mock\(['"].*(drizzle|postgres|pg|sqlite).*['"]\)/i;
const SET_TIMEOUT_WAIT_REGEX_1 = /await new Promise.*setTimeout/;
const SET_TIMEOUT_WAIT_REGEX_2 = /setTimeout\([^)]+,\s*\d+\)/;
const TS_FILE_REGEX = /\.ts$/;
const VALID_GENERATED_HEADER_REGEX = /@generated from [A-Z0-9_-]+@[a-f0-9]+/;
const SRC_FILE_REGEX = /\.(ts|tsx|js|vue)$/;

describe("P0.0 Quality & Governance Rules (BR-TST, BR-AIG, BR-MVP)", () => {
  it("enforces BR-TST-02: no DB mocking in tests", () => {
    const testFiles = findFiles(
      ROOT_DIR,
      (file) => TEST_FILE_REGEX.test(file) && !file.includes("node_modules")
    );

    const mockedDbFiles: string[] = [];

    for (const file of testFiles) {
      const content = fs.readFileSync(file, "utf-8");
      if (MOCKED_DB_REGEX_1.test(content) || MOCKED_DB_REGEX_2.test(content)) {
        mockedDbFiles.push(path.relative(ROOT_DIR, file));
      }
    }

    expect(mockedDbFiles).toEqual([]);
  });

  it("enforces BR-TST-04: no setTimeout waiting in tests", () => {
    const testFiles = findFiles(
      ROOT_DIR,
      (file) =>
        TEST_FILE_REGEX.test(file) &&
        !file.includes("node_modules") &&
        !file.endsWith("quality-rules.test.ts")
    );

    const setTimeoutWaitFiles: string[] = [];

    for (const file of testFiles) {
      const content = fs.readFileSync(file, "utf-8");
      if (
        SET_TIMEOUT_WAIT_REGEX_1.test(content) ||
        SET_TIMEOUT_WAIT_REGEX_2.test(content)
      ) {
        setTimeoutWaitFiles.push(path.relative(ROOT_DIR, file));
      }
    }

    expect(setTimeoutWaitFiles).toEqual([]);
  });

  it("enforces BR-AIG-03 & BR-AIG-04: no @generated files in forbidden areas & proper @generated format", () => {
    const allCodeFiles = findFiles(
      ROOT_DIR,
      (file) =>
        TS_FILE_REGEX.test(file) &&
        !file.includes("node_modules") &&
        !file.includes("dist") &&
        !file.endsWith("quality-rules.test.ts")
    );

    const forbiddenAreas = [
      "packages/auth",
      "packages/billing",
      "packages/gating",
    ];
    const invalidGeneratedHeaderFiles: string[] = [];
    const forbiddenGeneratedFiles: string[] = [];

    for (const file of allCodeFiles) {
      const relPath = path.relative(ROOT_DIR, file);
      const content = fs.readFileSync(file, "utf-8");

      if (content.includes("@generated")) {
        const inForbiddenArea = forbiddenAreas.some((area) =>
          relPath.startsWith(area)
        );
        if (inForbiddenArea) {
          forbiddenGeneratedFiles.push(relPath);
        }

        if (!VALID_GENERATED_HEADER_REGEX.test(content)) {
          invalidGeneratedHeaderFiles.push(relPath);
        }
      }
    }

    expect(forbiddenGeneratedFiles).toEqual([]);
    expect(invalidGeneratedHeaderFiles).toEqual([]);
  });

  it("enforces BR-MVP-04: no banned out-of-scope domain concepts in source code", () => {
    const srcFiles = findFiles(
      ROOT_DIR,
      (file) =>
        SRC_FILE_REGEX.test(file) &&
        !file.includes("node_modules") &&
        !file.includes("docs") &&
        !file.includes(".git") &&
        !file.includes("scripts") &&
        !file.includes("tests") &&
        !file.endsWith("glossary.ts")
    );

    const bannedKeywords = ["tenant_id", "school_admin", "classroom_lockdown"];

    const violations: { file: string; keyword: string }[] = [];

    for (const file of srcFiles) {
      const content = fs.readFileSync(file, "utf-8");
      const relPath = path.relative(ROOT_DIR, file);

      for (const kw of bannedKeywords) {
        if (content.includes(kw)) {
          violations.push({ file: relPath, keyword: kw });
        }
      }
    }

    expect(violations).toEqual([]);
  });
});

function findFiles(dir: string, filter: (file: string) => boolean): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) {
    return results;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        entry.name !== "node_modules" &&
        entry.name !== ".git" &&
        entry.name !== "dist" &&
        entry.name !== ".build"
      ) {
        results.push(...findFiles(fullPath, filter));
      }
    } else if (entry.isFile() && filter(fullPath)) {
      results.push(fullPath);
    }
  }
  return results;
}
