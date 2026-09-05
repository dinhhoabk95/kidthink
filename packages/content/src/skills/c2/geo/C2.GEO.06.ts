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
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["circle", "square", "triangle", "rectangle"],
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
      legacy_v1_ref: "D2-01",
    },
    {
      code: "GL-C2-HOL-SLOT-0006",
      template: "GT-008",
      band: "4-5",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
      legacy_v1_ref: "D2-01",
    },
    {
      code: "GL-C2-GEO-TAP-0009",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C2-GEO-TAP-0010",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C2-GEO-TCNT-0005",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C2-GEO-TCNT-0006",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C2-GEO-TCMP-0005",
      template: "GT-003",
      band: "4-5",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C2-GEO-TCMP-0006",
      template: "GT-003",
      band: "4-5",
      difficulty: 3,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C2-GEO-PAIR-0005",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C2-GEO-PAIR-0006",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C2-GEO-PATT-0008",
      template: "GT-005",
      band: "4-5",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C2-GEO-PATT-0009",
      template: "GT-005",
      band: "4-5",
      difficulty: 3,
      theme: "festival",
      rounds: 3,
    },
  ],
};
