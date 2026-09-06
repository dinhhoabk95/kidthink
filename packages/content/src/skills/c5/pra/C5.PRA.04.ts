import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_PRA_04_IDENTITY: SkillIdentity = {
  code: "C5.PRA.04",
  strand_code: "C5.PRA",
  competency_code: "C5",
  name: "Hỏi lại khi chưa hiểu",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["listen", "verify"],
  tier: "advanced",
  prerequisites: ["C5.QUE.02"],
  learning_objectives: [
    {
      code: "LO-C5.PRA.04-01",
      behaviour: "Nhận biết và thực hành Hỏi lại khi chưa hiểu ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.PRA.04-02",
      behaviour: "Vận dụng Hỏi lại khi chưa hiểu trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.PRA.04-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Hỏi lại khi chưa hiểu",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_PRA_04_DATASET: SkillDataset = {
  skill_code: "C5.PRA.04",
  concept_label: "Hỏi lại khi chưa hiểu",
  surface: "game",
  items: [
    {
      id: "pra_thua_co",
      label: "thưa cô con chưa rõ",
      image: {
        kind: "emoji",
        ref: "🙋",
      },
      category: {
        type: "giao tiếp lịch sự",
      },
    },
    {
      id: "pra_nho_nhac_lai",
      label: "nhờ cô nhắc lại giúp",
      image: {
        kind: "emoji",
        ref: "👂",
      },
      category: {
        type: "giao tiếp lịch sự",
      },
    },
    {
      id: "pra_cam_on_chi_dan",
      label: "con cảm ơn cô chỉ dẫn",
      image: {
        kind: "emoji",
        ref: "🙏",
      },
      category: {
        type: "giao tiếp lịch sự",
      },
    },
    {
      id: "pra_hoi_ban",
      label: "bạn ơi chỉ giúp tớ với",
      image: {
        kind: "emoji",
        ref: "🤝",
      },
      category: {
        type: "giao tiếp lịch sự",
      },
    },
    {
      id: "pra_lang_nghe_ky",
      label: "con chú ý lắng nghe",
      image: {
        kind: "emoji",
        ref: "👀",
      },
      category: {
        type: "giao tiếp lịch sự",
      },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Hỏi lại khi chưa hiểu",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Hỏi lại khi chưa hiểu",
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
    narration_template: "Chúng mình cùng tìm hiểu về Hỏi lại khi chưa hiểu nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: [
    "pra_thua_co",
    "pra_nho_nhac_lai",
    "pra_cam_on_chi_dan",
    "pra_hoi_ban",
    "pra_lang_nghe_ky",
  ],
};

export const C5_PRA_04_SEED: SkillSeed = {
  identity: C5_PRA_04_IDENTITY,
  dataset: C5_PRA_04_DATASET,
  levels: [
    {
      code: "GL-C5-PRA-MEAS-0003",
      template: "GT-028",
      band: "4-5",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C5-PRA-MEAS-0004",
      template: "GT-028",
      band: "4-5",
      difficulty: 4,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C5-PRA-TIME-0003",
      template: "GT-029",
      band: "4-5",
      difficulty: 3,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-PRA-TIME-0004",
      template: "GT-029",
      band: "4-5",
      difficulty: 4,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C5-PRA-COIN-0003",
      template: "GT-030",
      band: "5-6",
      difficulty: 3,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C5-PRA-COIN-0004",
      template: "GT-030",
      band: "5-6",
      difficulty: 4,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C5-PRA-PICT-0003",
      template: "GT-031",
      band: "5-6",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C5-PRA-PICT-0004",
      template: "GT-031",
      band: "5-6",
      difficulty: 4,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C5-PRA-VENN-0003",
      template: "GT-032",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-PRA-VENN-0004",
      template: "GT-032",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
  ],
};
