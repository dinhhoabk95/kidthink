import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C3_SEQ_03_IDENTITY: SkillIdentity = {
  code: "C3.SEQ.03",
  strand_code: "C3.SEQ",
  competency_code: "C3",
  name: "Chuỗi hành động",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["sequence", "infer"],
  tier: "core",
  prerequisites: ["C1.MEAS.10"],
  learning_objectives: [
    {
      code: "LO-C3.SEQ.03-01",
      behaviour: "Nhận biết và thực hành Chuỗi hành động ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C3.SEQ.03-02",
      behaviour: "Vận dụng Chuỗi hành động trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C3.SEQ.03-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Chuỗi hành động",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C3_SEQ_03_DATASET: SkillDataset = {
  skill_code: "C3.SEQ.03",
  concept_label: "Chuỗi hành động",
  surface: "game",
  items: [
    {
      id: "wash_soap",
      label: "lấy xà phòng",
      image: {
        kind: "emoji",
        ref: "🧼",
      },
      category: {
        type: "chuẩn bị rửa",
        color: "blue",
        shape: "square",
        size: "small",
      },
      contrast_group: "wash_start",
      value: 1,
      ordering: 1,
    },
    {
      id: "wash_water",
      label: "mở vòi nước",
      image: {
        kind: "emoji",
        ref: "🚰",
      },
      category: {
        type: "chuẩn bị rửa",
        color: "blue",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "wash_start",
      value: 2,
      ordering: 2,
    },
    {
      id: "wash_rub",
      label: "xoa bọt đều",
      image: {
        kind: "emoji",
        ref: "🫧",
      },
      category: {
        type: "chuẩn bị rửa",
        color: "white",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "wash_start",
      value: 3,
      ordering: 3,
    },
    {
      id: "wash_rinse",
      label: "tráng nước sạch",
      image: {
        kind: "emoji",
        ref: "🚿",
      },
      category: {
        type: "rửa sạch tay",
        color: "blue",
        shape: "triangle",
        size: "medium",
      },
      contrast_group: "wash_finish",
      value: 4,
      ordering: 4,
    },
    {
      id: "wash_towel",
      label: "lau khô tay",
      image: {
        kind: "emoji",
        ref: "🧺",
      },
      category: {
        type: "rửa sạch tay",
        color: "yellow",
        shape: "rectangle",
        size: "medium",
      },
      contrast_group: "wash_finish",
      value: 5,
      ordering: 5,
    },
    {
      id: "wash_clean",
      label: "đôi tay sạch",
      image: {
        kind: "emoji",
        ref: "✨",
      },
      category: {
        type: "rửa sạch tay",
        color: "yellow",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "wash_finish",
      value: 6,
      ordering: 6,
    },
  ],
  relations: [
    {
      type: "sequence",
      source_id: "wash_soap",
      target_id: "wash_water",
      explanation: "lấy xà phòng rồi mở vòi nước",
    },
    {
      type: "sequence",
      source_id: "wash_water",
      target_id: "wash_rub",
      explanation: "mở nước rồi xoa bọt đều",
    },
    {
      type: "sequence",
      source_id: "wash_rub",
      target_id: "wash_rinse",
      explanation: "xoa bọt đều rồi tráng nước sạch",
    },
    {
      type: "sequence",
      source_id: "wash_rinse",
      target_id: "wash_towel",
      explanation: "tráng nước sạch rồi lau khô tay",
    },
    {
      type: "sequence",
      source_id: "wash_towel",
      target_id: "wash_clean",
      explanation: "lau khô tay có đôi tay sạch",
    },
  ],
  axes: {
    type: ["chuẩn bị rửa", "rửa sạch tay"],
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với chuỗi hành động",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng chuỗi hành động",
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
    narration_template: "Chúng mình cùng xếp đúng các bước rửa tay nhé",
  },
  ordering: [
    "wash_soap",
    "wash_water",
    "wash_rub",
    "wash_rinse",
    "wash_towel",
    "wash_clean",
  ],
};

export const C3_SEQ_03_SEED: SkillSeed = {
  identity: C3_SEQ_03_IDENTITY,
  dataset: C3_SEQ_03_DATASET,
  levels: [
    {
      code: "GL-C3-SEQ-PAIR-0001",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C3-SEQ-PAIR-0002",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C3-SEQ-SHAD-0001",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
  ],
};
