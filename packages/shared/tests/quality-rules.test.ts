import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT_DIR = path.resolve(import.meta.dirname, "../../..");
// Chỉ quét mã nguồn thật. Quét cả gốc repo từng kéo theo docs/montessori (1 GB).
const SCAN_DIRS = ["apps", "packages", "scripts"].map((d) =>
  path.join(ROOT_DIR, d)
);

const TEST_FILE_REGEX = /\.(test|spec)\.ts$/;
// Khớp theo specifier của driver DB (drizzle-orm, postgres, pg, *sqlite*) và
// package DB nội bộ (`@mindkid/db`, `@mindkid/db/repositories`...), kể
// cả khi `vi.mock` có factory đi kèm. Bản cũ đòi `)` ngay sau specifier nên
// bỏ sót mọi lời gọi có factory, và `.*pg.*` khớp nhầm cả "page", "upgrade".
const MOCKED_DB_REGEX =
  /v(?:i|itest)\.mock\(\s*["'`](?:drizzle-orm[^"'`]*|@mindkid\/db(?:\/[^"'`]*)?|postgres|pg|better-sqlite3|[^"'`]*sqlite[^"'`]*)["'`]/i;
const SET_TIMEOUT_WAIT_REGEX_1 = /await new Promise.*setTimeout/;
const SET_TIMEOUT_WAIT_REGEX_2 = /setTimeout\([^)]+,\s*\d+\)/;
const TS_FILE_REGEX = /\.ts$/;
const VALID_GENERATED_HEADER_REGEX = /@generated from [A-Z0-9_-]+@[a-f0-9]+/;
const SRC_FILE_REGEX = /\.(ts|tsx|js|vue)$/;

describe("P0.0 Quality & Governance Rules (BR-TST, BR-AIG, BR-MVP)", () => {
  it("enforces BR-TST-02: no DB mocking in tests", () => {
    const testFiles = findFiles(
      SCAN_DIRS,
      (file) => TEST_FILE_REGEX.test(file) && !file.includes("node_modules")
    );

    const mockedDbFiles: string[] = [];

    for (const file of testFiles) {
      const content = fs.readFileSync(file, "utf-8");
      if (MOCKED_DB_REGEX.test(content)) {
        mockedDbFiles.push(path.relative(ROOT_DIR, file));
      }
    }

    expect(mockedDbFiles).toEqual([]);
  });

  it("BR-TST-02 ca âm: regex bắt vi.mock driver DB có factory, bỏ qua module không liên quan", () => {
    const violation = fs.readFileSync(
      path.join(
        import.meta.dirname,
        "fixtures/quality-rules/db-mock-violation.txt"
      ),
      "utf-8"
    );
    expect(MOCKED_DB_REGEX.test(violation)).toBe(true);
    expect(MOCKED_DB_REGEX.test('vi.mock("~/pages/upgrade", () => ({}))')).toBe(
      false
    );
  });

  it("BR-TST-02 ca âm: regex bắt vi.mock package DB nội bộ @mindkid/db (kể cả subpath), bỏ qua package khác", () => {
    const violation = fs.readFileSync(
      path.join(
        import.meta.dirname,
        "fixtures/quality-rules/internal-db-mock-violation.txt"
      ),
      "utf-8"
    );
    expect(MOCKED_DB_REGEX.test(violation)).toBe(true);

    // Mẫu vi phạm/hợp lệ nằm trong fixture để file test này không tự khớp regex của chính nó.
    const subpath = fs.readFileSync(
      path.join(
        import.meta.dirname,
        "fixtures/quality-rules/internal-db-subpath-mock-violation.txt"
      ),
      "utf-8"
    );
    expect(MOCKED_DB_REGEX.test(subpath)).toBe(true);

    const unrelated = fs.readFileSync(
      path.join(
        import.meta.dirname,
        "fixtures/quality-rules/internal-db-mock-unrelated.txt"
      ),
      "utf-8"
    );
    expect(MOCKED_DB_REGEX.test(unrelated)).toBe(false);
  });

  it("enforces BR-TST-04: no setTimeout waiting in tests", () => {
    const testFiles = findFiles(
      SCAN_DIRS,
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

  it("enforces BR-AIG-04: generated headers are valid", () => {
    const allCodeFiles = findFiles(
      SCAN_DIRS,
      (file) =>
        TS_FILE_REGEX.test(file) &&
        !file.includes("node_modules") &&
        !file.includes("dist") &&
        !file.endsWith("quality-rules.test.ts") &&
        !file.endsWith("ai-codegen-pipeline.test.ts")
    );

    const invalidGeneratedHeaderFiles: string[] = [];

    for (const file of allCodeFiles) {
      const content = fs.readFileSync(file, "utf-8");

      if (
        content.includes("@generated") &&
        !VALID_GENERATED_HEADER_REGEX.test(content)
      ) {
        invalidGeneratedHeaderFiles.push(path.relative(ROOT_DIR, file));
      }
    }

    expect(invalidGeneratedHeaderFiles).toEqual([]);
  });

  it("enforces BR-MVP-04: no banned out-of-scope domain concepts in source code", () => {
    const srcFiles = findFiles(
      SCAN_DIRS,
      (file) =>
        SRC_FILE_REGEX.test(file) &&
        !file.includes("node_modules") &&
        !file.includes("docs") &&
        !file.includes(".git") &&
        !file.includes("scripts") &&
        // `packages/gates` từng **định nghĩa** danh sách từ khoá bị cấm
        // (BR-MVP-04) nên phải tự loại. Package đã xoá 2026-08-29; loại trừ
        // giữ lại vì vô hại và tài liệu hoá vì sao nó từng cần.
        !file.includes(`packages${path.sep}gates`) &&
        !file.includes("tests") &&
        !file.endsWith("glossary.ts")
    );

    const bannedKeywords = [
      "tenant_id",
      "school_admin",
      "classroom_lockdown",
      "native_mobile",
      "licensing",
      "marketplace",
    ];

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

function findFiles(
  dirs: string[],
  filter: (file: string) => boolean
): string[] {
  return dirs.flatMap((dir) => findFilesIn(dir, filter));
}

function findFilesIn(dir: string, filter: (file: string) => boolean): string[] {
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
        entry.name !== ".build" &&
        entry.name !== ".nuxt" &&
        entry.name !== ".output"
      ) {
        results.push(...findFilesIn(fullPath, filter));
      }
    } else if (entry.isFile() && filter(fullPath)) {
      results.push(fullPath);
    }
  }
  return results;
}
