import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_PHO_01_IDENTITY: SkillIdentity = {
  code: "C5.PHO.01",
  strand_code: "C5.PHO",
  competency_code: "C5",
  name: "Nghe ra từng tiếng trong câu",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["listen", "sequence"],
  tier: "core",
  prerequisites: ["C5.LIS.01"],
  learning_objectives: [
    {
      code: "LO-C5.PHO.01-01",
      behaviour:
        "Nhận biết và thực hành Nghe ra từng tiếng trong câu ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.PHO.01-02",
      behaviour:
        "Vận dụng Nghe ra từng tiếng trong câu trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.PHO.01-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Nghe ra từng tiếng trong câu",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_PHO_01_DATASET: SkillDataset = {
  skill_code: "C5.PHO.01",
  concept_label: "Nghe ra từng tiếng trong câu",
  surface: "game",
  items: [
    {
      id: "pho_be_di_hoc",
      label: "bé đi học",
      image: {
        kind: "emoji",
        ref: "🎒",
      },
      category: {
        type: "câu ba tiếng",
        label: "Câu ba tiếng",
      },
      contrast_group: "primary",
      value: 1,
      ordering: 1,
      audio_path: "/audio/vi/c5/pho/be_di_hoc.mp3",
    },
    {
      id: "pho_me_di_cho",
      label: "mẹ đi chợ",
      image: {
        kind: "emoji",
        ref: "🧺",
      },
      category: {
        type: "câu ba tiếng",
        label: "Câu ba tiếng",
      },
      contrast_group: "primary",
      value: 2,
      ordering: 2,
      audio_path: "/audio/vi/c5/pho/me_di_cho.mp3",
    },
    {
      id: "pho_ba_ke_chuyen",
      label: "bà kể chuyện",
      image: {
        kind: "emoji",
        ref: "👵",
      },
      category: {
        type: "câu ba tiếng",
        label: "Câu ba tiếng",
      },
      contrast_group: "primary",
      value: 3,
      ordering: 3,
      audio_path: "/audio/vi/c5/pho/ba_ke_chuyen.mp3",
    },
    {
      id: "pho_troi_mua_rat_to",
      label: "trời mưa rất to",
      image: {
        kind: "emoji",
        ref: "🌧️",
      },
      category: {
        type: "câu bốn tiếng",
        label: "Câu bốn tiếng",
      },
      contrast_group: "contrast",
      value: 4,
      ordering: 4,
      audio_path: "/audio/vi/c5/pho/troi_mua_rat_to.mp3",
    },
    {
      id: "pho_chim_hot_liu_lo",
      label: "chim hót líu lo",
      image: {
        kind: "emoji",
        ref: "🐦",
      },
      category: {
        type: "câu bốn tiếng",
        label: "Câu bốn tiếng",
      },
      contrast_group: "contrast",
      value: 5,
      ordering: 5,
      audio_path: "/audio/vi/c5/pho/chim_hot_liu_lo.mp3",
    },
    {
      id: "pho_be_yeu_ong_ba",
      label: "bé yêu ông bà",
      image: {
        kind: "emoji",
        ref: "🏡",
      },
      category: {
        type: "câu bốn tiếng",
        label: "Câu bốn tiếng",
      },
      contrast_group: "contrast",
      value: 6,
      ordering: 6,
      audio_path: "/audio/vi/c5/pho/be_yeu_ong_ba.mp3",
    },
  ],
  axes: {
    category: {
      values: ["câu ba tiếng", "câu bốn tiếng"],
      ordered: true,
    },
  },
  relations: [
    {
      type: "sequence",
      source_id: "pho_be_di_hoc",
      target_id: "pho_me_di_cho",
      explanation: "Chuỗi câu ba tiếng từ việc bé đi học đến mẹ đi chợ",
    },
    {
      type: "sequence",
      source_id: "pho_me_di_cho",
      target_id: "pho_ba_ke_chuyen",
      explanation: "Chuỗi câu ba tiếng từ mẹ đi chợ đến bà kể chuyện",
    },
    {
      type: "sequence",
      source_id: "pho_troi_mua_rat_to",
      target_id: "pho_chim_hot_liu_lo",
      explanation: "Chuỗi câu bốn tiếng từ trời mưa đến chim hót",
    },
    {
      type: "contrast",
      source_id: "pho_be_di_hoc",
      target_id: "pho_troi_mua_rat_to",
      explanation: "Câu ba tiếng đối lập với câu bốn tiếng",
    },
    {
      type: "contrast",
      source_id: "pho_me_di_cho",
      target_id: "pho_chim_hot_liu_lo",
      explanation: "Câu ba tiếng đối lập với câu bốn tiếng",
    },
    {
      type: "contrast",
      source_id: "pho_ba_ke_chuyen",
      target_id: "pho_be_yeu_ong_ba",
      explanation: "Câu ba tiếng đối lập với câu bốn tiếng",
    },
    {
      type: "pair",
      source_id: "pho_be_di_hoc",
      target_id: "pho_troi_mua_rat_to",
      explanation: "Cặp câu ba tiếng và bốn tiếng tương ứng",
    },
    {
      type: "pair",
      source_id: "pho_me_di_cho",
      target_id: "pho_chim_hot_liu_lo",
      explanation: "Cặp câu ba tiếng và bốn tiếng tương ứng",
    },
    {
      type: "pair",
      source_id: "pho_ba_ke_chuyen",
      target_id: "pho_be_yeu_ong_ba",
      explanation: "Cặp câu ba tiếng và bốn tiếng tương ứng",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Nghe ra từng tiếng trong câu",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nghe ra từng tiếng trong câu",
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
      "Chúng mình cùng tìm hiểu về Nghe ra từng tiếng trong câu nhé",
  },
  ordering: [
    "pho_be_di_hoc",
    "pho_me_di_cho",
    "pho_ba_ke_chuyen",
    "pho_troi_mua_rat_to",
    "pho_chim_hot_liu_lo",
    "pho_be_yeu_ong_ba",
  ],
};

export const C5_PHO_01_SEED: SkillSeed = {
  identity: C5_PHO_01_IDENTITY,
  dataset: C5_PHO_01_DATASET,
  levels: [
    {
      template: "GT-000",
      band: "4-5",
      difficulty: 1,
      theme: "school",
    },
    {
      code: "GL-C5-PHO-BOND-0001",
      template: "GT-018",
      band: "4-5",
      difficulty: 2,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C5-PHO-BOND-0002",
      template: "GT-018",
      band: "4-5",
      difficulty: 3,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C5-PHO-MTRX-0001",
      template: "GT-023",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-PHO-MTRX-0002",
      template: "GT-023",
      band: "4-5",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-008",
      band: "4-5",
      difficulty: 1,
      theme: "school",
    },
  ],
};
