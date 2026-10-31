import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_ORI_10_IDENTITY: SkillIdentity = {
  code: "C2.ORI.10",
  strand_code: "C2.ORI",
  competency_code: "C2",
  name: "Góc",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["observe"],
  tier: "core",
  prerequisites: ["C2.ORI.01", "C2.ORI.03"],
  learning_objectives: [
    {
      code: "LO-C2.ORI.10-01",
      behaviour: "Nhận biết và thực hành Góc ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.ORI.10-02",
      behaviour: "Vận dụng Góc trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.ORI.10-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Góc",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_ORI_10_DATASET: SkillDataset = {
  skill_code: "C2.ORI.10",
  concept_label: "Góc",
  surface: "game",
  items: [
    {
      id: "brick_corner",
      label: "viên gạch ở góc",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🧱",
      },
      category: {
        type: "ở trong góc",
      },
      contrast_group: "corner",
    },
    {
      id: "flag_corner",
      label: "chiếc cờ cắm ở góc",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🚩",
      },
      category: {
        type: "ở trong góc",
      },
      contrast_group: "corner",
    },
    {
      id: "plant_corner",
      label: "chậu cây đặt trong góc",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🪴",
      },
      category: {
        type: "ở trong góc",
      },
      contrast_group: "corner",
    },
    {
      id: "web_corner",
      label: "mạng nhện giăng góc nhà",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🕸️",
      },
      category: {
        type: "ở trong góc",
      },
      contrast_group: "corner",
    },
    {
      id: "table_center",
      label: "bàn tròn ở trung tâm",
      value: 5,
      image: {
        kind: "emoji",
        ref: "🛋️",
      },
      category: {
        type: "ở trung tâm",
      },
      contrast_group: "center",
    },
    {
      id: "rug_center",
      label: "tấm thảm giữa phòng",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🧶",
      },
      category: {
        type: "ở trung tâm",
      },
      contrast_group: "center",
    },
    {
      id: "lamp_center",
      label: "ngọn đèn giữa trần",
      value: 7,
      image: {
        kind: "emoji",
        ref: "💡",
      },
      category: {
        type: "ở trung tâm",
      },
      contrast_group: "center",
    },
    {
      id: "tulip_center",
      label: "hoa tu-líp tươi",
      value: 8,
      image: {
        kind: "emoji",
        ref: "🌷",
      },
      category: {
        type: "ở trung tâm",
      },
      contrast_group: "center",
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "brick_corner",
      target_id: "table_center",
      metadata: {
        dimension: "corner_position",
      },
    },
    {
      type: "contrast",
      source_id: "flag_corner",
      target_id: "lamp_center",
      metadata: {
        dimension: "corner_position",
      },
    },
    {
      type: "pair",
      source_id: "brick_corner",
      target_id: "plant_corner",
      metadata: {
        relation: "cùng ở trong góc",
      },
    },
    {
      type: "pair",
      source_id: "table_center",
      target_id: "rug_center",
      metadata: {
        relation: "cùng ở trung tâm",
      },
    },
  ],
  axes: {
    corner_position: {
      values: ["ở trong góc", "ở trung tâm"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Góc",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Góc",
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
    narration_template: "Chúng mình cùng tìm hiểu về Góc nhé",
  },
  ordering: [
    "brick_corner",
    "flag_corner",
    "plant_corner",
    "web_corner",
    "table_center",
    "rug_center",
    "lamp_center",
    "tulip_center",
  ],
};

export const C2_ORI_10_SEED: SkillSeed = {
  identity: C2_ORI_10_IDENTITY,
  dataset: C2_ORI_10_DATASET,
  levels: [
    {
      code: "GL-C2-ORI-TAP-0017",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C2-ORI-TAP-0018",
      template: "GT-001",
      band: "3-4",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C2-ORI-TCNT-0003",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
  ],
};
