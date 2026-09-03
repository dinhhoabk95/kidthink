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
      id: "square",
      label: "hình vuông",
      image: {
        kind: "emoji",
        ref: "🟦",
      },
      category: {
        type: "shape",
      },
    },
    {
      id: "triangle",
      label: "hình tam giác",
      image: {
        kind: "emoji",
        ref: "🔺",
      },
      category: {
        type: "shape",
      },
    },
    {
      id: "rectangle",
      label: "hình chữ nhật",
      image: {
        kind: "emoji",
        ref: "🟧",
      },
      category: {
        type: "shape",
      },
    },
    {
      id: "star",
      label: "hình ngôi sao",
      image: {
        kind: "emoji",
        ref: "⭐",
      },
      category: {
        type: "shape",
      },
    },
  ],
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
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["square", "triangle", "rectangle", "star"],
};

export const C2_GEO_07_SEED: SkillSeed = {
  identity: C2_GEO_07_IDENTITY,
  dataset: C2_GEO_07_DATASET,
  levels: [
    {
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-002",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
  ],
};
