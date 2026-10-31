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
      label: "một quả táo",
      glyph: "🍎",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🍎",
      },
      ordering: 1,
      contrast_group: "quantity",
      category: {
        type: "nhóm trái cây",
        tally_count: "1",
      },
    },
    {
      id: "dat_apple_2",
      label: "hai quả táo",
      glyph: "🍎🍎",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🍏",
      },
      ordering: 2,
      contrast_group: "quantity",
      category: {
        type: "nhóm trái cây",
        tally_count: "2",
      },
    },
    {
      id: "dat_apple_3",
      label: "ba quả táo",
      glyph: "🍎🍎🍎",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🍐",
      },
      ordering: 3,
      contrast_group: "quantity",
      category: {
        type: "nhóm trái cây",
        tally_count: "3",
      },
    },
    {
      id: "dat_orange_4",
      label: "bốn quả cam",
      glyph: "🍊🍊🍊🍊",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🍊",
      },
      ordering: 4,
      contrast_group: "quantity",
      category: {
        type: "nhóm trái cây",
        tally_count: "4",
      },
    },
    {
      id: "dat_orange_5",
      label: "năm quả cam",
      glyph: "🍊🍊🍊🍊🍊",
      value: 5,
      image: {
        kind: "emoji",
        ref: "🍋",
      },
      ordering: 5,
      contrast_group: "quantity",
      category: {
        type: "nhóm trái cây",
        tally_count: "5",
      },
    },
    {
      id: "dat_strawberry_6",
      label: "sáu quả dâu",
      glyph: "🍓🍓🍓🍓🍓🍓",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🍓",
      },
      ordering: 6,
      contrast_group: "quantity",
      category: {
        type: "nhóm trái cây",
        tally_count: "6",
      },
    },
  ],
  relations: [
    {
      type: "sequence",
      source_id: "dat_apple_1",
      target_id: "dat_apple_2",
    },
    {
      type: "sequence",
      source_id: "dat_apple_2",
      target_id: "dat_apple_3",
    },
    {
      type: "sequence",
      source_id: "dat_apple_3",
      target_id: "dat_orange_4",
    },
    {
      type: "sequence",
      source_id: "dat_orange_4",
      target_id: "dat_orange_5",
    },
    {
      type: "sequence",
      source_id: "dat_orange_5",
      target_id: "dat_strawberry_6",
    },
    {
      type: "contrast",
      source_id: "dat_strawberry_6",
      target_id: "dat_apple_1",
      metadata: {
        dimension: "quantity",
      },
    },
  ],
  axes: {
    tally_count: {
      values: ["1", "2", "3", "4", "5", "6"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với đếm rồi ghi lại bằng dấu",
      representation: "discrete-object",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng đếm rồi ghi lại bằng dấu",
      representation: "dot-pattern",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt đếm rồi ghi lại bằng dấu với phương án nhiễu",
      representation: "tally",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi đếm rồi ghi lại bằng dấu",
      representation: "tally",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục đếm rồi ghi lại bằng dấu và tự làm một mình",
      representation: "tally",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn nhóm có {label} nhé!",
    narration_template:
      "Chúng mình cùng tìm hiểu về đếm và ghi lại bằng dấu nhé",
  },
  ordering: [
    "dat_apple_1",
    "dat_apple_2",
    "dat_apple_3",
    "dat_orange_4",
    "dat_orange_5",
    "dat_strawberry_6",
  ],
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
  ],
};
