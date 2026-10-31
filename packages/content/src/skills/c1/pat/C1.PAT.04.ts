import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_PAT_04_IDENTITY: SkillIdentity = {
  code: "C1.PAT.04",
  strand_code: "C1.PAT",
  competency_code: "C1",
  name: "Quy luật ABC",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["observe", "predict"],
  tier: "core",
  prerequisites: ["C1.PAT.01"],
  learning_objectives: [
    {
      code: "LO-C1.PAT.04-01",
      behaviour: "Nhận biết và thực hành Quy luật ABC ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.PAT.04-02",
      behaviour: "Vận dụng Quy luật ABC trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.PAT.04-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Quy luật ABC",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_PAT_04_DATASET: SkillDataset = {
  skill_code: "C1.PAT.04",
  concept_label: "Quy luật ABC",
  surface: "game",
  items: [
    {
      id: "pat_a1",
      label: "bông hoa đào",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🌸",
      },
      contrast_group: "flower",
      category: {
        type: "nhóm hoa",
        cycle: "A",
      },
    },
    {
      id: "pat_b1",
      label: "chiếc lá bay",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🍃",
      },
      contrast_group: "leaf",
      category: {
        type: "nhóm lá",
        cycle: "B",
      },
    },
    {
      id: "pat_c1",
      label: "mặt trời vàng",
      value: 3,
      image: {
        kind: "emoji",
        ref: "☀️",
      },
      contrast_group: "sky",
      category: {
        type: "nhóm bầu trời",
        cycle: "C",
      },
    },
    {
      id: "pat_a2",
      label: "hoa hướng dương",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🌻",
      },
      contrast_group: "flower",
      category: {
        type: "nhóm hoa",
        cycle: "A",
      },
    },
    {
      id: "pat_b2",
      label: "cỏ bốn lá",
      value: 5,
      image: {
        kind: "emoji",
        ref: "🍀",
      },
      contrast_group: "leaf",
      category: {
        type: "nhóm lá",
        cycle: "B",
      },
    },
    {
      id: "pat_c2",
      label: "cầu vồng tươi",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🌈",
      },
      contrast_group: "sky",
      category: {
        type: "nhóm bầu trời",
        cycle: "C",
      },
    },
  ],
  relations: [
    {
      type: "sequence",
      source_id: "pat_a1",
      target_id: "pat_b1",
      metadata: {
        rule: "ABC",
        period: 3,
      },
    },
    {
      type: "sequence",
      source_id: "pat_b1",
      target_id: "pat_c1",
      metadata: {
        rule: "ABC",
        period: 3,
      },
    },
    {
      type: "sequence",
      source_id: "pat_c1",
      target_id: "pat_a2",
      metadata: {
        rule: "ABC",
        period: 3,
      },
    },
    {
      type: "sequence",
      source_id: "pat_a2",
      target_id: "pat_b2",
      metadata: {
        rule: "ABC",
        period: 3,
      },
    },
    {
      type: "sequence",
      source_id: "pat_b2",
      target_id: "pat_c2",
      metadata: {
        rule: "ABC",
        period: 3,
      },
    },
  ],
  axes: {
    cycle: {
      values: ["A", "B", "C"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với quy luật ABC",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng quy luật ABC",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt quy luật ABC với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi quy luật ABC",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục quy luật ABC và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn đúng {label} nhé!",
    narration_template: "Chúng mình cùng tìm hiểu về quy luật ABC nhé",
  },
  ordering: ["pat_a1", "pat_b1", "pat_c1", "pat_a2", "pat_b2", "pat_c2"],
};

export const C1_PAT_04_SEED: SkillSeed = {
  identity: C1_PAT_04_IDENTITY,
  dataset: C1_PAT_04_DATASET,
  levels: [
    {
      code: "GL-C1-PAT-SEQ-0122",
      template: "GT-011",
      band: "5-6",
      difficulty: 4,
      theme: "art",
      rounds: 3,
      montessori_ref: "WB15-D1",
    },
    {
      code: "GL-C1-PAT-SLOT-0136",
      template: "GT-008",
      band: "5-6",
      difficulty: 4,
      theme: "art",
      rounds: 3,
      montessori_ref: "WB15-D2",
    },
    {
      code: "GL-C1-PAT-TAP-0013",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
  ],
};
