import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_VOC_06_IDENTITY: SkillIdentity = {
  code: "C5.VOC.06",
  strand_code: "C5.VOC",
  competency_code: "C5",
  name: "Từ vựng đồ dùng học tập",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["match", "recall"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C5.VOC.06-01",
      behaviour: "Nhận biết và thực hành Từ vựng đồ dùng học tập ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.VOC.06-02",
      behaviour:
        "Phân biệt và so sánh Từ vựng đồ dùng học tập trong các ngữ cảnh khác nhau",
      observable_criteria:
        "Trẻ phân biệt đúng giữa các phương án gây nhiễu trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.VOC.06-03",
      behaviour: "Vận dụng và ghi nhớ Từ vựng đồ dùng học tập",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_VOC_06_DATASET: SkillDataset = {
  skill_code: "C5.VOC.06",
  concept_label: "Từ vựng đồ dùng học tập",
  surface: "game",
  items: [
    {
      id: "voc_but_chi",
      label: "bút chì",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_thuoc_ke",
      label: "thước kẻ",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_vo_ve",
      label: "vở vẽ",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_cap_sach",
      label: "cặp sách",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_cuc_tay",
      label: "cục tẩy",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_keo_cat",
      label: "kéo thủ công",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_ho_dan",
      label: "hồ dán",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_bang_con",
      label: "bảng con",
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
      description: "Làm quen cơ bản với Từ vựng đồ dùng học tập",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Từ vựng đồ dùng học tập",
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
      "Chúng mình cùng tìm hiểu về Từ vựng đồ dùng học tập nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ {label} nhé!",
  },
  ordering: [
    "voc_but_chi",
    "voc_thuoc_ke",
    "voc_vo_ve",
    "voc_cap_sach",
    "voc_cuc_tay",
    "voc_keo_cat",
    "voc_ho_dan",
    "voc_bang_con",
  ],
};

export const C5_VOC_06_SEED: SkillSeed = {
  identity: C5_VOC_06_IDENTITY,
  dataset: C5_VOC_06_DATASET,
  levels: [
    {
      code: "GL-C5-VOC-INTRO-0001",
      template: "GT-000",
      band: "4-5",
      difficulty: 1,
      theme: "school",
      rounds: 1,
      sequence_no: 1,
      skill_codes: ["C5.VOC.06"],
    },
    {
      code: "GL-C5-VOC-TAP-0011",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-TAP-0012",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-TAP-0013",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-TAP-0014",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-TAP-0015",
      template: "GT-001",
      band: "4-5",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-MULTI-0001",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-MULTI-0002",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-MULTI-0003",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-MULTI-0004",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-MULTI-0005",
      template: "GT-002",
      band: "4-5",
      difficulty: 4,
      theme: "weather",
      rounds: 3,
    },
  ],
};
