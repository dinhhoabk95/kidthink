import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_MEAS_09_IDENTITY: SkillIdentity = {
  code: "C1.MEAS.09",
  strand_code: "C1.MEAS",
  competency_code: "C1",
  name: "Đo bằng thước",
  age_min: 6,
  age_max: 6,
  difficulty: 4,
  thinking_processes: ["count", "verify"],
  tier: "advanced",
  prerequisites: ["C1.MEAS.08"],
  learning_objectives: [
    {
      code: "LO-C1.MEAS.09-01",
      behaviour: "Nhận biết và thực hành Đo bằng thước ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.MEAS.09-02",
      behaviour: "Vận dụng Đo bằng thước trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.MEAS.09-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Đo bằng thước",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_MEAS_09_DATASET: SkillDataset = {
  skill_code: "C1.MEAS.09",
  concept_label: "Đo bằng thước",
  surface: "game",
  items: [
    {
      id: "cup",
      label: "cái cốc",
      image: {
        kind: "emoji",
        ref: "🥤",
      },
      category: {
        type: "đồ dùng",
      },
    },
    {
      id: "bed",
      label: "cái giường",
      image: {
        kind: "emoji",
        ref: "🛏️",
      },
      category: {
        type: "đồ dùng",
      },
    },
    {
      id: "chair",
      label: "cái ghế",
      image: {
        kind: "emoji",
        ref: "🪑",
      },
      category: {
        type: "đồ dùng",
      },
    },
    {
      id: "apple",
      label: "quả táo",
      image: {
        kind: "emoji",
        ref: "🍎",
      },
      category: {
        type: "hoa quả",
      },
    },
    {
      id: "banana",
      label: "quả chuối",
      image: {
        kind: "emoji",
        ref: "🍌",
      },
      category: {
        type: "hoa quả",
      },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Đo bằng thước",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Đo bằng thước",
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
    narration_template: "Chúng mình cùng tìm hiểu về Đo bằng thước nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["cup", "bed", "chair", "apple", "banana"],
};

export const C1_MEAS_09_SEED: SkillSeed = {
  identity: C1_MEAS_09_IDENTITY,
  dataset: C1_MEAS_09_DATASET,
  levels: [
    {
      code: "GL-C1-RUL-SLOT-0001",
      template: "GT-008",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
      legacy_v1_ref: "D5-05",
    },
    {
      code: "GL-C1-RUL-SLOT-0002",
      template: "GT-008",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
      legacy_v1_ref: "D5-05",
    },
  ],
};
