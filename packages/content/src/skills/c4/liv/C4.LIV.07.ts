import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_LIV_07_IDENTITY: SkillIdentity = {
  code: "C4.LIV.07",
  strand_code: "C4.LIV",
  competency_code: "C4",
  name: "Vòng đời bướm · gà · cây",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["sequence", "infer"],
  tier: "advanced",
  prerequisites: ["C4.LIV.06", "C3.SEQ.03"],
  learning_objectives: [
    {
      code: "LO-C4.LIV.07-01",
      behaviour: "Nhận biết và thực hành Vòng đời bướm · gà · cây ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.LIV.07-02",
      behaviour: "Vận dụng Vòng đời bướm · gà · cây trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.LIV.07-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Vòng đời bướm · gà · cây",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_LIV_07_DATASET: SkillDataset = {
  skill_code: "C4.LIV.07",
  concept_label: "Vòng đời bướm · gà · cây",
  surface: "game",
  items: [
    {
      id: "cyc_egg",
      label: "trứng bướm nhỏ",
      image: {
        kind: "emoji",
        ref: "🥚",
      },
      category: {
        type: "vòng đời bướm",
      },
      contrast_group: "butterfly",
      value: 1,
      ordering: 1,
      audio_path: "/audio/vi/c4/cyc_egg.mp3",
    },
    {
      id: "cyc_caterpillar",
      label: "sâu bướm non",
      image: {
        kind: "emoji",
        ref: "🐛",
      },
      category: {
        type: "vòng đời bướm",
      },
      contrast_group: "butterfly",
      value: 2,
      ordering: 2,
      audio_path: "/audio/vi/c4/cyc_caterpillar.mp3",
    },
    {
      id: "cyc_pupa",
      label: "kén nhộng nằm",
      image: {
        kind: "emoji",
        ref: "🫒",
      },
      category: {
        type: "vòng đời bướm",
      },
      contrast_group: "butterfly",
      value: 3,
      ordering: 3,
      audio_path: "/audio/vi/c4/cyc_pupa.mp3",
    },
    {
      id: "cyc_butterfly",
      label: "bướm lượn bay",
      image: {
        kind: "emoji",
        ref: "🦋",
      },
      category: {
        type: "vòng đời bướm",
      },
      contrast_group: "butterfly",
      value: 4,
      ordering: 4,
      audio_path: "/audio/vi/c4/cyc_butterfly.mp3",
    },
    {
      id: "cyc_seed",
      label: "hạt mầm gieo",
      image: {
        kind: "emoji",
        ref: "🌰",
      },
      category: {
        type: "vòng đời cây",
      },
      contrast_group: "plant",
      value: 1,
      ordering: 5,
      audio_path: "/audio/vi/c4/cyc_seed.mp3",
    },
    {
      id: "cyc_sprout",
      label: "mầm non nhú",
      image: {
        kind: "emoji",
        ref: "🌱",
      },
      category: {
        type: "vòng đời cây",
      },
      contrast_group: "plant",
      value: 2,
      ordering: 6,
      audio_path: "/audio/vi/c4/cyc_sprout.mp3",
    },
    {
      id: "cyc_flower",
      label: "cây nở hoa",
      image: {
        kind: "emoji",
        ref: "🌸",
      },
      category: {
        type: "vòng đời cây",
      },
      contrast_group: "plant",
      value: 3,
      ordering: 7,
      audio_path: "/audio/vi/c4/cyc_flower.mp3",
    },
    {
      id: "cyc_fruit",
      label: "cây trĩu quả",
      image: {
        kind: "emoji",
        ref: "🍎",
      },
      category: {
        type: "vòng đời cây",
      },
      contrast_group: "plant",
      value: 4,
      ordering: 8,
      audio_path: "/audio/vi/c4/cyc_fruit.mp3",
    },
  ],
  relations: [
    {
      type: "sequence",
      source_id: "cyc_egg",
      target_id: "cyc_caterpillar",
    },
    {
      type: "sequence",
      source_id: "cyc_caterpillar",
      target_id: "cyc_pupa",
    },
    {
      type: "sequence",
      source_id: "cyc_pupa",
      target_id: "cyc_butterfly",
    },
    {
      type: "sequence",
      source_id: "cyc_seed",
      target_id: "cyc_sprout",
    },
    {
      type: "sequence",
      source_id: "cyc_sprout",
      target_id: "cyc_flower",
    },
    {
      type: "sequence",
      source_id: "cyc_flower",
      target_id: "cyc_fruit",
    },
  ],
  axes: {
    life_cycle: {
      values: ["vòng đời bướm", "vòng đời cây"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Vòng đời bướm · gà · cây",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Vòng đời bướm · gà · cây",
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
      "Chúng mình cùng tìm hiểu về Vòng đời bướm · gà · cây nhé",
  },
  ordering: [
    "cyc_egg",
    "cyc_caterpillar",
    "cyc_pupa",
    "cyc_butterfly",
    "cyc_seed",
    "cyc_sprout",
    "cyc_flower",
    "cyc_fruit",
  ],
};

export const C4_LIV_07_SEED: SkillSeed = {
  identity: C4_LIV_07_IDENTITY,
  dataset: C4_LIV_07_DATASET,
  levels: [
    {
      code: "GL-C4-LIV-PAIR-0009",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C4-LIV-PAIR-0010",
      template: "GT-004",
      band: "4-5",
      difficulty: 4,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C4-LIV-SORT-0003",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
  ],
};
