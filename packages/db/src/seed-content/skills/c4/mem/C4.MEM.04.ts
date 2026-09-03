import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_MEM_04_IDENTITY: SkillIdentity = {
  code: "C4.MEM.04",
  strand_code: "C4.MEM",
  competency_code: "C4",
  name: "Nhớ chuỗi âm thanh",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["recall", "listen"],
  tier: "advanced",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C4.MEM.04-01",
      behaviour: "Nhận biết và thực hành Nhớ chuỗi âm thanh ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.MEM.04-02",
      behaviour: "Vận dụng Nhớ chuỗi âm thanh trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.MEM.04-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Nhớ chuỗi âm thanh",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_MEM_04_DATASET: SkillDataset = {
  skill_code: "C4.MEM.04",
  concept_label: "Nhớ chuỗi âm thanh",
  surface: "game",
  items: [
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
    {
      id: "corn",
      label: "bắp ngô",
      image: {
        kind: "emoji",
        ref: "🌽",
      },
      category: {
        type: "rau củ",
      },
    },
    {
      id: "dog",
      label: "con chó",
      image: {
        kind: "emoji",
        ref: "🐕",
      },
      category: {
        type: "động vật",
      },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Nhớ chuỗi âm thanh",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nhớ chuỗi âm thanh",
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
    narration_template: "Chúng mình cùng tìm hiểu về Nhớ chuỗi âm thanh nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["banana", "watermelon", "carrot", "corn", "dog"],
};

export const C4_MEM_04_SEED: SkillSeed = {
  identity: C4_MEM_04_IDENTITY,
  dataset: C4_MEM_04_DATASET,
  levels: [
    {
      template: "GT-005",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-009",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
  ],
};
