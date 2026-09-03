import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_DES_04_IDENTITY: SkillIdentity = {
  code: "C5.DES.04",
  strand_code: "C5.DES",
  competency_code: "C5",
  name: "Giải thích lý do chọn",
  age_min: 6,
  age_max: 6,
  difficulty: 5,
  thinking_processes: ["describe", "deduce"],
  tier: "advanced",
  prerequisites: ["C3.DED.03"],
  learning_objectives: [
    {
      code: "LO-C5.DES.04-01",
      behaviour: "Nhận biết và thực hành Giải thích lý do chọn ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.DES.04-02",
      behaviour: "Vận dụng Giải thích lý do chọn trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.DES.04-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Giải thích lý do chọn",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_DES_04_DATASET: SkillDataset = {
  skill_code: "C5.DES.04",
  concept_label: "Giải thích lý do chọn",
  surface: "worksheet",
  items: [
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
    {
      id: "carrot",
      label: "củ cà rốt",
      image: {
        kind: "emoji",
        ref: "🥕",
      },
      category: {
        type: "rau củ",
      },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Giải thích lý do chọn",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Giải thích lý do chọn",
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
    narration_template: "Chúng mình cùng tìm hiểu về Giải thích lý do chọn nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["chair", "apple", "banana", "watermelon", "carrot"],
};

export const C5_DES_04_SEED: SkillSeed = {
  identity: C5_DES_04_IDENTITY,
  dataset: C5_DES_04_DATASET,
  levels: [],
};
