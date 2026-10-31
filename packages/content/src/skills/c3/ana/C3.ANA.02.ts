import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C3_ANA_02_IDENTITY: SkillIdentity = {
  code: "C3.ANA.02",
  strand_code: "C3.ANA",
  competency_code: "C3",
  name: "Ghép đôi có liên quan",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["infer"],
  tier: "advanced",
  prerequisites: ["C3.ANA.01", "C3.CLS.04"],
  learning_objectives: [
    {
      code: "LO-C3.ANA.02-01",
      behaviour: "Nhận biết và thực hành Quan hệ tương tự ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C3.ANA.02-02",
      behaviour: "Vận dụng Quan hệ tương tự trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C3.ANA.02-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Quan hệ tương tự",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C3_ANA_02_DATASET: SkillDataset = {
  skill_code: "C3.ANA.02",
  concept_label: "Ghép đôi có liên quan",
  surface: "game",
  items: [
    {
      id: "bowl",
      label: "bát ăn cơm",
      image: {
        kind: "emoji",
        ref: "🥣",
      },
      category: {
        type: "đồ gia đình",
        color: "blue",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "item_source",
      value: 1,
      ordering: 1,
    },
    {
      id: "spoon",
      label: "thìa múc canh",
      image: {
        kind: "emoji",
        ref: "🥄",
      },
      category: {
        type: "đồ gia đình",
        color: "yellow",
        shape: "triangle",
        size: "small",
      },
      contrast_group: "item_partner",
      value: 2,
      ordering: 2,
    },
    {
      id: "bed",
      label: "chiếc giường êm",
      image: {
        kind: "emoji",
        ref: "🛏️",
      },
      category: {
        type: "đồ gia đình",
        color: "red",
        shape: "rectangle",
        size: "large",
      },
      contrast_group: "item_source",
      value: 3,
      ordering: 3,
    },
    {
      id: "teddy",
      label: "gấu bông nhỏ",
      image: {
        kind: "emoji",
        ref: "🧸",
      },
      category: {
        type: "đồ gia đình",
        color: "yellow",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "item_partner",
      value: 4,
      ordering: 4,
    },
    {
      id: "bird",
      label: "chú chim non",
      image: {
        kind: "emoji",
        ref: "🐦",
      },
      category: {
        type: "thiên nhiên đẹp",
        color: "blue",
        shape: "triangle",
        size: "small",
      },
      contrast_group: "item_source",
      value: 5,
      ordering: 5,
    },
    {
      id: "nest",
      label: "tổ chim ấm",
      image: {
        kind: "emoji",
        ref: "🪺",
      },
      category: {
        type: "thiên nhiên đẹp",
        color: "yellow",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "item_partner",
      value: 6,
      ordering: 6,
    },
    {
      id: "bee",
      label: "chú ong vàng",
      image: {
        kind: "emoji",
        ref: "🐝",
      },
      category: {
        type: "thiên nhiên đẹp",
        color: "yellow",
        shape: "circle",
        size: "small",
      },
      contrast_group: "item_source",
      value: 7,
      ordering: 7,
    },
    {
      id: "sunflower",
      label: "hoa hướng dương",
      image: {
        kind: "emoji",
        ref: "🌻",
      },
      category: {
        type: "thiên nhiên đẹp",
        color: "yellow",
        shape: "circle",
        size: "large",
      },
      contrast_group: "item_partner",
      value: 8,
      ordering: 8,
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "bowl",
      target_id: "spoon",
      explanation: "bát ăn cơm đi cùng thìa múc",
      metadata: { reason: "analogy" },
    },
    {
      type: "pair",
      source_id: "bed",
      target_id: "teddy",
      explanation: "giường êm ôm gấu bông ngủ",
      metadata: { reason: "analogy" },
    },
    {
      type: "pair",
      source_id: "bird",
      target_id: "nest",
      explanation: "chim non về tổ ấm áp",
      metadata: { reason: "analogy" },
    },
    {
      type: "pair",
      source_id: "bee",
      target_id: "sunflower",
      explanation: "ong vàng bay tìm hoa hướng dương",
      metadata: { reason: "analogy" },
    },
  ],
  axes: {
    type: ["đồ gia đình", "thiên nhiên đẹp"],
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với ghép đôi có liên quan",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng ghép đôi có liên quan",
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
      "Chúng mình cùng tìm hai vật có mối liên hệ giống nhau nhé",
  },
  ordering: [
    "bowl",
    "spoon",
    "bed",
    "teddy",
    "bird",
    "nest",
    "bee",
    "sunflower",
  ],
};

export const C3_ANA_02_SEED: SkillSeed = {
  identity: C3_ANA_02_IDENTITY,
  dataset: C3_ANA_02_DATASET,
  levels: [
    {
      code: "GL-C3-ODD-TAP-0003",
      template: "GT-001",
      band: "3-4",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C3-ODD-TAP-0004",
      template: "GT-001",
      band: "4-5",
      difficulty: 1,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C3-RLF-BSK-0008",
      template: "GT-003",
      band: "5-6",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
  ],
};
