import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C3_SEQ_04_IDENTITY: SkillIdentity = {
  code: "C3.SEQ.04",
  strand_code: "C3.SEQ",
  competency_code: "C3",
  name: "Chuỗi câu chuyện",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["sequence", "infer"],
  tier: "advanced",
  prerequisites: ["C3.SEQ.03"],
  learning_objectives: [
    {
      code: "LO-C3.SEQ.04-01",
      behaviour: "Nhận biết và thực hành Chuỗi câu chuyện ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C3.SEQ.04-02",
      behaviour: "Vận dụng Chuỗi câu chuyện trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C3.SEQ.04-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Chuỗi câu chuyện",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C3_SEQ_04_DATASET: SkillDataset = {
  skill_code: "C3.SEQ.04",
  concept_label: "Chuỗi câu chuyện",
  surface: "game",
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
      description: "Làm quen cơ bản với Chuỗi câu chuyện",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Chuỗi câu chuyện",
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
    narration_template: "Chúng mình cùng tìm hiểu về Chuỗi câu chuyện nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["chair", "apple", "banana", "watermelon", "carrot"],
};

export const C3_SEQ_04_SEED: SkillSeed = {
  identity: C3_SEQ_04_IDENTITY,
  dataset: C3_SEQ_04_DATASET,
  levels: [
    {
      template: "GT-004",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-006",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
  ],
};
