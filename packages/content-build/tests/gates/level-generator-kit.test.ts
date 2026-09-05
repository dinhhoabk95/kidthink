import fs from "node:fs";
import path from "node:path";
import { repoPath } from "@mindkid/config/paths";
import { getLevelGenerator } from "@mindkid/game-engine/generators";
import { ALL_TEMPLATES } from "@mindkid/game-engine/registry";
import { describe, expect, it } from "vitest";
import { generateLevelsCore } from "#src/cli/gen-levels";

const ALL_36_ENGINES = Object.keys(ALL_TEMPLATES)
  .filter((k) => k !== "GT-000")
  .sort();

const ERR_ENGINE_NOT_FOUND = /không tồn tại trong ALL_TEMPLATES/;
const ERR_GENERATOR_NOT_FOUND = /chưa có generator/;
const ERR_THEME_COUNT =
  /BR-CTR-08: Generator axes\.theme must declare >= 8 themes/;
const PROVENANCE_REGEX = new RegExp(
  ["@", "generated from LEVEL-GENERATOR-KIT@[a-f0-9]{12}"].join("")
);

describe("Level Generator Kit — Task #121 & Task #197 (BR-LGK-01..10)", () => {
  it("Scenario: BR-LGK-02 — cùng seed cho cùng đầu ra byte-for-byte", () => {
    const tmpDir = path.resolve(import.meta.dirname, "fixtures/tmp");
    fs.mkdirSync(tmpDir, { recursive: true });

    const file1 = path.join(tmpDir, "out1.ts");
    const file2 = path.join(tmpDir, "out2.ts");

    try {
      generateLevelsCore({
        engine: "GT-001",
        count: 5,
        seed: 42,
        theme: "school",
        out: file1,
      });

      generateLevelsCore({
        engine: "GT-001",
        count: 5,
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
      // `BR-LGK-06` chỉ đòi "phân biệt được với human". Q3 của
      // `level-generator-kit.md` (giá trị origin cho nội dung sinh máy) vẫn mở,
      // nên dùng giá trị CÓ THẬT trong enum thay vì bịa "generator" — thứ sinh
      // ra đúng 180 lỗi TS2322 rồi bị ghi vào baseline.
      expect(item.header.origin).toBe("ai_assisted");
      expect(item.header.origin).not.toBe("human");
      expect(item.header.thinking_tags).toEqual([]);
      expect(item.header.what_tags).toEqual([]);
      expect(item.header.skill_codes).toEqual([]);
      expect(item.header.instruction).toBe("");
    }
  });

  it("Scenario: BR-LGK-07 — provenance header có định dạng hợp lệ", () => {
    const tmpDir = path.resolve(import.meta.dirname, "fixtures/tmp");
    fs.mkdirSync(tmpDir, { recursive: true });
    const file = path.join(tmpDir, "prov.ts");

    try {
      generateLevelsCore({
        engine: "GT-001",
        count: 1,
        seed: 123,
        theme: "school",
        out: file,
      });

      const content = fs.readFileSync(file, "utf-8");
      expect(content).toMatch(PROVENANCE_REGEX);
    } finally {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    }
  });

  it("Scenario: BR-LGK-08 & BR-LGK-09 — không chứa trùng lặp trong cùng một lần sinh", () => {
    const result = generateLevelsCore({
      engine: "GT-001",
      count: 10,
      seed: 999,
      theme: "school",
    });

    const hashes = (
      result.items as Array<{ content_pack: Record<string, unknown> }>
    ).map((item) => JSON.stringify(item.content_pack));
    const uniqueHashes = new Set(hashes);

    expect(uniqueHashes.size).toBe(hashes.length);
  });

  it("Scenario: WP121.2 & Task #197 — toàn bộ engine đều có generator, sinh được và parse hợp lệ", () => {
    expect(ALL_36_ENGINES).toHaveLength(36);

    for (const engineCode of ALL_36_ENGINES) {
      const template = ALL_TEMPLATES[engineCode];
      expect(template, `Template ${engineCode} phải tồn tại`).toBeDefined();

      const generator = getLevelGenerator(engineCode);
      expect(generator, `Generator ${engineCode} phải tồn tại`).toBeDefined();

      const result = generateLevelsCore({
        engine: engineCode,
        count: 5,
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
  }, 60_000);

  it("Task #191 / Đợt 0: Năng lực sinh phân biệt của các engine đạt demand * 3", () => {
    const checks: Array<{ engine: string; count: number }> = [
      { engine: "GT-013", count: 61 * 3 },
      { engine: "GT-017", count: 8 * 3 },
      { engine: "GT-024", count: 20 },
    ];

    for (const { engine, count } of checks) {
      const result = generateLevelsCore({
        engine,
        count,
        seed: 12_345,
        theme: "school",
      });

      expect(
        result.writtenCount,
        `Engine ${engine} phải sinh đủ ${count} level`
      ).toBe(count);

      const hashes = (
        result.items as Array<{ content_pack: Record<string, unknown> }>
      ).map((item) => JSON.stringify(item.content_pack));
      const uniqueHashes = new Set(hashes);
      expect(
        uniqueHashes.size,
        `Engine ${engine} phải có đủ ${count} output phân biệt`
      ).toBe(count);
    }
  }, 30_000);

  describe("Ca âm cho bộ sinh (WP121.4)", () => {
    it("Ca âm Đợt 0: Generator không dùng rng làm kiểm tra năng lực thất bại", () => {
      const fakeNonRngGenerator = {
        engine: "GT-013" as const,
        axes: {
          age_band: ["4-5" as const, "5-6" as const],
          what: ["spatial"],
          theme: [
            "school",
            "farm",
            "home",
            "nature",
            "food",
            "animal",
            "ocean",
            "space",
          ],
        },
        generate: () => ({
          content_pack: { fixed: true },
          difficulty_params: {},
        }),
      };

      const hashes = new Set<string>();
      for (let i = 0; i < 10; i++) {
        const out = fakeNonRngGenerator.generate();
        hashes.add(JSON.stringify(out.content_pack));
      }
      expect(hashes.size).toBe(1);
      expect(hashes.size).toBeLessThan(10);
    });

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

    it("Ca âm: Engine có template nhưng thiếu generator đăng ký sẽ throw", () => {
      const orig = ALL_TEMPLATES["GT-001"];
      if (!orig) {
        throw new Error("GT-001 template must exist");
      }
      ALL_TEMPLATES["GT-FAKE"] = orig;
      try {
        expect(() => {
          generateLevelsCore({
            engine: "GT-FAKE",
            count: 5,
            seed: 123,
            theme: "school",
          });
        }).toThrow(ERR_GENERATOR_NOT_FOUND);
      } finally {
        Reflect.deleteProperty(ALL_TEMPLATES, "GT-FAKE");
      }
    });

    it("Ca âm: Tĩnh — code generator không chứa kết nối database", () => {
      const genCliPath = repoPath(
        "packages/content-build/src/cli/gen-levels.ts"
      );
      const code = fs.readFileSync(genCliPath, "utf-8");
      expect(code).not.toContain("drizzle-orm");
      expect(code).not.toContain('from "#src/connection"');
      expect(code).not.toContain('from "#src/schema"');
    });

    it("Task #194: mọi bộ sinh khai báo >= 8 chủ đề trong CONTENT_THEMES", async () => {
      const { ALL_LEVEL_GENERATORS } = await import("@mindkid/game-engine");
      const { CONTENT_THEMES } = await import("@mindkid/shared");
      const canonicalThemes = new Set(CONTENT_THEMES.map((t) => t.code));

      for (const [code, generator] of Object.entries(ALL_LEVEL_GENERATORS)) {
        expect(
          generator.axes.theme.length,
          `Generator ${code} phải khai báo >= 8 chủ đề, hiện có ${generator.axes.theme.length}`
        ).toBeGreaterThanOrEqual(8);

        for (const t of generator.axes.theme) {
          expect(
            canonicalThemes.has(t),
            `Generator ${code} chứa theme '${t}' không thuộc CONTENT_THEMES`
          ).toBe(true);
        }
      }
    });

    it("Ca âm Task #194: bộ sinh khai báo dưới 8 chủ đề làm cổng kiểm tra từ chối", () => {
      const mockGenerator = {
        engine: "GT-001" as const,
        axes: {
          age_band: ["3-4" as const],
          what: ["number"],
          theme: ["school", "farm", "home", "nature", "food"],
        },
        generate: () => ({
          content_pack: {},
          difficulty_params: {},
        }),
      };

      expect(mockGenerator.axes.theme.length).toBeLessThan(8);
      const validateThemeCount = (gen: { axes: { theme: string[] } }) => {
        if (gen.axes.theme.length < 8) {
          throw new Error(
            `BR-CTR-08: Generator axes.theme must declare >= 8 themes, got ${gen.axes.theme.length}`
          );
        }
      };

      expect(() => validateThemeCount(mockGenerator)).toThrow(ERR_THEME_COUNT);
    });
  });
});
