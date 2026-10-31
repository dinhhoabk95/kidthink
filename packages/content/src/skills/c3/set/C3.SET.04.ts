import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C3_SET_04_IDENTITY: SkillIdentity = {
  code: "C3.SET.04",
  strand_code: "C3.SET",
  competency_code: "C3",
  name: "Hai vòng giao nhau",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["sort", "infer"],
  tier: "advanced",
  prerequisites: ["C3.SET.03"],
  learning_objectives: [
    {
      code: "LO-C3.SET.04-01",
      behaviour: "Nhận biết và thực hành Hai vòng giao nhau ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C3.SET.04-02",
      behaviour: "Vận dụng Hai vòng giao nhau trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C3.SET.04-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Hai vòng giao nhau",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C3_SET_04_DATASET: SkillDataset = {
  skill_code: "C3.SET.04",
  concept_label: "Hai vòng giao nhau",
  surface: "game",
  items: [
    {
      id: "cake",
      label: "chiếc bánh dâu",
      image: {
        kind: "emoji",
        ref: "🍰",
      },
      category: {
        type: "bánh kẹo ngọt",
        color: "red",
        shape: "triangle",
        size: "large",
      },
      contrast_group: "sweets",
      value: 1,
      ordering: 1,
    },
    {
      id: "cookie",
      label: "bánh quy giòn",
      image: {
        kind: "emoji",
        ref: "🍪",
      },
      category: {
        type: "bánh kẹo ngọt",
        color: "yellow",
        shape: "circle",
        size: "small",
      },
      contrast_group: "sweets",
      value: 2,
      ordering: 2,
    },
    {
      id: "donut",
      label: "bánh vòng đường",
      image: {
        kind: "emoji",
        ref: "🍩",
      },
      category: {
        type: "bánh kẹo ngọt",
        color: "yellow",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "sweets",
      value: 3,
      ordering: 3,
    },
    {
      id: "candy",
      label: "viên kẹo ngọt",
      image: {
        kind: "emoji",
        ref: "🍬",
      },
      category: {
        type: "bánh kẹo ngọt",
        color: "green",
        shape: "circle",
        size: "small",
      },
      contrast_group: "sweets",
      value: 4,
      ordering: 4,
    },
    {
      id: "apple",
      label: "quả táo đỏ",
      image: {
        kind: "emoji",
        ref: "🍎",
      },
      category: {
        type: "hoa quả tươi",
        color: "red",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "fruits",
      value: 5,
      ordering: 5,
    },
    {
      id: "pear",
      label: "quả lê xanh",
      image: {
        kind: "emoji",
        ref: "🍐",
      },
      category: {
        type: "hoa quả tươi",
        color: "green",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "fruits",
      value: 6,
      ordering: 6,
    },
    {
      id: "watermelon",
      label: "quả dưa hấu",
      image: {
        kind: "emoji",
        ref: "🍉",
      },
      category: {
        type: "hoa quả tươi",
        color: "green",
        shape: "circle",
        size: "large",
      },
      contrast_group: "fruits",
      value: 7,
      ordering: 7,
    },
    {
      id: "banana",
      label: "quả chuối vàng",
      image: {
        kind: "emoji",
        ref: "🍌",
      },
      category: {
        type: "hoa quả tươi",
        color: "yellow",
        shape: "rectangle",
        size: "medium",
      },
      contrast_group: "fruits",
      value: 8,
      ordering: 8,
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "cake",
      target_id: "apple",
      explanation: "bánh dâu và quả táo cùng có màu đỏ",
    },
    {
      type: "pair",
      source_id: "cookie",
      target_id: "banana",
      explanation: "bánh quy và chuối cùng có màu vàng",
    },
    {
      type: "pair",
      source_id: "candy",
      target_id: "pear",
      explanation: "kẹo ngọt và quả lê cùng có màu xanh",
    },
    {
      type: "pair",
      source_id: "donut",
      target_id: "watermelon",
      explanation: "bánh vòng và dưa hấu đều thơm ngọt",
    },
  ],
  axes: {
    type: ["bánh kẹo ngọt", "hoa quả tươi"],
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với hai vòng giao nhau",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng hai vòng giao nhau",
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
      "Chúng mình cùng tìm phần giao nhau giữa hai vòng tròn nhé",
  },
  ordering: [
    "cake",
    "cookie",
    "donut",
    "candy",
    "apple",
    "pear",
    "watermelon",
    "banana",
  ],
};

export const C3_SET_04_SEED: SkillSeed = {
  identity: C3_SET_04_IDENTITY,
  dataset: C3_SET_04_DATASET,
  levels: [
    {
      code: "GL-C3-SET-TCNT-0005",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C3-SET-TCNT-0006",
      template: "GT-002",
      band: "4-5",
      difficulty: 4,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C3-SET-TCMP-0008",
      template: "GT-003",
      band: "4-5",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
  ],
};
