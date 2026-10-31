import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_PER_01_IDENTITY: SkillIdentity = {
  code: "C2.PER.01",
  strand_code: "C2.PER",
  competency_code: "C2",
  name: "Nhìn từ phía trước",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["observe"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C2.PER.01-01",
      behaviour: "Nhận biết và thực hành Nhìn từ phía trước ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.PER.01-02",
      behaviour: "Vận dụng Nhìn từ phía trước trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.PER.01-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Nhìn từ phía trước",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_PER_01_DATASET: SkillDataset = {
  skill_code: "C2.PER.01",
  concept_label: "Nhìn từ phía trước",
  surface: "game",
  items: [
    {
      id: "house_front",
      label: "mặt trước ngôi nhà",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🏠",
      },
      category: {
        type: "nhìn phía trước",
      },
      contrast_group: "front_view",
    },
    {
      id: "car_front",
      label: "mặt trước ô tô",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🚘",
      },
      category: {
        type: "nhìn phía trước",
      },
      contrast_group: "front_view",
    },
    {
      id: "bear_front",
      label: "chú gấu nhìn thẳng",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🐻",
      },
      category: {
        type: "nhìn phía trước",
      },
      contrast_group: "front_view",
    },
    {
      id: "robot_front",
      label: "chú rô-bốt nhìn thẳng",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🤖",
      },
      category: {
        type: "nhìn phía trước",
      },
      contrast_group: "front_view",
    },
    {
      id: "backpack_side",
      label: "chiếc ba lô nhìn nghiêng",
      value: 5,
      image: {
        kind: "emoji",
        ref: "🎒",
      },
      category: {
        type: "góc nhìn khác",
      },
      contrast_group: "other_view",
    },
    {
      id: "shoe_side",
      label: "chiếc giày nhìn nghiêng",
      value: 6,
      image: {
        kind: "emoji",
        ref: "👟",
      },
      category: {
        type: "góc nhìn khác",
      },
      contrast_group: "other_view",
    },
    {
      id: "train_side",
      label: "đoàn tàu nhìn nghiêng",
      value: 7,
      image: {
        kind: "emoji",
        ref: "🚂",
      },
      category: {
        type: "góc nhìn khác",
      },
      contrast_group: "other_view",
    },
    {
      id: "guitar_flat",
      label: "cây đàn đặt phẳng",
      value: 8,
      image: {
        kind: "emoji",
        ref: "🎸",
      },
      category: {
        type: "góc nhìn khác",
      },
      contrast_group: "other_view",
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "house_front",
      target_id: "backpack_side",
      metadata: {
        dimension: "perspective",
      },
    },
    {
      type: "contrast",
      source_id: "car_front",
      target_id: "shoe_side",
      metadata: {
        dimension: "perspective",
      },
    },
    {
      type: "pair",
      source_id: "house_front",
      target_id: "car_front",
      metadata: {
        relation: "cùng nhìn trước",
      },
    },
    {
      type: "pair",
      source_id: "backpack_side",
      target_id: "shoe_side",
      metadata: {
        relation: "cùng nhìn khác",
      },
    },
  ],
  axes: {
    perspective: {
      values: ["nhìn phía trước", "góc nhìn khác"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Nhìn từ phía trước",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nhìn từ phía trước",
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
    narration_template: "Chúng mình cùng tìm hiểu về Nhìn từ phía trước nhé",
  },
  ordering: [
    "house_front",
    "car_front",
    "bear_front",
    "robot_front",
    "backpack_side",
    "shoe_side",
    "train_side",
    "guitar_flat",
  ],
};

export const C2_PER_01_SEED: SkillSeed = {
  identity: C2_PER_01_IDENTITY,
  dataset: C2_PER_01_DATASET,
  levels: [
    {
      code: "GL-C2-PER-MATCH-0103",
      template: "GT-005",
      band: "5-6",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
      montessori_ref: "WB19-D2",
    },
    {
      code: "GL-C2-PER-TAP-0001",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C2-PER-TAP-0002",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "body",
      rounds: 3,
    },
  ],
};
