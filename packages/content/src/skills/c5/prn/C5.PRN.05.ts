import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_PRN_05_IDENTITY: SkillIdentity = {
  code: "C5.PRN.05",
  strand_code: "C5.PRN",
  competency_code: "C5",
  name: "Dấu chấm, dấu hỏi",
  age_min: 5,
  age_max: 6,
  difficulty: 4,
  thinking_processes: ["observe", "infer"],
  tier: "advanced",
  prerequisites: ["C5.PRN.04", "C5.GRM.04"],
  learning_objectives: [
    {
      code: "LO-C5.PRN.05-01",
      behaviour: "Nhận biết và thực hành Dấu chấm, dấu hỏi ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.PRN.05-02",
      behaviour: "Vận dụng Dấu chấm, dấu hỏi trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.PRN.05-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Dấu chấm, dấu hỏi",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_PRN_05_DATASET: SkillDataset = {
  skill_code: "C5.PRN.05",
  concept_label: "Dấu chấm, dấu hỏi",
  surface: "game",
  items: [
    {
      id: "prn_dau_cham_1",
      label: "bé đi học.",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🎒",
      },
      audio_path: "/audio/vi/c5/prn/be_di_hoc_cham.mp3",
      category: {
        type: "dấu chấm câu",
      },
      contrast_group: "primary",
    },
    {
      id: "prn_dau_cham_2",
      label: "trời đang mưa.",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🌧️",
      },
      audio_path: "/audio/vi/c5/prn/troi_dang_mua_cham.mp3",
      category: {
        type: "dấu chấm câu",
      },
      contrast_group: "primary",
    },
    {
      id: "prn_dau_cham_3",
      label: "hoa nở đẹp.",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🌸",
      },
      audio_path: "/audio/vi/c5/prn/hoa_no_dep_cham.mp3",
      category: {
        type: "dấu chấm câu",
      },
      contrast_group: "primary",
    },
    {
      id: "prn_dau_hoi_1",
      label: "ai đang gọi đó?",
      value: 4,
      image: {
        kind: "emoji",
        ref: "❓",
      },
      audio_path: "/audio/vi/c5/prn/ai_goi_do_hoi.mp3",
      category: {
        type: "dấu hỏi câu",
      },
      contrast_group: "contrast",
    },
    {
      id: "prn_dau_hoi_2",
      label: "cái gì đây?",
      value: 5,
      image: {
        kind: "emoji",
        ref: "❔",
      },
      audio_path: "/audio/vi/c5/prn/cai_gi_day_hoi.mp3",
      category: {
        type: "dấu hỏi câu",
      },
      contrast_group: "contrast",
    },
    {
      id: "prn_dau_hoi_3",
      label: "mẹ đi đâu thế?",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🙋",
      },
      audio_path: "/audio/vi/c5/prn/me_di_dau_hoi.mp3",
      category: {
        type: "dấu hỏi câu",
      },
      contrast_group: "contrast",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Dấu chấm, dấu hỏi",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Dấu chấm, dấu hỏi",
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
    narration_template: "Chúng mình cùng tìm hiểu về Dấu chấm, dấu hỏi nhé",
  },
  ordering: [
    "prn_dau_cham_1",
    "prn_dau_cham_2",
    "prn_dau_cham_3",
    "prn_dau_hoi_1",
    "prn_dau_hoi_2",
    "prn_dau_hoi_3",
  ],
  axes: {
    category: {
      values: ["dấu chấm câu", "dấu hỏi câu"],
      ordered: true,
    },
  },
  relations: [
    {
      type: "pair",
      source_id: "prn_dau_cham_1",
      target_id: "prn_dau_cham_2",
    },
    {
      type: "pair",
      source_id: "prn_dau_hoi_1",
      target_id: "prn_dau_hoi_2",
    },
    {
      type: "contrast",
      source_id: "prn_dau_cham_1",
      target_id: "prn_dau_hoi_1",
    },
    {
      type: "contrast",
      source_id: "prn_dau_cham_2",
      target_id: "prn_dau_hoi_2",
    },
    {
      type: "contrast",
      source_id: "prn_dau_cham_3",
      target_id: "prn_dau_hoi_3",
    },
  ],
};

export const C5_PRN_05_SEED: SkillSeed = {
  identity: C5_PRN_05_IDENTITY,
  dataset: C5_PRN_05_DATASET,
  levels: [
    {
      code: "GL-C5-PRN-TAP-0009",
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-PRN-TAP-0010",
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C5-PRN-TCNT-0009",
      template: "GT-002",
      band: "5-6",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
  ],
};
