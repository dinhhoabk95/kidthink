import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_SOL_03_IDENTITY: SkillIdentity = {
  code: "C2.SOL.03",
  strand_code: "C2.SOL",
  competency_code: "C2",
  name: "Khối trụ",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["observe", "compare"],
  tier: "core",
  prerequisites: ["C2.SOL.01"],
  learning_objectives: [
    {
      code: "LO-C2.SOL.03-01",
      behaviour: "Nhận biết và thực hành Khối trụ ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.SOL.03-02",
      behaviour: "Vận dụng Khối trụ trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.SOL.03-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Khối trụ",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_SOL_03_DATASET: SkillDataset = {
  skill_code: "C2.SOL.03",
  concept_label: "Khối trụ",
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
      description: "Làm quen cơ bản với Khối trụ",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Khối trụ",
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
    narration_template: "Chúng mình cùng tìm hiểu về Khối trụ nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["square", "triangle", "rectangle", "star"],
};

export const C2_SOL_03_SEED: SkillSeed = {
  identity: C2_SOL_03_IDENTITY,
  dataset: C2_SOL_03_DATASET,
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
