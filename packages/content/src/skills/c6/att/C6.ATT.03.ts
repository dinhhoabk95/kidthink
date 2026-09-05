import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C6_ATT_03_IDENTITY: SkillIdentity = {
  code: "C6.ATT.03",
  strand_code: "C6.ATT",
  competency_code: "C6",
  name: "Bỏ qua vật gây nhiễu",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["observe", "inhibit"],
  tier: "core",
  prerequisites: ["C6.ATT.02"],
  learning_objectives: [
    {
      code: "LO-C6.ATT.03-01",
      behaviour: "Nhận biết và thực hành Bỏ qua vật gây nhiễu ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C6.ATT.03-02",
      behaviour: "Vận dụng Bỏ qua vật gây nhiễu trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C6.ATT.03-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Bỏ qua vật gây nhiễu",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C6_ATT_03_DATASET: SkillDataset = {
  skill_code: "C6.ATT.03",
  concept_label: "Bỏ qua vật gây nhiễu",
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
      description: "Làm quen cơ bản với Bỏ qua vật gây nhiễu",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Bỏ qua vật gây nhiễu",
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
    narration_template: "Chúng mình cùng tìm hiểu về Bỏ qua vật gây nhiễu nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["banana", "watermelon", "carrot", "corn", "dog"],
};

export const C6_ATT_03_SEED: SkillSeed = {
  identity: C6_ATT_03_IDENTITY,
  dataset: C6_ATT_03_DATASET,
  levels: [
    {
      code: "GL-C6-ATT-TAP-0005",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C6-ATT-TAP-0006",
      template: "GT-001",
      band: "3-4",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C6-ATT-TCNT-0001",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C6-ATT-TCNT-0002",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C6-ATT-TCMP-0005",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C6-ATT-TCMP-0006",
      template: "GT-003",
      band: "3-4",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C6-ATT-PAIR-0001",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C6-ATT-PAIR-0002",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C6-ATT-PATT-0005",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C6-ATT-PATT-0006",
      template: "GT-005",
      band: "3-4",
      difficulty: 3,
      theme: "festival",
      rounds: 3,
    },
  ],
};
