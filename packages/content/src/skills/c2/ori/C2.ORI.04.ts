import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_ORI_04_IDENTITY: SkillIdentity = {
  code: "C2.ORI.04",
  strand_code: "C2.ORI",
  competency_code: "C2",
  name: "Dưới",
  age_min: 3,
  age_max: 3,
  difficulty: 1,
  thinking_processes: ["observe"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C2.ORI.04-01",
      behaviour: "Nhận biết và thực hành Dưới ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.ORI.04-02",
      behaviour: "Vận dụng Dưới trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.ORI.04-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Dưới",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_ORI_04_DATASET: SkillDataset = {
  skill_code: "C2.ORI.04",
  concept_label: "Dưới",
  surface: "game",
  items: [
    {
      id: "arrow_below",
      label: "mũi tên ở dưới",
      value: 1,
      image: {
        kind: "emoji",
        ref: "⬇️",
      },
      category: {
        type: "ở phía dưới",
      },
      contrast_group: "below",
    },
    {
      id: "drawer_below",
      label: "ngăn tủ ở dưới",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🗄️",
      },
      category: {
        type: "ở phía dưới",
      },
      contrast_group: "below",
    },
    {
      id: "leg_below",
      label: "chân bàn ở dưới",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🪵",
      },
      category: {
        type: "ở phía dưới",
      },
      contrast_group: "below",
    },
    {
      id: "mat_below",
      label: "thảm trải ở dưới",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🧶",
      },
      category: {
        type: "ở phía dưới",
      },
      contrast_group: "below",
    },
    {
      id: "arrow_above",
      label: "mũi tên ở trên",
      value: 5,
      image: {
        kind: "emoji",
        ref: "⬆️",
      },
      category: {
        type: "ở phía trên",
      },
      contrast_group: "above",
    },
    {
      id: "tabletop_above",
      label: "mặt bàn ở trên",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🛋️",
      },
      category: {
        type: "ở phía trên",
      },
      contrast_group: "above",
    },
    {
      id: "lamp_above",
      label: "đèn treo ở trên",
      value: 7,
      image: {
        kind: "emoji",
        ref: "💡",
      },
      category: {
        type: "ở phía trên",
      },
      contrast_group: "above",
    },
    {
      id: "cloud_above",
      label: "đám mây ở trên",
      value: 8,
      image: {
        kind: "emoji",
        ref: "☁️",
      },
      category: {
        type: "ở phía trên",
      },
      contrast_group: "above",
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "arrow_below",
      target_id: "arrow_above",
      metadata: {
        dimension: "position",
      },
    },
    {
      type: "contrast",
      source_id: "drawer_below",
      target_id: "lamp_above",
      metadata: {
        dimension: "position",
      },
    },
    {
      type: "pair",
      source_id: "arrow_below",
      target_id: "drawer_below",
      metadata: {
        relation: "cùng ở dưới",
      },
    },
    {
      type: "pair",
      source_id: "arrow_above",
      target_id: "lamp_above",
      metadata: {
        relation: "cùng ở trên",
      },
    },
  ],
  axes: {
    position: {
      values: ["ở phía dưới", "ở phía trên"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Dưới",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Dưới",
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
    narration_template: "Chúng mình cùng tìm hiểu về Dưới nhé",
  },
  ordering: [
    "arrow_below",
    "drawer_below",
    "leg_below",
    "mat_below",
    "arrow_above",
    "tabletop_above",
    "lamp_above",
    "cloud_above",
  ],
};

export const C2_ORI_04_SEED: SkillSeed = {
  identity: C2_ORI_04_IDENTITY,
  dataset: C2_ORI_04_DATASET,
  levels: [
    {
      code: "GL-C2-ORI-DIR-0001",
      template: "GT-005",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C2-ORI-DIR-0002",
      template: "GT-022",
      band: "4-5",
      difficulty: 2,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C2-ORI-TAP-0007",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "food",
      rounds: 3,
    },
  ],
};
