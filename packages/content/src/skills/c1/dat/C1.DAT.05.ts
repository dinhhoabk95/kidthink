import { getQuantityRep } from "#src/inventories/index";

export const C1_DAT_05_REP = getQuantityRep("rep_tally");

import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_DAT_05_IDENTITY: SkillIdentity = {
  code: "C1.DAT.05",
  strand_code: "C1.DAT",
  competency_code: "C1",
  name: "Trả lời câu hỏi từ biểu đồ",
  age_min: 6,
  age_max: 7,
  difficulty: 4,
  thinking_processes: ["infer", "compare"],
  tier: "advanced",
  prerequisites: ["C1.DAT.03"],
  learning_objectives: [
    {
      code: "LO-C1.DAT.05-01",
      behaviour:
        "Nhận biết và thực hành Trả lời câu hỏi từ biểu đồ ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.DAT.05-02",
      behaviour:
        "Vận dụng Trả lời câu hỏi từ biểu đồ trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.DAT.05-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Trả lời câu hỏi từ biểu đồ",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_DAT_05_DATASET: SkillDataset = {
  skill_code: "C1.DAT.05",
  concept_label: "Trả lời câu hỏi từ biểu đồ",
  surface: "game",
  items: [
    {
      id: "chart_min",
      label: "mục có ít nhất",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🎯",
      },
      contrast_group: "chart",
      category: {
        magnitude: "ít nhất",
      },
    },
    {
      id: "chart_item_2",
      label: "mục trung bình nhỏ",
      value: 5,
      image: {
        kind: "emoji",
        ref: "🥈",
      },
      contrast_group: "chart",
      category: {
        magnitude: "ít",
      },
    },
    {
      id: "chart_item_3",
      label: "mục trung bình lớn",
      value: 8,
      image: {
        kind: "emoji",
        ref: "🥇",
      },
      contrast_group: "chart",
      category: {
        magnitude: "nhiều",
      },
    },
    {
      id: "chart_max",
      label: "mục có nhiều nhất",
      value: 10,
      image: {
        kind: "emoji",
        ref: "🏆",
      },
      contrast_group: "chart",
      category: {
        magnitude: "nhiều nhất",
      },
    },
  ],
  relations: [
    {
      type: "sequence",
      source_id: "chart_min",
      target_id: "chart_item_2",
    },
    {
      type: "sequence",
      source_id: "chart_item_2",
      target_id: "chart_item_3",
    },
    {
      type: "sequence",
      source_id: "chart_item_3",
      target_id: "chart_max",
    },
    {
      type: "contrast",
      source_id: "chart_max",
      target_id: "chart_min",
      metadata: {
        dimension: "rank",
      },
    },
    {
      type: "subset",
      source_id: "chart_min",
      target_id: "chart_max",
      metadata: {
        relation: "part_of_total",
      },
    },
  ],
  axes: {
    magnitude: {
      values: ["ít nhất", "ít", "nhiều", "nhiều nhất"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với trả lời câu hỏi từ biểu đồ",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng trả lời câu hỏi từ biểu đồ",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt trả lời câu hỏi từ biểu đồ với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi trả lời câu hỏi từ biểu đồ",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục trả lời câu hỏi từ biểu đồ và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Bé đếm rồi biểu diễn số lượng {label} nhé!",
    narration_template:
      "Chúng mình cùng tìm hiểu về Trả lời câu hỏi từ biểu đồ nhé",
  },
};

export const C1_DAT_05_SEED: SkillSeed = {
  identity: C1_DAT_05_IDENTITY,
  dataset: C1_DAT_05_DATASET,
  levels: [
    {
      code: "GL-C1-DAT-TAP-0017",
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-TAP-0018",
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-TAP-0019",
      template: "GT-001",
      band: "5-6",
      difficulty: 5,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-TAP-0020",
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-TCNT-0017",
      template: "GT-002",
      band: "5-6",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-TCNT-0018",
      template: "GT-002",
      band: "5-6",
      difficulty: 4,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-TCNT-0019",
      template: "GT-002",
      band: "5-6",
      difficulty: 5,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-TCNT-0020",
      template: "GT-002",
      band: "5-6",
      difficulty: 3,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-PAIR-0013",
      template: "GT-004",
      band: "5-6",
      difficulty: 3,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-PAIR-0014",
      template: "GT-004",
      band: "5-6",
      difficulty: 4,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-PAIR-0015",
      template: "GT-004",
      band: "5-6",
      difficulty: 5,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-PAIR-0016",
      template: "GT-004",
      band: "5-6",
      difficulty: 3,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-PATT-0013",
      template: "GT-005",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-PATT-0014",
      template: "GT-005",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-PATT-0015",
      template: "GT-005",
      band: "5-6",
      difficulty: 5,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-PATT-0016",
      template: "GT-005",
      band: "5-6",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-SORT-0001",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-SORT-0002",
      template: "GT-006",
      band: "5-6",
      difficulty: 4,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-SORT-0003",
      template: "GT-006",
      band: "5-6",
      difficulty: 5,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-SORT-0004",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "vehicle",
      rounds: 3,
    },
  ],
};
