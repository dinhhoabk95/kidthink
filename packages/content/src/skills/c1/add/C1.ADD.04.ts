import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";
import { numeralItem } from "#src/inventories/index";

export const C1_ADD_04_IDENTITY: SkillIdentity = {
  code: "C1.ADD.04",
  strand_code: "C1.ADD",
  competency_code: "C1",
  name: "Cộng trong phạm vi 5",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["solve"],
  tier: "core",
  prerequisites: ["C1.ADD.01"],
  learning_objectives: [
    {
      code: "LO-C1.ADD.04-01",
      behaviour: "Nhận biết và thực hành Cộng trong phạm vi 5 ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.ADD.04-02",
      behaviour: "Vận dụng Cộng trong phạm vi 5 trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.ADD.04-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Cộng trong phạm vi 5",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_ADD_04_DATASET: SkillDataset = {
  skill_code: "C1.ADD.04",
  concept_label: "Cộng trong phạm vi 5",
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
  ],
  relations: [
    {
      type: "subset",
      source_id: "n0",
      target_id: "n5",
      metadata: {
        bond_id: "bond_5_0_5",
        part_a: 0,
        part_b: 5,
        whole: 5,
      },
    },
    {
      type: "subset",
      source_id: "n1",
      target_id: "n5",
      metadata: {
        bond_id: "bond_5_1_4",
        part_a: 1,
        part_b: 4,
        whole: 5,
      },
    },
    {
      type: "subset",
      source_id: "n2",
      target_id: "n5",
      metadata: {
        bond_id: "bond_5_2_3",
        part_a: 2,
        part_b: 3,
        whole: 5,
      },
    },
    {
      type: "subset",
      source_id: "n3",
      target_id: "n5",
      metadata: {
        bond_id: "bond_5_3_2",
        part_a: 3,
        part_b: 2,
        whole: 5,
      },
    },
    {
      type: "subset",
      source_id: "n4",
      target_id: "n5",
      metadata: {
        bond_id: "bond_5_4_1",
        part_a: 4,
        part_b: 1,
        whole: 5,
      },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với cộng trong phạm vi 5",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng cộng trong phạm vi 5",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt cộng trong phạm vi 5 với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi cộng trong phạm vi 5",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục cộng trong phạm vi 5 và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Gộp lại có tất cả bao nhiêu {label}?",
    narration_template: "Chúng mình cùng tìm hiểu về Cộng trong phạm vi 5 nhé",
  },
  ordering: ["n0", "n1", "n2", "n3", "n4", "n5"],
};

export const C1_ADD_04_SEED: SkillSeed = {
  identity: C1_ADD_04_IDENTITY,
  dataset: C1_ADD_04_DATASET,
  levels: [
    {
      code: "GL-C1-ADD-PICT-0006",
      template: "GT-031",
      band: "5-6",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-PICT-0007",
      template: "GT-031",
      band: "5-6",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-PICT-0008",
      template: "GT-031",
      band: "5-6",
      difficulty: 4,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-PICT-0009",
      template: "GT-031",
      band: "5-6",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-PICT-0010",
      template: "GT-031",
      band: "5-6",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-TAP-0010",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-TAP-0011",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-TAP-0012",
      template: "GT-001",
      band: "4-5",
      difficulty: 4,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-TAP-0013",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-TAP-0014",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-TCMP-0010",
      template: "GT-003",
      band: "4-5",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-TCMP-0011",
      template: "GT-003",
      band: "4-5",
      difficulty: 3,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-TCMP-0012",
      template: "GT-003",
      band: "4-5",
      difficulty: 4,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-TCMP-0013",
      template: "GT-003",
      band: "4-5",
      difficulty: 2,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-TCMP-0014",
      template: "GT-003",
      band: "4-5",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-PATT-0006",
      template: "GT-005",
      band: "4-5",
      difficulty: 2,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-PATT-0007",
      template: "GT-005",
      band: "4-5",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-PATT-0008",
      template: "GT-005",
      band: "4-5",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-PATT-0009",
      template: "GT-005",
      band: "4-5",
      difficulty: 2,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-PATT-0010",
      template: "GT-005",
      band: "4-5",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
  ],
};
