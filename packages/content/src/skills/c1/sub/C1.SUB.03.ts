import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_SUB_03_IDENTITY: SkillIdentity = {
  code: "C1.SUB.03",
  strand_code: "C1.SUB",
  competency_code: "C1",
  name: "Trừ trong phạm vi 5",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["solve"],
  tier: "core",
  prerequisites: ["C1.SUB.01"],
  learning_objectives: [
    {
      code: "LO-C1.SUB.03-01",
      behaviour: "Nhận biết và thực hành Trừ trong phạm vi 5 ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.SUB.03-02",
      behaviour: "Vận dụng Trừ trong phạm vi 5 trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.SUB.03-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Trừ trong phạm vi 5",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_SUB_03_DATASET: SkillDataset = {
  skill_code: "C1.SUB.03",
  concept_label: "Trừ trong phạm vi 5",
  surface: "game",
  items: [
    {
      id: "n0",
      label: "số 0",
      glyph: "0",
      value: 0,
      audio_path: "/audio/voice/common/numbers/0.mp3",
      image: {
        kind: "emoji",
        ref: "🧺",
      },
      contrast_group: "sub_5",
      category: {
        type: "kết quả nhỏ",
      },
    },
    {
      id: "n1",
      label: "số một",
      glyph: "1",
      value: 1,
      audio_path: "/audio/voice/common/numbers/1.mp3",
      image: {
        kind: "emoji",
        ref: "🍭",
      },
      contrast_group: "sub_5",
      category: {
        type: "kết quả nhỏ",
      },
    },
    {
      id: "n2",
      label: "số hai",
      glyph: "2",
      value: 2,
      audio_path: "/audio/voice/common/numbers/2.mp3",
      image: {
        kind: "emoji",
        ref: "🍬",
      },
      contrast_group: "sub_5",
      category: {
        type: "kết quả nhỏ",
      },
    },
    {
      id: "n3",
      label: "số ba",
      glyph: "3",
      value: 3,
      audio_path: "/audio/voice/common/numbers/3.mp3",
      image: {
        kind: "emoji",
        ref: "🍪",
      },
      contrast_group: "sub_5",
      category: {
        type: "kết quả lớn",
      },
    },
    {
      id: "n4",
      label: "số bốn",
      glyph: "4",
      value: 4,
      audio_path: "/audio/voice/common/numbers/4.mp3",
      image: {
        kind: "emoji",
        ref: "🧁",
      },
      contrast_group: "sub_5",
      category: {
        type: "kết quả lớn",
      },
    },
    {
      id: "n5",
      label: "số năm",
      glyph: "5",
      value: 5,
      audio_path: "/audio/voice/common/numbers/5.mp3",
      image: {
        kind: "emoji",
        ref: "🍩",
      },
      contrast_group: "sub_5",
      category: {
        type: "kết quả lớn",
      },
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
      id: "pin_note",
      label: "thẻ giấy ghim gỗ",
      value: 3,
      image: {
        kind: "emoji",
        ref: "📌",
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
  ],
  relations: [
    {
      type: "subset",
      source_id: "n0",
      target_id: "n5",
      metadata: {
        bond_id: "bond_5_0_5",
        part_a: 0,
        part_b: 5,
        whole: 5,
      },
    },
    {
      type: "subset",
      source_id: "n1",
      target_id: "n5",
      metadata: {
        bond_id: "bond_5_1_4",
        part_a: 1,
        part_b: 4,
        whole: 5,
      },
    },
    {
      type: "subset",
      source_id: "n2",
      target_id: "n5",
      metadata: {
        bond_id: "bond_5_2_3",
        part_a: 2,
        part_b: 3,
        whole: 5,
      },
    },
    {
      type: "subset",
      source_id: "n3",
      target_id: "n5",
      metadata: {
        bond_id: "bond_5_3_2",
        part_a: 3,
        part_b: 2,
        whole: 5,
      },
    },
    {
      type: "subset",
      source_id: "n4",
      target_id: "n5",
      metadata: {
        bond_id: "bond_5_4_1",
        part_a: 4,
        part_b: 1,
        whole: 5,
      },
    },
  ],
  axes: {
    type: {
      values: ["kết quả nhỏ", "kết quả lớn"],
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với trừ trong phạm vi 5",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng trừ trong phạm vi 5",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt trừ trong phạm vi 5 với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi trừ trong phạm vi 5",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục trừ trong phạm vi 5 và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn đúng {label} nhé!",
    narration_template: "Chúng mình cùng tìm hiểu về Trừ trong phạm vi 5 nhé!",
  },
  ordering: [
    "n0",
    "n1",
    "n2",
    "n3",
    "n4",
    "n5",
    "mag_glass",
    "gold_key",
    "pin_note",
    "treasure_chest",
  ],
};

export const C1_SUB_03_SEED: SkillSeed = {
  identity: C1_SUB_03_IDENTITY,
  dataset: C1_SUB_03_DATASET,
  levels: [
    {
      code: "GL-C1-SUB-PICT-0006",
      template: "GT-031",
      band: "5-6",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-PICT-0007",
      template: "GT-031",
      band: "5-6",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-TAP-0010",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-SLOT-0201",
      template: "GT-008",
      band: "4-5",
      difficulty: 1,
      access_tier: "free",
      theme: "job",
      rounds: 3,
      montessori_ref: "WB14-D1",
    },
    {
      code: "GL-C1-SUB-TAP-0202",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      access_tier: "login",
      theme: "job",
      rounds: 3,
      montessori_ref: "WB14-D2",
    },
    {
      code: "GL-C1-SUB-SLOT-0203",
      template: "GT-008",
      band: "5-6",
      difficulty: 3,
      access_tier: "standard",
      theme: "job",
      rounds: 3,
      montessori_ref: "WB14-D3",
    },
  ],
};
