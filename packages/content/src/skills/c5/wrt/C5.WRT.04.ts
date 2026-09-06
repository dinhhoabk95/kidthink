import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_WRT_04_IDENTITY: SkillIdentity = {
  code: "C5.WRT.04",
  strand_code: "C5.WRT",
  competency_code: "C5",
  name: "Nét móc, nét khuyết",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["observe", "create"],
  tier: "core",
  prerequisites: ["C5.WRT.03"],
  learning_objectives: [
    {
      code: "LO-C5.WRT.04-01",
      behaviour: "Nhận biết và thực hành Nét móc, nét khuyết ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.WRT.04-02",
      behaviour: "Vận dụng Nét móc, nét khuyết trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.WRT.04-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Nét móc, nét khuyết",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_WRT_04_DATASET: SkillDataset = {
  skill_code: "C5.WRT.04",
  concept_label: "Nét móc, nét khuyết",
  surface: "game",
  items: [
    {
      id: "wrt_moc_xuoi",
      label: "nét móc xuôi",
      image: {
        kind: "emoji",
        ref: "🪝",
      },
      category: {
        type: "nét móc",
      },
    },
    {
      id: "wrt_moc_nguoc",
      label: "nét móc ngược",
      image: {
        kind: "emoji",
        ref: "🪝",
      },
      category: {
        type: "nét móc",
      },
    },
    {
      id: "wrt_moc_hai_dau",
      label: "nét móc hai đầu",
      image: {
        kind: "emoji",
        ref: "🦯",
      },
      category: {
        type: "nét móc",
      },
    },
    {
      id: "wrt_khuyet_tren",
      label: "nét khuyết trên",
      image: {
        kind: "emoji",
        ref: "🎗️",
      },
      category: {
        type: "nét khuyết",
      },
    },
    {
      id: "wrt_khuyet_duoi",
      label: "nét khuyết dưới",
      image: {
        kind: "emoji",
        ref: "🎀",
      },
      category: {
        type: "nét khuyết",
      },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Nét móc, nét khuyết",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nét móc, nét khuyết",
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
    narration_template: "Chúng mình cùng tìm hiểu về Nét móc, nét khuyết nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: [
    "wrt_moc_xuoi",
    "wrt_moc_nguoc",
    "wrt_moc_hai_dau",
    "wrt_khuyet_tren",
    "wrt_khuyet_duoi",
  ],
};

export const C5_WRT_04_SEED: SkillSeed = {
  identity: C5_WRT_04_IDENTITY,
  dataset: C5_WRT_04_DATASET,
  levels: [
    {
      code: "GL-C5-WRT-TAP-0007",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-TAP-0008",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-TCNT-0007",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-TCNT-0008",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-TCMP-0007",
      template: "GT-003",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-TCMP-0008",
      template: "GT-003",
      band: "4-5",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-PAIR-0007",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-PAIR-0008",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-PATT-0007",
      template: "GT-005",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-PATT-0008",
      template: "GT-005",
      band: "4-5",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
    },
  ],
};
