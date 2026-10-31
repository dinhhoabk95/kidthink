import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_PAT_07_IDENTITY: SkillIdentity = {
  code: "C1.PAT.07",
  strand_code: "C1.PAT",
  competency_code: "C1",
  name: "Quy luật giảm dần",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["infer"],
  tier: "advanced",
  prerequisites: ["C1.PAT.06"],
  learning_objectives: [
    {
      code: "LO-C1.PAT.07-01",
      behaviour: "Nhận biết và thực hành Pattern giảm dần ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.PAT.07-02",
      behaviour: "Vận dụng Pattern giảm dần trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.PAT.07-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Pattern giảm dần",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_PAT_07_DATASET: SkillDataset = {
  skill_code: "C1.PAT.07",
  concept_label: "Quy luật giảm dần",
  surface: "game",
  items: [
    {
      id: "dec_6",
      label: "sáu quả dưa hấu",
      glyph: "6",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🍉",
      },
      contrast_group: "many_fruit",
      category: {
        type: "nhiều quả",
        count: "6",
      },
    },
    {
      id: "dec_5",
      label: "năm quả dứa vàng",
      glyph: "5",
      value: 5,
      image: {
        kind: "emoji",
        ref: "🍍",
      },
      contrast_group: "many_fruit",
      category: {
        type: "nhiều quả",
        count: "5",
      },
    },
    {
      id: "dec_4",
      label: "bốn quả táo đỏ",
      glyph: "4",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🍎",
      },
      contrast_group: "many_fruit",
      category: {
        type: "nhiều quả",
        count: "4",
      },
    },
    {
      id: "dec_3",
      label: "ba quả cam tươi",
      glyph: "3",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🍊",
      },
      contrast_group: "few_fruit",
      category: {
        type: "ít quả",
        count: "3",
      },
    },
    {
      id: "dec_2",
      label: "hai quả dâu tây",
      glyph: "2",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🍓",
      },
      contrast_group: "few_fruit",
      category: {
        type: "ít quả",
        count: "2",
      },
    },
    {
      id: "dec_1",
      label: "một quả anh đào",
      glyph: "1",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🍒",
      },
      contrast_group: "few_fruit",
      category: {
        type: "ít quả",
        count: "1",
      },
    },
  ],
  relations: [
    {
      type: "subset",
      source_id: "dec_6",
      target_id: "dec_5",
      metadata: {
        rule: "minus_one",
      },
    },
    {
      type: "subset",
      source_id: "dec_5",
      target_id: "dec_4",
      metadata: {
        rule: "minus_one",
      },
    },
    {
      type: "subset",
      source_id: "dec_4",
      target_id: "dec_3",
      metadata: {
        rule: "minus_one",
      },
    },
    {
      type: "subset",
      source_id: "dec_3",
      target_id: "dec_2",
      metadata: {
        rule: "minus_one",
      },
    },
    {
      type: "subset",
      source_id: "dec_2",
      target_id: "dec_1",
      metadata: {
        rule: "minus_one",
      },
    },
  ],
  axes: {
    count: {
      values: ["6", "5", "4", "3", "2", "1"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với quy luật giảm dần",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng quy luật giảm dần",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt quy luật giảm dần với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi quy luật giảm dần",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục quy luật giảm dần và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn đúng {label} nhé!",
    narration_template: "Chúng mình cùng tìm hiểu về Quy luật giảm dần nhé!",
  },
  ordering: ["dec_6", "dec_5", "dec_4", "dec_3", "dec_2", "dec_1"],
};

export const C1_PAT_07_SEED: SkillSeed = {
  identity: C1_PAT_07_IDENTITY,
  dataset: C1_PAT_07_DATASET,
  levels: [
    {
      code: "GL-C1-ALG-CMD-0006",
      template: "GT-035",
      band: "5-6",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-ALG-CMD-0007",
      template: "GT-035",
      band: "5-6",
      difficulty: 4,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C3-GAP-SLOT-0003",
      template: "GT-008",
      band: "3-4",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
  ],
};
