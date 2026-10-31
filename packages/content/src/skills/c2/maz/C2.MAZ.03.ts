import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_MAZ_03_IDENTITY: SkillIdentity = {
  code: "C2.MAZ.03",
  strand_code: "C2.MAZ",
  competency_code: "C2",
  name: "Tìm đường ngắn nhất",
  age_min: 5,
  age_max: 6,
  difficulty: 5,
  thinking_processes: ["plan", "compare"],
  tier: "advanced",
  prerequisites: ["C2.MAZ.02", "C1.CNT.01"],
  learning_objectives: [
    {
      code: "LO-C2.MAZ.03-01",
      behaviour: "Nhận biết và thực hành Tìm đường ngắn nhất ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.MAZ.03-02",
      behaviour: "Vận dụng Tìm đường ngắn nhất trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.MAZ.03-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Tìm đường ngắn nhất",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_MAZ_03_DATASET: SkillDataset = {
  skill_code: "C2.MAZ.03",
  concept_label: "Tìm đường ngắn nhất",
  surface: "game",
  items: [
    {
      id: "short_straight",
      label: "đường thẳng đi nhanh",
      image: {
        kind: "emoji",
        ref: "⚡",
      },
      category: {
        type: "đoạn đường ngắn",
      },
      contrast_group: "short_path",
      value: 1,
      ordering: 1,
    },
    {
      id: "short_tunnel",
      label: "hầm chui xuyên núi",
      image: {
        kind: "emoji",
        ref: "🚇",
      },
      category: {
        type: "đoạn đường ngắn",
      },
      contrast_group: "short_path",
      value: 2,
      ordering: 2,
    },
    {
      id: "short_bridge",
      label: "cầu tắt qua sông",
      image: {
        kind: "emoji",
        ref: "🌉",
      },
      category: {
        type: "đoạn đường ngắn",
      },
      contrast_group: "short_path",
      value: 3,
      ordering: 3,
    },
    {
      id: "short_steps",
      label: "bậc thang dẫn thẳng",
      image: {
        kind: "emoji",
        ref: "🪜",
      },
      category: {
        type: "đoạn đường ngắn",
      },
      contrast_group: "short_path",
      value: 4,
      ordering: 4,
    },
    {
      id: "long_winding",
      label: "đường đèo quanh co",
      image: {
        kind: "emoji",
        ref: "〰️",
      },
      category: {
        type: "đoạn đường dài",
      },
      contrast_group: "long_path",
      value: 5,
      ordering: 5,
    },
    {
      id: "long_loop",
      label: "vòng tròn uốn lượn",
      image: {
        kind: "emoji",
        ref: "🔄",
      },
      category: {
        type: "đoạn đường dài",
      },
      contrast_group: "long_path",
      value: 6,
      ordering: 6,
    },
    {
      id: "long_detour",
      label: "lối đi vòng rừng",
      image: {
        kind: "emoji",
        ref: "🌲",
      },
      category: {
        type: "đoạn đường dài",
      },
      contrast_group: "long_path",
      value: 7,
      ordering: 7,
    },
    {
      id: "long_maze",
      label: "đoạn cua khúc khuỷu",
      image: {
        kind: "emoji",
        ref: "🐍",
      },
      category: {
        type: "đoạn đường dài",
      },
      contrast_group: "long_path",
      value: 8,
      ordering: 8,
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "short_straight",
      target_id: "long_winding",
    },
    {
      type: "pair",
      source_id: "short_tunnel",
      target_id: "long_loop",
    },
    {
      type: "pair",
      source_id: "short_bridge",
      target_id: "long_detour",
    },
    {
      type: "pair",
      source_id: "short_steps",
      target_id: "long_maze",
    },
    {
      type: "contrast",
      source_id: "short_straight",
      target_id: "long_winding",
    },
  ],
  axes: {
    category: {
      values: ["đoạn đường ngắn", "đoạn đường dài"],
    },
    length: {
      values: ["ngắn", "dài"],
      ordered: true,
    },
    order: {
      values: ["1", "2", "3", "4", "5", "6", "7", "8"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Tìm đường ngắn nhất",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Tìm đường ngắn nhất",
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
    narration_template: "Chúng mình cùng tìm hiểu về Tìm đường ngắn nhất nhé",
  },
  ordering: [
    "short_straight",
    "short_tunnel",
    "short_bridge",
    "short_steps",
    "long_winding",
    "long_loop",
    "long_detour",
    "long_maze",
  ],
};

export const C2_MAZ_03_SEED: SkillSeed = {
  identity: C2_MAZ_03_IDENTITY,
  dataset: C2_MAZ_03_DATASET,
  levels: [
    {
      code: "GL-C2-MAZ-LOG-0006",
      template: "GT-013",
      band: "5-6",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C2-MAZ-PATT-0001",
      template: "GT-005",
      band: "5-6",
      difficulty: 4,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C2-MAZ-PATT-0002",
      template: "GT-005",
      band: "5-6",
      difficulty: 5,
      theme: "festival",
      rounds: 3,
    },
  ],
};
