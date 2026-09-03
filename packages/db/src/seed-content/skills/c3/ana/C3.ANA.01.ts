import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C3_ANA_01_IDENTITY: SkillIdentity = {
  code: "C3.ANA.01",
  strand_code: "C3.ANA",
  competency_code: "C3",
  name: "Tìm cặp giống nhau",
  age_min: 3,
  age_max: 3,
  difficulty: 2,
  thinking_processes: ["match", "compare"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C3.ANA.01-01",
      behaviour: "Nhận biết và thực hành Tìm cặp giống nhau ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C3.ANA.01-02",
      behaviour: "Vận dụng Tìm cặp giống nhau trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C3.ANA.01-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Tìm cặp giống nhau",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C3_ANA_01_DATASET: SkillDataset = {
  skill_code: "C3.ANA.01",
  concept_label: "Tìm cặp giống nhau",
  surface: "game",
  items: [
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
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Tìm cặp giống nhau",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Tìm cặp giống nhau",
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
    narration_template: "Chúng mình cùng tìm hiểu về Tìm cặp giống nhau nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["corn", "dog", "cat", "chicken", "duck"],
};

export const C3_ANA_01_SEED: SkillSeed = {
  identity: C3_ANA_01_IDENTITY,
  dataset: C3_ANA_01_DATASET,
  levels: [
    {
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
  ],
};
