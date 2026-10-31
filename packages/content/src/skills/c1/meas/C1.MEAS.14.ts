import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_MEAS_14_IDENTITY: SkillIdentity = {
  code: "C1.MEAS.14",
  strand_code: "C1.MEAS",
  competency_code: "C1",
  name: "Tiền xu đơn giản",
  age_min: 5,
  age_max: 6,
  difficulty: 4,
  thinking_processes: ["count", "compare"],
  tier: "advanced",
  prerequisites: ["C1.NREC.03", "C1.CNT.01"],
  learning_objectives: [
    {
      code: "LO-C1.MEAS.14-01",
      behaviour: "Nhận biết và thực hành Tiền xu đơn giản ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.MEAS.14-02",
      behaviour: "Vận dụng Tiền xu đơn giản trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.MEAS.14-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Tiền xu đơn giản",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_MEAS_14_DATASET: SkillDataset = {
  skill_code: "C1.MEAS.14",
  concept_label: "Tiền xu đơn giản",
  surface: "game",
  items: [
    {
      id: "coin_item_1",
      label: "kẹo mút một xu",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🍭",
      },
      ordering: 1,
      contrast_group: "coin",
      category: {
        type: "món bánh kẹo",
        coin: "1",
      },
    },
    {
      id: "coin_item_2",
      label: "bánh quy hai xu",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🍪",
      },
      ordering: 2,
      contrast_group: "coin",
      category: {
        type: "món bánh kẹo",
        coin: "2",
      },
    },
    {
      id: "coin_item_3",
      label: "quả táo ba xu",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🍎",
      },
      ordering: 3,
      contrast_group: "coin",
      category: {
        type: "món bánh kẹo",
        coin: "3",
      },
    },
    {
      id: "coin_item_4",
      label: "hộp sữa bốn xu",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🧃",
      },
      ordering: 4,
      contrast_group: "coin",
      category: {
        type: "món bánh kẹo",
        coin: "4",
      },
    },
    {
      id: "coin_item_5",
      label: "quyển vở năm xu",
      value: 5,
      image: {
        kind: "emoji",
        ref: "📒",
      },
      ordering: 5,
      contrast_group: "coin",
      category: {
        type: "món học tập",
        coin: "5",
      },
    },
    {
      id: "coin_item_6",
      label: "hộp màu sáu xu",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🎨",
      },
      ordering: 6,
      contrast_group: "coin",
      category: {
        type: "món học tập",
        coin: "6",
      },
    },
  ],
  relations: [
    {
      type: "sequence",
      source_id: "coin_item_1",
      target_id: "coin_item_2",
    },
    {
      type: "sequence",
      source_id: "coin_item_2",
      target_id: "coin_item_3",
    },
    {
      type: "sequence",
      source_id: "coin_item_3",
      target_id: "coin_item_4",
    },
    {
      type: "sequence",
      source_id: "coin_item_4",
      target_id: "coin_item_5",
    },
    {
      type: "sequence",
      source_id: "coin_item_5",
      target_id: "coin_item_6",
    },
    {
      type: "contrast",
      source_id: "coin_item_6",
      target_id: "coin_item_1",
      metadata: {
        dimension: "coin",
      },
    },
  ],
  axes: {
    coin: {
      values: ["1", "2", "3", "4", "5", "6"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với tiền xu đơn giản",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng tiền xu đơn giản",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt tiền xu đơn giản với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi tiền xu đơn giản",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục tiền xu đơn giản và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn {label} nhé!",
    narration_template: "Chúng mình cùng tìm hiểu về Tiền xu đơn giản nhé",
  },
  ordering: [
    "coin_item_1",
    "coin_item_2",
    "coin_item_3",
    "coin_item_4",
    "coin_item_5",
    "coin_item_6",
  ],
};

export const C1_MEAS_14_SEED: SkillSeed = {
  identity: C1_MEAS_14_IDENTITY,
  dataset: C1_MEAS_14_DATASET,
  levels: [
    {
      code: "GL-C1-COIN-CMP-0001",
      template: "GT-031",
      band: "5-6",
      difficulty: 1,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-COIN-CMP-0002",
      template: "GT-031",
      band: "5-6",
      difficulty: 1,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-COIN-CMP-0003",
      template: "GT-031",
      band: "5-6",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-TAP-0041",
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
  ],
};
