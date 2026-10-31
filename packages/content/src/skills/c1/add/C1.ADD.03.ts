import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_ADD_03_IDENTITY: SkillIdentity = {
  code: "C1.ADD.03",
  strand_code: "C1.ADD",
  competency_code: "C1",
  name: "Cộng trên trục số",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["sequence", "solve"],
  tier: "core",
  prerequisites: ["C1.CNT.08"],
  learning_objectives: [
    {
      code: "LO-C1.ADD.03-01",
      behaviour: "Nhận biết và thực hành Cộng trên trục số ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.ADD.03-02",
      behaviour: "Vận dụng Cộng trên trục số trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.ADD.03-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Cộng trên trục số",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_ADD_03_DATASET: SkillDataset = {
  skill_code: "C1.ADD.03",
  concept_label: "Cộng trên trục số",
  surface: "game",
  items: [
    {
      id: "n0",
      label: "số 0",
      glyph: "0",
      value: 0,
      contrast_group: "quantity",
      ordering: 0,
      audio_path: "/audio/voice/common/numbers/0.mp3",
      category: {
        type: "trục số nhỏ",
      },
      image: {
        kind: "emoji",
        ref: "🐌",
      },
    },
    {
      id: "n1",
      label: "số một",
      glyph: "1",
      value: 1,
      contrast_group: "quantity",
      ordering: 1,
      audio_path: "/audio/voice/common/numbers/1.mp3",
      category: {
        type: "trục số nhỏ",
      },
      image: {
        kind: "emoji",
        ref: "🐸",
      },
    },
    {
      id: "n2",
      label: "số hai",
      glyph: "2",
      value: 2,
      contrast_group: "quantity",
      ordering: 2,
      audio_path: "/audio/voice/common/numbers/2.mp3",
      category: {
        type: "trục số nhỏ",
      },
      image: {
        kind: "emoji",
        ref: "🐰",
      },
    },
    {
      id: "n3",
      label: "số ba",
      glyph: "3",
      value: 3,
      contrast_group: "quantity",
      ordering: 3,
      audio_path: "/audio/voice/common/numbers/3.mp3",
      category: {
        type: "trục số nhỏ",
      },
      image: {
        kind: "emoji",
        ref: "🐿️",
      },
    },
    {
      id: "n4",
      label: "số bốn",
      glyph: "4",
      value: 4,
      contrast_group: "quantity",
      ordering: 4,
      audio_path: "/audio/voice/common/numbers/4.mp3",
      category: {
        type: "trục số nhỏ",
      },
      image: {
        kind: "emoji",
        ref: "🦔",
      },
    },
    {
      id: "n5",
      label: "số năm",
      glyph: "5",
      value: 5,
      contrast_group: "quantity",
      ordering: 5,
      audio_path: "/audio/voice/common/numbers/5.mp3",
      category: {
        type: "trục số nhỏ",
      },
      image: {
        kind: "emoji",
        ref: "🦆",
      },
    },
    {
      id: "n6",
      label: "số sáu",
      glyph: "6",
      value: 6,
      contrast_group: "quantity",
      ordering: 6,
      audio_path: "/audio/voice/common/numbers/6.mp3",
      category: {
        type: "trục số nhỏ",
      },
      image: {
        kind: "emoji",
        ref: "🐥",
      },
    },
    {
      id: "n7",
      label: "số bảy",
      glyph: "7",
      value: 7,
      contrast_group: "quantity",
      ordering: 7,
      audio_path: "/audio/voice/common/numbers/7.mp3",
      category: {
        type: "trục số nhỏ",
      },
      image: {
        kind: "emoji",
        ref: "🐱",
      },
    },
    {
      id: "n8",
      label: "số tám",
      glyph: "8",
      value: 8,
      contrast_group: "quantity",
      ordering: 8,
      audio_path: "/audio/voice/common/numbers/8.mp3",
      category: {
        type: "trục số nhỏ",
      },
      image: {
        kind: "emoji",
        ref: "🐶",
      },
    },
    {
      id: "n9",
      label: "số chín",
      glyph: "9",
      value: 9,
      contrast_group: "quantity",
      ordering: 9,
      audio_path: "/audio/voice/common/numbers/9.mp3",
      category: {
        type: "trục số nhỏ",
      },
      image: {
        kind: "emoji",
        ref: "🐻",
      },
    },
    {
      id: "n10",
      label: "số mười",
      glyph: "10",
      value: 10,
      contrast_group: "quantity",
      ordering: 10,
      audio_path: "/audio/voice/common/numbers/10.mp3",
      category: {
        type: "trục số nhỏ",
      },
      image: {
        kind: "emoji",
        ref: "🐼",
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
      id: "stone_door",
      label: "cánh cổng vòm đá",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🚪",
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
      target_id: "n7",
      metadata: {
        bond_id: "bond_7_3_4",
        part_a: 3,
        part_b: 4,
        whole: 7,
      },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với cộng trên trục số",
      representation: "discrete-object",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng cộng trên trục số",
      representation: "discrete-object",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt cộng trên trục số với phương án nhiễu",
      representation: "ten-frame",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi cộng trên trục số",
      representation: "ten-frame",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục cộng trên trục số và tự làm một mình",
      representation: "ten-frame",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy đặt {label} nhé!",
    narration_template:
      "Chúng mình cùng làm quen với phép cộng trên trục số nhé",
  },
  ordering: [
    "n0",
    "n1",
    "n2",
    "n3",
    "n4",
    "n5",
    "n6",
    "n7",
    "n8",
    "n9",
    "n10",
    "mag_glass",
    "gold_key",
    "stone_door",
    "treasure_chest",
  ],
};

export const C1_ADD_03_SEED: SkillSeed = {
  identity: C1_ADD_03_IDENTITY,
  dataset: C1_ADD_03_DATASET,
  levels: [
    {
      code: "GL-C1-ADD-SORT-0001",
      template: "GT-006",
      band: "5-6",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-SORT-0002",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-SLOT-0001",
      template: "GT-008",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-SLOT-0201",
      template: "GT-008",
      band: "4-5",
      difficulty: 1,
      access_tier: "free",
      theme: "job",
      rounds: 3,
      montessori_ref: "WB14-D1",
    },
    {
      code: "GL-C1-ADD-TAP-0202",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      access_tier: "login",
      theme: "job",
      rounds: 3,
      montessori_ref: "WB14-D2",
    },
    {
      code: "GL-C1-ADD-SLOT-0203",
      template: "GT-008",
      band: "4-5",
      difficulty: 3,
      access_tier: "standard",
      theme: "job",
      rounds: 3,
      montessori_ref: "WB14-D3",
    },
  ],
};
