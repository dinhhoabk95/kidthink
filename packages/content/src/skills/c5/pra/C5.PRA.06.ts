import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_PRA_06_IDENTITY: SkillIdentity = {
  code: "C5.PRA.06",
  strand_code: "C5.PRA",
  competency_code: "C5",
  name: "Nói ý kiến kèm lý do",
  age_min: 5,
  age_max: 6,
  difficulty: 5,
  thinking_processes: ["describe", "deduce"],
  tier: "advanced",
  prerequisites: ["C5.DES.04"],
  learning_objectives: [
    {
      code: "LO-C5.PRA.06-01",
      behaviour: "Nhận biết và thực hành Nói ý kiến kèm lý do ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.PRA.06-02",
      behaviour: "Vận dụng Nói ý kiến kèm lý do trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.PRA.06-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Nói ý kiến kèm lý do",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_PRA_06_DATASET: SkillDataset = {
  skill_code: "C5.PRA.06",
  concept_label: "Nói ý kiến kèm lý do",
  surface: "game",
  items: [
    {
      id: "pra_thich_da_bong",
      label: "thích đá bóng vì vui",
      image: {
        kind: "emoji",
        ref: "⚽",
      },
      category: {
        type: "môn thể thao",
        label: "Môn thể thao",
      },
      contrast_group: "primary",
      value: 1,
      ordering: 1,
      audio_path: "/audio/vi/c5/pra/thich_da_bong.mp3",
    },
    {
      id: "pra_thich_boi_loi",
      label: "thích bơi lội vì mát",
      image: {
        kind: "emoji",
        ref: "🏊",
      },
      category: {
        type: "môn thể thao",
        label: "Môn thể thao",
      },
      contrast_group: "primary",
      value: 2,
      ordering: 2,
      audio_path: "/audio/vi/c5/pra/thich_boi_loi.mp3",
    },
    {
      id: "pra_thich_chay_nhanh",
      label: "thích chạy bộ vì khoẻ",
      image: {
        kind: "emoji",
        ref: "🏃",
      },
      category: {
        type: "môn thể thao",
        label: "Môn thể thao",
      },
      contrast_group: "primary",
      value: 3,
      ordering: 3,
      audio_path: "/audio/vi/c5/pra/thich_chay_nhanh.mp3",
    },
    {
      id: "pra_thich_ve_tranh",
      label: "thích vẽ tranh vì đẹp",
      image: {
        kind: "emoji",
        ref: "🎨",
      },
      category: {
        type: "môn nghệ thuật",
        label: "Môn nghệ thuật",
      },
      contrast_group: "contrast",
      value: 4,
      ordering: 4,
      audio_path: "/audio/vi/c5/pra/thich_ve_tranh.mp3",
    },
    {
      id: "pra_thich_doc_sach",
      label: "thích đọc sách vì hay",
      image: {
        kind: "emoji",
        ref: "📖",
      },
      category: {
        type: "môn nghệ thuật",
        label: "Môn nghệ thuật",
      },
      contrast_group: "contrast",
      value: 5,
      ordering: 5,
      audio_path: "/audio/vi/c5/pra/thich_doc_sach.mp3",
    },
    {
      id: "pra_thich_nghe_nhac",
      label: "thích ca hát vì vui",
      image: {
        kind: "emoji",
        ref: "🎵",
      },
      category: {
        type: "môn nghệ thuật",
        label: "Môn nghệ thuật",
      },
      contrast_group: "contrast",
      value: 6,
      ordering: 6,
      audio_path: "/audio/vi/c5/pra/thich_nghe_nhac.mp3",
    },
  ],
  axes: {
    category: {
      values: ["môn thể thao", "môn nghệ thuật"],
      ordered: true,
    },
  },
  relations: [
    {
      type: "contrast",
      source_id: "pra_thich_da_bong",
      target_id: "pra_thich_ve_tranh",
      explanation: "Môn thể thao đối lập với môn nghệ thuật",
    },
    {
      type: "contrast",
      source_id: "pra_thich_boi_loi",
      target_id: "pra_thich_doc_sach",
      explanation: "Môn thể thao đối lập với môn nghệ thuật",
    },
    {
      type: "contrast",
      source_id: "pra_thich_chay_nhanh",
      target_id: "pra_thich_nghe_nhac",
      explanation: "Môn thể thao đối lập với môn nghệ thuật",
    },
    {
      type: "pair",
      source_id: "pra_thich_da_bong",
      target_id: "pra_thich_ve_tranh",
      explanation: "Cặp sở thích thể thao và nghệ thuật tương ứng",
    },
    {
      type: "pair",
      source_id: "pra_thich_boi_loi",
      target_id: "pra_thich_doc_sach",
      explanation: "Cặp sở thích thể thao và nghệ thuật tương ứng",
    },
    {
      type: "pair",
      source_id: "pra_thich_chay_nhanh",
      target_id: "pra_thich_nghe_nhac",
      explanation: "Cặp sở thích thể thao và nghệ thuật tương ứng",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Nói ý kiến kèm lý do",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nói ý kiến kèm lý do",
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
    narration_template: "Chúng mình cùng tìm hiểu về Nói ý kiến kèm lý do nhé",
  },
  ordering: [
    "pra_thich_da_bong",
    "pra_thich_boi_loi",
    "pra_thich_chay_nhanh",
    "pra_thich_ve_tranh",
    "pra_thich_doc_sach",
    "pra_thich_nghe_nhac",
  ],
};

export const C5_PRA_06_SEED: SkillSeed = {
  identity: C5_PRA_06_IDENTITY,
  dataset: C5_PRA_06_DATASET,
  levels: [
    {
      code: "GL-C5-PRA-TAP-0006",
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C5-PRA-TAP-0007",
      template: "GT-001",
      band: "5-6",
      difficulty: 5,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C5-PRA-TCNT-0006",
      template: "GT-002",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
  ],
};
