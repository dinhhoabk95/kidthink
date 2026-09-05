import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C6_FLX_03_IDENTITY: SkillIdentity = {
  code: "C6.FLX.03",
  strand_code: "C6.FLX",
  competency_code: "C6",
  name: "Chuyển giữa hai nhiệm vụ",
  age_min: 6,
  age_max: 6,
  difficulty: 5,
  thinking_processes: ["shift", "plan"],
  tier: "advanced",
  prerequisites: ["C6.FLX.01"],
  learning_objectives: [
    {
      code: "LO-C6.FLX.03-01",
      behaviour: "Nhận biết và thực hành Chuyển giữa hai nhiệm vụ ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C6.FLX.03-02",
      behaviour: "Vận dụng Chuyển giữa hai nhiệm vụ trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C6.FLX.03-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Chuyển giữa hai nhiệm vụ",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C6_FLX_03_DATASET: SkillDataset = {
  skill_code: "C6.FLX.03",
  concept_label: "Chuyển giữa hai nhiệm vụ",
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
      description: "Làm quen cơ bản với Chuyển giữa hai nhiệm vụ",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Chuyển giữa hai nhiệm vụ",
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
      "Chúng mình cùng tìm hiểu về Chuyển giữa hai nhiệm vụ nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["watermelon", "carrot", "corn", "dog", "cat"],
};

export const C6_FLX_03_SEED: SkillSeed = {
  identity: C6_FLX_03_IDENTITY,
  dataset: C6_FLX_03_DATASET,
  levels: [
    {
      code: "GL-C3-BLG-TAP-0009",
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      theme: "home",
      rounds: 3,
      legacy_v1_ref: "D4-07",
    },
    {
      code: "GL-C3-BLG-TAP-0010",
      template: "GT-001",
      band: "5-6",
      difficulty: 1,
      theme: "festival",
      rounds: 3,
      legacy_v1_ref: "D4-07",
    },
    {
      code: "GL-C3-MUL-BSK-0006",
      template: "GT-003",
      band: "5-6",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
      legacy_v1_ref: "D4-04",
    },
    {
      code: "GL-C3-MUL-BSK-0007",
      template: "GT-003",
      band: "5-6",
      difficulty: 1,
      theme: "vehicle",
      rounds: 3,
      legacy_v1_ref: "D4-04",
    },
    {
      code: "GL-C3-MUL-BSK-0008",
      template: "GT-003",
      band: "5-6",
      difficulty: 2,
      theme: "art",
      rounds: 3,
      legacy_v1_ref: "D4-04",
    },
    {
      code: "GL-C6-FLX-SORT-0001",
      template: "GT-006",
      band: "5-6",
      difficulty: 4,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C6-FLX-SORT-0002",
      template: "GT-006",
      band: "5-6",
      difficulty: 5,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C6-FLX-SHAD-0001",
      template: "GT-007",
      band: "5-6",
      difficulty: 4,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C6-FLX-SHAD-0002",
      template: "GT-007",
      band: "5-6",
      difficulty: 5,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C6-FLX-SIZE-0001",
      template: "GT-009",
      band: "5-6",
      difficulty: 4,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C6-FLX-SIZE-0002",
      template: "GT-009",
      band: "5-6",
      difficulty: 5,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C6-FLX-PUZZ-0007",
      template: "GT-010",
      band: "5-6",
      difficulty: 4,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C6-FLX-PUZZ-0008",
      template: "GT-010",
      band: "5-6",
      difficulty: 5,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C6-FLX-MAZE-0001",
      template: "GT-013",
      band: "5-6",
      difficulty: 4,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C6-FLX-MAZE-0002",
      template: "GT-013",
      band: "5-6",
      difficulty: 5,
      theme: "body",
      rounds: 3,
    },
  ],
};
