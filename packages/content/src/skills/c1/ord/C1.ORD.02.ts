import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_ORD_02_IDENTITY: SkillIdentity = {
  code: "C1.ORD.02",
  strand_code: "C1.ORD",
  competency_code: "C1",
  name: "Đầu · giữa · cuối hàng",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["observe", "sequence"],
  tier: "basic",
  prerequisites: ["C2.ORI.05", "C2.ORI.06"],
  learning_objectives: [
    {
      code: "LO-C1.ORD.02-01",
      behaviour: "Nhận biết và thực hành Đầu · giữa · cuối hàng ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.ORD.02-02",
      behaviour: "Vận dụng Đầu · giữa · cuối hàng trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.ORD.02-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Đầu · giữa · cuối hàng",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_ORD_02_DATASET: SkillDataset = {
  skill_code: "C1.ORD.02",
  concept_label: "Đầu · giữa · cuối hàng",
  surface: "game",
  items: [
    {
      id: "ord02-i1",
      label: "xe đỏ đầu hàng",
      glyph: "1",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🚗",
      },
      category: {
        type: "đầu hàng",
        position: "start",
      },
      contrast_group: "start",
    },
    {
      id: "ord02-i2",
      label: "xe buýt gần đầu hàng",
      glyph: "2",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🚌",
      },
      category: {
        type: "đầu hàng",
        position: "start",
      },
      contrast_group: "start",
    },
    {
      id: "ord02-i3",
      label: "xe cảnh sát giữa hàng",
      glyph: "3",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🚓",
      },
      category: {
        type: "giữa hàng",
        position: "middle",
      },
      contrast_group: "middle",
    },
    {
      id: "ord02-i4",
      label: "xe cứu thương giữa hàng",
      glyph: "4",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🚑",
      },
      category: {
        type: "giữa hàng",
        position: "middle",
      },
      contrast_group: "middle",
    },
    {
      id: "ord02-i5",
      label: "xe cứu hoả gần cuối",
      glyph: "5",
      value: 5,
      image: {
        kind: "emoji",
        ref: "🚒",
      },
      category: {
        type: "cuối hàng",
        position: "end",
      },
      contrast_group: "end",
    },
    {
      id: "ord02-i6",
      label: "máy cày cuối hàng",
      glyph: "6",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🚜",
      },
      category: {
        type: "cuối hàng",
        position: "end",
      },
      contrast_group: "end",
    },
  ],
  relations: [
    {
      type: "sequence",
      source_id: "ord02-i1",
      target_id: "ord02-i3",
      metadata: {
        relation: "start_to_middle",
      },
    },
    {
      type: "sequence",
      source_id: "ord02-i3",
      target_id: "ord02-i6",
      metadata: {
        relation: "middle_to_end",
      },
    },
  ],
  axes: {
    position: {
      values: ["đầu hàng", "giữa hàng", "cuối hàng"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với đầu · giữa · cuối hàng",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng đầu · giữa · cuối hàng",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt đầu · giữa · cuối hàng với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi đầu · giữa · cuối hàng",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục đầu · giữa · cuối hàng và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn đúng {label} nhé!",
    narration_template: "Chúng mình cùng tìm hiểu về đầu, giữa, cuối hàng nhé",
  },
  ordering: [
    "ord02-i1",
    "ord02-i2",
    "ord02-i3",
    "ord02-i4",
    "ord02-i5",
    "ord02-i6",
  ],
};

export const C1_ORD_02_SEED: SkillSeed = {
  identity: C1_ORD_02_IDENTITY,
  dataset: C1_ORD_02_DATASET,
  levels: [
    {
      code: "GL-C1-ORD-TAP-0005",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-TAP-0006",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-TCNT-0005",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
  ],
};
