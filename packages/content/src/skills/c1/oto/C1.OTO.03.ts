import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_OTO_03_IDENTITY: SkillIdentity = {
  code: "C1.OTO.03",
  strand_code: "C1.OTO",
  competency_code: "C1",
  name: "Ghép đồ vật với bóng",
  age_min: 3,
  age_max: 3,
  difficulty: 2,
  thinking_processes: ["match", "observe"],
  tier: "basic",
  prerequisites: ["C1.OTO.01"],
  learning_objectives: [
    {
      code: "LO-C1.OTO.03-01",
      behaviour: "Nhận biết và thực hành Ghép đồ vật với bóng ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.OTO.03-02",
      behaviour: "Vận dụng Ghép đồ vật với bóng trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.OTO.03-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Ghép đồ vật với bóng",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_OTO_03_DATASET: SkillDataset = {
  skill_code: "C1.OTO.03",
  concept_label: "Ghép đồ vật với bóng",
  surface: "game",
  items: [
    {
      id: "apple_real",
      label: "quả táo đỏ",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🍎",
      },
      contrast_group: "real",
      category: {
        type: "đồ vật thật",
      },
    },
    {
      id: "apple_shadow",
      label: "bóng quả táo",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🍏",
      },
      contrast_group: "shadow",
      category: {
        type: "hình bóng",
      },
    },
    {
      id: "banana_real",
      label: "quả chuối vàng",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🍌",
      },
      contrast_group: "real",
      category: {
        type: "đồ vật thật",
      },
    },
    {
      id: "banana_shadow",
      label: "bóng quả chuối",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🌙",
      },
      contrast_group: "shadow",
      category: {
        type: "hình bóng",
      },
    },
    {
      id: "car_real",
      label: "xe ô tô đỏ",
      value: 5,
      image: {
        kind: "emoji",
        ref: "🚗",
      },
      contrast_group: "real",
      category: {
        type: "đồ vật thật",
      },
    },
    {
      id: "car_shadow",
      label: "bóng xe ô tô",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🚙",
      },
      contrast_group: "shadow",
      category: {
        type: "hình bóng",
      },
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "apple_real",
      target_id: "apple_shadow",
    },
    {
      type: "pair",
      source_id: "banana_real",
      target_id: "banana_shadow",
    },
    {
      type: "pair",
      source_id: "car_real",
      target_id: "car_shadow",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với ghép đồ vật với bóng",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng ghép đồ vật với bóng",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt ghép đồ vật với bóng với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi ghép đồ vật với bóng",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục ghép đồ vật với bóng và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn đúng {label} nhé!",
    narration_template: "Chúng mình cùng tìm hiểu về ghép đồ vật với bóng nhé",
  },
  ordering: [
    "apple_real",
    "apple_shadow",
    "banana_real",
    "banana_shadow",
    "car_real",
    "car_shadow",
  ],
};

export const C1_OTO_03_SEED: SkillSeed = {
  identity: C1_OTO_03_IDENTITY,
  dataset: C1_OTO_03_DATASET,
  levels: [
    {
      code: "GL-C1-OTO-TAP-0009",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-TAP-0010",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-TCMP-0009",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
  ],
};
