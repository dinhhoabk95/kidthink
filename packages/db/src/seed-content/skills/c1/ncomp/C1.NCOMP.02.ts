import type { SkillDataset, SkillSeed } from "@mindkid/shared";

export const C1_NCOMP_02_DATASET: SkillDataset = {
  skill_code: "C1.NCOMP.02",
  concept_label: "Tách số 3",
  surface: "worksheet",
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
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Tách số 3",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Tách số 3",
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
    narration_template: "Chúng mình cùng tìm hiểu về Tách số 3 nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["n0", "n1", "n2", "n3", "n4", "n5"],
};

export const C1_NCOMP_02_SEED: SkillSeed = {
  dataset: C1_NCOMP_02_DATASET,
  levels: [],
};
