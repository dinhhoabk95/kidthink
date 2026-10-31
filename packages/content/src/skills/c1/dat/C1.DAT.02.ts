import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_DAT_02_IDENTITY: SkillIdentity = {
  code: "C1.DAT.02",
  strand_code: "C1.DAT",
  competency_code: "C1",
  name: "Biểu đồ cột bằng đồ vật",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["count", "compare"],
  tier: "core",
  prerequisites: ["C1.DAT.01", "C1.OTO.01"],
  learning_objectives: [
    {
      code: "LO-C1.DAT.02-01",
      behaviour: "Nhận biết và thực hành Biểu đồ cột bằng đồ vật ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.DAT.02-02",
      behaviour: "Vận dụng Biểu đồ cột bằng đồ vật trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.DAT.02-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Biểu đồ cột bằng đồ vật",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_DAT_02_DATASET: SkillDataset = {
  skill_code: "C1.DAT.02",
  concept_label: "Biểu đồ cột bằng đồ vật",
  surface: "game",
  items: [
    {
      id: "bar_block_1",
      label: "cột một khối",
      glyph: "1",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🟥",
      },
      ordering: 1,
      contrast_group: "height_short",
      category: {
        type: "cột khối thấp",
        bar_height: "1",
      },
    },
    {
      id: "bar_block_2",
      label: "cột hai khối",
      glyph: "2",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🟧",
      },
      ordering: 2,
      contrast_group: "height_short",
      category: {
        type: "cột khối thấp",
        bar_height: "2",
      },
    },
    {
      id: "bar_block_3",
      label: "cột ba khối",
      glyph: "3",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🟨",
      },
      ordering: 3,
      contrast_group: "height_medium",
      category: {
        type: "cột khối vừa",
        bar_height: "3",
      },
    },
    {
      id: "bar_block_4",
      label: "cột bốn khối",
      glyph: "4",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🟩",
      },
      ordering: 4,
      contrast_group: "height_medium",
      category: {
        type: "cột khối vừa",
        bar_height: "4",
      },
    },
    {
      id: "bar_block_5",
      label: "cột năm khối",
      glyph: "5",
      value: 5,
      image: {
        kind: "emoji",
        ref: "🟦",
      },
      ordering: 5,
      contrast_group: "height_tall",
      category: {
        type: "cột khối cao",
        bar_height: "5",
      },
    },
    {
      id: "bar_block_6",
      label: "cột sáu khối",
      glyph: "6",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🟪",
      },
      ordering: 6,
      contrast_group: "height_tall",
      category: {
        type: "cột khối cao",
        bar_height: "6",
      },
    },
  ],
  relations: [
    {
      type: "sequence",
      source_id: "bar_block_1",
      target_id: "bar_block_2",
    },
    {
      type: "sequence",
      source_id: "bar_block_2",
      target_id: "bar_block_3",
    },
    {
      type: "sequence",
      source_id: "bar_block_3",
      target_id: "bar_block_4",
    },
    {
      type: "sequence",
      source_id: "bar_block_4",
      target_id: "bar_block_5",
    },
    {
      type: "sequence",
      source_id: "bar_block_5",
      target_id: "bar_block_6",
    },
    {
      type: "contrast",
      source_id: "bar_block_6",
      target_id: "bar_block_1",
      metadata: {
        dimension: "height",
      },
    },
  ],
  axes: {
    bar_height: {
      values: ["1", "2", "3", "4", "5", "6"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với biểu đồ cột bằng đồ vật",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng biểu đồ cột bằng đồ vật",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt biểu đồ cột bằng đồ vật với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi biểu đồ cột bằng đồ vật",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục biểu đồ cột bằng đồ vật và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn {label} nhé!",
    narration_template:
      "Chúng mình cùng tìm hiểu về biểu đồ cột bằng đồ vật nhé",
  },
  ordering: [
    "bar_block_1",
    "bar_block_2",
    "bar_block_3",
    "bar_block_4",
    "bar_block_5",
    "bar_block_6",
  ],
};

export const C1_DAT_02_SEED: SkillSeed = {
  identity: C1_DAT_02_IDENTITY,
  dataset: C1_DAT_02_DATASET,
  levels: [
    {
      code: "GL-C1-DAT-TAP-0005",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-TCMP-0005",
      template: "GT-003",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-TCMP-0006",
      template: "GT-003",
      band: "4-5",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-TCMP-0007",
      template: "GT-003",
      band: "4-5",
      difficulty: 4,
      theme: "home",
      rounds: 3,
    },
  ],
};
