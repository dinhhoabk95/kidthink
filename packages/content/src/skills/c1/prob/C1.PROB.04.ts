import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_PROB_04_IDENTITY: SkillIdentity = {
  code: "C1.PROB.04",
  strand_code: "C1.PROB",
  competency_code: "C1",
  name: "Chia nhóm",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["sort", "solve"],
  tier: "advanced",
  prerequisites: ["C1.PROB.03"],
  learning_objectives: [
    {
      code: "LO-C1.PROB.04-01",
      behaviour: "Nhận biết và thực hành Chia nhóm ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.PROB.04-02",
      behaviour: "Vận dụng Chia nhóm trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.PROB.04-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Chia nhóm",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_PROB_04_DATASET: SkillDataset = {
  skill_code: "C1.PROB.04",
  concept_label: "Chia nhóm",
  surface: "game",
  items: [
    {
      id: "cake_part_1",
      label: "bánh kem sinh nhật",
      glyph: "1",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🎂",
      },
      contrast_group: "whole_cake",
      category: {
        type: "bánh nguyên chiếc",
      },
    },
    {
      id: "cake_part_2",
      label: "chiếc bánh quế nướng",
      glyph: "2",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🧇",
      },
      contrast_group: "whole_cake",
      category: {
        type: "bánh nguyên chiếc",
      },
    },
    {
      id: "cake_part_3",
      label: "miếng bánh dâu tây",
      glyph: "3",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🍰",
      },
      contrast_group: "piece_cake",
      category: {
        type: "phần bánh nhỏ",
      },
    },
    {
      id: "cake_part_4",
      label: "chiếc bánh kem cốc",
      glyph: "4",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🧁",
      },
      contrast_group: "piece_cake",
      category: {
        type: "phần bánh nhỏ",
      },
    },
    {
      id: "cake_part_5",
      label: "chiếc bánh nướng nhỏ",
      glyph: "5",
      value: 5,
      image: {
        kind: "emoji",
        ref: "🥧",
      },
      contrast_group: "piece_cake",
      category: {
        type: "phần bánh nhỏ",
      },
    },
    {
      id: "cake_part_6",
      label: "chiếc bánh flan mềm",
      glyph: "6",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🍮",
      },
      contrast_group: "piece_cake",
      category: {
        type: "phần bánh nhỏ",
      },
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "cake_part_1",
      target_id: "cake_part_2",
    },
    {
      type: "pair",
      source_id: "cake_part_3",
      target_id: "cake_part_4",
    },
    {
      type: "contrast",
      source_id: "cake_part_5",
      target_id: "cake_part_6",
    },
  ],
  axes: {
    type: {
      values: ["bánh nguyên chiếc", "phần bánh nhỏ"],
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với chia nhóm",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng chia nhóm",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt chia nhóm với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi chia nhóm",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục chia nhóm và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn đúng {label} nhé!",
    narration_template: "Chúng mình cùng tìm hiểu về Chia nhóm nhé!",
  },
  ordering: [
    "cake_part_1",
    "cake_part_2",
    "cake_part_3",
    "cake_part_4",
    "cake_part_5",
    "cake_part_6",
  ],
};

export const C1_PROB_04_SEED: SkillSeed = {
  identity: C1_PROB_04_IDENTITY,
  dataset: C1_PROB_04_DATASET,
  levels: [
    {
      code: "GL-C1-QNT-TAP-0007",
      template: "GT-001",
      band: "4-5",
      difficulty: 1,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C1-QNT-TAP-0008",
      template: "GT-001",
      band: "5-6",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-TCNT-0001",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
  ],
};
