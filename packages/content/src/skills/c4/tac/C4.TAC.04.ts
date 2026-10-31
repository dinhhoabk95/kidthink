import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_TAC_04_IDENTITY: SkillIdentity = {
  code: "C4.TAC.04",
  strand_code: "C4.TAC",
  competency_code: "C4",
  name: "Nặng – nhẹ bằng tay",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["compare", "verify"],
  tier: "core",
  prerequisites: ["C1.CMP.10", "C1.CMP.11"],
  learning_objectives: [
    {
      code: "LO-C4.TAC.04-01",
      behaviour: "Nhận biết và thực hành Nặng – nhẹ bằng tay ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.TAC.04-02",
      behaviour: "Vận dụng Nặng – nhẹ bằng tay trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.TAC.04-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Nặng – nhẹ bằng tay",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_TAC_04_DATASET: SkillDataset = {
  skill_code: "C4.TAC.04",
  concept_label: "Nặng – nhẹ bằng tay",
  surface: "game",
  items: [
    {
      id: "feather",
      label: "lông chim nhẹ",
      image: {
        kind: "emoji",
        ref: "🪶",
      },
      category: {
        type: "vật nhẹ nhàng",
      },
      value: 1,
      ordering: 1,
      contrast_group: "light",
      audio_path: "/audio/vi/c4/feather.mp3",
    },
    {
      id: "dry_leaf",
      label: "chiếc lá khô",
      image: {
        kind: "emoji",
        ref: "🍂",
      },
      category: {
        type: "vật nhẹ nhàng",
      },
      value: 2,
      ordering: 2,
      contrast_group: "light",
      audio_path: "/audio/vi/c4/dry_leaf.mp3",
    },
    {
      id: "balloon",
      label: "quả bóng bay",
      image: {
        kind: "emoji",
        ref: "🎈",
      },
      category: {
        type: "vật nhẹ nhàng",
      },
      value: 3,
      ordering: 3,
      contrast_group: "light",
      audio_path: "/audio/vi/c4/balloon.mp3",
    },
    {
      id: "paper",
      label: "mẩu giấy nhỏ",
      image: {
        kind: "emoji",
        ref: "📄",
      },
      category: {
        type: "vật nhẹ nhàng",
      },
      value: 4,
      ordering: 4,
      contrast_group: "light",
      audio_path: "/audio/vi/c4/paper.mp3",
    },
    {
      id: "water_jug",
      label: "bình nước đầy",
      image: {
        kind: "emoji",
        ref: "🫙",
      },
      category: {
        type: "đồ vật nặng",
      },
      value: 5,
      ordering: 5,
      contrast_group: "heavy",
      audio_path: "/audio/vi/c4/water_jug.mp3",
    },
    {
      id: "heavy_books",
      label: "chồng sách dày",
      image: {
        kind: "emoji",
        ref: "📚",
      },
      category: {
        type: "đồ vật nặng",
      },
      value: 6,
      ordering: 6,
      contrast_group: "heavy",
      audio_path: "/audio/vi/c4/heavy_books.mp3",
    },
    {
      id: "big_rock",
      label: "hòn đá to",
      image: {
        kind: "emoji",
        ref: "🪨",
      },
      category: {
        type: "đồ vật nặng",
      },
      value: 7,
      ordering: 7,
      contrast_group: "heavy",
      audio_path: "/audio/vi/c4/big_rock.mp3",
    },
    {
      id: "dumbbell",
      label: "mỏ neo sắt",
      image: {
        kind: "emoji",
        ref: "⚓",
      },
      category: {
        type: "đồ vật nặng",
      },
      value: 8,
      ordering: 8,
      contrast_group: "heavy",
      audio_path: "/audio/vi/c4/dumbbell.mp3",
    },
  ],
  axes: {
    category: {
      values: ["vật nhẹ nhàng", "đồ vật nặng"],
    },
  },
  relations: [
    {
      type: "contrast",
      source_id: "feather",
      target_id: "dumbbell",
    },
    {
      type: "contrast",
      source_id: "dry_leaf",
      target_id: "big_rock",
    },
    {
      type: "contrast",
      source_id: "balloon",
      target_id: "heavy_books",
    },
    {
      type: "contrast",
      source_id: "paper",
      target_id: "water_jug",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Nặng – nhẹ bằng tay",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nặng – nhẹ bằng tay",
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
    narration_template: "Chúng mình cùng tìm hiểu về Nặng – nhẹ bằng tay nhé",
  },
  ordering: [
    "feather",
    "dry_leaf",
    "balloon",
    "paper",
    "water_jug",
    "heavy_books",
    "big_rock",
    "dumbbell",
  ],
};

export const C4_TAC_04_SEED: SkillSeed = {
  identity: C4_TAC_04_IDENTITY,
  dataset: C4_TAC_04_DATASET,
  levels: [
    {
      code: "GL-C4-TAC-TAP-0007",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C4-TAC-TAP-0008",
      template: "GT-001",
      band: "3-4",
      difficulty: 3,
      theme: "vehicle",
      rounds: 3,
    },
    {
      template: "GT-032",
      band: "5-6",
      difficulty: 2,
      theme: "school",
    },
  ],
};
