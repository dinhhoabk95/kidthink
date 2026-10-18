/**
 * Kiểm thử đơn vị cho cổng check-thinking-structure (Task #266 / BR-STS-01..11).
 *
 * Invariant: Strict TypeScript — NO `any`, NO `unknown`.
 */

import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { SkillDataset, SkillIdentity } from "@mindkid/shared";
import { describe, expect, it } from "vitest";
import {
  type ActivitySeedLike,
  assertBaselineShape,
  checkConditionalAxesRequired,
  checkConditionalRelationsRequired,
  checkDatasetConsumerFields,
  checkTemplateStructuralAffinity,
  checkThinkingNarrowingMap,
  checkThinkingObligation,
  readBaseline,
  runThinkingStructureCheck,
  type ThinkingStructureBaselineData,
} from "./check-thinking-structure.js";

function createMockIdentity(overrides?: Partial<SkillIdentity>): SkillIdentity {
  return {
    code: "C1.TEST.01",
    strand_code: "C1.TEST",
    competency_code: "C1",
    name: "Kỹ năng test",
    age_min: 3,
    age_max: 4,
    difficulty: 1,
    thinking_processes: ["observe"],
    tier: "basic",
    prerequisites: [],
    learning_objectives: [],
    ...overrides,
  };
}

function createMockDataset(overrides?: Partial<SkillDataset>): SkillDataset {
  return {
    skill_code: "C1.TEST.01",
    concept_label: "Nhãn khái niệm test",
    surface: "game",
    items: [
      { id: "item_1", label: "Item 1", glyph: "A" },
      { id: "item_2", label: "Item 2", glyph: "B" },
    ],
    ladder: [],
    phrasing: {
      prompt_template: "Bé hãy chọn đúng {label} nhé!",
      narration_template: "Chúng mình cùng tìm hiểu về {label} nhé",
    },
    ...overrides,
  };
}

describe("check-thinking-structure (Task #266 / BR-STS-01..11)", () => {
  // ── Baseline Validation & Error Handling (C2 + C3) ─────────────────────────

  it("C2: readBaseline ném lỗi khi file baseline không tồn tại", () => {
    const nonExistentPath = join(
      tmpdir(),
      `non-existent-baseline-${Date.now()}.json`
    );
    expect(() => readBaseline(nonExistentPath)).toThrow(
      "Không tìm thấy baseline file"
    );
  });

  it("C2: readBaseline ném lỗi khi file baseline chứa JSON hỏng", () => {
    const corruptPath = join(tmpdir(), `corrupt-baseline-${Date.now()}.json`);
    writeFileSync(corruptPath, "{ hỏng json", "utf-8");
    expect(() => readBaseline(corruptPath)).toThrow();
  });

  it("C3: assertBaselineShape ném lỗi nêu đúng tên khoá thiếu", () => {
    const invalidData = {
      total_unproven_skills: 10,
      distinct_prompt_templates: 1,
      unproven_by_competency: {},
      unproven_by_thinking: {},
      unproven_skill_codes: [],
      // thiếu min_inspected_skills
    };
    expect(() => assertBaselineShape(invalidData)).toThrow(
      'Baseline thiếu khoá bắt buộc: "min_inspected_skills"'
    );
  });

  it("C3: assertBaselineShape ném lỗi khi sai kiểu dữ liệu của trường", () => {
    const wrongTypeData = {
      min_inspected_skills: "443",
      total_unproven_skills: 10,
      distinct_prompt_templates: 1,
      unproven_by_competency: {},
      unproven_by_thinking: {},
      unproven_skill_codes: [],
    };
    expect(() => assertBaselineShape(wrongTypeData)).toThrow(
      "Baseline sai kiểu: min_inspected_skills phải là số"
    );
  });

  // ── Ca âm 7.1 Ban đầu (7 ca) ──────────────────────────────────────────────

  // T5.1 Ca âm compare — thiếu axes có ordered: true
  it("T5.1: Ca âm compare — thiếu axes có thứ tự (ordered: true) -> đỏ", () => {
    const dataset = createMockDataset({
      axes: {
        color: ["red", "blue"], // không có ordered: true
      },
      relations: [
        { type: "contrast", source_id: "item_1", target_id: "item_2" },
      ],
    });
    const result = checkThinkingObligation("compare", dataset);
    expect(result.passed).toBe(false);
    expect(result.missing).toContain("thiếu axes có thứ tự");
  });

  // T5.2 Ca âm sort — trục có nhóm dưới 2 item (I4: đa trục và mọi trục phải đạt)
  it("T5.2: Ca âm sort — trục phân loại có nhóm dưới 2 item -> đỏ", () => {
    const dataset = createMockDataset({
      axes: {
        size: ["small", "large"],
      },
      items: [
        { id: "item_1", label: "Item 1", category: { size: "small" } },
        { id: "item_2", label: "Item 2", category: { size: "small" } },
        { id: "item_3", label: "Item 3", category: { size: "large" } }, // large chỉ có 1 item
      ],
    });
    const result = checkThinkingObligation("sort", dataset);
    expect(result.passed).toBe(false);
    expect(result.missing).toContain(
      'trục phân loại "size" có nhóm "large" dưới 2 item'
    );
  });

  // I4: Sort có 1 trục tốt và 1 trục hỏng -> phải đỏ
  it("I4: Ca âm sort — dataset có 1 trục tốt và 1 trục hỏng -> đỏ, nêu đúng trục hỏng", () => {
    const dataset = createMockDataset({
      axes: {
        color: ["red", "blue"],
        shape: ["circle", "square"],
      },
      items: [
        {
          id: "item_1",
          label: "Item 1",
          category: { color: "red", shape: "circle" },
        },
        {
          id: "item_2",
          label: "Item 2",
          category: { color: "red", shape: "circle" },
        },
        {
          id: "item_3",
          label: "Item 3",
          category: { color: "blue", shape: "square" },
        },
        { id: "item_4", label: "Item 4", category: { color: "blue" } }, // shape: square chỉ có 1 item!
      ],
    });
    const result = checkThinkingObligation("sort", dataset);
    expect(result.passed).toBe(false);
    expect(result.missing).toContain(
      'trục phân loại "shape" có nhóm "square" dưới 2 item'
    );
  });

  // T5.3 Ca âm match — thiếu quan hệ pair
  it("T5.3: Ca âm match — thiếu quan hệ kiểu pair trong relations -> đỏ", () => {
    const dataset = createMockDataset({
      relations: [
        { type: "contrast", source_id: "item_1", target_id: "item_2" },
      ],
    });
    const result = checkThinkingObligation("match", dataset);
    expect(result.passed).toBe(false);
    expect(result.missing).toContain("thiếu quan hệ kiểu pair trong relations");
  });

  // T5.4 Ca âm count — 0 item có value
  it("T5.4: Ca âm count — kỹ năng khai count, 0 item có value -> đỏ", () => {
    const dataset = createMockDataset({
      items: [
        { id: "item_1", label: "Item 1", glyph: "A" },
        { id: "item_2", label: "Item 2", glyph: "B" },
      ],
    });
    const result = checkThinkingObligation("count", dataset);
    expect(result.passed).toBe(false);
    expect(result.missing).toContain("0 item có trường value");
  });

  // I1: Ca âm count — kỹ năng c1-numeral thiếu giá trị required
  it("I1: Ca âm count — kỹ năng C1.NREC.01 thiếu số required (số 3) -> đỏ", () => {
    const dataset = createMockDataset({
      skill_code: "C1.NREC.01",
      items: [
        { id: "n0", label: "số 0", value: 0 },
        { id: "n1", label: "số 1", value: 1 },
        { id: "n2", label: "số 2", value: 2 },
        // thiếu số 3 (required: true trong C1.NREC.01)
      ],
    });
    const result = checkThinkingObligation("count", dataset);
    expect(result.passed).toBe(false);
    expect(result.missing).toContain(
      "tập value chưa phủ trọn khoảng theo c1-numeral"
    );
    expect(result.missing).toContain("3");
  });

  // T5.5 Ca âm sequence — ordering đúng bằng thứ tự khai và không có quan hệ sequence
  it("T5.5: Ca âm sequence — ordering đúng bằng items.map(id) theo thứ tự khai và không có quan hệ sequence -> đỏ", () => {
    const dataset = createMockDataset({
      items: [
        { id: "item_1", label: "Item 1" },
        { id: "item_2", label: "Item 2" },
      ],
      ordering: ["item_1", "item_2"],
      relations: [],
    });
    const result = checkThinkingObligation("sequence", dataset);
    expect(result.passed).toBe(false);
    expect(result.missing).toContain(
      "ordering đúng bằng thứ tự khai báo và không có quan hệ sequence"
    );
  });

  // T5.6 Ca âm deduce — chỉ có 1 trục axes
  it("T5.6: Ca âm deduce — chỉ có 1 trục axes -> đỏ (luật đòi ≥2 trục và quan hệ subset)", () => {
    const dataset = createMockDataset({
      axes: {
        size: ["small", "large"],
      },
      relations: [{ type: "subset", source_id: "item_1", target_id: "item_2" }],
    });
    const result = checkThinkingObligation("deduce", dataset);
    expect(result.passed).toBe(false);
    expect(result.missing).toContain("axes chỉ có 1 trục (đòi ≥2 trục)");
  });

  // T5.7 Ca âm listen — có item thiếu audio_path
  it("T5.7: Ca âm listen — có item thiếu audio_path -> đỏ", () => {
    const dataset = createMockDataset({
      items: [
        { id: "item_1", label: "Item 1", audio_path: "/audio/item_1.mp3" },
        { id: "item_2", label: "Item 2" }, // thiếu audio_path
      ],
    });
    const result = checkThinkingObligation("listen", dataset);
    expect(result.passed).toBe(false);
    expect(result.missing).toContain("có item thiếu audio_path");
  });

  // ── C4: 11 Ca âm còn thiếu của Bảng 7.1 ────────────────────────────────────

  // 1. observe
  it("C4.1: Ca âm observe — items không có facet phân biệt mắt (glyph, image, contrast_group) -> đỏ", () => {
    const dataset = createMockDataset({
      items: [
        { id: "item_1", label: "Item 1" },
        { id: "item_2", label: "Item 2" },
      ],
    });
    const result = checkThinkingObligation("observe", dataset);
    expect(result.passed).toBe(false);
    expect(result.missing).toContain("phân biệt bằng mắt");
  });

  // 2. infer
  it("C4.2: Ca âm infer — không có quan hệ subset và axes dưới 2 trục -> đỏ", () => {
    const dataset = createMockDataset({
      axes: {
        size: ["small", "large"],
      },
      relations: [
        { type: "contrast", source_id: "item_1", target_id: "item_2" },
      ],
    });
    const result = checkThinkingObligation("infer", dataset);
    expect(result.passed).toBe(false);
    expect(result.missing).toContain(
      "thiếu quan hệ subset hoặc axes dưới 2 trục"
    );
  });

  // 3. predict (I3: ordering tầm thường)
  it("C4.3: Ca âm predict — có quan hệ sequence nhưng ordering bằng rỗng hoặc tầm thường -> đỏ", () => {
    const dataset = createMockDataset({
      items: [
        { id: "item_1", label: "Item 1" },
        { id: "item_2", label: "Item 2" },
      ],
      relations: [
        { type: "sequence", source_id: "item_1", target_id: "item_2" },
      ],
      ordering: ["item_1", "item_2"], // tầm thường, bằng thứ tự items
    });
    const result = checkThinkingObligation("predict", dataset);
    expect(result.passed).toBe(false);
    expect(result.missing).toContain("thiếu ordering có nghĩa");
  });

  // 4. solve
  it("C4.4: Ca âm solve — axes có dưới 2 trục và relations có dưới 3 quan hệ -> đỏ", () => {
    const dataset = createMockDataset({
      axes: { size: ["small", "large"] },
      relations: [{ type: "pair", source_id: "item_1", target_id: "item_2" }],
    });
    const result = checkThinkingObligation("solve", dataset);
    expect(result.passed).toBe(false);
    expect(result.missing).toContain(
      "axes có 1 trục (<2) và relations có 1 quan hệ (<3)"
    );
  });

  // 5. verify (I2)
  it("C4.5: Ca âm verify — relations có contrast nhưng không có near_miss hay cùng contrast_group -> đỏ", () => {
    const dataset = createMockDataset({
      items: [
        { id: "item_1", label: "Item 1", contrast_group: "group_a" },
        { id: "item_2", label: "Item 2", contrast_group: "group_b" },
      ],
      relations: [
        {
          type: "contrast",
          source_id: "item_1",
          target_id: "item_2",
          // không có metadata.near_miss và 2 đầu khác contrast_group
        },
      ],
    });
    const result = checkThinkingObligation("verify", dataset);
    expect(result.passed).toBe(false);
    expect(result.missing).toContain(
      "thiếu quan hệ contrast giữa đáp án đúng và đáp án sai gần giống"
    );
  });

  // 6. create
  it("C4.6: Ca âm create — có axes nhưng items < 6 -> đỏ", () => {
    const dataset = createMockDataset({
      axes: { shape: ["circle", "square"] },
      items: [
        { id: "item_1", label: "1" },
        { id: "item_2", label: "2" },
        { id: "item_3", label: "3" },
      ],
    });
    const result = checkThinkingObligation("create", dataset);
    expect(result.passed).toBe(false);
    expect(result.missing).toContain("items chỉ có 3 (<6)");
  });

  // 7. plan
  it("C4.7: Ca âm plan — có quan hệ sequence nhưng thiếu metadata.step -> đỏ", () => {
    const dataset = createMockDataset({
      relations: [
        { type: "sequence", source_id: "item_1", target_id: "item_2" },
      ],
    });
    const result = checkThinkingObligation("plan", dataset);
    expect(result.passed).toBe(false);
    expect(result.missing).toContain(
      "thiếu quan hệ sequence với metadata.step"
    );
  });

  // 8. recall
  it("C4.8: Ca âm recall — contrast_group dưới 2 nhóm phân biệt -> đỏ", () => {
    const dataset = createMockDataset({
      items: [
        { id: "item_1", label: "Item 1", contrast_group: "grp_1" },
        { id: "item_2", label: "Item 2", contrast_group: "grp_1" },
      ],
    });
    const result = checkThinkingObligation("recall", dataset);
    expect(result.passed).toBe(false);
    expect(result.missing).toContain(
      "contrast_group chỉ có 1 nhóm phân biệt (đòi ≥2)"
    );
  });

  // 9. inhibit
  it("C4.9: Ca âm inhibit — có 2 contrast_group nhưng thiếu đánh dấu is_lure -> đỏ", () => {
    const dataset = createMockDataset({
      items: [
        { id: "item_1", label: "Item 1", contrast_group: "grp_1" },
        { id: "item_2", label: "Item 2", contrast_group: "grp_2" },
      ],
      relations: [],
    });
    const result = checkThinkingObligation("inhibit", dataset);
    expect(result.passed).toBe(false);
    expect(result.missing).toContain("thiếu đánh dấu is_lure");
  });

  // 10. shift
  it("C4.10: Ca âm shift — axes có dưới 2 trục -> đỏ", () => {
    const dataset = createMockDataset({
      axes: {
        color: ["red", "blue"],
      },
    });
    const result = checkThinkingObligation("shift", dataset);
    expect(result.passed).toBe(false);
    expect(result.missing).toContain("axes chỉ có 1 trục (đòi ≥2)");
  });

  // 11. describe
  it("C4.11: Ca âm describe — có item thiếu label -> đỏ", () => {
    const dataset = createMockDataset({
      items: [
        { id: "item_1", label: "Item 1", audio_path: "/audio/1.mp3" },
        { id: "item_2", label: "", audio_path: "/audio/2.mp3" },
      ],
    });
    const result = checkThinkingObligation("describe", dataset);
    expect(result.passed).toBe(false);
    expect(result.missing).toContain(
      "có item thiếu label hoặc thiếu audio_path"
    );
  });

  // ── Ratchet & Activity Tag Violations ──────────────────────────────────────

  // T5.8 Ca âm BR-STS-09 chiều giảm — bớt một prompt phân biệt
  it("T5.8: Ca âm BR-STS-09 chiều giảm — bớt một prompt phân biệt -> đỏ", () => {
    const tempBaselinePath = join(
      tmpdir(),
      `test-baseline-sts-09-dec-${Date.now()}.json`
    );
    const mockBaseline: ThinkingStructureBaselineData = {
      min_inspected_skills: 1,
      total_unproven_skills: 10,
      distinct_prompt_templates: 5, // baseline đòi 5
      unproven_by_competency: { C1: 10, C2: 0, C3: 0, C4: 0, C5: 0, C6: 0 },
      unproven_by_thinking: { compare: 10 },
      unproven_skill_codes: ["C1.TEST.01"],
    };
    writeFileSync(tempBaselinePath, JSON.stringify(mockBaseline), "utf-8");

    // Corpus hiện tại chỉ có 1 prompt phân biệt
    const identities = { "C1.TEST.01": createMockIdentity() };
    const datasets = {
      "C1.TEST.01": createMockDataset({
        phrasing: { prompt_template: "Prompt duy nhất" },
      }),
    };

    const { exitCode, violations } = runThinkingStructureCheck({
      baselinePath: tempBaselinePath,
      identities,
      datasets,
      activities: [],
    });

    expect(exitCode).toBe(1);
    expect(violations.some((v) => v.includes("[BR-STS-09]"))).toBe(true);
    expect(violations.some((v) => v.includes("bị giảm"))).toBe(true);
  });

  // T5.9 Ca dương BR-STS-09 chiều tăng — thêm một prompt phân biệt -> xanh
  it("T5.9: Ca dương BR-STS-09 chiều tăng — thêm prompt phân biệt -> xanh, không đỏ", () => {
    const tempBaselinePath = join(
      tmpdir(),
      `test-baseline-sts-09-inc-${Date.now()}.json`
    );
    const mockBaseline: ThinkingStructureBaselineData = {
      min_inspected_skills: 2,
      total_unproven_skills: 2,
      distinct_prompt_templates: 1, // baseline có 1
      unproven_by_competency: { C1: 2, C2: 0, C3: 0, C4: 0, C5: 0, C6: 0 },
      unproven_by_thinking: {},
      unproven_skill_codes: ["C1.TEST.01", "C1.TEST.02"],
    };
    writeFileSync(tempBaselinePath, JSON.stringify(mockBaseline), "utf-8");

    // Corpus mới có 2 prompt phân biệt (tăng từ 1 lên 2)
    const identities = {
      "C1.TEST.01": createMockIdentity({ code: "C1.TEST.01" }),
      "C1.TEST.02": createMockIdentity({ code: "C1.TEST.02" }),
    };
    const datasets = {
      "C1.TEST.01": createMockDataset({
        skill_code: "C1.TEST.01",
        phrasing: { prompt_template: "Prompt số 1" },
      }),
      "C1.TEST.02": createMockDataset({
        skill_code: "C1.TEST.02",
        phrasing: { prompt_template: "Prompt số 2" },
      }),
    };

    const { exitCode, violations } = runThinkingStructureCheck({
      baselinePath: tempBaselinePath,
      identities,
      datasets,
      activities: [],
    });

    expect(exitCode).toBe(0);
    expect(violations).toHaveLength(0);
  });

  // T5.10 Ca âm BR-STS-11 — nợ tăng từ 300 lên 301 -> đỏ, liệt kê đúng mã kỹ năng mới rơi vào nợ
  it("T5.10: Ca âm BR-STS-11 — nợ tăng từ 300 lên 301 -> đỏ, liệt kê đúng mã kỹ năng mới rơi vào nợ", () => {
    const tempBaselinePath = join(
      tmpdir(),
      `test-baseline-sts-11-inc-${Date.now()}.json`
    );
    const mockBaseline: ThinkingStructureBaselineData = {
      min_inspected_skills: 1,
      total_unproven_skills: 1,
      distinct_prompt_templates: 1,
      unproven_by_competency: { C1: 1, C2: 0, C3: 0, C4: 0, C5: 0, C6: 0 },
      unproven_by_thinking: { compare: 1 },
      unproven_skill_codes: ["C1.TEST.01"], // baseline chỉ có C1.TEST.01
    };
    writeFileSync(tempBaselinePath, JSON.stringify(mockBaseline), "utf-8");

    // Corpus hiện tại có thêm C1.TEST.NEW_DEBT chưa chứng minh được
    const identities = {
      "C1.TEST.01": createMockIdentity({
        code: "C1.TEST.01",
        thinking_processes: ["compare"],
      }),
      "C1.TEST.NEW_DEBT": createMockIdentity({
        code: "C1.TEST.NEW_DEBT",
        thinking_processes: ["compare"],
      }),
    };
    const datasets = {
      "C1.TEST.01": createMockDataset({
        skill_code: "C1.TEST.01",
        axes: undefined, // unproven compare
      }),
      "C1.TEST.NEW_DEBT": createMockDataset({
        skill_code: "C1.TEST.NEW_DEBT",
        axes: undefined, // unproven compare
      }),
    };

    const { exitCode, violations } = runThinkingStructureCheck({
      baselinePath: tempBaselinePath,
      identities,
      datasets,
      activities: [],
    });

    expect(exitCode).toBe(1);
    expect(violations.some((v) => v.includes("[BR-STS-11]"))).toBe(true);
    expect(
      violations.some(
        (v) => v.includes("C1.TEST.NEW_DEBT") && v.includes("mới rơi vào nợ")
      )
    ).toBe(true);
  });

  // I6: Ca âm BR-STS-11 — inspectedSkillsCount giảm xuống dưới min_inspected_skills
  it("I6: Ca âm BR-STS-11 — số kỹ năng kiểm tra giảm xuống dưới min_inspected_skills -> đỏ", () => {
    const tempBaselinePath = join(
      tmpdir(),
      `test-baseline-sts-11-min-skills-${Date.now()}.json`
    );
    const mockBaseline: ThinkingStructureBaselineData = {
      min_inspected_skills: 5, // baseline đòi ≥5
      total_unproven_skills: 1,
      distinct_prompt_templates: 1,
      unproven_by_competency: { C1: 1, C2: 0, C3: 0, C4: 0, C5: 0, C6: 0 },
      unproven_by_thinking: { observe: 0 },
      unproven_skill_codes: ["C1.TEST.01"],
    };
    writeFileSync(tempBaselinePath, JSON.stringify(mockBaseline), "utf-8");

    // Chỉ kiểm tra 1 kỹ năng (<5)
    const identities = {
      "C1.TEST.01": createMockIdentity({ code: "C1.TEST.01" }),
    };
    const datasets = {
      "C1.TEST.01": createMockDataset({ skill_code: "C1.TEST.01" }),
    };

    const { exitCode, violations } = runThinkingStructureCheck({
      baselinePath: tempBaselinePath,
      identities,
      datasets,
      activities: [],
    });

    expect(exitCode).toBe(1);
    expect(
      violations.some((v) => v.includes("Số kỹ năng được kiểm tra bị giảm"))
    ).toBe(true);
  });

  // T3.4 Ca âm BR-STS-08 — activity dùng từ vựng tư duy ngoài union ThinkingProcess (S7: NO cast)
  it("T3.4: Ca âm BR-STS-08 — activity khai thinking_tags: ['counting'] -> cổng đỏ, nêu đúng chuỗi ngoài union", () => {
    const invalidActivity: ActivitySeedLike = {
      header: {
        code: "ACT-C1-TEST-01",
        thinking_tags: ["counting"],
      },
    };

    const { exitCode, violations } = runThinkingStructureCheck({
      activities: [invalidActivity],
      identities: {},
      datasets: {},
    });

    expect(exitCode).toBe(1);
    expect(violations.some((v) => v.includes("[BR-STS-08]"))).toBe(true);
    expect(violations.some((v) => v.includes("counting"))).toBe(true);
  });

  // ── Task #309 S7: Anchor tests cho BR-STS-01, BR-STS-02, BR-STS-03, BR-STS-06, BR-STS-07, BR-STS-10 ──

  it("BR-STS-01: Scenario BR-STS-01 — kỹ năng C1.CMP.04 khai compare mà dataset không có axes thì cổng đỏ", () => {
    const tempBaselinePath = join(
      tmpdir(),
      `test-baseline-sts-01-${Date.now()}.json`
    );
    const mockBaseline: ThinkingStructureBaselineData = {
      min_inspected_skills: 1,
      total_unproven_skills: 0,
      distinct_prompt_templates: 1,
      unproven_by_competency: { C1: 0, C2: 0, C3: 0, C4: 0, C5: 0, C6: 0 },
      unproven_by_thinking: { compare: 0, count: 0 },
      unproven_skill_codes: [],
    };
    writeFileSync(tempBaselinePath, JSON.stringify(mockBaseline), "utf-8");

    const identities = {
      "C1.CMP.04": createMockIdentity({
        code: "C1.CMP.04",
        strand_code: "C1.CMP",
        thinking_processes: ["compare", "count"],
      }),
    };
    const datasets = {
      "C1.CMP.04": createMockDataset({
        skill_code: "C1.CMP.04",
        axes: undefined,
        items: [
          { id: "i1", label: "Nhiều táo", value: 5 },
          { id: "i2", label: "Ít táo", value: 2 },
        ],
      }),
    };

    const { exitCode, violations } = runThinkingStructureCheck({
      baselinePath: tempBaselinePath,
      identities,
      datasets,
      activities: [],
    });

    expect(exitCode).toBe(1);
    expect(
      violations.some(
        (v) =>
          v.includes("C1.CMP.04") &&
          v.includes("[BR-STS-01]") &&
          v.includes("thiếu axes có thứ tự")
      )
    ).toBe(true);
  });

  it("BR-STS-02: Scenario BR-STS-02 — kỹ năng C1.OTO.01 khai match mà relations rỗng thì cổng đỏ", () => {
    const tempBaselinePath = join(
      tmpdir(),
      `test-baseline-sts-02-${Date.now()}.json`
    );
    const mockBaseline: ThinkingStructureBaselineData = {
      min_inspected_skills: 1,
      total_unproven_skills: 0,
      distinct_prompt_templates: 1,
      unproven_by_competency: { C1: 0, C2: 0, C3: 0, C4: 0, C5: 0, C6: 0 },
      unproven_by_thinking: { match: 0 },
      unproven_skill_codes: [],
    };
    writeFileSync(tempBaselinePath, JSON.stringify(mockBaseline), "utf-8");

    const emptyRelationsDataset = createMockDataset({
      skill_code: "C1.OTO.01",
      relations: [],
    });

    const relResult = checkConditionalRelationsRequired(
      ["match"],
      emptyRelationsDataset
    );
    expect(relResult.passed).toBe(false);
    expect(relResult.missing).toContain("[BR-STS-02]");
    expect(relResult.missing).toContain("thiếu quan hệ kiểu pair");

    const { exitCode, violations } = runThinkingStructureCheck({
      baselinePath: tempBaselinePath,
      identities: {
        "C1.OTO.01": createMockIdentity({
          code: "C1.OTO.01",
          strand_code: "C1.OTO",
          thinking_processes: ["match"],
        }),
      },
      datasets: { "C1.OTO.01": emptyRelationsDataset },
      activities: [],
    });

    expect(exitCode).toBe(1);
    expect(
      violations.some(
        (v) =>
          v.includes("C1.OTO.01") &&
          v.includes("[BR-STS-02]") &&
          v.includes("thiếu quan hệ kiểu pair")
      )
    ).toBe(true);
  });

  it("BR-STS-02: ca dương — relations có quan hệ pair hợp lệ khi khai match -> xanh", () => {
    const validMatchDataset = createMockDataset({
      skill_code: "C1.OTO.01",
      relations: [{ type: "pair", source_id: "item_1", target_id: "item_2" }],
    });
    const relResult = checkConditionalRelationsRequired(
      ["match"],
      validMatchDataset
    );
    expect(relResult.passed).toBe(true);
  });

  it("BR-STS-03: Scenario BR-STS-03 — kỹ năng C3.CLS.01 khai sort với 1 item mỗi nhóm thì cổng đỏ", () => {
    const tempBaselinePath = join(
      tmpdir(),
      `test-baseline-sts-03-${Date.now()}.json`
    );
    const mockBaseline: ThinkingStructureBaselineData = {
      min_inspected_skills: 1,
      total_unproven_skills: 0,
      distinct_prompt_templates: 1,
      unproven_by_competency: { C1: 0, C2: 0, C3: 0, C4: 0, C5: 0, C6: 0 },
      unproven_by_thinking: { sort: 0 },
      unproven_skill_codes: [],
    };
    writeFileSync(tempBaselinePath, JSON.stringify(mockBaseline), "utf-8");

    const onePerGroupDataset = createMockDataset({
      skill_code: "C3.CLS.01",
      axes: {
        color: ["red", "green", "blue"],
      },
      items: [
        { id: "i1", label: "Đỏ", category: { color: "red" } },
        { id: "i2", label: "Xanh lá", category: { color: "green" } },
        { id: "i3", label: "Xanh dương", category: { color: "blue" } },
      ],
    });

    const axesResult = checkConditionalAxesRequired(
      ["sort"],
      onePerGroupDataset
    );
    expect(axesResult.passed).toBe(false);
    expect(axesResult.missing).toContain("[BR-STS-03]");
    expect(axesResult.missing).toContain("dưới 2 item");

    const { exitCode, violations } = runThinkingStructureCheck({
      baselinePath: tempBaselinePath,
      identities: {
        "C3.CLS.01": createMockIdentity({
          code: "C3.CLS.01",
          competency_code: "C3",
          strand_code: "C3.CLS",
          thinking_processes: ["sort"],
        }),
      },
      datasets: { "C3.CLS.01": onePerGroupDataset },
      activities: [],
    });

    expect(exitCode).toBe(1);
    expect(
      violations.some(
        (v) =>
          v.includes("C3.CLS.01") &&
          v.includes("[BR-STS-03]") &&
          v.includes("dưới 2 item")
      )
    ).toBe(true);
  });

  it("BR-STS-06: kiểm tra bảng ánh xạ thu hẹp THINKING_TAG_NORMALIZE_MAP khớp mục 7.2 (ca dương & ca âm)", () => {
    expect(checkThinkingNarrowingMap()).toEqual([]);

    // Ca âm 1: thêm ánh xạ thu hẹp chưa khai báo ở mục 7.2
    const undeclaredViolations = checkThinkingNarrowingMap({
      solve: "infer",
      verify: "compare",
      create: "plan",
      listen: "observe",
      describe: "observe",
      deduce: "infer",
      visual: "observe",
    });
    expect(undeclaredViolations.some((v) => v.includes("[BR-STS-06]"))).toBe(
      true
    );
    expect(undeclaredViolations.some((v) => v.includes('"visual"'))).toBe(true);

    // Ca âm 2: sai đích ánh xạ (deduce -> observe thay vì infer)
    const wrongTargetResult = runThinkingStructureCheck({
      identities: {},
      datasets: {},
      activities: [],
      normalizeMap: {
        solve: "infer",
        verify: "compare",
        create: "plan",
        listen: "observe",
        describe: "observe",
        deduce: "observe",
      },
    });
    expect(wrongTargetResult.exitCode).toBe(1);
    expect(
      wrongTargetResult.violations.some(
        (v) => v.includes("[BR-STS-06]") && v.includes('"deduce"')
      )
    ).toBe(true);
  });

  it("BR-STS-07: kiểm tra cấm trường chết không có consumer (phrasing.success_message, phrasing.hint_message)", () => {
    // Ca dương trên toàn bộ SKILL_DATASETS thật
    expect(checkDatasetConsumerFields()).toEqual([]);

    // Ca âm: dataset lén chứa phrasing.success_message và phrasing.hint_message đã bị xoá ở mục 7.3
    const baseDataset = createMockDataset({ skill_code: "C1.TEST.DEAD" });
    const deadPhrasing: SkillDataset["phrasing"] & {
      readonly success_message: string;
      readonly hint_message: string;
    } = {
      ...baseDataset.phrasing,
      success_message: "Giỏi lắm!",
      hint_message: "Gợi ý nè!",
    };
    const datasetWithDeadFields: SkillDataset = {
      ...baseDataset,
      phrasing: deadPhrasing,
    };

    const { exitCode, violations } = runThinkingStructureCheck({
      identities: {},
      datasets: { "C1.TEST.DEAD": datasetWithDeadFields },
      activities: [],
    });

    expect(exitCode).toBe(1);
    expect(
      violations.some(
        (v) =>
          v.includes("[BR-STS-07]") && v.includes("phrasing.success_message")
      )
    ).toBe(true);
    expect(
      violations.some(
        (v) => v.includes("[BR-STS-07]") && v.includes("phrasing.hint_message")
      )
    ).toBe(true);
  });

  it("BR-STS-10: engine phải khớp bản chất cấu trúc mà kỹ năng khai (ca âm & ca dương)", () => {
    // Ca âm 1: C1.CMP (so sánh) ghép với GT-007 (number-bond)
    const cmpWithBond = checkTemplateStructuralAffinity(
      {
        code: "C1.CMP.04",
        strand_code: "C1.CMP",
        thinking_processes: ["compare", "count"],
      },
      "GT-007"
    );
    expect(cmpWithBond.compatible).toBe(false);
    expect(cmpWithBond.reason).toContain("[BR-STS-10]");
    expect(cmpWithBond.reason).toContain("GT-007");

    // Ca âm 2: C1.ORD (thứ tự) ghép với GT-016 (clock-hands)
    const ordWithClock = checkTemplateStructuralAffinity(
      {
        code: "C1.ORD.01",
        strand_code: "C1.ORD",
        thinking_processes: ["sequence", "count"],
      },
      "GT-016"
    );
    expect(ordWithClock.compatible).toBe(false);
    expect(ordWithClock.reason).toContain("[BR-STS-10]");
    expect(ordWithClock.reason).toContain("GT-016");

    // Ca âm 3: Kỹ năng khai compare nhưng dataset thiếu cấu trúc axes có thứ tự / contrast
    const cmpWithoutStructure = checkTemplateStructuralAffinity(
      {
        code: "C1.CMP.04",
        strand_code: "C1.CMP",
        thinking_processes: ["compare"],
      },
      "GT-031",
      createMockDataset({ skill_code: "C1.CMP.04", axes: undefined })
    );
    expect(cmpWithoutStructure.compatible).toBe(false);
    expect(cmpWithoutStructure.reason).toContain("[BR-STS-10]");

    // Ca dương: C1.NCOMP.01 ghép với GT-007 khi dataset đủ value và min_items
    const validBond = checkTemplateStructuralAffinity(
      {
        code: "C1.NCOMP.01",
        strand_code: "C1.NCOMP",
        thinking_processes: ["count"],
      },
      "GT-007",
      createMockDataset({
        skill_code: "C1.NCOMP.01",
        items: [
          { id: "n1", label: "Một", value: 1 },
          { id: "n2", label: "Hai", value: 2 },
        ],
      }),
      { min_items: 2, max_items: 10, needs: ["value"] }
    );
    expect(validBond.compatible).toBe(true);
  });
});
