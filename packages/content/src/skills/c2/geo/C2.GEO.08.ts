import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_GEO_08_IDENTITY: SkillIdentity = {
  code: "C2.GEO.08",
  strand_code: "C2.GEO",
  competency_code: "C2",
  name: "Đếm cạnh của hình",
  age_min: 5,
  age_max: 6,
  difficulty: 4,
  thinking_processes: ["count", "infer"],
  tier: "advanced",
  prerequisites: ["C2.GEO.07", "C1.CNT.01"],
  learning_objectives: [
    {
      code: "LO-C2.GEO.08-01",
      behaviour: "Nhận biết và thực hành Đa giác — đếm cạnh ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.GEO.08-02",
      behaviour: "Vận dụng Đa giác — đếm cạnh trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.GEO.08-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Đa giác — đếm cạnh",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_GEO_08_DATASET: SkillDataset = {
  skill_code: "C2.GEO.08",
  concept_label: "Đếm cạnh của hình",
  surface: "game",
  items: [
    {
      id: "triangle_3",
      label: "tam giác ba cạnh",
      image: {
        kind: "emoji",
        ref: "🔺",
      },
      category: {
        type: "hình ít cạnh",
      },
      contrast_group: "few_edges",
      value: 1,
      ordering: 1,
    },
    {
      id: "ruler_3",
      label: "thước ê-ke ba cạnh",
      image: {
        kind: "emoji",
        ref: "📐",
      },
      category: {
        type: "hình ít cạnh",
      },
      contrast_group: "few_edges",
      value: 2,
      ordering: 2,
    },
    {
      id: "square_4",
      label: "hình vuông bốn cạnh",
      image: {
        kind: "emoji",
        ref: "🟦",
      },
      category: {
        type: "hình ít cạnh",
      },
      contrast_group: "few_edges",
      value: 3,
      ordering: 3,
    },
    {
      id: "diamond_4",
      label: "hình thoi bốn cạnh",
      image: {
        kind: "emoji",
        ref: "🔶",
      },
      category: {
        type: "hình ít cạnh",
      },
      contrast_group: "few_edges",
      value: 4,
      ordering: 4,
    },
    {
      id: "house_5",
      label: "mái nhà năm cạnh",
      image: {
        kind: "emoji",
        ref: "🏠",
      },
      category: {
        type: "hình nhiều cạnh",
      },
      contrast_group: "many_edges",
      value: 5,
      ordering: 5,
    },
    {
      id: "star_5",
      label: "ngôi sao năm cánh",
      image: {
        kind: "emoji",
        ref: "⭐",
      },
      category: {
        type: "hình nhiều cạnh",
      },
      contrast_group: "many_edges",
      value: 6,
      ordering: 6,
    },
    {
      id: "honey_6",
      label: "tổ ong sáu cạnh",
      image: {
        kind: "emoji",
        ref: "🐝",
      },
      category: {
        type: "hình nhiều cạnh",
      },
      contrast_group: "many_edges",
      value: 7,
      ordering: 7,
    },
    {
      id: "stop_8",
      label: "biển báo tám cạnh",
      image: {
        kind: "emoji",
        ref: "🛑",
      },
      category: {
        type: "hình nhiều cạnh",
      },
      contrast_group: "many_edges",
      value: 8,
      ordering: 8,
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "triangle_3",
      target_id: "house_5",
    },
    {
      type: "pair",
      source_id: "ruler_3",
      target_id: "star_5",
    },
    {
      type: "pair",
      source_id: "square_4",
      target_id: "honey_6",
    },
    {
      type: "pair",
      source_id: "diamond_4",
      target_id: "stop_8",
    },
    {
      type: "contrast",
      source_id: "triangle_3",
      target_id: "house_5",
    },
  ],
  axes: {
    category: {
      values: ["hình ít cạnh", "hình nhiều cạnh"],
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
      description: "Làm quen cơ bản với Đếm cạnh của hình",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Đếm cạnh của hình",
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
    narration_template: "Chúng mình cùng đếm cạnh của hình thật vui nhé",
  },
  ordering: [
    "triangle_3",
    "ruler_3",
    "square_4",
    "diamond_4",
    "house_5",
    "star_5",
    "honey_6",
    "stop_8",
  ],
};

export const C2_GEO_08_SEED: SkillSeed = {
  identity: C2_GEO_08_IDENTITY,
  dataset: C2_GEO_08_DATASET,
  levels: [
    {
      code: "GL-C2-GEO-TAP-0014",
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C2-GEO-TCNT-0009",
      template: "GT-002",
      band: "5-6",
      difficulty: 3,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C2-GEO-SWT-0001",
      template: "GT-027",
      band: "5-6",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
  ],
};
