import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";
import { numeralItem } from "#src/inventories/index";

export const C1_ADD_03_IDENTITY: SkillIdentity = {
  code: "C1.ADD.03",
  strand_code: "C1.ADD",
  competency_code: "C1",
  name: "Cộng trên trục số",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["sequence", "solve"],
  tier: "core",
  prerequisites: ["C1.CNT.08"],
  learning_objectives: [
    {
      code: "LO-C1.ADD.03-01",
      behaviour: "Nhận biết và thực hành Cộng trên trục số ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.ADD.03-02",
      behaviour: "Vận dụng Cộng trên trục số trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.ADD.03-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Cộng trên trục số",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_ADD_03_DATASET: SkillDataset = {
  skill_code: "C1.ADD.03",
  concept_label: "Cộng trên trục số",
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
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với cộng trên trục số",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng cộng trên trục số",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt cộng trên trục số với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi cộng trên trục số",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục cộng trên trục số và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Gộp lại có tất cả bao nhiêu {label}?",
    narration_template: "Chúng mình cùng tìm hiểu về Cộng trên trục số nhé",
  },
  ordering: ["n0", "n1", "n2", "n3", "n4", "n5", "n6", "n7", "n8", "n9", "n10"],
};

export const C1_ADD_03_SEED: SkillSeed = {
  identity: C1_ADD_03_IDENTITY,
  dataset: C1_ADD_03_DATASET,
  levels: [
    {
      code: "GL-C1-ADD-SORT-0001",
      template: "GT-006",
      band: "5-6",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-SORT-0002",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-SORT-0003",
      template: "GT-006",
      band: "5-6",
      difficulty: 4,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-SORT-0004",
      template: "GT-006",
      band: "5-6",
      difficulty: 2,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-SLOT-0001",
      template: "GT-008",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-SLOT-0002",
      template: "GT-008",
      band: "4-5",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-SLOT-0003",
      template: "GT-008",
      band: "4-5",
      difficulty: 4,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-SLOT-0004",
      template: "GT-008",
      band: "4-5",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-MAZE-0001",
      template: "GT-013",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-MAZE-0002",
      template: "GT-013",
      band: "4-5",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-MAZE-0003",
      template: "GT-013",
      band: "4-5",
      difficulty: 4,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-MAZE-0004",
      template: "GT-013",
      band: "4-5",
      difficulty: 2,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-BAL-0001",
      template: "GT-016",
      band: "5-6",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-BAL-0002",
      template: "GT-016",
      band: "5-6",
      difficulty: 3,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-BAL-0003",
      template: "GT-016",
      band: "5-6",
      difficulty: 4,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-BAL-0004",
      template: "GT-016",
      band: "5-6",
      difficulty: 2,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-BOND-0001",
      template: "GT-018",
      band: "4-5",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-BOND-0002",
      template: "GT-018",
      band: "4-5",
      difficulty: 3,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-BOND-0003",
      template: "GT-018",
      band: "4-5",
      difficulty: 4,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-ADD-BOND-0004",
      template: "GT-018",
      band: "4-5",
      difficulty: 2,
      theme: "homeland",
      rounds: 3,
    },
  ],
};
