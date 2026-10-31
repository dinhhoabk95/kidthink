import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_SOC_02_IDENTITY: SkillIdentity = {
  code: "C4.SOC.02",
  strand_code: "C4.SOC",
  competency_code: "C4",
  name: "Thành viên trong gia đình",
  age_min: 3,
  age_max: 3,
  difficulty: 2,
  thinking_processes: ["match", "describe"],
  tier: "basic",
  prerequisites: ["C4.SOC.01"],
  learning_objectives: [
    {
      code: "LO-C4.SOC.02-01",
      behaviour:
        "Nhận biết và thực hành Thành viên trong gia đình ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.SOC.02-02",
      behaviour:
        "Vận dụng Thành viên trong gia đình trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.SOC.02-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Thành viên trong gia đình",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_SOC_02_DATASET: SkillDataset = {
  skill_code: "C4.SOC.02",
  concept_label: "Thành viên trong gia đình",
  surface: "game",
  items: [
    {
      id: "grandfather",
      label: "ông hiền từ",
      image: {
        kind: "emoji",
        ref: "👴",
      },
      category: {
        type: "người lớn",
      },
      value: 1,
      ordering: 1,
      contrast_group: "adult",
      audio_path: "/audio/vi/c4/grandfather.mp3",
    },
    {
      id: "grandmother",
      label: "bà dịu dàng",
      image: {
        kind: "emoji",
        ref: "👵",
      },
      category: {
        type: "người lớn",
      },
      value: 2,
      ordering: 2,
      contrast_group: "adult",
      audio_path: "/audio/vi/c4/grandmother.mp3",
    },
    {
      id: "father",
      label: "bố mạnh mẽ",
      image: {
        kind: "emoji",
        ref: "👨",
      },
      category: {
        type: "người lớn",
      },
      value: 3,
      ordering: 3,
      contrast_group: "adult",
      audio_path: "/audio/vi/c4/father.mp3",
    },
    {
      id: "mother",
      label: "mẹ yêu thương",
      image: {
        kind: "emoji",
        ref: "👩",
      },
      category: {
        type: "người lớn",
      },
      value: 4,
      ordering: 4,
      contrast_group: "adult",
      audio_path: "/audio/vi/c4/mother.mp3",
    },
    {
      id: "brother",
      label: "anh trai vui",
      image: {
        kind: "emoji",
        ref: "👦",
      },
      category: {
        type: "trẻ nhỏ",
      },
      value: 1,
      ordering: 5,
      contrast_group: "child",
      audio_path: "/audio/vi/c4/brother.mp3",
    },
    {
      id: "sister",
      label: "chị gái ngoan",
      image: {
        kind: "emoji",
        ref: "👧",
      },
      category: {
        type: "trẻ nhỏ",
      },
      value: 2,
      ordering: 6,
      contrast_group: "child",
      audio_path: "/audio/vi/c4/sister.mp3",
    },
    {
      id: "baby",
      label: "em bé nhỏ",
      image: {
        kind: "emoji",
        ref: "👶",
      },
      category: {
        type: "trẻ nhỏ",
      },
      value: 3,
      ordering: 7,
      contrast_group: "child",
      audio_path: "/audio/vi/c4/baby.mp3",
    },
    {
      id: "kid",
      label: "bạn nhỏ ngoan",
      image: {
        kind: "emoji",
        ref: "🧒",
      },
      category: {
        type: "trẻ nhỏ",
      },
      value: 4,
      ordering: 8,
      contrast_group: "child",
      audio_path: "/audio/vi/c4/kid.mp3",
    },
  ],
  axes: {
    category: {
      values: ["người lớn", "trẻ nhỏ"],
    },
  },
  relations: [
    {
      type: "pair",
      source_id: "grandfather",
      target_id: "grandmother",
    },
    {
      type: "pair",
      source_id: "father",
      target_id: "mother",
    },
    {
      type: "pair",
      source_id: "brother",
      target_id: "sister",
    },
    {
      type: "pair",
      source_id: "kid",
      target_id: "baby",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Thành viên trong gia đình",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Thành viên trong gia đình",
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
      "Chúng mình cùng tìm hiểu về Thành viên trong gia đình nhé",
  },
  ordering: [
    "grandfather",
    "grandmother",
    "father",
    "mother",
    "brother",
    "sister",
    "baby",
    "kid",
  ],
};

export const C4_SOC_02_SEED: SkillSeed = {
  identity: C4_SOC_02_IDENTITY,
  dataset: C4_SOC_02_DATASET,
  levels: [
    {
      code: "GL-C4-SOC-TAP-0001",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C4-SOC-TAP-0002",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C4-SOC-TCMP-0001",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
  ],
};
