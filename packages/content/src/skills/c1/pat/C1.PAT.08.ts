import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_PAT_08_IDENTITY: SkillIdentity = {
  code: "C1.PAT.08",
  strand_code: "C1.PAT",
  competency_code: "C1",
  name: "Pattern số",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["infer"],
  tier: "advanced",
  prerequisites: ["C1.NREC.09", "C1.PAT.01"],
  learning_objectives: [
    {
      code: "LO-C1.PAT.08-01",
      behaviour: "Nhận biết và thực hành Pattern số ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.PAT.08-02",
      behaviour: "Vận dụng Pattern số trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.PAT.08-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Pattern số",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_PAT_08_DATASET: SkillDataset = {
  skill_code: "C1.PAT.08",
  concept_label: "Pattern số",
  surface: "game",
  items: [
    {
      id: "cup",
      label: "cái cốc",
      image: {
        kind: "emoji",
        ref: "🥤",
      },
      category: {
        type: "đồ dùng",
      },
    },
    {
      id: "bed",
      label: "cái giường",
      image: {
        kind: "emoji",
        ref: "🛏️",
      },
      category: {
        type: "đồ dùng",
      },
    },
    {
      id: "chair",
      label: "cái ghế",
      image: {
        kind: "emoji",
        ref: "🪑",
      },
      category: {
        type: "đồ dùng",
      },
    },
    {
      id: "apple",
      label: "quả táo",
      image: {
        kind: "emoji",
        ref: "🍎",
      },
      category: {
        type: "hoa quả",
      },
    },
    {
      id: "banana",
      label: "quả chuối",
      image: {
        kind: "emoji",
        ref: "🍌",
      },
      category: {
        type: "hoa quả",
      },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Pattern số",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Pattern số",
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
    narration_template: "Chúng mình cùng tìm hiểu về Pattern số nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["cup", "bed", "chair", "apple", "banana"],
};

export const C1_PAT_08_SEED: SkillSeed = {
  identity: C1_PAT_08_IDENTITY,
  dataset: C1_PAT_08_DATASET,
  levels: [
    {
      code: "GL-C1-PAT-FCR-0006",
      template: "GT-036",
      band: "5-6",
      difficulty: 3,
      theme: "festival",
      rounds: 3,
      legacy_v1_ref: "D3-05",
    },
    {
      code: "GL-C1-PAT-FCR-0007",
      template: "GT-036",
      band: "5-6",
      difficulty: 3,
      theme: "space",
      rounds: 3,
      legacy_v1_ref: "D3-05",
    },
    {
      code: "GL-C1-PAT-FCR-0008",
      template: "GT-036",
      band: "5-6",
      difficulty: 3,
      theme: "home",
      rounds: 3,
      legacy_v1_ref: "D3-05",
    },
    {
      code: "GL-C1-PAT-FCR-0009",
      template: "GT-036",
      band: "5-6",
      difficulty: 4,
      theme: "nature",
      rounds: 3,
      legacy_v1_ref: "D3-05",
    },
    {
      code: "GL-C1-PAT-FCR-0010",
      template: "GT-036",
      band: "5-6",
      difficulty: 4,
      theme: "art",
      rounds: 3,
      legacy_v1_ref: "D3-05",
    },
    {
      code: "GL-C3-GAP-SLOT-0005",
      template: "GT-008",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
      legacy_v1_ref: "D3-02",
    },
    {
      code: "GL-C3-GAP-SLOT-0006",
      template: "GT-008",
      band: "4-5",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
      legacy_v1_ref: "D3-02",
    },
  ],
};
