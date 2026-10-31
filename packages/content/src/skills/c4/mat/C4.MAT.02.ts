import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_MAT_02_IDENTITY: SkillIdentity = {
  code: "C4.MAT.02",
  strand_code: "C4.MAT",
  competency_code: "C4",
  name: "Nóng – lạnh",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["compare", "observe"],
  tier: "basic",
  prerequisites: ["C4.TAC.03"],
  learning_objectives: [
    {
      code: "LO-C4.MAT.02-01",
      behaviour: "Nhận biết và thực hành Nóng – lạnh ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.MAT.02-02",
      behaviour: "Vận dụng Nóng – lạnh trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.MAT.02-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Nóng – lạnh",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_MAT_02_DATASET: SkillDataset = {
  skill_code: "C4.MAT.02",
  concept_label: "Nóng – lạnh",
  surface: "game",
  items: [
    {
      id: "mat_hot_soup",
      label: "bát súp nóng",
      image: {
        kind: "emoji",
        ref: "🍲",
      },
      category: {
        type: "đồ ấm nóng",
      },
      contrast_group: "hot",
      value: 1,
      ordering: 1,
      audio_path: "/audio/vi/c4/mat_hot_soup.mp3",
    },
    {
      id: "mat_hot_tea",
      label: "tách trà nóng",
      image: {
        kind: "emoji",
        ref: "🍵",
      },
      category: {
        type: "đồ ấm nóng",
      },
      contrast_group: "hot",
      value: 2,
      ordering: 2,
      audio_path: "/audio/vi/c4/mat_hot_tea.mp3",
    },
    {
      id: "mat_hot_sun",
      label: "mặt trời nóng",
      image: {
        kind: "emoji",
        ref: "☀️",
      },
      category: {
        type: "đồ ấm nóng",
      },
      contrast_group: "hot",
      value: 3,
      ordering: 3,
      audio_path: "/audio/vi/c4/mat_hot_sun.mp3",
    },
    {
      id: "mat_hot_fire",
      label: "ngọn lửa hồng",
      image: {
        kind: "emoji",
        ref: "🔥",
      },
      category: {
        type: "đồ ấm nóng",
      },
      contrast_group: "hot",
      value: 4,
      ordering: 4,
      audio_path: "/audio/vi/c4/mat_hot_fire.mp3",
    },
    {
      id: "mat_cold_icecream",
      label: "cây kem mát lạnh",
      image: {
        kind: "emoji",
        ref: "🍦",
      },
      category: {
        type: "đồ mát lạnh",
      },
      contrast_group: "cold",
      value: 1,
      ordering: 5,
      audio_path: "/audio/vi/c4/mat_cold_icecream.mp3",
    },
    {
      id: "mat_cold_ice",
      label: "viên đá lạnh buốt",
      image: {
        kind: "emoji",
        ref: "🧊",
      },
      category: {
        type: "đồ mát lạnh",
      },
      contrast_group: "cold",
      value: 2,
      ordering: 6,
      audio_path: "/audio/vi/c4/mat_cold_ice.mp3",
    },
    {
      id: "mat_cold_snowman",
      label: "người tuyết trắng",
      image: {
        kind: "emoji",
        ref: "⛄",
      },
      category: {
        type: "đồ mát lạnh",
      },
      contrast_group: "cold",
      value: 3,
      ordering: 7,
      audio_path: "/audio/vi/c4/mat_cold_snowman.mp3",
    },
    {
      id: "mat_cold_snowflake",
      label: "bông tuyết rơi",
      image: {
        kind: "emoji",
        ref: "❄️",
      },
      category: {
        type: "đồ mát lạnh",
      },
      contrast_group: "cold",
      value: 4,
      ordering: 8,
      audio_path: "/audio/vi/c4/mat_cold_snowflake.mp3",
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "mat_hot_soup",
      target_id: "mat_cold_icecream",
    },
    {
      type: "contrast",
      source_id: "mat_hot_tea",
      target_id: "mat_cold_ice",
    },
    {
      type: "contrast",
      source_id: "mat_hot_sun",
      target_id: "mat_cold_snowman",
    },
    {
      type: "contrast",
      source_id: "mat_hot_fire",
      target_id: "mat_cold_snowflake",
    },
  ],
  axes: {
    temperature: {
      values: ["đồ ấm nóng", "đồ mát lạnh"],
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Nóng – lạnh",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nóng – lạnh",
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
    narration_template: "Chúng mình cùng tìm hiểu về Nóng – lạnh nhé",
  },
  ordering: [
    "mat_hot_soup",
    "mat_hot_tea",
    "mat_hot_sun",
    "mat_hot_fire",
    "mat_cold_icecream",
    "mat_cold_ice",
    "mat_cold_snowman",
    "mat_cold_snowflake",
  ],
};

export const C4_MAT_02_SEED: SkillSeed = {
  identity: C4_MAT_02_IDENTITY,
  dataset: C4_MAT_02_DATASET,
  levels: [
    {
      code: "GL-C4-MAT-TAP-0003",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C4-MAT-TAP-0004",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C4-MAT-TCNT-0001",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
  ],
};
