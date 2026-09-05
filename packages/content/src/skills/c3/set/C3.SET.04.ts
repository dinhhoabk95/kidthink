import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C3_SET_04_IDENTITY: SkillIdentity = {
  code: "C3.SET.04",
  strand_code: "C3.SET",
  competency_code: "C3",
  name: "Hai vòng giao nhau",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["sort", "infer"],
  tier: "advanced",
  prerequisites: ["C3.SET.03"],
  learning_objectives: [
    {
      code: "LO-C3.SET.04-01",
      behaviour: "Nhận biết và thực hành Hai vòng giao nhau ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C3.SET.04-02",
      behaviour: "Vận dụng Hai vòng giao nhau trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C3.SET.04-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Hai vòng giao nhau",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C3_SET_04_DATASET: SkillDataset = {
  skill_code: "C3.SET.04",
  concept_label: "Hai vòng giao nhau",
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
      description: "Làm quen cơ bản với Hai vòng giao nhau",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Hai vòng giao nhau",
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
    narration_template: "Chúng mình cùng tìm hiểu về Hai vòng giao nhau nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["watermelon", "carrot", "corn", "dog", "cat"],
};

export const C3_SET_04_SEED: SkillSeed = {
  identity: C3_SET_04_IDENTITY,
  dataset: C3_SET_04_DATASET,
  levels: [
    {
      code: "GL-C3-SET-TCNT-0005",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C3-SET-TCNT-0006",
      template: "GT-002",
      band: "4-5",
      difficulty: 4,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C3-SET-TCMP-0008",
      template: "GT-003",
      band: "4-5",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C3-SET-TCMP-0009",
      template: "GT-003",
      band: "4-5",
      difficulty: 4,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C3-SET-PAIR-0005",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C3-SET-PAIR-0006",
      template: "GT-004",
      band: "4-5",
      difficulty: 4,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C3-SET-SORT-0003",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C3-SET-SORT-0004",
      template: "GT-006",
      band: "5-6",
      difficulty: 4,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C3-SET-SHAD-0005",
      template: "GT-007",
      band: "4-5",
      difficulty: 3,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C3-SET-SHAD-0006",
      template: "GT-007",
      band: "4-5",
      difficulty: 4,
      theme: "body",
      rounds: 3,
    },
  ],
};
