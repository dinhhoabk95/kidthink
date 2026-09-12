import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";
import { numeralItem } from "#src/inventories/index";

export const C1_CNT_04_IDENTITY: SkillIdentity = {
  code: "C1.CNT.04",
  strand_code: "C1.CNT",
  competency_code: "C1",
  name: "Đếm ngược",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["count", "sequence"],
  tier: "core",
  prerequisites: ["C1.CNT.01", "C1.NREC.09"],
  learning_objectives: [
    {
      code: "LO-C1.CNT.04-01",
      behaviour: "Nhận biết và thực hành Đếm ngược ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.CNT.04-02",
      behaviour: "Vận dụng Đếm ngược trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.CNT.04-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Đếm ngược",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_CNT_04_DATASET: SkillDataset = {
  skill_code: "C1.CNT.04",
  concept_label: "Đếm ngược",
  surface: "game",
  items: [
    numeralItem("n0", {
      image: {
        kind: "emoji",
        ref: "0️⃣",
      },
    }),
    numeralItem("n1", {
      image: {
        kind: "emoji",
        ref: "1️⃣",
      },
    }),
    numeralItem("n2", {
      image: {
        kind: "emoji",
        ref: "2️⃣",
      },
    }),
    numeralItem("n3", {
      image: {
        kind: "emoji",
        ref: "3️⃣",
      },
    }),
    numeralItem("n4", {
      image: {
        kind: "emoji",
        ref: "4️⃣",
      },
    }),
    numeralItem("n5", {
      image: {
        kind: "emoji",
        ref: "5️⃣",
      },
    }),
    numeralItem("n6", {
      image: {
        kind: "emoji",
        ref: "6️⃣",
      },
    }),
    numeralItem("n7", {
      image: {
        kind: "emoji",
        ref: "7️⃣",
      },
    }),
    numeralItem("n8", {
      image: {
        kind: "emoji",
        ref: "8️⃣",
      },
    }),
    numeralItem("n9", {
      image: {
        kind: "emoji",
        ref: "9️⃣",
      },
    }),
    numeralItem("n10", {
      image: {
        kind: "emoji",
        ref: "🔟",
      },
    }),
    numeralItem("n11", {
      image: {
        kind: "emoji",
        ref: "1️⃣1️⃣",
      },
    }),
    numeralItem("n12", {
      image: {
        kind: "emoji",
        ref: "1️⃣2️⃣",
      },
    }),
    numeralItem("n13", {
      image: {
        kind: "emoji",
        ref: "1️⃣3️⃣",
      },
    }),
    numeralItem("n14", {
      image: {
        kind: "emoji",
        ref: "1️⃣4️⃣",
      },
    }),
    numeralItem("n15", {
      image: {
        kind: "emoji",
        ref: "1️⃣5️⃣",
      },
    }),
    numeralItem("n16", {
      image: {
        kind: "emoji",
        ref: "1️⃣6️⃣",
      },
    }),
    numeralItem("n17", {
      image: {
        kind: "emoji",
        ref: "1️⃣7️⃣",
      },
    }),
    numeralItem("n18", {
      image: {
        kind: "emoji",
        ref: "1️⃣8️⃣",
      },
    }),
    numeralItem("n19", {
      image: {
        kind: "emoji",
        ref: "1️⃣9️⃣",
      },
    }),
    numeralItem("n20", {
      image: {
        kind: "emoji",
        ref: "2️⃣0️⃣",
      },
    }),
  ],
  relations: [
    {
      type: "sequence",
      source_id: "n0",
      target_id: "n1",
    },
    {
      type: "sequence",
      source_id: "n1",
      target_id: "n2",
    },
    {
      type: "sequence",
      source_id: "n2",
      target_id: "n3",
    },
    {
      type: "sequence",
      source_id: "n3",
      target_id: "n4",
    },
    {
      type: "sequence",
      source_id: "n4",
      target_id: "n5",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với đếm ngược",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng đếm ngược",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt đếm ngược với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi đếm ngược",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục đếm ngược và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Bé đếm ngược xem còn mấy nhé!",
    narration_template: "Chúng mình cùng tìm hiểu về Đếm ngược nhé",
  },
  ordering: [
    "n20",
    "n19",
    "n18",
    "n17",
    "n16",
    "n15",
    "n14",
    "n13",
    "n12",
    "n11",
    "n10",
    "n9",
    "n8",
    "n7",
    "n6",
    "n5",
    "n4",
    "n3",
    "n2",
    "n1",
    "n0",
  ],
};

export const C1_CNT_04_SEED: SkillSeed = {
  identity: C1_CNT_04_IDENTITY,
  dataset: C1_CNT_04_DATASET,
  levels: [
    {
      code: "GL-C1-CNT-TAP-0006",
      template: "GT-028",
      band: "5-6",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
      legacy_v1_ref: "D1-10",
    },
    {
      code: "GL-C1-CNT-TAP-0007",
      template: "GT-028",
      band: "5-6",
      difficulty: 2,
      theme: "school",
      rounds: 3,
      legacy_v1_ref: "D1-10",
    },
    {
      code: "GL-C1-CNT-TAP-0008",
      template: "GT-028",
      band: "5-6",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
      legacy_v1_ref: "D1-10",
    },
    {
      code: "GL-C1-CNT-TAP-0009",
      template: "GT-028",
      band: "5-6",
      difficulty: 3,
      theme: "food",
      rounds: 3,
      legacy_v1_ref: "D1-10",
    },
    {
      code: "GL-C1-CNT-TAP-0010",
      template: "GT-028",
      band: "5-6",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
      legacy_v1_ref: "D1-10",
    },
    {
      code: "GL-C1-CNT-BCK-0001",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C1-CNT-BCK-0002",
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-CDW-ORD-0001",
      template: "GT-006",
      band: "5-6",
      difficulty: 1,
      theme: "school",
      rounds: 3,
      legacy_v1_ref: "D1-09",
    },
    {
      code: "GL-C1-CDW-ORD-0002",
      template: "GT-006",
      band: "5-6",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
      legacy_v1_ref: "D1-09",
    },
    {
      code: "GL-C1-CDW-ORD-0003",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "food",
      rounds: 3,
      legacy_v1_ref: "D1-09",
    },
    {
      code: "GL-C1-CDW-ORD-0004",
      template: "GT-006",
      band: "5-6",
      difficulty: 1,
      theme: "animal",
      rounds: 3,
      legacy_v1_ref: "D1-09",
    },
    {
      code: "GL-C1-SUB-FLS-0001",
      template: "GT-012",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
      legacy_v1_ref: "D1-06",
    },
    {
      code: "GL-C1-SUB-FLS-0002",
      template: "GT-012",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
      legacy_v1_ref: "D1-06",
    },
    {
      code: "GL-C1-SUB-FLS-0003",
      template: "GT-012",
      band: "3-4",
      difficulty: 3,
      theme: "food",
      rounds: 3,
      legacy_v1_ref: "D1-06",
    },
    {
      code: "GL-C1-SUB-FLS-0004",
      template: "GT-012",
      band: "4-5",
      difficulty: 1,
      theme: "animal",
      rounds: 3,
      legacy_v1_ref: "D1-06",
    },
    {
      code: "GL-C1-SUB-FLS-0005",
      template: "GT-012",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
      legacy_v1_ref: "D1-06",
    },
    {
      code: "GL-C1-CNT-TAP-0022",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-CNT-TAP-0023",
      template: "GT-001",
      band: "3-4",
      difficulty: 3,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-CNT-TAP-0024",
      template: "GT-001",
      band: "3-4",
      difficulty: 4,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-CNT-TCNT-0004",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-CNT-TCNT-0005",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-CNT-TCNT-0006",
      template: "GT-002",
      band: "4-5",
      difficulty: 4,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-CNT-TCNT-0007",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C1-CNT-TCMP-0006",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-CNT-TCMP-0007",
      template: "GT-003",
      band: "3-4",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-CNT-TCMP-0008",
      template: "GT-003",
      band: "3-4",
      difficulty: 4,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-CNT-TCMP-0009",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C1-CNT-SHAD-0011",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-CNT-SHAD-0012",
      template: "GT-007",
      band: "3-4",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-CNT-SHAD-0013",
      template: "GT-007",
      band: "3-4",
      difficulty: 4,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-CNT-SHAD-0014",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C1-CNT-SLOT-0001",
      template: "GT-008",
      band: "3-4",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-CNT-SLOT-0002",
      template: "GT-008",
      band: "3-4",
      difficulty: 3,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-CNT-SLOT-0003",
      template: "GT-008",
      band: "3-4",
      difficulty: 4,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-CNT-SLOT-0004",
      template: "GT-008",
      band: "3-4",
      difficulty: 2,
      theme: "homeland",
      rounds: 3,
    },
  ],
};
