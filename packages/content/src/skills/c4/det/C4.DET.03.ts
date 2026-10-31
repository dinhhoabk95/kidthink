import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_DET_03_IDENTITY: SkillIdentity = {
  code: "C4.DET.03",
  strand_code: "C4.DET",
  competency_code: "C4",
  name: "Quan sát kích thước",
  age_min: 3,
  age_max: 3,
  difficulty: 2,
  thinking_processes: ["observe", "compare"],
  tier: "basic",
  prerequisites: ["C1.CMP.01"],
  learning_objectives: [
    {
      code: "LO-C4.DET.03-01",
      behaviour: "Nhận biết và thực hành Quan sát kích thước ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.DET.03-02",
      behaviour: "Vận dụng Quan sát kích thước trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.DET.03-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Quan sát kích thước",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_DET_03_DATASET: SkillDataset = {
  skill_code: "C4.DET.03",
  concept_label: "Quan sát kích thước",
  surface: "game",
  items: [
    {
      id: "size_elephant",
      label: "con voi to",
      image: {
        kind: "emoji",
        ref: "🐘",
      },
      category: {
        type: "vật to lớn",
      },
      contrast_group: "large",
      value: 1,
      ordering: 1,
      audio_path: "/audio/vi/c4/size_elephant.mp3",
    },
    {
      id: "size_whale",
      label: "cá voi to",
      image: {
        kind: "emoji",
        ref: "🐳",
      },
      category: {
        type: "vật to lớn",
      },
      contrast_group: "large",
      value: 2,
      ordering: 2,
      audio_path: "/audio/vi/c4/size_whale.mp3",
    },
    {
      id: "size_truck",
      label: "xe tải to",
      image: {
        kind: "emoji",
        ref: "🚛",
      },
      category: {
        type: "vật to lớn",
      },
      contrast_group: "large",
      value: 3,
      ordering: 3,
      audio_path: "/audio/vi/c4/size_truck.mp3",
    },
    {
      id: "size_house",
      label: "ngôi nhà to",
      image: {
        kind: "emoji",
        ref: "🏠",
      },
      category: {
        type: "vật to lớn",
      },
      contrast_group: "large",
      value: 4,
      ordering: 4,
      audio_path: "/audio/vi/c4/size_house.mp3",
    },
    {
      id: "size_ant",
      label: "con kiến nhỏ",
      image: {
        kind: "emoji",
        ref: "🐜",
      },
      category: {
        type: "vật nhỏ bé",
      },
      contrast_group: "small",
      value: 1,
      ordering: 5,
      audio_path: "/audio/vi/c4/size_ant.mp3",
    },
    {
      id: "size_mouse",
      label: "chuột nhắt nhỏ",
      image: {
        kind: "emoji",
        ref: "🐁",
      },
      category: {
        type: "vật nhỏ bé",
      },
      contrast_group: "small",
      value: 2,
      ordering: 6,
      audio_path: "/audio/vi/c4/size_mouse.mp3",
    },
    {
      id: "size_button",
      label: "cúc áo nhỏ",
      image: {
        kind: "emoji",
        ref: "🔘",
      },
      category: {
        type: "vật nhỏ bé",
      },
      contrast_group: "small",
      value: 3,
      ordering: 7,
      audio_path: "/audio/vi/c4/size_button.mp3",
    },
    {
      id: "size_cherry",
      label: "quả anh đào nhỏ",
      image: {
        kind: "emoji",
        ref: "🍒",
      },
      category: {
        type: "vật nhỏ bé",
      },
      contrast_group: "small",
      value: 4,
      ordering: 8,
      audio_path: "/audio/vi/c4/size_cherry.mp3",
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "size_elephant",
      target_id: "size_ant",
    },
    {
      type: "contrast",
      source_id: "size_whale",
      target_id: "size_mouse",
    },
    {
      type: "contrast",
      source_id: "size_truck",
      target_id: "size_button",
    },
    {
      type: "contrast",
      source_id: "size_house",
      target_id: "size_cherry",
    },
  ],
  axes: {
    size_group: {
      values: ["vật to lớn", "vật nhỏ bé"],
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Quan sát kích thước",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Quan sát kích thước",
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
    narration_template: "Chúng mình cùng tìm hiểu về Quan sát kích thước nhé",
  },
  ordering: [
    "size_elephant",
    "size_whale",
    "size_truck",
    "size_house",
    "size_ant",
    "size_mouse",
    "size_button",
    "size_cherry",
  ],
};

export const C4_DET_03_SEED: SkillSeed = {
  identity: C4_DET_03_IDENTITY,
  dataset: C4_DET_03_DATASET,
  levels: [
    {
      code: "GL-C4-DET-FIND-0001",
      template: "GT-018",
      band: "4-5",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C4-DET-FIND-0002",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C4-DET-TAP-0005",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
  ],
};
