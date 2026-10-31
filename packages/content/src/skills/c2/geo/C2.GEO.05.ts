import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_GEO_05_IDENTITY: SkillIdentity = {
  code: "C2.GEO.05",
  strand_code: "C2.GEO",
  competency_code: "C2",
  name: "Hình bầu dục",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["observe", "compare"],
  tier: "basic",
  prerequisites: ["C2.GEO.01"],
  learning_objectives: [
    {
      code: "LO-C2.GEO.05-01",
      behaviour: "Nhận biết và thực hành Hình oval ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.GEO.05-02",
      behaviour: "Vận dụng Hình oval trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.GEO.05-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Hình oval",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_GEO_05_DATASET: SkillDataset = {
  skill_code: "C2.GEO.05",
  concept_label: "Hình bầu dục",
  surface: "game",
  items: [
    {
      id: "egg_oval",
      label: "quả trứng bầu dục",
      image: {
        kind: "emoji",
        ref: "🥚",
      },
      category: {
        type: "hình bầu dục",
      },
      contrast_group: "oval",
      value: 1,
      ordering: 1,
    },
    {
      id: "potato_oval",
      label: "củ khoai bầu dục",
      image: {
        kind: "emoji",
        ref: "🥔",
      },
      category: {
        type: "hình bầu dục",
      },
      contrast_group: "oval",
      value: 2,
      ordering: 2,
    },
    {
      id: "melon_oval",
      label: "quả dưa bầu dục",
      image: {
        kind: "emoji",
        ref: "🍉",
      },
      category: {
        type: "hình bầu dục",
      },
      contrast_group: "oval",
      value: 3,
      ordering: 3,
    },
    {
      id: "rugby_oval",
      label: "bóng bầu dục nâu",
      image: {
        kind: "emoji",
        ref: "🏈",
      },
      category: {
        type: "hình bầu dục",
      },
      contrast_group: "oval",
      value: 4,
      ordering: 4,
    },
    {
      id: "square_blue",
      label: "hình vuông xanh",
      image: {
        kind: "emoji",
        ref: "🟦",
      },
      category: {
        type: "hình khác",
      },
      contrast_group: "other_shape",
      value: 5,
      ordering: 5,
    },
    {
      id: "triangle_red",
      label: "hình tam giác đỏ",
      image: {
        kind: "emoji",
        ref: "🔺",
      },
      category: {
        type: "hình khác",
      },
      contrast_group: "other_shape",
      value: 6,
      ordering: 6,
    },
    {
      id: "star_yellow",
      label: "ngôi sao vàng",
      image: {
        kind: "emoji",
        ref: "⭐",
      },
      category: {
        type: "hình khác",
      },
      contrast_group: "other_shape",
      value: 7,
      ordering: 7,
    },
    {
      id: "diamond_orange",
      label: "hình thoi cam",
      image: {
        kind: "emoji",
        ref: "🔶",
      },
      category: {
        type: "hình khác",
      },
      contrast_group: "other_shape",
      value: 8,
      ordering: 8,
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "egg_oval",
      target_id: "square_blue",
    },
    {
      type: "pair",
      source_id: "potato_oval",
      target_id: "triangle_red",
    },
    {
      type: "pair",
      source_id: "melon_oval",
      target_id: "star_yellow",
    },
    {
      type: "pair",
      source_id: "rugby_oval",
      target_id: "diamond_orange",
    },
    {
      type: "contrast",
      source_id: "egg_oval",
      target_id: "square_blue",
    },
  ],
  axes: {
    category: {
      values: ["hình bầu dục", "hình khác"],
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
      description: "Làm quen cơ bản với Hình bầu dục",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Hình bầu dục",
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
    narration_template: "Chúng mình cùng tìm hiểu về hình bầu dục nhé",
  },
  ordering: [
    "egg_oval",
    "potato_oval",
    "melon_oval",
    "rugby_oval",
    "square_blue",
    "triangle_red",
    "star_yellow",
    "diamond_orange",
  ],
};

export const C2_GEO_05_SEED: SkillSeed = {
  identity: C2_GEO_05_IDENTITY,
  dataset: C2_GEO_05_DATASET,
  levels: [
    {
      code: "GL-C2-HOL-SLOT-0003",
      template: "GT-008",
      band: "3-4",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C2-HOL-SLOT-0004",
      template: "GT-008",
      band: "4-5",
      difficulty: 1,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C2-GEO-HUNT-0002",
      template: "GT-037",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
  ],
};
