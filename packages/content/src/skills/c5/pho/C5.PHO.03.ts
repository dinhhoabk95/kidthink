import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_PHO_03_IDENTITY: SkillIdentity = {
  code: "C5.PHO.03",
  strand_code: "C5.PHO",
  competency_code: "C5",
  name: "Tiếng dài – tiếng ngắn",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["listen", "compare"],
  tier: "core",
  prerequisites: ["C5.PHO.01"],
  learning_objectives: [
    {
      code: "LO-C5.PHO.03-01",
      behaviour: "Nhận biết và thực hành Tiếng dài – tiếng ngắn ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.PHO.03-02",
      behaviour: "Vận dụng Tiếng dài – tiếng ngắn trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.PHO.03-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Tiếng dài – tiếng ngắn",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_PHO_03_DATASET: SkillDataset = {
  skill_code: "C5.PHO.03",
  concept_label: "Tiếng dài – tiếng ngắn",
  surface: "game",
  items: [
    {
      id: "pho_ngan_qua",
      label: "tiếng ngắn (quả táo)",
      image: {
        kind: "emoji",
        ref: "🍎",
      },
      category: {
        type: "tiếng ngắn",
        label: "Tiếng ngắn",
      },
      contrast_group: "primary",
      value: 1,
      ordering: 1,
      audio_path: "/audio/vi/c5/pho/tao.mp3",
    },
    {
      id: "pho_ngan_la",
      label: "tiếng ngắn (chiếc lá)",
      image: {
        kind: "emoji",
        ref: "🍃",
      },
      category: {
        type: "tiếng ngắn",
        label: "Tiếng ngắn",
      },
      contrast_group: "primary",
      value: 2,
      ordering: 2,
      audio_path: "/audio/vi/c5/pho/la.mp3",
    },
    {
      id: "pho_ngan_hoa",
      label: "tiếng ngắn (bông hoa)",
      image: {
        kind: "emoji",
        ref: "🌸",
      },
      category: {
        type: "tiếng ngắn",
        label: "Tiếng ngắn",
      },
      contrast_group: "primary",
      value: 3,
      ordering: 3,
      audio_path: "/audio/vi/c5/pho/hoa.mp3",
    },
    {
      id: "pho_dai_dong_ho",
      label: "tiếng dài (đồng hồ reo)",
      image: {
        kind: "emoji",
        ref: "⏰",
      },
      category: {
        type: "tiếng dài",
        label: "Tiếng dài",
      },
      contrast_group: "contrast",
      value: 4,
      ordering: 4,
      audio_path: "/audio/vi/c5/pho/dong_ho_reo.mp3",
    },
    {
      id: "pho_dai_xe_cuu_hoa",
      label: "tiếng dài (xe cứu hoả)",
      image: {
        kind: "emoji",
        ref: "🚒",
      },
      category: {
        type: "tiếng dài",
        label: "Tiếng dài",
      },
      contrast_group: "contrast",
      value: 5,
      ordering: 5,
      audio_path: "/audio/vi/c5/pho/xe_cuu_hoa.mp3",
    },
    {
      id: "pho_dai_cau_vong",
      label: "tiếng dài (cầu vồng đẹp)",
      image: {
        kind: "emoji",
        ref: "🌈",
      },
      category: {
        type: "tiếng dài",
        label: "Tiếng dài",
      },
      contrast_group: "contrast",
      value: 6,
      ordering: 6,
      audio_path: "/audio/vi/c5/pho/cau_vong_dep.mp3",
    },
  ],
  axes: {
    category: {
      values: ["tiếng ngắn", "tiếng dài"],
      ordered: true,
    },
  },
  relations: [
    {
      type: "contrast",
      source_id: "pho_ngan_qua",
      target_id: "pho_dai_dong_ho",
      explanation: "Tiếng ngắn đối lập với tiếng dài",
    },
    {
      type: "contrast",
      source_id: "pho_ngan_la",
      target_id: "pho_dai_xe_cuu_hoa",
      explanation: "Tiếng ngắn đối lập với tiếng dài",
    },
    {
      type: "contrast",
      source_id: "pho_ngan_hoa",
      target_id: "pho_dai_cau_vong",
      explanation: "Tiếng ngắn đối lập với tiếng dài",
    },
    {
      type: "pair",
      source_id: "pho_ngan_qua",
      target_id: "pho_dai_dong_ho",
      explanation: "Cặp so sánh tiếng ngắn và tiếng dài",
    },
    {
      type: "pair",
      source_id: "pho_ngan_la",
      target_id: "pho_dai_xe_cuu_hoa",
      explanation: "Cặp so sánh tiếng ngắn và tiếng dài",
    },
    {
      type: "pair",
      source_id: "pho_ngan_hoa",
      target_id: "pho_dai_cau_vong",
      explanation: "Cặp so sánh tiếng ngắn và tiếng dài",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Tiếng dài – tiếng ngắn",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Tiếng dài – tiếng ngắn",
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
      "Chúng mình cùng tìm hiểu về Tiếng dài – tiếng ngắn nhé",
  },
  ordering: [
    "pho_ngan_qua",
    "pho_ngan_la",
    "pho_ngan_hoa",
    "pho_dai_dong_ho",
    "pho_dai_xe_cuu_hoa",
    "pho_dai_cau_vong",
  ],
};

export const C5_PHO_03_SEED: SkillSeed = {
  identity: C5_PHO_03_IDENTITY,
  dataset: C5_PHO_03_DATASET,
  levels: [
    {
      code: "GL-C5-PHO-TAP-0003",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C5-PHO-TAP-0004",
      template: "GT-001",
      band: "3-4",
      difficulty: 3,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C5-PHO-TCNT-0003",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "job",
      rounds: 3,
    },
  ],
};
