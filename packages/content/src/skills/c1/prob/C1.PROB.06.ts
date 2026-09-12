import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_PROB_06_IDENTITY: SkillIdentity = {
  code: "C1.PROB.06",
  strand_code: "C1.PROB",
  competency_code: "C1",
  name: "Suy luận số",
  age_min: 6,
  age_max: 6,
  difficulty: 5,
  thinking_processes: ["infer", "deduce"],
  tier: "advanced",
  prerequisites: ["C1.NCOMP.12"],
  learning_objectives: [
    {
      code: "LO-C1.PROB.06-01",
      behaviour: "Nhận biết và thực hành Suy luận số ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.PROB.06-02",
      behaviour: "Vận dụng Suy luận số trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.PROB.06-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Suy luận số",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_PROB_06_DATASET: SkillDataset = {
  skill_code: "C1.PROB.06",
  concept_label: "Suy luận số",
  surface: "game",
  items: [
    {
      id: "clue_small",
      label: "gợi ý: số nhỏ hơn năm",
      image: {
        kind: "emoji",
        ref: "🔍",
      },
      contrast_group: "clue",
    },
    {
      id: "clue_odd",
      label: "gợi ý: số lẻ",
      image: {
        kind: "emoji",
        ref: "🔎",
      },
      contrast_group: "clue",
    },
    {
      id: "answer_three",
      label: "số ba",
      glyph: "3",
      value: 3,
      audio_path: "/audio/voice/common/numbers/3.mp3",
      image: {
        kind: "emoji",
        ref: "3️⃣",
      },
      contrast_group: "answer",
      category: {
        range: "nhỏ hơn năm",
        parity: "lẻ",
      },
    },
    {
      id: "distractor_four",
      label: "số bốn",
      glyph: "4",
      value: 4,
      audio_path: "/audio/voice/common/numbers/4.mp3",
      image: {
        kind: "emoji",
        ref: "4️⃣",
      },
      contrast_group: "distractor",
      category: {
        range: "nhỏ hơn năm",
        parity: "chẵn",
      },
    },
    {
      id: "distractor_seven",
      label: "số bảy",
      glyph: "7",
      value: 7,
      audio_path: "/audio/voice/common/numbers/7.mp3",
      image: {
        kind: "emoji",
        ref: "7️⃣",
      },
      contrast_group: "distractor",
      category: {
        range: "từ năm trở lên",
        parity: "lẻ",
      },
    },
  ],
  relations: [
    {
      type: "subset",
      source_id: "answer_three",
      target_id: "clue_small",
      metadata: {
        property: "less_than_five",
      },
    },
    {
      type: "subset",
      source_id: "answer_three",
      target_id: "clue_odd",
      metadata: {
        property: "is_odd",
      },
    },
    {
      type: "contrast",
      source_id: "answer_three",
      target_id: "distractor_four",
      metadata: {
        dimension: "parity",
      },
    },
    {
      type: "contrast",
      source_id: "answer_three",
      target_id: "distractor_seven",
      metadata: {
        dimension: "range",
      },
    },
  ],
  axes: {
    range: {
      values: ["nhỏ hơn năm", "từ năm trở lên"],
      ordered: true,
    },
    parity: {
      values: ["lẻ", "chẵn"],
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với suy luận số",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng suy luận số",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt suy luận số với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi suy luận số",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục suy luận số và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy giải bài toán tìm {label} nhé!",
    narration_template: "Chúng mình cùng tìm hiểu về Suy luận số nhé",
  },
};

export const C1_PROB_06_SEED: SkillSeed = {
  identity: C1_PROB_06_IDENTITY,
  dataset: C1_PROB_06_DATASET,
  levels: [
    {
      code: "GL-C1-PROB-BAL-0001",
      template: "GT-004",
      band: "5-6",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-BAL-0002",
      template: "GT-007",
      band: "5-6",
      difficulty: 4,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-PAIR-0009",
      template: "GT-004",
      band: "5-6",
      difficulty: 4,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-PAIR-0010",
      template: "GT-004",
      band: "5-6",
      difficulty: 5,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-PAIR-0011",
      template: "GT-004",
      band: "5-6",
      difficulty: 4,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-SORT-0005",
      template: "GT-006",
      band: "5-6",
      difficulty: 4,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-SORT-0006",
      template: "GT-006",
      band: "5-6",
      difficulty: 5,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-SORT-0007",
      template: "GT-006",
      band: "5-6",
      difficulty: 4,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-SORT-0008",
      template: "GT-006",
      band: "5-6",
      difficulty: 5,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-SHAD-0004",
      template: "GT-007",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-SHAD-0005",
      template: "GT-007",
      band: "5-6",
      difficulty: 5,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-SHAD-0006",
      template: "GT-007",
      band: "5-6",
      difficulty: 4,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-SIZE-0005",
      template: "GT-009",
      band: "5-6",
      difficulty: 4,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-SIZE-0006",
      template: "GT-009",
      band: "5-6",
      difficulty: 5,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-SIZE-0007",
      template: "GT-009",
      band: "5-6",
      difficulty: 4,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-SIZE-0008",
      template: "GT-009",
      band: "5-6",
      difficulty: 5,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-PUZZ-0001",
      template: "GT-010",
      band: "5-6",
      difficulty: 4,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-PUZZ-0002",
      template: "GT-010",
      band: "5-6",
      difficulty: 5,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-PUZZ-0003",
      template: "GT-010",
      band: "5-6",
      difficulty: 4,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-PUZZ-0004",
      template: "GT-010",
      band: "5-6",
      difficulty: 5,
      theme: "body",
      rounds: 3,
    },
  ],
};
