import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_STO_02_IDENTITY: SkillIdentity = {
  code: "C5.STO.02",
  strand_code: "C5.STO",
  competency_code: "C5",
  name: "Sắp xếp tranh theo trình tự truyện",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["sequence", "infer"],
  tier: "advanced",
  prerequisites: ["C3.SEQ.04"],
  learning_objectives: [
    {
      code: "LO-C5.STO.02-01",
      behaviour:
        "Nhận biết và thực hành Sắp xếp tranh theo trình tự truyện ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.STO.02-02",
      behaviour:
        "Vận dụng Sắp xếp tranh theo trình tự truyện trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.STO.02-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Sắp xếp tranh theo trình tự truyện",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_STO_02_DATASET: SkillDataset = {
  skill_code: "C5.STO.02",
  concept_label: "Sắp xếp tranh theo trình tự truyện",
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
      description: "Làm quen cơ bản với Sắp xếp tranh theo trình tự truyện",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Sắp xếp tranh theo trình tự truyện",
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
      "Chúng mình cùng tìm hiểu về Sắp xếp tranh theo trình tự truyện nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["banana", "watermelon", "carrot", "corn", "dog"],
};

export const C5_STO_02_SEED: SkillSeed = {
  identity: C5_STO_02_IDENTITY,
  dataset: C5_STO_02_DATASET,
  levels: [
    {
      code: "GL-C5-SUB-FAST-0016",
      template: "GT-012",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-STO-PAIR-0001",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-STO-PAIR-0002",
      template: "GT-004",
      band: "4-5",
      difficulty: 4,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C5-STO-SORT-0001",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C5-STO-SORT-0002",
      template: "GT-006",
      band: "5-6",
      difficulty: 4,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C5-STO-SHAD-0001",
      template: "GT-007",
      band: "4-5",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C5-STO-SHAD-0002",
      template: "GT-007",
      band: "4-5",
      difficulty: 4,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C5-STO-SLOT-0001",
      template: "GT-008",
      band: "4-5",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C5-STO-SLOT-0002",
      template: "GT-008",
      band: "4-5",
      difficulty: 4,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C5-STO-SIZE-0003",
      template: "GT-009",
      band: "4-5",
      difficulty: 3,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-STO-SIZE-0004",
      template: "GT-009",
      band: "4-5",
      difficulty: 4,
      theme: "body",
      rounds: 3,
    },
  ],
};
