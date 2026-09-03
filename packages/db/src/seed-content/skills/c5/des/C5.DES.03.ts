import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_DES_03_IDENTITY: SkillIdentity = {
  code: "C5.DES.03",
  strand_code: "C5.DES",
  competency_code: "C5",
  name: "So sánh bằng lời",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["describe", "compare"],
  tier: "core",
  prerequisites: ["C1.CMP.01", "C5.DES.01"],
  learning_objectives: [
    {
      code: "LO-C5.DES.03-01",
      behaviour: "Nhận biết và thực hành So sánh bằng lời ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.DES.03-02",
      behaviour: "Vận dụng So sánh bằng lời trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.DES.03-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới So sánh bằng lời",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_DES_03_DATASET: SkillDataset = {
  skill_code: "C5.DES.03",
  concept_label: "So sánh bằng lời",
  surface: "game",
  items: [
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
    {
      id: "watermelon",
      label: "dưa hấu",
      image: {
        kind: "emoji",
        ref: "🍉",
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
      description: "Làm quen cơ bản với So sánh bằng lời",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng So sánh bằng lời",
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
    narration_template: "Chúng mình cùng tìm hiểu về So sánh bằng lời nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["bed", "chair", "apple", "banana", "watermelon"],
};

export const C5_DES_03_SEED: SkillSeed = {
  identity: C5_DES_03_IDENTITY,
  dataset: C5_DES_03_DATASET,
  levels: [
    {
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
  ],
};
