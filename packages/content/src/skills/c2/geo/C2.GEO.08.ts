import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_GEO_08_IDENTITY: SkillIdentity = {
  code: "C2.GEO.08",
  strand_code: "C2.GEO",
  competency_code: "C2",
  name: "Đa giác — đếm cạnh",
  age_min: 6,
  age_max: 6,
  difficulty: 4,
  thinking_processes: ["count", "infer"],
  tier: "advanced",
  prerequisites: ["C2.GEO.09", "C2.GEO.07", "C1.CNT.01"],
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
  concept_label: "Đa giác — đếm cạnh",
  surface: "game",
  items: [
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
    {
      id: "heart",
      label: "hình trái tim",
      image: {
        kind: "emoji",
        ref: "❤️",
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
      description: "Làm quen cơ bản với Đa giác — đếm cạnh",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Đa giác — đếm cạnh",
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
    narration_template: "Chúng mình cùng tìm hiểu về Đa giác — đếm cạnh nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["triangle", "rectangle", "star", "heart"],
};

export const C2_GEO_08_SEED: SkillSeed = {
  identity: C2_GEO_08_IDENTITY,
  dataset: C2_GEO_08_DATASET,
  levels: [
    {
      code: "GL-C2-GEO-TAP-0013",
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
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
      code: "GL-C2-GEO-TCNT-0010",
      template: "GT-002",
      band: "5-6",
      difficulty: 4,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C2-GEO-TCMP-0009",
      template: "GT-003",
      band: "5-6",
      difficulty: 3,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C2-GEO-TCMP-0010",
      template: "GT-003",
      band: "5-6",
      difficulty: 4,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C2-GEO-PAIR-0009",
      template: "GT-004",
      band: "5-6",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C2-GEO-PAIR-0010",
      template: "GT-004",
      band: "5-6",
      difficulty: 4,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C2-GEO-SORT-0001",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C2-GEO-SORT-0002",
      template: "GT-006",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
  ],
};
