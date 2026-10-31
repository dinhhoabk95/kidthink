import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";
import { numeralItem } from "#src/inventories/index";

export const C1_NREC_08_IDENTITY: SkillIdentity = {
  code: "C1.NREC.08",
  strand_code: "C1.NREC",
  competency_code: "C1",
  name: "Viết số theo nét",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["observe"],
  tier: "core",
  prerequisites: ["C1.NREC.03"],
  learning_objectives: [
    {
      code: "LO-C1.NREC.08-01",
      behaviour: "Nhận biết và thực hành Viết số theo nét ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.NREC.08-02",
      behaviour: "Vận dụng Viết số theo nét trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.NREC.08-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Viết số theo nét",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_NREC_08_DATASET: SkillDataset = {
  skill_code: "C1.NREC.08",
  concept_label: "Viết số theo nét",
  surface: "game",
  items: [
    numeralItem("n0", {
      label: "số 0",
      image: {
        kind: "emoji",
        ref: "🪹",
      },
      category: {
        type: "nét viết số",
        parity: "chẵn",
      },
      contrast_group: "numeral_trace",
    }),
    numeralItem("n1", {
      image: {
        kind: "emoji",
        ref: "✏️",
      },
      category: {
        type: "nét viết số",
        parity: "lẻ",
      },
      contrast_group: "numeral_trace",
    }),
    numeralItem("n2", {
      image: {
        kind: "emoji",
        ref: "🖍️",
      },
      category: {
        type: "nét viết số",
        parity: "chẵn",
      },
      contrast_group: "numeral_trace",
    }),
    numeralItem("n3", {
      image: {
        kind: "emoji",
        ref: "📏",
      },
      category: {
        type: "nét viết số",
        parity: "lẻ",
      },
      contrast_group: "numeral_trace",
    }),
    numeralItem("n4", {
      image: {
        kind: "emoji",
        ref: "🖌️",
      },
      category: {
        type: "nét viết số",
        parity: "chẵn",
      },
      contrast_group: "numeral_trace",
    }),
    numeralItem("n5", {
      image: {
        kind: "emoji",
        ref: "📐",
      },
      category: {
        type: "nét viết số",
        parity: "lẻ",
      },
      contrast_group: "numeral_trace",
    }),
    numeralItem("n6", {
      image: {
        kind: "emoji",
        ref: "✂️",
      },
      category: {
        type: "nét viết số",
        parity: "chẵn",
      },
      contrast_group: "numeral_trace",
    }),
    numeralItem("n7", {
      image: {
        kind: "emoji",
        ref: "📌",
      },
      category: {
        type: "nét viết số",
        parity: "lẻ",
      },
      contrast_group: "numeral_trace",
    }),
    numeralItem("n8", {
      image: {
        kind: "emoji",
        ref: "📎",
      },
      category: {
        type: "nét viết số",
        parity: "chẵn",
      },
      contrast_group: "numeral_trace",
    }),
    numeralItem("n9", {
      image: {
        kind: "emoji",
        ref: "🎨",
      },
      category: {
        type: "nét viết số",
        parity: "lẻ",
      },
      contrast_group: "numeral_trace",
    }),
    numeralItem("n10", {
      image: {
        kind: "emoji",
        ref: "🎒",
      },
      category: {
        type: "nét viết số",
        parity: "chẵn",
      },
      contrast_group: "numeral_trace",
    }),
  ],
  relations: [
    { type: "sequence", source_id: "n0", target_id: "n1" },
    { type: "sequence", source_id: "n1", target_id: "n2" },
    { type: "sequence", source_id: "n2", target_id: "n3" },
    { type: "sequence", source_id: "n3", target_id: "n4" },
    { type: "sequence", source_id: "n4", target_id: "n5" },
    { type: "sequence", source_id: "n5", target_id: "n6" },
    { type: "sequence", source_id: "n6", target_id: "n7" },
    { type: "sequence", source_id: "n7", target_id: "n8" },
    { type: "sequence", source_id: "n8", target_id: "n9" },
    { type: "sequence", source_id: "n9", target_id: "n10" },
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
      description: "Làm quen cơ bản với viết số theo nét",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và viết đúng nét chữ số",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt nét viết số với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi viết số theo nét",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục viết số theo nét và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy nối các điểm theo nét để tạo thành số nhé!",
    narration_template: "Chúng mình cùng tô theo nét để viết các chữ số nhé",
  },
  ordering: ["n0", "n1", "n2", "n3", "n4", "n5", "n6", "n7", "n8", "n9", "n10"],
};

export const C1_NREC_08_SEED: SkillSeed = {
  identity: C1_NREC_08_IDENTITY,
  dataset: C1_NREC_08_DATASET,
  levels: [
    {
      code: "GL-C1-ORD-SLOT-0005",
      template: "GT-008",
      band: "4-5",
      difficulty: 2,
      access_tier: "login",
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-DOT-TRC-0001",
      template: "GT-024",
      band: "5-6",
      difficulty: 1,
      access_tier: "free",
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-DOT-TRC-0002",
      template: "GT-024",
      band: "5-6",
      difficulty: 2,
      access_tier: "login",
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C1-DOT-TRC-0003",
      template: "GT-024",
      band: "5-6",
      difficulty: 3,
      access_tier: "standard",
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-NREC-TRAC-0101",
      template: "GT-024",
      band: "5-6",
      difficulty: 2,
      access_tier: "login",
      theme: "school",
      rounds: 5,
      montessori_ref: "WB01-D4",
    },
    {
      code: "GL-C1-NREC-TRAC-0102",
      template: "GT-024",
      band: "5-6",
      difficulty: 3,
      access_tier: "standard",
      theme: "school",
      rounds: 5,
      montessori_ref: "WB01-D4",
    },
  ],
};
