import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C3_DED_01_IDENTITY: SkillIdentity = {
  code: "C3.DED.01",
  strand_code: "C3.DED",
  competency_code: "C3",
  name: "Loại trừ để tìm đáp án",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["deduce"],
  tier: "advanced",
  prerequisites: ["C3.CLS.06"],
  learning_objectives: [
    {
      code: "LO-C3.DED.01-01",
      behaviour: "Nhận biết và thực hành Loại trừ để tìm đáp án ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C3.DED.01-02",
      behaviour: "Vận dụng Loại trừ để tìm đáp án trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C3.DED.01-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Loại trừ để tìm đáp án",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C3_DED_01_DATASET: SkillDataset = {
  skill_code: "C3.DED.01",
  concept_label: "Loại trừ để tìm đáp án",
  surface: "game",
  items: [
    {
      id: "sparrow",
      label: "chim sẻ nâu",
      image: {
        kind: "emoji",
        ref: "🐦",
      },
      category: {
        type: "chim muông",
        color: "yellow",
        shape: "circle",
        size: "small",
      },
      contrast_group: "birds",
      value: 1,
      ordering: 1,
    },
    {
      id: "parrot",
      label: "chú vẹt xanh",
      image: {
        kind: "emoji",
        ref: "🦜",
      },
      category: {
        type: "chim muông",
        color: "green",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "birds",
      value: 2,
      ordering: 2,
    },
    {
      id: "owl",
      label: "cú mèo nhỏ",
      image: {
        kind: "emoji",
        ref: "🦉",
      },
      category: {
        type: "chim muông",
        color: "yellow",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "birds",
      value: 3,
      ordering: 3,
    },
    {
      id: "duck",
      label: "chú vịt nhỏ",
      image: {
        kind: "emoji",
        ref: "🦆",
      },
      category: {
        type: "chim muông",
        color: "yellow",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "birds",
      value: 4,
      ordering: 4,
    },
    {
      id: "apple",
      label: "quả táo đỏ",
      image: {
        kind: "emoji",
        ref: "🍎",
      },
      category: {
        type: "hoa quả ngọt",
        color: "red",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "fruits",
      value: 5,
      ordering: 5,
    },
    {
      id: "banana",
      label: "quả chuối vàng",
      image: {
        kind: "emoji",
        ref: "🍌",
      },
      category: {
        type: "hoa quả ngọt",
        color: "yellow",
        shape: "rectangle",
        size: "medium",
      },
      contrast_group: "fruits",
      value: 6,
      ordering: 6,
    },
    {
      id: "grape",
      label: "chùm nho tím",
      image: {
        kind: "emoji",
        ref: "🍇",
      },
      category: {
        type: "hoa quả ngọt",
        color: "purple",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "fruits",
      value: 7,
      ordering: 7,
    },
    {
      id: "orange",
      label: "quả cam ngọt",
      image: {
        kind: "emoji",
        ref: "🍊",
      },
      category: {
        type: "hoa quả ngọt",
        color: "yellow",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "fruits",
      value: 8,
      ordering: 8,
    },
    {
      id: "mag_glass",
      label: "kính lúp thám tử",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🔍",
      },
    },
    {
      id: "gold_key",
      label: "chìa khóa vàng",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🗝️",
      },
    },
    {
      id: "secret_map",
      label: "bản đồ thung lũng",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🗺️",
      },
    },
    {
      id: "stone_door",
      label: "cánh cổng vòm đá",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🚪",
      },
    },
    {
      id: "treasure_chest",
      label: "rương kho báu",
      value: 5,
      image: {
        kind: "emoji",
        ref: "📦",
      },
    },
    {
      id: "blue_gem",
      label: "viên ngọc xanh lục",
      value: 6,
      image: {
        kind: "emoji",
        ref: "💎",
      },
    },
    {
      id: "pin_note",
      label: "thẻ giấy ghim gỗ",
      value: 7,
      image: {
        kind: "emoji",
        ref: "📌",
      },
    },
    {
      id: "star_badge",
      label: "huy hiệu thám tử",
      value: 8,
      image: {
        kind: "emoji",
        ref: "⭐",
      },
    },
    {
      id: "lock_padlock",
      label: "ổ khóa đồng cổ",
      value: 9,
      image: {
        kind: "emoji",
        ref: "🔒",
      },
    },
    {
      id: "spark_lamp",
      label: "đèn lồng phát sáng",
      value: 10,
      image: {
        kind: "emoji",
        ref: "🏮",
      },
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "sparrow",
      target_id: "apple",
      explanation: "chim sẻ biết bay khác quả táo ngọt",
    },
    {
      type: "contrast",
      source_id: "parrot",
      target_id: "banana",
      explanation: "chú vẹt biết bay khác quả chuối vàng",
    },
    {
      type: "contrast",
      source_id: "owl",
      target_id: "grape",
      explanation: "cú mèo biết bay khác chùm nho tím",
    },
    {
      type: "contrast",
      source_id: "duck",
      target_id: "orange",
      explanation: "chú vịt biết bơi khác quả cam ngọt",
    },
  ],
  axes: {
    type: ["chim muông", "hoa quả ngọt"],
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với loại trừ để tìm đáp án",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng loại trừ để tìm đáp án",
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
    narration_template: "Chúng mình cùng quan sát để tìm ra đáp án đúng nhé",
  },
  ordering: [
    "sparrow",
    "parrot",
    "owl",
    "duck",
    "apple",
    "banana",
    "grape",
    "orange",
    "mag_glass",
    "gold_key",
    "secret_map",
    "stone_door",
    "treasure_chest",
    "blue_gem",
    "pin_note",
    "star_badge",
    "lock_padlock",
    "spark_lamp",
  ],
};

export const C3_DED_01_SEED: SkillSeed = {
  identity: C3_DED_01_IDENTITY,
  dataset: C3_DED_01_DATASET,
  levels: [
    {
      code: "GL-C3-LOG-POS-0011",
      template: "GT-022",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C3-LOG-POS-0017",
      template: "GT-022",
      band: "5-6",
      difficulty: 4,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C3-SUD-MIN-0027",
      template: "GT-015",
      band: "5-6",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C3-SUD-MIN-0028",
      template: "GT-015",
      band: "5-6",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C3-SUD-MIN-0029",
      template: "GT-015",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C3-DED-CLUE-0201",
      template: "GT-009",
      band: "4-5",
      difficulty: 2,
      access_tier: "login",
      theme: "job",
      rounds: 3,
      montessori_ref: "WB14-D1",
    },
    {
      code: "GL-C3-DED-TAP-0202",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      access_tier: "login",
      theme: "job",
      rounds: 3,
      montessori_ref: "WB14-D2",
    },
    {
      code: "GL-C3-DED-SLOT-0203",
      template: "GT-008",
      band: "4-5",
      difficulty: 3,
      access_tier: "standard",
      theme: "job",
      rounds: 3,
      montessori_ref: "WB14-D3",
    },
  ],
};
