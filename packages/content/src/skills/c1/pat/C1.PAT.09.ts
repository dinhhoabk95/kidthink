import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_PAT_09_IDENTITY: SkillIdentity = {
  code: "C1.PAT.09",
  strand_code: "C1.PAT",
  competency_code: "C1",
  name: "Quy luật hình dạng",
  age_min: 3,
  age_max: 3,
  difficulty: 2,
  thinking_processes: ["observe", "predict"],
  tier: "basic",
  prerequisites: ["C1.PAT.01"],
  learning_objectives: [
    {
      code: "LO-C1.PAT.09-01",
      behaviour: "Nhận biết và thực hành Pattern hình ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.PAT.09-02",
      behaviour: "Vận dụng Pattern hình trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.PAT.09-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Pattern hình",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_PAT_09_DATASET: SkillDataset = {
  skill_code: "C1.PAT.09",
  concept_label: "Quy luật hình dạng",
  surface: "game",
  items: [
    {
      id: "pat_circle",
      label: "hình tròn trắng",
      glyph: "A1",
      value: 1,
      image: {
        kind: "emoji",
        ref: "⚪",
      },
      contrast_group: "curved",
      category: {
        type: "hình nét cong",
        shape: "circle",
      },
    },
    {
      id: "pat_square",
      label: "hình vuông trắng",
      glyph: "B1",
      value: 2,
      image: {
        kind: "emoji",
        ref: "⬜",
      },
      contrast_group: "straight",
      category: {
        type: "hình nét thẳng",
        shape: "square",
      },
    },
    {
      id: "pat_triangle",
      label: "hình tam giác đỏ",
      glyph: "C1",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🔺",
      },
      contrast_group: "straight",
      category: {
        type: "hình nét thẳng",
        shape: "triangle",
      },
    },
    {
      id: "pat_circle_2",
      label: "hình tròn xanh",
      glyph: "A2",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🔵",
      },
      contrast_group: "curved",
      category: {
        type: "hình nét cong",
        shape: "circle",
      },
    },
    {
      id: "pat_square_2",
      label: "hình vuông xanh",
      glyph: "B2",
      value: 5,
      image: {
        kind: "emoji",
        ref: "🟦",
      },
      contrast_group: "straight",
      category: {
        type: "hình nét thẳng",
        shape: "square",
      },
    },
    {
      id: "pat_triangle_2",
      label: "hình thoi cam",
      glyph: "C2",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🔶",
      },
      contrast_group: "straight",
      category: {
        type: "hình nét thẳng",
        shape: "diamond",
      },
    },
  ],
  relations: [
    {
      type: "sequence",
      source_id: "pat_circle",
      target_id: "pat_square",
    },
    {
      type: "sequence",
      source_id: "pat_square",
      target_id: "pat_triangle",
    },
    {
      type: "sequence",
      source_id: "pat_triangle",
      target_id: "pat_circle_2",
    },
    {
      type: "sequence",
      source_id: "pat_circle_2",
      target_id: "pat_square_2",
    },
    {
      type: "sequence",
      source_id: "pat_square_2",
      target_id: "pat_triangle_2",
    },
  ],
  axes: {
    shape: {
      values: ["circle", "square", "triangle", "diamond"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với quy luật hình dạng",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng quy luật hình dạng",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt quy luật hình dạng với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi quy luật hình dạng",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục quy luật hình dạng và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn đúng {label} nhé!",
    narration_template: "Chúng mình cùng tìm hiểu về Quy luật hình dạng nhé!",
  },
  ordering: [
    "pat_circle",
    "pat_square",
    "pat_triangle",
    "pat_circle_2",
    "pat_square_2",
    "pat_triangle_2",
  ],
};

export const C1_PAT_09_SEED: SkillSeed = {
  identity: C1_PAT_09_IDENTITY,
  dataset: C1_PAT_09_DATASET,
  levels: [
    {
      code: "GL-C1-PAT-TAP-0021",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-TAP-0022",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-TCMP-0021",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
  ],
};
