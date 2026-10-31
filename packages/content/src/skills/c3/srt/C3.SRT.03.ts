import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C3_SRT_03_IDENTITY: SkillIdentity = {
  code: "C3.SRT.03",
  strand_code: "C3.SRT",
  competency_code: "C3",
  name: "Sắp xếp màu từ đậm đến nhạt",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["sequence", "observe"],
  tier: "core",
  prerequisites: ["C3.CLS.01"],
  learning_objectives: [
    {
      code: "LO-C3.SRT.03-01",
      behaviour:
        "Nhận biết và thực hành Sắp xếp theo màu (đậm→nhạt) ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C3.SRT.03-02",
      behaviour:
        "Vận dụng Sắp xếp theo màu (đậm→nhạt) trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C3.SRT.03-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Sắp xếp theo màu (đậm→nhạt)",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C3_SRT_03_DATASET: SkillDataset = {
  skill_code: "C3.SRT.03",
  concept_label: "Sắp xếp màu từ đậm đến nhạt",
  surface: "game",
  items: [
    {
      id: "dark_red_heart",
      label: "trái tim đỏ sẫm",
      image: {
        kind: "emoji",
        ref: "❤️",
      },
      category: {
        type: "sắc màu đỏ",
      },
      contrast_group: "red_shades",
      value: 4,
      ordering: 1,
    },
    {
      id: "medium_red_apple",
      label: "quả táo đỏ tươi",
      image: {
        kind: "emoji",
        ref: "🍎",
      },
      category: {
        type: "sắc màu đỏ",
      },
      contrast_group: "red_shades",
      value: 3,
      ordering: 2,
    },
    {
      id: "light_red_tulip",
      label: "bông hoa hồng đỏ",
      image: {
        kind: "emoji",
        ref: "🌷",
      },
      category: {
        type: "sắc màu đỏ",
      },
      contrast_group: "red_shades",
      value: 2,
      ordering: 3,
    },
    {
      id: "pale_red_blossom",
      label: "cánh hoa hồng nhạt",
      image: {
        kind: "emoji",
        ref: "🌸",
      },
      category: {
        type: "sắc màu đỏ",
      },
      contrast_group: "red_shades",
      value: 1,
      ordering: 4,
    },
    {
      id: "dark_blue_moon",
      label: "mặt trăng tối thẫm",
      image: {
        kind: "emoji",
        ref: "🌑",
      },
      category: {
        type: "sắc màu xanh",
      },
      contrast_group: "blue_shades",
      value: 4,
      ordering: 5,
    },
    {
      id: "medium_blue_circle",
      label: "hình tròn xanh đậm",
      image: {
        kind: "emoji",
        ref: "🔵",
      },
      category: {
        type: "sắc màu xanh",
      },
      contrast_group: "blue_shades",
      value: 3,
      ordering: 6,
    },
    {
      id: "light_blue_diamond",
      label: "hình thoi xanh vừa",
      image: {
        kind: "emoji",
        ref: "🔷",
      },
      category: {
        type: "sắc màu xanh",
      },
      contrast_group: "blue_shades",
      value: 2,
      ordering: 7,
    },
    {
      id: "pale_blue_drop",
      label: "giọt nước xanh nhạt",
      image: {
        kind: "emoji",
        ref: "💧",
      },
      category: {
        type: "sắc màu xanh",
      },
      contrast_group: "blue_shades",
      value: 1,
      ordering: 8,
    },
  ],
  relations: [
    {
      source_id: "dark_red_heart",
      target_id: "medium_red_apple",
      type: "sequence",
    },
    {
      source_id: "medium_red_apple",
      target_id: "light_red_tulip",
      type: "sequence",
    },
    {
      source_id: "light_red_tulip",
      target_id: "pale_red_blossom",
      type: "sequence",
    },
    {
      source_id: "dark_blue_moon",
      target_id: "medium_blue_circle",
      type: "sequence",
    },
    {
      source_id: "medium_blue_circle",
      target_id: "light_blue_diamond",
      type: "sequence",
    },
    {
      source_id: "light_blue_diamond",
      target_id: "pale_blue_drop",
      type: "sequence",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen hai sắc độ đậm và nhạt",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Sắp xếp ba sắc độ màu theo thứ tự",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt dải màu đỏ và dải màu xanh",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Nhận biết sắc màu còn thiếu trong dải màu",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Sắp xếp dải màu sắc độ hoàn chỉnh độc lập",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn {label} nhé!",
    narration_template: "Chúng mình cùng xếp màu từ đậm đến nhạt nhé",
  },
  ordering: [
    "dark_red_heart",
    "medium_red_apple",
    "light_red_tulip",
    "pale_red_blossom",
    "dark_blue_moon",
    "medium_blue_circle",
    "light_blue_diamond",
    "pale_blue_drop",
  ],
};

export const C3_SRT_03_SEED: SkillSeed = {
  identity: C3_SRT_03_IDENTITY,
  dataset: C3_SRT_03_DATASET,
  levels: [
    {
      code: "GL-C3-SRT-TAP-0004",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C3-SRT-TAP-0005",
      template: "GT-001",
      band: "3-4",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C3-SRT-TCNT-0003",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
  ],
};
