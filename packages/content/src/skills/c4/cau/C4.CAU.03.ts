import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_CAU_03_IDENTITY: SkillIdentity = {
  code: "C4.CAU.03",
  strand_code: "C4.CAU",
  competency_code: "C4",
  name: "Chọn nguyên nhân đúng",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["deduce", "infer"],
  tier: "advanced",
  prerequisites: ["C4.CAU.02", "C3.INF.03"],
  learning_objectives: [
    {
      code: "LO-C4.CAU.03-01",
      behaviour: "Nhận biết và thực hành Chọn nguyên nhân đúng ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.CAU.03-02",
      behaviour: "Vận dụng Chọn nguyên nhân đúng trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.CAU.03-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Chọn nguyên nhân đúng",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_CAU_03_DATASET: SkillDataset = {
  skill_code: "C4.CAU.03",
  concept_label: "Chọn nguyên nhân đúng",
  surface: "game",
  items: [
    {
      id: "right_water",
      label: "bình tưới nước",
      image: {
        kind: "emoji",
        ref: "🚿",
      },
      category: {
        type: "nguyên nhân đúng",
      },
      contrast_group: "cause",
      value: 1,
      ordering: 1,
      audio_path: "/audio/vi/c4/right_water.mp3",
    },
    {
      id: "right_sun",
      label: "nắng mặt trời",
      image: {
        kind: "emoji",
        ref: "☀️",
      },
      category: {
        type: "nguyên nhân đúng",
      },
      contrast_group: "cause",
      value: 2,
      ordering: 2,
      audio_path: "/audio/vi/c4/right_sun.mp3",
    },
    {
      id: "right_switch",
      label: "công tắc điện",
      image: {
        kind: "emoji",
        ref: "🔘",
      },
      category: {
        type: "nguyên nhân đúng",
      },
      contrast_group: "cause",
      value: 3,
      ordering: 3,
      audio_path: "/audio/vi/c4/right_switch.mp3",
    },
    {
      id: "right_freeze",
      label: "ngăn đá lạnh",
      image: {
        kind: "emoji",
        ref: "❄️",
      },
      category: {
        type: "nguyên nhân đúng",
      },
      contrast_group: "cause",
      value: 4,
      ordering: 4,
      audio_path: "/audio/vi/c4/right_freeze.mp3",
    },
    {
      id: "eff_tree_grow",
      label: "cây xanh tốt",
      image: {
        kind: "emoji",
        ref: "🌳",
      },
      category: {
        type: "kết quả đúng",
      },
      contrast_group: "effect",
      value: 1,
      ordering: 5,
      audio_path: "/audio/vi/c4/eff_tree_grow.mp3",
    },
    {
      id: "eff_cloth_dry",
      label: "quần áo khô",
      image: {
        kind: "emoji",
        ref: "👕",
      },
      category: {
        type: "kết quả đúng",
      },
      contrast_group: "effect",
      value: 2,
      ordering: 6,
      audio_path: "/audio/vi/c4/eff_cloth_dry.mp3",
    },
    {
      id: "eff_lamp_on",
      label: "bóng đèn sáng",
      image: {
        kind: "emoji",
        ref: "💡",
      },
      category: {
        type: "kết quả đúng",
      },
      contrast_group: "effect",
      value: 3,
      ordering: 7,
      audio_path: "/audio/vi/c4/eff_lamp_on.mp3",
    },
    {
      id: "eff_ice_made",
      label: "viên đá cứng",
      image: {
        kind: "emoji",
        ref: "🧊",
      },
      category: {
        type: "kết quả đúng",
      },
      contrast_group: "effect",
      value: 4,
      ordering: 8,
      audio_path: "/audio/vi/c4/eff_ice_made.mp3",
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "right_water",
      target_id: "eff_tree_grow",
    },
    {
      type: "pair",
      source_id: "right_sun",
      target_id: "eff_cloth_dry",
    },
    {
      type: "pair",
      source_id: "right_switch",
      target_id: "eff_lamp_on",
    },
    {
      type: "pair",
      source_id: "right_freeze",
      target_id: "eff_ice_made",
    },
  ],
  axes: {
    cause_effect: {
      values: ["nguyên nhân đúng", "kết quả đúng"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Chọn nguyên nhân đúng",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Chọn nguyên nhân đúng",
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
    narration_template: "Chúng mình cùng tìm hiểu về Chọn nguyên nhân đúng nhé",
  },
  ordering: [
    "right_water",
    "right_sun",
    "right_switch",
    "right_freeze",
    "eff_tree_grow",
    "eff_cloth_dry",
    "eff_lamp_on",
    "eff_ice_made",
  ],
};

export const C4_CAU_03_SEED: SkillSeed = {
  identity: C4_CAU_03_IDENTITY,
  dataset: C4_CAU_03_DATASET,
  levels: [
    {
      template: "GT-000",
      band: "5-6",
      difficulty: 1,
      theme: "school",
    },
    {
      code: "GL-C4-CAU-SORT-0001",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C4-CAU-SHAD-0005",
      template: "GT-007",
      band: "4-5",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      template: "GT-004",
      band: "5-6",
      difficulty: 1,
      theme: "school",
    },
    {
      template: "GT-004",
      band: "5-6",
      difficulty: 2,
      theme: "home",
    },
    {
      template: "GT-030",
      band: "5-6",
      difficulty: 2,
      theme: "school",
    },
    {
      template: "GT-032",
      band: "5-6",
      difficulty: 2,
      theme: "school",
    },
  ],
};
