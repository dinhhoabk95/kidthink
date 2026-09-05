import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C6_MON_01_IDENTITY: SkillIdentity = {
  code: "C6.MON.01",
  strand_code: "C6.MON",
  competency_code: "C6",
  name: "Tự phát hiện lỗi",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["verify"],
  tier: "advanced",
  prerequisites: ["C1.CNT.10"],
  learning_objectives: [
    {
      code: "LO-C6.MON.01-01",
      behaviour: "Nhận biết và thực hành Tự phát hiện lỗi ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C6.MON.01-02",
      behaviour: "Vận dụng Tự phát hiện lỗi trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C6.MON.01-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Tự phát hiện lỗi",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C6_MON_01_DATASET: SkillDataset = {
  skill_code: "C6.MON.01",
  concept_label: "Tự phát hiện lỗi",
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
      description: "Làm quen cơ bản với Tự phát hiện lỗi",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Tự phát hiện lỗi",
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
    narration_template: "Chúng mình cùng tìm hiểu về Tự phát hiện lỗi nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["apple", "banana", "watermelon", "carrot", "corn"],
};

export const C6_MON_01_SEED: SkillSeed = {
  identity: C6_MON_01_IDENTITY,
  dataset: C6_MON_01_DATASET,
  levels: [
    {
      code: "GL-C6-MON-MEAS-0001",
      template: "GT-028",
      band: "4-5",
      difficulty: 3,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C6-MON-MEAS-0002",
      template: "GT-028",
      band: "4-5",
      difficulty: 4,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C6-MON-TIME-0001",
      template: "GT-029",
      band: "4-5",
      difficulty: 3,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C6-MON-TIME-0002",
      template: "GT-029",
      band: "4-5",
      difficulty: 4,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C6-MON-COIN-0001",
      template: "GT-030",
      band: "5-6",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C6-MON-COIN-0002",
      template: "GT-030",
      band: "5-6",
      difficulty: 4,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C6-MON-PICT-0001",
      template: "GT-031",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C6-MON-PICT-0002",
      template: "GT-031",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C6-MON-VENN-0001",
      template: "GT-032",
      band: "5-6",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C6-MON-VENN-0002",
      template: "GT-032",
      band: "5-6",
      difficulty: 4,
      theme: "animal",
      rounds: 3,
    },
  ],
};
