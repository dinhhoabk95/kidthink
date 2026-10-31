import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";
import { numeralItem } from "#src/inventories/index";

export const C1_NREC_10_IDENTITY: SkillIdentity = {
  code: "C1.NREC.10",
  strand_code: "C1.NREC",
  competency_code: "C1",
  name: "Số trước",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["infer"],
  tier: "core",
  prerequisites: ["C1.NREC.09"],
  learning_objectives: [
    {
      code: "LO-C1.NREC.10-01",
      behaviour: "Nhận biết và thực hành Số trước ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.NREC.10-02",
      behaviour: "Vận dụng Số trước trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.NREC.10-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Số trước",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_NREC_10_DATASET: SkillDataset = {
  skill_code: "C1.NREC.10",
  concept_label: "Số trước",
  surface: "game",
  items: [
    numeralItem("n0", {
      label: "số 0 trước số 1",
      image: {
        kind: "emoji",
        ref: "🐣",
      },
      category: {
        type: "số đứng trước",
        parity: "chẵn",
      },
      contrast_group: "prev_num",
    }),
    numeralItem("n1", {
      label: "số 1 trước số 2",
      image: {
        kind: "emoji",
        ref: "🐰",
      },
      category: {
        type: "số đứng trước",
        parity: "lẻ",
      },
      contrast_group: "prev_num",
    }),
    numeralItem("n2", {
      label: "số 2 trước số 3",
      image: {
        kind: "emoji",
        ref: "🐶",
      },
      category: {
        type: "số đứng trước",
        parity: "chẵn",
      },
      contrast_group: "prev_num",
    }),
    numeralItem("n3", {
      label: "số 3 trước số 4",
      image: {
        kind: "emoji",
        ref: "🐱",
      },
      category: {
        type: "số đứng trước",
        parity: "lẻ",
      },
      contrast_group: "prev_num",
    }),
    numeralItem("n4", {
      label: "số 4 trước số 5",
      image: {
        kind: "emoji",
        ref: "🐷",
      },
      category: {
        type: "số đứng trước",
        parity: "chẵn",
      },
      contrast_group: "prev_num",
    }),
    numeralItem("n5", {
      label: "số 5 trước số 6",
      image: {
        kind: "emoji",
        ref: "🐑",
      },
      category: {
        type: "số đứng trước",
        parity: "lẻ",
      },
      contrast_group: "prev_num",
    }),
    numeralItem("n6", {
      label: "số 6 trước số 7",
      image: {
        kind: "emoji",
        ref: "🦔",
      },
      category: {
        type: "số đứng trước",
        parity: "chẵn",
      },
      contrast_group: "prev_num",
    }),
    numeralItem("n7", {
      label: "số 7 trước số 8",
      image: {
        kind: "emoji",
        ref: "🐿️",
      },
      category: {
        type: "số đứng trước",
        parity: "lẻ",
      },
      contrast_group: "prev_num",
    }),
    numeralItem("n8", {
      label: "số 8 trước số 9",
      image: {
        kind: "emoji",
        ref: "🦥",
      },
      category: {
        type: "số đứng trước",
        parity: "chẵn",
      },
      contrast_group: "prev_num",
    }),
    numeralItem("n9", {
      label: "số 9 trước số 10",
      image: {
        kind: "emoji",
        ref: "🦨",
      },
      category: {
        type: "số đứng trước",
        parity: "lẻ",
      },
      contrast_group: "prev_num",
    }),
    numeralItem("n10", {
      label: "số 10",
      image: {
        kind: "emoji",
        ref: "🦘",
      },
      category: {
        type: "số đích",
        parity: "chẵn",
      },
      contrast_group: "prev_num",
    }),
  ],
  relations: [
    {
      type: "sequence",
      source_id: "n0",
      target_id: "n1",
      metadata: {
        relation: "predecessor",
      },
    },
    {
      type: "sequence",
      source_id: "n1",
      target_id: "n2",
      metadata: {
        relation: "predecessor",
      },
    },
    {
      type: "sequence",
      source_id: "n2",
      target_id: "n3",
      metadata: {
        relation: "predecessor",
      },
    },
    {
      type: "sequence",
      source_id: "n3",
      target_id: "n4",
      metadata: {
        relation: "predecessor",
      },
    },
    {
      type: "sequence",
      source_id: "n4",
      target_id: "n5",
      metadata: {
        relation: "predecessor",
      },
    },
    {
      type: "sequence",
      source_id: "n5",
      target_id: "n6",
      metadata: {
        relation: "predecessor",
      },
    },
    {
      type: "sequence",
      source_id: "n6",
      target_id: "n7",
      metadata: {
        relation: "predecessor",
      },
    },
    {
      type: "sequence",
      source_id: "n7",
      target_id: "n8",
      metadata: {
        relation: "predecessor",
      },
    },
    {
      type: "sequence",
      source_id: "n8",
      target_id: "n9",
      metadata: {
        relation: "predecessor",
      },
    },
    {
      type: "sequence",
      source_id: "n9",
      target_id: "n10",
      metadata: {
        relation: "predecessor",
      },
    },
  ],
  axes: {
    parity: {
      values: ["chẵn", "lẻ"],
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với số trước",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng số trước",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt số trước với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi số trước",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục số trước và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn {label} nhé!",
    narration_template: "Chúng mình cùng tìm số đứng ngay phía trước nhé",
  },
  ordering: ["n0", "n1", "n2", "n3", "n4", "n5", "n6", "n7", "n8", "n9", "n10"],
};

export const C1_NREC_10_SEED: SkillSeed = {
  identity: C1_NREC_10_IDENTITY,
  dataset: C1_NREC_10_DATASET,
  levels: [
    {
      code: "GL-C1-HNT-TAP-0001",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      access_tier: "free",
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-NRC-BSK-0005",
      template: "GT-003",
      band: "4-5",
      difficulty: 2,
      access_tier: "login",
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-NRC-BSK-0006",
      template: "GT-003",
      band: "4-5",
      difficulty: 3,
      access_tier: "standard",
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-NREC-TAP-0101",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      access_tier: "free",
      theme: "school",
      rounds: 3,
      montessori_ref: "WB02-D1",
    },
    {
      code: "GL-C1-NREC-SLOT-0103",
      template: "GT-008",
      band: "3-4",
      difficulty: 2,
      access_tier: "login",
      theme: "garden",
      rounds: 3,
      montessori_ref: "WB02-D2",
    },
  ],
};
