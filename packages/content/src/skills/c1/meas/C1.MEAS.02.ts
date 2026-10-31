import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_MEAS_02_IDENTITY: SkillIdentity = {
  code: "C1.MEAS.02",
  strand_code: "C1.MEAS",
  competency_code: "C1",
  name: "Cao thấp",
  age_min: 3,
  age_max: 3,
  difficulty: 1,
  thinking_processes: ["compare"],
  tier: "basic",
  prerequisites: ["C1.CMP.08", "C1.CMP.09"],
  learning_objectives: [
    {
      code: "LO-C1.MEAS.02-01",
      behaviour: "Nhận biết và thực hành Cao thấp ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.MEAS.02-02",
      behaviour: "Vận dụng Cao thấp trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.MEAS.02-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Cao thấp",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_MEAS_02_DATASET: SkillDataset = {
  skill_code: "C1.MEAS.02",
  concept_label: "Cao thấp",
  surface: "game",
  items: [
    {
      id: "meas02-i1",
      label: "cây nấm thấp",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🍄",
      },
      ordering: 1,
      contrast_group: "height_short",
      category: {
        type: "vật thể thấp",
        height: "thấp",
      },
    },
    {
      id: "meas02-i2",
      label: "mầm cây thấp",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🌱",
      },
      ordering: 2,
      contrast_group: "height_short",
      category: {
        type: "vật thể thấp",
        height: "thấp",
      },
    },
    {
      id: "meas02-i3",
      label: "ngôi nhà thấp",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🏠",
      },
      ordering: 3,
      contrast_group: "height_short",
      category: {
        type: "vật thể thấp",
        height: "thấp",
      },
    },
    {
      id: "meas02-i4",
      label: "chú thỏ thấp",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🐰",
      },
      ordering: 4,
      contrast_group: "height_short",
      category: {
        type: "vật thể thấp",
        height: "thấp",
      },
    },
    {
      id: "meas02-i5",
      label: "cây dừa cao",
      value: 5,
      image: {
        kind: "emoji",
        ref: "🌴",
      },
      ordering: 5,
      contrast_group: "height_tall",
      category: {
        type: "vật thể cao",
        height: "cao",
      },
    },
    {
      id: "meas02-i6",
      label: "cây thông cao",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🌲",
      },
      ordering: 6,
      contrast_group: "height_tall",
      category: {
        type: "vật thể cao",
        height: "cao",
      },
    },
    {
      id: "meas02-i7",
      label: "tòa nhà cao",
      value: 7,
      image: {
        kind: "emoji",
        ref: "🏢",
      },
      ordering: 7,
      contrast_group: "height_tall",
      category: {
        type: "vật thể cao",
        height: "cao",
      },
    },
    {
      id: "meas02-i8",
      label: "hươu cổ cao",
      value: 8,
      image: {
        kind: "emoji",
        ref: "🦒",
      },
      ordering: 8,
      contrast_group: "height_tall",
      category: {
        type: "vật thể cao",
        height: "cao",
      },
    },
    {
      id: "meas02-crane",
      label: "cần cẩu cao",
      value: 9,
      image: {
        kind: "emoji",
        ref: "🏗️",
      },
      ordering: 9,
      contrast_group: "height_tall",
      category: {
        type: "cơ khí cao",
        height: "cao",
      },
    },
    {
      id: "meas02-tower",
      label: "tháp máy cao",
      value: 10,
      image: {
        kind: "emoji",
        ref: "🗼",
      },
      ordering: 10,
      contrast_group: "height_tall",
      category: {
        type: "cơ khí cao",
        height: "cao",
      },
    },
    {
      id: "meas02-gear",
      label: "bánh răng thấp",
      value: 11,
      image: {
        kind: "emoji",
        ref: "⚙️",
      },
      ordering: 11,
      contrast_group: "height_short",
      category: {
        type: "cơ khí thấp",
        height: "thấp",
      },
    },
    {
      id: "meas02-anvil",
      label: "đe sắt thấp",
      value: 12,
      image: {
        kind: "emoji",
        ref: "🪨",
      },
      ordering: 12,
      contrast_group: "height_short",
      category: {
        type: "cơ khí thấp",
        height: "thấp",
      },
    },
    {
      id: "meas02-car",
      label: "ô tô đỏ thấp",
      value: 13,
      image: {
        kind: "emoji",
        ref: "🚗",
      },
      ordering: 13,
      contrast_group: "height_short",
      category: {
        type: "xe cộ",
        height: "thấp",
      },
    },
    {
      id: "meas02-train",
      label: "đầu tàu hỏa cao",
      value: 14,
      image: {
        kind: "emoji",
        ref: "🚂",
      },
      ordering: 14,
      contrast_group: "height_tall",
      category: {
        type: "xe cộ",
        height: "cao",
      },
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "meas02-i1",
      target_id: "meas02-i5",
      metadata: {
        dimension: "height",
      },
    },
    {
      type: "contrast",
      source_id: "meas02-i2",
      target_id: "meas02-i6",
      metadata: {
        dimension: "height",
      },
    },
    {
      type: "contrast",
      source_id: "meas02-i3",
      target_id: "meas02-i7",
      metadata: {
        dimension: "height",
      },
    },
    {
      type: "contrast",
      source_id: "meas02-i4",
      target_id: "meas02-i8",
      metadata: {
        dimension: "height",
      },
    },
    {
      type: "contrast",
      source_id: "meas02-gear",
      target_id: "meas02-crane",
      metadata: {
        dimension: "height",
      },
    },
    {
      type: "contrast",
      source_id: "meas02-anvil",
      target_id: "meas02-tower",
      metadata: {
        dimension: "height",
      },
    },
    {
      type: "contrast",
      source_id: "meas02-car",
      target_id: "meas02-train",
      metadata: {
        dimension: "height",
      },
    },
  ],
  axes: {
    height: {
      values: ["thấp", "cao"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với cao thấp",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng cao thấp",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt cao thấp với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi cao thấp",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục cao thấp và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn {label} nhé!",
    narration_template: "Chúng mình cùng tìm hiểu về Cao thấp nhé",
  },
  ordering: [
    "meas02-i1",
    "meas02-i2",
    "meas02-i3",
    "meas02-i4",
    "meas02-i5",
    "meas02-i6",
    "meas02-i7",
    "meas02-i8",
    "meas02-crane",
    "meas02-tower",
    "meas02-gear",
    "meas02-anvil",
    "meas02-car",
    "meas02-train",
  ],
};

export const C1_MEAS_02_SEED: SkillSeed = {
  identity: C1_MEAS_02_IDENTITY,
  dataset: C1_MEAS_02_DATASET,
  levels: [
    {
      code: "GL-C1-MEAS-TAP-0241",
      template: "GT-001",
      band: "5-6",
      difficulty: 1,
      access_tier: "free",
      theme: "vehicle",
      rounds: 3,
      montessori_ref: "WB16-D1",
    },
    {
      code: "GL-C1-MEAS-TAP-0242",
      template: "GT-001",
      band: "5-6",
      difficulty: 2,
      access_tier: "login",
      theme: "vehicle",
      rounds: 3,
      montessori_ref: "WB16-D1",
    },
    {
      code: "GL-C1-MSR-UNIT-0006",
      template: "GT-030",
      band: "5-6",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-SZO-ORD-0007",
      template: "GT-006",
      band: "5-6",
      difficulty: 1,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C1-RUL-SLOT-0005",
      template: "GT-008",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
  ],
};
