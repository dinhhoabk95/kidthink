import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_DAT_04_IDENTITY: SkillIdentity = {
  code: "C1.DAT.04",
  strand_code: "C1.DAT",
  competency_code: "C1",
  name: "Đọc bảng hai cột",
  age_min: 5,
  age_max: 6,
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
      id: "col_apple",
      label: "cột một quả táo",
      glyph: "1",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🍎",
      },
      ordering: 1,
      contrast_group: "quantity",
      category: {
        type: "cột trái cây",
        fruit: "táo",
      },
    },
    {
      id: "col_banana",
      label: "cột hai quả chuối",
      glyph: "2",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🍌",
      },
      ordering: 2,
      contrast_group: "quantity",
      category: {
        type: "cột trái cây",
        fruit: "chuối",
      },
    },
    {
      id: "col_orange",
      label: "cột ba quả cam",
      glyph: "3",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🍊",
      },
      ordering: 3,
      contrast_group: "quantity",
      category: {
        type: "cột trái cây",
        fruit: "cam",
      },
    },
    {
      id: "col_grape",
      label: "cột bốn chùm nho",
      glyph: "4",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🍇",
      },
      ordering: 4,
      contrast_group: "quantity",
      category: {
        type: "cột trái cây",
        fruit: "nho",
      },
    },
    {
      id: "col_strawberry",
      label: "cột năm quả dâu",
      glyph: "5",
      value: 5,
      image: {
        kind: "emoji",
        ref: "🍓",
      },
      ordering: 5,
      contrast_group: "quantity",
      category: {
        type: "cột trái cây",
        fruit: "dâu",
      },
    },
    {
      id: "col_watermelon",
      label: "cột sáu miếng dưa",
      glyph: "6",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🍉",
      },
      ordering: 6,
      contrast_group: "quantity",
      category: {
        type: "cột trái cây",
        fruit: "dưa",
      },
    },
  ],
  relations: [
    {
      type: "sequence",
      source_id: "col_apple",
      target_id: "col_banana",
    },
    {
      type: "sequence",
      source_id: "col_banana",
      target_id: "col_orange",
    },
    {
      type: "sequence",
      source_id: "col_orange",
      target_id: "col_grape",
    },
    {
      type: "sequence",
      source_id: "col_grape",
      target_id: "col_strawberry",
    },
    {
      type: "sequence",
      source_id: "col_strawberry",
      target_id: "col_watermelon",
    },
    {
      type: "contrast",
      source_id: "col_watermelon",
      target_id: "col_apple",
      metadata: {
        dimension: "count",
      },
    },
  ],
  axes: {
    count: {
      values: ["1", "2", "3", "4", "5", "6"],
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
    prompt_template: "Bé hãy chọn {label} nhé!",
    narration_template: "Chúng mình cùng tìm hiểu về đọc bảng hai cột nhé",
  },
  ordering: [
    "col_apple",
    "col_banana",
    "col_orange",
    "col_grape",
    "col_strawberry",
    "col_watermelon",
  ],
};

export const C1_DAT_04_SEED: SkillSeed = {
  identity: C1_DAT_04_IDENTITY,
  dataset: C1_DAT_04_DATASET,
  levels: [
    {
      code: "GL-C1-DAT-TAP-0014",
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
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
      code: "GL-C1-DAT-PAIR-0009",
      template: "GT-004",
      band: "5-6",
      difficulty: 3,
      theme: "weather",
      rounds: 3,
    },
  ],
};
