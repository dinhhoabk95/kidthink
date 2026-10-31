import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_OTO_05_IDENTITY: SkillIdentity = {
  code: "C1.OTO.05",
  strand_code: "C1.OTO",
  competency_code: "C1",
  name: "Ghép theo vị trí",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["match", "observe"],
  tier: "core",
  prerequisites: ["C1.OTO.01"],
  learning_objectives: [
    {
      code: "LO-C1.OTO.05-01",
      behaviour: "Nhận biết và thực hành Ghép theo vị trí ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.OTO.05-02",
      behaviour: "Vận dụng Ghép theo vị trí trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.OTO.05-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Ghép theo vị trí",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_OTO_05_DATASET: SkillDataset = {
  skill_code: "C1.OTO.05",
  concept_label: "Ghép theo vị trí",
  surface: "game",
  items: [
    {
      id: "pos_top_1",
      label: "bạn cún hàng trên",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🐶",
      },
      contrast_group: "dog",
      category: {
        type: "hàng trên",
        position: "trên",
      },
    },
    {
      id: "pos_bottom_1",
      label: "bạn cún hàng dưới",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🐕",
      },
      contrast_group: "dog",
      category: {
        type: "hàng dưới",
        position: "dưới",
      },
    },
    {
      id: "pos_top_2",
      label: "bạn mèo hàng trên",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🐱",
      },
      contrast_group: "cat",
      category: {
        type: "hàng trên",
        position: "trên",
      },
    },
    {
      id: "pos_bottom_2",
      label: "bạn mèo hàng dưới",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🐈",
      },
      contrast_group: "cat",
      category: {
        type: "hàng dưới",
        position: "dưới",
      },
    },
    {
      id: "pos_top_3",
      label: "bạn thỏ hàng trên",
      value: 5,
      image: {
        kind: "emoji",
        ref: "🐰",
      },
      contrast_group: "rabbit",
      category: {
        type: "hàng trên",
        position: "trên",
      },
    },
    {
      id: "pos_bottom_3",
      label: "bạn thỏ hàng dưới",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🐇",
      },
      contrast_group: "rabbit",
      category: {
        type: "hàng dưới",
        position: "dưới",
      },
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "pos_top_1",
      target_id: "pos_bottom_1",
    },
    {
      type: "pair",
      source_id: "pos_top_2",
      target_id: "pos_bottom_2",
    },
    {
      type: "pair",
      source_id: "pos_top_3",
      target_id: "pos_bottom_3",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với ghép theo vị trí",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng ghép theo vị trí",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt ghép theo vị trí với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi ghép theo vị trí",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục ghép theo vị trí và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn đúng {label} nhé!",
    narration_template: "Chúng mình cùng tìm hiểu về ghép theo vị trí nhé",
  },
  ordering: [
    "pos_top_1",
    "pos_bottom_1",
    "pos_top_2",
    "pos_bottom_2",
    "pos_top_3",
    "pos_bottom_3",
  ],
};

export const C1_OTO_05_SEED: SkillSeed = {
  identity: C1_OTO_05_IDENTITY,
  dataset: C1_OTO_05_DATASET,
  levels: [
    {
      code: "GL-C1-OTO-TAP-0017",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-ROT-0001",
      template: "GT-019",
      band: "4-5",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-ROT-0002",
      template: "GT-019",
      band: "4-5",
      difficulty: 2,
      theme: "home",
      rounds: 3,
    },
  ],
};
