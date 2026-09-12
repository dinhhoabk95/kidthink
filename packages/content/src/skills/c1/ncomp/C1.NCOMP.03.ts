import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";
import { numeralItem } from "#src/inventories/index";

export const C1_NCOMP_03_IDENTITY: SkillIdentity = {
  code: "C1.NCOMP.03",
  strand_code: "C1.NCOMP",
  competency_code: "C1",
  name: "Tách số 4",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["solve"],
  tier: "basic",
  prerequisites: ["C1.NCOMP.02"],
  learning_objectives: [
    {
      code: "LO-C1.NCOMP.03-01",
      behaviour: "Nhận biết và thực hành Tách số 4 ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.NCOMP.03-02",
      behaviour: "Vận dụng Tách số 4 trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.NCOMP.03-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Tách số 4",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_NCOMP_03_DATASET: SkillDataset = {
  skill_code: "C1.NCOMP.03",
  concept_label: "Tách số 4",
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
      target_id: "n4",
      metadata: {
        bond_id: "bond_4_0_4",
        part_a: 0,
        part_b: 4,
        whole: 4,
      },
    },
    {
      type: "subset",
      source_id: "n1",
      target_id: "n4",
      metadata: {
        bond_id: "bond_4_1_3",
        part_a: 1,
        part_b: 3,
        whole: 4,
      },
    },
    {
      type: "subset",
      source_id: "n2",
      target_id: "n4",
      metadata: {
        bond_id: "bond_4_2_2",
        part_a: 2,
        part_b: 2,
        whole: 4,
      },
    },
    {
      type: "subset",
      source_id: "n3",
      target_id: "n4",
      metadata: {
        bond_id: "bond_4_3_1",
        part_a: 3,
        part_b: 1,
        whole: 4,
      },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với tách số 4",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng tách số 4",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt tách số 4 với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi tách số 4",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục tách số 4 và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Thêm mấy nữa thì đủ 4 hả bé?",
    narration_template: "Chúng mình cùng tìm hiểu về Tách số 4 nhé",
  },
  ordering: ["n0", "n1", "n2", "n3", "n4", "n5"],
};

export const C1_NCOMP_03_SEED: SkillSeed = {
  identity: C1_NCOMP_03_IDENTITY,
  dataset: C1_NCOMP_03_DATASET,
  levels: [
    {
      code: "GL-C1-NCOMP-TAP-0011",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-TAP-0012",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-TAP-0013",
      template: "GT-001",
      band: "3-4",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-TAP-0014",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-TAP-0015",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-TCNT-0011",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-TCNT-0012",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-TCNT-0013",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-TCNT-0014",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-TCNT-0015",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-TCMP-0011",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-TCMP-0012",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-TCMP-0013",
      template: "GT-003",
      band: "3-4",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-TCMP-0014",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-TCMP-0015",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-PAIR-0011",
      template: "GT-004",
      band: "4-5",
      difficulty: 1,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-PAIR-0012",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-PAIR-0013",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-PAIR-0014",
      template: "GT-004",
      band: "4-5",
      difficulty: 1,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-PAIR-0015",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "homeland",
      rounds: 3,
    },
  ],
};
