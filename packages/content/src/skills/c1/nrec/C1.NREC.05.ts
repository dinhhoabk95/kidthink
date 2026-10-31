import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_NREC_05_IDENTITY: SkillIdentity = {
  code: "C1.NREC.05",
  strand_code: "C1.NREC",
  competency_code: "C1",
  name: "Ghép số với lượng",
  age_min: 3,
  age_max: 3,
  difficulty: 2,
  thinking_processes: ["match"],
  tier: "basic",
  prerequisites: ["C1.NREC.02", "C1.CNT.01"],
  learning_objectives: [
    {
      code: "LO-C1.NREC.05-01",
      behaviour: "Nhận biết và thực hành Ghép số với lượng ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.NREC.05-02",
      behaviour: "Vận dụng Ghép số với lượng trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.NREC.05-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Ghép số với lượng",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_NREC_05_DATASET: SkillDataset = {
  skill_code: "C1.NREC.05",
  concept_label: "Ghép số với lượng",
  surface: "game",
  items: [
    {
      id: "n1",
      label: "nhóm 1 mặt trời rực rỡ",
      glyph: "1",
      value: 1,
      audio_path: "/audio/voice/common/numbers/1.mp3",
      image: {
        kind: "emoji",
        ref: "☀️",
      },
      category: {
        type: "số và lượng",
      },
      contrast_group: "space_nature",
    },
    {
      id: "n2",
      label: "nhóm 2 đám mây trắng",
      glyph: "2",
      value: 2,
      audio_path: "/audio/voice/common/numbers/2.mp3",
      image: {
        kind: "emoji",
        ref: "☁️",
      },
      category: {
        type: "số và lượng",
      },
      contrast_group: "space_nature",
    },
    {
      id: "n3",
      label: "nhóm 3 hành tinh xanh",
      glyph: "3",
      value: 3,
      audio_path: "/audio/voice/common/numbers/3.mp3",
      image: {
        kind: "emoji",
        ref: "🪐",
      },
      category: {
        type: "số và lượng",
      },
      contrast_group: "space_nature",
    },
    {
      id: "n4",
      label: "nhóm 4 tên lửa vũ trụ",
      glyph: "4",
      value: 4,
      audio_path: "/audio/voice/common/numbers/4.mp3",
      image: {
        kind: "emoji",
        ref: "🚀",
      },
      category: {
        type: "số và lượng",
      },
      contrast_group: "space_nature",
    },
    {
      id: "n5",
      label: "nhóm 5 ngôi sao vàng",
      glyph: "5",
      value: 5,
      audio_path: "/audio/voice/common/numbers/5.mp3",
      image: {
        kind: "emoji",
        ref: "⭐",
      },
      category: {
        type: "số và lượng",
      },
      contrast_group: "space_nature",
    },
    {
      id: "n6",
      label: "nhóm 6 quả bóng bay đỏ",
      glyph: "6",
      value: 6,
      audio_path: "/audio/voice/common/numbers/6.mp3",
      image: {
        kind: "emoji",
        ref: "🎈",
      },
      category: {
        type: "số và lượng",
      },
      contrast_group: "space_nature",
    },
    {
      id: "n7",
      label: "nhóm 7 chiếc lá xanh",
      glyph: "7",
      value: 7,
      audio_path: "/audio/voice/common/numbers/7.mp3",
      image: {
        kind: "emoji",
        ref: "🍃",
      },
      category: {
        type: "số và lượng",
      },
      contrast_group: "space_nature",
    },
    {
      id: "n8",
      label: "nhóm 8 chú cá sắc màu",
      glyph: "8",
      value: 8,
      audio_path: "/audio/voice/common/numbers/8.mp3",
      image: {
        kind: "emoji",
        ref: "🐟",
      },
      category: {
        type: "số và lượng",
      },
      contrast_group: "space_nature",
    },
    {
      id: "n9",
      label: "nhóm 9 bông hoa nở",
      glyph: "9",
      value: 9,
      audio_path: "/audio/voice/common/numbers/9.mp3",
      image: {
        kind: "emoji",
        ref: "🌸",
      },
      category: {
        type: "số và lượng",
      },
      contrast_group: "space_nature",
    },
    {
      id: "n10",
      label: "nhóm 10 quả cam mọng",
      glyph: "10",
      value: 10,
      audio_path: "/audio/voice/common/numbers/10.mp3",
      image: {
        kind: "emoji",
        ref: "🍊",
      },
      category: {
        type: "số và lượng",
      },
      contrast_group: "space_nature",
    },
  ],
  relations: [
    { type: "sequence", source_id: "n1", target_id: "n2" },
    { type: "sequence", source_id: "n2", target_id: "n3" },
    { type: "sequence", source_id: "n3", target_id: "n4" },
    { type: "sequence", source_id: "n4", target_id: "n5" },
    { type: "sequence", source_id: "n5", target_id: "n6" },
    { type: "sequence", source_id: "n6", target_id: "n7" },
    { type: "sequence", source_id: "n7", target_id: "n8" },
    { type: "sequence", source_id: "n8", target_id: "n9" },
    { type: "sequence", source_id: "n9", target_id: "n10" },
  ],
  axes: {
    role: {
      values: ["số và lượng"],
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Kéo dán thẻ lượng vũ trụ phạm vi 1–5",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Kéo dán thẻ lượng thiên nhiên phạm vi 6–10",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt ghép số với lượng với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi ghép số với lượng",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục ghép số với lượng và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy kéo dán thẻ hình {label} vào đúng ô số nhé!",
    narration_template:
      "Gấu Logic nhắc: Đếm thật chậm và kỹ từng đồ vật trước khi kéo vào ô nhé!",
  },
  ordering: ["n1", "n2", "n3", "n4", "n5", "n6", "n7", "n8", "n9", "n10"],
};

export const C1_NREC_05_SEED: SkillSeed = {
  identity: C1_NREC_05_IDENTITY,
  dataset: C1_NREC_05_DATASET,
  levels: [
    {
      code: "GL-C1-NREC-SLOT-0105",
      template: "GT-008",
      band: "3-4",
      difficulty: 1,
      access_tier: "free",
      theme: "space",
      rounds: 2,
      montessori_ref: "WB01-D3",
    },
    {
      code: "GL-C1-NREC-SLOT-0106",
      template: "GT-008",
      band: "4-5",
      difficulty: 2,
      access_tier: "login",
      theme: "nature",
      rounds: 2,
      montessori_ref: "WB01-D3",
    },
    {
      code: "GL-C1-CMP-NUM-0010",
      template: "GT-012",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-NUM-0013",
      template: "GT-012",
      band: "4-5",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-NREC-GRID-0001",
      template: "GT-020",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
  ],
};
