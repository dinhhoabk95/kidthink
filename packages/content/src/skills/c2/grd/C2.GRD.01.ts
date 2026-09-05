import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_GRD_01_IDENTITY: SkillIdentity = {
  code: "C2.GRD.01",
  strand_code: "C2.GRD",
  competency_code: "C2",
  name: "Hàng và cột",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["observe", "sort"],
  tier: "core",
  prerequisites: ["C2.ORI.03", "C2.ORI.01"],
  learning_objectives: [
    {
      code: "LO-C2.GRD.01-01",
      behaviour: "Nhận biết và thực hành Hàng và cột ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.GRD.01-02",
      behaviour: "Vận dụng Hàng và cột trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.GRD.01-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Hàng và cột",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_GRD_01_DATASET: SkillDataset = {
  skill_code: "C2.GRD.01",
  concept_label: "Hàng và cột",
  surface: "game",
  items: [
    {
      id: "dog",
      label: "con chó",
      image: {
        kind: "emoji",
        ref: "🐕",
      },
      category: {
        type: "động vật",
      },
    },
    {
      id: "cat",
      label: "con mèo",
      image: {
        kind: "emoji",
        ref: "🐈",
      },
      category: {
        type: "động vật",
      },
    },
    {
      id: "chicken",
      label: "con gà",
      image: {
        kind: "emoji",
        ref: "🐓",
      },
      category: {
        type: "động vật",
      },
    },
    {
      id: "duck",
      label: "con vịt",
      image: {
        kind: "emoji",
        ref: "🦆",
      },
      category: {
        type: "động vật",
      },
    },
    {
      id: "fish",
      label: "con cá",
      image: {
        kind: "emoji",
        ref: "🐟",
      },
      category: {
        type: "động vật",
      },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Hàng và cột",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Hàng và cột",
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
    narration_template: "Chúng mình cùng tìm hiểu về Hàng và cột nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["dog", "cat", "chicken", "duck", "fish"],
};

export const C2_GRD_01_SEED: SkillSeed = {
  identity: C2_GRD_01_IDENTITY,
  dataset: C2_GRD_01_DATASET,
  levels: [
    {
      code: "GL-C2-GRD-TAP-0001",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C2-GRD-TAP-0002",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C2-GRD-TCNT-0001",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C2-GRD-TCNT-0002",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C2-GRD-TCMP-0001",
      template: "GT-003",
      band: "4-5",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C2-GRD-TCMP-0002",
      template: "GT-003",
      band: "4-5",
      difficulty: 3,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C2-GRD-PAIR-0001",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C2-GRD-PAIR-0002",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C2-GRD-PATT-0001",
      template: "GT-005",
      band: "4-5",
      difficulty: 2,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C2-GRD-PATT-0002",
      template: "GT-005",
      band: "4-5",
      difficulty: 3,
      theme: "homeland",
      rounds: 3,
    },
  ],
};
