import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_OBS_04_IDENTITY: SkillIdentity = {
  code: "C4.OBS.04",
  strand_code: "C4.OBS",
  competency_code: "C4",
  name: "Ghi lại bằng hình vẽ",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["observe", "create"],
  tier: "core",
  prerequisites: ["C4.OBS.01"],
  learning_objectives: [
    {
      code: "LO-C4.OBS.04-01",
      behaviour: "Nhận biết và thực hành Ghi lại bằng hình vẽ ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.OBS.04-02",
      behaviour: "Vận dụng Ghi lại bằng hình vẽ trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.OBS.04-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Ghi lại bằng hình vẽ",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_OBS_04_DATASET: SkillDataset = {
  skill_code: "C4.OBS.04",
  concept_label: "Ghi lại bằng hình vẽ",
  surface: "game",
  items: [
    {
      id: "leaf",
      label: "chiếc lá xanh",
      image: {
        kind: "emoji",
        ref: "🍃",
      },
      category: {
        type: "mẫu quan sát",
      },
      value: 1,
      ordering: 1,
      contrast_group: "specimen",
      audio_path: "/audio/vi/c4/leaf.mp3",
    },
    {
      id: "flower",
      label: "bông hoa nở",
      image: {
        kind: "emoji",
        ref: "🌸",
      },
      category: {
        type: "mẫu quan sát",
      },
      value: 2,
      ordering: 2,
      contrast_group: "specimen",
      audio_path: "/audio/vi/c4/flower.mp3",
    },
    {
      id: "ladybug",
      label: "chú bọ rùa",
      image: {
        kind: "emoji",
        ref: "🐞",
      },
      category: {
        type: "mẫu quan sát",
      },
      value: 3,
      ordering: 3,
      contrast_group: "specimen",
      audio_path: "/audio/vi/c4/ladybug.mp3",
    },
    {
      id: "shell",
      label: "vỏ sò biển",
      image: {
        kind: "emoji",
        ref: "🐚",
      },
      category: {
        type: "mẫu quan sát",
      },
      value: 4,
      ordering: 4,
      contrast_group: "specimen",
      audio_path: "/audio/vi/c4/shell.mp3",
    },
    {
      id: "crayons",
      label: "bút sáp màu",
      image: {
        kind: "emoji",
        ref: "🖍️",
      },
      category: {
        type: "dụng cụ vẽ",
      },
      value: 1,
      ordering: 5,
      contrast_group: "tool",
      audio_path: "/audio/vi/c4/crayons.mp3",
    },
    {
      id: "pencil",
      label: "chiếc bút chì",
      image: {
        kind: "emoji",
        ref: "✏️",
      },
      category: {
        type: "dụng cụ vẽ",
      },
      value: 2,
      ordering: 6,
      contrast_group: "tool",
      audio_path: "/audio/vi/c4/pencil.mp3",
    },
    {
      id: "sketchbook",
      label: "sổ vẽ tranh",
      image: {
        kind: "emoji",
        ref: "📓",
      },
      category: {
        type: "dụng cụ vẽ",
      },
      value: 3,
      ordering: 7,
      contrast_group: "tool",
      audio_path: "/audio/vi/c4/sketchbook.mp3",
    },
    {
      id: "palette",
      label: "bảng pha màu",
      image: {
        kind: "emoji",
        ref: "🎨",
      },
      category: {
        type: "dụng cụ vẽ",
      },
      value: 4,
      ordering: 8,
      contrast_group: "tool",
      audio_path: "/audio/vi/c4/palette.mp3",
    },
  ],
  axes: {
    category: {
      values: ["mẫu quan sát", "dụng cụ vẽ"],
    },
  },
  relations: [
    {
      type: "pair",
      source_id: "leaf",
      target_id: "crayons",
    },
    {
      type: "pair",
      source_id: "flower",
      target_id: "pencil",
    },
    {
      type: "pair",
      source_id: "ladybug",
      target_id: "sketchbook",
    },
    {
      type: "pair",
      source_id: "shell",
      target_id: "palette",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Ghi lại bằng hình vẽ",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Ghi lại bằng hình vẽ",
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
    narration_template: "Chúng mình cùng tìm hiểu về Ghi lại bằng hình vẽ nhé",
  },
  ordering: [
    "leaf",
    "flower",
    "ladybug",
    "shell",
    "crayons",
    "pencil",
    "sketchbook",
    "palette",
  ],
};

export const C4_OBS_04_SEED: SkillSeed = {
  identity: C4_OBS_04_IDENTITY,
  dataset: C4_OBS_04_DATASET,
  levels: [
    {
      code: "GL-C4-OBS-TAP-0007",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C4-OBS-TAP-0008",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C4-OBS-TCNT-0005",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
  ],
};
