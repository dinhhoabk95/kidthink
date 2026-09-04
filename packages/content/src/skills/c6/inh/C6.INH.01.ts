import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C6_INH_01_IDENTITY: SkillIdentity = {
  code: "C6.INH.01",
  strand_code: "C6.INH",
  competency_code: "C6",
  name: "Không chọn màu bị cấm",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["inhibit"],
  tier: "core",
  prerequisites: ["C3.CLS.01"],
  learning_objectives: [
    {
      code: "LO-C6.INH.01-01",
      behaviour: "Nhận biết và thực hành Không chọn màu bị cấm ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C6.INH.01-02",
      behaviour: "Vận dụng Không chọn màu bị cấm trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C6.INH.01-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Không chọn màu bị cấm",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C6_INH_01_DATASET: SkillDataset = {
  skill_code: "C6.INH.01",
  concept_label: "Không chọn màu bị cấm",
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
      description: "Làm quen cơ bản với Không chọn màu bị cấm",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Không chọn màu bị cấm",
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
    narration_template: "Chúng mình cùng tìm hiểu về Không chọn màu bị cấm nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["apple", "banana", "watermelon", "carrot", "corn"],
};

export const C6_INH_01_SEED: SkillSeed = {
  identity: C6_INH_01_IDENTITY,
  dataset: C6_INH_01_DATASET,
  levels: [
    {
      code: "GL-C6-ATT-CARD-0003",
      template: "GT-012",
      band: "3-4",
      difficulty: 1,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C6-ATT-BOX-0005",
      template: "GT-003",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C6-ATT-LOC-0008",
      template: "GT-022",
      band: "4-5",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C6-ATT-BOX-0011",
      template: "GT-003",
      band: "4-5",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C6-ATT-LOC-0014",
      template: "GT-022",
      band: "4-5",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C6-ATT-BOX-0016",
      template: "GT-003",
      band: "5-6",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C6-ATT-LOC-0019",
      template: "GT-022",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C6-INH-NOGO-0030",
      template: "GT-026",
      band: "4-5",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C6-INH-NOGO-0031",
      template: "GT-026",
      band: "4-5",
      difficulty: 3,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C6-INH-NOGO-0032",
      template: "GT-026",
      band: "5-6",
      difficulty: 4,
      theme: "food",
      rounds: 3,
    },
  ],
};
