import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_VOC_12_IDENTITY: SkillIdentity = {
  code: "C5.VOC.12",
  strand_code: "C5.VOC",
  competency_code: "C5",
  name: "Từ vựng các loài côn trùng",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["match", "recall"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C5.VOC.12-01",
      behaviour:
        "Nhận biết và thực hành Từ vựng các loài côn trùng ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.VOC.12-02",
      behaviour:
        "Phân biệt và so sánh Từ vựng các loài côn trùng trong các ngữ cảnh khác nhau",
      observable_criteria:
        "Trẻ phân biệt đúng giữa các phương án gây nhiễu trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.VOC.12-03",
      behaviour: "Vận dụng và ghi nhớ Từ vựng các loài côn trùng",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_VOC_12_DATASET: SkillDataset = {
  skill_code: "C5.VOC.12",
  concept_label: "Từ vựng các loài côn trùng",
  surface: "game",
  items: [
    {
      id: "voc_con_buom",
      label: "con bướm",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_con_ong",
      label: "con ong",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_con_kien",
      label: "con kiến",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_chuon_chuon",
      label: "chuồn chuồn",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_bo_rua",
      label: "bọ rùa",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_con_gian",
      label: "con gián",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_con_muoi",
      label: "con muỗi",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_cao_cao",
      label: "cào cào",
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
      description: "Làm quen cơ bản với Từ vựng các loài côn trùng",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Từ vựng các loài côn trùng",
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
      "Chúng mình cùng tìm hiểu về Từ vựng các loài côn trùng nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ {label} nhé!",
  },
  ordering: [
    "voc_con_buom",
    "voc_con_ong",
    "voc_con_kien",
    "voc_chuon_chuon",
    "voc_bo_rua",
    "voc_con_gian",
    "voc_con_muoi",
    "voc_cao_cao",
  ],
};

export const C5_VOC_12_SEED: SkillSeed = {
  identity: C5_VOC_12_IDENTITY,
  dataset: C5_VOC_12_DATASET,
  levels: [
    {
      code: "GL-C5-VOC-INTRO-0007",
      template: "GT-000",
      band: "4-5",
      difficulty: 1,
      theme: "animal",
      rounds: 1,
      sequence_no: 1,
      skill_codes: ["C5.VOC.12"],
    },
    {
      code: "GL-C5-VOC-TAP-0041",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-TAP-0042",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-TAP-0043",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-TAP-0044",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-TAP-0045",
      template: "GT-001",
      band: "4-5",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-MULTI-0031",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-MULTI-0032",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-MULTI-0033",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-MULTI-0034",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-MULTI-0035",
      template: "GT-002",
      band: "4-5",
      difficulty: 4,
      theme: "weather",
      rounds: 3,
    },
  ],
};
