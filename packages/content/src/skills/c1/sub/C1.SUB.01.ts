import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_SUB_01_IDENTITY: SkillIdentity = {
  code: "C1.SUB.01",
  strand_code: "C1.SUB",
  competency_code: "C1",
  name: "Bớt đồ vật",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["count", "solve"],
  tier: "basic",
  prerequisites: ["C1.CNT.01"],
  learning_objectives: [
    {
      code: "LO-C1.SUB.01-01",
      behaviour: "Nhận biết và thực hành Bớt đồ vật ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.SUB.01-02",
      behaviour: "Vận dụng Bớt đồ vật trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.SUB.01-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Bớt đồ vật",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_SUB_01_DATASET: SkillDataset = {
  skill_code: "C1.SUB.01",
  concept_label: "Bớt đồ vật",
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
        ref: "🧺",
      },
      contrast_group: "fruit_sub",
      category: {
        type: "kết quả nhỏ",
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
        ref: "🍎",
      },
      contrast_group: "fruit_sub",
      category: {
        type: "kết quả nhỏ",
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
        ref: "🍊",
      },
      contrast_group: "fruit_sub",
      category: {
        type: "kết quả nhỏ",
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
        ref: "🍓",
      },
      contrast_group: "fruit_sub",
      category: {
        type: "kết quả lớn",
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
        ref: "🍐",
      },
      contrast_group: "fruit_sub",
      category: {
        type: "kết quả lớn",
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
        ref: "🍑",
      },
      contrast_group: "fruit_sub",
      category: {
        type: "kết quả lớn",
      },
    },
  ],
  relations: [
    {
      type: "subset",
      source_id: "n0",
      target_id: "n5",
      metadata: {
        bond_id: "bond_5_0_5",
        part_a: 0,
        part_b: 5,
        whole: 5,
      },
    },
    {
      type: "subset",
      source_id: "n1",
      target_id: "n5",
      metadata: {
        bond_id: "bond_5_1_4",
        part_a: 1,
        part_b: 4,
        whole: 5,
      },
    },
    {
      type: "subset",
      source_id: "n2",
      target_id: "n5",
      metadata: {
        bond_id: "bond_5_2_3",
        part_a: 2,
        part_b: 3,
        whole: 5,
      },
    },
    {
      type: "subset",
      source_id: "n3",
      target_id: "n5",
      metadata: {
        bond_id: "bond_5_3_2",
        part_a: 3,
        part_b: 2,
        whole: 5,
      },
    },
    {
      type: "subset",
      source_id: "n4",
      target_id: "n5",
      metadata: {
        bond_id: "bond_5_4_1",
        part_a: 4,
        part_b: 1,
        whole: 5,
      },
    },
  ],
  axes: {
    type: {
      values: ["kết quả nhỏ", "kết quả lớn"],
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với bớt đồ vật",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng bớt đồ vật",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt bớt đồ vật với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi bớt đồ vật",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục bớt đồ vật và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn đúng {label} nhé!",
    narration_template: "Chúng mình cùng tìm hiểu về Bớt đồ vật nhé!",
  },
  ordering: ["n0", "n1", "n2", "n3", "n4", "n5"],
};

export const C1_SUB_01_SEED: SkillSeed = {
  identity: C1_SUB_01_IDENTITY,
  dataset: C1_SUB_01_DATASET,
  levels: [
    {
      code: "GL-C1-SUB-TAP-0001",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-TAP-0002",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-TCNT-0001",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
  ],
};
