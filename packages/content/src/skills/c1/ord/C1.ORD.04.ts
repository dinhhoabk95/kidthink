import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";
import { ordinalItem } from "#src/inventories/index";

export const C1_ORD_04_IDENTITY: SkillIdentity = {
  code: "C1.ORD.04",
  strand_code: "C1.ORD",
  competency_code: "C1",
  name: "Thứ tự đến thứ mười",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["sequence", "count"],
  tier: "core",
  prerequisites: ["C1.ORD.03", "C1.NREC.03"],
  learning_objectives: [
    {
      code: "LO-C1.ORD.04-01",
      behaviour: "Nhận biết và thực hành Thứ tự đến thứ mười ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.ORD.04-02",
      behaviour: "Vận dụng Thứ tự đến thứ mười trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.ORD.04-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Thứ tự đến thứ mười",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_ORD_04_DATASET: SkillDataset = {
  skill_code: "C1.ORD.04",
  concept_label: "Thứ tự đến thứ mười",
  surface: "game",
  items: [
    ordinalItem("ord_1", {
      label: "chú ngựa về thứ nhất",
      image: {
        kind: "emoji",
        ref: "🐎",
      },
      category: {
        type: "nửa đầu hàng",
        ordinal: "thứ nhất",
      },
      contrast_group: "ord_1_10",
    }),
    ordinalItem("ord_2", {
      label: "chú hươu về thứ hai",
      image: {
        kind: "emoji",
        ref: "🦌",
      },
      category: {
        type: "nửa đầu hàng",
        ordinal: "thứ hai",
      },
      contrast_group: "ord_1_10",
    }),
    ordinalItem("ord_3", {
      label: "chú cún về thứ ba",
      image: {
        kind: "emoji",
        ref: "🐕",
      },
      category: {
        type: "nửa đầu hàng",
        ordinal: "thứ ba",
      },
      contrast_group: "ord_1_10",
    }),
    ordinalItem("ord_4", {
      label: "chú thỏ về thứ tư",
      image: {
        kind: "emoji",
        ref: "🐇",
      },
      category: {
        type: "nửa đầu hàng",
        ordinal: "thứ tư",
      },
      contrast_group: "ord_1_10",
    }),
    ordinalItem("ord_5", {
      label: "chú cáo về thứ năm",
      image: {
        kind: "emoji",
        ref: "🦊",
      },
      category: {
        type: "nửa đầu hàng",
        ordinal: "thứ năm",
      },
      contrast_group: "ord_1_10",
    }),
    ordinalItem("ord_6", {
      label: "chú mèo về thứ sáu",
      image: {
        kind: "emoji",
        ref: "🐈",
      },
      category: {
        type: "nửa cuối hàng",
        ordinal: "thứ sáu",
      },
      contrast_group: "ord_1_10",
    }),
    ordinalItem("ord_7", {
      label: "chú heo về thứ bảy",
      image: {
        kind: "emoji",
        ref: "🐖",
      },
      category: {
        type: "nửa cuối hàng",
        ordinal: "thứ bảy",
      },
      contrast_group: "ord_1_10",
    }),
    ordinalItem("ord_8", {
      label: "chú cừu về thứ tám",
      image: {
        kind: "emoji",
        ref: "🐑",
      },
      category: {
        type: "nửa cuối hàng",
        ordinal: "thứ tám",
      },
      contrast_group: "ord_1_10",
    }),
    ordinalItem("ord_9", {
      label: "chú vịt về thứ chín",
      image: {
        kind: "emoji",
        ref: "🦆",
      },
      category: {
        type: "nửa cuối hàng",
        ordinal: "thứ chín",
      },
      contrast_group: "ord_1_10",
    }),
    ordinalItem("ord_10", {
      label: "chú rùa về thứ mười",
      image: {
        kind: "emoji",
        ref: "🐢",
      },
      category: {
        type: "nửa cuối hàng",
        ordinal: "thứ mười",
      },
      contrast_group: "ord_1_10",
    }),
  ],
  relations: [
    {
      type: "sequence",
      source_id: "ord_1",
      target_id: "ord_2",
    },
    {
      type: "sequence",
      source_id: "ord_2",
      target_id: "ord_3",
    },
    {
      type: "sequence",
      source_id: "ord_3",
      target_id: "ord_4",
    },
    {
      type: "sequence",
      source_id: "ord_4",
      target_id: "ord_5",
    },
    {
      type: "sequence",
      source_id: "ord_5",
      target_id: "ord_6",
    },
    {
      type: "sequence",
      source_id: "ord_6",
      target_id: "ord_7",
    },
    {
      type: "sequence",
      source_id: "ord_7",
      target_id: "ord_8",
    },
    {
      type: "sequence",
      source_id: "ord_8",
      target_id: "ord_9",
    },
    {
      type: "sequence",
      source_id: "ord_9",
      target_id: "ord_10",
    },
  ],
  axes: {
    ordinal: {
      values: [
        "thứ nhất",
        "thứ hai",
        "thứ ba",
        "thứ tư",
        "thứ năm",
        "thứ sáu",
        "thứ bảy",
        "thứ tám",
        "thứ chín",
        "thứ mười",
      ],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với thứ tự đến thứ mười",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng thứ tự đến thứ mười",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt thứ tự đến thứ mười với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi thứ tự đến thứ mười",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục thứ tự đến thứ mười và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn đúng {label} nhé!",
    narration_template: "Chúng mình cùng tìm hiểu về thứ tự đến thứ mười nhé",
  },
  ordering: [
    "ord_1",
    "ord_2",
    "ord_3",
    "ord_4",
    "ord_5",
    "ord_6",
    "ord_7",
    "ord_8",
    "ord_9",
    "ord_10",
  ],
};

export const C1_ORD_04_SEED: SkillSeed = {
  identity: C1_ORD_04_IDENTITY,
  dataset: C1_ORD_04_DATASET,
  levels: [
    {
      code: "GL-C1-ORD-TAP-0013",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-SHAD-0009",
      template: "GT-007",
      band: "4-5",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-SHAD-0010",
      template: "GT-007",
      band: "4-5",
      difficulty: 3,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-SHAD-0011",
      template: "GT-007",
      band: "4-5",
      difficulty: 4,
      theme: "family",
      rounds: 3,
    },
  ],
};
