import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C6_PER_04_IDENTITY: SkillIdentity = {
  code: "C6.PER.04",
  strand_code: "C6.PER",
  competency_code: "C6",
  name: "Chọn việc khó hơn",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["plan", "compare"],
  tier: "advanced",
  prerequisites: ["C6.PER.02"],
  learning_objectives: [
    {
      code: "LO-C6.PER.04-01",
      behaviour: "Nhận biết và thực hành Chọn việc khó hơn ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C6.PER.04-02",
      behaviour: "Vận dụng Chọn việc khó hơn trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C6.PER.04-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Chọn việc khó hơn",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C6_PER_04_DATASET: SkillDataset = {
  skill_code: "C6.PER.04",
  concept_label: "Chọn việc khó hơn",
  surface: "game",
  items: [
    {
      id: "fox",
      label: "con cáo",
      image: {
        kind: "emoji",
        ref: "🦊",
      },
      category: {
        type: "thú rừng",
        color: "red",
        shape: "triangle",
      },
      value: 1,
      ordering: 1,
      contrast_group: "wild_animals",
    },
    {
      id: "bear",
      label: "con gấu",
      image: {
        kind: "emoji",
        ref: "🐻",
      },
      category: {
        type: "thú rừng",
        color: "yellow",
        shape: "circle",
      },
      value: 2,
      ordering: 2,
      contrast_group: "wild_animals",
    },
    {
      id: "tiger",
      label: "con hổ",
      image: {
        kind: "emoji",
        ref: "🐯",
      },
      category: {
        type: "thú rừng",
        color: "yellow",
        shape: "triangle",
      },
      value: 3,
      ordering: 3,
      contrast_group: "wild_animals",
    },
    {
      id: "lion",
      label: "sư tử",
      image: {
        kind: "emoji",
        ref: "🦁",
      },
      category: {
        type: "thú rừng",
        color: "yellow",
        shape: "circle",
      },
      value: 4,
      ordering: 4,
      contrast_group: "wild_animals",
    },
    {
      id: "jellyfish",
      label: "con sứa",
      image: {
        kind: "emoji",
        ref: "🪼",
      },
      category: {
        type: "sinh vật biển",
        color: "blue",
        shape: "circle",
      },
      value: 5,
      ordering: 5,
      contrast_group: "ocean_animals",
    },
    {
      id: "fish",
      label: "con cá",
      image: {
        kind: "emoji",
        ref: "🐟",
      },
      category: {
        type: "sinh vật biển",
        color: "blue",
        shape: "triangle",
      },
      value: 6,
      ordering: 6,
      contrast_group: "ocean_animals",
    },
    {
      id: "octopus",
      label: "bạch tuộc",
      image: {
        kind: "emoji",
        ref: "🐙",
      },
      category: {
        type: "sinh vật biển",
        color: "red",
        shape: "circle",
      },
      value: 7,
      ordering: 7,
      contrast_group: "ocean_animals",
    },
    {
      id: "whale",
      label: "cá voi",
      image: {
        kind: "emoji",
        ref: "🐳",
      },
      category: {
        type: "sinh vật biển",
        color: "blue",
        shape: "circle",
      },
      value: 8,
      ordering: 8,
      contrast_group: "ocean_animals",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Chọn việc khó hơn",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Chọn việc khó hơn",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi và số lượng",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục và độc lập thực hiện",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn đúng {label} nhé!",
    narration_template: "Chúng mình cùng thử sức với việc khó hơn nhé",
  },
  axes: {
    difficulty_tier: {
      values: ["dễ", "vừa", "khó", "thử thách"],
      ordered: true,
    },
    type: ["thú rừng", "sinh vật biển"],
  },
  relations: [
    {
      source_id: "fox",
      target_id: "jellyfish",
      type: "contrast",
    },
    {
      source_id: "bear",
      target_id: "fish",
      type: "contrast",
    },
    {
      source_id: "tiger",
      target_id: "octopus",
      type: "contrast",
    },
    {
      source_id: "lion",
      target_id: "whale",
      type: "contrast",
    },
  ],
  ordering: [
    "fox",
    "bear",
    "tiger",
    "lion",
    "jellyfish",
    "fish",
    "octopus",
    "whale",
  ],
};

export const C6_PER_04_SEED: SkillSeed = {
  identity: C6_PER_04_IDENTITY,
  dataset: C6_PER_04_DATASET,
  levels: [
    {
      code: "GL-C6-PER-TAP-0001",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C6-PER-TAP-0002",
      template: "GT-001",
      band: "4-5",
      difficulty: 4,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C6-PER-TCNT-0001",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
  ],
};
