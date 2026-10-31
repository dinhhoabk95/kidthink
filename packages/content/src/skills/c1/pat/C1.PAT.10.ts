import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_PAT_10_IDENTITY: SkillIdentity = {
  code: "C1.PAT.10",
  strand_code: "C1.PAT",
  competency_code: "C1",
  name: "Quy luật màu sắc",
  age_min: 3,
  age_max: 3,
  difficulty: 1,
  thinking_processes: ["observe", "predict"],
  tier: "basic",
  prerequisites: ["C1.PAT.01"],
  learning_objectives: [
    {
      code: "LO-C1.PAT.10-01",
      behaviour: "Nhận biết và thực hành Pattern màu ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.PAT.10-02",
      behaviour: "Vận dụng Pattern màu trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.PAT.10-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Pattern màu",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_PAT_10_DATASET: SkillDataset = {
  skill_code: "C1.PAT.10",
  concept_label: "Quy luật màu sắc",
  surface: "game",
  items: [
    {
      id: "pat_red",
      label: "chấm tròn đỏ",
      glyph: "A1",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🔴",
      },
      contrast_group: "circle_color",
      category: {
        type: "màu chấm tròn",
        color: "red",
      },
    },
    {
      id: "pat_blue",
      label: "chấm tròn xanh dương",
      glyph: "B1",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🔵",
      },
      contrast_group: "circle_color",
      category: {
        type: "màu chấm tròn",
        color: "blue",
      },
    },
    {
      id: "pat_yellow",
      label: "chấm tròn vàng",
      glyph: "C1",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🟡",
      },
      contrast_group: "circle_color",
      category: {
        type: "màu chấm tròn",
        color: "yellow",
      },
    },
    {
      id: "pat_red_2",
      label: "ô vuông đỏ",
      glyph: "A2",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🟥",
      },
      contrast_group: "square_color",
      category: {
        type: "màu ô vuông",
        color: "red",
      },
    },
    {
      id: "pat_blue_2",
      label: "ô vuông xanh dương",
      glyph: "B2",
      value: 5,
      image: {
        kind: "emoji",
        ref: "🟦",
      },
      contrast_group: "square_color",
      category: {
        type: "màu ô vuông",
        color: "blue",
      },
    },
    {
      id: "pat_yellow_2",
      label: "ô vuông vàng",
      glyph: "C2",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🟨",
      },
      contrast_group: "square_color",
      category: {
        type: "màu ô vuông",
        color: "yellow",
      },
    },
  ],
  relations: [
    {
      type: "sequence",
      source_id: "pat_red",
      target_id: "pat_blue",
    },
    {
      type: "sequence",
      source_id: "pat_blue",
      target_id: "pat_yellow",
    },
    {
      type: "sequence",
      source_id: "pat_yellow",
      target_id: "pat_red_2",
    },
    {
      type: "sequence",
      source_id: "pat_red_2",
      target_id: "pat_blue_2",
    },
    {
      type: "sequence",
      source_id: "pat_blue_2",
      target_id: "pat_yellow_2",
    },
  ],
  axes: {
    color: {
      values: ["red", "blue", "yellow"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với quy luật màu sắc",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng quy luật màu sắc",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt quy luật màu sắc với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi quy luật màu sắc",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục quy luật màu sắc và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn đúng {label} nhé!",
    narration_template: "Chúng mình cùng tìm hiểu về Quy luật màu sắc nhé!",
  },
  ordering: [
    "pat_red",
    "pat_blue",
    "pat_yellow",
    "pat_red_2",
    "pat_blue_2",
    "pat_yellow_2",
  ],
};

export const C1_PAT_10_SEED: SkillSeed = {
  identity: C1_PAT_10_IDENTITY,
  dataset: C1_PAT_10_DATASET,
  levels: [
    {
      code: "GL-C1-PAT-TAP-0025",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-TAP-0026",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-TCMP-0025",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
  ],
};
