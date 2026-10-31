import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";
import { numeralItem } from "#src/inventories/index";

export const C1_NREC_07_IDENTITY: SkillIdentity = {
  code: "C1.NREC.07",
  strand_code: "C1.NREC",
  competency_code: "C1",
  name: "Đọc số",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["describe"],
  tier: "basic",
  prerequisites: ["C1.NREC.03"],
  learning_objectives: [
    {
      code: "LO-C1.NREC.07-01",
      behaviour: "Nhận biết và thực hành Đọc số ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.NREC.07-02",
      behaviour: "Vận dụng Đọc số trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.NREC.07-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Đọc số",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_NREC_07_DATASET: SkillDataset = {
  skill_code: "C1.NREC.07",
  concept_label: "Đọc số",
  surface: "game",
  items: [
    numeralItem("n0", {
      label: "số 0",
      image: {
        kind: "emoji",
        ref: "🧁",
      },
      category: {
        type: "tên số",
      },
      contrast_group: "numeral_read",
    }),
    numeralItem("n1", {
      image: {
        kind: "emoji",
        ref: "🍰",
      },
      category: {
        type: "tên số",
      },
      contrast_group: "numeral_read",
    }),
    numeralItem("n2", {
      image: {
        kind: "emoji",
        ref: "🥐",
      },
      category: {
        type: "tên số",
      },
      contrast_group: "numeral_read",
    }),
    numeralItem("n3", {
      image: {
        kind: "emoji",
        ref: "🍩",
      },
      category: {
        type: "tên số",
      },
      contrast_group: "numeral_read",
    }),
    numeralItem("n4", {
      image: {
        kind: "emoji",
        ref: "🍪",
      },
      category: {
        type: "tên số",
      },
      contrast_group: "numeral_read",
    }),
    numeralItem("n5", {
      image: {
        kind: "emoji",
        ref: "🥞",
      },
      category: {
        type: "tên số",
      },
      contrast_group: "numeral_read",
    }),
  ],
  relations: [
    { type: "sequence", source_id: "n0", target_id: "n1" },
    { type: "sequence", source_id: "n1", target_id: "n2" },
    { type: "sequence", source_id: "n2", target_id: "n3" },
    { type: "sequence", source_id: "n3", target_id: "n4" },
    { type: "sequence", source_id: "n4", target_id: "n5" },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với đọc số",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và đọc đúng chữ số",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt chữ số với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi đọc số",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục đọc số và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn đúng {label} nhé!",
    narration_template: "Chúng mình cùng tìm hiểu về đọc số nhé",
  },
  ordering: ["n0", "n1", "n2", "n3", "n4", "n5"],
};

export const C1_NREC_07_SEED: SkillSeed = {
  identity: C1_NREC_07_IDENTITY,
  dataset: C1_NREC_07_DATASET,
  levels: [
    {
      code: "GL-C1-ORD-SLOT-0003",
      template: "GT-008",
      band: "3-4",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-NREC-TAP-0020",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-NREC-TAP-0021",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
  ],
};
