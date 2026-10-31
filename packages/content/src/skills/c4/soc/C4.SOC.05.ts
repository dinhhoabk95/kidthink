import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_SOC_05_IDENTITY: SkillIdentity = {
  code: "C4.SOC.05",
  strand_code: "C4.SOC",
  competency_code: "C4",
  name: "Nghề nghiệp – sản phẩm",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["match", "infer"],
  tier: "core",
  prerequisites: ["C4.SOC.04"],
  learning_objectives: [
    {
      code: "LO-C4.SOC.05-01",
      behaviour: "Nhận biết và thực hành Nghề nghiệp – sản phẩm ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.SOC.05-02",
      behaviour: "Vận dụng Nghề nghiệp – sản phẩm trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.SOC.05-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Nghề nghiệp – sản phẩm",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_SOC_05_DATASET: SkillDataset = {
  skill_code: "C4.SOC.05",
  concept_label: "Nghề nghiệp – sản phẩm",
  surface: "game",
  items: [
    {
      id: "farmer",
      label: "bác nông dân",
      image: {
        kind: "emoji",
        ref: "🧑‍🌾",
      },
      category: {
        type: "người làm nghề",
      },
      value: 1,
      ordering: 1,
      contrast_group: "worker",
      audio_path: "/audio/vi/c4/farmer.mp3",
    },
    {
      id: "builder",
      label: "bác thợ xây",
      image: {
        kind: "emoji",
        ref: "👷",
      },
      category: {
        type: "người làm nghề",
      },
      value: 2,
      ordering: 2,
      contrast_group: "worker",
      audio_path: "/audio/vi/c4/builder.mp3",
    },
    {
      id: "baker",
      label: "chú thợ bánh",
      image: {
        kind: "emoji",
        ref: "👨‍🍳",
      },
      category: {
        type: "người làm nghề",
      },
      value: 3,
      ordering: 3,
      contrast_group: "worker",
      audio_path: "/audio/vi/c4/baker.mp3",
    },
    {
      id: "artist",
      label: "cô họa sĩ",
      image: {
        kind: "emoji",
        ref: "👩‍🎨",
      },
      category: {
        type: "người làm nghề",
      },
      value: 4,
      ordering: 4,
      contrast_group: "worker",
      audio_path: "/audio/vi/c4/artist.mp3",
    },
    {
      id: "rice",
      label: "hạt lúa vàng",
      image: {
        kind: "emoji",
        ref: "🌾",
      },
      category: {
        type: "sản phẩm nghề",
      },
      value: 1,
      ordering: 5,
      contrast_group: "product",
      audio_path: "/audio/vi/c4/rice.mp3",
    },
    {
      id: "house",
      label: "ngôi nhà mới",
      image: {
        kind: "emoji",
        ref: "🏠",
      },
      category: {
        type: "sản phẩm nghề",
      },
      value: 2,
      ordering: 6,
      contrast_group: "product",
      audio_path: "/audio/vi/c4/house.mp3",
    },
    {
      id: "bread",
      label: "ổ bánh mì",
      image: {
        kind: "emoji",
        ref: "🍞",
      },
      category: {
        type: "sản phẩm nghề",
      },
      value: 3,
      ordering: 7,
      contrast_group: "product",
      audio_path: "/audio/vi/c4/bread.mp3",
    },
    {
      id: "painting",
      label: "bức tranh đẹp",
      image: {
        kind: "emoji",
        ref: "🖼️",
      },
      category: {
        type: "sản phẩm nghề",
      },
      value: 4,
      ordering: 8,
      contrast_group: "product",
      audio_path: "/audio/vi/c4/painting.mp3",
    },
  ],
  axes: {
    category: {
      values: ["người làm nghề", "sản phẩm nghề"],
    },
  },
  relations: [
    {
      type: "pair",
      source_id: "farmer",
      target_id: "rice",
    },
    {
      type: "pair",
      source_id: "builder",
      target_id: "house",
    },
    {
      type: "pair",
      source_id: "baker",
      target_id: "bread",
    },
    {
      type: "pair",
      source_id: "artist",
      target_id: "painting",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Nghề nghiệp – sản phẩm",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nghề nghiệp – sản phẩm",
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
      "Chúng mình cùng tìm hiểu về Nghề nghiệp – sản phẩm nhé",
  },
  ordering: [
    "farmer",
    "builder",
    "baker",
    "artist",
    "rice",
    "house",
    "bread",
    "painting",
  ],
};

export const C4_SOC_05_SEED: SkillSeed = {
  identity: C4_SOC_05_IDENTITY,
  dataset: C4_SOC_05_DATASET,
  levels: [
    {
      code: "GL-C4-SOC-TAP-0007",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C4-SOC-PATT-0011",
      template: "GT-005",
      band: "4-5",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C4-SOC-PATT-0012",
      template: "GT-005",
      band: "4-5",
      difficulty: 3,
      theme: "vehicle",
      rounds: 3,
    },
  ],
};
