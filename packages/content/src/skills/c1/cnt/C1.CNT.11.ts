import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_CNT_11_IDENTITY: SkillIdentity = {
  code: "C1.CNT.11",
  strand_code: "C1.CNT",
  competency_code: "C1",
  name: "Nhận biết nhanh số lượng (1–5)",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["observe", "count"],
  tier: "core",
  prerequisites: ["C1.CNT.01"],
  learning_objectives: [
    {
      code: "LO-C1.CNT.11-01",
      behaviour:
        "Nhận biết và thực hành Subitizing — nhận lượng tức thì (1–5) ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.CNT.11-02",
      behaviour:
        "Vận dụng Subitizing — nhận lượng tức thì (1–5) trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.CNT.11-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Subitizing — nhận lượng tức thì (1–5)",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_CNT_11_DATASET: SkillDataset = {
  skill_code: "C1.CNT.11",
  concept_label: "Nhận biết nhanh số lượng",
  surface: "game",
  items: [
    {
      id: "dot_1",
      label: "nhóm một chấm",
      glyph: "⚫",
      value: 1,
      contrast_group: "quantity",
      ordering: 1,
      category: {
        type: "chấm tròn nhỏ",
      },
      image: {
        kind: "emoji",
        ref: "⚫",
      },
    },
    {
      id: "dot_2",
      label: "nhóm hai chấm",
      glyph: "⚫⚫",
      value: 2,
      contrast_group: "quantity",
      ordering: 2,
      category: {
        type: "chấm tròn nhỏ",
      },
      image: {
        kind: "emoji",
        ref: "⚫",
      },
    },
    {
      id: "dot_3",
      label: "nhóm ba chấm",
      glyph: "⚫⚫⚫",
      value: 3,
      contrast_group: "quantity",
      ordering: 3,
      category: {
        type: "chấm tròn nhỏ",
      },
      image: {
        kind: "emoji",
        ref: "⚫",
      },
    },
    {
      id: "dot_4",
      label: "nhóm bốn chấm",
      glyph: "⚫⚫⚫⚫",
      value: 4,
      contrast_group: "quantity",
      ordering: 4,
      category: {
        type: "chấm tròn nhỏ",
      },
      image: {
        kind: "emoji",
        ref: "⚫",
      },
    },
    {
      id: "dot_5",
      label: "nhóm năm chấm",
      glyph: "⚫⚫⚫⚫⚫",
      value: 5,
      contrast_group: "quantity",
      ordering: 5,
      category: {
        type: "chấm tròn nhỏ",
      },
      image: {
        kind: "emoji",
        ref: "⚫",
      },
    },
  ],
  relations: [
    {
      type: "subset",
      source_id: "dot_1",
      target_id: "dot_5",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với nhận biết nhanh số lượng",
      representation: "discrete-object",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhìn nhanh và chọn đúng số lượng chấm",
      representation: "discrete-object",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt nhóm chấm với phương án nhiễu",
      representation: "ten-frame",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi nhận biết nhanh số lượng",
      representation: "ten-frame",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục nhận biết nhanh số lượng và tự làm một mình",
      representation: "ten-frame",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn {label} nhé!",
    narration_template: "Chúng mình cùng nhận biết nhanh số lượng nhé",
  },
  ordering: ["dot_1", "dot_2", "dot_3", "dot_4", "dot_5"],
};

export const C1_CNT_11_SEED: SkillSeed = {
  identity: C1_CNT_11_IDENTITY,
  dataset: C1_CNT_11_DATASET,
  levels: [
    {
      code: "GL-C1-SUB-FAST-0019",
      template: "GT-012",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-FAST-0020",
      template: "GT-012",
      band: "5-6",
      difficulty: 4,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-CNT-TAP-0037",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
  ],
};
