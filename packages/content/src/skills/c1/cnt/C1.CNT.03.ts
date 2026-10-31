import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_CNT_03_IDENTITY: SkillIdentity = {
  code: "C1.CNT.03",
  strand_code: "C1.CNT",
  competency_code: "C1",
  name: "Đếm đủ từng vật",
  age_min: 3,
  age_max: 3,
  difficulty: 2,
  thinking_processes: ["count", "verify"],
  tier: "basic",
  prerequisites: ["C1.CNT.01"],
  learning_objectives: [
    {
      code: "LO-C1.CNT.03-01",
      behaviour: "Nhận biết và thực hành Đếm không bỏ sót ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.CNT.03-02",
      behaviour: "Vận dụng Đếm không bỏ sót trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.CNT.03-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Đếm không bỏ sót",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_CNT_03_DATASET: SkillDataset = {
  skill_code: "C1.CNT.03",
  concept_label: "Đếm đủ từng vật",
  surface: "game",
  items: [
    {
      id: "cnt03_1",
      label: "một bông hoa",
      glyph: "🌸",
      value: 1,
      contrast_group: "quantity",
      ordering: 1,
      category: {
        type: "đồ vật nhỏ",
      },
      image: {
        kind: "emoji",
        ref: "🌸",
      },
    },
    {
      id: "cnt03_2",
      label: "hai bông hoa",
      glyph: "🌸🌸",
      value: 2,
      contrast_group: "quantity",
      ordering: 2,
      category: {
        type: "đồ vật nhỏ",
      },
      image: {
        kind: "emoji",
        ref: "🌸",
      },
    },
    {
      id: "cnt03_3",
      label: "ba bông hoa",
      glyph: "🌸🌸🌸",
      value: 3,
      contrast_group: "quantity",
      ordering: 3,
      category: {
        type: "đồ vật nhỏ",
      },
      image: {
        kind: "emoji",
        ref: "🌸",
      },
    },
    {
      id: "cnt03_4",
      label: "bốn bông hoa",
      glyph: "🌸🌸🌸🌸",
      value: 4,
      contrast_group: "quantity",
      ordering: 4,
      category: {
        type: "đồ vật nhỏ",
      },
      image: {
        kind: "emoji",
        ref: "🌸",
      },
    },
    {
      id: "cnt03_5",
      label: "năm bông hoa",
      glyph: "🌸🌸🌸🌸🌸",
      value: 5,
      contrast_group: "quantity",
      ordering: 5,
      category: {
        type: "đồ vật nhỏ",
      },
      image: {
        kind: "emoji",
        ref: "🌸",
      },
    },
  ],
  relations: [
    {
      type: "subset",
      source_id: "cnt03_1",
      target_id: "cnt03_5",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với đếm đủ từng vật",
      representation: "discrete-object",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và đếm đủ từng vật",
      representation: "discrete-object",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt đếm đủ từng vật với phương án nhiễu",
      representation: "ten-frame",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi đếm đủ từng vật",
      representation: "ten-frame",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục đếm đủ từng vật và tự làm một mình",
      representation: "ten-frame",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn {label} nhé!",
    narration_template: "Chúng mình cùng học cách đếm đủ từng vật nhé",
  },
  ordering: ["cnt03_1", "cnt03_2", "cnt03_3", "cnt03_4", "cnt03_5"],
};

export const C1_CNT_03_SEED: SkillSeed = {
  identity: C1_CNT_03_IDENTITY,
  dataset: C1_CNT_03_DATASET,
  levels: [
    {
      code: "GL-C1-POS-LOC-0018",
      template: "GT-022",
      band: "4-5",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-CNT-CONT-0106",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
      montessori_ref: "WB01-D3",
    },
    {
      code: "GL-C1-CNT-PAIR-0112",
      template: "GT-005",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
      montessori_ref: "WB05-D1",
    },
    {
      code: "GL-C1-CNT-CONT-0114",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
      montessori_ref: "WB05-D2",
    },
    {
      code: "GL-C1-CNT-TAP-0001",
      template: "GT-028",
      band: "4-5",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-CNT-TAP-0002",
      template: "GT-028",
      band: "4-5",
      difficulty: 1,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-CNT-TAP-0003",
      template: "GT-028",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-REM-SET-0006",
      template: "GT-029",
      band: "5-6",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-MATCH-0005",
      template: "GT-005",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
  ],
};
