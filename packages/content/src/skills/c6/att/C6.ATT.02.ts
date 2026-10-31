import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C6_ATT_02_IDENTITY: SkillIdentity = {
  code: "C6.ATT.02",
  strand_code: "C6.ATT",
  competency_code: "C6",
  name: "Tìm mục tiêu giữa nhiều vật",
  age_min: 3,
  age_max: 3,
  difficulty: 2,
  thinking_processes: ["observe"],
  tier: "basic",
  prerequisites: ["C4.VIS.02"],
  learning_objectives: [
    {
      code: "LO-C6.ATT.02-01",
      behaviour:
        "Nhận biết và thực hành Tìm mục tiêu giữa nhiều vật ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C6.ATT.02-02",
      behaviour:
        "Vận dụng Tìm mục tiêu giữa nhiều vật trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C6.ATT.02-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Tìm mục tiêu giữa nhiều vật",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C6_ATT_02_DATASET: SkillDataset = {
  skill_code: "C6.ATT.02",
  concept_label: "Tìm mục tiêu giữa nhiều vật",
  surface: "game",
  items: [
    {
      id: "fish",
      label: "chú cá nhỏ",
      value: 1,
      ordering: 1,
      image: {
        kind: "emoji",
        ref: "🐟",
      },
      category: {
        type: "sinh vật biển",
      },
      contrast_group: "sea_animals",
    },
    {
      id: "tropical_fish",
      label: "cá nhiệt đới",
      value: 2,
      ordering: 2,
      image: {
        kind: "emoji",
        ref: "🐠",
      },
      category: {
        type: "sinh vật biển",
      },
      contrast_group: "sea_animals",
    },
    {
      id: "octopus",
      label: "chú bạch tuộc",
      value: 3,
      ordering: 3,
      image: {
        kind: "emoji",
        ref: "🐙",
      },
      category: {
        type: "sinh vật biển",
      },
      contrast_group: "sea_animals",
    },
    {
      id: "squid",
      label: "chú mực ống",
      value: 4,
      ordering: 4,
      image: {
        kind: "emoji",
        ref: "🦑",
      },
      category: {
        type: "sinh vật biển",
      },
      contrast_group: "sea_animals",
    },
    {
      id: "rose",
      label: "bông hoa hồng",
      value: 5,
      ordering: 5,
      image: {
        kind: "emoji",
        ref: "🌹",
      },
      category: {
        type: "hoa lá",
      },
      contrast_group: "plants",
    },
    {
      id: "tulip",
      label: "hoa tu-líp",
      value: 6,
      ordering: 6,
      image: {
        kind: "emoji",
        ref: "🌷",
      },
      category: {
        type: "hoa lá",
      },
      contrast_group: "plants",
    },
    {
      id: "clover",
      label: "cỏ bốn lá",
      value: 7,
      ordering: 7,
      image: {
        kind: "emoji",
        ref: "🍀",
      },
      category: {
        type: "hoa lá",
      },
      contrast_group: "plants",
    },
    {
      id: "herb",
      label: "nhánh lá xanh",
      value: 8,
      ordering: 8,
      image: {
        kind: "emoji",
        ref: "🌿",
      },
      category: {
        type: "hoa lá",
      },
      contrast_group: "plants",
    },
  ],
  axes: {
    type: ["sinh vật biển", "hoa lá"],
  },
  relations: [
    {
      type: "pair",
      source_id: "fish",
      target_id: "tropical_fish",
      metadata: { reason: "confusable" },
    },
    {
      type: "pair",
      source_id: "octopus",
      target_id: "squid",
      metadata: { reason: "confusable" },
    },
    {
      type: "pair",
      source_id: "rose",
      target_id: "tulip",
      metadata: { reason: "confusable" },
    },
    {
      type: "pair",
      source_id: "clover",
      target_id: "herb",
      metadata: { reason: "confusable" },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Tìm mục tiêu giữa nhiều vật",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Tìm mục tiêu giữa nhiều vật",
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
    narration_template: "Chúng mình cùng quan sát và tìm đúng đồ vật nhé",
  },
  ordering: [
    "fish",
    "tropical_fish",
    "octopus",
    "squid",
    "rose",
    "tulip",
    "clover",
    "herb",
  ],
};

export const C6_ATT_02_SEED: SkillSeed = {
  identity: C6_ATT_02_IDENTITY,
  dataset: C6_ATT_02_DATASET,
  levels: [
    {
      template: "GT-000",
      band: "3-4",
      difficulty: 1,
      theme: "school",
    },
    {
      code: "GL-C6-ATT-TAP-0003",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C6-ATT-TAP-0004",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C6-ATT-TCMP-0003",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
  ],
};
