import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_ORD_04_IDENTITY: SkillIdentity = {
  code: "C1.ORD.04",
  strand_code: "C1.ORD",
  competency_code: "C1",
  name: "Thứ tự đến thứ mười",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["sequence", "count"],
  tier: "core",
  prerequisites: ["C1.ORD.03", "C1.NREC.03"],
  learning_objectives: [
    {
      code: "LO-C1.ORD.04-01",
      behaviour: "Nhận biết và thực hành Thứ tự đến thứ mười ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.ORD.04-02",
      behaviour: "Vận dụng Thứ tự đến thứ mười trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.ORD.04-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Thứ tự đến thứ mười",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_ORD_04_DATASET: SkillDataset = {
  skill_code: "C1.ORD.04",
  concept_label: "Thứ tự đến thứ mười",
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
      description: "Làm quen cơ bản với Thứ tự đến thứ mười",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Thứ tự đến thứ mười",
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
    narration_template: "Chúng mình cùng tìm hiểu về Thứ tự đến thứ mười nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["corn", "dog", "cat", "chicken", "duck"],
};

export const C1_ORD_04_SEED: SkillSeed = {
  identity: C1_ORD_04_IDENTITY,
  dataset: C1_ORD_04_DATASET,
  levels: [
    {
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-002",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      template: "GT-003",
      band: "5-6",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
  ],
};
