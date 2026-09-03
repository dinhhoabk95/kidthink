import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_DAT_05_IDENTITY: SkillIdentity = {
  code: "C1.DAT.05",
  strand_code: "C1.DAT",
  competency_code: "C1",
  name: "Trả lời câu hỏi từ biểu đồ",
  age_min: 6,
  age_max: 7,
  difficulty: 4,
  thinking_processes: ["infer", "compare"],
  tier: "advanced",
  prerequisites: ["C1.DAT.03"],
  learning_objectives: [
    {
      code: "LO-C1.DAT.05-01",
      behaviour:
        "Nhận biết và thực hành Trả lời câu hỏi từ biểu đồ ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.DAT.05-02",
      behaviour:
        "Vận dụng Trả lời câu hỏi từ biểu đồ trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.DAT.05-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Trả lời câu hỏi từ biểu đồ",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_DAT_05_DATASET: SkillDataset = {
  skill_code: "C1.DAT.05",
  concept_label: "Trả lời câu hỏi từ biểu đồ",
  surface: "game",
  items: [
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
    {
      id: "cat",
      label: "con mèo",
      image: {
        kind: "emoji",
        ref: "🐈",
      },
      category: {
        type: "động vật",
      },
    },
    {
      id: "chicken",
      label: "con gà",
      image: {
        kind: "emoji",
        ref: "🐓",
      },
      category: {
        type: "động vật",
      },
    },
    {
      id: "duck",
      label: "con vịt",
      image: {
        kind: "emoji",
        ref: "🦆",
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
      description: "Làm quen cơ bản với Trả lời câu hỏi từ biểu đồ",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Trả lời câu hỏi từ biểu đồ",
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
      "Chúng mình cùng tìm hiểu về Trả lời câu hỏi từ biểu đồ nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["corn", "dog", "cat", "chicken", "duck"],
};

export const C1_DAT_05_SEED: SkillSeed = {
  identity: C1_DAT_05_IDENTITY,
  dataset: C1_DAT_05_DATASET,
  levels: [
    {
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-002",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
    {
      template: "GT-004",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-005",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
  ],
};
