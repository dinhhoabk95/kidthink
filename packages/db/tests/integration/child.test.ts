import { CHILD_PROFILE_CLOSED_COLUMNS } from "@mindkid/shared";
import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { getOwnerDb } from "../../src/index.ts";

describe("Child Schema Integration Tests", () => {
  it("BR-CDC-01 & BR-SPT-01: child_profiles matches canonical closed 12-column list exactly", async () => {
    const db = getOwnerDb();

    // Query information_schema.columns for child_profiles table
    const result = await db.execute<{ column_name: string }>(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'child_profiles' AND table_schema = 'public'
    `);

    const columnNames = Array.from(result).map((r) => r.column_name);

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

  it("BR-SPT-02: child_profiles contains no forbidden sensitive PII or image path columns", async () => {
    const db = getOwnerDb();

    const result = await db.execute<{ column_name: string }>(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'child_profiles' AND table_schema = 'public'
    `);

    const columnNames = Array.from(result).map((r) => r.column_name);

    // Rule BR-SPT-02 & BR-CDC-04: NO image paths or URL columns (%_url, %_path, photo%)
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
