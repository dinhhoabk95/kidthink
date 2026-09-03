import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C6_ATT_02_IDENTITY: SkillIdentity = {
  code: "C6.ATT.02",
  strand_code: "C6.ATT",
  competency_code: "C6",
  name: "Tìm mục tiêu giữa nhiều vật",
  age_min: 3,
  age_max: 3,
  difficulty: 2,
  thinking_processes: ["observe"],
  tier: "basic",
  prerequisites: ["C4.VIS.02"],
  learning_objectives: [
    {
      code: "LO-C6.ATT.02-01",
      behaviour:
        "Nhận biết và thực hành Tìm mục tiêu giữa nhiều vật ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C6.ATT.02-02",
      behaviour:
        "Vận dụng Tìm mục tiêu giữa nhiều vật trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C6.ATT.02-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Tìm mục tiêu giữa nhiều vật",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C6_ATT_02_DATASET: SkillDataset = {
  skill_code: "C6.ATT.02",
  concept_label: "Tìm mục tiêu giữa nhiều vật",
  surface: "game",
  items: [
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
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Tìm mục tiêu giữa nhiều vật",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Tìm mục tiêu giữa nhiều vật",
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
      "Chúng mình cùng tìm hiểu về Tìm mục tiêu giữa nhiều vật nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["apple", "banana", "watermelon", "carrot", "corn"],
};

export const C6_ATT_02_SEED: SkillSeed = {
  identity: C6_ATT_02_IDENTITY,
  dataset: C6_ATT_02_DATASET,
  levels: [
    {
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
  ],
};
