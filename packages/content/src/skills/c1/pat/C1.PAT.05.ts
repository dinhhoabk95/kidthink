import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_PAT_05_IDENTITY: SkillIdentity = {
  code: "C1.PAT.05",
  strand_code: "C1.PAT",
  competency_code: "C1",
  name: "Quy luật AABB",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["observe", "predict"],
  tier: "core",
  prerequisites: ["C1.PAT.02", "C1.PAT.03"],
  learning_objectives: [
    {
      code: "LO-C1.PAT.05-01",
      behaviour: "Nhận biết và thực hành Quy luật AABB ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.PAT.05-02",
      behaviour: "Vận dụng Quy luật AABB trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.PAT.05-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Quy luật AABB",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_PAT_05_DATASET: SkillDataset = {
  skill_code: "C1.PAT.05",
  concept_label: "Quy luật AABB",
  surface: "game",
  items: [
    {
      id: "pat_a1",
      label: "ô tô đỏ",
      glyph: "A1",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🚗",
      },
      contrast_group: "small_car",
      category: {
        type: "xe nhỏ",
        cycle: "A",
      },
    },
    {
      id: "pat_a2",
      label: "xe taxi vàng",
      glyph: "A2",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🚕",
      },
      contrast_group: "small_car",
      category: {
        type: "xe nhỏ",
        cycle: "A",
      },
    },
    {
      id: "pat_b1",
      label: "xe buýt lớn",
      glyph: "B1",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🚌",
      },
      contrast_group: "large_car",
      category: {
        type: "xe lớn",
        cycle: "B",
      },
    },
    {
      id: "pat_b2",
      label: "xe tải hàng",
      glyph: "B2",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🚚",
      },
      contrast_group: "large_car",
      category: {
        type: "xe lớn",
        cycle: "B",
      },
    },
    {
      id: "pat_a3",
      label: "xe cảnh sát",
      glyph: "A3",
      value: 5,
      image: {
        kind: "emoji",
        ref: "🚓",
      },
      contrast_group: "small_car",
      category: {
        type: "xe nhỏ",
        cycle: "A",
      },
    },
    {
      id: "pat_b3",
      label: "xe cứu hoả",
      glyph: "B3",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🚒",
      },
      contrast_group: "large_car",
      category: {
        type: "xe lớn",
        cycle: "B",
      },
    },
  ],
  relations: [
    {
      type: "sequence",
      source_id: "pat_a1",
      target_id: "pat_a2",
      metadata: {
        rule: "AABB",
        period: 4,
      },
    },
    {
      type: "sequence",
      source_id: "pat_a2",
      target_id: "pat_b1",
      metadata: {
        rule: "AABB",
        period: 4,
      },
    },
    {
      type: "sequence",
      source_id: "pat_b1",
      target_id: "pat_b2",
      metadata: {
        rule: "AABB",
        period: 4,
      },
    },
    {
      type: "sequence",
      source_id: "pat_b2",
      target_id: "pat_a3",
      metadata: {
        rule: "AABB",
        period: 4,
      },
    },
    {
      type: "sequence",
      source_id: "pat_a3",
      target_id: "pat_b3",
      metadata: {
        rule: "AABB",
        period: 4,
      },
    },
  ],
  axes: {
    cycle: {
      values: ["A", "B"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với quy luật AABB",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng quy luật AABB",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt quy luật AABB với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi quy luật AABB",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục quy luật AABB và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn đúng {label} nhé!",
    narration_template: "Chúng mình cùng tìm hiểu về Quy luật AABB nhé!",
  },
  ordering: ["pat_a1", "pat_a2", "pat_b1", "pat_b2", "pat_a3", "pat_b3"],
};

export const C1_PAT_05_SEED: SkillSeed = {
  identity: C1_PAT_05_IDENTITY,
  dataset: C1_PAT_05_DATASET,
  levels: [
    {
      code: "GL-C1-PAT-WEAVE-0001",
      template: "GT-033",
      band: "5-6",
      difficulty: 1,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-WEAVE-0002",
      template: "GT-033",
      band: "5-6",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-WEAVE-0003",
      template: "GT-033",
      band: "5-6",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-ALG-CMD-0001",
      template: "GT-035",
      band: "5-6",
      difficulty: 1,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C1-ALG-CMD-0002",
      template: "GT-035",
      band: "5-6",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-ALG-CMD-0003",
      template: "GT-035",
      band: "5-6",
      difficulty: 2,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-FCR-0001",
      template: "GT-036",
      band: "5-6",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-FCR-0002",
      template: "GT-036",
      band: "5-6",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-FCR-0003",
      template: "GT-036",
      band: "5-6",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
  ],
};
