import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_BOK_03_IDENTITY: SkillIdentity = {
  code: "C5.BOK.03",
  strand_code: "C5.BOK",
  competency_code: "C5",
  name: "Đoán truyện qua tranh bìa",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["predict", "infer"],
  tier: "core",
  prerequisites: ["C5.BOK.01"],
  learning_objectives: [
    {
      code: "LO-C5.BOK.03-01",
      behaviour:
        "Nhận biết và thực hành Đoán truyện qua tranh bìa ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.BOK.03-02",
      behaviour:
        "Vận dụng Đoán truyện qua tranh bìa trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.BOK.03-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Đoán truyện qua tranh bìa",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_BOK_03_DATASET: SkillDataset = {
  skill_code: "C5.BOK.03",
  concept_label: "Đoán truyện qua tranh bìa",
  surface: "game",
  items: [
    {
      id: "bok_tranh_gau",
      label: "truyện gấu con",
      image: {
        kind: "emoji",
        ref: "🐻",
      },
      category: {
        type: "truyện thú rừng",
        label: "Truyện thú rừng",
      },
      contrast_group: "primary",
      value: 1,
      ordering: 1,
    },
    {
      id: "bok_tranh_tho",
      label: "truyện thỏ trắng",
      image: {
        kind: "emoji",
        ref: "🐰",
      },
      category: {
        type: "truyện thú rừng",
        label: "Truyện thú rừng",
      },
      contrast_group: "primary",
      value: 2,
      ordering: 2,
    },
    {
      id: "bok_tranh_soc",
      label: "truyện sóc nâu",
      image: {
        kind: "emoji",
        ref: "🐿️",
      },
      category: {
        type: "truyện thú rừng",
        label: "Truyện thú rừng",
      },
      contrast_group: "primary",
      value: 3,
      ordering: 3,
    },
    {
      id: "bok_tranh_chim",
      label: "truyện chim nhỏ",
      image: {
        kind: "emoji",
        ref: "🐦",
      },
      category: {
        type: "truyện loài bay",
        label: "Truyện loài bay",
      },
      contrast_group: "contrast",
      value: 4,
      ordering: 4,
    },
    {
      id: "bok_tranh_ong",
      label: "truyện ong vàng",
      image: {
        kind: "emoji",
        ref: "🐝",
      },
      category: {
        type: "truyện loài bay",
        label: "Truyện loài bay",
      },
      contrast_group: "contrast",
      value: 5,
      ordering: 5,
    },
    {
      id: "bok_tranh_buom",
      label: "truyện bướm xinh",
      image: {
        kind: "emoji",
        ref: "🦋",
      },
      category: {
        type: "truyện loài bay",
        label: "Truyện loài bay",
      },
      contrast_group: "contrast",
      value: 6,
      ordering: 6,
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "bok_tranh_gau",
      target_id: "bok_tranh_tho",
      explanation: "cùng là truyện về loài thú",
    },
    {
      type: "pair",
      source_id: "bok_tranh_chim",
      target_id: "bok_tranh_ong",
      explanation: "cùng là truyện về loài bay",
    },
    {
      type: "contrast",
      source_id: "bok_tranh_gau",
      target_id: "bok_tranh_chim",
      explanation: "truyện thú rừng đối lập với truyện loài bay",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Đoán truyện qua tranh bìa",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Đoán truyện qua tranh bìa",
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
      "Chúng mình cùng tìm hiểu về Đoán truyện qua tranh bìa nhé",
  },
  ordering: [
    "bok_tranh_gau",
    "bok_tranh_tho",
    "bok_tranh_soc",
    "bok_tranh_chim",
    "bok_tranh_ong",
    "bok_tranh_buom",
  ],
};

export const C5_BOK_03_SEED: SkillSeed = {
  identity: C5_BOK_03_IDENTITY,
  dataset: C5_BOK_03_DATASET,
  levels: [
    {
      code: "GL-C5-BOK-PAIR-0001",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-BOK-PAIR-0002",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C5-BOK-SHAD-0003",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "home",
      rounds: 3,
    },
  ],
};
