import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_VOC_11_IDENTITY: SkillIdentity = {
  code: "C5.VOC.11",
  strand_code: "C5.VOC",
  competency_code: "C5",
  name: "Từ vựng cây cối hoa lá",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["match", "recall"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C5.VOC.11-01",
      behaviour: "Nhận biết và thực hành Từ vựng cây cối hoa lá ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.VOC.11-02",
      behaviour:
        "Phân biệt và so sánh Từ vựng cây cối hoa lá trong các ngữ cảnh khác nhau",
      observable_criteria:
        "Trẻ phân biệt đúng giữa các phương án gây nhiễu trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.VOC.11-03",
      behaviour: "Vận dụng và ghi nhớ Từ vựng cây cối hoa lá",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_VOC_11_DATASET: SkillDataset = {
  skill_code: "C5.VOC.11",
  concept_label: "Từ vựng cây cối hoa lá",
  surface: "game",
  items: [
    {
      id: "voc_hoa_hong",
      label: "hoa hồng",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_hoa_sen",
      label: "hoa sen",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_hoa_mai",
      label: "hoa mai",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_hoa_dao",
      label: "hoa đào",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_la_cay",
      label: "lá cây",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_canh_cay",
      label: "cành cây",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_re_cay",
      label: "rễ cây",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_than_cay",
      label: "thân cây",
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
      description: "Làm quen cơ bản với Từ vựng cây cối hoa lá",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Từ vựng cây cối hoa lá",
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
      "Chúng mình cùng tìm hiểu về Từ vựng cây cối hoa lá nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ {label} nhé!",
  },
  ordering: [
    "voc_hoa_hong",
    "voc_hoa_sen",
    "voc_hoa_mai",
    "voc_hoa_dao",
    "voc_la_cay",
    "voc_canh_cay",
    "voc_re_cay",
    "voc_than_cay",
  ],
};

export const C5_VOC_11_SEED: SkillSeed = {
  identity: C5_VOC_11_IDENTITY,
  dataset: C5_VOC_11_DATASET,
  levels: [
    {
      code: "GL-C5-VOC-INTRO-0006",
      template: "GT-000",
      band: "4-5",
      difficulty: 1,
      theme: "nature",
      rounds: 1,
      sequence_no: 1,
      skill_codes: ["C5.VOC.11"],
    },
    {
      code: "GL-C5-VOC-TAP-0036",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-TAP-0037",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-TAP-0038",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-TAP-0039",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-TAP-0040",
      template: "GT-001",
      band: "4-5",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-MULTI-0026",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-MULTI-0027",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-MULTI-0028",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-MULTI-0029",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-MULTI-0030",
      template: "GT-002",
      band: "4-5",
      difficulty: 4,
      theme: "weather",
      rounds: 3,
    },
  ],
};
