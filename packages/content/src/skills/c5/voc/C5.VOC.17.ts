import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_VOC_17_IDENTITY: SkillIdentity = {
  code: "C5.VOC.17",
  strand_code: "C5.VOC",
  competency_code: "C5",
  name: "Từ vựng màu sắc mở rộng",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["match", "recall"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C5.VOC.17-01",
      behaviour: "Nhận biết và thực hành Từ vựng màu sắc mở rộng ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.VOC.17-02",
      behaviour:
        "Phân biệt và so sánh Từ vựng màu sắc mở rộng trong các ngữ cảnh khác nhau",
      observable_criteria:
        "Trẻ phân biệt đúng giữa các phương án gây nhiễu trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.VOC.17-03",
      behaviour: "Vận dụng và ghi nhớ Từ vựng màu sắc mở rộng",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_VOC_17_DATASET: SkillDataset = {
  skill_code: "C5.VOC.17",
  concept_label: "Từ vựng màu sắc mở rộng",
  surface: "game",
  items: [
    {
      id: "voc_mau_hong",
      label: "màu hồng",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_mau_cam",
      label: "màu cam",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_mau_tim",
      label: "màu tím",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_mau_nau",
      label: "màu nâu",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_mau_xam",
      label: "màu xám",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_mau_den",
      label: "màu đen",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_mau_trang",
      label: "màu trắng",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_xanh_la",
      label: "màu xanh lá",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_xanh_duong",
      label: "màu xanh dương",
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
      description: "Làm quen cơ bản với Từ vựng màu sắc mở rộng",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Từ vựng màu sắc mở rộng",
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
      "Chúng mình cùng tìm hiểu về Từ vựng màu sắc mở rộng nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ {label} nhé!",
  },
  ordering: [
    "voc_mau_hong",
    "voc_mau_cam",
    "voc_mau_tim",
    "voc_mau_nau",
    "voc_mau_xam",
    "voc_mau_den",
    "voc_mau_trang",
    "voc_xanh_la",
    "voc_xanh_duong",
  ],
};

export const C5_VOC_17_SEED: SkillSeed = {
  identity: C5_VOC_17_IDENTITY,
  dataset: C5_VOC_17_DATASET,
  levels: [
    {
      code: "GL-C5-VOC-INTRO-0012",
      template: "GT-000",
      band: "4-5",
      difficulty: 1,
      theme: "art",
      rounds: 1,
      sequence_no: 1,
      skill_codes: ["C5.VOC.17"],
    },
    {
      code: "GL-C5-VOC-TAP-0066",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-TAP-0067",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-TAP-0068",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-TAP-0069",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-TAP-0070",
      template: "GT-001",
      band: "4-5",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-MULTI-0056",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-MULTI-0057",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-MULTI-0058",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-MULTI-0059",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-MULTI-0060",
      template: "GT-002",
      band: "4-5",
      difficulty: 4,
      theme: "weather",
      rounds: 3,
    },
  ],
};
