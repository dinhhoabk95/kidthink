import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_ONS_03_IDENTITY: SkillIdentity = {
  code: "C5.ONS.03",
  strand_code: "C5.ONS",
  competency_code: "C5",
  name: "Âm đầu nhóm 2: l · m · n · ng/ngh · nh · p",
  age_min: 5,
  age_max: 6,
  difficulty: 4,
  thinking_processes: ["listen", "match"],
  tier: "advanced",
  prerequisites: ["C5.ONS.02"],
  learning_objectives: [
    {
      code: "LO-C5.ONS.03-01",
      behaviour:
        "Nhận biết và thực hành Âm đầu nhóm 2: l · m · n · ng/ngh · nh · p ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.ONS.03-02",
      behaviour:
        "Phân biệt và so sánh Âm đầu nhóm 2: l · m · n · ng/ngh · nh · p trong các ngữ cảnh khác nhau",
      observable_criteria:
        "Trẻ phân biệt đúng giữa các phương án gây nhiễu trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.ONS.03-03",
      behaviour:
        "Vận dụng và ghi nhớ Âm đầu nhóm 2: l · m · n · ng/ngh · nh · p",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_ONS_03_DATASET: SkillDataset = {
  skill_code: "C5.ONS.03",
  concept_label: "Âm đầu nhóm 2: l · m · n · ng/ngh · nh · p",
  surface: "game",
  items: [
    {
      id: "ons_l",
      label: "âm đầu l (chiếc lá)",
      glyph: "l",
      image: {
        kind: "emoji",
        ref: "🍃",
      },
      category: {
        type: "âm đầu quen thuộc",
        label: "Âm quen thuộc",
      },
      contrast_group: "primary",
      value: 1,
      ordering: 1,
      audio_path: "/audio/vi/c5/ons/am_l.mp3",
    },
    {
      id: "ons_m",
      label: "âm đầu m (con mèo)",
      glyph: "m",
      image: {
        kind: "emoji",
        ref: "🐱",
      },
      category: {
        type: "âm đầu quen thuộc",
        label: "Âm quen thuộc",
      },
      contrast_group: "primary",
      value: 2,
      ordering: 2,
      audio_path: "/audio/vi/c5/ons/am_m.mp3",
    },
    {
      id: "ons_n",
      label: "âm đầu n (cây nấm)",
      glyph: "n",
      image: {
        kind: "emoji",
        ref: "🍄",
      },
      category: {
        type: "âm đầu quen thuộc",
        label: "Âm quen thuộc",
      },
      contrast_group: "primary",
      value: 3,
      ordering: 3,
      audio_path: "/audio/vi/c5/ons/am_n.mp3",
    },
    {
      id: "ons_ng_ngh",
      label: "âm đầu ng ngh (bắp ngô)",
      glyph: "ng/ngh",
      image: {
        kind: "emoji",
        ref: "🌽",
      },
      category: {
        type: "âm đầu mở rộng",
        label: "Âm mở rộng",
      },
      contrast_group: "contrast",
      value: 4,
      ordering: 4,
      audio_path: "/audio/vi/c5/ons/am_ng.mp3",
    },
    {
      id: "ons_nh",
      label: "âm đầu nh (ngôi nhà)",
      glyph: "nh",
      image: {
        kind: "emoji",
        ref: "🏠",
      },
      category: {
        type: "âm đầu mở rộng",
        label: "Âm mở rộng",
      },
      contrast_group: "contrast",
      value: 5,
      ordering: 5,
      audio_path: "/audio/vi/c5/ons/am_nh.mp3",
    },
    {
      id: "ons_p",
      label: "âm đầu p (cục pin)",
      glyph: "p",
      image: {
        kind: "emoji",
        ref: "🔋",
      },
      category: {
        type: "âm đầu mở rộng",
        label: "Âm mở rộng",
      },
      contrast_group: "contrast",
      value: 6,
      ordering: 6,
      audio_path: "/audio/vi/c5/ons/am_p.mp3",
    },
  ],
  axes: {
    category: {
      values: ["âm đầu quen thuộc", "âm đầu mở rộng"],
      ordered: true,
    },
  },
  relations: [
    {
      type: "pair",
      source_id: "ons_l",
      target_id: "ons_ng_ngh",
      explanation: "Cặp âm đầu tương ứng trong nhóm hai",
    },
    {
      type: "pair",
      source_id: "ons_m",
      target_id: "ons_nh",
      explanation: "Cặp âm mũi m và nh tương ứng",
    },
    {
      type: "pair",
      source_id: "ons_n",
      target_id: "ons_p",
      explanation: "Cặp âm n và p tương ứng",
    },
    {
      type: "contrast",
      source_id: "ons_l",
      target_id: "ons_ng_ngh",
      explanation: "Âm đầu quen thuộc đối lập với âm đầu mở rộng",
    },
    {
      type: "contrast",
      source_id: "ons_m",
      target_id: "ons_nh",
      explanation: "Âm đầu quen thuộc đối lập với âm đầu mở rộng",
    },
    {
      type: "contrast",
      source_id: "ons_n",
      target_id: "ons_p",
      explanation: "Âm đầu quen thuộc đối lập với âm đầu mở rộng",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description:
        "Làm quen cơ bản với Âm đầu nhóm 2: l · m · n · ng/ngh · nh · p",
    },
    {
      rung: 2,
      dimension: "range",
      description:
        "Nhận biết và chọn đúng Âm đầu nhóm 2: l · m · n · ng/ngh · nh · p",
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
      "Chúng mình cùng tìm hiểu về Âm đầu nhóm 2: l · m · n · ng/ngh · nh · p nhé",
  },
  ordering: ["ons_l", "ons_m", "ons_n", "ons_ng_ngh", "ons_nh", "ons_p"],
};

export const C5_ONS_03_SEED: SkillSeed = {
  identity: C5_ONS_03_IDENTITY,
  dataset: C5_ONS_03_DATASET,
  levels: [
    {
      code: "GL-C5-ONS-INTRO-0003",
      template: "GT-000",
      band: "5-6",
      difficulty: 1,
      theme: "home",
      rounds: 1,
      sequence_no: 1,
      skill_codes: ["C5.ONS.03"],
    },
    {
      code: "GL-C5-ONS-TAP-0011",
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-ONS-TAP-0013",
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-ONS-MULTI-0011",
      template: "GT-002",
      band: "5-6",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
  ],
};
