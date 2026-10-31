import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_ORI_05_IDENTITY: SkillIdentity = {
  code: "C2.ORI.05",
  strand_code: "C2.ORI",
  competency_code: "C2",
  name: "Trước",
  age_min: 3,
  age_max: 3,
  difficulty: 2,
  thinking_processes: ["observe"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C2.ORI.05-01",
      behaviour: "Nhận biết và thực hành Trước ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.ORI.05-02",
      behaviour: "Vận dụng Trước trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.ORI.05-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Trước",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_ORI_05_DATASET: SkillDataset = {
  skill_code: "C2.ORI.05",
  concept_label: "Trước",
  surface: "game",
  items: [
    {
      id: "car_front",
      label: "mặt trước xe ô tô",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🚘",
      },
      category: {
        type: "ở phía trước",
      },
      contrast_group: "front",
    },
    {
      id: "person_front",
      label: "người đứng phía trước",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🧍",
      },
      category: {
        type: "ở phía trước",
      },
      contrast_group: "front",
    },
    {
      id: "house_front",
      label: "mặt trước ngôi nhà",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🏠",
      },
      category: {
        type: "ở phía trước",
      },
      contrast_group: "front",
    },
    {
      id: "steps_forward",
      label: "bước về phía trước",
      value: 4,
      image: {
        kind: "emoji",
        ref: "👣",
      },
      category: {
        type: "ở phía trước",
      },
      contrast_group: "front",
    },
    {
      id: "car_back",
      label: "đuôi xe phía sau",
      value: 5,
      image: {
        kind: "emoji",
        ref: "🚗",
      },
      category: {
        type: "ở phía sau",
      },
      contrast_group: "behind",
    },
    {
      id: "person_back",
      label: "người quay lưng phía sau",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🚶",
      },
      category: {
        type: "ở phía sau",
      },
      contrast_group: "behind",
    },
    {
      id: "yard_back",
      label: "vườn hoa phía sau",
      value: 7,
      image: {
        kind: "emoji",
        ref: "🏡",
      },
      category: {
        type: "ở phía sau",
      },
      contrast_group: "behind",
    },
    {
      id: "shadow_back",
      label: "bóng lưng phía sau",
      value: 8,
      image: {
        kind: "emoji",
        ref: "👤",
      },
      category: {
        type: "ở phía sau",
      },
      contrast_group: "behind",
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "car_front",
      target_id: "car_back",
      metadata: {
        dimension: "depth_position",
      },
    },
    {
      type: "contrast",
      source_id: "person_front",
      target_id: "person_back",
      metadata: {
        dimension: "depth_position",
      },
    },
    {
      type: "pair",
      source_id: "car_front",
      target_id: "house_front",
      metadata: {
        relation: "cùng ở phía trước",
      },
    },
    {
      type: "pair",
      source_id: "car_back",
      target_id: "yard_back",
      metadata: {
        relation: "cùng ở phía sau",
      },
    },
  ],
  axes: {
    depth_position: {
      values: ["ở phía trước", "ở phía sau"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Trước",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Trước",
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
    narration_template: "Chúng mình cùng tìm hiểu về Trước nhé",
  },
  ordering: [
    "car_front",
    "person_front",
    "house_front",
    "steps_forward",
    "car_back",
    "person_back",
    "yard_back",
    "shadow_back",
  ],
};

export const C2_ORI_05_SEED: SkillSeed = {
  identity: C2_ORI_05_IDENTITY,
  dataset: C2_ORI_05_DATASET,
  levels: [
    {
      code: "GL-C2-ORI-TAP-0009",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C2-ORI-TAP-0010",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C2-ORI-TCMP-0009",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "home",
      rounds: 3,
    },
  ],
};
