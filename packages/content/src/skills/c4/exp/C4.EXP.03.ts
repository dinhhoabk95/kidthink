import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_EXP_03_IDENTITY: SkillIdentity = {
  code: "C4.EXP.03",
  strand_code: "C4.EXP",
  competency_code: "C4",
  name: "Chất tan và chất giữ nguyên",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["predict", "verify"],
  tier: "core",
  prerequisites: ["C4.EXP.01"],
  learning_objectives: [
    {
      code: "LO-C4.EXP.03-01",
      behaviour: "Nhận biết và thực hành Tan – không tan ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.EXP.03-02",
      behaviour: "Vận dụng Tan – không tan trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.EXP.03-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Tan – không tan",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_EXP_03_DATASET: SkillDataset = {
  skill_code: "C4.EXP.03",
  concept_label: "Chất tan và chất giữ nguyên",
  surface: "game",
  items: [
    {
      id: "sol_salt",
      label: "hạt muối trắng",
      image: {
        kind: "emoji",
        ref: "🧂",
      },
      category: {
        type: "chất hòa tan",
      },
      contrast_group: "dissolve",
      value: 1,
      ordering: 1,
      audio_path: "/audio/vi/c4/sol_salt.mp3",
    },
    {
      id: "sol_sugar",
      label: "viên đường ngọt",
      image: {
        kind: "emoji",
        ref: "🍬",
      },
      category: {
        type: "chất hòa tan",
      },
      contrast_group: "dissolve",
      value: 2,
      ordering: 2,
      audio_path: "/audio/vi/c4/sol_sugar.mp3",
    },
    {
      id: "sol_honey",
      label: "mật ong thơm",
      image: {
        kind: "emoji",
        ref: "🍯",
      },
      category: {
        type: "chất hòa tan",
      },
      contrast_group: "dissolve",
      value: 3,
      ordering: 3,
      audio_path: "/audio/vi/c4/sol_honey.mp3",
    },
    {
      id: "sol_milk",
      label: "bột sữa trắng",
      image: {
        kind: "emoji",
        ref: "🥛",
      },
      category: {
        type: "chất hòa tan",
      },
      contrast_group: "dissolve",
      value: 4,
      ordering: 4,
      audio_path: "/audio/vi/c4/sol_milk.mp3",
    },
    {
      id: "insol_pebble",
      label: "viên sỏi đá",
      image: {
        kind: "emoji",
        ref: "🪨",
      },
      category: {
        type: "chất giữ nguyên",
      },
      contrast_group: "remain",
      value: 1,
      ordering: 5,
      audio_path: "/audio/vi/c4/insol_pebble.mp3",
    },
    {
      id: "insol_bean",
      label: "hạt đậu khô",
      image: {
        kind: "emoji",
        ref: "🫘",
      },
      category: {
        type: "chất giữ nguyên",
      },
      contrast_group: "remain",
      value: 2,
      ordering: 6,
      audio_path: "/audio/vi/c4/insol_bean.mp3",
    },
    {
      id: "insol_spoon",
      label: "chiếc thìa inox",
      image: {
        kind: "emoji",
        ref: "🥄",
      },
      category: {
        type: "chất giữ nguyên",
      },
      contrast_group: "remain",
      value: 3,
      ordering: 7,
      audio_path: "/audio/vi/c4/insol_spoon.mp3",
    },
    {
      id: "insol_wood",
      label: "khối gỗ nhỏ",
      image: {
        kind: "emoji",
        ref: "🪵",
      },
      category: {
        type: "chất giữ nguyên",
      },
      contrast_group: "remain",
      value: 4,
      ordering: 8,
      audio_path: "/audio/vi/c4/insol_wood.mp3",
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "sol_salt",
      target_id: "insol_pebble",
    },
    {
      type: "contrast",
      source_id: "sol_sugar",
      target_id: "insol_bean",
    },
    {
      type: "contrast",
      source_id: "sol_honey",
      target_id: "insol_spoon",
    },
    {
      type: "contrast",
      source_id: "sol_milk",
      target_id: "insol_wood",
    },
  ],
  axes: {
    solubility: {
      values: ["chất hòa tan", "chất giữ nguyên"],
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Chất tan và chất giữ nguyên",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Chất tan và chất giữ nguyên",
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
      "Chúng mình cùng tìm hiểu về Chất tan và chất giữ nguyên nhé",
  },
  ordering: [
    "sol_salt",
    "sol_sugar",
    "sol_honey",
    "sol_milk",
    "insol_pebble",
    "insol_bean",
    "insol_spoon",
    "insol_wood",
  ],
};

export const C4_EXP_03_SEED: SkillSeed = {
  identity: C4_EXP_03_IDENTITY,
  dataset: C4_EXP_03_DATASET,
  levels: [
    {
      code: "GL-C4-EXP-DOTS-0001",
      template: "GT-011",
      band: "5-6",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C4-EXP-DOTS-0002",
      template: "GT-011",
      band: "5-6",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C4-EXP-DIFF-0001",
      template: "GT-014",
      band: "5-6",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C4-EXP-ISO-0001",
      template: "GT-017",
      band: "5-6",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
  ],
};
