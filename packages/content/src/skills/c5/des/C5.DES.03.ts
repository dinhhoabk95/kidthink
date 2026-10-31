import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_DES_03_IDENTITY: SkillIdentity = {
  code: "C5.DES.03",
  strand_code: "C5.DES",
  competency_code: "C5",
  name: "So sánh bằng lời",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["describe", "compare"],
  tier: "core",
  prerequisites: ["C1.CMP.01", "C5.DES.01"],
  learning_objectives: [
    {
      code: "LO-C5.DES.03-01",
      behaviour: "Nhận biết và thực hành So sánh bằng lời ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.DES.03-02",
      behaviour: "Vận dụng So sánh bằng lời trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.DES.03-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới So sánh bằng lời",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_DES_03_DATASET: SkillDataset = {
  skill_code: "C5.DES.03",
  concept_label: "So sánh bằng lời",
  surface: "game",
  items: [
    {
      id: "des_to_nho",
      label: "voi to hơn chuột",
      image: {
        kind: "emoji",
        ref: "🐘",
      },
      category: {
        type: "so sánh kích thước",
        label: "Kích thước chiều dài",
      },
      contrast_group: "primary",
      value: 1,
      ordering: 1,
    },
    {
      id: "des_cao_thap",
      label: "hươu cao hơn vịt",
      image: {
        kind: "emoji",
        ref: "🦒",
      },
      category: {
        type: "so sánh kích thước",
        label: "Kích thước chiều dài",
      },
      contrast_group: "primary",
      value: 2,
      ordering: 2,
    },
    {
      id: "des_dai_ngan",
      label: "thước dài hơn bút",
      image: {
        kind: "emoji",
        ref: "📏",
      },
      category: {
        type: "so sánh kích thước",
        label: "Kích thước chiều dài",
      },
      contrast_group: "primary",
      value: 3,
      ordering: 3,
    },
    {
      id: "des_nhanh_cham",
      label: "thỏ nhanh hơn rùa",
      image: {
        kind: "emoji",
        ref: "🐇",
      },
      category: {
        type: "so sánh đặc tính",
        label: "Tốc độ khối lượng",
      },
      contrast_group: "contrast",
      value: 4,
      ordering: 4,
    },
    {
      id: "des_nang_nhe",
      label: "hòn đá nặng hơn lá",
      image: {
        kind: "emoji",
        ref: "🪨",
      },
      category: {
        type: "so sánh đặc tính",
        label: "Tốc độ khối lượng",
      },
      contrast_group: "contrast",
      value: 5,
      ordering: 5,
    },
    {
      id: "des_nong_lanh",
      label: "đá lạnh hơn nước ấm",
      image: {
        kind: "emoji",
        ref: "🧊",
      },
      category: {
        type: "so sánh đặc tính",
        label: "Tốc độ khối lượng",
      },
      contrast_group: "contrast",
      value: 6,
      ordering: 6,
    },
  ],
  axes: {
    category: {
      values: ["so sánh kích thước", "so sánh đặc tính"],
      ordered: true,
    },
  },
  relations: [
    {
      type: "pair",
      source_id: "des_to_nho",
      target_id: "des_cao_thap",
      explanation: "cùng là so sánh kích thước",
    },
    {
      type: "pair",
      source_id: "des_nhanh_cham",
      target_id: "des_nang_nhe",
      explanation: "cùng là so sánh đặc tính",
    },
    {
      type: "contrast",
      source_id: "des_to_nho",
      target_id: "des_nhanh_cham",
      explanation: "so sánh kích thước đối lập với so sánh đặc tính",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với So sánh bằng lời",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng So sánh bằng lời",
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
    narration_template: "Chúng mình cùng tìm hiểu về So sánh bằng lời nhé",
  },
  ordering: [
    "des_to_nho",
    "des_cao_thap",
    "des_dai_ngan",
    "des_nhanh_cham",
    "des_nang_nhe",
    "des_nong_lanh",
  ],
};

export const C5_DES_03_SEED: SkillSeed = {
  identity: C5_DES_03_IDENTITY,
  dataset: C5_DES_03_DATASET,
  levels: [
    {
      code: "GL-C5-DES-TAP-0003",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C5-DES-TAP-0004",
      template: "GT-001",
      band: "3-4",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C5-DES-TCNT-0003",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
  ],
};
