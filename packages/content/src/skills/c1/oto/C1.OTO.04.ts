import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_OTO_04_IDENTITY: SkillIdentity = {
  code: "C1.OTO.04",
  strand_code: "C1.OTO",
  competency_code: "C1",
  name: "Ghép đồ vật với số",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["match"],
  tier: "basic",
  prerequisites: ["C1.OTO.01", "C1.NREC.02"],
  learning_objectives: [
    {
      code: "LO-C1.OTO.04-01",
      behaviour: "Nhận biết và thực hành Ghép đồ vật với số ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.OTO.04-02",
      behaviour: "Vận dụng Ghép đồ vật với số trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.OTO.04-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Ghép đồ vật với số",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_OTO_04_DATASET: SkillDataset = {
  skill_code: "C1.OTO.04",
  concept_label: "Ghép đồ vật với số",
  surface: "game",
  items: [
    {
      id: "item_1",
      label: "1 ngôi sao",
      value: 1,
      image: {
        kind: "emoji",
        ref: "⭐",
      },
      contrast_group: "num_obj",
      category: {
        type: "nhóm ít đồ",
      },
    },
    {
      id: "item_2",
      label: "2 trái tim",
      value: 2,
      image: {
        kind: "emoji",
        ref: "💖",
      },
      contrast_group: "num_obj",
      category: {
        type: "nhóm ít đồ",
      },
    },
    {
      id: "item_3",
      label: "3 bông hoa",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🌸",
      },
      contrast_group: "num_obj",
      category: {
        type: "nhóm ít đồ",
      },
    },
    {
      id: "item_4",
      label: "4 quả táo",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🍎",
      },
      contrast_group: "num_obj",
      category: {
        type: "nhóm nhiều đồ",
      },
    },
    {
      id: "item_5",
      label: "5 quả cam",
      value: 5,
      image: {
        kind: "emoji",
        ref: "🍊",
      },
      contrast_group: "num_obj",
      category: {
        type: "nhóm nhiều đồ",
      },
    },
    {
      id: "item_6",
      label: "6 quả dâu",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🍓",
      },
      contrast_group: "num_obj",
      category: {
        type: "nhóm nhiều đồ",
      },
    },
    {
      id: "item_hand_1",
      label: "1 ngón tay",
      value: 1,
      image: {
        kind: "emoji",
        ref: "👆",
      },
      contrast_group: "hand_gesture",
      category: {
        type: "ngón tay đếm",
      },
    },
    {
      id: "item_hand_2",
      label: "2 ngón tay",
      value: 2,
      image: {
        kind: "emoji",
        ref: "✌️",
      },
      contrast_group: "hand_gesture",
      category: {
        type: "ngón tay đếm",
      },
    },
    {
      id: "item_hand_3",
      label: "3 ngón tay",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🤟",
      },
      contrast_group: "hand_gesture",
      category: {
        type: "ngón tay đếm",
      },
    },
    {
      id: "item_hand_4",
      label: "4 ngón tay",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🖖",
      },
      contrast_group: "hand_gesture",
      category: {
        type: "ngón tay đếm",
      },
    },
    {
      id: "item_hand_5",
      label: "5 ngón tay",
      value: 5,
      image: {
        kind: "emoji",
        ref: "🖐️",
      },
      contrast_group: "hand_gesture",
      category: {
        type: "ngón tay đếm",
      },
    },
    {
      id: "item_ice_cream",
      label: "que kem mát lạnh",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🍦",
      },
      contrast_group: "food",
      category: {
        type: "món ăn vặt",
      },
    },
    {
      id: "item_crown",
      label: "chiếc vương miện lấp lánh",
      value: 1,
      image: {
        kind: "emoji",
        ref: "👑",
      },
      contrast_group: "wearable",
      category: {
        type: "đồ vật trang sức",
      },
    },
  ],
  relations: [
    {
      type: "sequence",
      source_id: "item_1",
      target_id: "item_2",
    },
    {
      type: "sequence",
      source_id: "item_2",
      target_id: "item_3",
    },
    {
      type: "sequence",
      source_id: "item_3",
      target_id: "item_4",
    },
    {
      type: "sequence",
      source_id: "item_4",
      target_id: "item_5",
    },
    {
      type: "sequence",
      source_id: "item_5",
      target_id: "item_6",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với ghép đồ vật với số",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng ghép đồ vật với số",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt ghép đồ vật với số với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi ghép đồ vật với số",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục ghép đồ vật với số và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn đúng {label} nhé!",
    narration_template:
      "Chúng mình cùng đếm số lượng đồ vật và ghép với số tương ứng nhé",
  },
  ordering: ["item_1", "item_2", "item_3", "item_4", "item_5", "item_6"],
};

export const C1_OTO_04_SEED: SkillSeed = {
  identity: C1_OTO_04_IDENTITY,
  dataset: C1_OTO_04_DATASET,
  levels: [
    {
      code: "GL-C1-OTO-CARD-0104",
      template: "GT-012",
      band: "3-4",
      difficulty: 2,
      access_tier: "login",
      theme: "nature",
      rounds: 3,
      montessori_ref: "WB01-D2",
    },
    {
      code: "GL-C1-OTO-TAP-0104",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      access_tier: "login",
      theme: "nature",
      rounds: 3,
      montessori_ref: "WB01-D2",
    },
    {
      code: "GL-C1-OTO-FLIP-0001",
      template: "GT-020",
      band: "4-5",
      difficulty: 1,
      access_tier: "free",
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-FLIP-0002",
      template: "GT-020",
      band: "4-5",
      difficulty: 2,
      access_tier: "login",
      theme: "farm",
      rounds: 3,
    },
  ],
};
