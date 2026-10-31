import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_PHO_05_IDENTITY: SkillIdentity = {
  code: "C5.PHO.05",
  strand_code: "C5.PHO",
  competency_code: "C5",
  name: "Tìm tiếng cùng âm đầu",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["listen", "match"],
  tier: "advanced",
  prerequisites: ["C5.PHO.04", "C5.ONS.02"],
  learning_objectives: [
    {
      code: "LO-C5.PHO.05-01",
      behaviour: "Nhận biết và thực hành Tìm tiếng cùng âm đầu ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.PHO.05-02",
      behaviour: "Vận dụng Tìm tiếng cùng âm đầu trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.PHO.05-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Tìm tiếng cùng âm đầu",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_PHO_05_DATASET: SkillDataset = {
  skill_code: "C5.PHO.05",
  concept_label: "Tìm tiếng cùng âm đầu",
  surface: "game",
  items: [
    {
      id: "pho_ca_boi",
      label: "tiếng cá (âm đầu c)",
      glyph: "c",
      image: {
        kind: "emoji",
        ref: "🐟",
      },
      category: {
        type: "tiếng cùng âm c",
        label: "Cùng âm đầu c",
      },
      contrast_group: "primary",
      value: 1,
      ordering: 1,
      audio_path: "/audio/vi/c5/pho/ca.mp3",
    },
    {
      id: "pho_cua_dong",
      label: "tiếng cua (âm đầu c)",
      glyph: "c",
      image: {
        kind: "emoji",
        ref: "🦀",
      },
      category: {
        type: "tiếng cùng âm c",
        label: "Cùng âm đầu c",
      },
      contrast_group: "primary",
      value: 2,
      ordering: 2,
      audio_path: "/audio/vi/c5/pho/cua.mp3",
    },
    {
      id: "pho_cam_ngot",
      label: "tiếng cam (âm đầu c)",
      glyph: "c",
      image: {
        kind: "emoji",
        ref: "🍊",
      },
      category: {
        type: "tiếng cùng âm c",
        label: "Cùng âm đầu c",
      },
      contrast_group: "primary",
      value: 3,
      ordering: 3,
      audio_path: "/audio/vi/c5/pho/cam.mp3",
    },
    {
      id: "pho_ga_trong",
      label: "tiếng gà (âm đầu g)",
      glyph: "g",
      image: {
        kind: "emoji",
        ref: "🐔",
      },
      category: {
        type: "tiếng cùng âm g",
        label: "Cùng âm đầu g",
      },
      contrast_group: "contrast",
      value: 4,
      ordering: 4,
      audio_path: "/audio/vi/c5/pho/ga.mp3",
    },
    {
      id: "pho_gau_bong",
      label: "tiếng gấu (âm đầu g)",
      glyph: "g",
      image: {
        kind: "emoji",
        ref: "🧸",
      },
      category: {
        type: "tiếng cùng âm g",
        label: "Cùng âm đầu g",
      },
      contrast_group: "contrast",
      value: 5,
      ordering: 5,
      audio_path: "/audio/vi/c5/pho/gau.mp3",
    },
    {
      id: "pho_guong_soi",
      label: "tiếng gương (âm đầu g)",
      glyph: "g",
      image: {
        kind: "emoji",
        ref: "🪞",
      },
      category: {
        type: "tiếng cùng âm g",
        label: "Cùng âm đầu g",
      },
      contrast_group: "contrast",
      value: 6,
      ordering: 6,
      audio_path: "/audio/vi/c5/pho/guong.mp3",
    },
  ],
  axes: {
    category: {
      values: ["tiếng cùng âm c", "tiếng cùng âm g"],
      ordered: true,
    },
  },
  relations: [
    {
      type: "pair",
      source_id: "pho_ca_boi",
      target_id: "pho_cua_dong",
      explanation: "Cặp tiếng có cùng âm đầu c",
    },
    {
      type: "pair",
      source_id: "pho_cua_dong",
      target_id: "pho_cam_ngot",
      explanation: "Cặp tiếng có cùng âm đầu c",
    },
    {
      type: "pair",
      source_id: "pho_ga_trong",
      target_id: "pho_gau_bong",
      explanation: "Cặp tiếng có cùng âm đầu g",
    },
    {
      type: "pair",
      source_id: "pho_gau_bong",
      target_id: "pho_guong_soi",
      explanation: "Cặp tiếng có cùng âm đầu g",
    },
    {
      type: "contrast",
      source_id: "pho_ca_boi",
      target_id: "pho_ga_trong",
      explanation: "Tiếng có âm đầu c đối lập với tiếng có âm đầu g",
    },
    {
      type: "contrast",
      source_id: "pho_cua_dong",
      target_id: "pho_gau_bong",
      explanation: "Tiếng có âm đầu c đối lập với tiếng có âm đầu g",
    },
    {
      type: "contrast",
      source_id: "pho_cam_ngot",
      target_id: "pho_guong_soi",
      explanation: "Tiếng có âm đầu c đối lập với tiếng có âm đầu g",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Tìm tiếng cùng âm đầu",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Tìm tiếng cùng âm đầu",
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
    narration_template: "Chúng mình cùng tìm hiểu về Tìm tiếng cùng âm đầu nhé",
  },
  ordering: [
    "pho_ca_boi",
    "pho_cua_dong",
    "pho_cam_ngot",
    "pho_ga_trong",
    "pho_gau_bong",
    "pho_guong_soi",
  ],
};

export const C5_PHO_05_SEED: SkillSeed = {
  identity: C5_PHO_05_IDENTITY,
  dataset: C5_PHO_05_DATASET,
  levels: [
    {
      code: "GL-C5-PHO-TAP-0007",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-PHO-TAP-0008",
      template: "GT-001",
      band: "4-5",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C5-PHO-TCMP-0003",
      template: "GT-003",
      band: "4-5",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
  ],
};
