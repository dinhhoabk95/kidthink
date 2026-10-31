import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C3_INF_02_IDENTITY: SkillIdentity = {
  code: "C3.INF.02",
  strand_code: "C3.INF",
  competency_code: "C3",
  name: "Đoán kết quả",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["predict", "infer"],
  tier: "advanced",
  prerequisites: ["C3.DED.02"],
  learning_objectives: [
    {
      code: "LO-C3.INF.02-01",
      behaviour: "Nhận biết và thực hành Đoán kết quả ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C3.INF.02-02",
      behaviour: "Vận dụng Đoán kết quả trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C3.INF.02-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Đoán kết quả",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C3_INF_02_DATASET: SkillDataset = {
  skill_code: "C3.INF.02",
  concept_label: "Đoán kết quả",
  surface: "game",
  items: [
    {
      id: "rain_cloud",
      label: "mây mưa kéo đến",
      image: {
        kind: "emoji",
        ref: "🌧️",
      },
      category: {
        type: "nguyên nhân",
        color: "blue",
        shape: "circle",
        size: "large",
      },
      contrast_group: "cause",
      value: 1,
      ordering: 1,
    },
    {
      id: "open_umbrella",
      label: "bung ô che mưa",
      image: {
        kind: "emoji",
        ref: "☔",
      },
      category: {
        type: "kết quả",
        color: "red",
        shape: "triangle",
        size: "medium",
      },
      contrast_group: "effect",
      value: 2,
      ordering: 2,
    },
    {
      id: "plant_seed",
      label: "gieo hạt xuống đất",
      image: {
        kind: "emoji",
        ref: "🌱",
      },
      category: {
        type: "nguyên nhân",
        color: "green",
        shape: "circle",
        size: "small",
      },
      contrast_group: "cause",
      value: 3,
      ordering: 3,
    },
    {
      id: "bloom_flower",
      label: "hoa nở rực rỡ",
      image: {
        kind: "emoji",
        ref: "🌻",
      },
      category: {
        type: "kết quả",
        color: "yellow",
        shape: "circle",
        size: "large",
      },
      contrast_group: "effect",
      value: 4,
      ordering: 4,
    },
    {
      id: "caterpillar",
      label: "chú sâu ăn lá",
      image: {
        kind: "emoji",
        ref: "🐛",
      },
      category: {
        type: "nguyên nhân",
        color: "green",
        shape: "rectangle",
        size: "small",
      },
      contrast_group: "cause",
      value: 5,
      ordering: 5,
    },
    {
      id: "butterfly",
      label: "hóa bướm xinh đẹp",
      image: {
        kind: "emoji",
        ref: "🦋",
      },
      category: {
        type: "kết quả",
        color: "blue",
        shape: "triangle",
        size: "medium",
      },
      contrast_group: "effect",
      value: 6,
      ordering: 6,
    },
    {
      id: "white_egg",
      label: "ấp quả trứng tròn",
      image: {
        kind: "emoji",
        ref: "🥚",
      },
      category: {
        type: "nguyên nhân",
        color: "white",
        shape: "circle",
        size: "small",
      },
      contrast_group: "cause",
      value: 7,
      ordering: 7,
    },
    {
      id: "baby_chick",
      label: "gà con nở ra",
      image: {
        kind: "emoji",
        ref: "🐣",
      },
      category: {
        type: "kết quả",
        color: "yellow",
        shape: "circle",
        size: "small",
      },
      contrast_group: "effect",
      value: 8,
      ordering: 8,
    },
    {
      id: "ws_joystick_green",
      label: "cần gạt xanh",
      image: {
        kind: "emoji",
        ref: "🕹️",
      },
      value: 5,
    },
    {
      id: "ws_bulb_yellow",
      label: "bóng đèn vàng",
      image: {
        kind: "emoji",
        ref: "💡",
      },
      value: 6,
    },
    {
      id: "ws_key_brass",
      label: "chìa khóa đồng",
      image: {
        kind: "emoji",
        ref: "🔑",
      },
      value: 7,
    },
    {
      id: "ws_buzzer_red",
      label: "chuông báo đỏ",
      image: {
        kind: "emoji",
        ref: "🚨",
      },
      value: 8,
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "rain_cloud",
      target_id: "open_umbrella",
      explanation: "mây mưa kéo đến dẫn tới việc bung ô che",
      metadata: { reason: "cause_effect" },
    },
    {
      type: "pair",
      source_id: "plant_seed",
      target_id: "bloom_flower",
      explanation: "gieo hạt xuống đất dẫn tới việc hoa nở rực rỡ",
      metadata: { reason: "cause_effect" },
    },
    {
      type: "pair",
      source_id: "caterpillar",
      target_id: "butterfly",
      explanation: "sâu bướm lớn lên hóa thành bướm xinh đẹp",
      metadata: { reason: "cause_effect" },
    },
    {
      type: "pair",
      source_id: "white_egg",
      target_id: "baby_chick",
      explanation: "ấp trứng tròn dẫn tới việc gà con nở ra",
      metadata: { reason: "cause_effect" },
    },
  ],
  axes: {
    type: ["nguyên nhân", "kết quả"],
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với đoán kết quả",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng đoán kết quả",
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
      "Chúng mình cùng suy luận đoán xem kết quả sẽ là gì nhé",
  },
  ordering: [
    "rain_cloud",
    "open_umbrella",
    "plant_seed",
    "bloom_flower",
    "caterpillar",
    "butterfly",
    "white_egg",
    "baby_chick",
    "ws_joystick_green",
    "ws_bulb_yellow",
    "ws_key_brass",
    "ws_buzzer_red",
  ],
};

export const C3_INF_02_SEED: SkillSeed = {
  identity: C3_INF_02_IDENTITY,
  dataset: C3_INF_02_DATASET,
  levels: [
    {
      template: "GT-000",
      band: "5-6",
      difficulty: 1,
      theme: "school",
    },
    {
      code: "GL-C3-ODD-TAP-0009",
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C3-ODD-TAP-0010",
      template: "GT-001",
      band: "5-6",
      difficulty: 1,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C3-CAU-PAIR-0009",
      template: "GT-005",
      band: "5-6",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C3-CAU-PAIR-0010",
      template: "GT-005",
      band: "5-6",
      difficulty: 1,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C4-PIC-SLOT-0008",
      template: "GT-008",
      band: "5-6",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C3-INF-SORT-0001",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C3-INF-TAP-0203",
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      access_tier: "standard",
      theme: "job",
      rounds: 3,
      montessori_ref: "WB12-D3",
    },
    {
      code: "GL-C3-INF-TAP-0204",
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      access_tier: "premium",
      theme: "job",
      rounds: 4,
      montessori_ref: "WB12-D3",
    },
  ],
};
