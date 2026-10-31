import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_GEO_06_IDENTITY: SkillIdentity = {
  code: "C2.GEO.06",
  strand_code: "C2.GEO",
  competency_code: "C2",
  name: "Hình ngũ giác",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["observe", "count"],
  tier: "core",
  prerequisites: ["C2.GEO.03"],
  learning_objectives: [
    {
      code: "LO-C2.GEO.06-01",
      behaviour: "Nhận biết và thực hành Hình ngũ giác ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.GEO.06-02",
      behaviour: "Vận dụng Hình ngũ giác trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.GEO.06-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Hình ngũ giác",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_GEO_06_DATASET: SkillDataset = {
  skill_code: "C2.GEO.06",
  concept_label: "Hình ngũ giác",
  surface: "game",
  items: [
    {
      id: "house_pent",
      label: "ngôi nhà năm cạnh",
      image: {
        kind: "emoji",
        ref: "🏠",
      },
      category: {
        type: "hình năm cạnh",
      },
      contrast_group: "five_sided",
      value: 1,
      ordering: 1,
    },
    {
      id: "star_pent",
      label: "ngôi sao năm cánh",
      image: {
        kind: "emoji",
        ref: "⭐",
      },
      category: {
        type: "hình năm cạnh",
      },
      contrast_group: "five_sided",
      value: 2,
      ordering: 2,
    },
    {
      id: "glow_pent",
      label: "sao sáng năm đỉnh",
      image: {
        kind: "emoji",
        ref: "🌟",
      },
      category: {
        type: "hình năm cạnh",
      },
      contrast_group: "five_sided",
      value: 3,
      ordering: 3,
    },
    {
      id: "flower_pent",
      label: "hoa đào năm cánh",
      image: {
        kind: "emoji",
        ref: "🌸",
      },
      category: {
        type: "hình năm cạnh",
      },
      contrast_group: "five_sided",
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
      id: "square_blue",
      label: "hình vuông xanh",
      image: {
        kind: "emoji",
        ref: "🟦",
      },
      category: {
        type: "hình khác",
      },
      contrast_group: "other_shape",
      value: 6,
      ordering: 6,
    },
    {
      id: "triangle_red",
      label: "hình tam giác đỏ",
      image: {
        kind: "emoji",
        ref: "🔺",
      },
      category: {
        type: "hình khác",
      },
      contrast_group: "other_shape",
      value: 7,
      ordering: 7,
    },
    {
      id: "diamond_orange",
      label: "hình thoi bốn cạnh",
      image: {
        kind: "emoji",
        ref: "🔶",
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
      source_id: "house_pent",
      target_id: "circle_red",
    },
    {
      type: "pair",
      source_id: "star_pent",
      target_id: "square_blue",
    },
    {
      type: "pair",
      source_id: "glow_pent",
      target_id: "triangle_red",
    },
    {
      type: "pair",
      source_id: "flower_pent",
      target_id: "diamond_orange",
    },
    {
      type: "contrast",
      source_id: "house_pent",
      target_id: "circle_red",
    },
  ],
  axes: {
    category: {
      values: ["hình năm cạnh", "hình khác"],
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
      description: "Làm quen cơ bản với Hình ngũ giác",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Hình ngũ giác",
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
    narration_template: "Chúng mình cùng tìm hiểu về Hình ngũ giác nhé",
  },
  ordering: [
    "house_pent",
    "star_pent",
    "glow_pent",
    "flower_pent",
    "circle_red",
    "square_blue",
    "triangle_red",
    "diamond_orange",
  ],
};

export const C2_GEO_06_SEED: SkillSeed = {
  identity: C2_GEO_06_IDENTITY,
  dataset: C2_GEO_06_DATASET,
  levels: [
    {
      code: "GL-C2-HOL-SLOT-0005",
      template: "GT-008",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C2-HOL-SLOT-0006",
      template: "GT-008",
      band: "4-5",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
    },
    {
      template: "GT-030",
      band: "5-6",
      difficulty: 2,
      theme: "school",
    },
  ],
};
