import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C3_SEQ_04_IDENTITY: SkillIdentity = {
  code: "C3.SEQ.04",
  strand_code: "C3.SEQ",
  competency_code: "C3",
  name: "Chuỗi câu chuyện",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["sequence", "infer"],
  tier: "advanced",
  prerequisites: ["C3.SEQ.03"],
  learning_objectives: [
    {
      code: "LO-C3.SEQ.04-01",
      behaviour: "Nhận biết và thực hành Chuỗi câu chuyện ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C3.SEQ.04-02",
      behaviour: "Vận dụng Chuỗi câu chuyện trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C3.SEQ.04-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Chuỗi câu chuyện",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C3_SEQ_04_DATASET: SkillDataset = {
  skill_code: "C3.SEQ.04",
  concept_label: "Chuỗi câu chuyện",
  surface: "game",
  items: [
    {
      id: "story_nest",
      label: "chim làm tổ",
      image: {
        kind: "emoji",
        ref: "🪺",
      },
      category: {
        type: "chim mẹ ấp",
        color: "yellow",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "story_begin",
      value: 1,
      ordering: 1,
    },
    {
      id: "story_egg",
      label: "chim đẻ trứng",
      image: {
        kind: "emoji",
        ref: "🥚",
      },
      category: {
        type: "chim mẹ ấp",
        color: "white",
        shape: "circle",
        size: "small",
      },
      contrast_group: "story_begin",
      value: 2,
      ordering: 2,
    },
    {
      id: "story_warm",
      label: "chim ấp trứng",
      image: {
        kind: "emoji",
        ref: "🐦",
      },
      category: {
        type: "chim mẹ ấp",
        color: "yellow",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "story_begin",
      value: 3,
      ordering: 3,
    },
    {
      id: "story_hatch",
      label: "chim non nở",
      image: {
        kind: "emoji",
        ref: "🐣",
      },
      category: {
        type: "chim non lớn",
        color: "yellow",
        shape: "circle",
        size: "small",
      },
      contrast_group: "story_end",
      value: 4,
      ordering: 4,
    },
    {
      id: "story_baby",
      label: "chim non hót",
      image: {
        kind: "emoji",
        ref: "🐥",
      },
      category: {
        type: "chim non lớn",
        color: "blue",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "story_end",
      value: 5,
      ordering: 5,
    },
    {
      id: "story_fly",
      label: "chim tập bay",
      image: {
        kind: "emoji",
        ref: "🦅",
      },
      category: {
        type: "chim non lớn",
        color: "blue",
        shape: "triangle",
        size: "medium",
      },
      contrast_group: "story_end",
      value: 6,
      ordering: 6,
    },
  ],
  relations: [
    {
      type: "sequence",
      source_id: "story_nest",
      target_id: "story_egg",
      explanation: "chim làm tổ rồi đẻ quả trứng",
    },
    {
      type: "sequence",
      source_id: "story_egg",
      target_id: "story_warm",
      explanation: "chim đẻ trứng rồi ấp trứng ấm",
    },
    {
      type: "sequence",
      source_id: "story_warm",
      target_id: "story_hatch",
      explanation: "chim ấp trứng rồi chim non nở",
    },
    {
      type: "sequence",
      source_id: "story_hatch",
      target_id: "story_baby",
      explanation: "chim non nở ra hót líu lo",
    },
    {
      type: "sequence",
      source_id: "story_baby",
      target_id: "story_fly",
      explanation: "chim non lớn lên tập bay vút",
    },
  ],
  axes: {
    type: ["chim mẹ ấp", "chim non lớn"],
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với chuỗi câu chuyện",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng chuỗi câu chuyện",
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
      "Chúng mình cùng sắp xếp các tình tiết của câu chuyện nhé",
  },
  ordering: [
    "story_nest",
    "story_egg",
    "story_warm",
    "story_hatch",
    "story_baby",
    "story_fly",
  ],
};

export const C3_SEQ_04_SEED: SkillSeed = {
  identity: C3_SEQ_04_IDENTITY,
  dataset: C3_SEQ_04_DATASET,
  levels: [
    {
      code: "GL-C3-SEQ-WEAVE-0001",
      template: "GT-033",
      band: "5-6",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C3-SEQ-WEAVE-0002",
      template: "GT-033",
      band: "5-6",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C3-SEQ-WEAVE-0003",
      template: "GT-033",
      band: "5-6",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C3-SEQ-WEAVE-0004",
      template: "GT-033",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C3-SEQ-FCR-0001",
      template: "GT-036",
      band: "5-6",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C3-SEQ-FCR-0002",
      template: "GT-036",
      band: "5-6",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C3-SEQ-FCR-0003",
      template: "GT-036",
      band: "5-6",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
  ],
};
