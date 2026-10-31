import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C6_FLX_01_IDENTITY: SkillIdentity = {
  code: "C6.FLX.01",
  strand_code: "C6.FLX",
  competency_code: "C6",
  name: "Đổi luật giữa vòng chơi",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["shift"],
  tier: "advanced",
  prerequisites: ["C3.CLS.06"],
  learning_objectives: [
    {
      code: "LO-C6.FLX.01-01",
      behaviour: "Nhận biết và thực hành Đổi luật giữa vòng chơi ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C6.FLX.01-02",
      behaviour: "Vận dụng Đổi luật giữa vòng chơi trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C6.FLX.01-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Đổi luật giữa vòng chơi",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C6_FLX_01_DATASET: SkillDataset = {
  skill_code: "C6.FLX.01",
  concept_label: "Đổi luật giữa vòng chơi",
  surface: "game",
  items: [
    {
      id: "red_cake",
      label: "bánh dâu đỏ",
      value: 1,
      ordering: 1,
      image: {
        kind: "emoji",
        ref: "🍰",
      },
      category: {
        type: "bánh kẹo",
        color: "red",
        shape: "circle",
      },
      contrast_group: "sweets",
    },
    {
      id: "blue_candy",
      label: "viên kẹo xanh",
      value: 2,
      ordering: 2,
      image: {
        kind: "emoji",
        ref: "🍬",
      },
      category: {
        type: "bánh kẹo",
        color: "blue",
        shape: "square",
      },
      contrast_group: "sweets",
    },
    {
      id: "yellow_croissant",
      label: "bánh sừng vàng",
      value: 3,
      ordering: 3,
      image: {
        kind: "emoji",
        ref: "🥐",
      },
      category: {
        type: "bánh kẹo",
        color: "yellow",
        shape: "triangle",
      },
      contrast_group: "sweets",
    },
    {
      id: "green_cupcake",
      label: "bánh kem xanh",
      value: 4,
      ordering: 4,
      image: {
        kind: "emoji",
        ref: "🧁",
      },
      category: {
        type: "bánh kẹo",
        color: "green",
        shape: "star",
      },
      contrast_group: "sweets",
    },
    {
      id: "red_apple",
      label: "quả táo đỏ",
      value: 5,
      ordering: 5,
      image: {
        kind: "emoji",
        ref: "🍎",
      },
      category: {
        type: "hoa quả",
        color: "red",
        shape: "circle",
      },
      contrast_group: "fruits",
    },
    {
      id: "blue_berry",
      label: "việt quất xanh",
      value: 6,
      ordering: 6,
      image: {
        kind: "emoji",
        ref: "🫐",
      },
      category: {
        type: "hoa quả",
        color: "blue",
        shape: "square",
      },
      contrast_group: "fruits",
    },
    {
      id: "yellow_banana",
      label: "quả chuối vàng",
      value: 7,
      ordering: 7,
      image: {
        kind: "emoji",
        ref: "🍌",
      },
      category: {
        type: "hoa quả",
        color: "yellow",
        shape: "triangle",
      },
      contrast_group: "fruits",
    },
    {
      id: "green_pear",
      label: "quả lê xanh",
      value: 8,
      ordering: 8,
      image: {
        kind: "emoji",
        ref: "🍐",
      },
      category: {
        type: "hoa quả",
        color: "green",
        shape: "star",
      },
      contrast_group: "fruits",
    },
  ],
  axes: {
    type: ["bánh kẹo", "hoa quả"],
    color: ["red", "blue", "yellow", "green"],
    shape: ["circle", "square", "triangle", "star"],
  },
  relations: [
    {
      type: "pair",
      source_id: "red_cake",
      target_id: "red_apple",
      metadata: { dimension: "color" },
    },
    {
      type: "pair",
      source_id: "blue_candy",
      target_id: "blue_berry",
      metadata: { dimension: "color" },
    },
    {
      type: "pair",
      source_id: "yellow_croissant",
      target_id: "yellow_banana",
      metadata: { dimension: "color" },
    },
    {
      type: "pair",
      source_id: "green_cupcake",
      target_id: "green_pear",
      metadata: { dimension: "color" },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Đổi luật giữa vòng chơi",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Đổi luật giữa vòng chơi",
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
    narration_template: "Chúng mình cùng linh hoạt đổi luật khi chơi nhé",
  },
  ordering: [
    "red_cake",
    "blue_candy",
    "yellow_croissant",
    "green_cupcake",
    "red_apple",
    "blue_berry",
    "yellow_banana",
    "green_pear",
  ],
};

export const C6_FLX_01_SEED: SkillSeed = {
  identity: C6_FLX_01_IDENTITY,
  dataset: C6_FLX_01_DATASET,
  levels: [
    {
      code: "GL-C6-FLX-SWT-0033",
      template: "GT-027",
      band: "5-6",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C6-FLX-SWT-0034",
      template: "GT-027",
      band: "5-6",
      difficulty: 4,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C3-BLG-TAP-0007",
      template: "GT-001",
      band: "4-5",
      difficulty: 1,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C3-BLG-TAP-0008",
      template: "GT-001",
      band: "5-6",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C6-FLX-PUZZ-0001",
      template: "GT-010",
      band: "4-5",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
  ],
};
