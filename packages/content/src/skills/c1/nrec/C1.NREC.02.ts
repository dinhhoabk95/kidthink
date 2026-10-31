import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";
import { numeralItem } from "#src/inventories/index";

export const C1_NREC_02_IDENTITY: SkillIdentity = {
  code: "C1.NREC.02",
  strand_code: "C1.NREC",
  competency_code: "C1",
  name: "Nhận biết số 0–5",
  age_min: 3,
  age_max: 3,
  difficulty: 1,
  thinking_processes: ["observe"],
  tier: "basic",
  prerequisites: ["C1.NREC.01"],
  learning_objectives: [
    {
      code: "LO-C1.NREC.02-01",
      behaviour: "Nhận biết và thực hành Nhận biết số 0–5 ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.NREC.02-02",
      behaviour: "Vận dụng Nhận biết số 0–5 trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.NREC.02-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Nhận biết số 0–5",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_NREC_02_DATASET: SkillDataset = {
  skill_code: "C1.NREC.02",
  concept_label: "Nhận biết số 0–5",
  surface: "game",
  items: [
    numeralItem("n0", {
      label: "số 0",
      image: {
        kind: "emoji",
        ref: "🧺",
      },
      category: {
        type: "nhóm số nhỏ",
        parity: "chẵn",
      },
      contrast_group: "numeral_0_5",
    }),
    numeralItem("n1", {
      image: {
        kind: "emoji",
        ref: "🍎",
      },
      category: {
        type: "nhóm số nhỏ",
        parity: "lẻ",
      },
      contrast_group: "numeral_0_5",
    }),
    numeralItem("n2", {
      image: {
        kind: "emoji",
        ref: "🍊",
      },
      category: {
        type: "nhóm số nhỏ",
        parity: "chẵn",
      },
      contrast_group: "numeral_0_5",
    }),
    numeralItem("n3", {
      image: {
        kind: "emoji",
        ref: "🍓",
      },
      category: {
        type: "nhóm số lớn",
        parity: "lẻ",
      },
      contrast_group: "numeral_0_5",
    }),
    numeralItem("n4", {
      image: {
        kind: "emoji",
        ref: "🍑",
      },
      category: {
        type: "nhóm số lớn",
        parity: "chẵn",
      },
      contrast_group: "numeral_0_5",
    }),
    numeralItem("n5", {
      image: {
        kind: "emoji",
        ref: "🍉",
      },
      category: {
        type: "nhóm số lớn",
        parity: "lẻ",
      },
      contrast_group: "numeral_0_5",
    }),
  ],
  relations: [
    { type: "sequence", source_id: "n0", target_id: "n1" },
    { type: "sequence", source_id: "n1", target_id: "n2" },
    { type: "sequence", source_id: "n2", target_id: "n3" },
    { type: "sequence", source_id: "n3", target_id: "n4" },
    { type: "sequence", source_id: "n4", target_id: "n5" },
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
      description: "Làm quen cơ bản với số 0–5",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng số 0–5",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt số 0–5 với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi số 0–5",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục số 0–5 và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chạm vào {label} nhé!",
    narration_template:
      "Gấu Logic nói: Mỗi con số từ 0 đến 5 đều mang một số lượng riêng biệt tương ứng.",
  },
  ordering: ["n0", "n1", "n2", "n3", "n4", "n5"],
};

export const C1_NREC_02_SEED: SkillSeed = {
  identity: C1_NREC_02_IDENTITY,
  dataset: C1_NREC_02_DATASET,
  levels: [
    {
      code: "GL-C1-NREC-CARD-0102",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      access_tier: "login",
      theme: "school",
      rounds: 3,
      montessori_ref: "WB01-D1",
    },
    {
      code: "GL-C1-NRC-QTA-0005",
      template: "GT-005",
      band: "5-6",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-NREC-TAP-0002",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
  ],
};
