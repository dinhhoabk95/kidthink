import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_GRD_02_IDENTITY: SkillIdentity = {
  code: "C2.GRD.02",
  strand_code: "C2.GRD",
  competency_code: "C2",
  name: "Đi theo ô",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["plan", "sequence"],
  tier: "core",
  prerequisites: ["C2.GRD.01", "C2.DIR.05"],
  learning_objectives: [
    {
      code: "LO-C2.GRD.02-01",
      behaviour: "Nhận biết và thực hành Đi theo ô ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.GRD.02-02",
      behaviour: "Vận dụng Đi theo ô trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.GRD.02-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Đi theo ô",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_GRD_02_DATASET: SkillDataset = {
  skill_code: "C2.GRD.02",
  concept_label: "Đi theo ô",
  surface: "game",
  items: [
    {
      id: "station_bench",
      label: "ghế nghỉ công viên",
      image: {
        kind: "emoji",
        ref: "🪑",
      },
      category: {
        type: "trạm dừng",
      },
      contrast_group: "station",
      value: 1,
      ordering: 1,
    },
    {
      id: "station_fountain",
      label: "đài phun nước",
      image: {
        kind: "emoji",
        ref: "⛲",
      },
      category: {
        type: "trạm dừng",
      },
      contrast_group: "station",
      value: 2,
      ordering: 2,
    },
    {
      id: "station_flower",
      label: "bồn hoa rực rỡ",
      image: {
        kind: "emoji",
        ref: "🌷",
      },
      category: {
        type: "trạm dừng",
      },
      contrast_group: "station",
      value: 3,
      ordering: 3,
    },
    {
      id: "station_gate",
      label: "cổng vòm hoa",
      image: {
        kind: "emoji",
        ref: "⛩️",
      },
      category: {
        type: "trạm dừng",
      },
      contrast_group: "station",
      value: 4,
      ordering: 4,
    },
    {
      id: "guide_arrow_up",
      label: "mũi tên tiến thẳng",
      image: {
        kind: "emoji",
        ref: "⬆️",
      },
      category: {
        type: "chỉ dẫn ô",
      },
      contrast_group: "guide",
      value: 5,
      ordering: 5,
    },
    {
      id: "guide_arrow_right",
      label: "mũi tên rẽ phải",
      image: {
        kind: "emoji",
        ref: "➡️",
      },
      category: {
        type: "chỉ dẫn ô",
      },
      contrast_group: "guide",
      value: 6,
      ordering: 6,
    },
    {
      id: "guide_footprint",
      label: "dấu chân bước đi",
      image: {
        kind: "emoji",
        ref: "👣",
      },
      category: {
        type: "chỉ dẫn ô",
      },
      contrast_group: "guide",
      value: 7,
      ordering: 7,
    },
    {
      id: "guide_compass",
      label: "la bàn dẫn hướng",
      image: {
        kind: "emoji",
        ref: "🧭",
      },
      category: {
        type: "chỉ dẫn ô",
      },
      contrast_group: "guide",
      value: 8,
      ordering: 8,
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "station_bench",
      target_id: "guide_arrow_up",
    },
    {
      type: "pair",
      source_id: "station_fountain",
      target_id: "guide_arrow_right",
    },
    {
      type: "pair",
      source_id: "station_flower",
      target_id: "guide_footprint",
    },
    {
      type: "pair",
      source_id: "station_gate",
      target_id: "guide_compass",
    },
    {
      type: "contrast",
      source_id: "station_bench",
      target_id: "guide_arrow_up",
    },
  ],
  axes: {
    category: {
      values: ["trạm dừng", "chỉ dẫn ô"],
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
      description: "Làm quen cơ bản với Đi theo ô",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Đi theo ô",
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
    narration_template: "Chúng mình cùng tìm hiểu về Đi theo ô nhé",
  },
  ordering: [
    "station_bench",
    "station_fountain",
    "station_flower",
    "station_gate",
    "guide_arrow_up",
    "guide_arrow_right",
    "guide_footprint",
    "guide_compass",
  ],
};

export const C2_GRD_02_SEED: SkillSeed = {
  identity: C2_GRD_02_IDENTITY,
  dataset: C2_GRD_02_DATASET,
  levels: [
    {
      code: "GL-C2-GRD-SORT-0001",
      template: "GT-006",
      band: "5-6",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C2-GRD-SORT-0002",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C2-GRD-SHAD-0001",
      template: "GT-007",
      band: "4-5",
      difficulty: 2,
      theme: "home",
      rounds: 3,
    },
  ],
};
