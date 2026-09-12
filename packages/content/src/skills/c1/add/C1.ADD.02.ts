import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";
import { numeralItem } from "#src/inventories/index";

export const C1_ADD_02_IDENTITY: SkillIdentity = {
  code: "C1.ADD.02",
  strand_code: "C1.ADD",
  competency_code: "C1",
  name: "Cộng bằng hình",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["solve"],
  tier: "core",
  prerequisites: ["C1.ADD.01"],
  learning_objectives: [
    {
      code: "LO-C1.ADD.02-01",
      behaviour: "Nhận biết và thực hành Cộng bằng hình ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.ADD.02-02",
      behaviour: "Vận dụng Cộng bằng hình trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.ADD.02-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Cộng bằng hình",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_ADD_02_DATASET: SkillDataset = {
  skill_code: "C1.ADD.02",
  concept_label: "Cộng bằng hình",
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
      target_id: "n7",
      metadata: {
        bond_id: "bond_7_0_7",
        part_a: 0,
        part_b: 7,
        whole: 7,
      },
    },
    {
      type: "subset",
      source_id: "n1",
      target_id: "n7",
      metadata: {
        bond_id: "bond_7_1_6",
        part_a: 1,
        part_b: 6,
        whole: 7,
      },
    },
    {
      type: "subset",
      source_id: "n2",
      target_id: "n7",
      metadata: {
        bond_id: "bond_7_2_5",
        part_a: 2,
        part_b: 5,
        whole: 7,
      },
    },
    {
      type: "subset",
      source_id: "n3",
      target_id: "n7",
      metadata: {
        bond_id: "bond_7_3_4",
        part_a: 3,
        part_b: 4,
        whole: 7,
      },
    },
    {
      type: "subset",
      source_id: "n4",
      target_id: "n7",
      metadata: {
        bond_id: "bond_7_4_3",
        part_a: 4,
        part_b: 3,
        whole: 7,
      },
    },
    {
      type: "subset",
      source_id: "n5",
      target_id: "n7",
      metadata: {
        bond_id: "bond_7_5_2",
        part_a: 5,
        part_b: 2,
        whole: 7,
      },
    },
    {
      type: "subset",
      source_id: "n6",
      target_id: "n7",
      metadata: {
        bond_id: "bond_7_6_1",
        part_a: 6,
        part_b: 1,
        whole: 7,
      },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với cộng bằng hình",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng cộng bằng hình",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt cộng bằng hình với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi cộng bằng hình",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục cộng bằng hình và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Gộp lại có tất cả bao nhiêu {label}?",
    narration_template: "Chúng mình cùng tìm hiểu về Cộng bằng hình nhé",
  },
  ordering: ["n0", "n1", "n2", "n3", "n4", "n5", "n6", "n7", "n8", "n9", "n10"],
};

export const C1_ADD_02_SEED: SkillSeed = {
  identity: C1_ADD_02_IDENTITY,
  dataset: C1_ADD_02_DATASET,
  levels: [
    {
      code: "GL-C1-ADD-PICT-0001",
      template: "GT-031",
      band: "5-6",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-PICT-0002",
      template: "GT-031",
      band: "5-6",
      difficulty: 3,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-PICT-0003",
      template: "GT-031",
      band: "5-6",
      difficulty: 4,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-PICT-0004",
      template: "GT-031",
      band: "5-6",
      difficulty: 2,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-PICT-0005",
      template: "GT-031",
      band: "5-6",
      difficulty: 3,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-TAP-0005",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-TAP-0006",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-TAP-0007",
      template: "GT-001",
      band: "4-5",
      difficulty: 4,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-TAP-0008",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-TAP-0009",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-TCMP-0005",
      template: "GT-003",
      band: "4-5",
      difficulty: 2,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-TCMP-0006",
      template: "GT-003",
      band: "4-5",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-TCMP-0007",
      template: "GT-003",
      band: "4-5",
      difficulty: 4,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-TCMP-0008",
      template: "GT-003",
      band: "4-5",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-TCMP-0009",
      template: "GT-003",
      band: "4-5",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-PATT-0001",
      template: "GT-005",
      band: "4-5",
      difficulty: 2,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-PATT-0002",
      template: "GT-005",
      band: "4-5",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-PATT-0003",
      template: "GT-005",
      band: "4-5",
      difficulty: 4,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-PATT-0004",
      template: "GT-005",
      band: "4-5",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-PATT-0005",
      template: "GT-005",
      band: "4-5",
      difficulty: 3,
      theme: "body",
      rounds: 3,
    },
  ],
};
