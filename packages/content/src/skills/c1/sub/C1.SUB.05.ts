import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";
import { numeralItem } from "#src/inventories/index";

export const C1_SUB_05_IDENTITY: SkillIdentity = {
  code: "C1.SUB.05",
  strand_code: "C1.SUB",
  competency_code: "C1",
  name: "Tìm số còn lại",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["infer", "solve"],
  tier: "advanced",
  prerequisites: ["C1.SUB.01", "C1.NCOMP.09"],
  learning_objectives: [
    {
      code: "LO-C1.SUB.05-01",
      behaviour: "Nhận biết và thực hành Tìm số còn lại ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.SUB.05-02",
      behaviour: "Vận dụng Tìm số còn lại trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.SUB.05-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Tìm số còn lại",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_SUB_05_DATASET: SkillDataset = {
  skill_code: "C1.SUB.05",
  concept_label: "Tìm số còn lại",
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
      description: "Làm quen cơ bản với tìm số còn lại",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng tìm số còn lại",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt tìm số còn lại với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi tìm số còn lại",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục tìm số còn lại và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Bớt đi thì còn lại bao nhiêu {label}?",
    narration_template: "Chúng mình cùng tìm hiểu về Tìm số còn lại nhé",
  },
  ordering: ["n0", "n1", "n2", "n3", "n4", "n5", "n6", "n7", "n8", "n9", "n10"],
};

export const C1_SUB_05_SEED: SkillSeed = {
  identity: C1_SUB_05_IDENTITY,
  dataset: C1_SUB_05_DATASET,
  levels: [
    {
      code: "GL-C1-HNT-TAP-0009",
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      theme: "home",
      rounds: 3,
      legacy_v1_ref: "D1-11",
    },
    {
      code: "GL-C1-HNT-TAP-0010",
      template: "GT-001",
      band: "5-6",
      difficulty: 1,
      theme: "festival",
      rounds: 3,
      legacy_v1_ref: "D1-11",
    },
    {
      code: "GL-C1-SUB-PAIR-0001",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-PAIR-0002",
      template: "GT-004",
      band: "4-5",
      difficulty: 4,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-PAIR-0003",
      template: "GT-004",
      band: "4-5",
      difficulty: 5,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-PAIR-0004",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-SORT-0001",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-SORT-0002",
      template: "GT-006",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-SORT-0003",
      template: "GT-006",
      band: "5-6",
      difficulty: 5,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-SORT-0004",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-SHAD-0005",
      template: "GT-007",
      band: "4-5",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-SHAD-0006",
      template: "GT-007",
      band: "4-5",
      difficulty: 4,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-SHAD-0007",
      template: "GT-007",
      band: "4-5",
      difficulty: 5,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-SHAD-0008",
      template: "GT-007",
      band: "4-5",
      difficulty: 3,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-SIZE-0001",
      template: "GT-009",
      band: "4-5",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-SIZE-0002",
      template: "GT-009",
      band: "4-5",
      difficulty: 4,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-SIZE-0003",
      template: "GT-009",
      band: "4-5",
      difficulty: 5,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-SIZE-0004",
      template: "GT-009",
      band: "4-5",
      difficulty: 3,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-PUZZ-0001",
      template: "GT-010",
      band: "4-5",
      difficulty: 3,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-PUZZ-0002",
      template: "GT-010",
      band: "4-5",
      difficulty: 4,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-PUZZ-0003",
      template: "GT-010",
      band: "4-5",
      difficulty: 5,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-PUZZ-0004",
      template: "GT-010",
      band: "4-5",
      difficulty: 3,
      theme: "homeland",
      rounds: 3,
    },
  ],
};
