import { pgTable, text } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import { extractTableNamesFromSchema, TABLES } from "../global-setup.ts";

describe("Dynamic Schema Tables Extraction (G6, Task #208)", () => {
  it("trích xuất đủ 82 bảng từ schema/ và không thiếu bảng mới", () => {
    expect(TABLES.length).toBe(82);
    expect(TABLES).toContain("skill_datasets");
    expect(TABLES).toContain("content_objective_map");
    expect(TABLES).toContain("users");
    expect(TABLES).toContain("game_levels");
  });

  it("test chứng minh bắt lỗi: thêm bảng giả vào schema ⟹ xuất hiện trong danh sách trích xuất", () => {
    const fakeTable = pgTable("fake_table_for_test", {
      id: text("id").primaryKey(),
    });

    const mockSchema = {
      realUsersTable: fakeTable,
      someOtherConstant: "ignore_me",
      someFunction: () => 123,
    };

    const extracted = extractTableNamesFromSchema(mockSchema);
    expect(extracted).toEqual(["fake_table_for_test"]);
  });
});
