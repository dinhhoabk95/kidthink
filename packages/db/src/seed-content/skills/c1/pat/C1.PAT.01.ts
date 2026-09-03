import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_PAT_01_IDENTITY: SkillIdentity = {
  code: "C1.PAT.01",
  strand_code: "C1.PAT",
  competency_code: "C1",
  name: "Quy luật AB",
  age_min: 3,
  age_max: 3,
  difficulty: 1,
  thinking_processes: ["observe", "predict"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C1.PAT.01-01",
      behaviour: "Nhận biết và thực hành Quy luật AB ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.PAT.01-02",
      behaviour: "Vận dụng Quy luật AB trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.PAT.01-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Quy luật AB",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_PAT_01_DATASET: SkillDataset = {
  skill_code: "C1.PAT.01",
  concept_label: "Quy luật AB",
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
      description: "Làm quen cơ bản với Quy luật AB",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Quy luật AB",
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
    narration_template: "Chúng mình cùng tìm hiểu về Quy luật AB nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["banana", "watermelon", "carrot", "corn", "dog"],
};

export const C1_PAT_01_SEED: SkillSeed = {
  identity: C1_PAT_01_IDENTITY,
  dataset: C1_PAT_01_DATASET,
  levels: [
    {
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-008",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
  ],
};
