import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { getOwnerDb } from "../../src/index.ts";

describe("Child Schema Integration Tests", () => {
  it("BR-SPT-01 & BR-SPT-02: child_profiles has exactly 12 columns and no forbidden columns", async () => {
    const db = getOwnerDb();

    // Query information_schema.columns for child_profiles table
    const result = await db.execute<{ column_name: string }>(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'child_profiles' AND table_schema = 'public'
    `);

    const columnNames = Array.from(result).map((r) => r.column_name);

    // 1. Must have exactly 12 columns
    expect(columnNames.length).toBe(12);

    // 2. Must not contain forbidden sensitive PII columns
    const forbiddenColumns = [
      "full_name",
      "birth_date",
      "school",
      "photo_path",
      "age_band",
    ];

    for (const forbidden of forbiddenColumns) {
      expect(columnNames).not.toContain(forbidden);
    }

    // 3. Must contain expected 12 column names
    const expectedColumns = [
      "id",
      "user_id",
      "display_name",
      "gender",
      "birth_year",
      "avatar_url",
      "avatar_emoji",
      "theme_preference",
      "is_active",
      "archived_at",
      "created_at",
      "updated_at",
    ];

    expect(columnNames.sort()).toEqual(expectedColumns.sort());
  });
});
