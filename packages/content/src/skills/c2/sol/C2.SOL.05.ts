import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_SOL_05_IDENTITY: SkillIdentity = {
  code: "C2.SOL.05",
  strand_code: "C2.SOL",
  competency_code: "C2",
  name: "Khối chữ nhật",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["observe", "compare"],
  tier: "core",
  prerequisites: ["C2.SOL.04", "C2.GEO.04"],
  learning_objectives: [
    {
      code: "LO-C2.SOL.05-01",
      behaviour: "Nhận biết và thực hành Khối chữ nhật ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.SOL.05-02",
      behaviour: "Vận dụng Khối chữ nhật trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.SOL.05-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Khối chữ nhật",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_SOL_05_DATASET: SkillDataset = {
  skill_code: "C2.SOL.05",
  concept_label: "Khối chữ nhật",
  surface: "game",
  items: [
    {
      id: "brick_solid",
      label: "viên gạch chữ nhật",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🧱",
      },
      category: {
        type: "khối chữ nhật",
      },
      contrast_group: "rect_prism",
    },
    {
      id: "book_solid",
      label: "quyển sách chữ nhật",
      value: 2,
      image: {
        kind: "emoji",
        ref: "📗",
      },
      category: {
        type: "khối chữ nhật",
      },
      contrast_group: "rect_prism",
    },
    {
      id: "juice_box",
      label: "hộp sữa chữ nhật",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🧃",
      },
      category: {
        type: "khối chữ nhật",
      },
      contrast_group: "rect_prism",
    },
    {
      id: "suitcase_solid",
      label: "chiếc va-li chữ nhật",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🧳",
      },
      category: {
        type: "khối chữ nhật",
      },
      contrast_group: "rect_prism",
    },
    {
      id: "ball_round",
      label: "quả bóng tròn lăn",
      value: 5,
      image: {
        kind: "emoji",
        ref: "⚽",
      },
      category: {
        type: "khối tròn lăn",
      },
      contrast_group: "round_solid",
    },
    {
      id: "orange_round",
      label: "trái cam tròn lăn",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🍊",
      },
      category: {
        type: "khối tròn lăn",
      },
      contrast_group: "round_solid",
    },
    {
      id: "can_round",
      label: "lon nước tròn lăn",
      value: 7,
      image: {
        kind: "emoji",
        ref: "🥫",
      },
      category: {
        type: "khối tròn lăn",
      },
      contrast_group: "round_solid",
    },
    {
      id: "drum_round",
      label: "chiếc trống tròn",
      value: 8,
      image: {
        kind: "emoji",
        ref: "🥁",
      },
      category: {
        type: "khối tròn lăn",
      },
      contrast_group: "round_solid",
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "brick_solid",
      target_id: "ball_round",
      metadata: {
        dimension: "solid_type",
      },
    },
    {
      type: "contrast",
      source_id: "book_solid",
      target_id: "orange_round",
      metadata: {
        dimension: "solid_type",
      },
    },
    {
      type: "pair",
      source_id: "brick_solid",
      target_id: "book_solid",
      metadata: {
        relation: "cùng khối chữ nhật",
      },
    },
    {
      type: "pair",
      source_id: "ball_round",
      target_id: "orange_round",
      metadata: {
        relation: "cùng khối tròn lăn",
      },
    },
  ],
  axes: {
    solid_type: {
      values: ["khối chữ nhật", "khối tròn lăn"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Khối chữ nhật",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Khối chữ nhật",
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
    narration_template: "Chúng mình cùng tìm hiểu về Khối chữ nhật nhé",
  },
  ordering: [
    "brick_solid",
    "book_solid",
    "juice_box",
    "suitcase_solid",
    "ball_round",
    "orange_round",
    "can_round",
    "drum_round",
  ],
};

export const C2_SOL_05_SEED: SkillSeed = {
  identity: C2_SOL_05_IDENTITY,
  dataset: C2_SOL_05_DATASET,
  levels: [
    {
      code: "GL-C2-SOL-TAP-0009",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C2-SOL-TAP-0010",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C2-SOL-TCNT-0009",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
  ],
};
