import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_WRT_07_IDENTITY: SkillIdentity = {
  code: "C5.WRT.07",
  strand_code: "C5.WRT",
  competency_code: "C5",
  name: "Viết chữ cái trong ô li",
  age_min: 6,
  age_max: 7,
  difficulty: 5,
  thinking_processes: ["create", "verify"],
  tier: "advanced",
  prerequisites: ["C5.WRT.06", "C5.ALP.04"],
  learning_objectives: [
    {
      code: "LO-C5.WRT.07-01",
      behaviour: "Nhận biết và thực hành Viết chữ cái trong ô li ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.WRT.07-02",
      behaviour: "Vận dụng Viết chữ cái trong ô li trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.WRT.07-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Viết chữ cái trong ô li",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_WRT_07_DATASET: SkillDataset = {
  skill_code: "C5.WRT.07",
  concept_label: "Viết chữ cái trong ô li",
  surface: "game",
  items: [
    {
      id: "wrt_o_li_vuong",
      label: "ô li vuông vắn",
      image: {
        kind: "emoji",
        ref: "🔲",
      },
      category: {
        type: "ô li",
      },
    },
    {
      id: "wrt_duong_ke_ngang",
      label: "đường kẻ ngang đậm",
      image: {
        kind: "emoji",
        ref: "➖",
      },
      category: {
        type: "ô li",
      },
    },
    {
      id: "wrt_duong_ke_doc",
      label: "đường kẻ dọc ô li",
      image: {
        kind: "emoji",
        ref: "📏",
      },
      category: {
        type: "ô li",
      },
    },
    {
      id: "wrt_do_cao_chu",
      label: "chiều cao chữ cái 2 ô li",
      image: {
        kind: "emoji",
        ref: "📊",
      },
      category: {
        type: "ô li",
      },
    },
    {
      id: "wrt_khoang_cach_chu",
      label: "khoảng cách giữa các chữ",
      image: {
        kind: "emoji",
        ref: "↔️",
      },
      category: {
        type: "ô li",
      },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Viết chữ cái trong ô li",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Viết chữ cái trong ô li",
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
      "Chúng mình cùng tìm hiểu về Viết chữ cái trong ô li nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: [
    "wrt_o_li_vuong",
    "wrt_duong_ke_ngang",
    "wrt_duong_ke_doc",
    "wrt_do_cao_chu",
    "wrt_khoang_cach_chu",
  ],
};

export const C5_WRT_07_SEED: SkillSeed = {
  identity: C5_WRT_07_IDENTITY,
  dataset: C5_WRT_07_DATASET,
  levels: [
    {
      code: "GL-C5-WRT-MEAS-0001",
      template: "GT-028",
      band: "5-6",
      difficulty: 4,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-MEAS-0002",
      template: "GT-028",
      band: "5-6",
      difficulty: 5,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-TIME-0001",
      template: "GT-029",
      band: "5-6",
      difficulty: 4,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-TIME-0002",
      template: "GT-029",
      band: "5-6",
      difficulty: 5,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-COIN-0001",
      template: "GT-030",
      band: "5-6",
      difficulty: 4,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-COIN-0002",
      template: "GT-030",
      band: "5-6",
      difficulty: 5,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-PICT-0001",
      template: "GT-031",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-PICT-0002",
      template: "GT-031",
      band: "5-6",
      difficulty: 5,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-VENN-0001",
      template: "GT-032",
      band: "5-6",
      difficulty: 4,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-VENN-0002",
      template: "GT-032",
      band: "5-6",
      difficulty: 5,
      theme: "animal",
      rounds: 3,
    },
  ],
};
