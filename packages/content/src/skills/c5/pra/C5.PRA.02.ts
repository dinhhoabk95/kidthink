import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_PRA_02_IDENTITY: SkillIdentity = {
  code: "C5.PRA.02",
  strand_code: "C5.PRA",
  competency_code: "C5",
  name: "Chờ đến lượt nói",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["listen", "inhibit"],
  tier: "core",
  prerequisites: ["C5.LIS.01"],
  learning_objectives: [
    {
      code: "LO-C5.PRA.02-01",
      behaviour: "Nhận biết và thực hành Chờ đến lượt nói ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.PRA.02-02",
      behaviour: "Vận dụng Chờ đến lượt nói trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.PRA.02-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Chờ đến lượt nói",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_PRA_02_DATASET: SkillDataset = {
  skill_code: "C5.PRA.02",
  concept_label: "Chờ đến lượt nói",
  surface: "game",
  items: [
    {
      id: "pra_gio_tay_phat_bieu",
      label: "giơ tay xin nói",
      image: {
        kind: "emoji",
        ref: "🙋",
      },
      category: {
        type: "nói đúng lúc",
        label: "Nói đúng lúc",
      },
      contrast_group: "primary",
      value: 1,
      ordering: 1,
      audio_path: "/audio/vi/c5/pra/gio_tay_phat_bieu.mp3",
    },
    {
      id: "pra_lang_nghe_ban",
      label: "lắng nghe bạn kể",
      image: {
        kind: "emoji",
        ref: "👂",
      },
      category: {
        type: "nói đúng lúc",
        label: "Nói đúng lúc",
      },
      contrast_group: "primary",
      value: 2,
      ordering: 2,
      audio_path: "/audio/vi/c5/pra/lang_nghe_ban_noi.mp3",
    },
    {
      id: "pra_cho_den_luot",
      label: "kiên nhẫn chờ lượt",
      image: {
        kind: "emoji",
        ref: "⏳",
      },
      category: {
        type: "nói đúng lúc",
        label: "Nói đúng lúc",
      },
      contrast_group: "primary",
      value: 3,
      ordering: 3,
      audio_path: "/audio/vi/c5/pra/cho_den_luot_minh.mp3",
    },
    {
      id: "pra_noi_leo",
      label: "nói xen ngang lời",
      image: {
        kind: "emoji",
        ref: "🙅",
      },
      category: {
        type: "nói xen ngang",
        label: "Nói xen ngang",
      },
      contrast_group: "contrast",
      value: 4,
      ordering: 4,
      audio_path: "/audio/vi/c5/pra/noi_leo_chen_ngang.mp3",
    },
    {
      id: "pra_la_het",
      label: "la lớn ồn ào",
      image: {
        kind: "emoji",
        ref: "📢",
      },
      category: {
        type: "nói xen ngang",
        label: "Nói xen ngang",
      },
      contrast_group: "contrast",
      value: 5,
      ordering: 5,
      audio_path: "/audio/vi/c5/pra/la_het_lam_on.mp3",
    },
    {
      id: "pra_ngat_loi",
      label: "ngắt lời người khác",
      image: {
        kind: "emoji",
        ref: "🗣️",
      },
      category: {
        type: "nói xen ngang",
        label: "Nói xen ngang",
      },
      contrast_group: "contrast",
      value: 6,
      ordering: 6,
      audio_path: "/audio/vi/c5/pra/ngat_loi_nguoi_khac.mp3",
    },
  ],
  axes: {
    category: {
      values: ["nói đúng lúc", "nói xen ngang"],
      ordered: true,
    },
  },
  relations: [
    {
      type: "contrast",
      source_id: "pra_gio_tay_phat_bieu",
      target_id: "pra_noi_leo",
      explanation: "Giơ tay xin nói đối lập với nói xen ngang lời",
    },
    {
      type: "contrast",
      source_id: "pra_lang_nghe_ban",
      target_id: "pra_la_het",
      explanation: "Lắng nghe bạn kể đối lập với la lớn ồn ào",
    },
    {
      type: "contrast",
      source_id: "pra_cho_den_luot",
      target_id: "pra_ngat_loi",
      explanation: "Kiên nhẫn chờ lượt đối lập với ngắt lời người khác",
    },
    {
      type: "pair",
      source_id: "pra_gio_tay_phat_bieu",
      target_id: "pra_noi_leo",
      explanation: "Cặp hành vi đối chiếu khi xin phát biểu ý kiến",
    },
    {
      type: "pair",
      source_id: "pra_lang_nghe_ban",
      target_id: "pra_la_het",
      explanation: "Cặp hành vi đối chiếu khi lắng nghe trong nhóm",
    },
    {
      type: "pair",
      source_id: "pra_cho_den_luot",
      target_id: "pra_ngat_loi",
      explanation: "Cặp hành vi đối chiếu khi chờ đến lượt nói",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Chờ đến lượt nói",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Chờ đến lượt nói",
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
    narration_template: "Chúng mình cùng tìm hiểu về Chờ đến lượt nói nhé",
  },
  ordering: [
    "pra_gio_tay_phat_bieu",
    "pra_lang_nghe_ban",
    "pra_cho_den_luot",
    "pra_noi_leo",
    "pra_la_het",
    "pra_ngat_loi",
  ],
};

export const C5_PRA_02_SEED: SkillSeed = {
  identity: C5_PRA_02_IDENTITY,
  dataset: C5_PRA_02_DATASET,
  levels: [
    {
      code: "GL-C5-PRA-STIK-0001",
      template: "GT-025",
      band: "4-5",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-PRA-ADD-0001",
      template: "GT-026",
      band: "4-5",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C5-PRA-ADD-0002",
      template: "GT-026",
      band: "4-5",
      difficulty: 3,
      theme: "festival",
      rounds: 3,
    },
    {
      template: "GT-026",
      band: "5-6",
      difficulty: 2,
      theme: "farm",
    },
  ],
};
