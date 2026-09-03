import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_TOO_01_IDENTITY: SkillIdentity = {
  code: "C4.TOO.01",
  strand_code: "C4.TOO",
  competency_code: "C4",
  name: "Ngồi đúng, nghỉ mắt",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["plan", "inhibit"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C4.TOO.01-01",
      behaviour: "Nhận biết và thực hành Ngồi đúng, nghỉ mắt ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.TOO.01-02",
      behaviour: "Vận dụng Ngồi đúng, nghỉ mắt trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.TOO.01-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Ngồi đúng, nghỉ mắt",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_TOO_01_DATASET: SkillDataset = {
  skill_code: "C4.TOO.01",
  concept_label: "Ngồi đúng, nghỉ mắt",
  surface: "game",
  items: [
    {
      id: "bowl",
      label: "cái bát",
      image: {
        kind: "emoji",
        ref: "🥣",
      },
      category: {
        type: "đồ dùng",
      },
    },
    {
      id: "spoon",
      label: "cái thìa",
      image: {
        kind: "emoji",
        ref: "🥄",
      },
      category: {
        type: "đồ dùng",
      },
    },
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
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Ngồi đúng, nghỉ mắt",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Ngồi đúng, nghỉ mắt",
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
    narration_template: "Chúng mình cùng tìm hiểu về Ngồi đúng, nghỉ mắt nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["bowl", "spoon", "cup", "bed", "chair"],
};

export const C4_TOO_01_SEED: SkillSeed = {
  identity: C4_TOO_01_IDENTITY,
  dataset: C4_TOO_01_DATASET,
  levels: [
    {
      template: "GT-007",
      band: "4-5",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-009",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
  ],
};
