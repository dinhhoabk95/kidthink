import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_PER_03_IDENTITY: SkillIdentity = {
  code: "C2.PER.03",
  strand_code: "C2.PER",
  competency_code: "C2",
  name: "Nhìn từ trên xuống",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["infer", "predict"],
  tier: "advanced",
  prerequisites: ["C2.PER.01"],
  learning_objectives: [
    {
      code: "LO-C2.PER.03-01",
      behaviour: "Nhận biết và thực hành Nhìn từ trên xuống ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.PER.03-02",
      behaviour: "Vận dụng Nhìn từ trên xuống trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.PER.03-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Nhìn từ trên xuống",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_PER_03_DATASET: SkillDataset = {
  skill_code: "C2.PER.03",
  concept_label: "Nhìn từ trên xuống",
  surface: "game",
  items: [
    {
      id: "umbrella_top",
      label: "chiếc dù xòe từ trên",
      value: 1,
      image: {
        kind: "emoji",
        ref: "☂️",
      },
      category: {
        type: "nhìn từ trên",
      },
      contrast_group: "top_view",
    },
    {
      id: "hat_top",
      label: "chiếc mũ nhìn từ trên",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🎩",
      },
      category: {
        type: "nhìn từ trên",
      },
      contrast_group: "top_view",
    },
    {
      id: "cake_top",
      label: "bánh kem nhìn từ trên",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🎂",
      },
      category: {
        type: "nhìn từ trên",
      },
      contrast_group: "top_view",
    },
    {
      id: "donut_top",
      label: "bánh vòng nhìn từ trên",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🍩",
      },
      category: {
        type: "nhìn từ trên",
      },
      contrast_group: "top_view",
    },
    {
      id: "tree_side",
      label: "cây thông nhìn ngang",
      value: 5,
      image: {
        kind: "emoji",
        ref: "🌲",
      },
      category: {
        type: "góc nhìn khác",
      },
      contrast_group: "other_view",
    },
    {
      id: "house_side",
      label: "ngôi nhà nhìn ngang",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🏠",
      },
      category: {
        type: "góc nhìn khác",
      },
      contrast_group: "other_view",
    },
    {
      id: "car_side",
      label: "xe ô tô nhìn ngang",
      value: 7,
      image: {
        kind: "emoji",
        ref: "🚗",
      },
      category: {
        type: "góc nhìn khác",
      },
      contrast_group: "other_view",
    },
    {
      id: "chair_side",
      label: "chiếc ghế nhìn ngang",
      value: 8,
      image: {
        kind: "emoji",
        ref: "🪑",
      },
      category: {
        type: "góc nhìn khác",
      },
      contrast_group: "other_view",
    },
    {
      id: "top_view_cube_tower",
      label: "tháp lập phương từ trên cao",
      value: 9,
      image: {
        kind: "emoji",
        ref: "🏢",
      },
      category: {
        type: "nhìn từ trên",
      },
      contrast_group: "top_view",
    },
    {
      id: "wireframe_cube_rods",
      label: "khung que lập phương 3D",
      value: 10,
      image: {
        kind: "emoji",
        ref: "📦",
      },
      category: {
        type: "nhìn từ trên",
      },
      contrast_group: "top_view",
    },
    {
      id: "origami_plane_wings",
      label: "máy bay giấy nhìn từ đỉnh",
      value: 11,
      image: {
        kind: "emoji",
        ref: "✈️",
      },
      category: {
        type: "nhìn từ trên",
      },
      contrast_group: "top_view",
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "umbrella_top",
      target_id: "tree_side",
      metadata: {
        dimension: "perspective",
      },
    },
    {
      type: "contrast",
      source_id: "hat_top",
      target_id: "house_side",
      metadata: {
        dimension: "perspective",
      },
    },
    {
      type: "pair",
      source_id: "umbrella_top",
      target_id: "hat_top",
      metadata: {
        relation: "cùng nhìn trên",
      },
    },
    {
      type: "pair",
      source_id: "tree_side",
      target_id: "house_side",
      metadata: {
        relation: "cùng nhìn khác",
      },
    },
    {
      type: "pair",
      source_id: "top_view_cube_tower",
      target_id: "wireframe_cube_rods",
      metadata: {
        relation: "cùng nhìn từ trên xuống",
      },
    },
  ],
  axes: {
    perspective: {
      values: ["nhìn từ trên", "góc nhìn khác"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Nhìn từ trên xuống",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nhìn từ trên xuống",
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
    narration_template: "Chúng mình cùng tìm hiểu về Nhìn từ trên xuống nhé",
  },
  ordering: [
    "umbrella_top",
    "hat_top",
    "cake_top",
    "donut_top",
    "tree_side",
    "house_side",
    "car_side",
    "chair_side",
    "top_view_cube_tower",
    "wireframe_cube_rods",
    "origami_plane_wings",
  ],
};

export const C2_PER_03_SEED: SkillSeed = {
  identity: C2_PER_03_IDENTITY,
  dataset: C2_PER_03_DATASET,
  levels: [
    {
      code: "GL-C2-PER-MATCH-0104",
      template: "GT-005",
      band: "5-6",
      difficulty: 4,
      theme: "nature",
      rounds: 3,
      montessori_ref: "WB19-D2",
    },
    {
      code: "GL-C2-PER-BLD-0001",
      template: "GT-023",
      band: "5-6",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C2-PER-BLD-0002",
      template: "GT-023",
      band: "5-6",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C2-PER-TAP-0287",
      template: "GT-001",
      band: "5-6",
      difficulty: 1,
      access_tier: "free",
      theme: "school",
      rounds: 3,
      montessori_ref: "WB21-D3",
    },
    {
      code: "GL-C2-PER-TAP-0288",
      template: "GT-001",
      band: "5-6",
      difficulty: 2,
      access_tier: "login",
      theme: "home",
      rounds: 3,
      montessori_ref: "WB21-D3",
    },
    {
      code: "GL-C2-PER-TAP-0289",
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      access_tier: "standard",
      theme: "nature",
      rounds: 3,
      montessori_ref: "WB21-D3",
    },
  ],
};
