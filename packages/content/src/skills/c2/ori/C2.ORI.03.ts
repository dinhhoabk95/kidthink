import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_ORI_03_IDENTITY: SkillIdentity = {
  code: "C2.ORI.03",
  strand_code: "C2.ORI",
  competency_code: "C2",
  name: "Trên",
  age_min: 3,
  age_max: 3,
  difficulty: 1,
  thinking_processes: ["observe"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C2.ORI.03-01",
      behaviour: "Nhận biết và thực hành Trên ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.ORI.03-02",
      behaviour: "Vận dụng Trên trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.ORI.03-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Trên",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_ORI_03_DATASET: SkillDataset = {
  skill_code: "C2.ORI.03",
  concept_label: "Trên",
  surface: "game",
  items: [
    {
      id: "sun_above",
      label: "mặt trời ở trên",
      value: 1,
      image: {
        kind: "emoji",
        ref: "☀️",
      },
      category: {
        type: "ở phía trên",
      },
      contrast_group: "above",
    },
    {
      id: "cloud_above",
      label: "đám mây ở trên",
      value: 2,
      image: {
        kind: "emoji",
        ref: "☁️",
      },
      category: {
        type: "ở phía trên",
      },
      contrast_group: "above",
    },
    {
      id: "star_above",
      label: "ngôi sao ở trên",
      value: 3,
      image: {
        kind: "emoji",
        ref: "⭐",
      },
      category: {
        type: "ở phía trên",
      },
      contrast_group: "above",
    },
    {
      id: "plane_above",
      label: "máy bay ở trên",
      value: 4,
      image: {
        kind: "emoji",
        ref: "✈️",
      },
      category: {
        type: "ở phía trên",
      },
      contrast_group: "above",
    },
    {
      id: "fish_below",
      label: "con cá ở dưới",
      value: 5,
      image: {
        kind: "emoji",
        ref: "🐟",
      },
      category: {
        type: "ở phía dưới",
      },
      contrast_group: "below",
    },
    {
      id: "sprout_below",
      label: "mầm cây ở dưới",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🌱",
      },
      category: {
        type: "ở phía dưới",
      },
      contrast_group: "below",
    },
    {
      id: "turtle_below",
      label: "chú rùa ở dưới",
      value: 7,
      image: {
        kind: "emoji",
        ref: "🐢",
      },
      category: {
        type: "ở phía dưới",
      },
      contrast_group: "below",
    },
    {
      id: "crab_below",
      label: "con cua ở dưới",
      value: 8,
      image: {
        kind: "emoji",
        ref: "🦀",
      },
      category: {
        type: "ở phía dưới",
      },
      contrast_group: "below",
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "sun_above",
      target_id: "fish_below",
      metadata: {
        dimension: "position",
      },
    },
    {
      type: "contrast",
      source_id: "cloud_above",
      target_id: "turtle_below",
      metadata: {
        dimension: "position",
      },
    },
    {
      type: "pair",
      source_id: "sun_above",
      target_id: "cloud_above",
      metadata: {
        relation: "cùng phía trên",
      },
    },
    {
      type: "pair",
      source_id: "fish_below",
      target_id: "turtle_below",
      metadata: {
        relation: "cùng phía dưới",
      },
    },
  ],
  axes: {
    position: {
      values: ["ở phía trên", "ở phía dưới"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Trên",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Trên",
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
    narration_template: "Chúng mình cùng tìm hiểu về Trên nhé",
  },
  ordering: [
    "sun_above",
    "cloud_above",
    "star_above",
    "plane_above",
    "fish_below",
    "sprout_below",
    "turtle_below",
    "crab_below",
  ],
};

export const C2_ORI_03_SEED: SkillSeed = {
  identity: C2_ORI_03_IDENTITY,
  dataset: C2_ORI_03_DATASET,
  levels: [
    {
      template: "GT-000",
      band: "3-4",
      difficulty: 1,
      theme: "school",
    },
    {
      code: "GL-C2-ORI-POS-0001",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C2-ORI-TAP-0005",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C2-ORI-TCMP-0005",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C2-ORI-PATT-0005",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C2-ORI-SLOT-0005",
      template: "GT-008",
      band: "3-4",
      difficulty: 1,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C2-ORI-MEMO-0005",
      template: "GT-012",
      band: "3-4",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
  ],
};
