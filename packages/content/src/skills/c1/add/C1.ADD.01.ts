import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_ADD_01_IDENTITY: SkillIdentity = {
  code: "C1.ADD.01",
  strand_code: "C1.ADD",
  competency_code: "C1",
  name: "Cộng bằng đồ vật",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["count", "solve"],
  tier: "basic",
  prerequisites: ["C1.NCOMP.10"],
  learning_objectives: [
    {
      code: "LO-C1.ADD.01-01",
      behaviour: "Nhận biết và thực hành Cộng bằng đồ vật ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.ADD.01-02",
      behaviour: "Vận dụng Cộng bằng đồ vật trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.ADD.01-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Cộng bằng đồ vật",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_ADD_01_DATASET: SkillDataset = {
  skill_code: "C1.ADD.01",
  concept_label: "Cộng bằng đồ vật",
  surface: "game",
  items: [
    {
      id: "n1",
      label: "một quả táo đỏ",
      glyph: "🍎",
      value: 1,
      contrast_group: "quantity",
      ordering: 1,
      category: {
        type: "trái cây ngọt",
      },
      image: {
        kind: "emoji",
        ref: "🍎",
      },
    },
    {
      id: "n2",
      label: "hai quả cam tươi",
      glyph: "🍊🍊",
      value: 2,
      contrast_group: "quantity",
      ordering: 2,
      category: {
        type: "trái cây ngọt",
      },
      image: {
        kind: "emoji",
        ref: "🍊",
      },
    },
    {
      id: "n3",
      label: "ba quả chuối vàng",
      glyph: "🍌🍌🍌",
      value: 3,
      contrast_group: "quantity",
      ordering: 3,
      category: {
        type: "trái cây ngọt",
      },
      image: {
        kind: "emoji",
        ref: "🍌",
      },
    },
    {
      id: "n4",
      label: "bốn quả dâu tây",
      glyph: "🍓🍓🍓🍓",
      value: 4,
      contrast_group: "quantity",
      ordering: 4,
      category: {
        type: "trái cây ngọt",
      },
      image: {
        kind: "emoji",
        ref: "🍓",
      },
    },
    {
      id: "n5",
      label: "năm quả dưa hấu",
      glyph: "🍉🍉🍉🍉🍉",
      value: 5,
      contrast_group: "quantity",
      ordering: 5,
      category: {
        type: "trái cây ngọt",
      },
      image: {
        kind: "emoji",
        ref: "🍉",
      },
    },
    {
      id: "n6",
      label: "sáu quả đào hồng",
      glyph: "🍑🍑🍑🍑🍑🍑",
      value: 6,
      contrast_group: "quantity",
      ordering: 6,
      category: {
        type: "trái cây ngọt",
      },
      image: {
        kind: "emoji",
        ref: "🍑",
      },
    },
    {
      id: "wb08_blue_diamond",
      label: "viên kim cương lam",
      glyph: "💎",
      value: 1,
      contrast_group: "cipher_gem",
      ordering: 7,
      image: { kind: "emoji", ref: "💎" },
      category: { type: "ngọc bí ẩn" },
    },
    {
      id: "wb08_red_ruby",
      label: "viên hồng ngọc đỏ",
      glyph: "🔴",
      value: 1,
      contrast_group: "cipher_gem",
      ordering: 8,
      image: { kind: "emoji", ref: "🔴" },
      category: { type: "ngọc bí ẩn" },
    },
    {
      id: "wb08_gold_key",
      label: "chìa khóa vàng lớn",
      glyph: "🗝️",
      value: 1,
      contrast_group: "cipher_key",
      ordering: 9,
      image: { kind: "emoji", ref: "🗝️" },
      category: { type: "chìa khóa mật" },
    },
    {
      id: "wb08_purple_key",
      label: "chìa khóa tím nhỏ",
      glyph: "🔑",
      value: 1,
      contrast_group: "cipher_key",
      ordering: 10,
      image: { kind: "emoji", ref: "🔑" },
      category: { type: "chìa khóa mật" },
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "wb08_blue_diamond",
      target_id: "wb08_red_ruby",
    },
    {
      type: "pair",
      source_id: "wb08_gold_key",
      target_id: "wb08_purple_key",
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
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với cộng bằng đồ vật",
      representation: "discrete-object",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng cộng bằng đồ vật",
      representation: "discrete-object",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt cộng bằng đồ vật với phương án nhiễu",
      representation: "ten-frame",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi cộng bằng đồ vật",
      representation: "ten-frame",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục cộng bằng đồ vật và tự làm một mình",
      representation: "ten-frame",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn {label} nhé!",
    narration_template:
      "Chúng mình cùng làm quen với phép cộng bằng đồ vật nhé",
  },
  ordering: [
    "n1",
    "n2",
    "n3",
    "n4",
    "n5",
    "n6",
    "wb08_blue_diamond",
    "wb08_red_ruby",
    "wb08_gold_key",
    "wb08_purple_key",
  ],
};

export const C1_ADD_01_SEED: SkillSeed = {
  identity: C1_ADD_01_IDENTITY,
  dataset: C1_ADD_01_DATASET,
  levels: [
    {
      code: "GL-C1-ADD-TAP-0001",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-TCNT-0001",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-TCNT-0002",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-TCNT-0003",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-SLOT-0181",
      template: "GT-008",
      band: "4-5",
      difficulty: 1,
      access_tier: "free",
      theme: "nature",
      rounds: 3,
      montessori_ref: "WB08-D2",
    },
  ],
};
