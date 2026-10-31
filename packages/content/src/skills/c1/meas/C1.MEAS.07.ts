import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_MEAS_07_IDENTITY: SkillIdentity = {
  code: "C1.MEAS.07",
  strand_code: "C1.MEAS",
  competency_code: "C1",
  name: "Cân bằng",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["compare", "verify"],
  tier: "core",
  prerequisites: ["C1.MEAS.03"],
  learning_objectives: [
    {
      code: "LO-C1.MEAS.07-01",
      behaviour: "Nhận biết và thực hành Cân bằng ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.MEAS.07-02",
      behaviour: "Vận dụng Cân bằng trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.MEAS.07-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Cân bằng",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_MEAS_07_DATASET: SkillDataset = {
  skill_code: "C1.MEAS.07",
  concept_label: "Cân bằng",
  surface: "game",
  items: [
    {
      id: "meas07-i1",
      label: "quả dâu nhẹ",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🍓",
      },
      ordering: 1,
      contrast_group: "weight_light",
      category: {
        type: "vật nhẹ cân",
        balance: "nhẹ",
      },
    },
    {
      id: "meas07-i2",
      label: "quả táo vừa",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🍎",
      },
      ordering: 2,
      contrast_group: "weight_medium",
      category: {
        type: "vật cân bằng",
        balance: "cân bằng",
      },
    },
    {
      id: "meas07-i3",
      label: "quả cam vừa",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🍊",
      },
      ordering: 3,
      contrast_group: "weight_medium",
      category: {
        type: "vật cân bằng",
        balance: "cân bằng",
      },
    },
    {
      id: "meas07-i4",
      label: "quả dưa nặng",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🍉",
      },
      ordering: 4,
      contrast_group: "weight_heavy",
      category: {
        type: "vật nặng cân",
        balance: "nặng",
      },
    },
    {
      id: "meas07-i5",
      label: "quả bí nặng",
      value: 5,
      image: {
        kind: "emoji",
        ref: "🎃",
      },
      ordering: 5,
      contrast_group: "weight_heavy",
      category: {
        type: "vật nặng cân",
        balance: "nặng",
      },
    },
    {
      id: "meas07-i6",
      label: "tảng đá nặng",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🪨",
      },
      ordering: 6,
      contrast_group: "weight_heavy",
      category: {
        type: "vật nặng cân",
        balance: "nặng",
      },
    },
    {
      id: "ws16-watermelon",
      label: "quả dưa hấu nặng",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🍉",
      },
      ordering: 7,
      contrast_group: "fruit_weight",
      category: {
        type: "trái cây",
        weight_tier: "heavy",
        balance: "nặng",
      },
    },
    {
      id: "ws16-pineapple",
      label: "quả dứa thơm",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🍍",
      },
      ordering: 8,
      contrast_group: "fruit_weight",
      category: {
        type: "trái cây",
        weight_tier: "heavy",
        balance: "nặng",
      },
    },
    {
      id: "ws16-pear",
      label: "quả lê xanh",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🍐",
      },
      ordering: 9,
      contrast_group: "fruit_weight",
      category: {
        type: "trái cây",
        weight_tier: "medium",
        balance: "cân bằng",
      },
    },
    {
      id: "ws16-lemon",
      label: "quả chanh vàng",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🍋",
      },
      ordering: 10,
      contrast_group: "fruit_weight",
      category: {
        type: "trái cây",
        weight_tier: "light",
        balance: "nhẹ",
      },
    },
    {
      id: "ws16-gear-gold",
      label: "bánh răng vàng",
      value: 5,
      image: {
        kind: "emoji",
        ref: "⚙️",
      },
      ordering: 11,
      contrast_group: "mechanic_parts",
      category: {
        type: "linh kiện",
        weight_tier: "heavy",
        balance: "nặng",
      },
    },
    {
      id: "ws16-bolt-metal",
      label: "đinh ốc bu-lông",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🔩",
      },
      ordering: 12,
      contrast_group: "mechanic_parts",
      category: {
        type: "linh kiện",
        weight_tier: "light",
        balance: "nhẹ",
      },
    },
    {
      id: "ws16-weight-2kg",
      label: "quả cân hai ký",
      value: 2,
      image: {
        kind: "emoji",
        ref: "⚖️",
      },
      ordering: 13,
      contrast_group: "iron_weights",
      category: {
        type: "quả cân",
        weight_tier: "light",
        balance: "nhẹ",
      },
    },
    {
      id: "ws16-weight-3kg",
      label: "quả cân ba ký",
      value: 3,
      image: {
        kind: "emoji",
        ref: "⚖️",
      },
      ordering: 14,
      contrast_group: "iron_weights",
      category: {
        type: "quả cân",
        weight_tier: "medium",
        balance: "cân bằng",
      },
    },
    {
      id: "ws16-weight-5kg",
      label: "quả cân năm ký",
      value: 5,
      image: {
        kind: "emoji",
        ref: "⚖️",
      },
      ordering: 15,
      contrast_group: "iron_weights",
      category: {
        type: "quả cân",
        weight_tier: "heavy",
        balance: "nặng",
      },
    },
    {
      id: "ws16-weight-10kg",
      label: "quả cân mười ký",
      value: 10,
      image: {
        kind: "emoji",
        ref: "⚖️",
      },
      ordering: 16,
      contrast_group: "iron_weights",
      category: {
        type: "quả cân",
        weight_tier: "heavy",
        balance: "nặng",
      },
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "meas07-i2",
      target_id: "meas07-i3",
      metadata: {
        dimension: "balance",
      },
    },
    {
      type: "contrast",
      source_id: "meas07-i1",
      target_id: "meas07-i4",
      metadata: {
        dimension: "weight",
      },
    },
    {
      type: "contrast",
      source_id: "meas07-i5",
      target_id: "meas07-i6",
      metadata: {
        dimension: "weight",
      },
    },
    {
      type: "contrast",
      source_id: "ws16-lemon",
      target_id: "ws16-watermelon",
      metadata: {
        dimension: "weight",
      },
    },
    {
      type: "contrast",
      source_id: "ws16-bolt-metal",
      target_id: "ws16-gear-gold",
      metadata: {
        dimension: "weight",
      },
    },
    {
      type: "contrast",
      source_id: "ws16-weight-2kg",
      target_id: "ws16-weight-5kg",
      metadata: {
        dimension: "weight",
      },
    },
    {
      type: "contrast",
      source_id: "ws16-pear",
      target_id: "ws16-pineapple",
      metadata: {
        dimension: "contrast",
      },
    },
  ],
  axes: {
    balance: {
      values: ["nhẹ", "cân bằng", "nặng"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với cân bằng",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng cân bằng",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt cân bằng với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi cân bằng",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục cân bằng và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn {label} nhé!",
    narration_template: "Chúng mình cùng tìm hiểu về Cân bằng nhé",
  },
  ordering: [
    "meas07-i1",
    "meas07-i2",
    "meas07-i3",
    "meas07-i4",
    "meas07-i5",
    "meas07-i6",
    "ws16-watermelon",
    "ws16-pineapple",
    "ws16-pear",
    "ws16-lemon",
    "ws16-gear-gold",
    "ws16-bolt-metal",
    "ws16-weight-2kg",
    "ws16-weight-3kg",
    "ws16-weight-5kg",
    "ws16-weight-10kg",
  ],
};

export const C1_MEAS_07_SEED: SkillSeed = {
  identity: C1_MEAS_07_IDENTITY,
  dataset: C1_MEAS_07_DATASET,
  levels: [
    {
      code: "GL-C1-MEAS-SCALE-0243",
      template: "GT-014",
      band: "5-6",
      difficulty: 1,
      access_tier: "free",
      theme: "school",
      rounds: 3,
      montessori_ref: "WB16-D1",
    },
    {
      code: "GL-C1-MEAS-SCALE-0244",
      template: "GT-014",
      band: "5-6",
      difficulty: 2,
      access_tier: "login",
      theme: "school",
      rounds: 3,
      montessori_ref: "WB16-D2",
    },
    {
      code: "GL-C1-MEAS-SCALE-0245",
      template: "GT-014",
      band: "5-6",
      difficulty: 3,
      access_tier: "standard",
      theme: "market",
      rounds: 3,
      montessori_ref: "WB16-D2",
    },
    {
      code: "GL-C1-MEAS-SLOT-0246",
      template: "GT-008",
      band: "5-6",
      difficulty: 3,
      access_tier: "standard",
      theme: "market",
      rounds: 3,
      montessori_ref: "WB16-D2",
    },
    {
      code: "GL-C1-MEAS-SCALE-0001",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-SCALE-0002",
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-TAP-0024",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
  ],
};
