import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_ECO_03_IDENTITY: SkillIdentity = {
  code: "C4.ECO.03",
  strand_code: "C4.ECO",
  competency_code: "C4",
  name: "Phân loại rác",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["sort", "deduce"],
  tier: "advanced",
  prerequisites: ["C4.ECO.01", "C3.CLS.06"],
  learning_objectives: [
    {
      code: "LO-C4.ECO.03-01",
      behaviour: "Nhận biết và thực hành Phân loại rác ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.ECO.03-02",
      behaviour: "Vận dụng Phân loại rác trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.ECO.03-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Phân loại rác",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_ECO_03_DATASET: SkillDataset = {
  skill_code: "C4.ECO.03",
  concept_label: "Phân loại rác",
  surface: "game",
  items: [
    {
      id: "org_apple",
      label: "cuống táo thừa",
      image: {
        kind: "emoji",
        ref: "🍎",
      },
      category: {
        type: "rác hữu cơ",
      },
      contrast_group: "organic",
      value: 1,
      ordering: 1,
      audio_path: "/audio/voice/cuống-táo-thừa.mp3",
    },
    {
      id: "org_banana",
      label: "vỏ chuối chín",
      image: {
        kind: "emoji",
        ref: "🍌",
      },
      category: {
        type: "rác hữu cơ",
      },
      contrast_group: "organic",
      value: 2,
      ordering: 2,
      audio_path: "/audio/voice/vỏ-chuối-chín.mp3",
    },
    {
      id: "org_leaf",
      label: "lá rụng khô",
      image: {
        kind: "emoji",
        ref: "🍂",
      },
      category: {
        type: "rác hữu cơ",
      },
      contrast_group: "organic",
      value: 3,
      ordering: 3,
      audio_path: "/audio/voice/lá-rụng-khô.mp3",
    },
    {
      id: "org_carrot",
      label: "đầu củ cà rốt",
      image: {
        kind: "emoji",
        ref: "🥕",
      },
      category: {
        type: "rác hữu cơ",
      },
      contrast_group: "organic",
      value: 4,
      ordering: 4,
      audio_path: "/audio/voice/đầu-củ-cà-rốt.mp3",
    },
    {
      id: "rec_plastic",
      label: "chai dầu gội nhựa",
      image: {
        kind: "emoji",
        ref: "🧴",
      },
      category: {
        type: "rác tái chế",
      },
      contrast_group: "recyclable",
      value: 1,
      ordering: 5,
      audio_path: "/audio/voice/chai-dầu-gội-nhựa.mp3",
    },
    {
      id: "rec_can",
      label: "vỏ lon nhôm",
      image: {
        kind: "emoji",
        ref: "🥫",
      },
      category: {
        type: "rác tái chế",
      },
      contrast_group: "recyclable",
      value: 2,
      ordering: 6,
      audio_path: "/audio/voice/vỏ-lon-nhôm.mp3",
    },
    {
      id: "rec_cardboard",
      label: "hộp giấy bìa",
      image: {
        kind: "emoji",
        ref: "📦",
      },
      category: {
        type: "rác tái chế",
      },
      contrast_group: "recyclable",
      value: 3,
      ordering: 7,
      audio_path: "/audio/voice/hộp-giấy-bìa.mp3",
    },
    {
      id: "rec_glass",
      label: "lọ thủy tinh",
      image: {
        kind: "emoji",
        ref: "🫙",
      },
      category: {
        type: "rác tái chế",
      },
      contrast_group: "recyclable",
      value: 4,
      ordering: 8,
      audio_path: "/audio/voice/lọ-thủy-tinh.mp3",
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "org_apple",
      target_id: "rec_plastic",
    },
    {
      type: "contrast",
      source_id: "org_banana",
      target_id: "rec_can",
    },
    {
      type: "contrast",
      source_id: "org_leaf",
      target_id: "rec_cardboard",
    },
    {
      type: "contrast",
      source_id: "org_carrot",
      target_id: "rec_glass",
    },
  ],
  axes: {
    recycle_type: {
      values: ["rác hữu cơ", "rác tái chế"],
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Phân loại rác",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Phân loại rác",
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
    narration_template: "Chúng mình cùng tìm hiểu về Phân loại rác nhé",
  },
  ordering: [
    "org_apple",
    "org_banana",
    "org_leaf",
    "org_carrot",
    "rec_plastic",
    "rec_can",
    "rec_cardboard",
    "rec_glass",
  ],
};

export const C4_ECO_03_SEED: SkillSeed = {
  identity: C4_ECO_03_IDENTITY,
  dataset: C4_ECO_03_DATASET,
  levels: [
    {
      code: "GL-C4-ECO-TCMP-0003",
      template: "GT-003",
      band: "4-5",
      difficulty: 3,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C4-ECO-SLOT-0001",
      template: "GT-008",
      band: "4-5",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C4-ECO-HIDE-0001",
      template: "GT-015",
      band: "5-6",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C4-ECO-INTRO-6002",
      template: "GT-000",
      band: "5-6",
      difficulty: 3,
      access_tier: "standard",
      theme: "animal",
      rounds: 3,
      sequence_no: 61,
    },
    {
      code: "GL-C4-ECO-ORD-6004",
      template: "GT-006",
      band: "5-6",
      difficulty: 4,
      access_tier: "standard",
      theme: "ocean",
      rounds: 3,
      sequence_no: 63,
    },
    {
      code: "GL-C4-ECO-SORT-6006",
      template: "GT-004",
      band: "5-6",
      difficulty: 4,
      access_tier: "standard",
      theme: "vehicle",
      rounds: 3,
      sequence_no: 65,
    },
    {
      code: "GL-C4-ECO-NOGO-6008",
      template: "GT-026",
      band: "5-6",
      difficulty: 4,
      access_tier: "standard",
      theme: "space",
      rounds: 3,
      sequence_no: 67,
    },
    {
      code: "GL-C4-ECO-MULTI-6010",
      template: "GT-002",
      band: "5-6",
      difficulty: 4,
      access_tier: "standard",
      theme: "body",
      rounds: 3,
      sequence_no: 69,
    },
    {
      code: "GL-C4-ECO-TAP-6012",
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      access_tier: "standard",
      theme: "festival",
      rounds: 3,
      sequence_no: 71,
    },
    {
      code: "GL-C4-ECO-MATCH-6014",
      template: "GT-005",
      band: "5-6",
      difficulty: 4,
      access_tier: "standard",
      theme: "homeland",
      rounds: 3,
      sequence_no: 73,
    },
  ],
};
