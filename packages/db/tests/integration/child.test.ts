import { CHILD_PROFILE_CLOSED_COLUMNS } from "@mindkid/shared";
import { describe, expect, it } from "vitest";
import { DB, getOwnerDb } from "#src/index";

function getChildProfileSqliteColumns(): string[] {
  getOwnerDb();
  const rawDb = DB.getSqliteDriver().getRawDatabase();
  const rows = rawDb
    .prepare("PRAGMA table_info('child_profiles');")
    .all() as Array<{ name: string }>;
  return rows.map((r) => r.name);
}

describe("Child Schema Integration Tests", () => {
  it("BR-CDC-01 & BR-SPT-01: child_profiles matches canonical closed 12-column list exactly", () => {
    const columnNames = getChildProfileSqliteColumns();

    const actualSet = new Set<string>(columnNames);
    const expectedSet = new Set<string>(CHILD_PROFILE_CLOSED_COLUMNS);

    const missingColumns = CHILD_PROFILE_CLOSED_COLUMNS.filter(
      (col) => !actualSet.has(col)
    );

    const extraColumns = columnNames.filter((col) => !expectedSet.has(col));

    if (missingColumns.length > 0 || extraColumns.length > 0) {
      throw new Error(
        `child_profiles column mismatch! Missing columns: [${missingColumns.join(
          ", "
        )}], Extra columns: [${extraColumns.join(", ")}]`
      );
    }

    expect(columnNames.sort()).toEqual(
      [...CHILD_PROFILE_CLOSED_COLUMNS].sort()
    );
  });

  it("BR-SPT-02: child_profiles contains no forbidden sensitive PII or image path columns", () => {
    const columnNames = getChildProfileSqliteColumns();

    const forbiddenPatterns = ["full_name", "birth_date", "school", "age_band"];

    for (const forbidden of forbiddenPatterns) {
      expect(columnNames).not.toContain(forbidden);
    }

    for (const col of columnNames) {
      expect(col.endsWith("_url")).toBe(false);
      expect(col.endsWith("_path")).toBe(false);
      expect(col.startsWith("photo")).toBe(false);
    }
  });
});
