import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_WRT_05_IDENTITY: SkillIdentity = {
  code: "C5.WRT.05",
  strand_code: "C5.WRT",
  competency_code: "C5",
  name: "Tô theo nét chấm",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["observe", "verify"],
  tier: "core",
  prerequisites: ["C5.WRT.02"],
  learning_objectives: [
    {
      code: "LO-C5.WRT.05-01",
      behaviour: "Nhận biết và thực hành Tô theo nét chấm ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.WRT.05-02",
      behaviour: "Vận dụng Tô theo nét chấm trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.WRT.05-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Tô theo nét chấm",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_WRT_05_DATASET: SkillDataset = {
  skill_code: "C5.WRT.05",
  concept_label: "Tô theo nét chấm",
  surface: "game",
  items: [
    {
      id: "wrt_to_net_thang",
      label: "tô nét chấm thẳng",
      image: {
        kind: "emoji",
        ref: "📏",
      },
      category: {
        type: "tô nét chấm",
      },
    },
    {
      id: "wrt_to_net_cong",
      label: "tô nét chấm cong",
      image: {
        kind: "emoji",
        ref: "🌙",
      },
      category: {
        type: "tô nét chấm",
      },
    },
    {
      id: "wrt_to_net_hinh_tron",
      label: "tô nét chấm tròn",
      image: {
        kind: "emoji",
        ref: "⭕",
      },
      category: {
        type: "tô nét chấm",
      },
    },
    {
      id: "wrt_to_chu_cai",
      label: "tô chữ cái chấm",
      image: {
        kind: "emoji",
        ref: "🔤",
      },
      category: {
        type: "tô nét chấm",
      },
    },
    {
      id: "wrt_to_chu_so",
      label: "tô chữ số chấm",
      image: {
        kind: "emoji",
        ref: "🔢",
      },
      category: {
        type: "tô nét chấm",
      },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Tô theo nét chấm",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Tô theo nét chấm",
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
    narration_template: "Chúng mình cùng tìm hiểu về Tô theo nét chấm nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: [
    "wrt_to_net_thang",
    "wrt_to_net_cong",
    "wrt_to_net_hinh_tron",
    "wrt_to_chu_cai",
    "wrt_to_chu_so",
  ],
};

export const C5_WRT_05_SEED: SkillSeed = {
  identity: C5_WRT_05_IDENTITY,
  dataset: C5_WRT_05_DATASET,
  levels: [
    {
      code: "GL-C5-WRT-TAP-0009",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-TAP-0010",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-TCNT-0009",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-TCNT-0010",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-TCMP-0009",
      template: "GT-003",
      band: "4-5",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-TCMP-0010",
      template: "GT-003",
      band: "4-5",
      difficulty: 3,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-PAIR-0009",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-PAIR-0010",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-PATT-0009",
      template: "GT-005",
      band: "4-5",
      difficulty: 2,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-PATT-0010",
      template: "GT-005",
      band: "4-5",
      difficulty: 3,
      theme: "homeland",
      rounds: 3,
    },
  ],
};
