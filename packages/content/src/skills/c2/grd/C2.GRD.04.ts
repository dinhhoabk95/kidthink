import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_GRD_04_IDENTITY: SkillIdentity = {
  code: "C2.GRD.04",
  strand_code: "C2.GRD",
  competency_code: "C2",
  name: "Sơ đồ lưới của lớp học",
  age_min: 5,
  age_max: 6,
  difficulty: 4,
  thinking_processes: ["infer", "plan"],
  tier: "advanced",
  prerequisites: ["C2.GRD.03", "C2.DIR.06"],
  learning_objectives: [
    {
      code: "LO-C2.GRD.04-01",
      behaviour: "Nhận biết và thực hành Sơ đồ lưới của lớp học ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.GRD.04-02",
      behaviour: "Vận dụng Sơ đồ lưới của lớp học trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.GRD.04-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Sơ đồ lưới của lớp học",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_GRD_04_DATASET: SkillDataset = {
  skill_code: "C2.GRD.04",
  concept_label: "Sơ đồ lưới của lớp học",
  surface: "game",
  items: [
    {
      id: "blackboard_board",
      label: "bảng phấn lớp học",
      image: {
        kind: "emoji",
        ref: "🖼️",
      },
      category: {
        type: "khu vực lớp",
      },
      contrast_group: "zone",
      value: 1,
      ordering: 1,
    },
    {
      id: "bookshelf_zone",
      label: "góc giá sách",
      image: {
        kind: "emoji",
        ref: "📚",
      },
      category: {
        type: "khu vực lớp",
      },
      contrast_group: "zone",
      value: 2,
      ordering: 2,
    },
    {
      id: "door_zone",
      label: "cửa ra vào",
      image: {
        kind: "emoji",
        ref: "🚪",
      },
      category: {
        type: "khu vực lớp",
      },
      contrast_group: "zone",
      value: 3,
      ordering: 3,
    },
    {
      id: "window_zone",
      label: "cửa sổ đón nắng",
      image: {
        kind: "emoji",
        ref: "🪟",
      },
      category: {
        type: "khu vực lớp",
      },
      contrast_group: "zone",
      value: 4,
      ordering: 4,
    },
    {
      id: "desk_student",
      label: "bàn học sinh",
      image: {
        kind: "emoji",
        ref: "🪑",
      },
      category: {
        type: "đồ vật lớp",
      },
      contrast_group: "item",
      value: 5,
      ordering: 5,
    },
    {
      id: "clock_wall",
      label: "đồng hồ treo tường",
      image: {
        kind: "emoji",
        ref: "⏰",
      },
      category: {
        type: "đồ vật lớp",
      },
      contrast_group: "item",
      value: 6,
      ordering: 6,
    },
    {
      id: "globe_table",
      label: "quả địa cầu",
      image: {
        kind: "emoji",
        ref: "🌍",
      },
      category: {
        type: "đồ vật lớp",
      },
      contrast_group: "item",
      value: 7,
      ordering: 7,
    },
    {
      id: "bin_corner",
      label: "thùng rác góc phòng",
      image: {
        kind: "emoji",
        ref: "🗑️",
      },
      category: {
        type: "đồ vật lớp",
      },
      contrast_group: "item",
      value: 8,
      ordering: 8,
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "blackboard_board",
      target_id: "desk_student",
    },
    {
      type: "pair",
      source_id: "bookshelf_zone",
      target_id: "clock_wall",
    },
    {
      type: "pair",
      source_id: "door_zone",
      target_id: "globe_table",
    },
    {
      type: "pair",
      source_id: "window_zone",
      target_id: "bin_corner",
    },
    {
      type: "contrast",
      source_id: "blackboard_board",
      target_id: "desk_student",
    },
  ],
  axes: {
    category: {
      values: ["khu vực lớp", "đồ vật lớp"],
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
      description: "Làm quen cơ bản với Sơ đồ lưới của lớp học",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Sơ đồ lưới của lớp học",
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
      "Chúng mình cùng tìm hiểu về Sơ đồ lưới của lớp học nhé",
  },
  ordering: [
    "blackboard_board",
    "bookshelf_zone",
    "door_zone",
    "window_zone",
    "desk_student",
    "clock_wall",
    "globe_table",
    "bin_corner",
  ],
};

export const C2_GRD_04_SEED: SkillSeed = {
  identity: C2_GRD_04_IDENTITY,
  dataset: C2_GRD_04_DATASET,
  levels: [
    {
      code: "GL-C2-GRD-PAIR-0006",
      template: "GT-004",
      band: "5-6",
      difficulty: 4,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C2-GRD-SIZE-0003",
      template: "GT-009",
      band: "5-6",
      difficulty: 3,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C2-GRD-PUZZ-0001",
      template: "GT-010",
      band: "5-6",
      difficulty: 3,
      theme: "weather",
      rounds: 3,
    },
  ],
};
