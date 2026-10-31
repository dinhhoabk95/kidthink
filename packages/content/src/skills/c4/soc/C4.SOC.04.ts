import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_SOC_04_IDENTITY: SkillIdentity = {
  code: "C4.SOC.04",
  strand_code: "C4.SOC",
  competency_code: "C4",
  name: "Nghề nghiệp – dụng cụ",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["match", "infer"],
  tier: "core",
  prerequisites: ["C3.CLS.04"],
  learning_objectives: [
    {
      code: "LO-C4.SOC.04-01",
      behaviour: "Nhận biết và thực hành Nghề nghiệp – dụng cụ ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.SOC.04-02",
      behaviour: "Vận dụng Nghề nghiệp – dụng cụ trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.SOC.04-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Nghề nghiệp – dụng cụ",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_SOC_04_DATASET: SkillDataset = {
  skill_code: "C4.SOC.04",
  concept_label: "Nghề nghiệp – dụng cụ",
  surface: "game",
  items: [
    {
      id: "doctor",
      label: "cô bác sĩ",
      image: {
        kind: "emoji",
        ref: "👩‍⚕️",
      },
      category: {
        type: "người làm nghề",
      },
      value: 1,
      ordering: 1,
      contrast_group: "person",
      audio_path: "/audio/vi/c4/doctor.mp3",
    },
    {
      id: "firefighter",
      label: "chú cứu hỏa",
      image: {
        kind: "emoji",
        ref: "👨‍🚒",
      },
      category: {
        type: "người làm nghề",
      },
      value: 2,
      ordering: 2,
      contrast_group: "person",
      audio_path: "/audio/vi/c4/firefighter.mp3",
    },
    {
      id: "chef",
      label: "đầu bếp giỏi",
      image: {
        kind: "emoji",
        ref: "👩‍🍳",
      },
      category: {
        type: "người làm nghề",
      },
      value: 3,
      ordering: 3,
      contrast_group: "person",
      audio_path: "/audio/vi/c4/chef.mp3",
    },
    {
      id: "teacher",
      label: "cô giáo hiền",
      image: {
        kind: "emoji",
        ref: "👩‍🏫",
      },
      category: {
        type: "người làm nghề",
      },
      value: 4,
      ordering: 4,
      contrast_group: "person",
      audio_path: "/audio/vi/c4/teacher.mp3",
    },
    {
      id: "stethoscope",
      label: "ống nghe khám",
      image: {
        kind: "emoji",
        ref: "🩺",
      },
      category: {
        type: "dụng cụ nghề",
      },
      value: 1,
      ordering: 5,
      contrast_group: "tool",
      audio_path: "/audio/vi/c4/stethoscope.mp3",
    },
    {
      id: "fire_truck",
      label: "xe cứu hỏa",
      image: {
        kind: "emoji",
        ref: "🚒",
      },
      category: {
        type: "dụng cụ nghề",
      },
      value: 2,
      ordering: 6,
      contrast_group: "tool",
      audio_path: "/audio/vi/c4/fire_truck.mp3",
    },
    {
      id: "pan",
      label: "chảo nấu ăn",
      image: {
        kind: "emoji",
        ref: "🍳",
      },
      category: {
        type: "dụng cụ nghề",
      },
      value: 3,
      ordering: 7,
      contrast_group: "tool",
      audio_path: "/audio/vi/c4/pan.mp3",
    },
    {
      id: "textbook",
      label: "sách giáo khoa",
      image: {
        kind: "emoji",
        ref: "📖",
      },
      category: {
        type: "dụng cụ nghề",
      },
      value: 4,
      ordering: 8,
      contrast_group: "tool",
      audio_path: "/audio/vi/c4/textbook.mp3",
    },
  ],
  axes: {
    category: {
      values: ["người làm nghề", "dụng cụ nghề"],
    },
  },
  relations: [
    {
      type: "pair",
      source_id: "doctor",
      target_id: "stethoscope",
    },
    {
      type: "pair",
      source_id: "firefighter",
      target_id: "fire_truck",
    },
    {
      type: "pair",
      source_id: "chef",
      target_id: "pan",
    },
    {
      type: "pair",
      source_id: "teacher",
      target_id: "textbook",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Nghề nghiệp – dụng cụ",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nghề nghiệp – dụng cụ",
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
    narration_template: "Chúng mình cùng tìm hiểu về Nghề nghiệp – dụng cụ nhé",
  },
  ordering: [
    "doctor",
    "firefighter",
    "chef",
    "teacher",
    "stethoscope",
    "fire_truck",
    "pan",
    "textbook",
  ],
};

export const C4_SOC_04_SEED: SkillSeed = {
  identity: C4_SOC_04_IDENTITY,
  dataset: C4_SOC_04_DATASET,
  levels: [
    {
      code: "GL-C4-SOC-TAP-0005",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C4-SOC-TAP-0006",
      template: "GT-001",
      band: "3-4",
      difficulty: 3,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C4-SOC-TCMP-0005",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
  ],
};
