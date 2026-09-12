import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";
import { numeralItem } from "#src/inventories/index";

export const C1_SUB_04_IDENTITY: SkillIdentity = {
  code: "C1.SUB.04",
  strand_code: "C1.SUB",
  competency_code: "C1",
  name: "Trừ trong phạm vi 10",
  age_min: 6,
  age_max: 6,
  difficulty: 4,
  thinking_processes: ["solve"],
  tier: "advanced",
  prerequisites: ["C1.SUB.03"],
  learning_objectives: [
    {
      code: "LO-C1.SUB.04-01",
      behaviour: "Nhận biết và thực hành Trừ trong phạm vi 10 ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.SUB.04-02",
      behaviour: "Vận dụng Trừ trong phạm vi 10 trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.SUB.04-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Trừ trong phạm vi 10",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_SUB_04_DATASET: SkillDataset = {
  skill_code: "C1.SUB.04",
  concept_label: "Trừ trong phạm vi 10",
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
  ],
  relations: [
    {
      type: "subset",
      source_id: "n0",
      target_id: "n10",
      metadata: {
        bond_id: "bond_10_0_10",
        part_a: 0,
        part_b: 10,
        whole: 10,
      },
    },
    {
      type: "subset",
      source_id: "n1",
      target_id: "n10",
      metadata: {
        bond_id: "bond_10_1_9",
        part_a: 1,
        part_b: 9,
        whole: 10,
      },
    },
    {
      type: "subset",
      source_id: "n2",
      target_id: "n10",
      metadata: {
        bond_id: "bond_10_2_8",
        part_a: 2,
        part_b: 8,
        whole: 10,
      },
    },
    {
      type: "subset",
      source_id: "n3",
      target_id: "n10",
      metadata: {
        bond_id: "bond_10_3_7",
        part_a: 3,
        part_b: 7,
        whole: 10,
      },
    },
    {
      type: "subset",
      source_id: "n4",
      target_id: "n10",
      metadata: {
        bond_id: "bond_10_4_6",
        part_a: 4,
        part_b: 6,
        whole: 10,
      },
    },
    {
      type: "subset",
      source_id: "n5",
      target_id: "n10",
      metadata: {
        bond_id: "bond_10_5_5",
        part_a: 5,
        part_b: 5,
        whole: 10,
      },
    },
    {
      type: "subset",
      source_id: "n6",
      target_id: "n10",
      metadata: {
        bond_id: "bond_10_6_4",
        part_a: 6,
        part_b: 4,
        whole: 10,
      },
    },
    {
      type: "subset",
      source_id: "n7",
      target_id: "n10",
      metadata: {
        bond_id: "bond_10_7_3",
        part_a: 7,
        part_b: 3,
        whole: 10,
      },
    },
    {
      type: "subset",
      source_id: "n8",
      target_id: "n10",
      metadata: {
        bond_id: "bond_10_8_2",
        part_a: 8,
        part_b: 2,
        whole: 10,
      },
    },
    {
      type: "subset",
      source_id: "n9",
      target_id: "n10",
      metadata: {
        bond_id: "bond_10_9_1",
        part_a: 9,
        part_b: 1,
        whole: 10,
      },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với trừ trong phạm vi 10",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng trừ trong phạm vi 10",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt trừ trong phạm vi 10 với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi trừ trong phạm vi 10",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục trừ trong phạm vi 10 và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Bớt đi thì còn lại bao nhiêu {label}?",
    narration_template: "Chúng mình cùng tìm hiểu về Trừ trong phạm vi 10 nhé",
  },
  ordering: ["n0", "n1", "n2", "n3", "n4", "n5", "n6", "n7", "n8", "n9", "n10"],
};

export const C1_SUB_04_SEED: SkillSeed = {
  identity: C1_SUB_04_IDENTITY,
  dataset: C1_SUB_04_DATASET,
  levels: [
    {
      code: "GL-C1-SUB-PICT-0011",
      template: "GT-031",
      band: "5-6",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-PICT-0012",
      template: "GT-031",
      band: "5-6",
      difficulty: 4,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-PICT-0013",
      template: "GT-031",
      band: "5-6",
      difficulty: 5,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-PICT-0014",
      template: "GT-031",
      band: "5-6",
      difficulty: 3,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-PICT-0015",
      template: "GT-031",
      band: "5-6",
      difficulty: 4,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-TAP-0015",
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-TAP-0016",
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-TAP-0017",
      template: "GT-001",
      band: "5-6",
      difficulty: 5,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-TAP-0018",
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-TAP-0019",
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-TCMP-0015",
      template: "GT-003",
      band: "5-6",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-TCMP-0016",
      template: "GT-003",
      band: "5-6",
      difficulty: 4,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-TCMP-0017",
      template: "GT-003",
      band: "5-6",
      difficulty: 5,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-TCMP-0018",
      template: "GT-003",
      band: "5-6",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-TCMP-0019",
      template: "GT-003",
      band: "5-6",
      difficulty: 4,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-PATT-0011",
      template: "GT-005",
      band: "5-6",
      difficulty: 3,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-PATT-0012",
      template: "GT-005",
      band: "5-6",
      difficulty: 4,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-PATT-0013",
      template: "GT-005",
      band: "5-6",
      difficulty: 5,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-PATT-0014",
      template: "GT-005",
      band: "5-6",
      difficulty: 3,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-PATT-0015",
      template: "GT-005",
      band: "5-6",
      difficulty: 4,
      theme: "body",
      rounds: 3,
    },
  ],
};
