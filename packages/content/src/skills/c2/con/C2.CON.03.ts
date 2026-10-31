import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_CON_03_IDENTITY: SkillIdentity = {
  code: "C2.CON.03",
  strand_code: "C2.CON",
  competency_code: "C2",
  name: "Ghép khối xây dựng",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["create", "plan"],
  tier: "core",
  prerequisites: ["C2.CON.01"],
  learning_objectives: [
    {
      code: "LO-C2.CON.03-01",
      behaviour: "Nhận biết và thực hành Ghép khối Lego ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.CON.03-02",
      behaviour: "Vận dụng Ghép khối Lego trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.CON.03-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Ghép khối Lego",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_CON_03_DATASET: SkillDataset = {
  skill_code: "C2.CON.03",
  concept_label: "Ghép khối xây dựng",
  surface: "game",
  items: [
    {
      id: "brick_red",
      label: "khối gạch đỏ",
      image: {
        kind: "emoji",
        ref: "🧱",
      },
      category: {
        type: "khối rời",
      },
      contrast_group: "block",
      value: 1,
      ordering: 1,
    },
    {
      id: "brick_blue",
      label: "khối hộp xanh",
      image: {
        kind: "emoji",
        ref: "🟦",
      },
      category: {
        type: "khối rời",
      },
      contrast_group: "block",
      value: 2,
      ordering: 2,
    },
    {
      id: "brick_yellow",
      label: "khối trụ vàng",
      image: {
        kind: "emoji",
        ref: "🟡",
      },
      category: {
        type: "khối rời",
      },
      contrast_group: "block",
      value: 3,
      ordering: 3,
    },
    {
      id: "brick_green",
      label: "khối ngói xanh",
      image: {
        kind: "emoji",
        ref: "🟩",
      },
      category: {
        type: "khối rời",
      },
      contrast_group: "block",
      value: 4,
      ordering: 4,
    },
    {
      id: "model_castle",
      label: "lâu đài ghép",
      image: {
        kind: "emoji",
        ref: "🏰",
      },
      category: {
        type: "mô hình",
      },
      contrast_group: "model",
      value: 5,
      ordering: 5,
    },
    {
      id: "model_tower",
      label: "ngọn tháp ghép",
      image: {
        kind: "emoji",
        ref: "🗼",
      },
      category: {
        type: "mô hình",
      },
      contrast_group: "model",
      value: 6,
      ordering: 6,
    },
    {
      id: "model_train",
      label: "tàu hỏa ghép",
      image: {
        kind: "emoji",
        ref: "🚂",
      },
      category: {
        type: "mô hình",
      },
      contrast_group: "model",
      value: 7,
      ordering: 7,
    },
    {
      id: "model_robot",
      label: "người máy ghép",
      image: {
        kind: "emoji",
        ref: "🤖",
      },
      category: {
        type: "mô hình",
      },
      contrast_group: "model",
      value: 8,
      ordering: 8,
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "brick_red",
      target_id: "model_castle",
    },
    {
      type: "pair",
      source_id: "brick_blue",
      target_id: "model_tower",
    },
    {
      type: "pair",
      source_id: "brick_yellow",
      target_id: "model_train",
    },
    {
      type: "pair",
      source_id: "brick_green",
      target_id: "model_robot",
    },
    {
      type: "contrast",
      source_id: "brick_red",
      target_id: "model_castle",
    },
  ],
  axes: {
    category: {
      values: ["khối rời", "mô hình"],
    },
    order: {
      values: ["1", "2", "3", "4", "5", "6", "7", "8"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với ghép khối xây dựng",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng ghép khối xây dựng",
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
    narration_template: "Chúng mình cùng ghép khối xây dựng thật đẹp nhé",
  },
  ordering: [
    "brick_red",
    "brick_blue",
    "brick_yellow",
    "brick_green",
    "model_castle",
    "model_tower",
    "model_train",
    "model_robot",
  ],
};

export const C2_CON_03_SEED: SkillSeed = {
  identity: C2_CON_03_IDENTITY,
  dataset: C2_CON_03_DATASET,
  levels: [
    {
      template: "GT-000",
      band: "4-5",
      difficulty: 1,
      theme: "school",
    },
    {
      code: "GL-C2-PRJ-TAP-0003",
      template: "GT-001",
      band: "3-4",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C2-PRJ-TAP-0004",
      template: "GT-001",
      band: "4-5",
      difficulty: 1,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C2-SHP-BSK-0008",
      template: "GT-003",
      band: "5-6",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C2-HOL-SLOT-0009",
      template: "GT-008",
      band: "5-6",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C2-ROB-BLD-0001",
      template: "GT-023",
      band: "4-5",
      difficulty: 1,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C2-ROB-BLD-0002",
      template: "GT-023",
      band: "4-5",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C2-ROB-BLD-0003",
      template: "GT-023",
      band: "4-5",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C2-CON-SHAD-0003",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C2-CON-SIZE-0003",
      template: "GT-009",
      band: "4-5",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C2-CON-MAZE-0003",
      template: "GT-013",
      band: "4-5",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
  ],
};
