/**
 * Bộ kiểm thử ca âm cổng kiểm tra hai chiều kho giá trị (Task #265 / L5).
 *
 * Kiểm tra đầy đủ các ca âm bắt buộc theo kịch bản BDD của spec skill-value-inventory.md:
 * - T5.1 (BR-SVI-02): Thêm "cup" vào C5.LET.03 -> cổng đỏ, nêu đúng "cup"
 * - T5.2 (BR-SVI-03): Xoá "let_r" khỏi C5.LET -> cổng đỏ, nêu đúng "let_r"
 * - T5.3 (BR-SVI-06): Thiếu c1-numeral.ts -> cổng đỏ, nêu target C1.NREC không có kho
 * - T5.4 (BR-SVI-08): Chữ số thiếu audio_path -> cổng đỏ, nêu đúng value
 * - T5.5 (BR-SVI-08): audio_path trỏ file không tồn tại -> cổng đỏ
 * - T5.6 (BR-SVI-09): C1.ORD.01 chỉ có emoji, không glyph không value -> cổng đỏ (dùng fixture)
 * - T5.7 (BR-SVI-11): C1.CMP.04 chỉ có cực "nhiều" -> cổng đỏ, nêu cặp khuyết cực
 * - T5.8 (BR-SVI-12): Nợ tăng từ 30 lên 31 -> cổng đỏ, nêu ratchet đi lùi
 * - T5.9 (BR-SVI-09): runValueInventoryCheck() phát hiện vi phạm BR-SVI-09 và trả exitCode 1
 * - T5.10 (BR-SVI-11): C1.CMP.04 có 0 cực (không nhiều, không ít) -> cổng đỏ cả 2 cực
 * - T5.11 (BR-SVI-02): Chiều 1 trên C1.NREC bắt được item ngoại lai "banana"
 * - T5.12 (BR-SVI-08): audio_path của ordinal trỏ file ma -> cổng đỏ
 * - T5.13 (BR-SVI-10): checkItemPropertiesMatchInventory bắt được glyph dataset lệch kho
 * - T5.14 (BR-SVI-12): readBaseline ném lỗi khi file baseline JSON hỏng cú pháp
 * - T5.15 (BR-SVI-12): handleUpdateBaseline từ chối target mới khi thiếu --accept-new-target
 */

import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  C1_MEASURE_DIMENSION_INVENTORY,
  type NumeralInventoryItem,
  type OrdinalInventoryItem,
  SKILL_DATASETS,
} from "@mindkid/content";
import type { SkillDataset } from "@mindkid/shared";
import { describe, expect, it } from "vitest";
import {
  buildC1NumeralTarget,
  buildC5LetTarget,
  checkInventoryFilesExist,
  checkItemPropertiesMatchInventory,
  checkMeasureDimensionsPolarity,
  checkNumeralInventoryProperties,
  checkOrdinalInventoryProperties,
  checkRatchetProgression,
  checkSkillNumeralOrOrdinalSource,
  checkTargetCoverage,
  checkTargetValidity,
  handleUpdateBaseline,
  type InvalidItemViolation,
  type InventoryBaselineData,
  type InventoryDebtReport,
  readBaseline,
  runValueInventoryCheck,
} from "./check-value-inventory.js";

describe("check-value-inventory negative tests (BR-SVI-02..12)", () => {
  // T5.1 Ca âm BR-SVI-02
  it("T5.1 [BR-SVI-02] phát hiện item ngoại lai 'cup' trong dataset C5.LET.03", () => {
    const originalDataset = SKILL_DATASETS["C5.LET.03"];
    if (!originalDataset) {
      throw new Error("Missing C5.LET.03 dataset");
    }

    const contaminatedDataset: SkillDataset = {
      ...originalDataset,
      items: [
        ...originalDataset.items,
        {
          id: "cup",
          label: "cái cốc",
          image: { kind: "emoji", ref: "🥛" },
        },
      ],
    };

    const mockDatasets: Record<string, SkillDataset> = {
      ...SKILL_DATASETS,
      "C5.LET.03": contaminatedDataset,
    };

    const violations: InvalidItemViolation[] = [];
    checkTargetValidity(buildC5LetTarget(), violations, mockDatasets);

    expect(violations.length).toBeGreaterThanOrEqual(1);
    const cupViolation = violations.find((v) => v.itemId === "cup");
    expect(cupViolation).toBeDefined();
    expect(cupViolation?.skillCode).toBe("C5.LET.03");
  });

  // T5.2 Ca âm BR-SVI-03
  it("T5.2 [BR-SVI-03] phát hiện thiếu đúng 'let_r' khi xoá khỏi hợp dataset C5.LET", () => {
    const mockDatasets: Record<string, SkillDataset> = {};

    for (const [code, ds] of Object.entries(SKILL_DATASETS)) {
      if (code.startsWith("C5.LET") || code === "C5.ALP.04") {
        mockDatasets[code] = {
          ...ds,
          items: ds.items.filter((item) => item.id !== "let_r"),
        };
      } else {
        mockDatasets[code] = ds;
      }
    }

    const missing = checkTargetCoverage(buildC5LetTarget(), mockDatasets);
    expect(missing).toContain("let_r");
  });

  // T5.3 Ca âm BR-SVI-06
  it("T5.3 [BR-SVI-06] phát hiện thiếu file c1-numeral.ts và nêu target C1.NREC", () => {
    const violations = checkInventoryFilesExist("/non/existent/repo/root");
    expect(violations.length).toBeGreaterThan(0);

    const nrecViolation = violations.find(
      (v) => v.code === "BR-SVI-06" && v.message.includes("C1.NREC")
    );
    expect(nrecViolation).toBeDefined();
    expect(nrecViolation?.message).toContain("c1-numeral.ts");
  });

  // T5.4 Ca âm BR-SVI-08 (thiếu audio_path)
  it("T5.4 [BR-SVI-08] phát hiện mục chữ số thiếu audio_path và nêu đúng value", () => {
    const mockItems: NumeralInventoryItem[] = [
      {
        id: "num_7",
        glyph: "7",
        label: "số bảy",
        value: 7,
        audio_path: "", // Thiếu audio_path
        required: true,
        group: "C1.NREC.03",
      },
    ];

    const violations = checkNumeralInventoryProperties(mockItems);
    expect(violations.length).toBe(1);
    expect(violations[0]?.code).toBe("BR-SVI-08");
    expect(violations[0]?.message).toContain("value: 7");
    expect(violations[0]?.message).toContain("audio_path");
  });

  // T5.5 Ca âm BR-SVI-08 (audio_path trỏ file không tồn tại)
  it("T5.5 [BR-SVI-08] phát hiện audio_path trỏ file không tồn tại trên đĩa", () => {
    const mockItems: NumeralInventoryItem[] = [
      {
        id: "num_99",
        glyph: "99",
        label: "số chín mươi chín",
        value: 99,
        audio_path: "/audio/voice/common/numbers/ghost_99999.mp3",
        required: false,
        group: "C1.NREC.04",
      },
    ];

    const violations = checkNumeralInventoryProperties(mockItems);
    expect(violations.length).toBe(1);
    expect(violations[0]?.code).toBe("BR-SVI-08");
    expect(violations[0]?.message).toContain("không tồn tại trên đĩa");
  });

  // T5.6 Ca âm BR-SVI-09 (fixture)
  it("T5.6 [BR-SVI-09] phát hiện C1.ORD.01 chỉ có emoji, không glyph không value", () => {
    const mockDataset: SkillDataset = {
      skill_code: "C1.ORD.01",
      concept_label: "Số thứ tự 1-3",
      surface: "game",
      items: [
        {
          id: "duck",
          label: "vịt",
          image: { kind: "emoji", ref: "🦆" },
        },
      ],
      ladder: [],
      phrasing: {
        prompt_template: "",
      },
      ordering: ["duck"],
    };

    const violations = checkSkillNumeralOrOrdinalSource(
      "C1.ORD.01",
      mockDataset
    );
    expect(violations.length).toBe(1);
    expect(violations[0]?.code).toBe("BR-SVI-09");
    expect(violations[0]?.message).toContain("C1.ORD.01");
    expect(violations[0]?.message).toContain(
      "không lấy giá trị nào từ c1-ordinal"
    );
  });

  // T5.7 Ca âm BR-SVI-11
  it("T5.7 [BR-SVI-11] phát hiện dataset C1.CMP.04 chỉ có cực 'nhiều' khuyết cực 'ít'", () => {
    const mockDataset: SkillDataset = {
      skill_code: "C1.CMP.04",
      concept_label: "Lượng (nhiều – ít)",
      surface: "game",
      items: [
        {
          id: "apple_many",
          label: "nhiều quả táo",
          image: { kind: "emoji", ref: "🍎" },
        },
      ],
      ladder: [],
      phrasing: {
        prompt_template: "",
      },
      ordering: ["apple_many"],
    };

    const violations = checkMeasureDimensionsPolarity(
      { "C1.CMP.04": mockDataset },
      C1_MEASURE_DIMENSION_INVENTORY
    );

    expect(violations.length).toBeGreaterThanOrEqual(1);
    const dimQuantityViolation = violations.find(
      (v) => v.code === "BR-SVI-11" && v.message.includes("lượng (nhiều – ít)")
    );
    expect(dimQuantityViolation).toBeDefined();
    expect(dimQuantityViolation?.message).toContain('chỉ chứa cực "nhiều"');
    expect(dimQuantityViolation?.message).toContain('không chứa cực "ít"');
  });

  // T5.8 Ca âm BR-SVI-12
  it("T5.8 [BR-SVI-12] phát hiện ratchet đi lùi khi nợ đo ra 31 trong khi baseline là 30", () => {
    const violations = checkRatchetProgression(31, 30);
    expect(violations.length).toBe(1);
    expect(violations[0]?.code).toBe("BR-SVI-12");
    expect(violations[0]?.message).toContain(
      "nợ giá trị kho tăng từ 30 lên 31"
    );
  });

  // T5.9 Ca âm BR-SVI-09 qua runValueInventoryCheck()
  it("T5.9 [BR-SVI-09] runValueInventoryCheck() phát hiện vi phạm BR-SVI-09 và trả exitCode 1", () => {
    const mockDataset: SkillDataset = {
      skill_code: "C1.ORD.01",
      concept_label: "Số thứ tự 1-3",
      surface: "game",
      items: [
        {
          id: "duck",
          label: "vịt",
          image: { kind: "emoji", ref: "🦆" },
        },
      ],
      ladder: [],
      phrasing: {
        prompt_template: "",
      },
      ordering: ["duck"],
    };

    const mockDatasets: Record<string, SkillDataset> = {
      ...SKILL_DATASETS,
      "C1.ORD.01": mockDataset,
    };

    const result = runValueInventoryCheck({
      isUpdate: false,
      datasets: mockDatasets,
    });

    expect(result.exitCode).toBe(1);
    const violation = result.sanityViolations.find(
      (v) => v.code === "BR-SVI-09" && v.message.includes("C1.ORD.01")
    );
    expect(violation).toBeDefined();
  });

  // T5.10 Ca âm BR-SVI-11 (0 cực)
  it("T5.10 [BR-SVI-11] phát hiện dataset C1.CMP.04 có 0 cực (không nhiều, không ít)", () => {
    const mockDataset: SkillDataset = {
      skill_code: "C1.CMP.04",
      concept_label: "Lượng (nhiều – ít)",
      surface: "game",
      items: [
        {
          id: "apple_red",
          label: "quả táo đỏ",
          image: { kind: "emoji", ref: "🍎" },
        },
      ],
      ladder: [],
      phrasing: {
        prompt_template: "",
      },
      ordering: ["apple_red"],
    };

    const violations = checkMeasureDimensionsPolarity(
      { "C1.CMP.04": mockDataset },
      C1_MEASURE_DIMENSION_INVENTORY
    );

    const violation = violations.find(
      (v) => v.code === "BR-SVI-11" && v.message.includes("lượng (nhiều – ít)")
    );
    expect(violation).toBeDefined();
    expect(violation?.message).toContain('không chứa cả "nhiều" và "ít"');
  });

  // T5.11 Ca âm BR-SVI-02 (Chiều 1 trên C1.NREC)
  it("T5.11 [BR-SVI-02] phát hiện item ngoại lai 'banana' trong dataset C1.NREC.01", () => {
    const originalDataset = SKILL_DATASETS["C1.NREC.01"];
    if (!originalDataset) {
      throw new Error("Missing C1.NREC.01 dataset");
    }

    const contaminatedDataset: SkillDataset = {
      ...originalDataset,
      items: [
        ...originalDataset.items,
        {
          id: "banana",
          label: "quả chuối",
          image: { kind: "emoji", ref: "🍌" },
        },
      ],
    };

    const mockDatasets: Record<string, SkillDataset> = {
      ...SKILL_DATASETS,
      "C1.NREC.01": contaminatedDataset,
    };

    const violations: InvalidItemViolation[] = [];
    checkTargetValidity(buildC1NumeralTarget(), violations, mockDatasets);

    expect(violations.length).toBeGreaterThanOrEqual(1);
    const bananaViolation = violations.find((v) => v.itemId === "banana");
    expect(bananaViolation).toBeDefined();
    expect(bananaViolation?.skillCode).toBe("C1.NREC.01");
  });

  // T5.12 Ca âm BR-SVI-08 (ordinal audio_path trỏ file ma)
  it("T5.12 [BR-SVI-08] phát hiện audio_path của mục ordinal trỏ file ma", () => {
    const mockItems: OrdinalInventoryItem[] = [
      {
        id: "ord_1",
        glyph: "1",
        label: "thứ nhất",
        position: 1,
        audio_path: "/audio/voice/common/ordinals/ghost_ord_1.mp3",
        group: "C1.ORD.01",
      },
    ];

    const violations = checkOrdinalInventoryProperties(
      mockItems,
      "/fake/repo/root"
    );
    expect(violations.length).toBe(1);
    expect(violations[0]?.code).toBe("BR-SVI-08");
    expect(violations[0]?.message).toContain("không tồn tại trên đĩa");
  });

  // T5.13 Ca âm BR-SVI-05 (glyph dataset lệch kho)
  it("T5.13 [BR-SVI-05] phát hiện dataset có glyph lệch so với khai báo trong kho giá trị", () => {
    const mockDataset: SkillDataset = {
      skill_code: "C5.TON.04",
      concept_label: "Dấu hỏi",
      surface: "game",
      items: [
        {
          id: "tmk_hoi",
          label: "dấu hỏi",
          glyph: "ˀ", // Lệch glyph so với kho (kho dùng U+0309: "̉")
          image: { kind: "emoji", ref: "❓" },
        },
      ],
      ladder: [],
      phrasing: {
        prompt_template: "",
      },
      ordering: ["tmk_hoi"],
    };

    const violations = checkItemPropertiesMatchInventory({
      "C5.TON.04": mockDataset,
    });

    expect(violations.length).toBe(1);
    expect(violations[0]?.code).toBe("BR-SVI-05");
    expect(violations[0]?.message).toContain("tmk_hoi");
    expect(violations[0]?.message).toContain("glyph");
  });

  // T5.14 Ca âm BR-SVI-12 (readBaseline lỗi parse JSON)
  it("T5.14 [BR-SVI-12] readBaseline ném ngoại lệ khi file baseline JSON hỏng cú pháp", () => {
    const brokenJsonPath = join(tmpdir(), `broken-baseline-${Date.now()}.json`);
    writeFileSync(brokenJsonPath, "{ broken json ...", "utf-8");

    expect(() => readBaseline(brokenJsonPath)).toThrow("[BR-SVI-12]");
  });

  // T5.15 Ca âm BR-SVI-12 (handleUpdateBaseline từ chối target mới)
  it("T5.15 [BR-SVI-12] handleUpdateBaseline trả exitCode 1 khi có target mới mà không truyền cờ chấp nhận", () => {
    const mockReport: InventoryDebtReport = {
      totalMissing: 5,
      missingByTarget: {
        "C5.LET": [],
        "TARGET.NEW": ["item_x", "item_y"],
      },
      invalidItems: [],
    };

    const mockBaseline: InventoryBaselineData = {
      total_missing_items: 0,
      missing_by_target: {
        "C5.LET": [],
      },
    };

    const result = handleUpdateBaseline(mockReport, mockBaseline, [], []);
    expect(result.exitCode).toBe(1);
  });
});
