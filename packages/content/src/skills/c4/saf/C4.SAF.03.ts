import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_SAF_03_IDENTITY: SkillIdentity = {
  code: "C4.SAF.03",
  strand_code: "C4.SAF",
  competency_code: "C4",
  name: "Vật nguy hiểm trong nhà",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["sort", "deduce"],
  tier: "core",
  prerequisites: ["C4.SOC.03"],
  learning_objectives: [
    {
      code: "LO-C4.SAF.03-01",
      behaviour: "Nhận biết và thực hành Vật nguy hiểm trong nhà ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.SAF.03-02",
      behaviour: "Vận dụng Vật nguy hiểm trong nhà trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.SAF.03-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Vật nguy hiểm trong nhà",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_SAF_03_DATASET: SkillDataset = {
  skill_code: "C4.SAF.03",
  concept_label: "Vật nguy hiểm trong nhà",
  surface: "game",
  items: [
    {
      id: "teddy",
      label: "gấu bông mềm",
      image: {
        kind: "emoji",
        ref: "🧸",
      },
      category: {
        type: "vật an toàn",
      },
      value: 1,
      ordering: 1,
      contrast_group: "safe",
      audio_path: "/audio/voice/gấu-bông-mềm.mp3",
    },
    {
      id: "ball",
      label: "quả bóng nhựa",
      image: {
        kind: "emoji",
        ref: "⚽",
      },
      category: {
        type: "vật an toàn",
      },
      value: 2,
      ordering: 2,
      contrast_group: "safe",
      audio_path: "/audio/voice/quả-bóng-nhựa.mp3",
    },
    {
      id: "book",
      label: "quyển sách xanh",
      image: {
        kind: "emoji",
        ref: "📘",
      },
      category: {
        type: "vật an toàn",
      },
      value: 3,
      ordering: 3,
      contrast_group: "safe",
      audio_path: "/audio/voice/quyển-sách-xanh.mp3",
    },
    {
      id: "blocks",
      label: "khúc gỗ nhỏ",
      image: {
        kind: "emoji",
        ref: "🪵",
      },
      category: {
        type: "vật an toàn",
      },
      value: 4,
      ordering: 4,
      contrast_group: "safe",
      audio_path: "/audio/voice/khúc-gỗ-nhỏ.mp3",
    },
    {
      id: "knife",
      label: "con dao nhọn",
      image: {
        kind: "emoji",
        ref: "🔪",
      },
      category: {
        type: "vật nguy hiểm",
      },
      value: 1,
      ordering: 5,
      contrast_group: "danger",
      audio_path: "/audio/voice/con-dao-nhọn.mp3",
    },
    {
      id: "scissors",
      label: "cây kéo nhọn",
      image: {
        kind: "emoji",
        ref: "✂️",
      },
      category: {
        type: "vật nguy hiểm",
      },
      value: 2,
      ordering: 6,
      contrast_group: "danger",
      audio_path: "/audio/voice/cây-kéo-nhọn.mp3",
    },
    {
      id: "fire",
      label: "ngọn lửa nóng",
      image: {
        kind: "emoji",
        ref: "🔥",
      },
      category: {
        type: "vật nguy hiểm",
      },
      value: 3,
      ordering: 7,
      contrast_group: "danger",
      audio_path: "/audio/voice/ngọn-lửa-nóng.mp3",
    },
    {
      id: "socket",
      label: "ổ cắm điện",
      image: {
        kind: "emoji",
        ref: "🔌",
      },
      category: {
        type: "vật nguy hiểm",
      },
      value: 4,
      ordering: 8,
      contrast_group: "danger",
      audio_path: "/audio/voice/ổ-cắm-điện.mp3",
    },
  ],
  axes: {
    category: {
      values: ["vật an toàn", "vật nguy hiểm"],
    },
  },
  relations: [
    {
      type: "contrast",
      source_id: "teddy",
      target_id: "knife",
    },
    {
      type: "contrast",
      source_id: "ball",
      target_id: "scissors",
    },
    {
      type: "contrast",
      source_id: "book",
      target_id: "fire",
    },
    {
      type: "contrast",
      source_id: "blocks",
      target_id: "socket",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Vật nguy hiểm trong nhà",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Vật nguy hiểm trong nhà",
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
      "Chúng mình cùng tìm hiểu về Vật nguy hiểm trong nhà nhé",
  },
  ordering: [
    "teddy",
    "ball",
    "book",
    "blocks",
    "knife",
    "scissors",
    "fire",
    "socket",
  ],
};

export const C4_SAF_03_SEED: SkillSeed = {
  identity: C4_SAF_03_IDENTITY,
  dataset: C4_SAF_03_DATASET,
  levels: [
    {
      code: "GL-C4-SAF-TCNT-0003",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C4-SAF-TCNT-0004",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C4-SAF-TCMP-0005",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
  ],
};
