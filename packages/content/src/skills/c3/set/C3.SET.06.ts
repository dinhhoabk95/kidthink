import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C3_SET_06_IDENTITY: SkillIdentity = {
  code: "C3.SET.06",
  strand_code: "C3.SET",
  competency_code: "C3",
  name: "Tìm vật có đặc điểm riêng",
  age_min: 5,
  age_max: 6,
  difficulty: 5,
  thinking_processes: ["deduce", "inhibit"],
  tier: "advanced",
  prerequisites: ["C3.SET.05", "C3.DED.02"],
  learning_objectives: [
    {
      code: "LO-C3.SET.06-01",
      behaviour:
        "Nhận biết và thực hành Không phải … cũng không … ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C3.SET.06-02",
      behaviour:
        "Vận dụng Không phải … cũng không … trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C3.SET.06-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Không phải … cũng không …",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C3_SET_06_DATASET: SkillDataset = {
  skill_code: "C3.SET.06",
  concept_label: "Tìm vật có đặc điểm riêng",
  surface: "game",
  items: [
    {
      id: "car",
      label: "xe ô-tô con",
      image: {
        kind: "emoji",
        ref: "🚗",
      },
      category: {
        type: "xe cộ chạy",
        color: "red",
        shape: "rectangle",
        size: "medium",
      },
      contrast_group: "vehicles",
      value: 1,
      ordering: 1,
    },
    {
      id: "bus",
      label: "chiếc xe buýt",
      image: {
        kind: "emoji",
        ref: "🚌",
      },
      category: {
        type: "xe cộ chạy",
        color: "yellow",
        shape: "rectangle",
        size: "large",
      },
      contrast_group: "vehicles",
      value: 2,
      ordering: 2,
    },
    {
      id: "bike",
      label: "chiếc xe đạp",
      image: {
        kind: "emoji",
        ref: "🚲",
      },
      category: {
        type: "xe cộ chạy",
        color: "blue",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "vehicles",
      value: 3,
      ordering: 3,
    },
    {
      id: "train",
      label: "tàu hỏa dài",
      image: {
        kind: "emoji",
        ref: "🚂",
      },
      category: {
        type: "xe cộ chạy",
        color: "black",
        shape: "rectangle",
        size: "large",
      },
      contrast_group: "vehicles",
      value: 4,
      ordering: 4,
    },
    {
      id: "lion",
      label: "chú sư tử",
      image: {
        kind: "emoji",
        ref: "🦁",
      },
      category: {
        type: "thú rừng vui",
        color: "yellow",
        shape: "circle",
        size: "large",
      },
      contrast_group: "wild_animals",
      value: 5,
      ordering: 5,
    },
    {
      id: "tiger",
      label: "chú hổ vằn",
      image: {
        kind: "emoji",
        ref: "🐯",
      },
      category: {
        type: "thú rừng vui",
        color: "yellow",
        shape: "circle",
        size: "large",
      },
      contrast_group: "wild_animals",
      value: 6,
      ordering: 6,
    },
    {
      id: "bear",
      label: "chú gấu nâu",
      image: {
        kind: "emoji",
        ref: "🐻",
      },
      category: {
        type: "thú rừng vui",
        color: "yellow",
        shape: "circle",
        size: "large",
      },
      contrast_group: "wild_animals",
      value: 7,
      ordering: 7,
    },
    {
      id: "elephant",
      label: "chú voi to",
      image: {
        kind: "emoji",
        ref: "🐘",
      },
      category: {
        type: "thú rừng vui",
        color: "blue",
        shape: "circle",
        size: "large",
      },
      contrast_group: "wild_animals",
      value: 8,
      ordering: 8,
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "car",
      target_id: "lion",
      explanation: "ô-tô đỏ khác biệt với sư tử vàng",
    },
    {
      type: "contrast",
      source_id: "bus",
      target_id: "tiger",
      explanation: "xe buýt lớn khác biệt với hổ vằn",
    },
    {
      type: "contrast",
      source_id: "bike",
      target_id: "bear",
      explanation: "xe đạp xanh khác biệt với gấu nâu",
    },
    {
      type: "contrast",
      source_id: "train",
      target_id: "elephant",
      explanation: "tàu hỏa đen khác biệt với voi xanh",
    },
  ],
  axes: {
    type: ["xe cộ chạy", "thú rừng vui"],
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với tìm vật có đặc điểm riêng",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng tìm vật có đặc điểm riêng",
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
      "Chúng mình cùng tìm vật có màu sắc và nhóm riêng biệt nhé",
  },
  ordering: [
    "car",
    "bus",
    "bike",
    "train",
    "lion",
    "tiger",
    "bear",
    "elephant",
  ],
};

export const C3_SET_06_SEED: SkillSeed = {
  identity: C3_SET_06_IDENTITY,
  dataset: C3_SET_06_DATASET,
  levels: [
    {
      code: "GL-C3-SET-BOND-0001",
      template: "GT-018",
      band: "5-6",
      difficulty: 4,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C3-SET-SYMM-0001",
      template: "GT-022",
      band: "5-6",
      difficulty: 4,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C3-SET-STIK-0001",
      template: "GT-025",
      band: "5-6",
      difficulty: 4,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C3-SET-SUB-0001",
      template: "GT-027",
      band: "5-6",
      difficulty: 4,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C3-SET-SUB-0002",
      template: "GT-027",
      band: "5-6",
      difficulty: 5,
      theme: "homeland",
      rounds: 3,
    },
  ],
};
