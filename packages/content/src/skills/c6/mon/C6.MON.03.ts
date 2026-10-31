import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C6_MON_03_IDENTITY: SkillIdentity = {
  code: "C6.MON.03",
  strand_code: "C6.MON",
  competency_code: "C6",
  name: "Tự đánh giá kết quả",
  age_min: 5,
  age_max: 6,
  difficulty: 5,
  thinking_processes: ["verify", "describe"],
  tier: "advanced",
  prerequisites: ["C6.MON.02"],
  learning_objectives: [
    {
      code: "LO-C6.MON.03-01",
      behaviour: "Nhận biết và thực hành Tự đánh giá kết quả ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C6.MON.03-02",
      behaviour: "Vận dụng Tự đánh giá kết quả trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C6.MON.03-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Tự đánh giá kết quả",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C6_MON_03_DATASET: SkillDataset = {
  skill_code: "C6.MON.03",
  concept_label: "Tự đánh giá kết quả",
  surface: "game",
  items: [
    {
      id: "corn",
      label: "bắp ngô",
      image: {
        kind: "emoji",
        ref: "🌽",
      },
      category: {
        type: "rau củ",
        color: "yellow",
        shape: "triangle",
      },
      value: 1,
      ordering: 1,
      contrast_group: "vegetables",
    },
    {
      id: "cucumber",
      label: "dưa chuột",
      image: {
        kind: "emoji",
        ref: "🥒",
      },
      category: {
        type: "rau củ",
        color: "green",
        shape: "square",
      },
      value: 2,
      ordering: 2,
      contrast_group: "vegetables",
    },
    {
      id: "mushroom",
      label: "cây nấm",
      image: {
        kind: "emoji",
        ref: "🍄",
      },
      category: {
        type: "rau củ",
        color: "red",
        shape: "triangle",
      },
      value: 3,
      ordering: 3,
      contrast_group: "vegetables",
    },
    {
      id: "carrot",
      label: "cà rốt",
      image: {
        kind: "emoji",
        ref: "🥕",
      },
      category: {
        type: "rau củ",
        color: "red",
        shape: "triangle",
      },
      value: 4,
      ordering: 4,
      contrast_group: "vegetables",
    },
    {
      id: "watermelon",
      label: "dưa hấu",
      image: {
        kind: "emoji",
        ref: "🍉",
      },
      category: {
        type: "hoa quả",
        color: "red",
        shape: "triangle",
      },
      value: 5,
      ordering: 5,
      contrast_group: "fruits",
    },
    {
      id: "grapes",
      label: "chùm nho",
      image: {
        kind: "emoji",
        ref: "🍇",
      },
      category: {
        type: "hoa quả",
        color: "blue",
        shape: "circle",
      },
      value: 6,
      ordering: 6,
      contrast_group: "fruits",
    },
    {
      id: "cherry",
      label: "anh đào",
      image: {
        kind: "emoji",
        ref: "🍒",
      },
      category: {
        type: "hoa quả",
        color: "red",
        shape: "circle",
      },
      value: 7,
      ordering: 7,
      contrast_group: "fruits",
    },
    {
      id: "apple",
      label: "quả táo",
      image: {
        kind: "emoji",
        ref: "🍎",
      },
      category: {
        type: "hoa quả",
        color: "red",
        shape: "circle",
      },
      value: 8,
      ordering: 8,
      contrast_group: "fruits",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Tự đánh giá kết quả",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Tự đánh giá kết quả",
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
    narration_template: "Chúng mình cùng ngắm lại và đánh giá kết quả nhé",
  },
  axes: {
    type: ["rau củ", "hoa quả"],
    rating: {
      values: ["đạt", "khá", "tốt", "xuất sắc"],
      ordered: true,
    },
  },
  relations: [
    {
      source_id: "corn",
      target_id: "cucumber",
      type: "pair",
    },
    {
      source_id: "mushroom",
      target_id: "carrot",
      type: "pair",
    },
    {
      source_id: "watermelon",
      target_id: "grapes",
      type: "pair",
    },
    {
      source_id: "cherry",
      target_id: "apple",
      type: "pair",
    },
  ],
  ordering: [
    "corn",
    "cucumber",
    "mushroom",
    "carrot",
    "watermelon",
    "grapes",
    "cherry",
    "apple",
  ],
};

export const C6_MON_03_SEED: SkillSeed = {
  identity: C6_MON_03_IDENTITY,
  dataset: C6_MON_03_DATASET,
  levels: [
    {
      code: "GL-C6-MON-MEAS-0005",
      template: "GT-028",
      band: "5-6",
      difficulty: 4,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C6-MON-MEAS-0006",
      template: "GT-028",
      band: "5-6",
      difficulty: 5,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C6-MON-TIME-0005",
      template: "GT-029",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
  ],
};
