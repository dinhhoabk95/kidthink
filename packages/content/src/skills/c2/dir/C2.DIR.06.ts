import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_DIR_06_IDENTITY: SkillIdentity = {
  code: "C2.DIR.06",
  strand_code: "C2.DIR",
  competency_code: "C2",
  name: "Theo bản đồ",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["plan", "infer"],
  tier: "advanced",
  prerequisites: ["C2.DIR.05"],
  learning_objectives: [
    {
      code: "LO-C2.DIR.06-01",
      behaviour: "Nhận biết và thực hành Theo bản đồ ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.DIR.06-02",
      behaviour: "Vận dụng Theo bản đồ trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.DIR.06-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Theo bản đồ",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_DIR_06_DATASET: SkillDataset = {
  skill_code: "C2.DIR.06",
  concept_label: "Theo bản đồ",
  surface: "game",
  items: [
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
    {
      id: "corn",
      label: "bắp ngô",
      image: {
        kind: "emoji",
        ref: "🌽",
      },
      category: {
        type: "rau củ",
      },
    },
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
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Theo bản đồ",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Theo bản đồ",
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
    narration_template: "Chúng mình cùng tìm hiểu về Theo bản đồ nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["banana", "watermelon", "carrot", "corn", "dog"],
};

export const C2_DIR_06_SEED: SkillSeed = {
  identity: C2_DIR_06_IDENTITY,
  dataset: C2_DIR_06_DATASET,
  levels: [
    {
      code: "GL-C3-RNK-ORD-0007",
      template: "GT-006",
      band: "5-6",
      difficulty: 1,
      theme: "vehicle",
      rounds: 3,
      legacy_v1_ref: "D4-06",
    },
    {
      code: "GL-C3-RNK-ORD-0008",
      template: "GT-006",
      band: "5-6",
      difficulty: 2,
      theme: "art",
      rounds: 3,
      legacy_v1_ref: "D4-06",
    },
    {
      code: "GL-C3-RNK-ORD-0009",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "home",
      rounds: 3,
      legacy_v1_ref: "D4-06",
    },
    {
      code: "GL-C2-DIR-PAIR-0003",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C2-DIR-PAIR-0004",
      template: "GT-004",
      band: "4-5",
      difficulty: 4,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C2-DIR-SHAD-0015",
      template: "GT-007",
      band: "4-5",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C2-DIR-SHAD-0016",
      template: "GT-007",
      band: "4-5",
      difficulty: 4,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C2-DIR-SIZE-0005",
      template: "GT-009",
      band: "4-5",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C2-DIR-SIZE-0006",
      template: "GT-009",
      band: "4-5",
      difficulty: 4,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C2-DIR-PUZZ-0005",
      template: "GT-010",
      band: "4-5",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C2-DIR-PUZZ-0006",
      template: "GT-010",
      band: "4-5",
      difficulty: 4,
      theme: "vehicle",
      rounds: 3,
    },
  ],
};
