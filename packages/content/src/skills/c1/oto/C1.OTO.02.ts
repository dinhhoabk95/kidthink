import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_OTO_02_IDENTITY: SkillIdentity = {
  code: "C1.OTO.02",
  strand_code: "C1.OTO",
  competency_code: "C1",
  name: "Ghép nhiều với một",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["match", "infer"],
  tier: "core",
  prerequisites: ["C1.OTO.01"],
  learning_objectives: [
    {
      code: "LO-C1.OTO.02-01",
      behaviour: "Nhận biết và thực hành Ghép nhiều với một ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.OTO.02-02",
      behaviour: "Vận dụng Ghép nhiều với một trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.OTO.02-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Ghép nhiều với một",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_OTO_02_DATASET: SkillDataset = {
  skill_code: "C1.OTO.02",
  concept_label: "Ghép nhiều với một",
  surface: "game",
  items: [
    {
      id: "hen",
      label: "gà mẹ",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🐔",
      },
      contrast_group: "mother",
      category: {
        type: "nhóm mẹ",
      },
    },
    {
      id: "chick_1",
      label: "gà con mới nở",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🐣",
      },
      contrast_group: "baby",
      category: {
        type: "nhóm con",
      },
    },
    {
      id: "chick_2",
      label: "gà con lông vàng",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🐥",
      },
      contrast_group: "baby",
      category: {
        type: "nhóm con",
      },
    },
    {
      id: "chick_3",
      label: "gà con nhỏ xinh",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🐤",
      },
      contrast_group: "baby",
      category: {
        type: "nhóm con",
      },
    },
    {
      id: "duck_mother",
      label: "thiên nga mẹ",
      value: 5,
      image: {
        kind: "emoji",
        ref: "🦢",
      },
      contrast_group: "mother",
      category: {
        type: "nhóm mẹ",
      },
    },
    {
      id: "duckling",
      label: "vịt con bơi lội",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🦆",
      },
      contrast_group: "baby",
      category: {
        type: "nhóm con",
      },
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "chick_1",
      target_id: "hen",
    },
    {
      type: "pair",
      source_id: "chick_2",
      target_id: "hen",
    },
    {
      type: "pair",
      source_id: "chick_3",
      target_id: "hen",
    },
    {
      type: "pair",
      source_id: "duckling",
      target_id: "duck_mother",
    },
  ],
  axes: {
    role: {
      values: ["nhóm mẹ", "nhóm con"],
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với ghép nhiều với một",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng ghép nhiều với một",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt ghép nhiều với một với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi ghép nhiều với một",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục ghép nhiều với một và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn đúng {label} nhé!",
    narration_template: "Chúng mình cùng tìm hiểu về ghép nhiều với một nhé",
  },
  ordering: ["hen", "chick_1", "chick_2", "chick_3", "duck_mother", "duckling"],
};

export const C1_OTO_02_SEED: SkillSeed = {
  identity: C1_OTO_02_IDENTITY,
  dataset: C1_OTO_02_DATASET,
  levels: [
    {
      code: "GL-C1-OTO-TAP-0005",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-MIR-0001",
      template: "GT-021",
      band: "4-5",
      difficulty: 1,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-MIR-0002",
      template: "GT-021",
      band: "4-5",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
  ],
};
