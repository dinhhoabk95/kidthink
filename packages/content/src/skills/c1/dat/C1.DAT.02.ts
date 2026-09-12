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
      id: "bar_block_2",
      label: "cột hai khối",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🧱",
      },
      contrast_group: "bar",
      category: {
        bar_height: "2",
      },
    },
    {
      id: "bar_block_3",
      label: "cột ba khối",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🧱",
      },
      contrast_group: "bar",
      category: {
        bar_height: "3",
      },
    },
    {
      id: "bar_block_4",
      label: "cột bốn khối",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🧱",
      },
      contrast_group: "bar",
      category: {
        bar_height: "4",
      },
    },
    {
      id: "bar_block_5",
      label: "cột năm khối",
      value: 5,
      image: {
        kind: "emoji",
        ref: "🧱",
      },
      contrast_group: "bar",
      category: {
        bar_height: "5",
      },
    },
  ],
  relations: [
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
      type: "contrast",
      source_id: "bar_block_5",
      target_id: "bar_block_2",
      metadata: {
        dimension: "height",
      },
    },
  ],
  axes: {
    bar_height: {
      values: ["2", "3", "4", "5"],
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
    prompt_template: "Bé đếm rồi biểu diễn số lượng {label} nhé!",
    narration_template:
      "Chúng mình cùng tìm hiểu về Biểu đồ cột bằng đồ vật nhé",
  },
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
      code: "GL-C1-DAT-TAP-0006",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-TAP-0007",
      template: "GT-001",
      band: "4-5",
      difficulty: 4,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-TAP-0008",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-TCNT-0005",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-TCNT-0006",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-TCNT-0007",
      template: "GT-002",
      band: "4-5",
      difficulty: 4,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-TCNT-0008",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "homeland",
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
    {
      code: "GL-C1-DAT-TCMP-0008",
      template: "GT-003",
      band: "4-5",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-PAIR-0001",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-PAIR-0002",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-PAIR-0003",
      template: "GT-004",
      band: "4-5",
      difficulty: 4,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-PAIR-0004",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-PATT-0001",
      template: "GT-005",
      band: "4-5",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-PATT-0002",
      template: "GT-005",
      band: "4-5",
      difficulty: 3,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-PATT-0003",
      template: "GT-005",
      band: "4-5",
      difficulty: 4,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-PATT-0004",
      template: "GT-005",
      band: "4-5",
      difficulty: 2,
      theme: "body",
      rounds: 3,
    },
  ],
};
