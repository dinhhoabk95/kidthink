import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_DAT_01_IDENTITY: SkillIdentity = {
  code: "C1.DAT.01",
  strand_code: "C1.DAT",
  competency_code: "C1",
  name: "Đếm rồi ghi lại bằng dấu",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["count", "create"],
  tier: "basic",
  prerequisites: ["C1.CNT.01"],
  learning_objectives: [
    {
      code: "LO-C1.DAT.01-01",
      behaviour: "Nhận biết và thực hành Đếm rồi ghi lại bằng dấu ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.DAT.01-02",
      behaviour: "Vận dụng Đếm rồi ghi lại bằng dấu trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.DAT.01-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Đếm rồi ghi lại bằng dấu",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_DAT_01_DATASET: SkillDataset = {
  skill_code: "C1.DAT.01",
  concept_label: "Đếm rồi ghi lại bằng dấu",
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
      description: "Làm quen cơ bản với Đếm rồi ghi lại bằng dấu",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Đếm rồi ghi lại bằng dấu",
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
      "Chúng mình cùng tìm hiểu về Đếm rồi ghi lại bằng dấu nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["apple", "banana", "watermelon", "carrot", "corn"],
};

export const C1_DAT_01_SEED: SkillSeed = {
  identity: C1_DAT_01_IDENTITY,
  dataset: C1_DAT_01_DATASET,
  levels: [
    {
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      template: "GT-003",
      band: "4-5",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-007",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
  ],
};
