import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_CMP_05_IDENTITY: SkillIdentity = {
  code: "C1.CMP.05",
  strand_code: "C1.CMP",
  competency_code: "C1",
  name: "Ít hơn",
  age_min: 3,
  age_max: 3,
  difficulty: 1,
  thinking_processes: ["compare", "count"],
  tier: "basic",
  prerequisites: ["C1.CNT.01"],
  learning_objectives: [
    {
      code: "LO-C1.CMP.05-01",
      behaviour: "Nhận biết và thực hành Ít hơn ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.CMP.05-02",
      behaviour: "Vận dụng Ít hơn trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.CMP.05-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Ít hơn",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_CMP_05_DATASET: SkillDataset = {
  skill_code: "C1.CMP.05",
  concept_label: "Ít hơn",
  surface: "game",
  items: [
    {
      id: "few_balloons",
      label: "hai quả bóng",
      glyph: "🎈🎈",
      value: 2,
      contrast_group: "quantity",
      ordering: 1,
      category: {
        type: "nhóm ít vật",
      },
      image: {
        kind: "emoji",
        ref: "🎈",
      },
    },
    {
      id: "few_candies",
      label: "một cái kẹo",
      glyph: "🍬",
      value: 1,
      contrast_group: "quantity",
      ordering: 2,
      category: {
        type: "nhóm ít vật",
      },
      image: {
        kind: "emoji",
        ref: "🍬",
      },
    },
    {
      id: "few_cookies",
      label: "hai chiếc bánh",
      glyph: "🍪🍪",
      value: 2,
      contrast_group: "quantity",
      ordering: 3,
      category: {
        type: "nhóm ít vật",
      },
      image: {
        kind: "emoji",
        ref: "🍪",
      },
    },
    {
      id: "few_flowers",
      label: "ba bông hoa",
      glyph: "🌸🌸🌸",
      value: 3,
      contrast_group: "quantity",
      ordering: 4,
      category: {
        type: "nhóm ít vật",
      },
      image: {
        kind: "emoji",
        ref: "🌸",
      },
    },
    {
      id: "many_balloons",
      label: "năm quả bóng",
      glyph: "🎈🎈🎈🎈🎈",
      value: 5,
      contrast_group: "quantity",
      ordering: 5,
      category: {
        type: "nhóm nhiều vật",
      },
      image: {
        kind: "emoji",
        ref: "🎈",
      },
    },
    {
      id: "many_candies",
      label: "sáu cái kẹo",
      glyph: "🍬🍬🍬🍬🍬🍬",
      value: 6,
      contrast_group: "quantity",
      ordering: 6,
      category: {
        type: "nhóm nhiều vật",
      },
      image: {
        kind: "emoji",
        ref: "🍬",
      },
    },
    {
      id: "many_cookies",
      label: "năm chiếc bánh",
      glyph: "🍪🍪🍪🍪🍪",
      value: 5,
      contrast_group: "quantity",
      ordering: 7,
      category: {
        type: "nhóm nhiều vật",
      },
      image: {
        kind: "emoji",
        ref: "🍪",
      },
    },
    {
      id: "many_flowers",
      label: "sáu bông hoa",
      glyph: "🌸🌸🌸🌸🌸🌸",
      value: 6,
      contrast_group: "quantity",
      ordering: 8,
      category: {
        type: "nhóm nhiều vật",
      },
      image: {
        kind: "emoji",
        ref: "🌸",
      },
    },
    // --- Ngữ liệu WB06: Giỏ quả & chim ít hơn ---
    {
      id: "wb06_sparrow_single",
      label: "một chú chim sẻ",
      glyph: "🐦",
      value: 1,
      contrast_group: "valley_birds",
      ordering: 9,
      image: { kind: "emoji", ref: "🐦" },
      category: { type: "chim đơn lẻ" },
    },
    {
      id: "wb06_strawberry_one",
      label: "một quả dâu tây",
      glyph: "🍓",
      value: 1,
      contrast_group: "fruit_baskets",
      ordering: 10,
      image: { kind: "emoji", ref: "🍓" },
      category: { type: "giỏ ít quả" },
    },
    {
      id: "wb06_apple_basket_2",
      label: "hai quả táo đỏ",
      glyph: "🍎🍎",
      value: 2,
      contrast_group: "fruit_baskets",
      ordering: 11,
      image: { kind: "emoji", ref: "🍎" },
      category: { type: "giỏ ít quả" },
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "few_balloons",
      target_id: "many_balloons",
    },
    {
      type: "contrast",
      source_id: "few_candies",
      target_id: "many_candies",
    },
    {
      type: "contrast",
      source_id: "few_cookies",
      target_id: "many_cookies",
    },
    {
      type: "contrast",
      source_id: "few_flowers",
      target_id: "many_flowers",
    },
    {
      type: "contrast",
      source_id: "wb06_sparrow_single",
      target_id: "many_balloons",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với ít hơn",
      representation: "discrete-object",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng theo yêu cầu ít hơn",
      representation: "discrete-object",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt theo yêu cầu ít hơn với phương án nhiễu",
      representation: "ten-frame",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi so sánh ít hơn",
      representation: "ten-frame",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục so sánh ít hơn và tự làm một mình",
      representation: "ten-frame",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn {label} nhé!",
    narration_template: "Chúng mình cùng tìm nhóm ít hơn nhé",
  },
  ordering: [
    "few_balloons",
    "few_candies",
    "few_cookies",
    "few_flowers",
    "many_balloons",
    "many_candies",
    "many_cookies",
    "many_flowers",
    "wb06_sparrow_single",
    "wb06_strawberry_one",
    "wb06_apple_basket_2",
  ],
};

export const C1_CMP_05_SEED: SkillSeed = {
  identity: C1_CMP_05_IDENTITY,
  dataset: C1_CMP_05_DATASET,
  levels: [
    {
      code: "GL-C1-CMP-CARD-0116",
      template: "GT-012",
      band: "3-4",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
      montessori_ref: "WB06-D1",
    },
    {
      code: "GL-C1-QNT-TAP-0002",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-TAP-0019",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    // --- Bổ sung Montessori WB06 ---
    {
      code: "GL-C1-CMP-TAP-0152",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      access_tier: "free",
      theme: "food",
      rounds: 3,
      montessori_ref: "WB06-D1",
    },
    {
      code: "GL-C1-CMP-BAL-0153",
      template: "GT-014",
      band: "5-6",
      difficulty: 2,
      access_tier: "login",
      theme: "food",
      rounds: 3,
      montessori_ref: "WB06-D1",
    },
  ],
};
