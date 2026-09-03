import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_EXP_04_IDENTITY: SkillIdentity = {
  code: "C4.EXP.04",
  strand_code: "C4.EXP",
  competency_code: "C4",
  name: "Nam châm hút gì",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["predict", "sort"],
  tier: "core",
  prerequisites: ["C4.EXP.01", "C3.CLS.04"],
  learning_objectives: [
    {
      code: "LO-C4.EXP.04-01",
      behaviour: "Nhận biết và thực hành Nam châm hút gì ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.EXP.04-02",
      behaviour: "Vận dụng Nam châm hút gì trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.EXP.04-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Nam châm hút gì",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_EXP_04_DATASET: SkillDataset = {
  skill_code: "C4.EXP.04",
  concept_label: "Nam châm hút gì",
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
      description: "Làm quen cơ bản với Nam châm hút gì",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nam châm hút gì",
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
    narration_template: "Chúng mình cùng tìm hiểu về Nam châm hút gì nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["corn", "dog", "cat", "chicken", "duck"],
};

export const C4_EXP_04_SEED: SkillSeed = {
  identity: C4_EXP_04_IDENTITY,
  dataset: C4_EXP_04_DATASET,
  levels: [
    {
      template: "GT-002",
      band: "5-6",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-003",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
  ],
};
