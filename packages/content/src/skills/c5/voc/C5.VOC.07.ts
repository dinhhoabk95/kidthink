import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_VOC_07_IDENTITY: SkillIdentity = {
  code: "C5.VOC.07",
  strand_code: "C5.VOC",
  competency_code: "C5",
  name: "Từ vựng đồ dùng nhà bếp",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["match", "recall"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C5.VOC.07-01",
      behaviour: "Nhận biết và thực hành Từ vựng đồ dùng nhà bếp ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.VOC.07-02",
      behaviour:
        "Phân biệt và so sánh Từ vựng đồ dùng nhà bếp trong các ngữ cảnh khác nhau",
      observable_criteria:
        "Trẻ phân biệt đúng giữa các phương án gây nhiễu trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.VOC.07-03",
      behaviour: "Vận dụng và ghi nhớ Từ vựng đồ dùng nhà bếp",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_VOC_07_DATASET: SkillDataset = {
  skill_code: "C5.VOC.07",
  concept_label: "Từ vựng đồ dùng nhà bếp",
  surface: "game",
  items: [
    {
      id: "voc_noi_nau",
      label: "nồi nấu",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_chao_ran",
      label: "chảo rán",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_bat_an",
      label: "bát ăn",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_dia_su",
      label: "đĩa sứ",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_thia_an",
      label: "thìa ăn",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_dua_an",
      label: "đũa ăn",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_coc_nuoc",
      label: "cốc nước",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_dao_bep",
      label: "dao bếp",
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
      description: "Làm quen cơ bản với Từ vựng đồ dùng nhà bếp",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Từ vựng đồ dùng nhà bếp",
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
      "Chúng mình cùng tìm hiểu về Từ vựng đồ dùng nhà bếp nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ {label} nhé!",
  },
  ordering: [
    "voc_noi_nau",
    "voc_chao_ran",
    "voc_bat_an",
    "voc_dia_su",
    "voc_thia_an",
    "voc_dua_an",
    "voc_coc_nuoc",
    "voc_dao_bep",
  ],
};

export const C5_VOC_07_SEED: SkillSeed = {
  identity: C5_VOC_07_IDENTITY,
  dataset: C5_VOC_07_DATASET,
  levels: [
    {
      code: "GL-C5-VOC-INTRO-0002",
      template: "GT-000",
      band: "4-5",
      difficulty: 1,
      theme: "family",
      rounds: 1,
      sequence_no: 1,
      skill_codes: ["C5.VOC.07"],
    },
    {
      code: "GL-C5-VOC-TAP-0016",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-TAP-0017",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-TAP-0018",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-TAP-0019",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-TAP-0020",
      template: "GT-001",
      band: "4-5",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-MULTI-0006",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-MULTI-0007",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-MULTI-0008",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-MULTI-0009",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-MULTI-0010",
      template: "GT-002",
      band: "4-5",
      difficulty: 4,
      theme: "weather",
      rounds: 3,
    },
  ],
};
