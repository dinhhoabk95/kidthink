import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C3_ALG_02_IDENTITY: SkillIdentity = {
  code: "C3.ALG.02",
  strand_code: "C3.ALG",
  competency_code: "C3",
  name: "Làm theo chuỗi 3–4 lệnh",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["sequence", "plan"],
  tier: "core",
  prerequisites: ["C3.ALG.01"],
  learning_objectives: [
    {
      code: "LO-C3.ALG.02-01",
      behaviour: "Nhận biết và thực hành Làm theo chuỗi 3–4 lệnh ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C3.ALG.02-02",
      behaviour: "Vận dụng Làm theo chuỗi 3–4 lệnh trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C3.ALG.02-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Làm theo chuỗi 3–4 lệnh",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C3_ALG_02_DATASET: SkillDataset = {
  skill_code: "C3.ALG.02",
  concept_label: "Làm theo chuỗi 3–4 lệnh",
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
      description: "Làm quen cơ bản với Làm theo chuỗi 3–4 lệnh",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Làm theo chuỗi 3–4 lệnh",
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
    narration_template:
      "Chúng mình cùng tìm hiểu về Làm theo chuỗi 3–4 lệnh nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["bed", "chair", "apple", "banana", "watermelon"],
};

export const C3_ALG_02_SEED: SkillSeed = {
  identity: C3_ALG_02_IDENTITY,
  dataset: C3_ALG_02_DATASET,
  levels: [
    {
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-007",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
  ],
};
