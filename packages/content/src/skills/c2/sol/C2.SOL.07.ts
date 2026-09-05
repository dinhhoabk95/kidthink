import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_SOL_07_IDENTITY: SkillIdentity = {
  code: "C2.SOL.07",
  strand_code: "C2.SOL",
  competency_code: "C2",
  name: "Mặt · cạnh · đỉnh của khối",
  age_min: 6,
  age_max: 7,
  difficulty: 4,
  thinking_processes: ["count", "observe"],
  tier: "advanced",
  prerequisites: ["C2.SOL.04", "C1.CNT.01"],
  learning_objectives: [
    {
      code: "LO-C2.SOL.07-01",
      behaviour:
        "Nhận biết và thực hành Mặt · cạnh · đỉnh của khối ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.SOL.07-02",
      behaviour:
        "Vận dụng Mặt · cạnh · đỉnh của khối trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.SOL.07-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Mặt · cạnh · đỉnh của khối",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_SOL_07_DATASET: SkillDataset = {
  skill_code: "C2.SOL.07",
  concept_label: "Mặt · cạnh · đỉnh của khối",
  surface: "game",
  items: [
    {
      id: "circle",
      label: "hình tròn",
      image: {
        kind: "emoji",
        ref: "🔴",
      },
      category: {
        type: "shape",
      },
    },
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
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Mặt · cạnh · đỉnh của khối",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Mặt · cạnh · đỉnh của khối",
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
    narration_template:
      "Chúng mình cùng tìm hiểu về Mặt · cạnh · đỉnh của khối nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["circle", "square", "triangle", "rectangle"],
};

export const C2_SOL_07_SEED: SkillSeed = {
  identity: C2_SOL_07_IDENTITY,
  dataset: C2_SOL_07_DATASET,
  levels: [
    {
      code: "GL-C2-SOL-TAP-0013",
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C2-SOL-TAP-0014",
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C2-SOL-TCNT-0013",
      template: "GT-002",
      band: "5-6",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C2-SOL-TCNT-0014",
      template: "GT-002",
      band: "5-6",
      difficulty: 4,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C2-SOL-TCMP-0013",
      template: "GT-003",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C2-SOL-TCMP-0014",
      template: "GT-003",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C2-SOL-PAIR-0013",
      template: "GT-004",
      band: "5-6",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C2-SOL-PAIR-0014",
      template: "GT-004",
      band: "5-6",
      difficulty: 4,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C2-SOL-PATT-0013",
      template: "GT-005",
      band: "5-6",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C2-SOL-PATT-0014",
      template: "GT-005",
      band: "5-6",
      difficulty: 4,
      theme: "ocean",
      rounds: 3,
    },
  ],
};
