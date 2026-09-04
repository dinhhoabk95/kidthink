import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_CNT_07_IDENTITY: SkillIdentity = {
  code: "C1.CNT.07",
  strand_code: "C1.CNT",
  competency_code: "C1",
  name: "Đếm từ điểm bất kỳ",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["count"],
  tier: "core",
  prerequisites: ["C1.CNT.01", "C1.NREC.09"],
  learning_objectives: [
    {
      code: "LO-C1.CNT.07-01",
      behaviour: "Nhận biết và thực hành Đếm từ điểm bất kỳ ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.CNT.07-02",
      behaviour: "Vận dụng Đếm từ điểm bất kỳ trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.CNT.07-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Đếm từ điểm bất kỳ",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_CNT_07_DATASET: SkillDataset = {
  skill_code: "C1.CNT.07",
  concept_label: "Đếm từ điểm bất kỳ",
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
      description: "Làm quen cơ bản với Đếm từ điểm bất kỳ",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Đếm từ điểm bất kỳ",
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
    narration_template: "Chúng mình cùng tìm hiểu về Đếm từ điểm bất kỳ nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["n0", "n1", "n2", "n3", "n4", "n5", "n6", "n7", "n8", "n9", "n10"],
};

export const C1_CNT_07_SEED: SkillSeed = {
  identity: C1_CNT_07_IDENTITY,
  dataset: C1_CNT_07_DATASET,
  levels: [
    {
      code: "GL-C1-CNT-STEP-0007",
      template: "GT-001",
      band: "5-6",
      difficulty: 2,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C1-CNT-STEP-0017",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C1-TIM-ORD-0001",
      template: "GT-006",
      band: "5-6",
      difficulty: 1,
      theme: "school",
      rounds: 3,
      legacy_v1_ref: "D5-07",
    },
    {
      code: "GL-C1-TIM-ORD-0002",
      template: "GT-006",
      band: "5-6",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
      legacy_v1_ref: "D5-07",
    },
    {
      code: "GL-C1-TIM-ORD-0003",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "food",
      rounds: 3,
      legacy_v1_ref: "D5-07",
    },
    {
      code: "GL-C1-TIM-ORD-0004",
      template: "GT-006",
      band: "5-6",
      difficulty: 1,
      theme: "animal",
      rounds: 3,
      legacy_v1_ref: "D5-07",
    },
  ],
};
