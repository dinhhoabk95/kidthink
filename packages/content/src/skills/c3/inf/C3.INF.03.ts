import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C3_INF_03_IDENTITY: SkillIdentity = {
  code: "C3.INF.03",
  strand_code: "C3.INF",
  competency_code: "C3",
  name: "Đoán nguyên nhân",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["infer", "deduce"],
  tier: "advanced",
  prerequisites: ["C3.INF.02"],
  learning_objectives: [
    {
      code: "LO-C3.INF.03-01",
      behaviour: "Nhận biết và thực hành Đoán nguyên nhân ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C3.INF.03-02",
      behaviour: "Vận dụng Đoán nguyên nhân trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C3.INF.03-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Đoán nguyên nhân",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C3_INF_03_DATASET: SkillDataset = {
  skill_code: "C3.INF.03",
  concept_label: "Đoán nguyên nhân",
  surface: "game",
  items: [
    {
      id: "clean_hands",
      label: "đôi tay thơm sạch",
      image: {
        kind: "emoji",
        ref: "✨",
      },
      category: {
        type: "hiện tượng",
        color: "yellow",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "effect",
      value: 1,
      ordering: 1,
    },
    {
      id: "soap_bar",
      label: "rửa bằng xà phòng",
      image: {
        kind: "emoji",
        ref: "🧼",
      },
      category: {
        type: "nguyên nhân",
        color: "blue",
        shape: "square",
        size: "small",
      },
      contrast_group: "cause",
      value: 2,
      ordering: 2,
    },
    {
      id: "sweet_honey",
      label: "hũ mật ong đầy",
      image: {
        kind: "emoji",
        ref: "🍯",
      },
      category: {
        type: "hiện tượng",
        color: "yellow",
        shape: "square",
        size: "medium",
      },
      contrast_group: "effect",
      value: 3,
      ordering: 3,
    },
    {
      id: "busy_bee",
      label: "ong vàng chăm chỉ",
      image: {
        kind: "emoji",
        ref: "🐝",
      },
      category: {
        type: "nguyên nhân",
        color: "yellow",
        shape: "circle",
        size: "small",
      },
      contrast_group: "cause",
      value: 4,
      ordering: 4,
    },
    {
      id: "bright_lamp",
      label: "phòng sáng trưng",
      image: {
        kind: "emoji",
        ref: "💡",
      },
      category: {
        type: "hiện tượng",
        color: "yellow",
        shape: "circle",
        size: "small",
      },
      contrast_group: "effect",
      value: 5,
      ordering: 5,
    },
    {
      id: "flashlight",
      label: "bật đèn chiếu sáng",
      image: {
        kind: "emoji",
        ref: "🔦",
      },
      category: {
        type: "nguyên nhân",
        color: "red",
        shape: "rectangle",
        size: "medium",
      },
      contrast_group: "cause",
      value: 6,
      ordering: 6,
    },
    {
      id: "snowman",
      label: "người tuyết trắng xóa",
      image: {
        kind: "emoji",
        ref: "⛄",
      },
      category: {
        type: "hiện tượng",
        color: "white",
        shape: "circle",
        size: "large",
      },
      contrast_group: "effect",
      value: 7,
      ordering: 7,
    },
    {
      id: "snowflake",
      label: "tuyết rơi mùa đông",
      image: {
        kind: "emoji",
        ref: "❄️",
      },
      category: {
        type: "nguyên nhân",
        color: "blue",
        shape: "circle",
        size: "small",
      },
      contrast_group: "cause",
      value: 8,
      ordering: 8,
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "clean_hands",
      target_id: "soap_bar",
      explanation: "tay sạch là nhờ rửa bằng xà phòng",
      metadata: { reason: "cause_effect" },
    },
    {
      type: "pair",
      source_id: "sweet_honey",
      target_id: "busy_bee",
      explanation: "có mật ngọt là nhờ ong chăm chỉ",
      metadata: { reason: "cause_effect" },
    },
    {
      type: "pair",
      source_id: "bright_lamp",
      target_id: "flashlight",
      explanation: "phòng sáng là nhờ bật đèn chiếu sáng",
      metadata: { reason: "cause_effect" },
    },
    {
      type: "pair",
      source_id: "snowman",
      target_id: "snowflake",
      explanation: "có người tuyết là nhờ tuyết rơi mùa đông",
      metadata: { reason: "cause_effect" },
    },
  ],
  axes: {
    type: ["hiện tượng", "nguyên nhân"],
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với đoán nguyên nhân",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng đoán nguyên nhân",
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
    narration_template: "Chúng mình cùng tìm nguyên nhân tạo ra sự việc nhé",
  },
  ordering: [
    "clean_hands",
    "soap_bar",
    "sweet_honey",
    "busy_bee",
    "bright_lamp",
    "flashlight",
    "snowman",
    "snowflake",
  ],
};

export const C3_INF_03_SEED: SkillSeed = {
  identity: C3_INF_03_IDENTITY,
  dataset: C3_INF_03_DATASET,
  levels: [
    {
      template: "GT-000",
      band: "5-6",
      difficulty: 1,
      theme: "school",
    },
    {
      code: "GL-C3-CAU-PAIR-0004",
      template: "GT-005",
      band: "4-5",
      difficulty: 1,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C4-PIC-SLOT-0009",
      template: "GT-008",
      band: "5-6",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C4-PIC-SLOT-0010",
      template: "GT-008",
      band: "5-6",
      difficulty: 1,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C3-INF-SORT-0003",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C3-INF-SORT-0004",
      template: "GT-006",
      band: "5-6",
      difficulty: 4,
      theme: "festival",
      rounds: 3,
    },
    {
      template: "GT-005",
      band: "5-6",
      difficulty: 1,
      theme: "school",
    },
    {
      template: "GT-005",
      band: "5-6",
      difficulty: 2,
      theme: "home",
    },
  ],
};
