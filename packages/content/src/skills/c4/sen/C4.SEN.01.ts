import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_SEN_01_IDENTITY: SkillIdentity = {
  code: "C4.SEN.01",
  strand_code: "C4.SEN",
  competency_code: "C4",
  name: "Phân biệt sắc độ màu",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["compare", "observe"],
  tier: "core",
  prerequisites: ["C4.DET.01"],
  learning_objectives: [
    {
      code: "LO-C4.SEN.01-01",
      behaviour: "Nhận biết và thực hành Phân biệt sắc độ màu ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.SEN.01-02",
      behaviour: "Vận dụng Phân biệt sắc độ màu trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.SEN.01-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Phân biệt sắc độ màu",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_SEN_01_DATASET: SkillDataset = {
  skill_code: "C4.SEN.01",
  concept_label: "Phân biệt sắc độ màu",
  surface: "game",
  items: [
    {
      id: "pure_white",
      label: "màu trắng tinh",
      image: {
        kind: "emoji",
        ref: "⚪",
      },
      category: {
        type: "sắc màu sáng",
      },
      value: 1,
      ordering: 1,
      contrast_group: "light",
      audio_path: "/audio/vi/c4/pure_white.mp3",
    },
    {
      id: "bright_yellow",
      label: "màu vàng tươi",
      image: {
        kind: "emoji",
        ref: "🟡",
      },
      category: {
        type: "sắc màu sáng",
      },
      value: 2,
      ordering: 2,
      contrast_group: "light",
      audio_path: "/audio/vi/c4/bright_yellow.mp3",
    },
    {
      id: "bright_green",
      label: "màu xanh tươi",
      image: {
        kind: "emoji",
        ref: "🟢",
      },
      category: {
        type: "sắc màu sáng",
      },
      value: 3,
      ordering: 3,
      contrast_group: "light",
      audio_path: "/audio/vi/c4/bright_green.mp3",
    },
    {
      id: "bright_red",
      label: "màu đỏ tươi",
      image: {
        kind: "emoji",
        ref: "🔴",
      },
      category: {
        type: "sắc màu sáng",
      },
      value: 4,
      ordering: 4,
      contrast_group: "light",
      audio_path: "/audio/vi/c4/bright_red.mp3",
    },
    {
      id: "bright_blue",
      label: "màu lam nhạt",
      image: {
        kind: "emoji",
        ref: "🔵",
      },
      category: {
        type: "sắc màu tối",
      },
      value: 5,
      ordering: 5,
      contrast_group: "dark",
      audio_path: "/audio/vi/c4/bright_blue.mp3",
    },
    {
      id: "deep_purple",
      label: "màu tím sẫm",
      image: {
        kind: "emoji",
        ref: "🟣",
      },
      category: {
        type: "sắc màu tối",
      },
      value: 6,
      ordering: 6,
      contrast_group: "dark",
      audio_path: "/audio/vi/c4/deep_purple.mp3",
    },
    {
      id: "dark_brown",
      label: "màu nâu sẫm",
      image: {
        kind: "emoji",
        ref: "🟤",
      },
      category: {
        type: "sắc màu tối",
      },
      value: 7,
      ordering: 7,
      contrast_group: "dark",
      audio_path: "/audio/vi/c4/dark_brown.mp3",
    },
    {
      id: "pure_black",
      label: "màu đen tuyền",
      image: {
        kind: "emoji",
        ref: "⚫",
      },
      category: {
        type: "sắc màu tối",
      },
      value: 8,
      ordering: 8,
      contrast_group: "dark",
      audio_path: "/audio/vi/c4/pure_black.mp3",
    },
    {
      id: "wind_kite",
      label: "những cánh diều no gió",
      image: {
        kind: "emoji",
        ref: "🪁",
      },
      category: {
        type: "cảnh quan giải mã",
      },
      value: 9,
      ordering: 9,
      contrast_group: "kite",
      audio_path: "/audio/vi/c4/wind_kite.mp3",
    },
    {
      id: "crystal_butterfly",
      label: "chú bướm đối xứng",
      image: {
        kind: "emoji",
        ref: "🦋",
      },
      category: {
        type: "vật thể ba màu",
      },
      value: 10,
      ordering: 10,
      contrast_group: "triplet_item",
      audio_path: "/audio/vi/c4/crystal_butterfly.mp3",
    },
    {
      id: "hot_air_balloon",
      label: "khinh khí cầu dải màu",
      image: {
        kind: "emoji",
        ref: "🎈",
      },
      category: {
        type: "vật thể ba màu",
      },
      value: 11,
      ordering: 11,
      contrast_group: "triplet_item",
      audio_path: "/audio/vi/c4/hot_air_balloon.mp3",
    },
    {
      id: "fairy_lantern",
      label: "chiếc đèn pha lê cổ tích",
      image: {
        kind: "emoji",
        ref: "🏮",
      },
      category: {
        type: "vật thể ba màu",
      },
      value: 12,
      ordering: 12,
      contrast_group: "triplet_item",
      audio_path: "/audio/vi/c4/fairy_lantern.mp3",
    },
    {
      id: "rainbow_gem_crystal",
      label: "Viên Ngọc Sắc Màu",
      image: {
        kind: "emoji",
        ref: "💎",
      },
      category: {
        type: "biểu tượng chiến thắng",
      },
      value: 13,
      ordering: 13,
      contrast_group: "gem",
      audio_path: "/audio/vi/c4/rainbow_gem_crystal.mp3",
    },
  ],
  axes: {
    category: {
      values: ["sắc màu sáng", "sắc màu tối"],
    },
  },
  relations: [
    {
      type: "contrast",
      source_id: "pure_white",
      target_id: "pure_black",
    },
    {
      type: "contrast",
      source_id: "bright_yellow",
      target_id: "dark_brown",
    },
    {
      type: "contrast",
      source_id: "bright_green",
      target_id: "deep_purple",
    },
    {
      type: "contrast",
      source_id: "bright_red",
      target_id: "bright_blue",
    },
    {
      type: "contrast",
      source_id: "crystal_butterfly",
      target_id: "hot_air_balloon",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Phân biệt sắc độ màu",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Phân biệt sắc độ màu",
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
    narration_template: "Chúng mình cùng tìm hiểu về Phân biệt sắc độ màu nhé",
  },
  ordering: [
    "pure_white",
    "bright_yellow",
    "bright_green",
    "bright_red",
    "bright_blue",
    "deep_purple",
    "dark_brown",
    "pure_black",
    "wind_kite",
    "crystal_butterfly",
    "hot_air_balloon",
    "fairy_lantern",
    "rainbow_gem_crystal",
  ],
};

export const C4_SEN_01_SEED: SkillSeed = {
  identity: C4_SEN_01_IDENTITY,
  dataset: C4_SEN_01_DATASET,
  levels: [
    {
      code: "GL-C4-SEN-SORT-0107",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "art",
      rounds: 3,
      montessori_ref: "WB10-D1",
    },
    {
      code: "GL-C4-SEN-SORT-0108",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "school",
      rounds: 3,
      montessori_ref: "WB10-D1",
    },
    {
      code: "GL-C4-SEN-SEQ-0109",
      template: "GT-006",
      band: "5-6",
      difficulty: 2,
      theme: "art",
      rounds: 3,
      montessori_ref: "WB10-D2",
    },
    {
      code: "GL-C4-SEN-SEQ-0110",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
      montessori_ref: "WB10-D2",
    },
    {
      code: "GL-C4-SEN-FILL-0181",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "art",
      rounds: 3,
      montessori_ref: "WB10-D1",
    },
    {
      code: "GL-C4-SEN-PAIR-0181",
      template: "GT-005",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 5,
      montessori_ref: "WB10-D2",
    },
    {
      code: "GL-C4-SEN-PAIR-0182",
      template: "GT-005",
      band: "4-5",
      difficulty: 3,
      theme: "fairytale",
      rounds: 5,
      montessori_ref: "WB10-D2",
    },
  ],
};
