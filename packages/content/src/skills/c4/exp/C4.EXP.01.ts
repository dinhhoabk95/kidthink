import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_EXP_01_IDENTITY: SkillIdentity = {
  code: "C4.EXP.01",
  strand_code: "C4.EXP",
  competency_code: "C4",
  name: "Đoán trước khi làm",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["predict"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C4.EXP.01-01",
      behaviour: "Nhận biết và thực hành Đoán trước khi làm ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.EXP.01-02",
      behaviour: "Vận dụng Đoán trước khi làm trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.EXP.01-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Đoán trước khi làm",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_EXP_01_DATASET: SkillDataset = {
  skill_code: "C4.EXP.01",
  concept_label: "Đoán trước khi làm",
  surface: "game",
  items: [
    {
      id: "exp_ice",
      label: "viên đá lạnh",
      image: {
        kind: "emoji",
        ref: "🧊",
      },
      category: {
        type: "vật thử nghiệm",
      },
      contrast_group: "setup",
      value: 1,
      ordering: 1,
      audio_path: "/audio/vi/c4/exp_ice.mp3",
    },
    {
      id: "exp_seed",
      label: "hạt mầm nhỏ",
      image: {
        kind: "emoji",
        ref: "🌱",
      },
      category: {
        type: "vật thử nghiệm",
      },
      contrast_group: "setup",
      value: 2,
      ordering: 2,
      audio_path: "/audio/vi/c4/exp_seed.mp3",
    },
    {
      id: "exp_paper",
      label: "tờ giấy khô",
      image: {
        kind: "emoji",
        ref: "📄",
      },
      category: {
        type: "vật thử nghiệm",
      },
      contrast_group: "setup",
      value: 3,
      ordering: 3,
      audio_path: "/audio/vi/c4/exp_paper.mp3",
    },
    {
      id: "exp_soap",
      label: "bánh xà phòng",
      image: {
        kind: "emoji",
        ref: "🧼",
      },
      category: {
        type: "vật thử nghiệm",
      },
      contrast_group: "setup",
      value: 4,
      ordering: 4,
      audio_path: "/audio/vi/c4/exp_soap.mp3",
    },
    {
      id: "exp_water",
      label: "giọt nước tan",
      image: {
        kind: "emoji",
        ref: "💧",
      },
      category: {
        type: "kết quả đoán",
      },
      contrast_group: "predict",
      value: 1,
      ordering: 5,
      audio_path: "/audio/vi/c4/exp_water.mp3",
    },
    {
      id: "exp_sprout",
      label: "chồi non xanh",
      image: {
        kind: "emoji",
        ref: "🌿",
      },
      category: {
        type: "kết quả đoán",
      },
      contrast_group: "predict",
      value: 2,
      ordering: 6,
      audio_path: "/audio/vi/c4/exp_sprout.mp3",
    },
    {
      id: "exp_wet",
      label: "vết nước thấm",
      image: {
        kind: "emoji",
        ref: "💦",
      },
      category: {
        type: "kết quả đoán",
      },
      contrast_group: "predict",
      value: 3,
      ordering: 7,
      audio_path: "/audio/vi/c4/exp_wet.mp3",
    },
    {
      id: "exp_bubble",
      label: "bong bóng bay",
      image: {
        kind: "emoji",
        ref: "🫧",
      },
      category: {
        type: "kết quả đoán",
      },
      contrast_group: "predict",
      value: 4,
      ordering: 8,
      audio_path: "/audio/vi/c4/exp_bubble.mp3",
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "exp_ice",
      target_id: "exp_water",
    },
    {
      type: "pair",
      source_id: "exp_seed",
      target_id: "exp_sprout",
    },
    {
      type: "pair",
      source_id: "exp_paper",
      target_id: "exp_wet",
    },
    {
      type: "pair",
      source_id: "exp_soap",
      target_id: "exp_bubble",
    },
  ],
  axes: {
    experiment_pair: {
      values: ["vật thử nghiệm", "kết quả đoán"],
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Đoán trước khi làm",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Đoán trước khi làm",
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
    narration_template: "Chúng mình cùng tìm hiểu về Đoán trước khi làm nhé",
  },
  ordering: [
    "exp_ice",
    "exp_seed",
    "exp_paper",
    "exp_soap",
    "exp_water",
    "exp_sprout",
    "exp_wet",
    "exp_bubble",
  ],
};

export const C4_EXP_01_SEED: SkillSeed = {
  identity: C4_EXP_01_IDENTITY,
  dataset: C4_EXP_01_DATASET,
  levels: [
    {
      template: "GT-000",
      band: "4-5",
      difficulty: 1,
      theme: "school",
    },
    {
      code: "GL-C4-EXP-TFRA-0001",
      template: "GT-019",
      band: "4-5",
      difficulty: 1,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C4-EXP-TFRA-0002",
      template: "GT-019",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C4-EXP-TANG-0001",
      template: "GT-021",
      band: "4-5",
      difficulty: 1,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C4-EXP-TANG-0002",
      template: "GT-021",
      band: "4-5",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C4-EXP-MTRX-0001",
      template: "GT-023",
      band: "4-5",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C4-EXP-MTRX-0002",
      template: "GT-023",
      band: "4-5",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
    },
  ],
};
