import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_ADD_06_IDENTITY: SkillIdentity = {
  code: "C1.ADD.06",
  strand_code: "C1.ADD",
  competency_code: "C1",
  name: "Cộng nhẩm đơn giản",
  age_min: 5,
  age_max: 6,
  difficulty: 5,
  thinking_processes: ["recall", "solve"],
  tier: "advanced",
  prerequisites: ["C1.ADD.05", "C1.NCOMP.12"],
  learning_objectives: [
    {
      code: "LO-C1.ADD.06-01",
      behaviour: "Nhận biết và thực hành Cộng nhẩm đơn giản ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.ADD.06-02",
      behaviour: "Vận dụng Cộng nhẩm đơn giản trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.ADD.06-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Cộng nhẩm đơn giản",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_ADD_06_DATASET: SkillDataset = {
  skill_code: "C1.ADD.06",
  concept_label: "Cộng nhẩm đơn giản",
  surface: "game",
  items: [
    {
      id: "n0",
      label: "số 0",
      glyph: "0",
      value: 0,
      contrast_group: "quantity",
      ordering: 0,
      audio_path: "/audio/voice/common/numbers/0.mp3",
      category: {
        type: "phép cộng nhẩm",
      },
      image: {
        kind: "emoji",
        ref: "🎒",
      },
    },
    {
      id: "n1",
      label: "số một",
      glyph: "1",
      value: 1,
      contrast_group: "quantity",
      ordering: 1,
      audio_path: "/audio/voice/common/numbers/1.mp3",
      category: {
        type: "phép cộng nhẩm",
      },
      image: {
        kind: "emoji",
        ref: "✏️",
      },
    },
    {
      id: "n2",
      label: "số hai",
      glyph: "2",
      value: 2,
      contrast_group: "quantity",
      ordering: 2,
      audio_path: "/audio/voice/common/numbers/2.mp3",
      category: {
        type: "phép cộng nhẩm",
      },
      image: {
        kind: "emoji",
        ref: "📏",
      },
    },
    {
      id: "n3",
      label: "số ba",
      glyph: "3",
      value: 3,
      contrast_group: "quantity",
      ordering: 3,
      audio_path: "/audio/voice/common/numbers/3.mp3",
      category: {
        type: "phép cộng nhẩm",
      },
      image: {
        kind: "emoji",
        ref: "✂️",
      },
    },
    {
      id: "n4",
      label: "số bốn",
      glyph: "4",
      value: 4,
      contrast_group: "quantity",
      ordering: 4,
      audio_path: "/audio/voice/common/numbers/4.mp3",
      category: {
        type: "phép cộng nhẩm",
      },
      image: {
        kind: "emoji",
        ref: "🖍️",
      },
    },
    {
      id: "n5",
      label: "số năm",
      glyph: "5",
      value: 5,
      contrast_group: "quantity",
      ordering: 5,
      audio_path: "/audio/voice/common/numbers/5.mp3",
      category: {
        type: "phép cộng nhẩm",
      },
      image: {
        kind: "emoji",
        ref: "📐",
      },
    },
    {
      id: "n6",
      label: "số sáu",
      glyph: "6",
      value: 6,
      contrast_group: "quantity",
      ordering: 6,
      audio_path: "/audio/voice/common/numbers/6.mp3",
      category: {
        type: "phép cộng nhẩm",
      },
      image: {
        kind: "emoji",
        ref: "📎",
      },
    },
    {
      id: "n7",
      label: "số bảy",
      glyph: "7",
      value: 7,
      contrast_group: "quantity",
      ordering: 7,
      audio_path: "/audio/voice/common/numbers/7.mp3",
      category: {
        type: "phép cộng nhẩm",
      },
      image: {
        kind: "emoji",
        ref: "🖌️",
      },
    },
    {
      id: "n8",
      label: "số tám",
      glyph: "8",
      value: 8,
      contrast_group: "quantity",
      ordering: 8,
      audio_path: "/audio/voice/common/numbers/8.mp3",
      category: {
        type: "phép cộng nhẩm",
      },
      image: {
        kind: "emoji",
        ref: "📕",
      },
    },
    {
      id: "n9",
      label: "số chín",
      glyph: "9",
      value: 9,
      contrast_group: "quantity",
      ordering: 9,
      audio_path: "/audio/voice/common/numbers/9.mp3",
      category: {
        type: "phép cộng nhẩm",
      },
      image: {
        kind: "emoji",
        ref: "📗",
      },
    },
    {
      id: "n10",
      label: "số mười",
      glyph: "10",
      value: 10,
      contrast_group: "quantity",
      ordering: 10,
      audio_path: "/audio/voice/common/numbers/10.mp3",
      category: {
        type: "phép cộng nhẩm",
      },
      image: {
        kind: "emoji",
        ref: "📘",
      },
    },
  ],
  relations: [
    {
      type: "subset",
      source_id: "n4",
      target_id: "n10",
      metadata: {
        bond_id: "bond_10_4_6",
        part_a: 4,
        part_b: 6,
        whole: 10,
      },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với cộng nhẩm đơn giản",
      representation: "discrete-object",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng cộng nhẩm đơn giản",
      representation: "discrete-object",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt cộng nhẩm đơn giản với phương án nhiễu",
      representation: "ten-frame",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi cộng nhẩm đơn giản",
      representation: "ten-frame",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục cộng nhẩm đơn giản và tự làm một mình",
      representation: "ten-frame",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn {label} nhé!",
    narration_template:
      "Chúng mình cùng làm quen với phép cộng nhẩm đơn giản nhé",
  },
  ordering: ["n0", "n1", "n2", "n3", "n4", "n5", "n6", "n7", "n8", "n9", "n10"],
};

export const C1_ADD_06_SEED: SkillSeed = {
  identity: C1_ADD_06_IDENTITY,
  dataset: C1_ADD_06_DATASET,
  levels: [
    {
      code: "GL-C1-HNT-TAP-0007",
      template: "GT-001",
      band: "4-5",
      difficulty: 1,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C1-HNT-TAP-0008",
      template: "GT-001",
      band: "5-6",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-SIZE-0001",
      template: "GT-009",
      band: "5-6",
      difficulty: 4,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-PUZZ-0001",
      template: "GT-010",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-BOND-0005",
      template: "GT-018",
      band: "5-6",
      difficulty: 4,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-TAP-0020",
      template: "GT-028",
      band: "5-6",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-TAP-0021",
      template: "GT-028",
      band: "5-6",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
  ],
};
