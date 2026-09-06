import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_GEO_05_IDENTITY: SkillIdentity = {
  code: "C2.GEO.05",
  strand_code: "C2.GEO",
  competency_code: "C2",
  name: "Hình oval",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["observe", "compare"],
  tier: "basic",
  prerequisites: ["C2.GEO.09", "C2.GEO.01"],
  learning_objectives: [
    {
      code: "LO-C2.GEO.05-01",
      behaviour: "Nhận biết và thực hành Hình oval ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.GEO.05-02",
      behaviour: "Vận dụng Hình oval trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.GEO.05-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Hình oval",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_GEO_05_DATASET: SkillDataset = {
  skill_code: "C2.GEO.05",
  concept_label: "Hình oval",
  surface: "game",
  items: [
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
    {
      id: "diamond",
      label: "hình thoi",
      image: {
        kind: "emoji",
        ref: "🔷",
      },
      category: {
        type: "shape",
      },
    },
    {
      id: "oval",
      label: "hình bầu dục",
      image: {
        kind: "emoji",
        ref: "🟢",
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
      description: "Làm quen cơ bản với Hình oval",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Hình oval",
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
    narration_template: "Chúng mình cùng tìm hiểu về Hình oval nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["star", "heart", "diamond", "oval"],
};

export const C2_GEO_05_SEED: SkillSeed = {
  identity: C2_GEO_05_IDENTITY,
  dataset: C2_GEO_05_DATASET,
  levels: [
    {
      code: "GL-C2-HOL-SLOT-0003",
      template: "GT-008",
      band: "3-4",
      difficulty: 3,
      theme: "food",
      rounds: 3,
      legacy_v1_ref: "D2-01",
    },
    {
      code: "GL-C2-HOL-SLOT-0004",
      template: "GT-008",
      band: "4-5",
      difficulty: 1,
      theme: "animal",
      rounds: 3,
      legacy_v1_ref: "D2-01",
    },
    {
      code: "GL-C2-GEO-TAP-0007",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C2-GEO-TAP-0008",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C2-GEO-TCNT-0003",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C2-GEO-TCNT-0004",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C2-GEO-TCMP-0003",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C2-GEO-TCMP-0004",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C2-GEO-PAIR-0003",
      template: "GT-004",
      band: "4-5",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C2-GEO-PAIR-0004",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C2-GEO-PATT-0006",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C2-GEO-PATT-0007",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
    },
  ],
};
