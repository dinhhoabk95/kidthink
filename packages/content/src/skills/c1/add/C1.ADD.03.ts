import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_ADD_03_IDENTITY: SkillIdentity = {
  code: "C1.ADD.03",
  strand_code: "C1.ADD",
  competency_code: "C1",
  name: "Cộng trên trục số",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["sequence", "solve"],
  tier: "core",
  prerequisites: ["C1.CNT.08"],
  learning_objectives: [
    {
      code: "LO-C1.ADD.03-01",
      behaviour: "Nhận biết và thực hành Cộng trên trục số ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.ADD.03-02",
      behaviour: "Vận dụng Cộng trên trục số trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.ADD.03-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Cộng trên trục số",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_ADD_03_DATASET: SkillDataset = {
  skill_code: "C1.ADD.03",
  concept_label: "Cộng trên trục số",
  surface: "game",
  items: [
    {
      id: "n0",
      label: "không",
      glyph: "0",
      value: 0,
      image: {
        kind: "emoji",
        ref: "0️⃣",
      },
    },
    {
      id: "n1",
      label: "một",
      glyph: "1",
      value: 1,
      image: {
        kind: "emoji",
        ref: "1️⃣",
      },
    },
    {
      id: "n2",
      label: "hai",
      glyph: "2",
      value: 2,
      image: {
        kind: "emoji",
        ref: "2️⃣",
      },
    },
    {
      id: "n3",
      label: "ba",
      glyph: "3",
      value: 3,
      image: {
        kind: "emoji",
        ref: "3️⃣",
      },
    },
    {
      id: "n4",
      label: "bốn",
      glyph: "4",
      value: 4,
      image: {
        kind: "emoji",
        ref: "4️⃣",
      },
    },
    {
      id: "n5",
      label: "năm",
      glyph: "5",
      value: 5,
      image: {
        kind: "emoji",
        ref: "5️⃣",
      },
    },
    {
      id: "n6",
      label: "sáu",
      glyph: "6",
      value: 6,
      image: {
        kind: "emoji",
        ref: "6️⃣",
      },
    },
    {
      id: "n7",
      label: "bảy",
      glyph: "7",
      value: 7,
      image: {
        kind: "emoji",
        ref: "7️⃣",
      },
    },
    {
      id: "n8",
      label: "tám",
      glyph: "8",
      value: 8,
      image: {
        kind: "emoji",
        ref: "8️⃣",
      },
    },
    {
      id: "n9",
      label: "chín",
      glyph: "9",
      value: 9,
      image: {
        kind: "emoji",
        ref: "9️⃣",
      },
    },
    {
      id: "n10",
      label: "mười",
      glyph: "10",
      value: 10,
      image: {
        kind: "emoji",
        ref: "🔟",
      },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Cộng trên trục số",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Cộng trên trục số",
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
    narration_template: "Chúng mình cùng tìm hiểu về Cộng trên trục số nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["n0", "n1", "n2", "n3", "n4", "n5", "n6", "n7", "n8", "n9", "n10"],
};

export const C1_ADD_03_SEED: SkillSeed = {
  identity: C1_ADD_03_IDENTITY,
  dataset: C1_ADD_03_DATASET,
  levels: [
    {
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-008",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      template: "GT-013",
      band: "5-6",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-016",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
  ],
};
