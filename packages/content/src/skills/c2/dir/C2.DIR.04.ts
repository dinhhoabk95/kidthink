import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_DIR_04_IDENTITY: SkillIdentity = {
  code: "C2.DIR.04",
  strand_code: "C2.DIR",
  competency_code: "C2",
  name: "Rẽ phải",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["plan", "shift"],
  tier: "core",
  prerequisites: ["C2.ORI.02"],
  learning_objectives: [
    {
      code: "LO-C2.DIR.04-01",
      behaviour: "Nhận biết và thực hành Rẽ phải ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.DIR.04-02",
      behaviour: "Vận dụng Rẽ phải trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.DIR.04-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Rẽ phải",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_DIR_04_DATASET: SkillDataset = {
  skill_code: "C2.DIR.04",
  concept_label: "Rẽ phải",
  surface: "game",
  items: [
    {
      id: "arrow_right",
      label: "mũi tên rẽ phải",
      image: {
        kind: "emoji",
        ref: "➡️",
      },
      category: {
        type: "rẽ phải",
      },
      contrast_group: "turn_right",
      value: 1,
      ordering: 1,
    },
    {
      id: "train_right",
      label: "tàu chạy rẽ phải",
      image: {
        kind: "emoji",
        ref: "🚄",
      },
      category: {
        type: "rẽ phải",
      },
      contrast_group: "turn_right",
      value: 2,
      ordering: 2,
    },
    {
      id: "runner_right",
      label: "bạn nhỏ rẽ phải",
      image: {
        kind: "emoji",
        ref: "🏃",
      },
      category: {
        type: "rẽ phải",
      },
      contrast_group: "turn_right",
      value: 3,
      ordering: 3,
    },
    {
      id: "boat_right",
      label: "thuyền buồm rẽ phải",
      image: {
        kind: "emoji",
        ref: "⛵",
      },
      category: {
        type: "rẽ phải",
      },
      contrast_group: "turn_right",
      value: 4,
      ordering: 4,
    },
    {
      id: "arrow_left",
      label: "mũi tên rẽ trái",
      image: {
        kind: "emoji",
        ref: "⬅️",
      },
      category: {
        type: "rẽ trái",
      },
      contrast_group: "turn_left",
      value: 5,
      ordering: 5,
    },
    {
      id: "tractor_left",
      label: "máy cày rẽ trái",
      image: {
        kind: "emoji",
        ref: "🚜",
      },
      category: {
        type: "rẽ trái",
      },
      contrast_group: "turn_left",
      value: 6,
      ordering: 6,
    },
    {
      id: "horse_left",
      label: "ngựa phi rẽ trái",
      image: {
        kind: "emoji",
        ref: "🐎",
      },
      category: {
        type: "rẽ trái",
      },
      contrast_group: "turn_left",
      value: 7,
      ordering: 7,
    },
    {
      id: "heli_left",
      label: "trực thăng rẽ trái",
      image: {
        kind: "emoji",
        ref: "🚁",
      },
      category: {
        type: "rẽ trái",
      },
      contrast_group: "turn_left",
      value: 8,
      ordering: 8,
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "arrow_right",
      target_id: "arrow_left",
    },
    {
      type: "pair",
      source_id: "train_right",
      target_id: "tractor_left",
    },
    {
      type: "pair",
      source_id: "runner_right",
      target_id: "horse_left",
    },
    {
      type: "pair",
      source_id: "boat_right",
      target_id: "heli_left",
    },
    {
      type: "contrast",
      source_id: "arrow_right",
      target_id: "arrow_left",
    },
  ],
  axes: {
    category: {
      values: ["rẽ phải", "rẽ trái"],
    },
    order: {
      values: ["1", "2", "3", "4", "5", "6", "7", "8"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Rẽ phải",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Rẽ phải",
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
    narration_template: "Chúng mình cùng tìm hiểu về Rẽ phải nhé",
  },
  ordering: [
    "arrow_right",
    "train_right",
    "runner_right",
    "boat_right",
    "arrow_left",
    "tractor_left",
    "horse_left",
    "heli_left",
  ],
};

export const C2_DIR_04_SEED: SkillSeed = {
  identity: C2_DIR_04_IDENTITY,
  dataset: C2_DIR_04_DATASET,
  levels: [
    {
      code: "GL-C2-DIR-SHAD-0013",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C2-DIR-SHAD-0014",
      template: "GT-007",
      band: "3-4",
      difficulty: 3,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C2-DIR-SIZE-0003",
      template: "GT-009",
      band: "4-5",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
  ],
};
