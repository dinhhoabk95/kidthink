import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_QUE_03_IDENTITY: SkillIdentity = {
  code: "C5.QUE.03",
  strand_code: "C5.QUE",
  competency_code: "C5",
  name: 'Trả lời "Ở đâu?"',
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["listen", "infer"],
  tier: "core",
  prerequisites: ["C5.QUE.02", "C2.ORI.07"],
  learning_objectives: [
    {
      code: "LO-C5.QUE.03-01",
      behaviour: 'Nhận biết và thực hành Trả lời "Ở đâu?" ở mức cơ bản',
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.QUE.03-02",
      behaviour: 'Vận dụng Trả lời "Ở đâu?" trong môi trường tương tác',
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.QUE.03-03",
      behaviour: 'Giải quyết vấn đề nâng cao liên quan tới Trả lời "Ở đâu?"',
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_QUE_03_DATASET: SkillDataset = {
  skill_code: "C5.QUE.03",
  concept_label: 'Trả lời "Ở đâu?"',
  surface: "game",
  items: [
    {
      id: "que_chim_tren_cay",
      label: "chú chim trên cành cây",
      image: {
        kind: "emoji",
        ref: "🌳",
      },
      category: {
        type: "câu hỏi ở đâu",
      },
    },
    {
      id: "que_ca_duoi_nuoc",
      label: "đàn cá bơi dưới nước",
      image: {
        kind: "emoji",
        ref: "🌊",
      },
      category: {
        type: "câu hỏi ở đâu",
      },
    },
    {
      id: "que_sach_tren_gia",
      label: "sách truyện trên giá",
      image: {
        kind: "emoji",
        ref: "📚",
      },
      category: {
        type: "câu hỏi ở đâu",
      },
    },
    {
      id: "que_be_ngu_tren_giuong",
      label: "bé ngủ trên giường",
      image: {
        kind: "emoji",
        ref: "🛏️",
      },
      category: {
        type: "câu hỏi ở đâu",
      },
    },
    {
      id: "que_xe_o_gara",
      label: "xe ô tô đỗ trong nhà xe",
      image: {
        kind: "emoji",
        ref: "🏠",
      },
      category: {
        type: "câu hỏi ở đâu",
      },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: 'Làm quen cơ bản với Trả lời "Ở đâu?"',
    },
    {
      rung: 2,
      dimension: "range",
      description: 'Nhận biết và chọn đúng Trả lời "Ở đâu?"',
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
    narration_template: 'Chúng mình cùng tìm hiểu về Trả lời "Ở đâu?" nhé',
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: [
    "que_chim_tren_cay",
    "que_ca_duoi_nuoc",
    "que_sach_tren_gia",
    "que_be_ngu_tren_giuong",
    "que_xe_o_gara",
  ],
};

export const C5_QUE_03_SEED: SkillSeed = {
  identity: C5_QUE_03_IDENTITY,
  dataset: C5_QUE_03_DATASET,
  levels: [
    {
      code: "GL-C5-QUE-PAIR-0001",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C5-QUE-PAIR-0002",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C5-QUE-SHAD-0011",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C5-QUE-SHAD-0012",
      template: "GT-007",
      band: "3-4",
      difficulty: 3,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C5-QUE-SIZE-0001",
      template: "GT-009",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-QUE-SIZE-0002",
      template: "GT-009",
      band: "4-5",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C5-QUE-PUZZ-0001",
      template: "GT-010",
      band: "4-5",
      difficulty: 2,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-QUE-PUZZ-0002",
      template: "GT-010",
      band: "4-5",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C5-QUE-TIME-0001",
      template: "GT-029",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C5-QUE-TIME-0002",
      template: "GT-029",
      band: "4-5",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
    },
  ],
};
