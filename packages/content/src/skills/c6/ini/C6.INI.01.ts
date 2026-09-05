import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C6_INI_01_IDENTITY: SkillIdentity = {
  code: "C6.INI.01",
  strand_code: "C6.INI",
  competency_code: "C6",
  name: "Tự chọn hoạt động",
  age_min: 3,
  age_max: 3,
  difficulty: 2,
  thinking_processes: ["plan", "describe"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C6.INI.01-01",
      behaviour: "Nhận biết và thực hành Tự chọn hoạt động ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C6.INI.01-02",
      behaviour: "Vận dụng Tự chọn hoạt động trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C6.INI.01-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Tự chọn hoạt động",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C6_INI_01_DATASET: SkillDataset = {
  skill_code: "C6.INI.01",
  concept_label: "Tự chọn hoạt động",
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
      description: "Làm quen cơ bản với Tự chọn hoạt động",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Tự chọn hoạt động",
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
    narration_template: "Chúng mình cùng tìm hiểu về Tự chọn hoạt động nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["banana", "watermelon", "carrot", "corn", "dog"],
};

export const C6_INI_01_SEED: SkillSeed = {
  identity: C6_INI_01_IDENTITY,
  dataset: C6_INI_01_DATASET,
  levels: [
    {
      code: "GL-C6-INI-SHAD-0001",
      template: "GT-007",
      band: "3-4",
      difficulty: 1,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C6-INI-SHAD-0002",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C6-INI-SHAD-0003",
      template: "GT-007",
      band: "3-4",
      difficulty: 3,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C6-INI-SHAD-0004",
      template: "GT-007",
      band: "3-4",
      difficulty: 1,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C6-INI-SHAD-0005",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C6-INI-GRID-0001",
      template: "GT-020",
      band: "3-4",
      difficulty: 1,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C6-INI-GRID-0002",
      template: "GT-020",
      band: "3-4",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C6-INI-GRID-0003",
      template: "GT-020",
      band: "3-4",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C6-INI-GRID-0004",
      template: "GT-020",
      band: "3-4",
      difficulty: 1,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C6-INI-GRID-0005",
      template: "GT-020",
      band: "3-4",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
    },
  ],
};
