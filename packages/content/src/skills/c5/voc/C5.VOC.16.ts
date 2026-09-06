import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_VOC_16_IDENTITY: SkillIdentity = {
  code: "C5.VOC.16",
  strand_code: "C5.VOC",
  competency_code: "C5",
  name: "Từ vựng lễ hội Việt Nam",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["match", "recall"],
  tier: "core",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C5.VOC.16-01",
      behaviour: "Nhận biết và thực hành Từ vựng lễ hội Việt Nam ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.VOC.16-02",
      behaviour:
        "Phân biệt và so sánh Từ vựng lễ hội Việt Nam trong các ngữ cảnh khác nhau",
      observable_criteria:
        "Trẻ phân biệt đúng giữa các phương án gây nhiễu trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.VOC.16-03",
      behaviour: "Vận dụng và ghi nhớ Từ vựng lễ hội Việt Nam",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_VOC_16_DATASET: SkillDataset = {
  skill_code: "C5.VOC.16",
  concept_label: "Từ vựng lễ hội Việt Nam",
  surface: "game",
  items: [
    {
      id: "voc_tet_nguyen_dan",
      label: "tết nguyên đán",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_tet_trung_thu",
      label: "tết trung thu",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_den_long",
      label: "đèn lồng",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_banh_chung",
      label: "bánh chưng",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_mua_lan",
      label: "múa lân",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_li_xi",
      label: "lì xì",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_hoa_dao_tet",
      label: "hoa đào tết",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_phao_hoa",
      label: "pháo hoa",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Từ vựng lễ hội Việt Nam",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Từ vựng lễ hội Việt Nam",
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
      "Chúng mình cùng tìm hiểu về Từ vựng lễ hội Việt Nam nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ {label} nhé!",
  },
  ordering: [
    "voc_tet_nguyen_dan",
    "voc_tet_trung_thu",
    "voc_den_long",
    "voc_banh_chung",
    "voc_mua_lan",
    "voc_li_xi",
    "voc_hoa_dao_tet",
    "voc_phao_hoa",
  ],
};

export const C5_VOC_16_SEED: SkillSeed = {
  identity: C5_VOC_16_IDENTITY,
  dataset: C5_VOC_16_DATASET,
  levels: [
    {
      code: "GL-C5-VOC-INTRO-0011",
      template: "GT-000",
      band: "4-5",
      difficulty: 1,
      theme: "family",
      rounds: 1,
      sequence_no: 1,
      skill_codes: ["C5.VOC.16"],
    },
    {
      code: "GL-C5-VOC-TAP-0061",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-TAP-0062",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-TAP-0063",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-TAP-0064",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-TAP-0065",
      template: "GT-001",
      band: "4-5",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-MULTI-0051",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-MULTI-0052",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-MULTI-0053",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-MULTI-0054",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-MULTI-0055",
      template: "GT-002",
      band: "4-5",
      difficulty: 4,
      theme: "weather",
      rounds: 3,
    },
  ],
};
