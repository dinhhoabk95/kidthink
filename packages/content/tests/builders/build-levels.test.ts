import type { SkillDataset, SkillSeed } from "@mindkid/shared";
import { describe, expect, it } from "vitest";
import { buildLevelsForSkill } from "../../src/builders/build-levels.js";
import { getSkillSeed } from "../../src/skills/index.js";

const CONTRACT_MIN_ITEMS_REGEX = /đòi tối thiểu 4 vật/;
const TEMPLATE_NOT_FOUND_REGEX =
  /Không tìm thấy bộ dựng cho khuôn GT-999_NON_EXISTENT/;

describe("buildLevelsForSkill (Task #208 / G4)", () => {
  it("dựng thành công các màn chơi cho kỹ năng hợp lệ (C1.NREC.01)", () => {
    const seed = getSkillSeed("C1.NREC.01");
    expect(seed).toBeDefined();
    if (!seed) {
      return;
    }

    const levels = buildLevelsForSkill(seed);
    expect(levels.length).toBe(seed.levels.length);
    for (const lvl of levels) {
      expect(lvl.kind).toBe("game_level");
      expect(lvl.header.skill_codes).toContain("C1.NREC.01");
      expect(lvl.content_pack).toBeDefined();
      expect(lvl.difficulty_params).toBeDefined();
      expect(lvl.rounds?.length).toBeGreaterThan(0);
    }
  });

  it("test chứng minh bắt lỗi: bộ dữ liệu 2 vật dựng cho khuôn đòi ≥4 vật (GT-004) ⟹ ném lỗi, 0 màn", () => {
    // Tạo dataset giả lập có đúng 2 vật
    const datasetWith2Items: SkillDataset = {
      skill_code: "C1.TEST.01",
      concept_label: "Thử nghiệm 2 vật",
      surface: "game",
      items: [
        {
          id: "item_01",
          label: "Vật 1",
          glyph: "1",
          image: { kind: "emoji", ref: "🍎" },
        },
        {
          id: "item_02",
          label: "Vật 2",
          glyph: "2",
          image: { kind: "emoji", ref: "🍌" },
        },
      ],
      ladder: [{ rung: 1, dimension: "count", description: "2 vật" }],
      phrasing: {
        prompt_template: "Bé hãy chọn {label}",
        narration_template: "Cùng làm quen với {label}",
        success_message: "Đúng rồi!",
      },
      ordering: ["item_01", "item_02"],
    };

    // Yêu cầu khuôn GT-004 (đòi hỏi min_items: 4)
    const invalidSkill: SkillSeed = {
      identity: {
        code: "C1.TEST.01",
        strand_code: "C1.TEST",
        competency_code: "C1",
        name: "Kỹ năng thử nghiệm",
        age_min: 3,
        age_max: 4,
        difficulty: 1,
        thinking_processes: ["observe"],
        tier: "basic",
        prerequisites: [],
      },
      dataset: datasetWith2Items,
      levels: [
        {
          template: "GT-004", // Đòi hỏi tối thiểu 4 vật
          band: "3-4",
          difficulty: 1,
          theme: "farm",
          rounds: 3,
        },
      ],
    };

    // Đòi ném lỗi và dừng ngay lập tức — 0 màn nào được trả về
    expect(() => {
      buildLevelsForSkill(invalidSkill);
    }).toThrow(CONTRACT_MIN_ITEMS_REGEX);
  });

  it("ném lỗi khi khuôn không tồn tại trong danh mục", () => {
    const seed = getSkillSeed("C1.NREC.01");
    expect(seed).toBeDefined();
    if (!seed) {
      return;
    }

    const invalidTemplateSkill: SkillSeed = {
      ...seed,
      levels: [
        {
          template: "GT-999_NON_EXISTENT",
          band: "3-4",
          difficulty: 1,
          theme: "farm",
        },
      ],
    };

    expect(() => {
      buildLevelsForSkill(invalidTemplateSkill);
    }).toThrow(TEMPLATE_NOT_FOUND_REGEX);
  });

  it("cùng hạt ngẫu nhiên ⟹ byte giống hệt giữa hai lần chạy", () => {
    const seed = getSkillSeed("C1.NREC.01");
    expect(seed).toBeDefined();
    if (!seed) {
      return;
    }

    const run1 = buildLevelsForSkill(seed);
    const run2 = buildLevelsForSkill(seed);

    const json1 = JSON.stringify(run1);
    const json2 = JSON.stringify(run2);

    expect(json1).toBe(json2);
    expect(json1.length).toBeGreaterThan(100);
  });
});
