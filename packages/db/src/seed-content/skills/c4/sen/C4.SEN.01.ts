import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_SEN_01_IDENTITY: SkillIdentity = {
  code: "C4.SEN.01",
  strand_code: "C4.SEN",
  competency_code: "C4",
  name: "Phân biệt sắc độ màu",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["compare", "observe"],
  tier: "core",
  prerequisites: ["C4.DET.01"],
  learning_objectives: [
    {
      code: "LO-C4.SEN.01-01",
      behaviour: "Nhận biết và thực hành Phân biệt sắc độ màu ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.SEN.01-02",
      behaviour: "Vận dụng Phân biệt sắc độ màu trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.SEN.01-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Phân biệt sắc độ màu",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_SEN_01_DATASET: SkillDataset = {
  skill_code: "C4.SEN.01",
  concept_label: "Phân biệt sắc độ màu",
  surface: "game",
  items: [
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
    {
      id: "fish",
      label: "con cá",
      image: {
        kind: "emoji",
        ref: "🐟",
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
      description: "Làm quen cơ bản với Phân biệt sắc độ màu",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Phân biệt sắc độ màu",
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
    narration_template: "Chúng mình cùng tìm hiểu về Phân biệt sắc độ màu nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["dog", "cat", "chicken", "duck", "fish"],
};

export const C4_SEN_01_SEED: SkillSeed = {
  identity: C4_SEN_01_IDENTITY,
  dataset: C4_SEN_01_DATASET,
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
