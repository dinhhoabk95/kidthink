import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C3_SEQ_01_IDENTITY: SkillIdentity = {
  code: "C3.SEQ.01",
  strand_code: "C3.SEQ",
  competency_code: "C3",
  name: "Chuỗi hình",
  age_min: 3,
  age_max: 3,
  difficulty: 2,
  thinking_processes: ["sequence", "predict"],
  tier: "basic",
  prerequisites: ["C1.PAT.09"],
  learning_objectives: [
    {
      code: "LO-C3.SEQ.01-01",
      behaviour: "Nhận biết và thực hành Chuỗi hình ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C3.SEQ.01-02",
      behaviour: "Vận dụng Chuỗi hình trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C3.SEQ.01-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Chuỗi hình",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C3_SEQ_01_DATASET: SkillDataset = {
  skill_code: "C3.SEQ.01",
  concept_label: "Chuỗi hình",
  surface: "game",
  items: [
    {
      id: "day_sunrise",
      label: "mặt trời mọc",
      image: {
        kind: "emoji",
        ref: "🌅",
      },
      category: {
        type: "buổi sáng sớm",
        color: "yellow",
        shape: "circle",
        size: "large",
      },
      contrast_group: "morning",
      value: 1,
      ordering: 1,
    },
    {
      id: "day_brush",
      label: "bé đánh răng",
      image: {
        kind: "emoji",
        ref: "🪥",
      },
      category: {
        type: "buổi sáng sớm",
        color: "blue",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "morning",
      value: 2,
      ordering: 2,
    },
    {
      id: "day_breakfast",
      label: "bé ăn sáng",
      image: {
        kind: "emoji",
        ref: "🥣",
      },
      category: {
        type: "buổi sáng sớm",
        color: "yellow",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "morning",
      value: 3,
      ordering: 3,
    },
    {
      id: "day_school",
      label: "bé đến trường",
      image: {
        kind: "emoji",
        ref: "🏫",
      },
      category: {
        type: "buổi chiều tối",
        color: "red",
        shape: "square",
        size: "large",
      },
      contrast_group: "evening",
      value: 4,
      ordering: 4,
    },
    {
      id: "day_play",
      label: "bé chơi bóng",
      image: {
        kind: "emoji",
        ref: "⚽",
      },
      category: {
        type: "buổi chiều tối",
        color: "yellow",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "evening",
      value: 5,
      ordering: 5,
    },
    {
      id: "day_sleep",
      label: "bé đi ngủ",
      image: {
        kind: "emoji",
        ref: "🛏️",
      },
      category: {
        type: "buổi chiều tối",
        color: "blue",
        shape: "rectangle",
        size: "large",
      },
      contrast_group: "evening",
      value: 6,
      ordering: 6,
    },
  ],
  relations: [
    {
      type: "sequence",
      source_id: "day_sunrise",
      target_id: "day_brush",
      explanation: "mặt trời mọc rồi bé đánh răng",
    },
    {
      type: "sequence",
      source_id: "day_brush",
      target_id: "day_breakfast",
      explanation: "đánh răng xong rồi bé ăn sáng",
    },
    {
      type: "sequence",
      source_id: "day_breakfast",
      target_id: "day_school",
      explanation: "ăn sáng xong rồi bé đến trường",
    },
    {
      type: "sequence",
      source_id: "day_school",
      target_id: "day_play",
      explanation: "học xong bé chơi bóng vui vẻ",
    },
    {
      type: "sequence",
      source_id: "day_play",
      target_id: "day_sleep",
      explanation: "chơi bóng xong bé về đi ngủ",
    },
  ],
  axes: {
    type: ["buổi sáng sớm", "buổi chiều tối"],
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với chuỗi hình",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng chuỗi hình",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi và số lượng",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục và độc lập thực hiện",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn đúng {label} nhé!",
    narration_template: "Chúng mình cùng sắp xếp các hoạt động trong ngày nhé",
  },
  ordering: [
    "day_sunrise",
    "day_brush",
    "day_breakfast",
    "day_school",
    "day_play",
    "day_sleep",
  ],
};

export const C3_SEQ_01_SEED: SkillSeed = {
  identity: C3_SEQ_01_IDENTITY,
  dataset: C3_SEQ_01_DATASET,
  levels: [
    {
      code: "GL-C3-PAT-CARD-0001",
      template: "GT-012",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C3-SUB-FAST-0013",
      template: "GT-012",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C3-VIS-SPOT-0030",
      template: "GT-025",
      band: "4-5",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C3-MUL-BSK-0009",
      template: "GT-003",
      band: "5-6",
      difficulty: 3,
      theme: "space",
      rounds: 3,
    },
  ],
};
