import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_EXP_03_IDENTITY: SkillIdentity = {
  code: "C4.EXP.03",
  strand_code: "C4.EXP",
  competency_code: "C4",
  name: "Tan – không tan",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["predict", "verify"],
  tier: "core",
  prerequisites: ["C4.EXP.01"],
  learning_objectives: [
    {
      code: "LO-C4.EXP.03-01",
      behaviour: "Nhận biết và thực hành Tan – không tan ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.EXP.03-02",
      behaviour: "Vận dụng Tan – không tan trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.EXP.03-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Tan – không tan",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_EXP_03_DATASET: SkillDataset = {
  skill_code: "C4.EXP.03",
  concept_label: "Tan – không tan",
  surface: "game",
  items: [
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
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Tan – không tan",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Tan – không tan",
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
    narration_template: "Chúng mình cùng tìm hiểu về Tan – không tan nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["carrot", "corn", "dog", "cat", "chicken"],
};

export const C4_EXP_03_SEED: SkillSeed = {
  identity: C4_EXP_03_IDENTITY,
  dataset: C4_EXP_03_DATASET,
  levels: [
    {
      template: "GT-011",
      band: "5-6",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-013",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
  ],
};
