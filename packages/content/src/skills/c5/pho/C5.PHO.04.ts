import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_PHO_04_IDENTITY: SkillIdentity = {
  code: "C5.PHO.04",
  strand_code: "C5.PHO",
  competency_code: "C5",
  name: "Nghe ra âm đầu của tiếng",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["listen", "compare"],
  tier: "advanced",
  prerequisites: ["C5.PHO.02", "C5.ONS.01"],
  learning_objectives: [
    {
      code: "LO-C5.PHO.04-01",
      behaviour: "Nhận biết và thực hành Nghe ra âm đầu của tiếng ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.PHO.04-02",
      behaviour: "Vận dụng Nghe ra âm đầu của tiếng trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.PHO.04-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Nghe ra âm đầu của tiếng",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_PHO_04_DATASET: SkillDataset = {
  skill_code: "C5.PHO.04",
  concept_label: "Nghe ra âm đầu của tiếng",
  surface: "game",
  items: [
    {
      id: "pho_bong",
      label: "tiếng bóng (quả bóng)",
      image: {
        kind: "emoji",
        ref: "⚽",
      },
      category: {
        type: "âm đầu b",
        label: "Âm đầu b",
      },
      contrast_group: "primary",
      value: 1,
      ordering: 1,
      audio_path: "/audio/vi/c5/pho/bong.mp3",
    },
    {
      id: "pho_banh",
      label: "tiếng bánh (bánh vòng)",
      image: {
        kind: "emoji",
        ref: "🍩",
      },
      category: {
        type: "âm đầu b",
        label: "Âm đầu b",
      },
      contrast_group: "primary",
      value: 2,
      ordering: 2,
      audio_path: "/audio/vi/c5/pho/banh.mp3",
    },
    {
      id: "pho_buom",
      label: "tiếng bướm (con bướm)",
      image: {
        kind: "emoji",
        ref: "🦋",
      },
      category: {
        type: "âm đầu b",
        label: "Âm đầu b",
      },
      contrast_group: "primary",
      value: 3,
      ordering: 3,
      audio_path: "/audio/vi/c5/pho/buom.mp3",
    },
    {
      id: "pho_meo_con",
      label: "tiếng mèo (con mèo)",
      image: {
        kind: "emoji",
        ref: "🐱",
      },
      category: {
        type: "âm đầu m",
        label: "Âm đầu m",
      },
      contrast_group: "contrast",
      value: 4,
      ordering: 4,
      audio_path: "/audio/vi/c5/pho/meo.mp3",
    },
    {
      id: "pho_mu",
      label: "tiếng mũ (cái mũ)",
      image: {
        kind: "emoji",
        ref: "🧢",
      },
      category: {
        type: "âm đầu m",
        label: "Âm đầu m",
      },
      contrast_group: "contrast",
      value: 5,
      ordering: 5,
      audio_path: "/audio/vi/c5/pho/mu.mp3",
    },
    {
      id: "pho_may",
      label: "tiếng mây (đám mây)",
      image: {
        kind: "emoji",
        ref: "☁️",
      },
      category: {
        type: "âm đầu m",
        label: "Âm đầu m",
      },
      contrast_group: "contrast",
      value: 6,
      ordering: 6,
      audio_path: "/audio/vi/c5/pho/may.mp3",
    },
  ],
  axes: {
    category: {
      values: ["âm đầu b", "âm đầu m"],
      ordered: true,
    },
  },
  relations: [
    {
      type: "contrast",
      source_id: "pho_bong",
      target_id: "pho_meo_con",
      explanation: "Tiếng có âm đầu b đối lập với tiếng có âm đầu m",
    },
    {
      type: "contrast",
      source_id: "pho_banh",
      target_id: "pho_mu",
      explanation: "Tiếng có âm đầu b đối lập với tiếng có âm đầu m",
    },
    {
      type: "contrast",
      source_id: "pho_buom",
      target_id: "pho_may",
      explanation: "Tiếng có âm đầu b đối lập với tiếng có âm đầu m",
    },
    {
      type: "pair",
      source_id: "pho_bong",
      target_id: "pho_meo_con",
      explanation: "Cặp so sánh tiếng âm đầu b và âm đầu m tương ứng",
    },
    {
      type: "pair",
      source_id: "pho_banh",
      target_id: "pho_mu",
      explanation: "Cặp so sánh tiếng âm đầu b và âm đầu m tương ứng",
    },
    {
      type: "pair",
      source_id: "pho_buom",
      target_id: "pho_may",
      explanation: "Cặp so sánh tiếng âm đầu b và âm đầu m tương ứng",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Nghe ra âm đầu của tiếng",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nghe ra âm đầu của tiếng",
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
      "Chúng mình cùng tìm hiểu về Nghe ra âm đầu của tiếng nhé",
  },
  ordering: [
    "pho_bong",
    "pho_banh",
    "pho_buom",
    "pho_meo_con",
    "pho_mu",
    "pho_may",
  ],
};

export const C5_PHO_04_SEED: SkillSeed = {
  identity: C5_PHO_04_IDENTITY,
  dataset: C5_PHO_04_DATASET,
  levels: [
    {
      code: "GL-C5-PHO-TAP-0005",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C5-PHO-TAP-0006",
      template: "GT-001",
      band: "4-5",
      difficulty: 4,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C5-PHO-TCNT-0005",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
  ],
};
