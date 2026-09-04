import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_GEO_02_IDENTITY: SkillIdentity = {
  code: "C2.GEO.02",
  strand_code: "C2.GEO",
  competency_code: "C2",
  name: "Hình vuông",
  age_min: 3,
  age_max: 3,
  difficulty: 1,
  thinking_processes: ["observe"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C2.GEO.02-01",
      behaviour: "Nhận biết và thực hành Hình vuông ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.GEO.02-02",
      behaviour: "Vận dụng Hình vuông trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.GEO.02-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Hình vuông",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_GEO_02_DATASET: SkillDataset = {
  skill_code: "C2.GEO.02",
  concept_label: "Hình vuông",
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
      description: "Làm quen cơ bản với Hình vuông",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Hình vuông",
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
    narration_template: "Chúng mình cùng tìm hiểu về Hình vuông nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["square", "triangle", "rectangle", "star"],
};

export const C2_GEO_02_SEED: SkillSeed = {
  identity: C2_GEO_02_IDENTITY,
  dataset: C2_GEO_02_DATASET,
  levels: [
    {
      code: "GL-C2-GEO-MATCH-0102",
      template: "GT-005",
      band: "5-6",
      difficulty: 4,
      theme: "home",
      rounds: 3,
      montessori_ref: "WB19-D1",
    },
    {
      code: "GL-C2-GEO-MATCH-0003",
      template: "GT-005",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C2-SHP-BSK-0001",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
      legacy_v1_ref: "D2-05",
    },
    {
      code: "GL-C2-SHP-BSK-0002",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
      legacy_v1_ref: "D2-05",
    },
    {
      code: "GL-C2-TOW-STK-0006",
      template: "GT-023",
      band: "5-6",
      difficulty: 3,
      theme: "art",
      rounds: 3,
      legacy_v1_ref: "D6-10",
    },
    {
      code: "GL-C2-TOW-STK-0007",
      template: "GT-023",
      band: "5-6",
      difficulty: 1,
      theme: "home",
      rounds: 3,
      legacy_v1_ref: "D6-10",
    },
    {
      code: "GL-C2-TOW-STK-0008",
      template: "GT-023",
      band: "5-6",
      difficulty: 2,
      theme: "festival",
      rounds: 3,
      legacy_v1_ref: "D6-10",
    },
    {
      code: "GL-C2-TOW-STK-0009",
      template: "GT-023",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
      legacy_v1_ref: "D6-10",
    },
    {
      code: "GL-C2-TOW-STK-0010",
      template: "GT-023",
      band: "5-6",
      difficulty: 1,
      theme: "farm",
      rounds: 3,
      legacy_v1_ref: "D6-10",
    },
  ],
};
