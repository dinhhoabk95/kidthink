import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_SOL_01_IDENTITY: SkillIdentity = {
  code: "C2.SOL.01",
  strand_code: "C2.SOL",
  competency_code: "C2",
  name: "Khối cầu",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["observe", "match"],
  tier: "basic",
  prerequisites: ["C2.GEO.01"],
  learning_objectives: [
    {
      code: "LO-C2.SOL.01-01",
      behaviour: "Nhận biết và thực hành Khối cầu ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.SOL.01-02",
      behaviour: "Vận dụng Khối cầu trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.SOL.01-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Khối cầu",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_SOL_01_DATASET: SkillDataset = {
  skill_code: "C2.SOL.01",
  concept_label: "Khối cầu",
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
      description: "Làm quen cơ bản với Khối cầu",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Khối cầu",
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
    narration_template: "Chúng mình cùng tìm hiểu về Khối cầu nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["star", "heart", "diamond", "oval"],
};

export const C2_SOL_01_SEED: SkillSeed = {
  identity: C2_SOL_01_IDENTITY,
  dataset: C2_SOL_01_DATASET,
  levels: [
    {
      code: "GL-C2-SOL-TAP-0001",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C2-SOL-TAP-0002",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C2-SOL-TCNT-0001",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C2-SOL-TCNT-0002",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C2-SOL-TCMP-0001",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C2-SOL-TCMP-0002",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C2-SOL-PAIR-0001",
      template: "GT-004",
      band: "4-5",
      difficulty: 1,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C2-SOL-PAIR-0002",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C2-SOL-PATT-0001",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C2-SOL-PATT-0002",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
  ],
};
