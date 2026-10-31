import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_EXP_05_IDENTITY: SkillIdentity = {
  code: "C4.EXP.05",
  strand_code: "C4.EXP",
  competency_code: "C4",
  name: "So kết quả với dự đoán",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["verify", "compare"],
  tier: "advanced",
  prerequisites: ["C4.EXP.02"],
  learning_objectives: [
    {
      code: "LO-C4.EXP.05-01",
      behaviour: "Nhận biết và thực hành So kết quả với dự đoán ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.EXP.05-02",
      behaviour: "Vận dụng So kết quả với dự đoán trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.EXP.05-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới So kết quả với dự đoán",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_EXP_05_DATASET: SkillDataset = {
  skill_code: "C4.EXP.05",
  concept_label: "So kết quả với dự đoán",
  surface: "game",
  items: [
    {
      id: "exp_paint",
      label: "pha màu vẽ",
      image: {
        kind: "emoji",
        ref: "🎨",
      },
      category: {
        type: "thí nghiệm làm",
      },
      contrast_group: "action",
      value: 1,
      ordering: 1,
      audio_path: "/audio/vi/c4/exp_paint.mp3",
    },
    {
      id: "exp_bean",
      label: "gieo hạt đậu",
      image: {
        kind: "emoji",
        ref: "🫘",
      },
      category: {
        type: "thí nghiệm làm",
      },
      contrast_group: "action",
      value: 2,
      ordering: 2,
      audio_path: "/audio/vi/c4/exp_bean.mp3",
    },
    {
      id: "exp_ice",
      label: "đá dưới nắng",
      image: {
        kind: "emoji",
        ref: "🧊",
      },
      category: {
        type: "thí nghiệm làm",
      },
      contrast_group: "action",
      value: 3,
      ordering: 3,
      audio_path: "/audio/vi/c4/exp_ice.mp3",
    },
    {
      id: "exp_soap",
      label: "thổi xà phòng",
      image: {
        kind: "emoji",
        ref: "🧼",
      },
      category: {
        type: "thí nghiệm làm",
      },
      contrast_group: "action",
      value: 4,
      ordering: 4,
      audio_path: "/audio/vi/c4/exp_soap.mp3",
    },
    {
      id: "res_green",
      label: "ra màu xanh",
      image: {
        kind: "emoji",
        ref: "🟢",
      },
      category: {
        type: "kết quả thấy",
      },
      contrast_group: "result",
      value: 1,
      ordering: 5,
      audio_path: "/audio/vi/c4/res_green.mp3",
    },
    {
      id: "res_sprout",
      label: "mầm non mọc",
      image: {
        kind: "emoji",
        ref: "🌱",
      },
      category: {
        type: "kết quả thấy",
      },
      contrast_group: "result",
      value: 2,
      ordering: 6,
      audio_path: "/audio/vi/c4/res_sprout.mp3",
    },
    {
      id: "res_water",
      label: "giọt nước tan",
      image: {
        kind: "emoji",
        ref: "💧",
      },
      category: {
        type: "kết quả thấy",
      },
      contrast_group: "result",
      value: 3,
      ordering: 7,
      audio_path: "/audio/vi/c4/res_water.mp3",
    },
    {
      id: "res_bubble",
      label: "bong bóng tròn",
      image: {
        kind: "emoji",
        ref: "🫧",
      },
      category: {
        type: "kết quả thấy",
      },
      contrast_group: "result",
      value: 4,
      ordering: 8,
      audio_path: "/audio/vi/c4/res_bubble.mp3",
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "exp_paint",
      target_id: "res_green",
    },
    {
      type: "pair",
      source_id: "exp_bean",
      target_id: "res_sprout",
    },
    {
      type: "pair",
      source_id: "exp_ice",
      target_id: "res_water",
    },
    {
      type: "pair",
      source_id: "exp_soap",
      target_id: "res_bubble",
    },
  ],
  axes: {
    predict_match: {
      values: ["thí nghiệm làm", "kết quả thấy"],
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với So kết quả với dự đoán",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng So kết quả với dự đoán",
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
      "Chúng mình cùng tìm hiểu về So kết quả với dự đoán nhé",
  },
  ordering: [
    "exp_paint",
    "exp_bean",
    "exp_ice",
    "exp_soap",
    "res_green",
    "res_sprout",
    "res_water",
    "res_bubble",
  ],
};

export const C4_EXP_05_SEED: SkillSeed = {
  identity: C4_EXP_05_IDENTITY,
  dataset: C4_EXP_05_DATASET,
  levels: [
    {
      template: "GT-000",
      band: "5-6",
      difficulty: 1,
      theme: "school",
    },
    {
      template: "GT-001",
      band: "5-6",
      difficulty: 1,
      theme: "school",
    },
    {
      template: "GT-001",
      band: "5-6",
      difficulty: 2,
      theme: "home",
    },
    {
      template: "GT-002",
      band: "5-6",
      difficulty: 1,
      theme: "nature",
    },
    {
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      theme: "farm",
    },
    {
      template: "GT-002",
      band: "5-6",
      difficulty: 2,
      theme: "food",
    },
    {
      template: "GT-030",
      band: "5-6",
      difficulty: 2,
      theme: "school",
    },
  ],
};
