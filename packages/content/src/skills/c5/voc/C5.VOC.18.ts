import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_VOC_18_IDENTITY: SkillIdentity = {
  code: "C5.VOC.18",
  strand_code: "C5.VOC",
  competency_code: "C5",
  name: "Từ vựng hình dạng bằng lời",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["match", "recall"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C5.VOC.18-01",
      behaviour:
        "Nhận biết và thực hành Từ vựng hình dạng bằng lời ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.VOC.18-02",
      behaviour:
        "Phân biệt và so sánh Từ vựng hình dạng bằng lời trong các ngữ cảnh khác nhau",
      observable_criteria:
        "Trẻ phân biệt đúng giữa các phương án gây nhiễu trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.VOC.18-03",
      behaviour: "Vận dụng và ghi nhớ Từ vựng hình dạng bằng lời",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_VOC_18_DATASET: SkillDataset = {
  skill_code: "C5.VOC.18",
  concept_label: "Từ vựng hình dạng bằng lời",
  surface: "game",
  items: [
    {
      id: "voc_hinh_tron",
      label: "hình tròn",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_hinh_vuong",
      label: "hình vuông",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_tam_giac",
      label: "hình tam giác",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_chu_nhat",
      label: "hình chữ nhật",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_bau_duc",
      label: "hình bầu dục",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_hinh_thoi",
      label: "hình thoi",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_ngoi_sao",
      label: "ngôi sao",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_trai_tim",
      label: "trái tim",
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
      description: "Làm quen cơ bản với Từ vựng hình dạng bằng lời",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Từ vựng hình dạng bằng lời",
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
      "Chúng mình cùng tìm hiểu về Từ vựng hình dạng bằng lời nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ {label} nhé!",
  },
  ordering: [
    "voc_hinh_tron",
    "voc_hinh_vuong",
    "voc_tam_giac",
    "voc_chu_nhat",
    "voc_bau_duc",
    "voc_hinh_thoi",
    "voc_ngoi_sao",
    "voc_trai_tim",
  ],
};

export const C5_VOC_18_SEED: SkillSeed = {
  identity: C5_VOC_18_IDENTITY,
  dataset: C5_VOC_18_DATASET,
  levels: [
    {
      code: "GL-C5-VOC-INTRO-0013",
      template: "GT-000",
      band: "4-5",
      difficulty: 1,
      theme: "school",
      rounds: 1,
      sequence_no: 1,
      skill_codes: ["C5.VOC.18"],
    },
    {
      code: "GL-C5-VOC-TAP-0071",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-TAP-0072",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-TAP-0073",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-TAP-0074",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-TAP-0075",
      template: "GT-001",
      band: "4-5",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-MULTI-0061",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-MULTI-0062",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-MULTI-0063",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-MULTI-0064",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-MULTI-0065",
      template: "GT-002",
      band: "4-5",
      difficulty: 4,
      theme: "weather",
      rounds: 3,
    },
  ],
};
