import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_ORD_06_IDENTITY: SkillIdentity = {
  code: "C1.ORD.06",
  strand_code: "C1.ORD",
  competency_code: "C1",
  name: "Thứ tự ngược từ cuối lên",
  age_min: 6,
  age_max: 7,
  difficulty: 4,
  thinking_processes: ["sequence", "shift"],
  tier: "advanced",
  prerequisites: ["C1.ORD.04", "C1.CNT.04"],
  learning_objectives: [
    {
      code: "LO-C1.ORD.06-01",
      behaviour: "Nhận biết và thực hành Thứ tự ngược từ cuối lên ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.ORD.06-02",
      behaviour: "Vận dụng Thứ tự ngược từ cuối lên trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.ORD.06-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Thứ tự ngược từ cuối lên",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_ORD_06_DATASET: SkillDataset = {
  skill_code: "C1.ORD.06",
  concept_label: "Thứ tự ngược từ cuối lên",
  surface: "game",
  items: [
    {
      id: "bowl",
      label: "cái bát",
      image: {
        kind: "emoji",
        ref: "🥣",
      },
      category: {
        type: "đồ dùng",
      },
    },
    {
      id: "spoon",
      label: "cái thìa",
      image: {
        kind: "emoji",
        ref: "🥄",
      },
      category: {
        type: "đồ dùng",
      },
    },
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
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Thứ tự ngược từ cuối lên",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Thứ tự ngược từ cuối lên",
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
      "Chúng mình cùng tìm hiểu về Thứ tự ngược từ cuối lên nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["bowl", "spoon", "cup", "bed", "chair"],
};

export const C1_ORD_06_SEED: SkillSeed = {
  identity: C1_ORD_06_IDENTITY,
  dataset: C1_ORD_06_DATASET,
  levels: [
    {
      template: "GT-006",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-008",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
    {
      template: "GT-010",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-013",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
  ],
};
