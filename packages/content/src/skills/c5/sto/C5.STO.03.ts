import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_STO_03_IDENTITY: SkillIdentity = {
  code: "C5.STO.03",
  strand_code: "C5.STO",
  competency_code: "C5",
  name: "Chọn kết thúc hợp lý",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["predict", "infer"],
  tier: "advanced",
  prerequisites: ["C5.STO.02"],
  learning_objectives: [
    {
      code: "LO-C5.STO.03-01",
      behaviour: "Nhận biết và thực hành Chọn kết thúc hợp lý ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.STO.03-02",
      behaviour: "Vận dụng Chọn kết thúc hợp lý trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.STO.03-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Chọn kết thúc hợp lý",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_STO_03_DATASET: SkillDataset = {
  skill_code: "C5.STO.03",
  concept_label: "Chọn kết thúc hợp lý",
  surface: "game",
  items: [
    {
      id: "sto_ket_vui_ve",
      label: "cả nhà sum vầy ăn bữa cơm ấm áp",
      image: {
        kind: "emoji",
        ref: "🍲",
      },
      category: {
        type: "kết thúc truyện",
      },
    },
    {
      id: "sto_ket_giup_do",
      label: "bạn bè cùng nhau giúp đỡ vượt qua khó khăn",
      image: {
        kind: "emoji",
        ref: "🤝",
      },
      category: {
        type: "kết thúc truyện",
      },
    },
    {
      id: "sto_ket_hoa_thuan",
      label: "hai bạn bắt tay làm hòa vui vẻ",
      image: {
        kind: "emoji",
        ref: "🕊️",
      },
      category: {
        type: "kết thúc truyện",
      },
    },
    {
      id: "sto_ket_khen_thuong",
      label: "bé ngoan được cô giáo tặng hoa điểm mười",
      image: {
        kind: "emoji",
        ref: "⭐",
      },
      category: {
        type: "kết thúc truyện",
      },
    },
    {
      id: "sto_ket_chia_se",
      label: "các bạn chia sẻ đồ chơi cùng nhau",
      image: {
        kind: "emoji",
        ref: "🧸",
      },
      category: {
        type: "kết thúc truyện",
      },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Chọn kết thúc hợp lý",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Chọn kết thúc hợp lý",
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
    narration_template: "Chúng mình cùng tìm hiểu về Chọn kết thúc hợp lý nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: [
    "sto_ket_vui_ve",
    "sto_ket_giup_do",
    "sto_ket_hoa_thuan",
    "sto_ket_khen_thuong",
    "sto_ket_chia_se",
  ],
};

export const C5_STO_03_SEED: SkillSeed = {
  identity: C5_STO_03_IDENTITY,
  dataset: C5_STO_03_DATASET,
  levels: [
    {
      code: "GL-C5-STO-PAIR-0003",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C5-STO-PAIR-0004",
      template: "GT-004",
      band: "4-5",
      difficulty: 4,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C5-STO-SORT-0003",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C5-STO-SORT-0004",
      template: "GT-006",
      band: "5-6",
      difficulty: 4,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C5-STO-SHAD-0003",
      template: "GT-007",
      band: "4-5",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-STO-SHAD-0004",
      template: "GT-007",
      band: "4-5",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C5-STO-SIZE-0005",
      template: "GT-009",
      band: "4-5",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-STO-SIZE-0006",
      template: "GT-009",
      band: "4-5",
      difficulty: 4,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C5-STO-PUZZ-0003",
      template: "GT-010",
      band: "4-5",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C5-STO-PUZZ-0004",
      template: "GT-010",
      band: "4-5",
      difficulty: 4,
      theme: "ocean",
      rounds: 3,
    },
  ],
};
