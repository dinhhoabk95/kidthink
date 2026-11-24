import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_WRT_01_IDENTITY: SkillIdentity = {
  code: "C5.WRT.01",
  strand_code: "C5.WRT",
  competency_code: "C5",
  name: "Cầm bút đúng",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["observe", "plan"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C5.WRT.01-01",
      behaviour: "Nhận biết và thực hành Cầm bút đúng ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.WRT.01-02",
      behaviour: "Vận dụng Cầm bút đúng trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.WRT.01-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Cầm bút đúng",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_WRT_01_DATASET: SkillDataset = {
  skill_code: "C5.WRT.01",
  concept_label: "Cầm bút đúng",
  surface: "game",
  items: [
    {
      id: "wrt_but_chi",
      label: "bút chì",
      value: 1,
      image: {
        kind: "emoji",
        ref: "✏️",
      },
      category: {
        type: "dụng cụ viết",
      },
      contrast_group: "primary",
    },
    {
      id: "wrt_but_sap",
      label: "bút sáp",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🖍️",
      },
      category: {
        type: "dụng cụ viết",
      },
      contrast_group: "primary",
    },
    {
      id: "wrt_tay_chi",
      label: "bút mực",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🖊️",
      },
      category: {
        type: "dụng cụ viết",
      },
      contrast_group: "primary",
    },
    {
      id: "wrt_vo_tap",
      label: "vở tập tô",
      value: 4,
      image: {
        kind: "emoji",
        ref: "📓",
      },
      category: {
        type: "dụng cụ viết",
      },
      contrast_group: "primary",
    },
    {
      id: "wrt_cam_3_ngon",
      label: "cầm bút ba ngón",
      value: 5,
      image: {
        kind: "emoji",
        ref: "✍️",
      },
      category: {
        type: "cách cầm bút",
      },
      contrast_group: "contrast",
    },
    {
      id: "wrt_ngon_cai_tro",
      label: "ngón cái giữ bút",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🤏",
      },
      category: {
        type: "cách cầm bút",
      },
      contrast_group: "contrast",
    },
    {
      id: "wrt_ngon_giua",
      label: "ngón giữa đỡ bút",
      value: 7,
      image: {
        kind: "emoji",
        ref: "✋",
      },
      category: {
        type: "cách cầm bút",
      },
      contrast_group: "contrast",
    },
    {
      id: "wrt_co_tay",
      label: "cổ tay mềm mại",
      value: 8,
      image: {
        kind: "emoji",
        ref: "🖐️",
      },
      category: {
        type: "cách cầm bút",
      },
      contrast_group: "contrast",
    },
  ],
  axes: {
    category: {
      values: ["dụng cụ viết", "cách cầm bút"],
      ordered: true,
    },
  },
  relations: [
    { type: "sequence", source_id: "wrt_but_chi", target_id: "wrt_cam_3_ngon" },
    { type: "pair", source_id: "wrt_but_chi", target_id: "wrt_but_sap" },
    { type: "pair", source_id: "wrt_tay_chi", target_id: "wrt_vo_tap" },
    {
      type: "pair",
      source_id: "wrt_cam_3_ngon",
      target_id: "wrt_ngon_cai_tro",
    },
    { type: "pair", source_id: "wrt_ngon_giua", target_id: "wrt_co_tay" },
    { type: "contrast", source_id: "wrt_but_chi", target_id: "wrt_cam_3_ngon" },
    {
      type: "contrast",
      source_id: "wrt_but_sap",
      target_id: "wrt_ngon_cai_tro",
    },
    { type: "contrast", source_id: "wrt_tay_chi", target_id: "wrt_ngon_giua" },
    { type: "contrast", source_id: "wrt_vo_tap", target_id: "wrt_co_tay" },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Cầm bút đúng",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Cầm bút đúng",
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
    narration_template: "Chúng mình cùng tìm hiểu về Cầm bút đúng nhé",
  },
  ordering: [
    "wrt_but_chi",
    "wrt_but_sap",
    "wrt_tay_chi",
    "wrt_vo_tap",
    "wrt_cam_3_ngon",
    "wrt_ngon_cai_tro",
    "wrt_ngon_giua",
    "wrt_co_tay",
  ],
};

export const C5_WRT_01_SEED: SkillSeed = {
  identity: C5_WRT_01_IDENTITY,
  dataset: C5_WRT_01_DATASET,
  levels: [
    {
      code: "GL-C5-WRT-TAP-0001",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-TAP-0002",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-TCNT-0001",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-INTRO-6002",
      template: "GT-000",
      band: "3-4",
      difficulty: 1,
      access_tier: "standard",
      theme: "animal",
      rounds: 3,
      sequence_no: 61,
    },
    {
      code: "GL-C5-WRT-DROP-6004",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      access_tier: "standard",
      theme: "food",
      rounds: 3,
      sequence_no: 63,
    },
    {
      code: "GL-C5-WRT-MATCH-6006",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      access_tier: "standard",
      theme: "family",
      rounds: 3,
      sequence_no: 65,
    },
    {
      code: "GL-C5-WRT-BOND-6008",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      access_tier: "standard",
      theme: "weather",
      rounds: 3,
      sequence_no: 67,
    },
    {
      code: "GL-C5-WRT-SLOT-6010",
      template: "GT-008",
      band: "3-4",
      difficulty: 2,
      access_tier: "standard",
      theme: "farm",
      rounds: 3,
      sequence_no: 69,
    },
    {
      code: "GL-C5-WRT-SORT-6002",
      template: "GT-004",
      band: "4-5",
      difficulty: 1,
      theme: "body",
      rounds: 3,
      sequence_no: 61,
    },
    {
      code: "GL-C5-WRT-DED-6004",
      template: "GT-009",
      band: "4-5",
      difficulty: 2,
      theme: "festival",
      rounds: 3,
      sequence_no: 63,
    },
    {
      code: "GL-C5-WRT-FLASH-6006",
      template: "GT-012",
      band: "4-5",
      difficulty: 2,
      theme: "homeland",
      rounds: 3,
      sequence_no: 65,
    },
    {
      code: "GL-C5-WRT-AUDIO-6008",
      template: "GT-018",
      band: "4-5",
      difficulty: 2,
      theme: "home",
      rounds: 3,
      sequence_no: 67,
    },
  ],
};
