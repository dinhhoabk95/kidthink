import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_MEAS_04_IDENTITY: SkillIdentity = {
  code: "C1.MEAS.04",
  strand_code: "C1.MEAS",
  competency_code: "C1",
  name: "Nhiều ít",
  age_min: 3,
  age_max: 3,
  difficulty: 1,
  thinking_processes: ["compare"],
  tier: "basic",
  prerequisites: ["C1.CMP.04", "C1.CMP.05"],
  learning_objectives: [
    {
      code: "LO-C1.MEAS.04-01",
      behaviour: "Nhận biết và thực hành Nhiều ít ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.MEAS.04-02",
      behaviour: "Vận dụng Nhiều ít trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.MEAS.04-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Nhiều ít",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_MEAS_04_DATASET: SkillDataset = {
  skill_code: "C1.MEAS.04",
  concept_label: "Nhiều ít",
  surface: "game",
  items: [
    {
      id: "meas04-i1",
      label: "ít quả táo",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🍎",
      },
      ordering: 1,
      contrast_group: "quantity",
      category: {
        type: "nhóm ít vật",
        quantity: "ít",
      },
    },
    {
      id: "meas04-i2",
      label: "ít bông hoa",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🌸",
      },
      ordering: 2,
      contrast_group: "quantity",
      category: {
        type: "nhóm ít vật",
        quantity: "ít",
      },
    },
    {
      id: "meas04-i3",
      label: "ít viên kẹo",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🍬",
      },
      ordering: 3,
      contrast_group: "quantity",
      category: {
        type: "nhóm ít vật",
        quantity: "ít",
      },
    },
    {
      id: "meas04-i4",
      label: "ít bóng bay",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🎈",
      },
      ordering: 4,
      contrast_group: "quantity",
      category: {
        type: "nhóm ít vật",
        quantity: "ít",
      },
    },
    {
      id: "meas04-i5",
      label: "nhiều quả táo",
      value: 5,
      image: {
        kind: "emoji",
        ref: "🍏",
      },
      ordering: 5,
      contrast_group: "quantity",
      category: {
        type: "nhóm nhiều vật",
        quantity: "nhiều",
      },
    },
    {
      id: "meas04-i6",
      label: "nhiều bông hoa",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🌻",
      },
      ordering: 6,
      contrast_group: "quantity",
      category: {
        type: "nhóm nhiều vật",
        quantity: "nhiều",
      },
    },
    {
      id: "meas04-i7",
      label: "nhiều viên kẹo",
      value: 7,
      image: {
        kind: "emoji",
        ref: "🍭",
      },
      ordering: 7,
      contrast_group: "quantity",
      category: {
        type: "nhóm nhiều vật",
        quantity: "nhiều",
      },
    },
    {
      id: "meas04-i8",
      label: "nhiều bóng bay",
      value: 8,
      image: {
        kind: "emoji",
        ref: "🎉",
      },
      ordering: 8,
      contrast_group: "quantity",
      category: {
        type: "nhóm nhiều vật",
        quantity: "nhiều",
      },
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "meas04-i1",
      target_id: "meas04-i5",
      metadata: {
        dimension: "quantity",
      },
    },
    {
      type: "contrast",
      source_id: "meas04-i2",
      target_id: "meas04-i6",
      metadata: {
        dimension: "quantity",
      },
    },
    {
      type: "contrast",
      source_id: "meas04-i3",
      target_id: "meas04-i7",
      metadata: {
        dimension: "quantity",
      },
    },
    {
      type: "contrast",
      source_id: "meas04-i4",
      target_id: "meas04-i8",
      metadata: {
        dimension: "quantity",
      },
    },
  ],
  axes: {
    quantity: {
      values: ["ít", "nhiều"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với nhiều ít",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng nhiều ít",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt nhiều ít với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi nhiều ít",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục nhiều ít và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn {label} nhé!",
    narration_template: "Chúng mình cùng tìm hiểu về Nhiều ít nhé",
  },
  ordering: [
    "meas04-i1",
    "meas04-i2",
    "meas04-i3",
    "meas04-i4",
    "meas04-i5",
    "meas04-i6",
    "meas04-i7",
    "meas04-i8",
  ],
};

export const C1_MEAS_04_SEED: SkillSeed = {
  identity: C1_MEAS_04_IDENTITY,
  dataset: C1_MEAS_04_DATASET,
  levels: [
    {
      code: "GL-C1-RUL-SLOT-0009",
      template: "GT-008",
      band: "5-6",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-RUL-SLOT-0010",
      template: "GT-008",
      band: "5-6",
      difficulty: 1,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-BAL-OBJ-0006",
      template: "GT-014",
      band: "5-6",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
    },
  ],
};
