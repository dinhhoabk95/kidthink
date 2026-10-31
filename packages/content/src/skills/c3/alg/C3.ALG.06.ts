import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C3_ALG_06_IDENTITY: SkillIdentity = {
  code: "C3.ALG.06",
  strand_code: "C3.ALG",
  competency_code: "C3",
  name: "Tìm đường đi tới đích",
  age_min: 5,
  age_max: 6,
  difficulty: 5,
  thinking_processes: ["plan", "create"],
  tier: "advanced",
  prerequisites: ["C3.ALG.04", "C2.GRD.02"],
  learning_objectives: [
    {
      code: "LO-C3.ALG.06-01",
      behaviour:
        "Nhận biết và thực hành Tự viết chuỗi lệnh tới đích ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C3.ALG.06-02",
      behaviour:
        "Vận dụng Tự viết chuỗi lệnh tới đích trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C3.ALG.06-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Tự viết chuỗi lệnh tới đích",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C3_ALG_06_DATASET: SkillDataset = {
  skill_code: "C3.ALG.06",
  concept_label: "Tìm đường đi tới đích",
  surface: "game",
  items: [
    {
      id: "house",
      label: "ngôi nhà nhỏ",
      image: {
        kind: "emoji",
        ref: "🏠",
      },
      category: {
        type: "chặng xuất phát",
        color: "red",
        shape: "square",
        size: "large",
      },
      contrast_group: "start_path",
      value: 1,
      ordering: 1,
    },
    {
      id: "tree",
      label: "hàng cây xanh",
      image: {
        kind: "emoji",
        ref: "🌳",
      },
      category: {
        type: "chặng xuất phát",
        color: "green",
        shape: "circle",
        size: "large",
      },
      contrast_group: "start_path",
      value: 2,
      ordering: 2,
    },
    {
      id: "bridge",
      label: "cây cầu nhỏ",
      image: {
        kind: "emoji",
        ref: "🌉",
      },
      category: {
        type: "chặng xuất phát",
        color: "yellow",
        shape: "rectangle",
        size: "large",
      },
      contrast_group: "start_path",
      value: 3,
      ordering: 3,
    },
    {
      id: "park_flower",
      label: "vườn hoa vàng",
      image: {
        kind: "emoji",
        ref: "🌻",
      },
      category: {
        type: "chặng xuất phát",
        color: "yellow",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "start_path",
      value: 4,
      ordering: 4,
    },
    {
      id: "bicycle",
      label: "đạp xe qua",
      image: {
        kind: "emoji",
        ref: "🚲",
      },
      category: {
        type: "chặng về đích",
        color: "blue",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "end_path",
      value: 5,
      ordering: 5,
    },
    {
      id: "bus",
      label: "lên xe buýt",
      image: {
        kind: "emoji",
        ref: "🚌",
      },
      category: {
        type: "chặng về đích",
        color: "yellow",
        shape: "rectangle",
        size: "large",
      },
      contrast_group: "end_path",
      value: 6,
      ordering: 6,
    },
    {
      id: "traffic_light",
      label: "đèn giao thông",
      image: {
        kind: "emoji",
        ref: "🚦",
      },
      category: {
        type: "chặng về đích",
        color: "green",
        shape: "rectangle",
        size: "medium",
      },
      contrast_group: "end_path",
      value: 7,
      ordering: 7,
    },
    {
      id: "school",
      label: "trường mầm non",
      image: {
        kind: "emoji",
        ref: "🏫",
      },
      category: {
        type: "chặng về đích",
        color: "red",
        shape: "square",
        size: "large",
      },
      contrast_group: "end_path",
      value: 8,
      ordering: 8,
    },
  ],
  relations: [
    {
      type: "sequence",
      source_id: "house",
      target_id: "tree",
      explanation: "từ ngôi nhà nhỏ đi qua hàng cây xanh",
    },
    {
      type: "sequence",
      source_id: "tree",
      target_id: "bridge",
      explanation: "từ hàng cây xanh bước qua cây cầu nhỏ",
    },
    {
      type: "sequence",
      source_id: "bridge",
      target_id: "park_flower",
      explanation: "qua cây cầu nhỏ đến vườn hoa vàng",
    },
    {
      type: "sequence",
      source_id: "park_flower",
      target_id: "bicycle",
      explanation: "từ vườn hoa vàng đạp xe qua",
    },
    {
      type: "sequence",
      source_id: "bicycle",
      target_id: "bus",
      explanation: "đạp xe đến bến rồi lên xe buýt",
    },
    {
      type: "sequence",
      source_id: "bus",
      target_id: "traffic_light",
      explanation: "xe buýt dừng trước đèn giao thông",
    },
    {
      type: "sequence",
      source_id: "traffic_light",
      target_id: "school",
      explanation: "qua đèn giao thông là tới trường mầm non",
    },
  ],
  axes: {
    type: ["chặng xuất phát", "chặng về đích"],
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với tìm đường đi tới đích",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng tìm đường đi tới đích",
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
      "Chúng mình cùng xếp các chặng đường để đi tới đích nhé",
  },
  ordering: [
    "house",
    "tree",
    "bridge",
    "park_flower",
    "bicycle",
    "bus",
    "traffic_light",
    "school",
  ],
};

export const C3_ALG_06_SEED: SkillSeed = {
  identity: C3_ALG_06_IDENTITY,
  dataset: C3_ALG_06_DATASET,
  levels: [
    {
      code: "GL-C3-ALG-SORT-0008",
      template: "GT-006",
      band: "5-6",
      difficulty: 5,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C3-ALG-SHAD-0009",
      template: "GT-007",
      band: "5-6",
      difficulty: 4,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C3-ALG-MAZE-0007",
      template: "GT-013",
      band: "5-6",
      difficulty: 4,
      theme: "art",
      rounds: 3,
    },
  ],
};
