import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_HOM_05_IDENTITY: SkillIdentity = {
  code: "C4.HOM.05",
  strand_code: "C4.HOM",
  competency_code: "C4",
  name: "Món ăn vùng miền",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["sort", "describe"],
  tier: "core",
  prerequisites: ["C3.CLS.04"],
  learning_objectives: [
    {
      code: "LO-C4.HOM.05-01",
      behaviour: "Nhận biết và thực hành Món ăn vùng miền ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.HOM.05-02",
      behaviour: "Vận dụng Món ăn vùng miền trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.HOM.05-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Món ăn vùng miền",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_HOM_05_DATASET: SkillDataset = {
  skill_code: "C4.HOM.05",
  concept_label: "Món ăn vùng miền",
  surface: "game",
  items: [
    {
      id: "food_pho",
      label: "bát phở bò",
      image: {
        kind: "emoji",
        ref: "🍜",
      },
      category: {
        type: "món miền Bắc",
      },
      contrast_group: "north",
      value: 1,
      ordering: 1,
      audio_path: "/audio/vi/c4/food_pho.mp3",
    },
    {
      id: "food_buncha",
      label: "bún chả nướng",
      image: {
        kind: "emoji",
        ref: "🍲",
      },
      category: {
        type: "món miền Bắc",
      },
      contrast_group: "north",
      value: 2,
      ordering: 2,
      audio_path: "/audio/vi/c4/food_buncha.mp3",
    },
    {
      id: "food_com",
      label: "hạt cốm thơm",
      image: {
        kind: "emoji",
        ref: "🌾",
      },
      category: {
        type: "món miền Bắc",
      },
      contrast_group: "north",
      value: 3,
      ordering: 3,
      audio_path: "/audio/vi/c4/food_com.mp3",
    },
    {
      id: "food_banhcuon",
      label: "đĩa bánh cuốn",
      image: {
        kind: "emoji",
        ref: "🥟",
      },
      category: {
        type: "món miền Bắc",
      },
      contrast_group: "north",
      value: 4,
      ordering: 4,
      audio_path: "/audio/vi/c4/food_banhcuon.mp3",
    },
    {
      id: "food_hutieu",
      label: "tô hủ tiếu",
      image: {
        kind: "emoji",
        ref: "🥣",
      },
      category: {
        type: "món miền Nam",
      },
      contrast_group: "south",
      value: 1,
      ordering: 5,
      audio_path: "/audio/vi/c4/food_hutieu.mp3",
    },
    {
      id: "food_banhxeo",
      label: "bánh xèo vàng",
      image: {
        kind: "emoji",
        ref: "🥞",
      },
      category: {
        type: "món miền Nam",
      },
      contrast_group: "south",
      value: 2,
      ordering: 6,
      audio_path: "/audio/vi/c4/food_banhxeo.mp3",
    },
    {
      id: "food_comtam",
      label: "đĩa cơm tấm",
      image: {
        kind: "emoji",
        ref: "🍚",
      },
      category: {
        type: "món miền Nam",
      },
      contrast_group: "south",
      value: 3,
      ordering: 7,
      audio_path: "/audio/vi/c4/food_comtam.mp3",
    },
    {
      id: "food_che",
      label: "ly chè mát",
      image: {
        kind: "emoji",
        ref: "🍧",
      },
      category: {
        type: "món miền Nam",
      },
      contrast_group: "south",
      value: 4,
      ordering: 8,
      audio_path: "/audio/vi/c4/food_che.mp3",
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "food_pho",
      target_id: "food_hutieu",
    },
    {
      type: "contrast",
      source_id: "food_buncha",
      target_id: "food_banhxeo",
    },
    {
      type: "contrast",
      source_id: "food_com",
      target_id: "food_comtam",
    },
    {
      type: "contrast",
      source_id: "food_banhcuon",
      target_id: "food_che",
    },
  ],
  axes: {
    region: {
      values: ["món miền Bắc", "món miền Nam"],
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Món ăn vùng miền",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Món ăn vùng miền",
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
    narration_template: "Chúng mình cùng tìm hiểu về Món ăn vùng miền nhé",
  },
  ordering: [
    "food_pho",
    "food_buncha",
    "food_com",
    "food_banhcuon",
    "food_hutieu",
    "food_banhxeo",
    "food_comtam",
    "food_che",
  ],
};

export const C4_HOM_05_SEED: SkillSeed = {
  identity: C4_HOM_05_IDENTITY,
  dataset: C4_HOM_05_DATASET,
  levels: [
    {
      code: "GL-C4-HOM-TCNT-0005",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C4-HOM-HIDE-0001",
      template: "GT-015",
      band: "5-6",
      difficulty: 2,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C4-HOM-HIDE-0002",
      template: "GT-015",
      band: "5-6",
      difficulty: 3,
      theme: "homeland",
      rounds: 3,
    },
  ],
};
