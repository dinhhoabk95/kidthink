import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_SOC_03_IDENTITY: SkillIdentity = {
  code: "C4.SOC.03",
  strand_code: "C4.SOC",
  competency_code: "C4",
  name: "Công việc trong nhà",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["match", "sort"],
  tier: "basic",
  prerequisites: ["C4.SOC.02"],
  learning_objectives: [
    {
      code: "LO-C4.SOC.03-01",
      behaviour: "Nhận biết và thực hành Công việc trong nhà ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.SOC.03-02",
      behaviour: "Vận dụng Công việc trong nhà trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.SOC.03-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Công việc trong nhà",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_SOC_03_DATASET: SkillDataset = {
  skill_code: "C4.SOC.03",
  concept_label: "Công việc trong nhà",
  surface: "game",
  items: [
    {
      id: "sweep",
      label: "chổi quét nhà",
      image: {
        kind: "emoji",
        ref: "🧹",
      },
      category: {
        type: "dụng cụ dọn",
      },
      value: 1,
      ordering: 1,
      contrast_group: "clean",
      audio_path: "/audio/vi/c4/sweep.mp3",
    },
    {
      id: "wipe_table",
      label: "miếng bọt biển",
      image: {
        kind: "emoji",
        ref: "🧽",
      },
      category: {
        type: "dụng cụ dọn",
      },
      value: 2,
      ordering: 2,
      contrast_group: "clean",
      audio_path: "/audio/vi/c4/wipe_table.mp3",
    },
    {
      id: "laundry",
      label: "giỏ đựng đồ",
      image: {
        kind: "emoji",
        ref: "🧺",
      },
      category: {
        type: "dụng cụ dọn",
      },
      value: 3,
      ordering: 3,
      contrast_group: "clean",
      audio_path: "/audio/vi/c4/laundry.mp3",
    },
    {
      id: "trash_sort",
      label: "thùng đựng rác",
      image: {
        kind: "emoji",
        ref: "🗑️",
      },
      category: {
        type: "dụng cụ dọn",
      },
      value: 4,
      ordering: 4,
      contrast_group: "clean",
      audio_path: "/audio/vi/c4/trash_sort.mp3",
    },
    {
      id: "cook",
      label: "chảo nấu ăn",
      image: {
        kind: "emoji",
        ref: "🍳",
      },
      category: {
        type: "đồ dùng bếp",
      },
      value: 1,
      ordering: 5,
      contrast_group: "kitchen",
      audio_path: "/audio/vi/c4/cook.mp3",
    },
    {
      id: "wash_dishes",
      label: "bát ăn cơm",
      image: {
        kind: "emoji",
        ref: "🥣",
      },
      category: {
        type: "đồ dùng bếp",
      },
      value: 2,
      ordering: 6,
      contrast_group: "kitchen",
      audio_path: "/audio/vi/c4/wash_dishes.mp3",
    },
    {
      id: "cooking_pot",
      label: "nồi nấu canh",
      image: {
        kind: "emoji",
        ref: "🍲",
      },
      category: {
        type: "đồ dùng bếp",
      },
      value: 3,
      ordering: 7,
      contrast_group: "kitchen",
      audio_path: "/audio/vi/c4/cooking_pot.mp3",
    },
    {
      id: "spoon",
      label: "chiếc thìa nhỏ",
      image: {
        kind: "emoji",
        ref: "🥄",
      },
      category: {
        type: "đồ dùng bếp",
      },
      value: 4,
      ordering: 8,
      contrast_group: "kitchen",
      audio_path: "/audio/vi/c4/spoon.mp3",
    },
  ],
  axes: {
    category: {
      values: ["dụng cụ dọn", "đồ dùng bếp"],
    },
  },
  relations: [
    {
      type: "contrast",
      source_id: "sweep",
      target_id: "cook",
    },
    {
      type: "contrast",
      source_id: "wipe_table",
      target_id: "wash_dishes",
    },
    {
      type: "contrast",
      source_id: "laundry",
      target_id: "cooking_pot",
    },
    {
      type: "contrast",
      source_id: "trash_sort",
      target_id: "spoon",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Công việc trong nhà",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Công việc trong nhà",
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
    narration_template: "Chúng mình cùng tìm hiểu về Công việc trong nhà nhé",
  },
  ordering: [
    "sweep",
    "wipe_table",
    "laundry",
    "trash_sort",
    "cook",
    "wash_dishes",
    "cooking_pot",
    "spoon",
  ],
};

export const C4_SOC_03_SEED: SkillSeed = {
  identity: C4_SOC_03_IDENTITY,
  dataset: C4_SOC_03_DATASET,
  levels: [
    {
      code: "GL-C4-SOC-TAP-0003",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C4-SOC-TAP-0004",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C4-SOC-TCNT-0001",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "job",
      rounds: 3,
    },
  ],
};
