import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_PHO_02_IDENTITY: SkillIdentity = {
  code: "C5.PHO.02",
  strand_code: "C5.PHO",
  competency_code: "C5",
  name: "Đếm tiếng trong từ",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["listen", "count"],
  tier: "core",
  prerequisites: ["C5.PHO.01", "C1.CNT.01"],
  learning_objectives: [
    {
      code: "LO-C5.PHO.02-01",
      behaviour: "Nhận biết và thực hành Đếm tiếng trong từ ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.PHO.02-02",
      behaviour: "Vận dụng Đếm tiếng trong từ trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.PHO.02-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Đếm tiếng trong từ",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_PHO_02_DATASET: SkillDataset = {
  skill_code: "C5.PHO.02",
  concept_label: "Đếm tiếng trong từ",
  surface: "game",
  items: [
    {
      id: "pho_ca",
      label: "tiếng cá (1 tiếng)",
      image: {
        kind: "emoji",
        ref: "🐟",
      },
      category: {
        type: "từ một tiếng",
        label: "Từ một tiếng",
      },
      contrast_group: "primary",
      value: 1,
      ordering: 1,
      audio_path: "/audio/vi/c5/pho/ca.mp3",
    },
    {
      id: "pho_ga",
      label: "tiếng gà (1 tiếng)",
      image: {
        kind: "emoji",
        ref: "🐔",
      },
      category: {
        type: "từ một tiếng",
        label: "Từ một tiếng",
      },
      contrast_group: "primary",
      value: 2,
      ordering: 2,
      audio_path: "/audio/vi/c5/pho/ga.mp3",
    },
    {
      id: "pho_meo",
      label: "tiếng mèo (1 tiếng)",
      image: {
        kind: "emoji",
        ref: "🐱",
      },
      category: {
        type: "từ một tiếng",
        label: "Từ một tiếng",
      },
      contrast_group: "primary",
      value: 3,
      ordering: 3,
      audio_path: "/audio/vi/c5/pho/meo.mp3",
    },
    {
      id: "pho_hoa_hong",
      label: "từ hoa hồng (2 tiếng)",
      image: {
        kind: "emoji",
        ref: "🌹",
      },
      category: {
        type: "từ hai tiếng",
        label: "Từ hai tiếng",
      },
      contrast_group: "contrast",
      value: 4,
      ordering: 4,
      audio_path: "/audio/vi/c5/pho/hoa_hong.mp3",
    },
    {
      id: "pho_may_bay",
      label: "từ máy bay (2 tiếng)",
      image: {
        kind: "emoji",
        ref: "✈️",
      },
      category: {
        type: "từ hai tiếng",
        label: "Từ hai tiếng",
      },
      contrast_group: "contrast",
      value: 5,
      ordering: 5,
      audio_path: "/audio/vi/c5/pho/may_bay.mp3",
    },
    {
      id: "pho_xe_dap",
      label: "từ xe đạp (2 tiếng)",
      image: {
        kind: "emoji",
        ref: "🚲",
      },
      category: {
        type: "từ hai tiếng",
        label: "Từ hai tiếng",
      },
      contrast_group: "contrast",
      value: 6,
      ordering: 6,
      audio_path: "/audio/vi/c5/pho/xe_dap.mp3",
    },
  ],
  axes: {
    category: {
      values: ["từ một tiếng", "từ hai tiếng"],
      ordered: true,
    },
  },
  relations: [
    {
      type: "contrast",
      source_id: "pho_ca",
      target_id: "pho_hoa_hong",
      explanation: "Từ một tiếng đối lập với từ hai tiếng",
    },
    {
      type: "contrast",
      source_id: "pho_ga",
      target_id: "pho_may_bay",
      explanation: "Từ một tiếng đối lập với từ hai tiếng",
    },
    {
      type: "contrast",
      source_id: "pho_meo",
      target_id: "pho_xe_dap",
      explanation: "Từ một tiếng đối lập với từ hai tiếng",
    },
    {
      type: "pair",
      source_id: "pho_ca",
      target_id: "pho_hoa_hong",
      explanation: "Cặp từ một tiếng và hai tiếng tương ứng",
    },
    {
      type: "pair",
      source_id: "pho_ga",
      target_id: "pho_may_bay",
      explanation: "Cặp từ một tiếng và hai tiếng tương ứng",
    },
    {
      type: "pair",
      source_id: "pho_meo",
      target_id: "pho_xe_dap",
      explanation: "Cặp từ một tiếng và hai tiếng tương ứng",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Đếm tiếng trong từ",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Đếm tiếng trong từ",
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
    narration_template: "Chúng mình cùng tìm hiểu về Đếm tiếng trong từ nhé",
  },
  ordering: [
    "pho_ca",
    "pho_ga",
    "pho_meo",
    "pho_hoa_hong",
    "pho_may_bay",
    "pho_xe_dap",
  ],
};

export const C5_PHO_02_SEED: SkillSeed = {
  identity: C5_PHO_02_IDENTITY,
  dataset: C5_PHO_02_DATASET,
  levels: [
    {
      code: "GL-C5-PHO-TAP-0001",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-PHO-TAP-0002",
      template: "GT-001",
      band: "3-4",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C5-PHO-TCNT-0001",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
  ],
};
