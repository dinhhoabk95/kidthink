import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C3_CLS_02_IDENTITY: SkillIdentity = {
  code: "C3.CLS.02",
  strand_code: "C3.CLS",
  competency_code: "C3",
  name: "Phân loại theo hình",
  age_min: 3,
  age_max: 3,
  difficulty: 1,
  thinking_processes: ["sort", "observe"],
  tier: "basic",
  prerequisites: ["C2.GEO.01"],
  learning_objectives: [
    {
      code: "LO-C3.CLS.02-01",
      behaviour: "Nhận biết và thực hành Phân loại theo hình ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C3.CLS.02-02",
      behaviour: "Vận dụng Phân loại theo hình trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C3.CLS.02-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Phân loại theo hình",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C3_CLS_02_DATASET: SkillDataset = {
  skill_code: "C3.CLS.02",
  concept_label: "Phân loại theo hình",
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
      description: "Làm quen cơ bản với Phân loại theo hình",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Phân loại theo hình",
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
    narration_template: "Chúng mình cùng tìm hiểu về Phân loại theo hình nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["banana", "watermelon", "carrot", "corn", "dog"],
};

export const C3_CLS_02_SEED: SkillSeed = {
  identity: C3_CLS_02_IDENTITY,
  dataset: C3_CLS_02_DATASET,
  levels: [
    {
      code: "GL-C3-CLS-BOX-0014",
      template: "GT-003",
      band: "4-5",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C3-CLS-MULTI-0203",
      template: "GT-002",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C3-SHP-BSK-0001",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
      legacy_v1_ref: "D4-02",
    },
    {
      code: "GL-C3-SHP-BSK-0002",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
      legacy_v1_ref: "D4-02",
    },
    {
      code: "GL-C3-SHP-BSK-0003",
      template: "GT-003",
      band: "3-4",
      difficulty: 3,
      theme: "food",
      rounds: 3,
      legacy_v1_ref: "D4-02",
    },
    {
      code: "GL-C3-DED-LOG-0006",
      template: "GT-009",
      band: "5-6",
      difficulty: 3,
      theme: "vehicle",
      rounds: 3,
      legacy_v1_ref: "D6-07",
    },
    {
      code: "GL-C3-DED-LOG-0007",
      template: "GT-009",
      band: "5-6",
      difficulty: 1,
      theme: "art",
      rounds: 3,
      legacy_v1_ref: "D6-07",
    },
    {
      code: "GL-C3-DED-LOG-0008",
      template: "GT-009",
      band: "5-6",
      difficulty: 2,
      theme: "home",
      rounds: 3,
      legacy_v1_ref: "D6-07",
    },
    {
      code: "GL-C3-DED-LOG-0009",
      template: "GT-009",
      band: "5-6",
      difficulty: 3,
      theme: "festival",
      rounds: 3,
      legacy_v1_ref: "D6-07",
    },
    {
      code: "GL-C3-DED-LOG-0010",
      template: "GT-009",
      band: "5-6",
      difficulty: 1,
      theme: "school",
      rounds: 3,
      legacy_v1_ref: "D6-07",
    },
  ],
};
