import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_DIR_07_IDENTITY: SkillIdentity = {
  code: "C2.DIR.07",
  strand_code: "C2.DIR",
  competency_code: "C2",
  name: "Theo lộ trình nhiều bước",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["plan", "sequence"],
  tier: "advanced",
  prerequisites: ["C2.DIR.03", "C2.DIR.04"],
  learning_objectives: [
    {
      code: "LO-C2.DIR.07-01",
      behaviour: "Nhận biết và thực hành Theo lộ trình nhiều bước ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.DIR.07-02",
      behaviour: "Vận dụng Theo lộ trình nhiều bước trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.DIR.07-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Theo lộ trình nhiều bước",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_DIR_07_DATASET: SkillDataset = {
  skill_code: "C2.DIR.07",
  concept_label: "Theo lộ trình nhiều bước",
  surface: "game",
  items: [
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
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Theo lộ trình nhiều bước",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Theo lộ trình nhiều bước",
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
      "Chúng mình cùng tìm hiểu về Theo lộ trình nhiều bước nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["watermelon", "carrot", "corn", "dog", "cat"],
};

export const C2_DIR_07_SEED: SkillSeed = {
  identity: C2_DIR_07_IDENTITY,
  dataset: C2_DIR_07_DATASET,
  levels: [
    {
      code: "GL-C3-RNK-ORD-0010",
      template: "GT-006",
      band: "5-6",
      difficulty: 1,
      theme: "festival",
      rounds: 3,
      legacy_v1_ref: "D4-06",
    },
    {
      code: "GL-C2-DIR-SORT-0001",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C2-DIR-SHAD-0017",
      template: "GT-007",
      band: "4-5",
      difficulty: 3,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C2-DIR-SHAD-0018",
      template: "GT-007",
      band: "4-5",
      difficulty: 4,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C2-DIR-SLOT-0001",
      template: "GT-008",
      band: "4-5",
      difficulty: 3,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C2-DIR-SLOT-0002",
      template: "GT-008",
      band: "4-5",
      difficulty: 4,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C2-DIR-SIZE-0007",
      template: "GT-009",
      band: "4-5",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C2-DIR-SIZE-0008",
      template: "GT-009",
      band: "4-5",
      difficulty: 4,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C2-DIR-MAZE-0005",
      template: "GT-013",
      band: "4-5",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C2-DIR-MAZE-0006",
      template: "GT-013",
      band: "4-5",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
  ],
};
