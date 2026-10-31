import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_CAU_05_IDENTITY: SkillIdentity = {
  code: "C4.CAU.05",
  strand_code: "C4.CAU",
  competency_code: "C4",
  name: "Chuỗi nhân quả hai bước",
  age_min: 5,
  age_max: 6,
  difficulty: 5,
  thinking_processes: ["infer", "sequence"],
  tier: "advanced",
  prerequisites: ["C4.CAU.04"],
  learning_objectives: [
    {
      code: "LO-C4.CAU.05-01",
      behaviour: "Nhận biết và thực hành Chuỗi nhân quả hai bước ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.CAU.05-02",
      behaviour: "Vận dụng Chuỗi nhân quả hai bước trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.CAU.05-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Chuỗi nhân quả hai bước",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_CAU_05_DATASET: SkillDataset = {
  skill_code: "C4.CAU.05",
  concept_label: "Chuỗi nhân quả hai bước",
  surface: "game",
  items: [
    {
      id: "seq_seed",
      label: "hạt giống nhỏ",
      image: {
        kind: "emoji",
        ref: "🌰",
      },
      category: {
        type: "bước đầu tiên",
      },
      contrast_group: "plant",
      value: 1,
      ordering: 1,
      audio_path: "/audio/vi/c4/seq_seed.mp3",
    },
    {
      id: "seq_sprout",
      label: "mầm non nhú",
      image: {
        kind: "emoji",
        ref: "🌱",
      },
      category: {
        type: "bước phát triển",
      },
      contrast_group: "plant",
      value: 2,
      ordering: 2,
      audio_path: "/audio/vi/c4/seq_sprout.mp3",
    },
    {
      id: "seq_flower",
      label: "bông hoa nở",
      image: {
        kind: "emoji",
        ref: "🌸",
      },
      category: {
        type: "bước phát triển",
      },
      contrast_group: "plant",
      value: 3,
      ordering: 3,
      audio_path: "/audio/vi/c4/seq_flower.mp3",
    },
    {
      id: "seq_fruit",
      label: "quả táo chín",
      image: {
        kind: "emoji",
        ref: "🍎",
      },
      category: {
        type: "kết quả cuối",
      },
      contrast_group: "plant",
      value: 4,
      ordering: 4,
      audio_path: "/audio/vi/c4/seq_fruit.mp3",
    },
    {
      id: "seq_egg",
      label: "quả trứng tròn",
      image: {
        kind: "emoji",
        ref: "🥚",
      },
      category: {
        type: "bước đầu tiên",
      },
      contrast_group: "animal",
      value: 1,
      ordering: 5,
      audio_path: "/audio/vi/c4/seq_egg.mp3",
    },
    {
      id: "seq_hatch",
      label: "trứng nứt vỏ",
      image: {
        kind: "emoji",
        ref: "🐣",
      },
      category: {
        type: "bước phát triển",
      },
      contrast_group: "animal",
      value: 2,
      ordering: 6,
      audio_path: "/audio/vi/c4/seq_hatch.mp3",
    },
    {
      id: "seq_chick",
      label: "gà con xinh",
      image: {
        kind: "emoji",
        ref: "🐥",
      },
      category: {
        type: "bước phát triển",
      },
      contrast_group: "animal",
      value: 3,
      ordering: 7,
      audio_path: "/audio/vi/c4/seq_chick.mp3",
    },
    {
      id: "seq_hen",
      label: "gà mẹ lớn",
      image: {
        kind: "emoji",
        ref: "🐔",
      },
      category: {
        type: "kết quả cuối",
      },
      contrast_group: "animal",
      value: 4,
      ordering: 8,
      audio_path: "/audio/vi/c4/seq_hen.mp3",
    },
  ],
  relations: [
    {
      type: "sequence",
      source_id: "seq_seed",
      target_id: "seq_sprout",
    },
    {
      type: "sequence",
      source_id: "seq_sprout",
      target_id: "seq_flower",
    },
    {
      type: "sequence",
      source_id: "seq_flower",
      target_id: "seq_fruit",
    },
    {
      type: "sequence",
      source_id: "seq_egg",
      target_id: "seq_hatch",
    },
    {
      type: "sequence",
      source_id: "seq_hatch",
      target_id: "seq_chick",
    },
    {
      type: "sequence",
      source_id: "seq_chick",
      target_id: "seq_hen",
    },
  ],
  axes: {
    step_seq: {
      values: ["bước đầu tiên", "bước phát triển", "kết quả cuối"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Chuỗi nhân quả hai bước",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Chuỗi nhân quả hai bước",
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
      "Chúng mình cùng tìm hiểu về Chuỗi nhân quả hai bước nhé",
  },
  ordering: [
    "seq_seed",
    "seq_sprout",
    "seq_flower",
    "seq_fruit",
    "seq_egg",
    "seq_hatch",
    "seq_chick",
    "seq_hen",
  ],
};

export const C4_CAU_05_SEED: SkillSeed = {
  identity: C4_CAU_05_IDENTITY,
  dataset: C4_CAU_05_DATASET,
  levels: [
    {
      code: "GL-C4-CAU-SHAD-0009",
      template: "GT-007",
      band: "5-6",
      difficulty: 4,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C4-CAU-SLOT-0001",
      template: "GT-008",
      band: "5-6",
      difficulty: 4,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C4-CAU-SIZE-0009",
      template: "GT-009",
      band: "5-6",
      difficulty: 4,
      theme: "art",
      rounds: 3,
    },
  ],
};
