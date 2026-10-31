import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_VIS_04_IDENTITY: SkillIdentity = {
  code: "C4.VIS.04",
  strand_code: "C4.VIS",
  competency_code: "C4",
  name: "Tìm hình bị che một phần",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["observe", "infer"],
  tier: "advanced",
  prerequisites: ["C4.VIS.03"],
  learning_objectives: [
    {
      code: "LO-C4.VIS.04-01",
      behaviour: "Nhận biết và thực hành Tìm hình bị che một phần ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.VIS.04-02",
      behaviour: "Vận dụng Tìm hình bị che một phần trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.VIS.04-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Tìm hình bị che một phần",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_VIS_04_DATASET: SkillDataset = {
  skill_code: "C4.VIS.04",
  concept_label: "Tìm hình bị che một phần",
  surface: "game",
  items: [
    {
      id: "cat",
      label: "chú mèo con",
      image: {
        kind: "emoji",
        ref: "🐱",
      },
      category: {
        type: "vật nuôi quen",
      },
      value: 1,
      ordering: 1,
      contrast_group: "pet",
      audio_path: "/audio/vi/c4/cat.mp3",
    },
    {
      id: "dog",
      label: "chú cún con",
      image: {
        kind: "emoji",
        ref: "🐶",
      },
      category: {
        type: "vật nuôi quen",
      },
      value: 2,
      ordering: 2,
      contrast_group: "pet",
      audio_path: "/audio/vi/c4/dog.mp3",
    },
    {
      id: "rabbit",
      label: "chú thỏ trắng",
      image: {
        kind: "emoji",
        ref: "🐰",
      },
      category: {
        type: "vật nuôi quen",
      },
      value: 3,
      ordering: 3,
      contrast_group: "pet",
      audio_path: "/audio/vi/c4/rabbit.mp3",
    },
    {
      id: "rooster",
      label: "chú gà trống",
      image: {
        kind: "emoji",
        ref: "🐔",
      },
      category: {
        type: "vật nuôi quen",
      },
      value: 4,
      ordering: 4,
      contrast_group: "pet",
      audio_path: "/audio/vi/c4/rooster.mp3",
    },
    {
      id: "elephant",
      label: "chú voi to",
      image: {
        kind: "emoji",
        ref: "🐘",
      },
      category: {
        type: "thú hoang dã",
      },
      value: 1,
      ordering: 5,
      contrast_group: "wild",
      audio_path: "/audio/vi/c4/elephant.mp3",
    },
    {
      id: "giraffe",
      label: "chú hươu cao",
      image: {
        kind: "emoji",
        ref: "🦒",
      },
      category: {
        type: "thú hoang dã",
      },
      value: 2,
      ordering: 6,
      contrast_group: "wild",
      audio_path: "/audio/vi/c4/giraffe.mp3",
    },
    {
      id: "zebra",
      label: "ngựa vằn sọc",
      image: {
        kind: "emoji",
        ref: "🦓",
      },
      category: {
        type: "thú hoang dã",
      },
      value: 3,
      ordering: 7,
      contrast_group: "wild",
      audio_path: "/audio/vi/c4/zebra.mp3",
    },
    {
      id: "lion",
      label: "chú sư tử",
      image: {
        kind: "emoji",
        ref: "🦁",
      },
      category: {
        type: "thú hoang dã",
      },
      value: 4,
      ordering: 8,
      contrast_group: "wild",
      audio_path: "/audio/vi/c4/lion.mp3",
    },
  ],
  axes: {
    category: {
      values: ["vật nuôi quen", "thú hoang dã"],
    },
  },
  relations: [
    {
      type: "contrast",
      source_id: "cat",
      target_id: "elephant",
    },
    {
      type: "contrast",
      source_id: "dog",
      target_id: "giraffe",
    },
    {
      type: "contrast",
      source_id: "rabbit",
      target_id: "zebra",
    },
    {
      type: "contrast",
      source_id: "rooster",
      target_id: "lion",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Tìm hình bị che một phần",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Tìm hình bị che một phần",
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
      "Chúng mình cùng tìm hiểu về Tìm hình bị che một phần nhé",
  },
  ordering: [
    "cat",
    "dog",
    "rabbit",
    "rooster",
    "elephant",
    "giraffe",
    "zebra",
    "lion",
  ],
};

export const C4_VIS_04_SEED: SkillSeed = {
  identity: C4_VIS_04_IDENTITY,
  dataset: C4_VIS_04_DATASET,
  levels: [
    {
      code: "GL-C4-OBS-CARD-0003",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C4-DIF-CMP-0007",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C4-HID-OBJ-0001",
      template: "GT-022",
      band: "4-5",
      difficulty: 1,
      theme: "farm",
      rounds: 3,
    },
  ],
};
