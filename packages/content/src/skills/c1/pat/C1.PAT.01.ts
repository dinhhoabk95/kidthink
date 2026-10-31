import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_PAT_01_IDENTITY: SkillIdentity = {
  code: "C1.PAT.01",
  strand_code: "C1.PAT",
  competency_code: "C1",
  name: "Quy luật AB",
  age_min: 3,
  age_max: 3,
  difficulty: 1,
  thinking_processes: ["observe", "predict"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C1.PAT.01-01",
      behaviour: "Nhận biết và thực hành Quy luật AB ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.PAT.01-02",
      behaviour: "Vận dụng Quy luật AB trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.PAT.01-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Quy luật AB",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_PAT_01_DATASET: SkillDataset = {
  skill_code: "C1.PAT.01",
  concept_label: "Quy luật AB",
  surface: "game",
  items: [
    {
      id: "pat_a1",
      label: "quả táo đỏ",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🍎",
      },
      contrast_group: "group_a",
      category: {
        type: "nhóm A",
        cycle: "A",
      },
    },
    {
      id: "pat_b1",
      label: "quả chuối vàng",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🍌",
      },
      contrast_group: "group_b",
      category: {
        type: "nhóm B",
        cycle: "B",
      },
    },
    {
      id: "pat_a2",
      label: "quả dâu tây",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🍓",
      },
      contrast_group: "group_a",
      category: {
        type: "nhóm A",
        cycle: "A",
      },
    },
    {
      id: "pat_b2",
      label: "quả chanh vàng",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🍋",
      },
      contrast_group: "group_b",
      category: {
        type: "nhóm B",
        cycle: "B",
      },
    },
    {
      id: "pat_a3",
      label: "quả anh đào",
      value: 5,
      image: {
        kind: "emoji",
        ref: "🍒",
      },
      contrast_group: "group_a",
      category: {
        type: "nhóm A",
        cycle: "A",
      },
    },
    {
      id: "pat_b3",
      label: "quả lê vàng",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🍐",
      },
      contrast_group: "group_b",
      category: {
        type: "nhóm B",
        cycle: "B",
      },
    },
    {
      id: "apple_red",
      label: "quả táo đỏ",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🍎",
      },
    },
    {
      id: "pear_green",
      label: "quả lê xanh",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🍐",
      },
    },
    {
      id: "rabbit_white",
      label: "thỏ trắng",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🐰",
      },
    },
    {
      id: "bear_brown",
      label: "gấu nâu",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🐻",
      },
    },
  ],
  relations: [
    {
      type: "sequence",
      source_id: "pat_a1",
      target_id: "pat_b1",
      metadata: {
        rule: "AB",
        period: 2,
      },
    },
    {
      type: "sequence",
      source_id: "pat_b1",
      target_id: "pat_a2",
      metadata: {
        rule: "AB",
        period: 2,
      },
    },
    {
      type: "sequence",
      source_id: "pat_a2",
      target_id: "pat_b2",
      metadata: {
        rule: "AB",
        period: 2,
      },
    },
    {
      type: "sequence",
      source_id: "pat_b2",
      target_id: "pat_a3",
      metadata: {
        rule: "AB",
        period: 2,
      },
    },
    {
      type: "sequence",
      source_id: "pat_a3",
      target_id: "pat_b3",
      metadata: {
        rule: "AB",
        period: 2,
      },
    },
  ],
  axes: {
    cycle: {
      values: ["A", "B"],
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với quy luật AB",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng quy luật AB",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt quy luật AB với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi quy luật AB",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục quy luật AB và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn đúng {label} nhé!",
    narration_template: "Chúng mình cùng tìm hiểu về quy luật AB nhé",
  },
  ordering: [
    "pat_a1",
    "pat_b1",
    "pat_a2",
    "pat_b2",
    "pat_a3",
    "pat_b3",
    "apple_red",
    "pear_green",
    "rabbit_white",
    "bear_brown",
  ],
};

export const C1_PAT_01_SEED: SkillSeed = {
  identity: C1_PAT_01_IDENTITY,
  dataset: C1_PAT_01_DATASET,
  levels: [
    {
      template: "GT-000",
      band: "3-4",
      difficulty: 1,
      theme: "school",
    },
    {
      code: "GL-C1-PAT-SEQ-0121",
      template: "GT-011",
      band: "5-6",
      difficulty: 3,
      access_tier: "standard",
      theme: "food",
      rounds: 3,
      montessori_ref: "WB15-D1",
    },
    {
      code: "GL-C1-PAT-SLOT-0135",
      template: "GT-008",
      band: "5-6",
      difficulty: 3,
      access_tier: "standard",
      theme: "food",
      rounds: 3,
      montessori_ref: "WB15-D2",
    },
    {
      code: "GL-C1-PAT-ORD-0201",
      template: "GT-006",
      band: "5-6",
      difficulty: 1,
      access_tier: "free",
      theme: "food",
      rounds: 3,
      montessori_ref: "WB15-D1",
    },
    {
      code: "GL-C1-PAT-CARD-0201",
      template: "GT-001",
      band: "5-6",
      difficulty: 2,
      access_tier: "login",
      theme: "food",
      rounds: 3,
      montessori_ref: "WB15-D1",
    },
    {
      code: "GL-C1-PAT-BEAT-0001",
      template: "GT-034",
      band: "5-6",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-BEAT-0002",
      template: "GT-034",
      band: "5-6",
      difficulty: 1,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-BEAT-0003",
      template: "GT-034",
      band: "5-6",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-SND-PAT-0001",
      template: "GT-018",
      band: "4-5",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-SND-PAT-0002",
      template: "GT-018",
      band: "4-5",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-SND-PAT-0003",
      template: "GT-018",
      band: "4-5",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-TAP-0001",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-TAP-0003",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-TCMP-0001",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-TCMP-0003",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-PATT-0001",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
  ],
};
