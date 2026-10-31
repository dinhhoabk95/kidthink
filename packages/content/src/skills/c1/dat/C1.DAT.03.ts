import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_DAT_03_IDENTITY: SkillIdentity = {
  code: "C1.DAT.03",
  strand_code: "C1.DAT",
  competency_code: "C1",
  name: "So cột cao – thấp",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["compare", "observe"],
  tier: "core",
  prerequisites: ["C1.DAT.02", "C1.CMP.08"],
  learning_objectives: [
    {
      code: "LO-C1.DAT.03-01",
      behaviour: "Nhận biết và thực hành So cột cao – thấp ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.DAT.03-02",
      behaviour: "Vận dụng So cột cao – thấp trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.DAT.03-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới So cột cao – thấp",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_DAT_03_DATASET: SkillDataset = {
  skill_code: "C1.DAT.03",
  concept_label: "So cột cao – thấp",
  surface: "game",
  items: [
    {
      id: "col_1",
      label: "cột vàng thấp",
      glyph: "1",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🟨",
      },
      ordering: 1,
      contrast_group: "height_short",
      category: {
        type: "cột màu thấp",
        height: "thấp",
      },
    },
    {
      id: "col_2",
      label: "cột đỏ thấp",
      glyph: "2",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🟥",
      },
      ordering: 2,
      contrast_group: "height_short",
      category: {
        type: "cột màu thấp",
        height: "thấp",
      },
    },
    {
      id: "col_3",
      label: "cột xanh vừa",
      glyph: "3",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🟦",
      },
      ordering: 3,
      contrast_group: "height_medium",
      category: {
        type: "cột màu vừa",
        height: "vừa",
      },
    },
    {
      id: "col_4",
      label: "cột tím cao",
      glyph: "4",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🟪",
      },
      ordering: 4,
      contrast_group: "height_tall",
      category: {
        type: "cột màu cao",
        height: "cao",
      },
    },
    {
      id: "col_5",
      label: "cột cam cao",
      glyph: "5",
      value: 5,
      image: {
        kind: "emoji",
        ref: "🟧",
      },
      ordering: 5,
      contrast_group: "height_tall",
      category: {
        type: "cột màu cao",
        height: "cao",
      },
    },
    {
      id: "col_6",
      label: "cột lục cao",
      glyph: "6",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🟩",
      },
      ordering: 6,
      contrast_group: "height_tall",
      category: {
        type: "cột màu cao",
        height: "cao",
      },
    },
  ],
  relations: [
    {
      type: "sequence",
      source_id: "col_1",
      target_id: "col_2",
    },
    {
      type: "sequence",
      source_id: "col_2",
      target_id: "col_3",
    },
    {
      type: "sequence",
      source_id: "col_3",
      target_id: "col_4",
    },
    {
      type: "sequence",
      source_id: "col_4",
      target_id: "col_5",
    },
    {
      type: "sequence",
      source_id: "col_5",
      target_id: "col_6",
    },
    {
      type: "contrast",
      source_id: "col_6",
      target_id: "col_1",
      metadata: {
        dimension: "height",
      },
    },
  ],
  axes: {
    height: {
      values: ["thấp", "vừa", "cao"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với so cột cao – thấp",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng so cột cao – thấp",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt so cột cao – thấp với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi so cột cao – thấp",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục so cột cao – thấp và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn {label} nhé!",
    narration_template: "Chúng mình cùng tìm hiểu về so sánh cột cao thấp nhé",
  },
  ordering: ["col_1", "col_2", "col_3", "col_4", "col_5", "col_6"],
};

export const C1_DAT_03_SEED: SkillSeed = {
  identity: C1_DAT_03_IDENTITY,
  dataset: C1_DAT_03_DATASET,
  levels: [
    {
      code: "GL-C1-DAT-TAP-0009",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-MIR-0001",
      template: "GT-021",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-SPOT-0001",
      template: "GT-025",
      band: "5-6",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
  ],
};
