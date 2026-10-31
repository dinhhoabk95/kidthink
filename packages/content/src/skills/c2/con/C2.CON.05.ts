import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_CON_05_IDENTITY: SkillIdentity = {
  code: "C2.CON.05",
  strand_code: "C2.CON",
  competency_code: "C2",
  name: "Xếp khối theo mẫu",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["observe", "create"],
  tier: "advanced",
  prerequisites: ["C2.CON.01", "C1.PAT.09"],
  learning_objectives: [
    {
      code: "LO-C2.CON.05-01",
      behaviour:
        "Nhận biết và thực hành Block Pattern — sao chép cấu trúc ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.CON.05-02",
      behaviour:
        "Vận dụng Block Pattern — sao chép cấu trúc trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.CON.05-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Block Pattern — sao chép cấu trúc",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_CON_05_DATASET: SkillDataset = {
  skill_code: "C2.CON.05",
  concept_label: "Xếp khối theo mẫu",
  surface: "game",
  items: [
    {
      id: "block_cube",
      label: "khối lập phương",
      image: {
        kind: "emoji",
        ref: "🧊",
      },
      category: {
        type: "khối mẫu",
      },
      contrast_group: "block",
      value: 1,
      ordering: 1,
    },
    {
      id: "block_brick",
      label: "khối gạch chữ nhật",
      image: {
        kind: "emoji",
        ref: "🧱",
      },
      category: {
        type: "khối mẫu",
      },
      contrast_group: "block",
      value: 2,
      ordering: 2,
    },
    {
      id: "block_cylinder",
      label: "khối trụ tròn",
      image: {
        kind: "emoji",
        ref: "🥫",
      },
      category: {
        type: "khối mẫu",
      },
      contrast_group: "block",
      value: 3,
      ordering: 3,
    },
    {
      id: "block_beam",
      label: "thanh dầm gỗ",
      image: {
        kind: "emoji",
        ref: "🪵",
      },
      category: {
        type: "khối mẫu",
      },
      contrast_group: "block",
      value: 4,
      ordering: 4,
    },
    {
      id: "pattern_house",
      label: "mô hình nhà mái ngói",
      image: {
        kind: "emoji",
        ref: "🏡",
      },
      category: {
        type: "hình mẫu",
      },
      contrast_group: "model",
      value: 5,
      ordering: 5,
    },
    {
      id: "pattern_tower",
      label: "mô hình tháp canh",
      image: {
        kind: "emoji",
        ref: "🗼",
      },
      category: {
        type: "hình mẫu",
      },
      contrast_group: "model",
      value: 6,
      ordering: 6,
    },
    {
      id: "pattern_castle",
      label: "mô hình lâu đài đá",
      image: {
        kind: "emoji",
        ref: "🏰",
      },
      category: {
        type: "hình mẫu",
      },
      contrast_group: "model",
      value: 7,
      ordering: 7,
    },
    {
      id: "pattern_bridge",
      label: "mô hình cầu vòm",
      image: {
        kind: "emoji",
        ref: "🌉",
      },
      category: {
        type: "hình mẫu",
      },
      contrast_group: "model",
      value: 8,
      ordering: 8,
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "block_cube",
      target_id: "pattern_house",
    },
    {
      type: "pair",
      source_id: "block_brick",
      target_id: "pattern_tower",
    },
    {
      type: "pair",
      source_id: "block_cylinder",
      target_id: "pattern_castle",
    },
    {
      type: "pair",
      source_id: "block_beam",
      target_id: "pattern_bridge",
    },
    {
      type: "contrast",
      source_id: "block_cube",
      target_id: "pattern_house",
    },
  ],
  axes: {
    category: {
      values: ["khối mẫu", "hình mẫu"],
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
      description: "Làm quen cơ bản với xếp khối theo mẫu",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng xếp khối theo mẫu",
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
    narration_template: "Chúng mình cùng xếp khối theo mẫu thật đẹp nhé",
  },
  ordering: [
    "block_cube",
    "block_brick",
    "block_cylinder",
    "block_beam",
    "pattern_house",
    "pattern_tower",
    "pattern_castle",
    "pattern_bridge",
  ],
};

export const C2_CON_05_SEED: SkillSeed = {
  identity: C2_CON_05_IDENTITY,
  dataset: C2_CON_05_DATASET,
  levels: [
    {
      code: "GL-C2-ROB-BLD-0006",
      template: "GT-023",
      band: "5-6",
      difficulty: 3,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C2-ROB-BLD-0007",
      template: "GT-023",
      band: "5-6",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C2-CON-TAP-0003",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "family",
      rounds: 3,
    },
  ],
};
