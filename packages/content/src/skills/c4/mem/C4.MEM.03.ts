import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_MEM_03_IDENTITY: SkillIdentity = {
  code: "C4.MEM.03",
  strand_code: "C4.MEM",
  competency_code: "C4",
  name: "Nhớ chuỗi màu",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["recall", "sequence"],
  tier: "core",
  prerequisites: ["C4.DET.01"],
  learning_objectives: [
    {
      code: "LO-C4.MEM.03-01",
      behaviour: "Nhận biết và thực hành Nhớ chuỗi màu ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.MEM.03-02",
      behaviour: "Vận dụng Nhớ chuỗi màu trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.MEM.03-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Nhớ chuỗi màu",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_MEM_03_DATASET: SkillDataset = {
  skill_code: "C4.MEM.03",
  concept_label: "Nhớ chuỗi màu",
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
      description: "Làm quen cơ bản với Nhớ chuỗi màu",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nhớ chuỗi màu",
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
    narration_template: "Chúng mình cùng tìm hiểu về Nhớ chuỗi màu nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["apple", "banana", "watermelon", "carrot", "corn"],
};

export const C4_MEM_03_SEED: SkillSeed = {
  identity: C4_MEM_03_IDENTITY,
  dataset: C4_MEM_03_DATASET,
  levels: [
    {
      code: "GL-C4-TAP-INS-0006",
      template: "GT-018",
      band: "5-6",
      difficulty: 3,
      theme: "vehicle",
      rounds: 3,
      legacy_v1_ref: "D3-08",
    },
    {
      code: "GL-C4-TAP-INS-0007",
      template: "GT-018",
      band: "5-6",
      difficulty: 1,
      theme: "art",
      rounds: 3,
      legacy_v1_ref: "D3-08",
    },
    {
      code: "GL-C4-TAP-INS-0008",
      template: "GT-018",
      band: "5-6",
      difficulty: 2,
      theme: "home",
      rounds: 3,
      legacy_v1_ref: "D3-08",
    },
    {
      code: "GL-C4-TAP-INS-0009",
      template: "GT-018",
      band: "5-6",
      difficulty: 3,
      theme: "festival",
      rounds: 3,
      legacy_v1_ref: "D3-08",
    },
    {
      code: "GL-C4-TAP-INS-0010",
      template: "GT-018",
      band: "5-6",
      difficulty: 1,
      theme: "school",
      rounds: 3,
      legacy_v1_ref: "D3-08",
    },
  ],
};
