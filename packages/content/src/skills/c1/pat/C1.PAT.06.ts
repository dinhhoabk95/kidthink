import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_PAT_06_IDENTITY: SkillIdentity = {
  code: "C1.PAT.06",
  strand_code: "C1.PAT",
  competency_code: "C1",
  name: "Quy luật tăng dần",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["infer"],
  tier: "advanced",
  prerequisites: ["C1.PAT.01", "C1.CNT.01"],
  learning_objectives: [
    {
      code: "LO-C1.PAT.06-01",
      behaviour: "Nhận biết và thực hành Pattern tăng dần ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.PAT.06-02",
      behaviour: "Vận dụng Pattern tăng dần trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.PAT.06-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Pattern tăng dần",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_PAT_06_DATASET: SkillDataset = {
  skill_code: "C1.PAT.06",
  concept_label: "Quy luật tăng dần",
  surface: "game",
  items: [
    {
      id: "inc_1",
      label: "mầm cây non",
      glyph: "1",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🌱",
      },
      contrast_group: "small_sprout",
      category: {
        type: "bậc nhỏ",
        count: "1",
      },
    },
    {
      id: "inc_2",
      label: "nhánh lá xanh",
      glyph: "2",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🌿",
      },
      contrast_group: "small_sprout",
      category: {
        type: "bậc nhỏ",
        count: "2",
      },
    },
    {
      id: "inc_3",
      label: "cỏ ba lá",
      glyph: "3",
      value: 3,
      image: {
        kind: "emoji",
        ref: "☘️",
      },
      contrast_group: "small_sprout",
      category: {
        type: "bậc nhỏ",
        count: "3",
      },
    },
    {
      id: "inc_4",
      label: "bông hoa tulip",
      glyph: "4",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🌷",
      },
      contrast_group: "large_sprout",
      category: {
        type: "bậc lớn",
        count: "4",
      },
    },
    {
      id: "inc_5",
      label: "hoa hướng dương",
      glyph: "5",
      value: 5,
      image: {
        kind: "emoji",
        ref: "🌻",
      },
      contrast_group: "large_sprout",
      category: {
        type: "bậc lớn",
        count: "5",
      },
    },
    {
      id: "inc_6",
      label: "cây cổ thụ",
      glyph: "6",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🌳",
      },
      contrast_group: "large_sprout",
      category: {
        type: "bậc lớn",
        count: "6",
      },
    },
  ],
  relations: [
    {
      type: "subset",
      source_id: "inc_1",
      target_id: "inc_2",
      metadata: {
        rule: "plus_one",
      },
    },
    {
      type: "subset",
      source_id: "inc_2",
      target_id: "inc_3",
      metadata: {
        rule: "plus_one",
      },
    },
    {
      type: "subset",
      source_id: "inc_3",
      target_id: "inc_4",
      metadata: {
        rule: "plus_one",
      },
    },
    {
      type: "subset",
      source_id: "inc_4",
      target_id: "inc_5",
      metadata: {
        rule: "plus_one",
      },
    },
    {
      type: "subset",
      source_id: "inc_5",
      target_id: "inc_6",
      metadata: {
        rule: "plus_one",
      },
    },
  ],
  axes: {
    count: {
      values: ["1", "2", "3", "4", "5", "6"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với quy luật tăng dần",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng quy luật tăng dần",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt quy luật tăng dần với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi quy luật tăng dần",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục quy luật tăng dần và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn đúng {label} nhé!",
    narration_template: "Chúng mình cùng tìm hiểu về Quy luật tăng dần nhé!",
  },
  ordering: ["inc_1", "inc_2", "inc_3", "inc_4", "inc_5", "inc_6"],
};

export const C1_PAT_06_SEED: SkillSeed = {
  identity: C1_PAT_06_IDENTITY,
  dataset: C1_PAT_06_DATASET,
  levels: [
    {
      code: "GL-C1-PAT-WEAVE-0006",
      template: "GT-033",
      band: "5-6",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-WEAVE-0007",
      template: "GT-033",
      band: "5-6",
      difficulty: 4,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C3-GAP-SLOT-0001",
      template: "GT-008",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C3-GAP-SLOT-0002",
      template: "GT-008",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
  ],
};
