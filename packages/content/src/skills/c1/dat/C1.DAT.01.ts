import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_DAT_01_IDENTITY: SkillIdentity = {
  code: "C1.DAT.01",
  strand_code: "C1.DAT",
  competency_code: "C1",
  name: "Đếm rồi ghi lại bằng dấu",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["count", "create"],
  tier: "basic",
  prerequisites: ["C1.CNT.01"],
  learning_objectives: [
    {
      code: "LO-C1.DAT.01-01",
      behaviour: "Nhận biết và thực hành Đếm rồi ghi lại bằng dấu ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.DAT.01-02",
      behaviour: "Vận dụng Đếm rồi ghi lại bằng dấu trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.DAT.01-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Đếm rồi ghi lại bằng dấu",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_DAT_01_DATASET: SkillDataset = {
  skill_code: "C1.DAT.01",
  concept_label: "Đếm rồi ghi lại bằng dấu",
  surface: "game",
  items: [
    {
      id: "dat_apple_1",
      label: "quả táo một",
      glyph: "🍎",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🍎",
      },
      contrast_group: "fruit",
      category: {
        tally_type: "táo",
      },
    },
    {
      id: "dat_apple_2",
      label: "quả táo hai",
      glyph: "🍎",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🍎",
      },
      contrast_group: "fruit",
      category: {
        tally_type: "táo",
      },
    },
    {
      id: "dat_apple_3",
      label: "quả táo ba",
      glyph: "🍎",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🍎",
      },
      contrast_group: "fruit",
      category: {
        tally_type: "táo",
      },
    },
    {
      id: "dat_orange_1",
      label: "quả cam một",
      glyph: "🍊",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🍊",
      },
      contrast_group: "fruit",
      category: {
        tally_type: "cam",
      },
    },
    {
      id: "dat_orange_2",
      label: "quả cam hai",
      glyph: "🍊",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🍊",
      },
      contrast_group: "fruit",
      category: {
        tally_type: "cam",
      },
    },
    {
      id: "dat_orange_3",
      label: "quả cam ba",
      glyph: "🍊",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🍊",
      },
      contrast_group: "fruit",
      category: {
        tally_type: "cam",
      },
    },
  ],
  axes: {
    tally_type: {
      values: ["táo", "cam"],
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với đếm rồi ghi lại bằng dấu",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng đếm rồi ghi lại bằng dấu",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt đếm rồi ghi lại bằng dấu với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi đếm rồi ghi lại bằng dấu",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục đếm rồi ghi lại bằng dấu và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Bé đếm rồi biểu diễn số lượng {label} nhé!",
    narration_template:
      "Chúng mình cùng tìm hiểu về Đếm rồi ghi lại bằng dấu nhé",
  },
};

export const C1_DAT_01_SEED: SkillSeed = {
  identity: C1_DAT_01_IDENTITY,
  dataset: C1_DAT_01_DATASET,
  levels: [
    {
      code: "GL-C1-DAT-TAP-0001",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-TAP-0002",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-TAP-0003",
      template: "GT-001",
      band: "3-4",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-TAP-0004",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-TCNT-0001",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-TCNT-0002",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-TCNT-0003",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-TCNT-0004",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-TCMP-0001",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-TCMP-0002",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-TCMP-0003",
      template: "GT-003",
      band: "3-4",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-TCMP-0004",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-SHAD-0001",
      template: "GT-007",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-SHAD-0002",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-SHAD-0003",
      template: "GT-007",
      band: "3-4",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-SHAD-0004",
      template: "GT-007",
      band: "3-4",
      difficulty: 1,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-MEMO-0001",
      template: "GT-012",
      band: "3-4",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-MEMO-0002",
      template: "GT-012",
      band: "3-4",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-MEMO-0003",
      template: "GT-012",
      band: "3-4",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-MEMO-0004",
      template: "GT-012",
      band: "3-4",
      difficulty: 1,
      theme: "vehicle",
      rounds: 3,
    },
  ],
};
