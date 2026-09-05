import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C3_ALG_06_IDENTITY: SkillIdentity = {
  code: "C3.ALG.06",
  strand_code: "C3.ALG",
  competency_code: "C3",
  name: "Tự viết chuỗi lệnh tới đích",
  age_min: 6,
  age_max: 7,
  difficulty: 5,
  thinking_processes: ["plan", "create"],
  tier: "advanced",
  prerequisites: ["C3.ALG.04", "C2.GRD.02"],
  learning_objectives: [
    {
      code: "LO-C3.ALG.06-01",
      behaviour:
        "Nhận biết và thực hành Tự viết chuỗi lệnh tới đích ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C3.ALG.06-02",
      behaviour:
        "Vận dụng Tự viết chuỗi lệnh tới đích trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C3.ALG.06-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Tự viết chuỗi lệnh tới đích",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C3_ALG_06_DATASET: SkillDataset = {
  skill_code: "C3.ALG.06",
  concept_label: "Tự viết chuỗi lệnh tới đích",
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
      description: "Làm quen cơ bản với Tự viết chuỗi lệnh tới đích",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Tự viết chuỗi lệnh tới đích",
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
      "Chúng mình cùng tìm hiểu về Tự viết chuỗi lệnh tới đích nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["watermelon", "carrot", "corn", "dog", "cat"],
};

export const C3_ALG_06_SEED: SkillSeed = {
  identity: C3_ALG_06_IDENTITY,
  dataset: C3_ALG_06_DATASET,
  levels: [
    {
      code: "GL-C3-ALG-SORT-0007",
      template: "GT-006",
      band: "5-6",
      difficulty: 4,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C3-ALG-SORT-0008",
      template: "GT-006",
      band: "5-6",
      difficulty: 5,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C3-ALG-SHAD-0009",
      template: "GT-007",
      band: "5-6",
      difficulty: 4,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C3-ALG-SHAD-0010",
      template: "GT-007",
      band: "5-6",
      difficulty: 5,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C3-ALG-SIZE-0009",
      template: "GT-009",
      band: "5-6",
      difficulty: 4,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C3-ALG-SIZE-0010",
      template: "GT-009",
      band: "5-6",
      difficulty: 5,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C3-ALG-MAZE-0007",
      template: "GT-013",
      band: "5-6",
      difficulty: 4,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C3-ALG-MAZE-0008",
      template: "GT-013",
      band: "5-6",
      difficulty: 5,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C3-ALG-HIDE-0003",
      template: "GT-015",
      band: "5-6",
      difficulty: 4,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C3-ALG-HIDE-0004",
      template: "GT-015",
      band: "5-6",
      difficulty: 5,
      theme: "body",
      rounds: 3,
    },
  ],
};
