import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_CAU_02_IDENTITY: SkillIdentity = {
  code: "C4.CAU.02",
  strand_code: "C4.CAU",
  competency_code: "C4",
  name: "Vì sao … thì …",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["infer", "describe"],
  tier: "core",
  prerequisites: ["C4.CAU.01"],
  learning_objectives: [
    {
      code: "LO-C4.CAU.02-01",
      behaviour: "Nhận biết và thực hành Vì sao … thì … ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.CAU.02-02",
      behaviour: "Vận dụng Vì sao … thì … trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.CAU.02-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Vì sao … thì …",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_CAU_02_DATASET: SkillDataset = {
  skill_code: "C4.CAU.02",
  concept_label: "Vì sao và kết quả",
  surface: "game",
  items: [
    {
      id: "why_cold",
      label: "trời gió lạnh",
      image: {
        kind: "emoji",
        ref: "❄️",
      },
      category: {
        type: "nguyên nhân",
      },
      contrast_group: "cause",
      value: 1,
      ordering: 1,
      audio_path: "/audio/vi/c4/why_cold.mp3",
    },
    {
      id: "why_rain",
      label: "trời đổ mưa",
      image: {
        kind: "emoji",
        ref: "🌧️",
      },
      category: {
        type: "nguyên nhân",
      },
      contrast_group: "cause",
      value: 2,
      ordering: 2,
      audio_path: "/audio/vi/c4/why_rain.mp3",
    },
    {
      id: "why_dark",
      label: "buổi tối đến",
      image: {
        kind: "emoji",
        ref: "🌙",
      },
      category: {
        type: "nguyên nhân",
      },
      contrast_group: "cause",
      value: 3,
      ordering: 3,
      audio_path: "/audio/vi/c4/why_dark.mp3",
    },
    {
      id: "why_sunny",
      label: "trời nắng gắt",
      image: {
        kind: "emoji",
        ref: "☀️",
      },
      category: {
        type: "nguyên nhân",
      },
      contrast_group: "cause",
      value: 4,
      ordering: 4,
      audio_path: "/audio/vi/c4/why_sunny.mp3",
    },
    {
      id: "act_jacket",
      label: "áo khoác ấm",
      image: {
        kind: "emoji",
        ref: "🧥",
      },
      category: {
        type: "hành động",
      },
      contrast_group: "effect",
      value: 1,
      ordering: 5,
      audio_path: "/audio/vi/c4/act_jacket.mp3",
    },
    {
      id: "act_umbrella",
      label: "chiếc ô che",
      image: {
        kind: "emoji",
        ref: "☂️",
      },
      category: {
        type: "hành động",
      },
      contrast_group: "effect",
      value: 2,
      ordering: 6,
      audio_path: "/audio/vi/c4/act_umbrella.mp3",
    },
    {
      id: "act_sleep",
      label: "giường ngủ êm",
      image: {
        kind: "emoji",
        ref: "🛏️",
      },
      category: {
        type: "hành động",
      },
      contrast_group: "effect",
      value: 3,
      ordering: 7,
      audio_path: "/audio/vi/c4/act_sleep.mp3",
    },
    {
      id: "act_hat",
      label: "chiếc mũ che",
      image: {
        kind: "emoji",
        ref: "👒",
      },
      category: {
        type: "hành động",
      },
      contrast_group: "effect",
      value: 4,
      ordering: 8,
      audio_path: "/audio/vi/c4/act_hat.mp3",
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "why_cold",
      target_id: "act_jacket",
    },
    {
      type: "pair",
      source_id: "why_rain",
      target_id: "act_umbrella",
    },
    {
      type: "pair",
      source_id: "why_dark",
      target_id: "act_sleep",
    },
    {
      type: "pair",
      source_id: "why_sunny",
      target_id: "act_hat",
    },
  ],
  axes: {
    cause_act: {
      values: ["nguyên nhân", "hành động"],
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Vì sao và kết quả",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Vì sao và kết quả",
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
    narration_template: "Chúng mình cùng tìm hiểu về Vì sao và kết quả nhé",
  },
  ordering: [
    "why_cold",
    "why_rain",
    "why_dark",
    "why_sunny",
    "act_jacket",
    "act_umbrella",
    "act_sleep",
    "act_hat",
  ],
};

export const C4_CAU_02_SEED: SkillSeed = {
  identity: C4_CAU_02_IDENTITY,
  dataset: C4_CAU_02_DATASET,
  levels: [
    {
      code: "GL-C4-CAU-PAIR-0003",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C4-CAU-PAIR-0004",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C4-CAU-TIME-0001",
      template: "GT-029",
      band: "4-5",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
  ],
};
