import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_DAT_04_IDENTITY: SkillIdentity = {
  code: "C1.DAT.04",
  strand_code: "C1.DAT",
  competency_code: "C1",
  name: "Đọc bảng hai cột",
  age_min: 6,
  age_max: 7,
  difficulty: 4,
  thinking_processes: ["observe", "compare"],
  tier: "advanced",
  prerequisites: ["C1.DAT.03"],
  learning_objectives: [
    {
      code: "LO-C1.DAT.04-01",
      behaviour: "Nhận biết và thực hành Đọc bảng hai cột ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.DAT.04-02",
      behaviour: "Vận dụng Đọc bảng hai cột trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.DAT.04-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Đọc bảng hai cột",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_DAT_04_DATASET: SkillDataset = {
  skill_code: "C1.DAT.04",
  concept_label: "Đọc bảng hai cột",
  surface: "game",
  items: [
    {
      id: "table_col_apple",
      label: "cột táo đỏ",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🍎",
      },
      contrast_group: "table",
      category: {
        count: "3",
      },
    },
    {
      id: "table_col_banana",
      label: "cột chuối vàng",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🍌",
      },
      contrast_group: "table",
      category: {
        count: "4",
      },
    },
    {
      id: "table_col_a",
      label: "cột số lượng nam",
      value: 5,
      image: {
        kind: "emoji",
        ref: "👦",
      },
      contrast_group: "table",
      category: {
        count: "5",
      },
    },
    {
      id: "table_col_b",
      label: "cột số lượng nữ",
      value: 6,
      image: {
        kind: "emoji",
        ref: "👧",
      },
      contrast_group: "table",
      category: {
        count: "6",
      },
    },
  ],
  relations: [
    {
      type: "sequence",
      source_id: "table_col_apple",
      target_id: "table_col_banana",
    },
    {
      type: "sequence",
      source_id: "table_col_a",
      target_id: "table_col_b",
    },
    {
      type: "contrast",
      source_id: "table_col_b",
      target_id: "table_col_a",
      metadata: {
        dimension: "gender_count",
      },
    },
  ],
  axes: {
    count: {
      values: ["3", "4", "5", "6"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với đọc bảng hai cột",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng đọc bảng hai cột",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt đọc bảng hai cột với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi đọc bảng hai cột",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục đọc bảng hai cột và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Bé đếm rồi biểu diễn số lượng {label} nhé!",
    narration_template: "Chúng mình cùng tìm hiểu về Đọc bảng hai cột nhé",
  },
};

export const C1_DAT_04_SEED: SkillSeed = {
  identity: C1_DAT_04_IDENTITY,
  dataset: C1_DAT_04_DATASET,
  levels: [
    {
      code: "GL-C1-DAT-TAP-0013",
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-TAP-0014",
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-TAP-0015",
      template: "GT-001",
      band: "5-6",
      difficulty: 5,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-TAP-0016",
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-TCNT-0013",
      template: "GT-002",
      band: "5-6",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-TCNT-0014",
      template: "GT-002",
      band: "5-6",
      difficulty: 4,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-TCNT-0015",
      template: "GT-002",
      band: "5-6",
      difficulty: 5,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-TCNT-0016",
      template: "GT-002",
      band: "5-6",
      difficulty: 3,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-TCMP-0013",
      template: "GT-003",
      band: "5-6",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-TCMP-0014",
      template: "GT-003",
      band: "5-6",
      difficulty: 4,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-TCMP-0015",
      template: "GT-003",
      band: "5-6",
      difficulty: 5,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-TCMP-0016",
      template: "GT-003",
      band: "5-6",
      difficulty: 3,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-PAIR-0009",
      template: "GT-004",
      band: "5-6",
      difficulty: 3,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-PAIR-0010",
      template: "GT-004",
      band: "5-6",
      difficulty: 4,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-PAIR-0011",
      template: "GT-004",
      band: "5-6",
      difficulty: 5,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-PAIR-0012",
      template: "GT-004",
      band: "5-6",
      difficulty: 3,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-PATT-0009",
      template: "GT-005",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-PATT-0010",
      template: "GT-005",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-PATT-0011",
      template: "GT-005",
      band: "5-6",
      difficulty: 5,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-PATT-0012",
      template: "GT-005",
      band: "5-6",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
  ],
};
