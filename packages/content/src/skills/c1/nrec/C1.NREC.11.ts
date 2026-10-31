import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";
import { numeralItem } from "#src/inventories/index";

export const C1_NREC_11_IDENTITY: SkillIdentity = {
  code: "C1.NREC.11",
  strand_code: "C1.NREC",
  competency_code: "C1",
  name: "Số sau",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["infer"],
  tier: "core",
  prerequisites: ["C1.NREC.09"],
  learning_objectives: [
    {
      code: "LO-C1.NREC.11-01",
      behaviour: "Nhận biết và thực hành Số sau ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.NREC.11-02",
      behaviour: "Vận dụng Số sau trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.NREC.11-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Số sau",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_NREC_11_DATASET: SkillDataset = {
  skill_code: "C1.NREC.11",
  concept_label: "Số sau",
  surface: "game",
  items: [
    numeralItem("n0", {
      label: "số 0",
      image: {
        kind: "emoji",
        ref: "🌰",
      },
      category: {
        type: "số đứng trước",
        parity: "chẵn",
      },
      contrast_group: "next_num",
    }),
    numeralItem("n1", {
      label: "số 1 sau số 0",
      image: {
        kind: "emoji",
        ref: "🍄",
      },
      category: {
        type: "số đứng sau",
        parity: "lẻ",
      },
      contrast_group: "next_num",
    }),
    numeralItem("n2", {
      label: "số 2 sau số 1",
      image: {
        kind: "emoji",
        ref: "🌷",
      },
      category: {
        type: "số đứng sau",
        parity: "chẵn",
      },
      contrast_group: "next_num",
    }),
    numeralItem("n3", {
      label: "số 3 sau số 2",
      image: {
        kind: "emoji",
        ref: "🌼",
      },
      category: {
        type: "số đứng sau",
        parity: "lẻ",
      },
      contrast_group: "next_num",
    }),
    numeralItem("n4", {
      label: "số 4 sau số 3",
      image: {
        kind: "emoji",
        ref: "🍀",
      },
      category: {
        type: "số đứng sau",
        parity: "chẵn",
      },
      contrast_group: "next_num",
    }),
    numeralItem("n5", {
      label: "số 5 sau số 4",
      image: {
        kind: "emoji",
        ref: "🌱",
      },
      category: {
        type: "số đứng sau",
        parity: "lẻ",
      },
      contrast_group: "next_num",
    }),
    numeralItem("n6", {
      label: "số 6 sau số 5",
      image: {
        kind: "emoji",
        ref: "🌿",
      },
      category: {
        type: "số đứng sau",
        parity: "chẵn",
      },
      contrast_group: "next_num",
    }),
    numeralItem("n7", {
      label: "số 7 sau số 6",
      image: {
        kind: "emoji",
        ref: "🌾",
      },
      category: {
        type: "số đứng sau",
        parity: "lẻ",
      },
      contrast_group: "next_num",
    }),
    numeralItem("n8", {
      label: "số 8 sau số 7",
      image: {
        kind: "emoji",
        ref: "🌸",
      },
      category: {
        type: "số đứng sau",
        parity: "chẵn",
      },
      contrast_group: "next_num",
    }),
    numeralItem("n9", {
      label: "số 9 sau số 8",
      image: {
        kind: "emoji",
        ref: "🌻",
      },
      category: {
        type: "số đứng sau",
        parity: "lẻ",
      },
      contrast_group: "next_num",
    }),
    numeralItem("n10", {
      label: "số 10 sau số 9",
      image: {
        kind: "emoji",
        ref: "🌺",
      },
      category: {
        type: "số đứng sau",
        parity: "chẵn",
      },
      contrast_group: "next_num",
    }),
  ],
  relations: [
    {
      type: "sequence",
      source_id: "n0",
      target_id: "n1",
      metadata: {
        relation: "successor",
      },
    },
    {
      type: "sequence",
      source_id: "n1",
      target_id: "n2",
      metadata: {
        relation: "successor",
      },
    },
    {
      type: "sequence",
      source_id: "n2",
      target_id: "n3",
      metadata: {
        relation: "successor",
      },
    },
    {
      type: "sequence",
      source_id: "n3",
      target_id: "n4",
      metadata: {
        relation: "successor",
      },
    },
    {
      type: "sequence",
      source_id: "n4",
      target_id: "n5",
      metadata: {
        relation: "successor",
      },
    },
    {
      type: "sequence",
      source_id: "n5",
      target_id: "n6",
      metadata: {
        relation: "successor",
      },
    },
    {
      type: "sequence",
      source_id: "n6",
      target_id: "n7",
      metadata: {
        relation: "successor",
      },
    },
    {
      type: "sequence",
      source_id: "n7",
      target_id: "n8",
      metadata: {
        relation: "successor",
      },
    },
    {
      type: "sequence",
      source_id: "n8",
      target_id: "n9",
      metadata: {
        relation: "successor",
      },
    },
    {
      type: "sequence",
      source_id: "n9",
      target_id: "n10",
      metadata: {
        relation: "successor",
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
      description: "Làm quen cơ bản với số sau",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng số sau",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt số sau với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi số sau",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục số sau và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn {label} nhé!",
    narration_template: "Chúng mình cùng tìm số đứng ngay phía sau nhé",
  },
  ordering: ["n0", "n1", "n2", "n3", "n4", "n5", "n6", "n7", "n8", "n9", "n10"],
};

export const C1_NREC_11_SEED: SkillSeed = {
  identity: C1_NREC_11_IDENTITY,
  dataset: C1_NREC_11_DATASET,
  levels: [
    {
      code: "GL-C1-HNT-TAP-0003",
      template: "GT-001",
      band: "3-4",
      difficulty: 3,
      access_tier: "standard",
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-HNT-TAP-0004",
      template: "GT-001",
      band: "4-5",
      difficulty: 1,
      access_tier: "free",
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C1-NREC-SIZE-0005",
      template: "GT-009",
      band: "4-5",
      difficulty: 2,
      access_tier: "login",
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-NREC-TAP-0102",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      access_tier: "login",
      theme: "school",
      rounds: 3,
      montessori_ref: "WB02-D1",
    },
    {
      code: "GL-C1-NREC-SLOT-0115",
      template: "GT-008",
      band: "3-4",
      difficulty: 3,
      access_tier: "standard",
      theme: "nature",
      rounds: 3,
      montessori_ref: "WB02-D2",
    },
  ],
};
