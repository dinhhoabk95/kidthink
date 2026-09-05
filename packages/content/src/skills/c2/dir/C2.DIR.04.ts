import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_DIR_04_IDENTITY: SkillIdentity = {
  code: "C2.DIR.04",
  strand_code: "C2.DIR",
  competency_code: "C2",
  name: "Rẽ phải",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["plan", "shift"],
  tier: "core",
  prerequisites: ["C2.ORI.02"],
  learning_objectives: [
    {
      code: "LO-C2.DIR.04-01",
      behaviour: "Nhận biết và thực hành Rẽ phải ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.DIR.04-02",
      behaviour: "Vận dụng Rẽ phải trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.DIR.04-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Rẽ phải",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_DIR_04_DATASET: SkillDataset = {
  skill_code: "C2.DIR.04",
  concept_label: "Rẽ phải",
  surface: "game",
  items: [
    {
      id: "chair",
      label: "cái ghế",
      image: {
        kind: "emoji",
        ref: "🪑",
      },
      category: {
        type: "đồ dùng",
      },
    },
    {
      id: "apple",
      label: "quả táo",
      image: {
        kind: "emoji",
        ref: "🍎",
      },
      category: {
        type: "hoa quả",
      },
    },
    {
      id: "banana",
      label: "quả chuối",
      image: {
        kind: "emoji",
        ref: "🍌",
      },
      category: {
        type: "hoa quả",
      },
    },
    {
      id: "watermelon",
      label: "dưa hấu",
      image: {
        kind: "emoji",
        ref: "🍉",
      },
      category: {
        type: "hoa quả",
      },
    },
    {
      id: "carrot",
      label: "củ cà rốt",
      image: {
        kind: "emoji",
        ref: "🥕",
      },
      category: {
        type: "rau củ",
      },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Rẽ phải",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Rẽ phải",
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
    narration_template: "Chúng mình cùng tìm hiểu về Rẽ phải nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["chair", "apple", "banana", "watermelon", "carrot"],
};

export const C2_DIR_04_SEED: SkillSeed = {
  identity: C2_DIR_04_IDENTITY,
  dataset: C2_DIR_04_DATASET,
  levels: [
    {
      code: "GL-C2-DIR-SHAD-0013",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C2-DIR-SHAD-0014",
      template: "GT-007",
      band: "3-4",
      difficulty: 3,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C2-DIR-SIZE-0003",
      template: "GT-009",
      band: "4-5",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C2-DIR-SIZE-0004",
      template: "GT-009",
      band: "4-5",
      difficulty: 3,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C2-DIR-PUZZ-0003",
      template: "GT-010",
      band: "4-5",
      difficulty: 2,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C2-DIR-PUZZ-0004",
      template: "GT-010",
      band: "4-5",
      difficulty: 3,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C2-DIR-MAZE-0003",
      template: "GT-013",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C2-DIR-MAZE-0004",
      template: "GT-013",
      band: "4-5",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C2-DIR-TFRA-0003",
      template: "GT-019",
      band: "4-5",
      difficulty: 2,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C2-DIR-TFRA-0004",
      template: "GT-019",
      band: "4-5",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
  ],
};
