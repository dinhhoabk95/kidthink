import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_EXP_06_IDENTITY: SkillIdentity = {
  code: "C4.EXP.06",
  strand_code: "C4.EXP",
  competency_code: "C4",
  name: "Đổi một điều kiện rồi thử lại",
  age_min: 5,
  age_max: 6,
  difficulty: 5,
  thinking_processes: ["verify", "shift"],
  tier: "advanced",
  prerequisites: ["C4.EXP.05"],
  learning_objectives: [
    {
      code: "LO-C4.EXP.06-01",
      behaviour:
        "Nhận biết và thực hành Đổi một điều kiện rồi thử lại ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.EXP.06-02",
      behaviour:
        "Vận dụng Đổi một điều kiện rồi thử lại trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.EXP.06-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Đổi một điều kiện rồi thử lại",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_EXP_06_DATASET: SkillDataset = {
  skill_code: "C4.EXP.06",
  concept_label: "Đổi một điều kiện rồi thử lại",
  surface: "game",
  items: [
    {
      id: "cond_cold",
      label: "cốc nước đá",
      image: {
        kind: "emoji",
        ref: "🧊",
      },
      category: {
        type: "điều kiện đầu",
      },
      contrast_group: "initial",
      value: 1,
      ordering: 1,
      audio_path: "/audio/vi/c4/cond_cold.mp3",
    },
    {
      id: "cond_ramp_low",
      label: "xe dốc thấp",
      image: {
        kind: "emoji",
        ref: "🚗",
      },
      category: {
        type: "điều kiện đầu",
      },
      contrast_group: "initial",
      value: 2,
      ordering: 2,
      audio_path: "/audio/vi/c4/cond_ramp_low.mp3",
    },
    {
      id: "cond_wind_light",
      label: "diều gió nhẹ",
      image: {
        kind: "emoji",
        ref: "🪁",
      },
      category: {
        type: "điều kiện đầu",
      },
      contrast_group: "initial",
      value: 3,
      ordering: 3,
      audio_path: "/audio/vi/c4/cond_wind_light.mp3",
    },
    {
      id: "cond_shade",
      label: "cây trong bóng",
      image: {
        kind: "emoji",
        ref: "🌱",
      },
      category: {
        type: "điều kiện đầu",
      },
      contrast_group: "initial",
      value: 4,
      ordering: 4,
      audio_path: "/audio/vi/c4/cond_shade.mp3",
    },
    {
      id: "cond_warm",
      label: "cốc nước ấm",
      image: {
        kind: "emoji",
        ref: "♨️",
      },
      category: {
        type: "điều kiện đổi",
      },
      contrast_group: "changed",
      value: 1,
      ordering: 5,
      audio_path: "/audio/vi/c4/cond_warm.mp3",
    },
    {
      id: "cond_ramp_high",
      label: "xe dốc cao",
      image: {
        kind: "emoji",
        ref: "🏎️",
      },
      category: {
        type: "điều kiện đổi",
      },
      contrast_group: "changed",
      value: 2,
      ordering: 6,
      audio_path: "/audio/vi/c4/cond_ramp_high.mp3",
    },
    {
      id: "cond_wind_strong",
      label: "diều gió to",
      image: {
        kind: "emoji",
        ref: "💨",
      },
      category: {
        type: "điều kiện đổi",
      },
      contrast_group: "changed",
      value: 3,
      ordering: 7,
      audio_path: "/audio/vi/c4/cond_wind_strong.mp3",
    },
    {
      id: "cond_sun",
      label: "cây ngoài nắng",
      image: {
        kind: "emoji",
        ref: "☀️",
      },
      category: {
        type: "điều kiện đổi",
      },
      contrast_group: "changed",
      value: 4,
      ordering: 8,
      audio_path: "/audio/vi/c4/cond_sun.mp3",
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "cond_cold",
      target_id: "cond_warm",
    },
    {
      type: "contrast",
      source_id: "cond_ramp_low",
      target_id: "cond_ramp_high",
    },
    {
      type: "contrast",
      source_id: "cond_wind_light",
      target_id: "cond_wind_strong",
    },
    {
      type: "contrast",
      source_id: "cond_shade",
      target_id: "cond_sun",
    },
  ],
  axes: {
    condition_type: {
      values: ["điều kiện đầu", "điều kiện đổi"],
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Đổi một điều kiện rồi thử lại",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Đổi một điều kiện rồi thử lại",
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
      "Chúng mình cùng tìm hiểu về Đổi một điều kiện rồi thử lại nhé",
  },
  ordering: [
    "cond_cold",
    "cond_ramp_low",
    "cond_wind_light",
    "cond_shade",
    "cond_warm",
    "cond_ramp_high",
    "cond_wind_strong",
    "cond_sun",
  ],
};

export const C4_EXP_06_SEED: SkillSeed = {
  identity: C4_EXP_06_IDENTITY,
  dataset: C4_EXP_06_DATASET,
  levels: [
    {
      code: "GL-C4-EXP-PUZZ-0001",
      template: "GT-010",
      band: "5-6",
      difficulty: 4,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C4-EXP-ADD-0001",
      template: "GT-026",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C4-EXP-SUB-0001",
      template: "GT-027",
      band: "5-6",
      difficulty: 4,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C4-EXP-MEAS-0003",
      template: "GT-028",
      band: "5-6",
      difficulty: 4,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C4-EXP-TIME-0001",
      template: "GT-029",
      band: "5-6",
      difficulty: 4,
      theme: "food",
      rounds: 3,
    },
  ],
};
