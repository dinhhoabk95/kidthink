import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_ORI_07_IDENTITY: SkillIdentity = {
  code: "C2.ORI.07",
  strand_code: "C2.ORI",
  competency_code: "C2",
  name: "Trong",
  age_min: 3,
  age_max: 3,
  difficulty: 1,
  thinking_processes: ["observe"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C2.ORI.07-01",
      behaviour: "Nhận biết và thực hành Trong ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.ORI.07-02",
      behaviour: "Vận dụng Trong trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.ORI.07-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Trong",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_ORI_07_DATASET: SkillDataset = {
  skill_code: "C2.ORI.07",
  concept_label: "Trong",
  surface: "game",
  items: [
    {
      id: "bird_inside",
      label: "chú chim trong lồng",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🦜",
      },
      category: {
        type: "ở bên trong",
      },
      contrast_group: "inside",
    },
    {
      id: "fish_inside",
      label: "cá bơi trong bể",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🐠",
      },
      category: {
        type: "ở bên trong",
      },
      contrast_group: "inside",
    },
    {
      id: "gift_inside",
      label: "quà trong hộp",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🎁",
      },
      category: {
        type: "ở bên trong",
      },
      contrast_group: "inside",
    },
    {
      id: "pencil_inside",
      label: "bút trong hộp bút",
      value: 4,
      image: {
        kind: "emoji",
        ref: "✏️",
      },
      category: {
        type: "ở bên trong",
      },
      contrast_group: "inside",
    },
    {
      id: "bird_outside",
      label: "chú chim bay ngoài trời",
      value: 5,
      image: {
        kind: "emoji",
        ref: "🕊️",
      },
      category: {
        type: "ở bên ngoài",
      },
      contrast_group: "outside",
    },
    {
      id: "dolphin_outside",
      label: "cá heo ngoài biển rộng",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🐬",
      },
      category: {
        type: "ở bên ngoài",
      },
      contrast_group: "outside",
    },
    {
      id: "box_outside",
      label: "chiếc hộp rỗng mở nắp",
      value: 7,
      image: {
        kind: "emoji",
        ref: "📦",
      },
      category: {
        type: "ở bên ngoài",
      },
      contrast_group: "outside",
    },
    {
      id: "book_outside",
      label: "sách đặt ngoài bàn",
      value: 8,
      image: {
        kind: "emoji",
        ref: "📖",
      },
      category: {
        type: "ở bên ngoài",
      },
      contrast_group: "outside",
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "bird_inside",
      target_id: "bird_outside",
      metadata: {
        dimension: "containment",
      },
    },
    {
      type: "contrast",
      source_id: "fish_inside",
      target_id: "dolphin_outside",
      metadata: {
        dimension: "containment",
      },
    },
    {
      type: "pair",
      source_id: "bird_inside",
      target_id: "gift_inside",
      metadata: {
        relation: "cùng ở bên trong",
      },
    },
    {
      type: "pair",
      source_id: "bird_outside",
      target_id: "box_outside",
      metadata: {
        relation: "cùng ở bên ngoài",
      },
    },
  ],
  axes: {
    containment: {
      values: ["ở bên trong", "ở bên ngoài"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Trong",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Trong",
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
    narration_template: "Chúng mình cùng tìm hiểu về Trong nhé",
  },
  ordering: [
    "bird_inside",
    "fish_inside",
    "gift_inside",
    "pencil_inside",
    "bird_outside",
    "dolphin_outside",
    "box_outside",
    "book_outside",
  ],
};

export const C2_ORI_07_SEED: SkillSeed = {
  identity: C2_ORI_07_IDENTITY,
  dataset: C2_ORI_07_DATASET,
  levels: [
    {
      code: "GL-C2-POS-LOC-0004",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C2-SUB-FAST-0019",
      template: "GT-012",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C2-ROT-TRANS-0023",
      template: "GT-019",
      band: "5-6",
      difficulty: 4,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C2-BLK-STK-0033",
      template: "GT-017",
      band: "5-6",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C2-BLK-STK-0034",
      template: "GT-017",
      band: "5-6",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C2-BLK-STK-0035",
      template: "GT-017",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C2-BLK-STK-0036",
      template: "GT-017",
      band: "5-6",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
  ],
};
