import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_WRD_06_IDENTITY: SkillIdentity = {
  code: "C5.WRD.06",
  strand_code: "C5.WRD",
  competency_code: "C5",
  name: "Đọc câu ngắn ba tiếng",
  age_min: 5,
  age_max: 6,
  difficulty: 5,
  thinking_processes: ["solve", "infer"],
  tier: "advanced",
  prerequisites: ["C5.WRD.05", "C5.PRN.04"],
  learning_objectives: [
    {
      code: "LO-C5.WRD.06-01",
      behaviour: "Nhận biết và thực hành Đọc câu ngắn ba tiếng ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.WRD.06-02",
      behaviour: "Vận dụng Đọc câu ngắn ba tiếng trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.WRD.06-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Đọc câu ngắn ba tiếng",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_WRD_06_DATASET: SkillDataset = {
  skill_code: "C5.WRD.06",
  concept_label: "Đọc câu ngắn ba tiếng",
  surface: "game",
  items: [
    {
      id: "wrd_be_di_hoc",
      label: "bé đi học",
      glyph: "bé đi học",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🎒",
      },
      category: {
        type: "câu về bé",
      },
      contrast_group: "primary",
    },
    {
      id: "wrd_be_tap_ve",
      label: "bé tập vẽ",
      glyph: "bé tập vẽ",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🎨",
      },
      category: {
        type: "câu về bé",
      },
      contrast_group: "primary",
    },
    {
      id: "wrd_be_ca_hat",
      label: "bé ca hát",
      glyph: "bé ca hát",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🎵",
      },
      category: {
        type: "câu về bé",
      },
      contrast_group: "primary",
    },
    {
      id: "wrd_be_da_bong",
      label: "bé đá bóng",
      glyph: "bé đá bóng",
      value: 4,
      image: {
        kind: "emoji",
        ref: "⚽",
      },
      category: {
        type: "câu về bé",
      },
      contrast_group: "primary",
    },
    {
      id: "wrd_me_yeu_be",
      label: "mẹ yêu bé",
      glyph: "mẹ yêu bé",
      value: 5,
      image: {
        kind: "emoji",
        ref: "❤️",
      },
      category: {
        type: "câu gia đình",
      },
      contrast_group: "contrast",
    },
    {
      id: "wrd_ba_yeu_be",
      label: "ba yêu bé",
      glyph: "ba yêu bé",
      value: 6,
      image: {
        kind: "emoji",
        ref: "👨‍👩‍👧",
      },
      category: {
        type: "câu gia đình",
      },
      contrast_group: "contrast",
    },
    {
      id: "wrd_be_khoe_manh",
      label: "bé chăm ngoan",
      glyph: "bé chăm ngoan",
      value: 7,
      image: {
        kind: "emoji",
        ref: "⭐",
      },
      category: {
        type: "câu gia đình",
      },
      contrast_group: "contrast",
    },
    {
      id: "wrd_be_chao_co",
      label: "bé chào cô",
      glyph: "bé chào cô",
      value: 8,
      image: {
        kind: "emoji",
        ref: "👩‍🏫",
      },
      category: {
        type: "câu gia đình",
      },
      contrast_group: "contrast",
    },
  ],
  axes: {
    category: {
      values: ["câu về bé", "câu gia đình"],
      ordered: true,
    },
  },
  relations: [
    {
      type: "sequence",
      source_id: "wrd_be_di_hoc",
      target_id: "wrd_be_chao_co",
    },
    { type: "pair", source_id: "wrd_be_di_hoc", target_id: "wrd_be_tap_ve" },
    { type: "pair", source_id: "wrd_be_ca_hat", target_id: "wrd_be_da_bong" },
    { type: "pair", source_id: "wrd_me_yeu_be", target_id: "wrd_ba_yeu_be" },
    {
      type: "pair",
      source_id: "wrd_be_khoe_manh",
      target_id: "wrd_be_chao_co",
    },
    {
      type: "contrast",
      source_id: "wrd_be_di_hoc",
      target_id: "wrd_me_yeu_be",
    },
    {
      type: "contrast",
      source_id: "wrd_be_tap_ve",
      target_id: "wrd_ba_yeu_be",
    },
    {
      type: "contrast",
      source_id: "wrd_be_ca_hat",
      target_id: "wrd_be_khoe_manh",
    },
    {
      type: "contrast",
      source_id: "wrd_be_da_bong",
      target_id: "wrd_be_chao_co",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Đọc câu ngắn ba tiếng",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Đọc câu ngắn ba tiếng",
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
    narration_template: "Chúng mình cùng tìm hiểu về Đọc câu ngắn ba tiếng nhé",
  },
  ordering: [
    "wrd_be_di_hoc",
    "wrd_be_tap_ve",
    "wrd_be_ca_hat",
    "wrd_be_da_bong",
    "wrd_me_yeu_be",
    "wrd_ba_yeu_be",
    "wrd_be_khoe_manh",
    "wrd_be_chao_co",
  ],
};

export const C5_WRD_06_SEED: SkillSeed = {
  identity: C5_WRD_06_IDENTITY,
  dataset: C5_WRD_06_DATASET,
  levels: [
    {
      code: "GL-C5-WRD-PAIR-0003",
      template: "GT-004",
      band: "5-6",
      difficulty: 4,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C5-WRD-PAIR-0004",
      template: "GT-004",
      band: "5-6",
      difficulty: 5,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C5-WRD-SHAD-0001",
      template: "GT-007",
      band: "5-6",
      difficulty: 4,
      theme: "family",
      rounds: 3,
    },
  ],
};
