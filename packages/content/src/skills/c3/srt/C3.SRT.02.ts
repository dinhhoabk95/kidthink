import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C3_SRT_02_IDENTITY: SkillIdentity = {
  code: "C3.SRT.02",
  strand_code: "C3.SRT",
  competency_code: "C3",
  name: "Sắp xếp giảm dần",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["sequence", "compare"],
  tier: "basic",
  prerequisites: ["C3.SRT.01"],
  learning_objectives: [
    {
      code: "LO-C3.SRT.02-01",
      behaviour: "Nhận biết và thực hành Sắp xếp giảm dần ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C3.SRT.02-02",
      behaviour: "Vận dụng Sắp xếp giảm dần trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C3.SRT.02-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Sắp xếp giảm dần",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C3_SRT_02_DATASET: SkillDataset = {
  skill_code: "C3.SRT.02",
  concept_label: "Sắp xếp giảm dần",
  surface: "game",
  items: [
    {
      id: "big_whale",
      label: "cá voi khổng lồ",
      image: {
        kind: "emoji",
        ref: "🐋",
      },
      category: {
        type: "động vật to",
      },
      contrast_group: "large_animals",
      value: 8,
      ordering: 1,
    },
    {
      id: "big_elephant",
      label: "con voi to lớn",
      image: {
        kind: "emoji",
        ref: "🐘",
      },
      category: {
        type: "động vật to",
      },
      contrast_group: "large_animals",
      value: 7,
      ordering: 2,
    },
    {
      id: "big_bear",
      label: "chú gấu lớn",
      image: {
        kind: "emoji",
        ref: "🐻",
      },
      category: {
        type: "động vật to",
      },
      contrast_group: "large_animals",
      value: 6,
      ordering: 3,
    },
    {
      id: "medium_dog",
      label: "chú chó vừa",
      image: {
        kind: "emoji",
        ref: "🐕",
      },
      category: {
        type: "động vật to",
      },
      contrast_group: "large_animals",
      value: 5,
      ordering: 4,
    },
    {
      id: "medium_cat",
      label: "chú mèo vừa",
      image: {
        kind: "emoji",
        ref: "🐈",
      },
      category: {
        type: "động vật nhỏ",
      },
      contrast_group: "small_animals",
      value: 4,
      ordering: 5,
    },
    {
      id: "small_rabbit",
      label: "chú thỏ nhỏ",
      image: {
        kind: "emoji",
        ref: "🐇",
      },
      category: {
        type: "động vật nhỏ",
      },
      contrast_group: "small_animals",
      value: 3,
      ordering: 6,
    },
    {
      id: "small_bird",
      label: "chú chim nhỏ",
      image: {
        kind: "emoji",
        ref: "🐦",
      },
      category: {
        type: "động vật nhỏ",
      },
      contrast_group: "small_animals",
      value: 2,
      ordering: 7,
    },
    {
      id: "small_ant",
      label: "chú kiến bé xíu",
      image: {
        kind: "emoji",
        ref: "🐜",
      },
      category: {
        type: "động vật nhỏ",
      },
      contrast_group: "small_animals",
      value: 1,
      ordering: 8,
    },
  ],
  relations: [
    {
      source_id: "big_whale",
      target_id: "big_elephant",
      type: "sequence",
    },
    {
      source_id: "big_elephant",
      target_id: "big_bear",
      type: "sequence",
    },
    {
      source_id: "big_bear",
      target_id: "medium_dog",
      type: "sequence",
    },
    {
      source_id: "medium_dog",
      target_id: "medium_cat",
      type: "sequence",
    },
    {
      source_id: "medium_cat",
      target_id: "small_rabbit",
      type: "sequence",
    },
    {
      source_id: "small_rabbit",
      target_id: "small_bird",
      type: "sequence",
    },
    {
      source_id: "small_bird",
      target_id: "small_ant",
      type: "sequence",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen dãy hai con vật kích thước khác nhau",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Sắp xếp ba con vật theo thứ tự giảm dần",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Sắp xếp bốn con vật từ lớn đến nhỏ",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Nhận biết vị trí thích hợp trong dãy giảm dần",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Hoàn thành dãy kích thước giảm dần độc lập",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn {label} nhé!",
    narration_template: "Chúng mình cùng xếp các con vật từ lớn đến nhỏ nhé",
  },
  ordering: [
    "big_whale",
    "big_elephant",
    "big_bear",
    "medium_dog",
    "medium_cat",
    "small_rabbit",
    "small_bird",
    "small_ant",
  ],
};

export const C3_SRT_02_SEED: SkillSeed = {
  identity: C3_SRT_02_IDENTITY,
  dataset: C3_SRT_02_DATASET,
  levels: [
    {
      template: "GT-000",
      band: "4-5",
      difficulty: 1,
      theme: "school",
    },
    {
      code: "GL-C3-SRT-MULT-0001",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C3-SRT-MULT-0002",
      template: "GT-005",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C3-COL-BSK-0007",
      template: "GT-003",
      band: "4-5",
      difficulty: 1,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C3-SRT-TCNT-0001",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C3-SRT-TCNT-0002",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C3-SRT-PAIR-0003",
      template: "GT-004",
      band: "4-5",
      difficulty: 1,
      theme: "home",
      rounds: 3,
    },
  ],
};
