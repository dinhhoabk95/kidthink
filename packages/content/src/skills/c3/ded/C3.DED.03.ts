import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C3_DED_03_IDENTITY: SkillIdentity = {
  code: "C3.DED.03",
  strand_code: "C3.DED",
  competency_code: "C3",
  name: "Tìm đáp án đúng theo gợi ý",
  age_min: 5,
  age_max: 6,
  difficulty: 5,
  thinking_processes: ["deduce", "describe"],
  tier: "advanced",
  prerequisites: ["C3.DED.01", "C3.DED.02"],
  learning_objectives: [
    {
      code: "LO-C3.DED.03-01",
      behaviour:
        "Nhận biết và thực hành Chọn đáp án đúng có giải thích ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C3.DED.03-02",
      behaviour:
        "Vận dụng Chọn đáp án đúng có giải thích trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C3.DED.03-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Chọn đáp án đúng có giải thích",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C3_DED_03_DATASET: SkillDataset = {
  skill_code: "C3.DED.03",
  concept_label: "Tìm đáp án đúng theo gợi ý",
  surface: "game",
  items: [
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
      value: 1,
      ordering: 1,
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
      value: 2,
      ordering: 2,
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
      value: 3,
      ordering: 3,
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
      value: 4,
      ordering: 4,
    },
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
      value: 5,
      ordering: 5,
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
      value: 6,
      ordering: 6,
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
      value: 7,
      ordering: 7,
    },
    {
      id: "plane",
      label: "chiếc máy bay",
      image: {
        kind: "emoji",
        ref: "✈️",
      },
      category: {
        type: "xe cộ chạy",
        color: "white",
        shape: "triangle",
        size: "large",
      },
      contrast_group: "vehicles",
      value: 8,
      ordering: 8,
    },
    {
      id: "chest_gold_ancient",
      label: "rương vàng cổ",
      value: 5,
      image: {
        kind: "emoji",
        ref: "📦",
      },
    },
    {
      id: "key_skeleton_gold",
      label: "chìa khóa vàng cổ",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🗝️",
      },
    },
    {
      id: "gem_ruby_red",
      label: "viên ngọc hồng ngọc",
      value: 7,
      image: {
        kind: "emoji",
        ref: "💎",
      },
    },
    {
      id: "cipher_dial_lock",
      label: "ổ khóa xoay mật mã",
      value: 8,
      image: {
        kind: "emoji",
        ref: "🔒",
      },
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "lion",
      target_id: "car",
      explanation: "sư tử sống trong rừng khác ô-tô chạy trên đường",
    },
    {
      type: "contrast",
      source_id: "tiger",
      target_id: "bus",
      explanation: "hổ vằn sống trong rừng khác xe buýt chở khách",
    },
    {
      type: "contrast",
      source_id: "bear",
      target_id: "train",
      explanation: "gấu nâu sống trong rừng khác tàu hỏa chạy đường ray",
    },
    {
      type: "contrast",
      source_id: "elephant",
      target_id: "plane",
      explanation: "voi to đi trên đất khác máy bay bay trên trời",
    },
  ],
  axes: {
    type: ["thú rừng vui", "xe cộ chạy"],
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với tìm đáp án đúng theo gợi ý",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng tìm đáp án đúng theo gợi ý",
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
      "Chúng mình cùng lắng nghe gợi ý để tìm đáp án đúng nhé",
  },
  ordering: [
    "lion",
    "tiger",
    "bear",
    "elephant",
    "car",
    "bus",
    "train",
    "plane",
    "chest_gold_ancient",
    "key_skeleton_gold",
    "gem_ruby_red",
    "cipher_dial_lock",
  ],
};

export const C3_DED_03_SEED: SkillSeed = {
  identity: C3_DED_03_IDENTITY,
  dataset: C3_DED_03_DATASET,
  levels: [
    {
      code: "GL-C3-DED-LOG-0001",
      template: "GT-009",
      band: "4-5",
      difficulty: 1,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C3-DED-LOG-0002",
      template: "GT-009",
      band: "4-5",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C3-DED-TAP-0002",
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C3-DED-CLUE-0206",
      template: "GT-009",
      band: "5-6",
      difficulty: 4,
      access_tier: "premium",
      theme: "job",
      rounds: 3,
      montessori_ref: "WB14-D1",
    },
    {
      code: "GL-C3-DED-SLOT-0207",
      template: "GT-008",
      band: "5-6",
      difficulty: 5,
      access_tier: "premium",
      theme: "job",
      rounds: 3,
      montessori_ref: "WB14-D3",
    },
  ],
};
