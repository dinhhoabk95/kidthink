import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_DIR_07_IDENTITY: SkillIdentity = {
  code: "C2.DIR.07",
  strand_code: "C2.DIR",
  competency_code: "C2",
  name: "Theo lộ trình nhiều bước",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["plan", "sequence"],
  tier: "advanced",
  prerequisites: ["C2.DIR.03", "C2.DIR.04"],
  learning_objectives: [
    {
      code: "LO-C2.DIR.07-01",
      behaviour: "Nhận biết và thực hành Theo lộ trình nhiều bước ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.DIR.07-02",
      behaviour: "Vận dụng Theo lộ trình nhiều bước trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.DIR.07-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Theo lộ trình nhiều bước",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_DIR_07_DATASET: SkillDataset = {
  skill_code: "C2.DIR.07",
  concept_label: "Theo lộ trình nhiều bước",
  surface: "game",
  items: [
    {
      id: "step_start",
      label: "bước 1 xuất phát",
      image: {
        kind: "emoji",
        ref: "🏁",
      },
      category: {
        type: "chặng đầu",
      },
      contrast_group: "step_early",
      value: 1,
      ordering: 1,
    },
    {
      id: "step_bridge",
      label: "bước 2 qua cầu",
      image: {
        kind: "emoji",
        ref: "🌉",
      },
      category: {
        type: "chặng đầu",
      },
      contrast_group: "step_early",
      value: 2,
      ordering: 2,
    },
    {
      id: "step_park",
      label: "bước 3 qua công viên",
      image: {
        kind: "emoji",
        ref: "🌳",
      },
      category: {
        type: "chặng đầu",
      },
      contrast_group: "step_early",
      value: 3,
      ordering: 3,
    },
    {
      id: "step_pond",
      label: "bước 4 qua đài phun",
      image: {
        kind: "emoji",
        ref: "⛲",
      },
      category: {
        type: "chặng đầu",
      },
      contrast_group: "step_early",
      value: 4,
      ordering: 4,
    },
    {
      id: "step_school",
      label: "bước 5 qua trường học",
      image: {
        kind: "emoji",
        ref: "🏫",
      },
      category: {
        type: "chặng cuối",
      },
      contrast_group: "step_late",
      value: 5,
      ordering: 5,
    },
    {
      id: "step_shop",
      label: "bước 6 qua cửa hàng",
      image: {
        kind: "emoji",
        ref: "🏪",
      },
      category: {
        type: "chặng cuối",
      },
      contrast_group: "step_late",
      value: 6,
      ordering: 6,
    },
    {
      id: "step_house",
      label: "bước 7 về đến nhà",
      image: {
        kind: "emoji",
        ref: "🏠",
      },
      category: {
        type: "chặng cuối",
      },
      contrast_group: "step_late",
      value: 7,
      ordering: 7,
    },
    {
      id: "step_goal",
      label: "bước 8 chạm ngôi sao",
      image: {
        kind: "emoji",
        ref: "⭐",
      },
      category: {
        type: "chặng cuối",
      },
      contrast_group: "step_late",
      value: 8,
      ordering: 8,
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "step_start",
      target_id: "step_school",
    },
    {
      type: "pair",
      source_id: "step_bridge",
      target_id: "step_shop",
    },
    {
      type: "pair",
      source_id: "step_park",
      target_id: "step_house",
    },
    {
      type: "pair",
      source_id: "step_pond",
      target_id: "step_goal",
    },
    {
      type: "contrast",
      source_id: "step_start",
      target_id: "step_school",
    },
  ],
  axes: {
    category: {
      values: ["chặng đầu", "chặng cuối"],
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
      description: "Làm quen cơ bản với Theo lộ trình nhiều bước",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Theo lộ trình nhiều bước",
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
      "Chúng mình cùng tìm hiểu về Theo lộ trình nhiều bước nhé",
  },
  ordering: [
    "step_start",
    "step_bridge",
    "step_park",
    "step_pond",
    "step_school",
    "step_shop",
    "step_house",
    "step_goal",
  ],
};

export const C2_DIR_07_SEED: SkillSeed = {
  identity: C2_DIR_07_IDENTITY,
  dataset: C2_DIR_07_DATASET,
  levels: [
    {
      code: "GL-C3-RNK-ORD-0010",
      template: "GT-006",
      band: "5-6",
      difficulty: 1,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C2-DIR-CMD-0001",
      template: "GT-035",
      band: "5-6",
      difficulty: 2,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C2-DIR-CMD-0002",
      template: "GT-035",
      band: "5-6",
      difficulty: 3,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C2-DIR-CMD-0003",
      template: "GT-035",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C2-DIR-CMD-0004",
      template: "GT-035",
      band: "5-6",
      difficulty: 5,
      theme: "nature",
      rounds: 3,
    },
  ],
};
