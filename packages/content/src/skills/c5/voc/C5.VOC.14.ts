import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_VOC_14_IDENTITY: SkillIdentity = {
  code: "C5.VOC.14",
  strand_code: "C5.VOC",
  competency_code: "C5",
  name: "Từ vựng nhạc cụ quen thuộc",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["match", "recall"],
  tier: "core",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C5.VOC.14-01",
      behaviour:
        "Nhận biết và thực hành Từ vựng nhạc cụ quen thuộc ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.VOC.14-02",
      behaviour:
        "Phân biệt và so sánh Từ vựng nhạc cụ quen thuộc trong các ngữ cảnh khác nhau",
      observable_criteria:
        "Trẻ phân biệt đúng giữa các phương án gây nhiễu trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.VOC.14-03",
      behaviour: "Vận dụng và ghi nhớ Từ vựng nhạc cụ quen thuộc",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_VOC_14_DATASET: SkillDataset = {
  skill_code: "C5.VOC.14",
  concept_label: "Từ vựng nhạc cụ quen thuộc",
  surface: "game",
  items: [
    {
      id: "voc_cai_trong",
      label: "cái trống",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_dan_ghita",
      label: "đàn ghi-ta",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_cay_ken",
      label: "cây kèn",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_qua_chuong",
      label: "quả chuông",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_cay_sao",
      label: "cây sáo",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_xuc_xac",
      label: "xúc xắc",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_thanh_go",
      label: "thanh gõ",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_cai_chieng",
      label: "cái chiêng",
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
      description: "Làm quen cơ bản với Từ vựng nhạc cụ quen thuộc",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Từ vựng nhạc cụ quen thuộc",
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
      "Chúng mình cùng tìm hiểu về Từ vựng nhạc cụ quen thuộc nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ {label} nhé!",
  },
  ordering: [
    "voc_cai_trong",
    "voc_dan_ghita",
    "voc_cay_ken",
    "voc_qua_chuong",
    "voc_cay_sao",
    "voc_xuc_xac",
    "voc_thanh_go",
    "voc_cai_chieng",
  ],
};

export const C5_VOC_14_SEED: SkillSeed = {
  identity: C5_VOC_14_IDENTITY,
  dataset: C5_VOC_14_DATASET,
  levels: [
    {
      code: "GL-C5-VOC-INTRO-0009",
      template: "GT-000",
      band: "5-6",
      difficulty: 1,
      theme: "art",
      rounds: 1,
      sequence_no: 1,
      skill_codes: ["C5.VOC.14"],
    },
    {
      code: "GL-C5-VOC-TAP-0051",
      template: "GT-001",
      band: "5-6",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-TAP-0052",
      template: "GT-001",
      band: "5-6",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-TAP-0053",
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-TAP-0054",
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-TAP-0055",
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-MULTI-0041",
      template: "GT-002",
      band: "5-6",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-MULTI-0042",
      template: "GT-002",
      band: "5-6",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-MULTI-0043",
      template: "GT-002",
      band: "5-6",
      difficulty: 3,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-MULTI-0044",
      template: "GT-002",
      band: "5-6",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-MULTI-0045",
      template: "GT-002",
      band: "5-6",
      difficulty: 4,
      theme: "weather",
      rounds: 3,
    },
  ],
};
