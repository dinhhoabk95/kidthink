import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_SUB_02_IDENTITY: SkillIdentity = {
  code: "C1.SUB.02",
  strand_code: "C1.SUB",
  competency_code: "C1",
  name: "Bớt hình",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["solve"],
  tier: "core",
  prerequisites: ["C1.SUB.01"],
  learning_objectives: [
    {
      code: "LO-C1.SUB.02-01",
      behaviour: "Nhận biết và thực hành Bớt hình ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.SUB.02-02",
      behaviour: "Vận dụng Bớt hình trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.SUB.02-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Bớt hình",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_SUB_02_DATASET: SkillDataset = {
  skill_code: "C1.SUB.02",
  concept_label: "Bớt hình",
  surface: "game",
  items: [
    {
      id: "n0",
      label: "số 0",
      glyph: "0",
      value: 0,
      audio_path: "/audio/voice/common/numbers/0.mp3",
      image: {
        kind: "emoji",
        ref: "🌊",
      },
      contrast_group: "sea_sub",
      category: {
        type: "nhóm cá",
      },
    },
    {
      id: "n1",
      label: "số một",
      glyph: "1",
      value: 1,
      audio_path: "/audio/voice/common/numbers/1.mp3",
      image: {
        kind: "emoji",
        ref: "🐟",
      },
      contrast_group: "sea_sub",
      category: {
        type: "nhóm cá",
      },
    },
    {
      id: "n2",
      label: "số hai",
      glyph: "2",
      value: 2,
      audio_path: "/audio/voice/common/numbers/2.mp3",
      image: {
        kind: "emoji",
        ref: "🐠",
      },
      contrast_group: "sea_sub",
      category: {
        type: "nhóm cá",
      },
    },
    {
      id: "n3",
      label: "số ba",
      glyph: "3",
      value: 3,
      audio_path: "/audio/voice/common/numbers/3.mp3",
      image: {
        kind: "emoji",
        ref: "🐡",
      },
      contrast_group: "sea_sub",
      category: {
        type: "nhóm cá",
      },
    },
    {
      id: "n4",
      label: "số bốn",
      glyph: "4",
      value: 4,
      audio_path: "/audio/voice/common/numbers/4.mp3",
      image: {
        kind: "emoji",
        ref: "🐬",
      },
      contrast_group: "sea_sub",
      category: {
        type: "nhóm cá",
      },
    },
    {
      id: "n5",
      label: "số năm",
      glyph: "5",
      value: 5,
      audio_path: "/audio/voice/common/numbers/5.mp3",
      image: {
        kind: "emoji",
        ref: "🐳",
      },
      contrast_group: "sea_sub",
      category: {
        type: "bạn biển khác",
      },
    },
    {
      id: "n6",
      label: "số sáu",
      glyph: "6",
      value: 6,
      audio_path: "/audio/voice/common/numbers/6.mp3",
      image: {
        kind: "emoji",
        ref: "🐙",
      },
      contrast_group: "sea_sub",
      category: {
        type: "bạn biển khác",
      },
    },
    {
      id: "n7",
      label: "số bảy",
      glyph: "7",
      value: 7,
      audio_path: "/audio/voice/common/numbers/7.mp3",
      image: {
        kind: "emoji",
        ref: "🦀",
      },
      contrast_group: "sea_sub",
      category: {
        type: "bạn biển khác",
      },
    },
    {
      id: "n8",
      label: "số tám",
      glyph: "8",
      value: 8,
      audio_path: "/audio/voice/common/numbers/8.mp3",
      image: {
        kind: "emoji",
        ref: "🐢",
      },
      contrast_group: "sea_sub",
      category: {
        type: "bạn biển khác",
      },
    },
    {
      id: "n9",
      label: "số chín",
      glyph: "9",
      value: 9,
      audio_path: "/audio/voice/common/numbers/9.mp3",
      image: {
        kind: "emoji",
        ref: "🦞",
      },
      contrast_group: "sea_sub",
      category: {
        type: "bạn biển khác",
      },
    },
    {
      id: "n10",
      label: "số mười",
      glyph: "10",
      value: 10,
      audio_path: "/audio/voice/common/numbers/10.mp3",
      image: {
        kind: "emoji",
        ref: "🐚",
      },
      contrast_group: "sea_sub",
      category: {
        type: "bạn biển khác",
      },
    },
  ],
  relations: [
    {
      type: "subset",
      source_id: "n0",
      target_id: "n8",
      metadata: {
        bond_id: "bond_8_0_8",
        part_a: 0,
        part_b: 8,
        whole: 8,
      },
    },
    {
      type: "subset",
      source_id: "n1",
      target_id: "n8",
      metadata: {
        bond_id: "bond_8_1_7",
        part_a: 1,
        part_b: 7,
        whole: 8,
      },
    },
    {
      type: "subset",
      source_id: "n2",
      target_id: "n8",
      metadata: {
        bond_id: "bond_8_2_6",
        part_a: 2,
        part_b: 6,
        whole: 8,
      },
    },
    {
      type: "subset",
      source_id: "n3",
      target_id: "n8",
      metadata: {
        bond_id: "bond_8_3_5",
        part_a: 3,
        part_b: 5,
        whole: 8,
      },
    },
    {
      type: "subset",
      source_id: "n4",
      target_id: "n8",
      metadata: {
        bond_id: "bond_8_4_4",
        part_a: 4,
        part_b: 4,
        whole: 8,
      },
    },
    {
      type: "subset",
      source_id: "n5",
      target_id: "n8",
      metadata: {
        bond_id: "bond_8_5_3",
        part_a: 5,
        part_b: 3,
        whole: 8,
      },
    },
    {
      type: "subset",
      source_id: "n6",
      target_id: "n8",
      metadata: {
        bond_id: "bond_8_6_2",
        part_a: 6,
        part_b: 2,
        whole: 8,
      },
    },
    {
      type: "subset",
      source_id: "n7",
      target_id: "n8",
      metadata: {
        bond_id: "bond_8_7_1",
        part_a: 7,
        part_b: 1,
        whole: 8,
      },
    },
  ],
  axes: {
    type: {
      values: ["nhóm cá", "bạn biển khác"],
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với bớt hình",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng bớt hình",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt bớt hình với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi bớt hình",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục bớt hình và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn đúng {label} nhé!",
    narration_template: "Chúng mình cùng tìm hiểu về Bớt hình nhé!",
  },
  ordering: ["n0", "n1", "n2", "n3", "n4", "n5", "n6", "n7", "n8", "n9", "n10"],
};

export const C1_SUB_02_SEED: SkillSeed = {
  identity: C1_SUB_02_IDENTITY,
  dataset: C1_SUB_02_DATASET,
  levels: [
    {
      template: "GT-000",
      band: "5-6",
      difficulty: 1,
      theme: "school",
    },
    {
      code: "GL-C1-SUB-PICT-0001",
      template: "GT-031",
      band: "5-6",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-PICT-0002",
      template: "GT-031",
      band: "5-6",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-PICT-0004",
      template: "GT-031",
      band: "5-6",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
    },
    {
      template: "GT-001",
      band: "5-6",
      difficulty: 1,
      theme: "school",
    },
    {
      template: "GT-001",
      band: "5-6",
      difficulty: 2,
      theme: "home",
    },
  ],
};
