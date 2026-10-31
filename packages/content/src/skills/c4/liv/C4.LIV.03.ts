import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_LIV_03_IDENTITY: SkillIdentity = {
  code: "C4.LIV.03",
  strand_code: "C4.LIV",
  competency_code: "C4",
  name: "Sinh vật sống và đồ vật tĩnh",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["sort", "infer"],
  tier: "core",
  prerequisites: ["C3.CLS.04"],
  learning_objectives: [
    {
      code: "LO-C4.LIV.03-01",
      behaviour: "Nhận biết và thực hành Sống – không sống ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.LIV.03-02",
      behaviour: "Vận dụng Sống – không sống trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.LIV.03-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Sống – không sống",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_LIV_03_DATASET: SkillDataset = {
  skill_code: "C4.LIV.03",
  concept_label: "Sinh vật sống và đồ vật tĩnh",
  surface: "game",
  items: [
    {
      id: "liv_puppy",
      label: "chú cún con",
      image: {
        kind: "emoji",
        ref: "🐶",
      },
      category: {
        type: "sinh vật sống",
      },
      contrast_group: "living",
      value: 1,
      ordering: 1,
      audio_path: "/audio/vi/c4/liv_puppy.mp3",
    },
    {
      id: "liv_tree",
      label: "cây xanh mát",
      image: {
        kind: "emoji",
        ref: "🌳",
      },
      category: {
        type: "sinh vật sống",
      },
      contrast_group: "living",
      value: 2,
      ordering: 2,
      audio_path: "/audio/vi/c4/liv_tree.mp3",
    },
    {
      id: "liv_bird",
      label: "chú chim sẻ",
      image: {
        kind: "emoji",
        ref: "🐦",
      },
      category: {
        type: "sinh vật sống",
      },
      contrast_group: "living",
      value: 3,
      ordering: 3,
      audio_path: "/audio/vi/c4/liv_bird.mp3",
    },
    {
      id: "liv_flower",
      label: "bông hoa hồng",
      image: {
        kind: "emoji",
        ref: "🌹",
      },
      category: {
        type: "sinh vật sống",
      },
      contrast_group: "living",
      value: 4,
      ordering: 4,
      audio_path: "/audio/vi/c4/liv_flower.mp3",
    },
    {
      id: "non_rock",
      label: "hòn đá tảng",
      image: {
        kind: "emoji",
        ref: "🪨",
      },
      category: {
        type: "đồ vật tĩnh",
      },
      contrast_group: "nonliving",
      value: 1,
      ordering: 5,
      audio_path: "/audio/vi/c4/non_rock.mp3",
    },
    {
      id: "non_chair",
      label: "chiếc ghế gỗ",
      image: {
        kind: "emoji",
        ref: "🪑",
      },
      category: {
        type: "đồ vật tĩnh",
      },
      contrast_group: "nonliving",
      value: 2,
      ordering: 6,
      audio_path: "/audio/vi/c4/non_chair.mp3",
    },
    {
      id: "non_car",
      label: "chiếc ô tô",
      image: {
        kind: "emoji",
        ref: "🚗",
      },
      category: {
        type: "đồ vật tĩnh",
      },
      contrast_group: "nonliving",
      value: 3,
      ordering: 7,
      audio_path: "/audio/vi/c4/non_car.mp3",
    },
    {
      id: "non_robot",
      label: "robot đồ chơi",
      image: {
        kind: "emoji",
        ref: "🤖",
      },
      category: {
        type: "đồ vật tĩnh",
      },
      contrast_group: "nonliving",
      value: 4,
      ordering: 8,
      audio_path: "/audio/vi/c4/non_robot.mp3",
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "liv_puppy",
      target_id: "non_robot",
    },
    {
      type: "contrast",
      source_id: "liv_tree",
      target_id: "non_chair",
    },
    {
      type: "contrast",
      source_id: "liv_bird",
      target_id: "non_car",
    },
    {
      type: "contrast",
      source_id: "liv_flower",
      target_id: "non_rock",
    },
  ],
  axes: {
    living_status: {
      values: ["sinh vật sống", "đồ vật tĩnh"],
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Sinh vật sống và đồ vật tĩnh",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Sinh vật sống và đồ vật tĩnh",
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
      "Chúng mình cùng tìm hiểu về Sinh vật sống và đồ vật tĩnh nhé",
  },
  ordering: [
    "liv_puppy",
    "liv_tree",
    "liv_bird",
    "liv_flower",
    "non_rock",
    "non_chair",
    "non_car",
    "non_robot",
  ],
};

export const C4_LIV_03_SEED: SkillSeed = {
  identity: C4_LIV_03_IDENTITY,
  dataset: C4_LIV_03_DATASET,
  levels: [
    {
      code: "GL-C4-LIV-TCNT-0001",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C4-LIV-TCNT-0002",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C4-LIV-TCMP-0005",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
  ],
};
