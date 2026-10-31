import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_GEO_07_IDENTITY: SkillIdentity = {
  code: "C2.GEO.07",
  strand_code: "C2.GEO",
  competency_code: "C2",
  name: "Hình lục giác",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["observe", "count"],
  tier: "core",
  prerequisites: ["C2.GEO.06"],
  learning_objectives: [
    {
      code: "LO-C2.GEO.07-01",
      behaviour: "Nhận biết và thực hành Hình lục giác ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.GEO.07-02",
      behaviour: "Vận dụng Hình lục giác trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.GEO.07-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Hình lục giác",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_GEO_07_DATASET: SkillDataset = {
  skill_code: "C2.GEO.07",
  concept_label: "Hình lục giác",
  surface: "game",
  items: [
    {
      id: "honey_hex",
      label: "tổ ong sáu cạnh",
      image: {
        kind: "emoji",
        ref: "🐝",
      },
      category: {
        type: "hình sáu cạnh",
      },
      contrast_group: "six_sided",
      value: 1,
      ordering: 1,
    },
    {
      id: "snow_hex",
      label: "bông tuyết sáu cánh",
      image: {
        kind: "emoji",
        ref: "❄️",
      },
      category: {
        type: "hình sáu cạnh",
      },
      contrast_group: "six_sided",
      value: 2,
      ordering: 2,
    },
    {
      id: "turtle_hex",
      label: "mai rùa sáu cạnh",
      image: {
        kind: "emoji",
        ref: "🐢",
      },
      category: {
        type: "hình sáu cạnh",
      },
      contrast_group: "six_sided",
      value: 3,
      ordering: 3,
    },
    {
      id: "nut_hex",
      label: "đai ốc sáu cạnh",
      image: {
        kind: "emoji",
        ref: "🔩",
      },
      category: {
        type: "hình sáu cạnh",
      },
      contrast_group: "six_sided",
      value: 4,
      ordering: 4,
    },
    {
      id: "circle_red",
      label: "hình tròn đỏ",
      image: {
        kind: "emoji",
        ref: "🔴",
      },
      category: {
        type: "hình khác",
      },
      contrast_group: "other_shape",
      value: 5,
      ordering: 5,
    },
    {
      id: "triangle_red",
      label: "tam giác ba cạnh",
      image: {
        kind: "emoji",
        ref: "🔺",
      },
      category: {
        type: "hình khác",
      },
      contrast_group: "other_shape",
      value: 6,
      ordering: 6,
    },
    {
      id: "square_blue",
      label: "hình vuông bốn cạnh",
      image: {
        kind: "emoji",
        ref: "🟦",
      },
      category: {
        type: "hình khác",
      },
      contrast_group: "other_shape",
      value: 7,
      ordering: 7,
    },
    {
      id: "star_yellow",
      label: "ngôi sao năm cánh",
      image: {
        kind: "emoji",
        ref: "⭐",
      },
      category: {
        type: "hình khác",
      },
      contrast_group: "other_shape",
      value: 8,
      ordering: 8,
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "honey_hex",
      target_id: "circle_red",
    },
    {
      type: "pair",
      source_id: "snow_hex",
      target_id: "triangle_red",
    },
    {
      type: "pair",
      source_id: "turtle_hex",
      target_id: "square_blue",
    },
    {
      type: "pair",
      source_id: "nut_hex",
      target_id: "star_yellow",
    },
    {
      type: "contrast",
      source_id: "honey_hex",
      target_id: "circle_red",
    },
  ],
  axes: {
    category: {
      values: ["hình sáu cạnh", "hình khác"],
    },
    order: {
      values: ["1", "2", "3", "4", "5", "6", "7", "8"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Hình lục giác",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Hình lục giác",
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
    narration_template: "Chúng mình cùng tìm hiểu về Hình lục giác nhé",
  },
  ordering: [
    "honey_hex",
    "snow_hex",
    "turtle_hex",
    "nut_hex",
    "circle_red",
    "triangle_red",
    "square_blue",
    "star_yellow",
  ],
};

export const C2_GEO_07_SEED: SkillSeed = {
  identity: C2_GEO_07_IDENTITY,
  dataset: C2_GEO_07_DATASET,
  levels: [
    {
      code: "GL-C2-GEO-TAP-0011",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C2-GEO-TAP-0012",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C2-GEO-HUNT-0009",
      template: "GT-037",
      band: "5-6",
      difficulty: 3,
      theme: "space",
      rounds: 3,
    },
  ],
};
