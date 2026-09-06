import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_DES_04_IDENTITY: SkillIdentity = {
  code: "C5.DES.04",
  strand_code: "C5.DES",
  competency_code: "C5",
  name: "Giải thích lý do chọn",
  age_min: 6,
  age_max: 6,
  difficulty: 5,
  thinking_processes: ["describe", "deduce"],
  tier: "advanced",
  prerequisites: ["C3.DED.03"],
  learning_objectives: [
    {
      code: "LO-C5.DES.04-01",
      behaviour: "Nhận biết và thực hành Giải thích lý do chọn ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.DES.04-02",
      behaviour: "Vận dụng Giải thích lý do chọn trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.DES.04-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Giải thích lý do chọn",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_DES_04_DATASET: SkillDataset = {
  skill_code: "C5.DES.04",
  concept_label: "Giải thích lý do chọn",
  surface: "worksheet",
  items: [
    {
      id: "des_ly_do_mua",
      label: "chọn áo mưa vì trời mưa",
      image: {
        kind: "emoji",
        ref: "🌧️",
      },
      category: {
        type: "giải thích lý do",
      },
    },
    {
      id: "des_ly_do_nang",
      label: "chọn mũ rộng vành vì trời nắng",
      image: {
        kind: "emoji",
        ref: "🧢",
      },
      category: {
        type: "giải thích lý do",
      },
    },
    {
      id: "des_ly_do_ret",
      label: "chọn khăn len ấm vì trời lạnh",
      image: {
        kind: "emoji",
        ref: "🧣",
      },
      category: {
        type: "giải thích lý do",
      },
    },
    {
      id: "des_ly_do_uong",
      label: "chọn cốc nước vì khát nước",
      image: {
        kind: "emoji",
        ref: "🥛",
      },
      category: {
        type: "giải thích lý do",
      },
    },
    {
      id: "des_ly_do_an",
      label: "chọn thìa để xúc cơm ăn",
      image: {
        kind: "emoji",
        ref: "🥄",
      },
      category: {
        type: "giải thích lý do",
      },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Giải thích lý do chọn",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Giải thích lý do chọn",
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
    narration_template: "Chúng mình cùng tìm hiểu về Giải thích lý do chọn nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: [
    "des_ly_do_mua",
    "des_ly_do_nang",
    "des_ly_do_ret",
    "des_ly_do_uong",
    "des_ly_do_an",
  ],
};

export const C5_DES_04_SEED: SkillSeed = {
  identity: C5_DES_04_IDENTITY,
  dataset: C5_DES_04_DATASET,
  levels: [
    {
      code: "GL-C5-DES-RSN-0001",
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C5-DES-RSN-0002",
      template: "GT-003",
      band: "5-6",
      difficulty: 3,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C5-DES-TAP-0005",
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C5-DES-TAP-0006",
      template: "GT-001",
      band: "5-6",
      difficulty: 5,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C5-DES-TAP-0007",
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-DES-TAP-0008",
      template: "GT-001",
      band: "5-6",
      difficulty: 5,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C5-DES-TCNT-0005",
      template: "GT-002",
      band: "5-6",
      difficulty: 4,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C5-DES-TCNT-0006",
      template: "GT-002",
      band: "5-6",
      difficulty: 5,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C5-DES-TCNT-0007",
      template: "GT-002",
      band: "5-6",
      difficulty: 4,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C5-DES-TCNT-0008",
      template: "GT-002",
      band: "5-6",
      difficulty: 5,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C5-DES-TCNT-0009",
      template: "GT-002",
      band: "5-6",
      difficulty: 4,
      theme: "vehicle",
      rounds: 3,
    },
  ],
};
