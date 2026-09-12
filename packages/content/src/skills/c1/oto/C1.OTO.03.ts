import { getQuantityRep } from "#src/inventories/index";

export const C1_OTO_03_REP = getQuantityRep("rep_discrete_object");

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
      label: "quả táo",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🍎",
      },
      contrast_group: "real",
    },
    {
      id: "apple_shadow",
      label: "bóng quả táo",
      value: 1,
      image: {
        kind: "emoji",
        ref: "⚫",
      },
      contrast_group: "shadow",
    },
    {
      id: "banana_real",
      label: "quả chuối",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🍌",
      },
      contrast_group: "real",
    },
    {
      id: "banana_shadow",
      label: "bóng quả chuối",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🌙",
      },
      contrast_group: "shadow",
    },
    {
      id: "car_real",
      label: "ô tô",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🚗",
      },
      contrast_group: "real",
    },
    {
      id: "car_shadow",
      label: "bóng ô tô",
      value: 1,
      image: {
        kind: "emoji",
        ref: "▬",
      },
      contrast_group: "shadow",
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
    prompt_template: "Bé hãy ghép đôi từng {label} tương ứng nhé!",
    narration_template: "Chúng mình cùng tìm hiểu về Ghép đồ vật với bóng nhé",
  },
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
      code: "GL-C1-OTO-TAP-0011",
      template: "GT-001",
      band: "3-4",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-TAP-0012",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "vehicle",
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
    {
      code: "GL-C1-OTO-TCMP-0010",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-TCMP-0011",
      template: "GT-003",
      band: "3-4",
      difficulty: 3,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-TCMP-0012",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-PATT-0009",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-PATT-0010",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-PATT-0011",
      template: "GT-005",
      band: "3-4",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-PATT-0012",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-SLOT-0005",
      template: "GT-008",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-SLOT-0006",
      template: "GT-008",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-SLOT-0007",
      template: "GT-008",
      band: "3-4",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-SLOT-0008",
      template: "GT-008",
      band: "3-4",
      difficulty: 1,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-MEMO-0001",
      template: "GT-012",
      band: "3-4",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-MEMO-0002",
      template: "GT-012",
      band: "3-4",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-MEMO-0003",
      template: "GT-012",
      band: "3-4",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-MEMO-0004",
      template: "GT-012",
      band: "3-4",
      difficulty: 1,
      theme: "vehicle",
      rounds: 3,
    },
  ],
};
