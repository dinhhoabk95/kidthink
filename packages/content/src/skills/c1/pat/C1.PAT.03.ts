import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_PAT_03_IDENTITY: SkillIdentity = {
  code: "C1.PAT.03",
  strand_code: "C1.PAT",
  competency_code: "C1",
  name: "Quy luật AAB",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["observe", "predict"],
  tier: "basic",
  prerequisites: ["C1.PAT.01"],
  learning_objectives: [
    {
      code: "LO-C1.PAT.03-01",
      behaviour: "Nhận biết và thực hành Quy luật AAB ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.PAT.03-02",
      behaviour: "Vận dụng Quy luật AAB trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.PAT.03-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Quy luật AAB",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_PAT_03_DATASET: SkillDataset = {
  skill_code: "C1.PAT.03",
  concept_label: "Quy luật AAB",
  surface: "game",
  items: [
    {
      id: "pat_a1",
      label: "trái tim đỏ",
      glyph: "A1",
      value: 1,
      image: {
        kind: "emoji",
        ref: "❤️",
      },
      contrast_group: "group_a",
      category: {
        type: "nhóm tim",
        cycle: "A",
      },
    },
    {
      id: "pat_b1",
      label: "viên kim cương",
      glyph: "B1",
      value: 2,
      image: {
        kind: "emoji",
        ref: "💎",
      },
      contrast_group: "group_b",
      category: {
        type: "nhóm đá quý",
        cycle: "B",
      },
    },
    {
      id: "pat_a2",
      label: "trái tim hồng",
      glyph: "A2",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🩷",
      },
      contrast_group: "group_a",
      category: {
        type: "nhóm tim",
        cycle: "A",
      },
    },
    {
      id: "pat_a3",
      label: "trái tim cam",
      glyph: "A3",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🧡",
      },
      contrast_group: "group_a",
      category: {
        type: "nhóm tim",
        cycle: "A",
      },
    },
    {
      id: "pat_b2",
      label: "chiếc nhẫn ngọc",
      glyph: "B2",
      value: 5,
      image: {
        kind: "emoji",
        ref: "💍",
      },
      contrast_group: "group_b",
      category: {
        type: "nhóm đá quý",
        cycle: "B",
      },
    },
    {
      id: "pat_a4",
      label: "trái tim vàng",
      glyph: "A4",
      value: 6,
      image: {
        kind: "emoji",
        ref: "💛",
      },
      contrast_group: "group_a",
      category: {
        type: "nhóm tim",
        cycle: "A",
      },
    },
  ],
  relations: [
    {
      type: "sequence",
      source_id: "pat_a1",
      target_id: "pat_b1",
      metadata: {
        rule: "AAB",
        period: 3,
      },
    },
    {
      type: "sequence",
      source_id: "pat_b1",
      target_id: "pat_a2",
      metadata: {
        rule: "AAB",
        period: 3,
      },
    },
    {
      type: "sequence",
      source_id: "pat_a2",
      target_id: "pat_a3",
      metadata: {
        rule: "AAB",
        period: 3,
      },
    },
    {
      type: "sequence",
      source_id: "pat_a3",
      target_id: "pat_b2",
      metadata: {
        rule: "AAB",
        period: 3,
      },
    },
    {
      type: "sequence",
      source_id: "pat_b2",
      target_id: "pat_a4",
      metadata: {
        rule: "AAB",
        period: 3,
      },
    },
  ],
  axes: {
    cycle: {
      values: ["A", "B"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với quy luật AAB",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng quy luật AAB",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt quy luật AAB với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi quy luật AAB",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục quy luật AAB và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn đúng {label} nhé!",
    narration_template: "Chúng mình cùng tìm hiểu về quy luật AAB nhé",
  },
  ordering: ["pat_a1", "pat_b1", "pat_a2", "pat_a3", "pat_b2", "pat_a4"],
};

export const C1_PAT_03_SEED: SkillSeed = {
  identity: C1_PAT_03_IDENTITY,
  dataset: C1_PAT_03_DATASET,
  levels: [
    {
      code: "GL-C3-PXT-SLOT-0003",
      template: "GT-008",
      band: "3-4",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-TAP-0009",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-TAP-0010",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
    },
  ],
};
