import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C6_PER_02_IDENTITY: SkillIdentity = {
  code: "C6.PER.02",
  strand_code: "C6.PER",
  competency_code: "C6",
  name: "Thử lại sau khi sai",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["verify", "plan"],
  tier: "core",
  prerequisites: ["C6.PER.01"],
  learning_objectives: [
    {
      code: "LO-C6.PER.02-01",
      behaviour: "Nhận biết và thực hành Thử lại sau khi sai ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C6.PER.02-02",
      behaviour: "Vận dụng Thử lại sau khi sai trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C6.PER.02-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Thử lại sau khi sai",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C6_PER_02_DATASET: SkillDataset = {
  skill_code: "C6.PER.02",
  concept_label: "Thử lại sau khi sai",
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
      description: "Làm quen cơ bản với Thử lại sau khi sai",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Thử lại sau khi sai",
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
    narration_template: "Chúng mình cùng tìm hiểu về Thử lại sau khi sai nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["bed", "chair", "apple", "banana", "watermelon"],
};

export const C6_PER_02_SEED: SkillSeed = {
  identity: C6_PER_02_IDENTITY,
  dataset: C6_PER_02_DATASET,
  levels: [
    {
      template: "GT-007",
      band: "4-5",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-009",
      band: "4-5",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
  ],
};
