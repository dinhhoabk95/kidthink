import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_LIV_02_IDENTITY: SkillIdentity = {
  code: "C4.LIV.02",
  strand_code: "C4.LIV",
  competency_code: "C4",
  name: "Bộ phận của con vật",
  age_min: 3,
  age_max: 3,
  difficulty: 2,
  thinking_processes: ["observe", "match"],
  tier: "basic",
  prerequisites: ["C4.DET.02"],
  learning_objectives: [
    {
      code: "LO-C4.LIV.02-01",
      behaviour: "Nhận biết và thực hành Bộ phận của con vật ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.LIV.02-02",
      behaviour: "Vận dụng Bộ phận của con vật trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.LIV.02-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Bộ phận của con vật",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_LIV_02_DATASET: SkillDataset = {
  skill_code: "C4.LIV.02",
  concept_label: "Bộ phận của con vật",
  surface: "game",
  items: [
    {
      id: "anm_ear",
      label: "đôi tai thỏ",
      image: {
        kind: "emoji",
        ref: "🐰",
      },
      category: {
        type: "bộ phận đầu",
      },
      contrast_group: "head",
      value: 1,
      ordering: 1,
      audio_path: "/audio/vi/c4/anm_ear.mp3",
    },
    {
      id: "anm_eye",
      label: "đôi mắt tròn",
      image: {
        kind: "emoji",
        ref: "👀",
      },
      category: {
        type: "bộ phận đầu",
      },
      contrast_group: "head",
      value: 2,
      ordering: 2,
      audio_path: "/audio/vi/c4/anm_eye.mp3",
    },
    {
      id: "anm_beak",
      label: "mỏ chim nhọn",
      image: {
        kind: "emoji",
        ref: "🐤",
      },
      category: {
        type: "bộ phận đầu",
      },
      contrast_group: "head",
      value: 3,
      ordering: 3,
      audio_path: "/audio/vi/c4/anm_beak.mp3",
    },
    {
      id: "anm_horn",
      label: "cặp sừng hươu",
      image: {
        kind: "emoji",
        ref: "🦌",
      },
      category: {
        type: "bộ phận đầu",
      },
      contrast_group: "head",
      value: 4,
      ordering: 4,
      audio_path: "/audio/vi/c4/anm_horn.mp3",
    },
    {
      id: "anm_wing",
      label: "đôi cánh bướm",
      image: {
        kind: "emoji",
        ref: "🦋",
      },
      category: {
        type: "bộ phận thân",
      },
      contrast_group: "body",
      value: 1,
      ordering: 5,
      audio_path: "/audio/vi/c4/anm_wing.mp3",
    },
    {
      id: "anm_paw",
      label: "bốn chân chạy",
      image: {
        kind: "emoji",
        ref: "🐾",
      },
      category: {
        type: "bộ phận thân",
      },
      contrast_group: "body",
      value: 2,
      ordering: 6,
      audio_path: "/audio/vi/c4/anm_paw.mp3",
    },
    {
      id: "anm_fin",
      label: "vây cá bơi",
      image: {
        kind: "emoji",
        ref: "🐟",
      },
      category: {
        type: "bộ phận thân",
      },
      contrast_group: "body",
      value: 3,
      ordering: 7,
      audio_path: "/audio/vi/c4/anm_fin.mp3",
    },
    {
      id: "anm_tail",
      label: "chiếc đuôi cong",
      image: {
        kind: "emoji",
        ref: "🐒",
      },
      category: {
        type: "bộ phận thân",
      },
      contrast_group: "body",
      value: 4,
      ordering: 8,
      audio_path: "/audio/vi/c4/anm_tail.mp3",
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "anm_ear",
      target_id: "anm_wing",
    },
    {
      type: "contrast",
      source_id: "anm_eye",
      target_id: "anm_paw",
    },
    {
      type: "contrast",
      source_id: "anm_beak",
      target_id: "anm_fin",
    },
    {
      type: "contrast",
      source_id: "anm_horn",
      target_id: "anm_tail",
    },
  ],
  axes: {
    animal_part: {
      values: ["bộ phận đầu", "bộ phận thân"],
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Bộ phận của con vật",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Bộ phận của con vật",
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
    narration_template: "Chúng mình cùng tìm hiểu về Bộ phận của con vật nhé",
  },
  ordering: [
    "anm_ear",
    "anm_eye",
    "anm_beak",
    "anm_horn",
    "anm_wing",
    "anm_paw",
    "anm_fin",
    "anm_tail",
  ],
};

export const C4_LIV_02_SEED: SkillSeed = {
  identity: C4_LIV_02_IDENTITY,
  dataset: C4_LIV_02_DATASET,
  levels: [
    {
      code: "GL-C4-LIV-TAP-0003",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C4-LIV-TAP-0004",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C4-LIV-TCMP-0003",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "food",
      rounds: 3,
    },
  ],
};
