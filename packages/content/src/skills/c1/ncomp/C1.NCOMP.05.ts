import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";
import { numeralItem } from "#src/inventories/index";

export const C1_NCOMP_05_IDENTITY: SkillIdentity = {
  code: "C1.NCOMP.05",
  strand_code: "C1.NCOMP",
  competency_code: "C1",
  name: "Tách số 6",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["solve"],
  tier: "core",
  prerequisites: ["C1.NCOMP.04"],
  learning_objectives: [
    {
      code: "LO-C1.NCOMP.05-01",
      behaviour: "Nhận biết và thực hành Tách số 6 ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.NCOMP.05-02",
      behaviour: "Vận dụng Tách số 6 trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.NCOMP.05-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Tách số 6",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_NCOMP_05_DATASET: SkillDataset = {
  skill_code: "C1.NCOMP.05",
  concept_label: "Tách số 6",
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
  ],
  relations: [
    {
      type: "subset",
      source_id: "n0",
      target_id: "n6",
      metadata: {
        bond_id: "bond_6_0_6",
        part_a: 0,
        part_b: 6,
        whole: 6,
      },
    },
    {
      type: "subset",
      source_id: "n1",
      target_id: "n6",
      metadata: {
        bond_id: "bond_6_1_5",
        part_a: 1,
        part_b: 5,
        whole: 6,
      },
    },
    {
      type: "subset",
      source_id: "n2",
      target_id: "n6",
      metadata: {
        bond_id: "bond_6_2_4",
        part_a: 2,
        part_b: 4,
        whole: 6,
      },
    },
    {
      type: "subset",
      source_id: "n3",
      target_id: "n6",
      metadata: {
        bond_id: "bond_6_3_3",
        part_a: 3,
        part_b: 3,
        whole: 6,
      },
    },
    {
      type: "subset",
      source_id: "n4",
      target_id: "n6",
      metadata: {
        bond_id: "bond_6_4_2",
        part_a: 4,
        part_b: 2,
        whole: 6,
      },
    },
    {
      type: "subset",
      source_id: "n5",
      target_id: "n6",
      metadata: {
        bond_id: "bond_6_5_1",
        part_a: 5,
        part_b: 1,
        whole: 6,
      },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với tách số 6",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng tách số 6",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt tách số 6 với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi tách số 6",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục tách số 6 và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Thêm mấy nữa thì đủ 6 hả bé?",
    narration_template: "Chúng mình cùng tìm hiểu về Tách số 6 nhé",
  },
  ordering: ["n0", "n1", "n2", "n3", "n4", "n5", "n6"],
};

export const C1_NCOMP_05_SEED: SkillSeed = {
  identity: C1_NCOMP_05_IDENTITY,
  dataset: C1_NCOMP_05_DATASET,
  levels: [
    {
      code: "GL-C1-NCOMP-PICT-0001",
      template: "GT-031",
      band: "5-6",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-PICT-0002",
      template: "GT-031",
      band: "5-6",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-PICT-0003",
      template: "GT-031",
      band: "5-6",
      difficulty: 4,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-PICT-0004",
      template: "GT-031",
      band: "5-6",
      difficulty: 2,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-PICT-0005",
      template: "GT-031",
      band: "5-6",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-TAP-0021",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-TAP-0022",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-TAP-0023",
      template: "GT-001",
      band: "4-5",
      difficulty: 4,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-TAP-0024",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-TAP-0025",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-TCMP-0021",
      template: "GT-003",
      band: "4-5",
      difficulty: 2,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-TCMP-0022",
      template: "GT-003",
      band: "4-5",
      difficulty: 3,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-TCMP-0023",
      template: "GT-003",
      band: "4-5",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-TCMP-0024",
      template: "GT-003",
      band: "4-5",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-TCMP-0025",
      template: "GT-003",
      band: "4-5",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-PATT-0001",
      template: "GT-005",
      band: "4-5",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-PATT-0002",
      template: "GT-005",
      band: "4-5",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-PATT-0003",
      template: "GT-005",
      band: "4-5",
      difficulty: 4,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-PATT-0004",
      template: "GT-005",
      band: "4-5",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-PATT-0005",
      template: "GT-005",
      band: "4-5",
      difficulty: 3,
      theme: "vehicle",
      rounds: 3,
    },
  ],
};
