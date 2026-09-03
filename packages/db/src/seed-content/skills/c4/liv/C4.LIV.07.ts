import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_LIV_07_IDENTITY: SkillIdentity = {
  code: "C4.LIV.07",
  strand_code: "C4.LIV",
  competency_code: "C4",
  name: "Vòng đời bướm · gà · cây",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["sequence", "infer"],
  tier: "advanced",
  prerequisites: ["C4.LIV.06", "C3.SEQ.03"],
  learning_objectives: [
    {
      code: "LO-C4.LIV.07-01",
      behaviour: "Nhận biết và thực hành Vòng đời bướm · gà · cây ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.LIV.07-02",
      behaviour: "Vận dụng Vòng đời bướm · gà · cây trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.LIV.07-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Vòng đời bướm · gà · cây",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_LIV_07_DATASET: SkillDataset = {
  skill_code: "C4.LIV.07",
  concept_label: "Vòng đời bướm · gà · cây",
  surface: "game",
  items: [
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
    {
      id: "fish",
      label: "con cá",
      image: {
        kind: "emoji",
        ref: "🐟",
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
      description: "Làm quen cơ bản với Vòng đời bướm · gà · cây",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Vòng đời bướm · gà · cây",
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
      "Chúng mình cùng tìm hiểu về Vòng đời bướm · gà · cây nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["dog", "cat", "chicken", "duck", "fish"],
};

export const C4_LIV_07_SEED: SkillSeed = {
  identity: C4_LIV_07_IDENTITY,
  dataset: C4_LIV_07_DATASET,
  levels: [
    {
      template: "GT-004",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-006",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
  ],
};
