import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";
import { numeralItem } from "#src/inventories/index";

export const C1_SUB_01_IDENTITY: SkillIdentity = {
  code: "C1.SUB.01",
  strand_code: "C1.SUB",
  competency_code: "C1",
  name: "Bớt đồ vật",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["count", "solve"],
  tier: "basic",
  prerequisites: ["C1.CNT.01"],
  learning_objectives: [
    {
      code: "LO-C1.SUB.01-01",
      behaviour: "Nhận biết và thực hành Bớt đồ vật ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.SUB.01-02",
      behaviour: "Vận dụng Bớt đồ vật trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.SUB.01-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Bớt đồ vật",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_SUB_01_DATASET: SkillDataset = {
  skill_code: "C1.SUB.01",
  concept_label: "Bớt đồ vật",
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
      description: "Làm quen cơ bản với bớt đồ vật",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng bớt đồ vật",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt bớt đồ vật với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi bớt đồ vật",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục bớt đồ vật và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Bớt đi thì còn lại bao nhiêu {label}?",
    narration_template: "Chúng mình cùng tìm hiểu về Bớt đồ vật nhé",
  },
  ordering: ["n0", "n1", "n2", "n3", "n4", "n5"],
};

export const C1_SUB_01_SEED: SkillSeed = {
  identity: C1_SUB_01_IDENTITY,
  dataset: C1_SUB_01_DATASET,
  levels: [
    {
      code: "GL-C1-SUB-TAP-0001",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-TAP-0002",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-TAP-0003",
      template: "GT-001",
      band: "3-4",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-TAP-0004",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-TCNT-0001",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-TCNT-0002",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-TCNT-0003",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-TCNT-0004",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-TCMP-0001",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-TCMP-0002",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-TCMP-0003",
      template: "GT-003",
      band: "3-4",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-TCMP-0004",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-SHAD-0001",
      template: "GT-007",
      band: "3-4",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-SHAD-0002",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-SHAD-0003",
      template: "GT-007",
      band: "3-4",
      difficulty: 3,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-SHAD-0004",
      template: "GT-007",
      band: "3-4",
      difficulty: 1,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-MEMO-0001",
      template: "GT-012",
      band: "3-4",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-MEMO-0002",
      template: "GT-012",
      band: "3-4",
      difficulty: 2,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-MEMO-0003",
      template: "GT-012",
      band: "3-4",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-MEMO-0004",
      template: "GT-012",
      band: "3-4",
      difficulty: 1,
      theme: "homeland",
      rounds: 3,
    },
  ],
};
