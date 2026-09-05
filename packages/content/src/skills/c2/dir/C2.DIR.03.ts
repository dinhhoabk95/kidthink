import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_DIR_03_IDENTITY: SkillIdentity = {
  code: "C2.DIR.03",
  strand_code: "C2.DIR",
  competency_code: "C2",
  name: "Rẽ trái",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["plan", "shift"],
  tier: "core",
  prerequisites: ["C2.ORI.01"],
  learning_objectives: [
    {
      code: "LO-C2.DIR.03-01",
      behaviour: "Nhận biết và thực hành Rẽ trái ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.DIR.03-02",
      behaviour: "Vận dụng Rẽ trái trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.DIR.03-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Rẽ trái",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_DIR_03_DATASET: SkillDataset = {
  skill_code: "C2.DIR.03",
  concept_label: "Rẽ trái",
  surface: "game",
  items: [
    {
      id: "bed",
      label: "cái giường",
      image: {
        kind: "emoji",
        ref: "🛏️",
      },
      category: {
        type: "đồ dùng",
      },
    },
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
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Rẽ trái",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Rẽ trái",
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
    narration_template: "Chúng mình cùng tìm hiểu về Rẽ trái nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["bed", "chair", "apple", "banana", "watermelon"],
};

export const C2_DIR_03_SEED: SkillSeed = {
  identity: C2_DIR_03_IDENTITY,
  dataset: C2_DIR_03_DATASET,
  levels: [
    {
      code: "GL-C2-DIR-SHAD-0011",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C2-DIR-SHAD-0012",
      template: "GT-007",
      band: "3-4",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C2-DIR-SIZE-0001",
      template: "GT-009",
      band: "4-5",
      difficulty: 2,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C2-DIR-SIZE-0002",
      template: "GT-009",
      band: "4-5",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C2-DIR-PUZZ-0001",
      template: "GT-010",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C2-DIR-PUZZ-0002",
      template: "GT-010",
      band: "4-5",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C2-DIR-MAZE-0001",
      template: "GT-013",
      band: "4-5",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C2-DIR-MAZE-0002",
      template: "GT-013",
      band: "4-5",
      difficulty: 3,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C2-DIR-TFRA-0001",
      template: "GT-019",
      band: "4-5",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C2-DIR-TFRA-0002",
      template: "GT-019",
      band: "4-5",
      difficulty: 3,
      theme: "space",
      rounds: 3,
    },
  ],
};
