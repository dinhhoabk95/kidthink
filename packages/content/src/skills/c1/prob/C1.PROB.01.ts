import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_PROB_01_IDENTITY: SkillIdentity = {
  code: "C1.PROB.01",
  strand_code: "C1.PROB",
  competency_code: "C1",
  name: "Chọn cách giải",
  age_min: 5,
  age_max: 6,
  difficulty: 5,
  thinking_processes: ["plan", "solve"],
  tier: "advanced",
  prerequisites: ["C1.ADD.04", "C1.SUB.03"],
  learning_objectives: [
    {
      code: "LO-C1.PROB.01-01",
      behaviour: "Nhận biết và thực hành Chọn cách giải ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.PROB.01-02",
      behaviour: "Vận dụng Chọn cách giải trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.PROB.01-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Chọn cách giải",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_PROB_01_DATASET: SkillDataset = {
  skill_code: "C1.PROB.01",
  concept_label: "Chọn cách giải",
  surface: "game",
  items: [
    {
      id: "chick_1",
      label: "chú gà con vàng",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🐥",
      },
      contrast_group: "small_bird",
      category: {
        type: "gà nhỏ",
      },
    },
    {
      id: "chick_2",
      label: "chú gà mới nở",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🐣",
      },
      contrast_group: "small_bird",
      category: {
        type: "gà nhỏ",
      },
    },
    {
      id: "chick_3",
      label: "chú gà choai",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🐤",
      },
      contrast_group: "small_bird",
      category: {
        type: "gà nhỏ",
      },
    },
    {
      id: "chick_4",
      label: "cô gà mái mẹ",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🐔",
      },
      contrast_group: "large_bird",
      category: {
        type: "gà lớn",
      },
    },
    {
      id: "chick_5",
      label: "chú gà trống oai",
      value: 5,
      image: {
        kind: "emoji",
        ref: "🐓",
      },
      contrast_group: "large_bird",
      category: {
        type: "gà lớn",
      },
    },
    {
      id: "chick_6",
      label: "chú chim bồ câu",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🐦",
      },
      contrast_group: "large_bird",
      category: {
        type: "gà lớn",
      },
    },
    {
      id: "ws_crown_gold",
      label: "vương miện hoàng gia",
      value: 8,
      image: {
        kind: "emoji",
        ref: "👑",
      },
    },
    {
      id: "ws_shield_silver",
      label: "khiên hiệp sĩ bạc",
      value: 5,
      image: {
        kind: "emoji",
        ref: "🛡️",
      },
    },
    {
      id: "ws_gem_emerald_val3",
      label: "viên ngọc bích",
      value: 3,
      image: {
        kind: "emoji",
        ref: "💎",
      },
    },
    {
      id: "ws_gem_power_nine",
      label: "ngọc bích quyền năng",
      value: 9,
      image: {
        kind: "emoji",
        ref: "🟢",
      },
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "chick_1",
      target_id: "chick_2",
    },
    {
      type: "pair",
      source_id: "chick_3",
      target_id: "chick_4",
    },
    {
      type: "pair",
      source_id: "chick_5",
      target_id: "chick_6",
    },
    {
      type: "subset",
      source_id: "chick_1",
      target_id: "chick_6",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với chọn cách giải",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng chọn cách giải",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt chọn cách giải với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi chọn cách giải",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục chọn cách giải và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn đúng {label} nhé!",
    narration_template: "Chúng mình cùng tìm hiểu về Chọn cách giải nhé!",
  },
  ordering: [
    "chick_1",
    "chick_2",
    "chick_3",
    "chick_4",
    "chick_5",
    "chick_6",
    "ws_crown_gold",
    "ws_shield_silver",
    "ws_gem_emerald_val3",
    "ws_gem_power_nine",
  ],
};

export const C1_PROB_01_SEED: SkillSeed = {
  identity: C1_PROB_01_IDENTITY,
  dataset: C1_PROB_01_DATASET,
  levels: [
    {
      code: "GL-C1-PROB-SEP-0001",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-SEP-0002",
      template: "GT-007",
      band: "5-6",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-HIDE-0002",
      template: "GT-015",
      band: "5-6",
      difficulty: 5,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-SUBST-0207",
      template: "GT-010",
      band: "5-6",
      difficulty: 4,
      access_tier: "premium",
      theme: "job",
      rounds: 3,
      montessori_ref: "WB12-D3",
    },
    {
      code: "GL-C1-PROB-SUBST-0208",
      template: "GT-010",
      band: "5-6",
      difficulty: 5,
      access_tier: "premium",
      theme: "fairytale",
      rounds: 4,
      montessori_ref: "WB12-D3",
    },
  ],
};
