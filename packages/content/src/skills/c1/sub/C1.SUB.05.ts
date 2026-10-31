import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_SUB_05_IDENTITY: SkillIdentity = {
  code: "C1.SUB.05",
  strand_code: "C1.SUB",
  competency_code: "C1",
  name: "Tìm số còn lại",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["infer", "solve"],
  tier: "advanced",
  prerequisites: ["C1.SUB.01", "C1.NCOMP.09"],
  learning_objectives: [
    {
      code: "LO-C1.SUB.05-01",
      behaviour: "Nhận biết và thực hành Tìm số còn lại ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.SUB.05-02",
      behaviour: "Vận dụng Tìm số còn lại trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.SUB.05-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Tìm số còn lại",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_SUB_05_DATASET: SkillDataset = {
  skill_code: "C1.SUB.05",
  concept_label: "Tìm số còn lại",
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
        ref: "🎁",
      },
      contrast_group: "remain_qty",
      category: {
        type: "đồ chơi vận động",
      },
    },
    {
      id: "n1",
      label: "quả bóng bay",
      glyph: "1",
      value: 1,
      audio_path: "/audio/voice/common/numbers/1.mp3",
      image: {
        kind: "emoji",
        ref: "🎈",
      },
      contrast_group: "remain_qty",
      category: {
        type: "đồ chơi vận động",
      },
    },
    {
      id: "n2",
      label: "chiếc diều giấy",
      glyph: "2",
      value: 2,
      audio_path: "/audio/voice/common/numbers/2.mp3",
      image: {
        kind: "emoji",
        ref: "🪁",
      },
      contrast_group: "remain_qty",
      category: {
        type: "đồ chơi vận động",
      },
    },
    {
      id: "n3",
      label: "con quay yoyo",
      glyph: "3",
      value: 3,
      audio_path: "/audio/voice/common/numbers/3.mp3",
      image: {
        kind: "emoji",
        ref: "🪀",
      },
      contrast_group: "remain_qty",
      category: {
        type: "đồ chơi vận động",
      },
    },
    {
      id: "n4",
      label: "chú gấu bông",
      glyph: "4",
      value: 4,
      audio_path: "/audio/voice/common/numbers/4.mp3",
      image: {
        kind: "emoji",
        ref: "🧸",
      },
      contrast_group: "remain_qty",
      category: {
        type: "đồ chơi vận động",
      },
    },
    {
      id: "n5",
      label: "đoàn tàu hoả",
      glyph: "5",
      value: 5,
      audio_path: "/audio/voice/common/numbers/5.mp3",
      image: {
        kind: "emoji",
        ref: "🚂",
      },
      contrast_group: "remain_qty",
      category: {
        type: "đồ chơi vận động",
      },
    },
    {
      id: "n6",
      label: "chiếc trống nhỏ",
      glyph: "6",
      value: 6,
      audio_path: "/audio/voice/common/numbers/6.mp3",
      image: {
        kind: "emoji",
        ref: "🥁",
      },
      contrast_group: "remain_qty",
      category: {
        type: "đồ chơi âm nhạc",
      },
    },
    {
      id: "n7",
      label: "cây đàn ghi ta",
      glyph: "7",
      value: 7,
      audio_path: "/audio/voice/common/numbers/7.mp3",
      image: {
        kind: "emoji",
        ref: "🎸",
      },
      contrast_group: "remain_qty",
      category: {
        type: "đồ chơi âm nhạc",
      },
    },
    {
      id: "n8",
      label: "chiếc kèn tây",
      glyph: "8",
      value: 8,
      audio_path: "/audio/voice/common/numbers/8.mp3",
      image: {
        kind: "emoji",
        ref: "🎺",
      },
      contrast_group: "remain_qty",
      category: {
        type: "đồ chơi âm nhạc",
      },
    },
    {
      id: "n9",
      label: "bảng màu vẽ",
      glyph: "9",
      value: 9,
      audio_path: "/audio/voice/common/numbers/9.mp3",
      image: {
        kind: "emoji",
        ref: "🎨",
      },
      contrast_group: "remain_qty",
      category: {
        type: "đồ chơi âm nhạc",
      },
    },
    {
      id: "n10",
      label: "bộ xếp hình",
      glyph: "10",
      value: 10,
      audio_path: "/audio/voice/common/numbers/10.mp3",
      image: {
        kind: "emoji",
        ref: "🧩",
      },
      contrast_group: "remain_qty",
      category: {
        type: "đồ chơi âm nhạc",
      },
    },
    {
      id: "wb13_evidence_cabinet",
      label: "tủ chứng cứ",
      value: 10,
      image: {
        kind: "emoji",
        ref: "🗄️",
      },
    },
    {
      id: "wb13_cipher_bar",
      label: "thanh mật mã",
      value: 10,
      image: {
        kind: "emoji",
        ref: "🗝️",
      },
    },
  ],
  relations: [
    {
      type: "subset",
      source_id: "n0",
      target_id: "n10",
      metadata: {
        bond_id: "bond_10_0_10",
        part_a: 0,
        part_b: 10,
        whole: 10,
      },
    },
    {
      type: "subset",
      source_id: "n1",
      target_id: "n10",
      metadata: {
        bond_id: "bond_10_1_9",
        part_a: 1,
        part_b: 9,
        whole: 10,
      },
    },
    {
      type: "subset",
      source_id: "n2",
      target_id: "n10",
      metadata: {
        bond_id: "bond_10_2_8",
        part_a: 2,
        part_b: 8,
        whole: 10,
      },
    },
    {
      type: "subset",
      source_id: "n3",
      target_id: "n10",
      metadata: {
        bond_id: "bond_10_3_7",
        part_a: 3,
        part_b: 7,
        whole: 10,
      },
    },
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
    {
      type: "subset",
      source_id: "n5",
      target_id: "n10",
      metadata: {
        bond_id: "bond_10_5_5",
        part_a: 5,
        part_b: 5,
        whole: 10,
      },
    },
    {
      type: "subset",
      source_id: "n6",
      target_id: "n10",
      metadata: {
        bond_id: "bond_10_6_4",
        part_a: 6,
        part_b: 4,
        whole: 10,
      },
    },
    {
      type: "subset",
      source_id: "n7",
      target_id: "n10",
      metadata: {
        bond_id: "bond_10_7_3",
        part_a: 7,
        part_b: 3,
        whole: 10,
      },
    },
    {
      type: "subset",
      source_id: "n8",
      target_id: "n10",
      metadata: {
        bond_id: "bond_10_8_2",
        part_a: 8,
        part_b: 2,
        whole: 10,
      },
    },
    {
      type: "subset",
      source_id: "n9",
      target_id: "n10",
      metadata: {
        bond_id: "bond_10_9_1",
        part_a: 9,
        part_b: 1,
        whole: 10,
      },
    },
  ],
  axes: {
    type: {
      values: ["đồ chơi vận động", "đồ chơi âm nhạc"],
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với tìm số còn lại",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng tìm số còn lại",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt tìm số còn lại với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi tìm số còn lại",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục tìm số còn lại và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn đúng {label} nhé!",
    narration_template: "Chúng mình cùng tìm hiểu về Tìm số còn lại nhé!",
  },
  ordering: [
    "n0",
    "n1",
    "n2",
    "n3",
    "n4",
    "n5",
    "n6",
    "n7",
    "n8",
    "n9",
    "n10",
    "wb13_evidence_cabinet",
    "wb13_cipher_bar",
  ],
};

export const C1_SUB_05_SEED: SkillSeed = {
  identity: C1_SUB_05_IDENTITY,
  dataset: C1_SUB_05_DATASET,
  levels: [
    {
      code: "GL-C1-HNT-TAP-0009",
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-HNT-TAP-0010",
      template: "GT-001",
      band: "5-6",
      difficulty: 1,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-PAIR-0001",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-SLOT-0205",
      template: "GT-008",
      band: "5-6",
      difficulty: 3,
      access_tier: "standard",
      theme: "job",
      rounds: 3,
      montessori_ref: "WB13-D2",
    },
    {
      code: "GL-C1-SUB-BOND-0201",
      template: "GT-007",
      band: "5-6",
      difficulty: 4,
      access_tier: "premium",
      theme: "job",
      rounds: 3,
      montessori_ref: "WB13-D3",
    },
  ],
};
