import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_SAF_02_IDENTITY: SkillIdentity = {
  code: "C4.SAF.02",
  strand_code: "C4.SAF",
  competency_code: "C4",
  name: "Đèn giao thông",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["match", "inhibit"],
  tier: "basic",
  prerequisites: ["C3.CLS.01"],
  learning_objectives: [
    {
      code: "LO-C4.SAF.02-01",
      behaviour: "Nhận biết và thực hành Đèn giao thông ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.SAF.02-02",
      behaviour: "Vận dụng Đèn giao thông trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.SAF.02-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Đèn giao thông",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_SAF_02_DATASET: SkillDataset = {
  skill_code: "C4.SAF.02",
  concept_label: "Đèn giao thông",
  surface: "game",
  items: [
    {
      id: "green_light",
      label: "đèn màu xanh",
      image: {
        kind: "emoji",
        ref: "🟢",
      },
      category: {
        type: "tín hiệu đi",
      },
      value: 1,
      ordering: 1,
      contrast_group: "go",
      audio_path: "/audio/vi/c4/green_light.mp3",
    },
    {
      id: "walk_sign",
      label: "đèn đi bộ",
      image: {
        kind: "emoji",
        ref: "🚶",
      },
      category: {
        type: "tín hiệu đi",
      },
      value: 2,
      ordering: 2,
      contrast_group: "go",
      audio_path: "/audio/vi/c4/walk_sign.mp3",
    },
    {
      id: "crosswalk",
      label: "vạch sang đường",
      image: {
        kind: "emoji",
        ref: "🚸",
      },
      category: {
        type: "tín hiệu đi",
      },
      value: 3,
      ordering: 3,
      contrast_group: "go",
      audio_path: "/audio/vi/c4/crosswalk.mp3",
    },
    {
      id: "helmet",
      label: "mũ bảo hiểm",
      image: {
        kind: "emoji",
        ref: "🪖",
      },
      category: {
        type: "tín hiệu đi",
      },
      value: 4,
      ordering: 4,
      contrast_group: "go",
      audio_path: "/audio/vi/c4/helmet.mp3",
    },
    {
      id: "red_light",
      label: "đèn màu đỏ",
      image: {
        kind: "emoji",
        ref: "🔴",
      },
      category: {
        type: "tín hiệu dừng",
      },
      value: 1,
      ordering: 5,
      contrast_group: "stop",
      audio_path: "/audio/vi/c4/red_light.mp3",
    },
    {
      id: "yellow_light",
      label: "đèn màu vàng",
      image: {
        kind: "emoji",
        ref: "🟡",
      },
      category: {
        type: "tín hiệu dừng",
      },
      value: 2,
      ordering: 6,
      contrast_group: "stop",
      audio_path: "/audio/vi/c4/yellow_light.mp3",
    },
    {
      id: "siren",
      label: "còi báo động",
      image: {
        kind: "emoji",
        ref: "🚨",
      },
      category: {
        type: "tín hiệu dừng",
      },
      value: 3,
      ordering: 7,
      contrast_group: "stop",
      audio_path: "/audio/vi/c4/siren.mp3",
    },
    {
      id: "barrier",
      label: "hàng rào chắn",
      image: {
        kind: "emoji",
        ref: "🚧",
      },
      category: {
        type: "tín hiệu dừng",
      },
      value: 4,
      ordering: 8,
      contrast_group: "stop",
      audio_path: "/audio/vi/c4/barrier.mp3",
    },
  ],
  axes: {
    category: {
      values: ["tín hiệu đi", "tín hiệu dừng"],
    },
  },
  relations: [
    {
      type: "contrast",
      source_id: "green_light",
      target_id: "red_light",
    },
    {
      type: "contrast",
      source_id: "walk_sign",
      target_id: "yellow_light",
    },
    {
      type: "contrast",
      source_id: "crosswalk",
      target_id: "barrier",
    },
    {
      type: "contrast",
      source_id: "helmet",
      target_id: "siren",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Đèn giao thông",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Đèn giao thông",
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
    narration_template: "Chúng mình cùng tìm hiểu về Đèn giao thông nhé",
  },
  ordering: [
    "green_light",
    "walk_sign",
    "crosswalk",
    "helmet",
    "red_light",
    "yellow_light",
    "siren",
    "barrier",
  ],
};

export const C4_SAF_02_SEED: SkillSeed = {
  identity: C4_SAF_02_IDENTITY,
  dataset: C4_SAF_02_DATASET,
  levels: [
    {
      code: "GL-C4-SAF-TAP-0003",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      template: "GT-026",
      band: "5-6",
      difficulty: 2,
      theme: "farm",
    },
    {
      template: "GT-026",
      band: "5-6",
      difficulty: 3,
      theme: "nature",
    },
  ],
};
