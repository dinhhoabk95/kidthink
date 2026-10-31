import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_PAT_08_IDENTITY: SkillIdentity = {
  code: "C1.PAT.08",
  strand_code: "C1.PAT",
  competency_code: "C1",
  name: "Quy luật số",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["infer"],
  tier: "advanced",
  prerequisites: ["C1.NREC.09", "C1.PAT.01"],
  learning_objectives: [
    {
      code: "LO-C1.PAT.08-01",
      behaviour: "Nhận biết và thực hành Pattern số ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.PAT.08-02",
      behaviour: "Vận dụng Pattern số trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.PAT.08-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Pattern số",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_PAT_08_DATASET: SkillDataset = {
  skill_code: "C1.PAT.08",
  concept_label: "Quy luật số",
  surface: "game",
  items: [
    {
      id: "pat_n2",
      label: "hai chú gà con",
      glyph: "2",
      value: 2,
      audio_path: "/audio/voice/common/numbers/2.mp3",
      image: {
        kind: "emoji",
        ref: "🐣",
      },
      contrast_group: "even_small",
      category: {
        type: "số chẵn nhỏ",
        value: "2",
      },
    },
    {
      id: "pat_n4",
      label: "bốn chú thỏ trắng",
      glyph: "4",
      value: 4,
      audio_path: "/audio/voice/common/numbers/4.mp3",
      image: {
        kind: "emoji",
        ref: "🐰",
      },
      contrast_group: "even_small",
      category: {
        type: "số chẵn nhỏ",
        value: "4",
      },
    },
    {
      id: "pat_n6",
      label: "sáu chú cún con",
      glyph: "6",
      value: 6,
      audio_path: "/audio/voice/common/numbers/6.mp3",
      image: {
        kind: "emoji",
        ref: "🐶",
      },
      contrast_group: "even_small",
      category: {
        type: "số chẵn nhỏ",
        value: "6",
      },
    },
    {
      id: "pat_n8",
      label: "tám chú mèo nhỏ",
      glyph: "8",
      value: 8,
      audio_path: "/audio/voice/common/numbers/8.mp3",
      image: {
        kind: "emoji",
        ref: "🐱",
      },
      contrast_group: "even_large",
      category: {
        type: "số chẵn lớn",
        value: "8",
      },
    },
    {
      id: "pat_n10",
      label: "mười chú lợn hồng",
      glyph: "10",
      value: 10,
      audio_path: "/audio/voice/common/numbers/10.mp3",
      image: {
        kind: "emoji",
        ref: "🐷",
      },
      contrast_group: "even_large",
      category: {
        type: "số chẵn lớn",
        value: "10",
      },
    },
    {
      id: "pat_n12",
      label: "mười hai chú cừu",
      glyph: "12",
      value: 12,
      audio_path: "/audio/voice/common/numbers/12.mp3",
      image: {
        kind: "emoji",
        ref: "🐑",
      },
      contrast_group: "even_large",
      category: {
        type: "số chẵn lớn",
        value: "12",
      },
    },
  ],
  relations: [
    {
      type: "subset",
      source_id: "pat_n2",
      target_id: "pat_n4",
      metadata: {
        rule: "plus_two",
      },
    },
    {
      type: "subset",
      source_id: "pat_n4",
      target_id: "pat_n6",
      metadata: {
        rule: "plus_two",
      },
    },
    {
      type: "subset",
      source_id: "pat_n6",
      target_id: "pat_n8",
      metadata: {
        rule: "plus_two",
      },
    },
    {
      type: "subset",
      source_id: "pat_n8",
      target_id: "pat_n10",
      metadata: {
        rule: "plus_two",
      },
    },
    {
      type: "subset",
      source_id: "pat_n10",
      target_id: "pat_n12",
      metadata: {
        rule: "plus_two",
      },
    },
  ],
  axes: {
    value: {
      values: ["2", "4", "6", "8", "10", "12"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với quy luật số",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng quy luật số",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt quy luật số với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi quy luật số",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục quy luật số và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn đúng {label} nhé!",
    narration_template: "Chúng mình cùng tìm hiểu về Quy luật số nhé!",
  },
  ordering: ["pat_n2", "pat_n4", "pat_n6", "pat_n8", "pat_n10", "pat_n12"],
};

export const C1_PAT_08_SEED: SkillSeed = {
  identity: C1_PAT_08_IDENTITY,
  dataset: C1_PAT_08_DATASET,
  levels: [
    {
      code: "GL-C1-PAT-FCR-0006",
      template: "GT-036",
      band: "5-6",
      difficulty: 3,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-FCR-0009",
      template: "GT-036",
      band: "5-6",
      difficulty: 4,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C3-GAP-SLOT-0005",
      template: "GT-008",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
  ],
};
