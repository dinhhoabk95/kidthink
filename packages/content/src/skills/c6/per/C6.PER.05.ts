import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C6_PER_05_IDENTITY: SkillIdentity = {
  code: "C6.PER.05",
  strand_code: "C6.PER",
  competency_code: "C6",
  name: "Chịu chờ kết quả",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["inhibit", "predict"],
  tier: "advanced",
  prerequisites: ["C6.PER.03"],
  learning_objectives: [
    {
      code: "LO-C6.PER.05-01",
      behaviour: "Nhận biết và thực hành Chịu chờ kết quả ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C6.PER.05-02",
      behaviour: "Vận dụng Chịu chờ kết quả trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C6.PER.05-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Chịu chờ kết quả",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C6_PER_05_DATASET: SkillDataset = {
  skill_code: "C6.PER.05",
  concept_label: "Chịu chờ kết quả",
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
      description: "Làm quen cơ bản với Chịu chờ kết quả",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Chịu chờ kết quả",
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
    narration_template: "Chúng mình cùng tìm hiểu về Chịu chờ kết quả nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["banana", "watermelon", "carrot", "corn", "dog"],
};

export const C6_PER_05_SEED: SkillSeed = {
  identity: C6_PER_05_IDENTITY,
  dataset: C6_PER_05_DATASET,
  levels: [
    {
      code: "GL-C6-PER-DOTS-0001",
      template: "GT-011",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C6-PER-DOTS-0002",
      template: "GT-011",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C6-PER-MAZE-0005",
      template: "GT-013",
      band: "4-5",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C6-PER-MAZE-0006",
      template: "GT-013",
      band: "4-5",
      difficulty: 4,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C6-PER-DIFF-0001",
      template: "GT-014",
      band: "5-6",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C6-PER-DIFF-0002",
      template: "GT-014",
      band: "5-6",
      difficulty: 4,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C6-PER-ISO-0001",
      template: "GT-017",
      band: "5-6",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C6-PER-ISO-0002",
      template: "GT-017",
      band: "5-6",
      difficulty: 4,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C6-PER-BOND-0001",
      template: "GT-018",
      band: "4-5",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C6-PER-BOND-0002",
      template: "GT-018",
      band: "4-5",
      difficulty: 4,
      theme: "space",
      rounds: 3,
    },
  ],
};
