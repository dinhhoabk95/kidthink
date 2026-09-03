import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_CON_05_IDENTITY: SkillIdentity = {
  code: "C2.CON.05",
  strand_code: "C2.CON",
  competency_code: "C2",
  name: "Block Pattern — sao chép cấu trúc",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["observe", "create"],
  tier: "advanced",
  prerequisites: ["C2.CON.01", "C1.PAT.09"],
  learning_objectives: [
    {
      code: "LO-C2.CON.05-01",
      behaviour:
        "Nhận biết và thực hành Block Pattern — sao chép cấu trúc ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.CON.05-02",
      behaviour:
        "Vận dụng Block Pattern — sao chép cấu trúc trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.CON.05-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Block Pattern — sao chép cấu trúc",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_CON_05_DATASET: SkillDataset = {
  skill_code: "C2.CON.05",
  concept_label: "Block Pattern — sao chép cấu trúc",
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
      description: "Làm quen cơ bản với Block Pattern — sao chép cấu trúc",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Block Pattern — sao chép cấu trúc",
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
      "Chúng mình cùng tìm hiểu về Block Pattern — sao chép cấu trúc nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["banana", "watermelon", "carrot", "corn", "dog"],
};

export const C2_CON_05_SEED: SkillSeed = {
  identity: C2_CON_05_IDENTITY,
  dataset: C2_CON_05_DATASET,
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
  ],
};
