import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_VOC_09_IDENTITY: SkillIdentity = {
  code: "C5.VOC.09",
  strand_code: "C5.VOC",
  competency_code: "C5",
  name: "Từ vựng bộ phận cơ thể",
  age_min: 3,
  age_max: 3,
  difficulty: 1,
  thinking_processes: ["match", "recall"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C5.VOC.09-01",
      behaviour: "Nhận biết và thực hành Từ vựng bộ phận cơ thể ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.VOC.09-02",
      behaviour:
        "Phân biệt và so sánh Từ vựng bộ phận cơ thể trong các ngữ cảnh khác nhau",
      observable_criteria:
        "Trẻ phân biệt đúng giữa các phương án gây nhiễu trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.VOC.09-03",
      behaviour: "Vận dụng và ghi nhớ Từ vựng bộ phận cơ thể",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_VOC_09_DATASET: SkillDataset = {
  skill_code: "C5.VOC.09",
  concept_label: "Từ vựng bộ phận cơ thể",
  surface: "game",
  items: [
    {
      id: "voc_mat",
      label: "đôi mắt",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_mui",
      label: "cái mũi",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_mieng",
      label: "cái miệng",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_tai",
      label: "cái tai",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_tay",
      label: "bàn tay",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_chan",
      label: "bàn chân",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_dau",
      label: "cái đầu",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_bung",
      label: "cái bụng",
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
      description: "Làm quen cơ bản với Từ vựng bộ phận cơ thể",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Từ vựng bộ phận cơ thể",
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
      "Chúng mình cùng tìm hiểu về Từ vựng bộ phận cơ thể nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ {label} nhé!",
  },
  ordering: [
    "voc_mat",
    "voc_mui",
    "voc_mieng",
    "voc_tai",
    "voc_tay",
    "voc_chan",
    "voc_dau",
    "voc_bung",
  ],
};

export const C5_VOC_09_SEED: SkillSeed = {
  identity: C5_VOC_09_IDENTITY,
  dataset: C5_VOC_09_DATASET,
  levels: [
    {
      code: "GL-C5-VOC-INTRO-0004",
      template: "GT-000",
      band: "4-5",
      difficulty: 1,
      theme: "body",
      rounds: 1,
      sequence_no: 1,
      skill_codes: ["C5.VOC.09"],
    },
    {
      code: "GL-C5-VOC-TAP-0026",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-TAP-0027",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-TAP-0028",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-TAP-0029",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-TAP-0030",
      template: "GT-001",
      band: "4-5",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-MULTI-0016",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-MULTI-0017",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-MULTI-0018",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-MULTI-0019",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-MULTI-0020",
      template: "GT-002",
      band: "4-5",
      difficulty: 4,
      theme: "weather",
      rounds: 3,
    },
  ],
};
