import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CANONICAL_MECHANIC_TAGS,
  CANONICAL_THINKING_TAGS,
  type ContentItem,
  DEFAULT_CONFIG,
  evaluateThinkingCoverage,
  formatCoverageReport,
  type ThinkingCoverageConfig,
  validateTagVocabulary,
} from "./thinking-coverage.ts";
import {
  loadItemsFromSeedCorpus,
  mapSeedLevels,
} from "./thinking-coverage-source.ts";

function createMockCatalog(): ContentItem[] {
  const items: ContentItem[] = [];
  const comps = ["C1", "C2", "C3", "C4", "C5", "C6"];
  const bands: Array<"3-4" | "4-5" | "5-6"> = ["3-4", "4-5", "5-6"];
  const mechanics = ["tap-select", "drag-to-container", "pair-match"];
  const thinkingTags = [
    "observe",
    "compare",
    "sort",
    "match",
    "sequence",
    "infer",
    "predict",
    "plan",
    "recall",
    "inhibit",
    "shift",
    "count",
  ];

  let idCounter = 1;
  for (const c of comps) {
    for (const b of bands) {
      // 7 levels per cell (above floor 6)
      for (let i = 0; i < 7; i++) {
        const mech = mechanics[i % mechanics.length];
        const tTag = thinkingTags[(idCounter - 1) % thinkingTags.length];
        items.push({
          id: idCounter,
          code: `GL-${c}-${b}-${String(i + 1).padStart(4, "0")}`,
          kind: "game_level",
          status: "published",
          competencyCode: c,
          ageBand: b,
          templateCode: i === 0 ? "GT-009" : "GT-001",
          mechanicCode: mech,
          whatTags: ["cnt", "shp"],
          thinkingTags: [tTag],
          themeTag: "farm",
        });
        idCounter++;
      }
    }
  }

  return items;
}

describe("Task #94 — Thinking Coverage Matrix (BR-TCM-01..11)", () => {
  it("BR-TCM-01: accepts clean tags within closed vocabulary", () => {
    const whatRes = validateTagVocabulary(["cnt", "geometry"], "what");
    expect(whatRes.valid).toBe(true);
    expect(whatRes.invalidTags).toHaveLength(0);

    const thinkingRes = validateTagVocabulary(
      ["recall", "observe"],
      "thinking"
    );
    expect(thinkingRes.valid).toBe(true);
    expect(thinkingRes.invalidTags).toHaveLength(0);
  });

  it("BR-TCM-01: CA ÂM — trục thinking đóng đúng 12 giá trị, không nhận alias seed-master", () => {
    expect(CANONICAL_THINKING_TAGS.size).toBe(12);

    // Sáu alias từng được thêm vào để seed đang lệch đi qua cổng.
    const res = validateTagVocabulary(
      [
        "visual",
        "analytical",
        "associative",
        "inhibitory",
        "sequential",
        "spatial",
      ],
      "thinking"
    );
    expect(res.valid).toBe(false);
    expect(res.invalidTags).toHaveLength(6);
  });

  it("BR-TCM-01: trục mechanic khớp từng cái một với registry template", async () => {
    const { ALL_TEMPLATES } = await import(
      "../../../game-engine/src/generated/template-registry.ts"
    );
    const fromRegistry = new Set(
      Object.values(ALL_TEMPLATES).map((t) => t.mechanic)
    );

    expect([...CANONICAL_MECHANIC_TAGS].sort()).toEqual(
      [...fromRegistry].sort()
    );
  });

  it("BR-TCM-01 & BR-TCM-02: CA ÂM — rejects fabricated tag outside closed vocabulary with error violation", () => {
    const items: ContentItem[] = [
      {
        code: "LES-C1-0001",
        kind: "lesson",
        status: "published",
        competencyCode: "C1",
        ageBand: "3-4",
        thinkingTags: ["gross_motor_counting", "fabricated_tag"],
      },
    ];

    const result = evaluateThinkingCoverage(items);
    expect(result.passed).toBe(false);
    expect(result.violations.some((v) => v.ruleId === "BR-TCM-01")).toBe(true);
    expect(
      result.violations.some((v) => v.message.includes("gross_motor_counting"))
    ).toBe(true);
  });

  it("BR-TCM-03: only published content is counted towards coverage", () => {
    const items: ContentItem[] = [
      {
        code: "GL-C1-DRAFT",
        kind: "game_level",
        status: "draft",
        competencyCode: "C1",
        ageBand: "3-4",
        mechanicCode: "tap-select",
      },
      {
        code: "GL-C1-REVIEW",
        kind: "game_level",
        status: "in_review",
        competencyCode: "C1",
        ageBand: "3-4",
        mechanicCode: "tap-select",
      },
      {
        code: "GL-C1-ARCHIVED",
        kind: "game_level",
        status: "archived",
        competencyCode: "C1",
        ageBand: "3-4",
        mechanicCode: "tap-select",
      },
      {
        code: "GL-C1-PUB",
        kind: "game_level",
        status: "published",
        competencyCode: "C1",
        ageBand: "3-4",
        mechanicCode: "tap-select",
      },
    ];

    const result = evaluateThinkingCoverage(items);
    expect(result.competencyMatrix.C1["3-4"].count).toBe(1);
    expect(result.totalPublished).toBe(1);
  });

  it("BR-TCM-04: detects cells below game level floor when enforced", () => {
    const catalog = createMockCatalog();
    // Reduce C3 3-4 from 7 to 4 levels
    const filtered = catalog.filter(
      (item) =>
        !(
          item.competencyCode === "C3" &&
          item.ageBand === "3-4" &&
          (item.id as number) % 2 === 0
        )
    );

    const config: ThinkingCoverageConfig = {
      ...DEFAULT_CONFIG,
      enforceFloors: true,
    };

    const result = evaluateThinkingCoverage(filtered, config);
    expect(result.passed).toBe(false);
    const violation = result.violations.find(
      (v) => v.ruleId === "BR-TCM-04" && v.cell === "C3 3-4"
    );
    expect(violation).toBeDefined();
    expect(violation?.type).toBe("error");
    expect(violation?.actual).toBeLessThan(6);
    expect(violation?.missing).toBeGreaterThan(0);
  });

  it("BR-TCM-05: detects cell with insufficient mechanic diversity when enforced", () => {
    const catalog = createMockCatalog();
    // Force all C6 5-6 levels to use only 1 mechanic "tap-select"
    const modified = catalog.map((item) => {
      if (item.competencyCode === "C6" && item.ageBand === "5-6") {
        return { ...item, mechanicCode: "tap-select" };
      }
      return item;
    });

    const config: ThinkingCoverageConfig = {
      ...DEFAULT_CONFIG,
      enforceFloors: true,
    };

    const result = evaluateThinkingCoverage(modified, config);
    expect(result.passed).toBe(false);
    const mechViolation = result.violations.find(
      (v) => v.ruleId === "BR-TCM-05" && v.cell === "C6 5-6"
    );
    expect(mechViolation).toBeDefined();
    expect(mechViolation?.type).toBe("error");
  });

  it("BR-TCM-06: warns in P3 and blocks in P4 if thinking tag is below floor", () => {
    const catalog = createMockCatalog();
    // Remove "plan" thinking tag from all items
    const withoutPlan = catalog.map((item) => ({
      ...item,
      thinkingTags: item.thinkingTags?.filter((t) => t !== "plan"),
    }));

    // In P3 with enforceFloors: warnings generated for thinking tags, but not blocking
    const p3Config: ThinkingCoverageConfig = {
      ...DEFAULT_CONFIG,
      phase: "P3",
      enforceFloors: true,
    };
    const p3Result = evaluateThinkingCoverage(withoutPlan, p3Config);
    const p3Warn = p3Result.violations.find(
      (v) => v.ruleId === "BR-TCM-06" && v.cell === "plan"
    );
    expect(p3Warn).toBeDefined();
    expect(p3Warn?.type).toBe("warning");

    // In P4 with enforceFloors: blocks with error
    const p4Config: ThinkingCoverageConfig = {
      ...DEFAULT_CONFIG,
      phase: "P4",
      enforceFloors: true,
    };
    const p4Result = evaluateThinkingCoverage(withoutPlan, p4Config);
    const p4Err = p4Result.violations.find(
      (v) => v.ruleId === "BR-TCM-06" && v.cell === "plan"
    );
    expect(p4Err).toBeDefined();
    expect(p4Err?.type).toBe("error");
    expect(p4Result.passed).toBe(false);
  });

  it("BR-TCM-07: balance law checks max/min competency ratio", () => {
    const catalog = createMockCatalog();
    // Add 100 extra levels to C1
    const extraC1: ContentItem[] = Array.from({ length: 100 }, (_, i) => ({
      code: `GL-C1-EXTRA-${i}`,
      kind: "game_level",
      status: "published",
      competencyCode: "C1",
      ageBand: "3-4",
      mechanicCode: "tap-select",
      thinkingTags: ["observe"],
    }));

    const skewed = [...catalog, ...extraC1];

    const p4Config: ThinkingCoverageConfig = {
      ...DEFAULT_CONFIG,
      phase: "P4",
      enforceFloors: true,
    };
    const result = evaluateThinkingCoverage(skewed, p4Config);
    const balanceViolation = result.violations.find(
      (v) => v.ruleId === "BR-TCM-07"
    );
    expect(balanceViolation).toBeDefined();
    expect(balanceViolation?.type).toBe("error");
    expect(balanceViolation?.actual).toBeGreaterThan(3);
  });

  it("BR-TCM-08: report clearly distinguishes errors from warnings", () => {
    const catalog = createMockCatalog();
    const config: ThinkingCoverageConfig = {
      ...DEFAULT_CONFIG,
      phase: "P3",
      enforceFloors: false,
    };

    const result = evaluateThinkingCoverage(catalog, config);
    const report = formatCoverageReport(result, config);
    expect(report).toBeDefined();
    expect(typeof report).toBe("string");
  });

  it("BR-TCM-09: report lists missing cells and counts explicitly, NEVER percentage", () => {
    const catalog = createMockCatalog();
    // Drop C2 3-4 to 4 items (missing 2)
    const modified = catalog.filter(
      (item) =>
        !(
          item.competencyCode === "C2" &&
          item.ageBand === "3-4" &&
          Number(item.id) % 2 === 0
        )
    );

    const result = evaluateThinkingCoverage(modified);
    const report = formatCoverageReport(result);

    // Assert explicit missing items
    expect(report).toContain("Phủ năng lực");
    expect(report).toContain("Đa dạng cơ chế");
    expect(report).toContain("Phủ tiến trình tư duy");

    // BR-TCM-09 INVARIANT: Never contain percentage character '%'
    expect(report).not.toContain("%");
  });

  it("BR-TCM-10: report includes disclaimer separating catalog measurement from pedagogical evidence", () => {
    const catalog = createMockCatalog();
    const result = evaluateThinkingCoverage(catalog);
    const report = formatCoverageReport(result);

    expect(report).toContain("BR-TCM-10");
    expect(report).toContain("BR-PED-01");
  });

  it("BR-TCM-11: thresholds are configurable via config object without code changes", () => {
    const customConfig: ThinkingCoverageConfig = {
      phase: "P3",
      gameLevelPerCellFloor: 10, // Custom higher floor
      mechanicPerCellFloor: 3, // Custom higher mechanic floor
      thinkingTagFloor: 8,
      balanceRatioCeiling: 2.5,
      lessonPerCellFloor: 2,
      enforceFloors: true,
    };

    const catalog = createMockCatalog(); // Has 7 levels & 3 mechanics per cell
    const result = evaluateThinkingCoverage(catalog, customConfig);

    // Floor 10 will fail since catalog only has 7 per cell
    expect(result.passed).toBe(false);
    const cellViolations = result.violations.filter(
      (v) => v.ruleId === "BR-TCM-04"
    );
    expect(cellViolations.length).toBeGreaterThan(0);
    expect(cellViolations[0]?.expected).toBe(10);
  });

  it("BR-LVB-05 & BR-TCM-01: rejects unregistered mechanic in template/content item with error violation", () => {
    const items: ContentItem[] = [
      {
        code: "GL-TEST-UNREG-MECH",
        kind: "game_level",
        status: "published",
        competencyCode: "C1",
        ageBand: "3-4",
        mechanicCode: "unregistered-alien-mechanic",
      },
    ];

    const result = evaluateThinkingCoverage(items);
    expect(result.passed).toBe(false);
    expect(
      result.violations.some(
        (v) =>
          v.ruleId === "BR-TCM-01" &&
          v.message.includes("unregistered-alien-mechanic")
      )
    ).toBe(true);
  });
});

describe("BR-TCM-03 — nguồn đọc corpus seed", () => {
  const mechanics = new Map([["GT-001", "tap-select"]]);

  function seedLevel(over: Record<string, unknown>) {
    return {
      header: {
        code: "GL-C3-CLS-BOX-0001",
        template_code: "GT-001",
        age_min: 4,
        skill_codes: ["C3.CLS.01"],
        what_tags: ["category"],
        thinking_tags: ["sort"],
        origin: "human" as const,
        ...over,
      },
    };
  }

  it("quy được competency và mechanic thì thành ContentItem", () => {
    const { items, unresolved } = mapSeedLevels([seedLevel({})], mechanics);

    expect(unresolved).toHaveLength(0);
    expect(items).toHaveLength(1);
    expect(items[0]?.competencyCode).toBe("C3");
    expect(items[0]?.ageBand).toBe("4-5");
    expect(items[0]?.mechanicCode).toBe("tap-select");
  });

  it("CA ÂM — competency không quy được thì nêu ra, KHÔNG mặc định về C1", () => {
    const { items, unresolved } = mapSeedLevels(
      [seedLevel({ code: "GL-XX-CLS-BOX-0001", skill_codes: [] })],
      mechanics
    );

    expect(items).toHaveLength(0);
    expect(unresolved).toHaveLength(1);
    expect(unresolved[0]?.reason).toContain("competency");
  });

  it("CA ÂM — template ngoài registry thì nêu ra, KHÔNG mặc định về tap-select", () => {
    const { items, unresolved } = mapSeedLevels(
      [seedLevel({ template_code: "GT-999" })],
      mechanics
    );

    expect(items).toHaveLength(0);
    expect(unresolved[0]?.reason).toContain("GT-999");
  });
});

describe("Cổng đo phủ tư duy trên corpus seed thật (BR-TCM-01..11)", () => {
  it("mọi hàng seed quy được về competency và mechanic (BR-TCM-03)", async () => {
    const { unresolved } = await loadItemsFromSeedCorpus();

    expect(unresolved).toEqual([]);
  });

  it("corpus seed đạt mọi quy định phủ tư duy", async () => {
    const { items } = await loadItemsFromSeedCorpus();
    const config: ThinkingCoverageConfig = {
      ...DEFAULT_CONFIG,
      ...(JSON.parse(
        readFileSync(
          resolve(import.meta.dirname, "thinking-coverage-config.json"),
          "utf8"
        )
      ) as Partial<ThinkingCoverageConfig>),
    };

    const result = evaluateThinkingCoverage(items, config);

    // Cùng tiêu chí đỏ/xanh với CLI `lint:thinking-coverage` cũ: chỉ vi phạm
    // mức `error` chặn, hàng `warning` là sàn phase kế tiếp (BR-TCM-06).
    expect(result.violations.filter((v) => v.type === "error")).toEqual([]);
    expect(result.passed).toBe(true);
  });
});
