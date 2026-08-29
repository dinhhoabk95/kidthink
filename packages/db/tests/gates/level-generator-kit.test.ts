import fs from "node:fs";
import path from "node:path";
import { ALL_TEMPLATES, getLevelGenerator } from "@mindkid/game-engine";
import { describe, expect, it } from "vitest";
import { generateLevelsCore } from "#src/seed-content/cli/gen-levels";

const FIRST_BATCH_ENGINES = [
  "GT-001",
  "GT-002",
  "GT-003",
  "GT-004",
  "GT-005",
  "GT-006",
  "GT-007",
  "GT-008",
  "GT-010",
  "GT-011",
  "GT-012",
  "GT-018",
  "GT-019",
  "GT-020",
  "GT-022",
  "GT-023",
  "GT-025",
  "GT-026",
  "GT-027",
];

const ERR_ENGINE_NOT_FOUND = /không tồn tại trong ALL_TEMPLATES/;
const ERR_GENERATOR_NOT_FOUND = /chưa có generator/;

describe("Level Generator Kit — Task #121 (BR-LGK-01..10)", () => {
  it("Scenario: BR-LGK-02 — cùng seed cho cùng đầu ra byte-for-byte", () => {
    const tmpDir = path.resolve(import.meta.dirname, "fixtures/tmp");
    fs.mkdirSync(tmpDir, { recursive: true });

    const file1 = path.join(tmpDir, "out1.ts");
    const file2 = path.join(tmpDir, "out2.ts");

    try {
      generateLevelsCore({
        engine: "GT-001",
        count: 10,
        seed: 42,
        theme: "school",
        out: file1,
      });

      generateLevelsCore({
        engine: "GT-001",
        count: 10,
        seed: 42,
        theme: "school",
        out: file2,
      });

      const content1 = fs.readFileSync(file1, "utf-8");
      const content2 = fs.readFileSync(file2, "utf-8");

      expect(content1).toBe(content2);
    } finally {
      if (fs.existsSync(file1)) {
        fs.unlinkSync(file1);
      }
      if (fs.existsSync(file2)) {
        fs.unlinkSync(file2);
      }
    }
  });

  it("Scenario: BR-LGK-04 — bộ sinh không mở database (DATABASE_URL không tồn tại)", () => {
    const origUrl = process.env.DATABASE_URL;
    try {
      process.env.DATABASE_URL =
        "postgres://fake:fake@nonexistent.domain.local:5432/fake";
      const result = generateLevelsCore({
        engine: "GT-001",
        count: 5,
        seed: 999,
        theme: "farm",
      });

      expect(result.writtenCount).toBe(5);
      expect(result.items.length).toBe(5);
    } finally {
      process.env.DATABASE_URL = origUrl;
    }
  });

  it("Scenario: BR-LGK-06 & BR-LGK-10 — origin khác human, tag ba trục và instruction rỗng", () => {
    const result = generateLevelsCore({
      engine: "GT-001",
      count: 3,
      seed: 12_345,
      theme: "school",
    });

    for (const item of result.items as Array<{
      header: {
        origin: string;
        thinking_tags: string[];
        what_tags: string[];
        skill_codes: string[];
        instruction: string;
      };
    }>) {
      expect(item.header.origin).toBe("generator");
      expect(item.header.origin).not.toBe("human");
      expect(item.header.thinking_tags).toEqual([]);
      expect(item.header.what_tags).toEqual([]);
      expect(item.header.skill_codes).toEqual([]);
      expect(item.header.instruction).toBe("");
    }
  });

  it("Scenario: WP121.2 — 19 engine trong lô đầu đều sinh được và parse hợp lệ", () => {
    for (const engineCode of FIRST_BATCH_ENGINES) {
      const template = ALL_TEMPLATES[engineCode];
      expect(template, `Template ${engineCode} phải tồn tại`).toBeDefined();

      const generator = getLevelGenerator(engineCode);
      expect(generator, `Generator ${engineCode} phải tồn tại`).toBeDefined();

      const result = generateLevelsCore({
        engine: engineCode,
        count: 10,
        seed: 20_260_829,
        theme: "school",
      });

      expect(
        result.writtenCount,
        `Engine ${engineCode} phải sinh được ít nhất 1 level`
      ).toBeGreaterThan(0);
      expect(
        result.contractRejectedCount,
        `Engine ${engineCode} không được có ứng viên trượt schema`
      ).toBe(0);

      // Verify each candidate matches content_contract
      for (const item of result.items as Array<{ content_pack: unknown }>) {
        const parsed = template?.content_contract.safeParse(item.content_pack);
        expect(
          parsed?.success,
          `Content pack của ${engineCode} phải pass content_contract`
        ).toBe(true);
      }
    }
  });

  describe("Ca âm cho bộ sinh (WP121.4)", () => {
    it("Ca âm: Engine không tồn tại sẽ throw lỗi rõ ràng", () => {
      expect(() => {
        generateLevelsCore({
          engine: "GT-999",
          count: 5,
          seed: 123,
          theme: "school",
        });
      }).toThrow(ERR_ENGINE_NOT_FOUND);
    });

    it("Ca âm: Engine ngoài lô đầu chưa có generator sẽ throw", () => {
      expect(() => {
        generateLevelsCore({
          engine: "GT-013",
          count: 5,
          seed: 123,
          theme: "school",
        });
      }).toThrow(ERR_GENERATOR_NOT_FOUND);
    });

    it("Ca âm: Tĩnh — code generator không chứa kết nối database", () => {
      const genCliPath = path.resolve(
        import.meta.dirname,
        "../../src/seed-content/cli/gen-levels.ts"
      );
      const code = fs.readFileSync(genCliPath, "utf-8");
      expect(code).not.toContain("drizzle-orm");
      expect(code).not.toContain('from "#src/connection"');
      expect(code).not.toContain('from "#src/schema"');
    });
  });
});
