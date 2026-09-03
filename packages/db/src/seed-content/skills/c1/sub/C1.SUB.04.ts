import type { SkillDataset, SkillSeed } from "@mindkid/shared";

export const C1_SUB_04_DATASET: SkillDataset = {
  skill_code: "C1.SUB.04",
  concept_label: "Trừ trong phạm vi 10",
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
    {
      id: "n11",
      label: "mười một",
      glyph: "11",
      value: 11,
      image: {
        kind: "emoji",
        ref: "1️⃣",
      },
    },
    {
      id: "n12",
      label: "mười hai",
      glyph: "12",
      value: 12,
      image: {
        kind: "emoji",
        ref: "2️⃣",
      },
    },
    {
      id: "n13",
      label: "mười ba",
      glyph: "13",
      value: 13,
      image: {
        kind: "emoji",
        ref: "3️⃣",
      },
    },
    {
      id: "n14",
      label: "mười bốn",
      glyph: "14",
      value: 14,
      image: {
        kind: "emoji",
        ref: "4️⃣",
      },
    },
    {
      id: "n15",
      label: "mười lăm",
      glyph: "15",
      value: 15,
      image: {
        kind: "emoji",
        ref: "5️⃣",
      },
    },
    {
      id: "n16",
      label: "mười sáu",
      glyph: "16",
      value: 16,
      image: {
        kind: "emoji",
        ref: "6️⃣",
      },
    },
    {
      id: "n17",
      label: "mười bảy",
      glyph: "17",
      value: 17,
      image: {
        kind: "emoji",
        ref: "7️⃣",
      },
    },
    {
      id: "n18",
      label: "mười tám",
      glyph: "18",
      value: 18,
      image: {
        kind: "emoji",
        ref: "8️⃣",
      },
    },
    {
      id: "n19",
      label: "mười chín",
      glyph: "19",
      value: 19,
      image: {
        kind: "emoji",
        ref: "9️⃣",
      },
    },
    {
      id: "n20",
      label: "hai mươi",
      glyph: "20",
      value: 20,
      image: {
        kind: "emoji",
        ref: "2️⃣",
      },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Trừ trong phạm vi 10",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Trừ trong phạm vi 10",
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
    narration_template: "Chúng mình cùng tìm hiểu về Trừ trong phạm vi 10 nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: [
    "n0",
    "n1",
    "n2",
    "n3",
    "n4",
    "n5",
    "n6",
    "n7",
    "n8",
    "n9",
    "n10",
    "n11",
    "n12",
    "n13",
    "n14",
    "n15",
    "n16",
    "n17",
    "n18",
    "n19",
    "n20",
  ],
};

export const C1_SUB_04_SEED: SkillSeed = {
  dataset: C1_SUB_04_DATASET,
  levels: [
    {
      template: "GT-031",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
  ],
};
