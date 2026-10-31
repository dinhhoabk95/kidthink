import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_MEM_03_IDENTITY: SkillIdentity = {
  code: "C4.MEM.03",
  strand_code: "C4.MEM",
  competency_code: "C4",
  name: "Nhớ chuỗi màu",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["recall", "sequence"],
  tier: "core",
  prerequisites: ["C4.DET.01"],
  learning_objectives: [
    {
      code: "LO-C4.MEM.03-01",
      behaviour: "Nhận biết và thực hành Nhớ chuỗi màu ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.MEM.03-02",
      behaviour: "Vận dụng Nhớ chuỗi màu trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.MEM.03-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Nhớ chuỗi màu",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_MEM_03_DATASET: SkillDataset = {
  skill_code: "C4.MEM.03",
  concept_label: "Nhớ chuỗi màu",
  surface: "game",
  items: [
    {
      id: "strawberry",
      label: "quả dâu tây",
      image: {
        kind: "emoji",
        ref: "🍓",
      },
      category: {
        type: "quả trong vườn",
      },
      value: 1,
      ordering: 1,
      contrast_group: "fruit",
      audio_path: "/audio/vi/c4/strawberry.mp3",
    },
    {
      id: "orange",
      label: "quả cam ngọt",
      image: {
        kind: "emoji",
        ref: "🍊",
      },
      category: {
        type: "quả trong vườn",
      },
      value: 2,
      ordering: 2,
      contrast_group: "fruit",
      audio_path: "/audio/vi/c4/orange.mp3",
    },
    {
      id: "banana",
      label: "quả chuối vàng",
      image: {
        kind: "emoji",
        ref: "🍌",
      },
      category: {
        type: "quả trong vườn",
      },
      value: 3,
      ordering: 3,
      contrast_group: "fruit",
      audio_path: "/audio/vi/c4/banana.mp3",
    },
    {
      id: "green_apple",
      label: "quả táo xanh",
      image: {
        kind: "emoji",
        ref: "🍏",
      },
      category: {
        type: "quả trong vườn",
      },
      value: 4,
      ordering: 4,
      contrast_group: "fruit",
      audio_path: "/audio/vi/c4/green_apple.mp3",
    },
    {
      id: "rose",
      label: "bông hoa hồng",
      image: {
        kind: "emoji",
        ref: "🌹",
      },
      category: {
        type: "hoa trong vườn",
      },
      value: 1,
      ordering: 5,
      contrast_group: "flower",
      audio_path: "/audio/vi/c4/rose.mp3",
    },
    {
      id: "tulip",
      label: "bông hoa tu-líp",
      image: {
        kind: "emoji",
        ref: "🌷",
      },
      category: {
        type: "hoa trong vườn",
      },
      value: 2,
      ordering: 6,
      contrast_group: "flower",
      audio_path: "/audio/vi/c4/tulip.mp3",
    },
    {
      id: "sunflower",
      label: "hoa hướng dương",
      image: {
        kind: "emoji",
        ref: "🌻",
      },
      category: {
        type: "hoa trong vườn",
      },
      value: 3,
      ordering: 7,
      contrast_group: "flower",
      audio_path: "/audio/vi/c4/sunflower.mp3",
    },
    {
      id: "lotus",
      label: "bông hoa sen",
      image: {
        kind: "emoji",
        ref: "🪷",
      },
      category: {
        type: "hoa trong vườn",
      },
      value: 4,
      ordering: 8,
      contrast_group: "flower",
      audio_path: "/audio/vi/c4/lotus.mp3",
    },
  ],
  axes: {
    category: {
      values: ["quả trong vườn", "hoa trong vườn"],
    },
  },
  relations: [
    {
      type: "contrast",
      source_id: "strawberry",
      target_id: "rose",
    },
    {
      type: "contrast",
      source_id: "orange",
      target_id: "tulip",
    },
    {
      type: "contrast",
      source_id: "banana",
      target_id: "sunflower",
    },
    {
      type: "contrast",
      source_id: "green_apple",
      target_id: "lotus",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Nhớ chuỗi màu",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nhớ chuỗi màu",
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
    narration_template: "Chúng mình cùng tìm hiểu về Nhớ chuỗi màu nhé",
  },
  ordering: [
    "strawberry",
    "orange",
    "banana",
    "green_apple",
    "rose",
    "tulip",
    "sunflower",
    "lotus",
  ],
};

export const C4_MEM_03_SEED: SkillSeed = {
  identity: C4_MEM_03_IDENTITY,
  dataset: C4_MEM_03_DATASET,
  levels: [
    {
      code: "GL-C4-TAP-INS-0006",
      template: "GT-018",
      band: "5-6",
      difficulty: 3,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C4-TAP-INS-0007",
      template: "GT-018",
      band: "5-6",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C4-MEM-GNG-0001",
      template: "GT-026",
      band: "4-5",
      difficulty: 2,
      theme: "vehicle",
      rounds: 3,
    },
  ],
};
