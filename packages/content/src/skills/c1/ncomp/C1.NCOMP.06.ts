import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";
import { numeralItem } from "#src/inventories/index";

export const C1_NCOMP_06_IDENTITY: SkillIdentity = {
  code: "C1.NCOMP.06",
  strand_code: "C1.NCOMP",
  competency_code: "C1",
  name: "Tách số 7",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["solve"],
  tier: "core",
  prerequisites: ["C1.NCOMP.05"],
  learning_objectives: [
    {
      code: "LO-C1.NCOMP.06-01",
      behaviour: "Nhận biết và thực hành Tách số 7 ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.NCOMP.06-02",
      behaviour: "Vận dụng Tách số 7 trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.NCOMP.06-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Tách số 7",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_NCOMP_06_DATASET: SkillDataset = {
  skill_code: "C1.NCOMP.06",
  concept_label: "Tách số 7",
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
      description: "Làm quen cơ bản với tách số 7",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng tách số 7",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt tách số 7 với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi tách số 7",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục tách số 7 và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Thêm mấy nữa thì đủ 7 hả bé?",
    narration_template: "Chúng mình cùng tìm hiểu về Tách số 7 nhé",
  },
  ordering: ["n0", "n1", "n2", "n3", "n4", "n5", "n6", "n7"],
};

export const C1_NCOMP_06_SEED: SkillSeed = {
  identity: C1_NCOMP_06_IDENTITY,
  dataset: C1_NCOMP_06_DATASET,
  levels: [
    {
      code: "GL-C1-NCOMP-PICT-0006",
      template: "GT-031",
      band: "5-6",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-PICT-0007",
      template: "GT-031",
      band: "5-6",
      difficulty: 3,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-PICT-0008",
      template: "GT-031",
      band: "5-6",
      difficulty: 4,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-PICT-0009",
      template: "GT-031",
      band: "5-6",
      difficulty: 2,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-PICT-0010",
      template: "GT-031",
      band: "5-6",
      difficulty: 3,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-TAP-0026",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-TAP-0027",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-TAP-0028",
      template: "GT-001",
      band: "4-5",
      difficulty: 4,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-TAP-0029",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-TAP-0030",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-TCMP-0026",
      template: "GT-003",
      band: "4-5",
      difficulty: 2,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-TCMP-0027",
      template: "GT-003",
      band: "4-5",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-TCMP-0028",
      template: "GT-003",
      band: "4-5",
      difficulty: 4,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-TCMP-0029",
      template: "GT-003",
      band: "4-5",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-TCMP-0030",
      template: "GT-003",
      band: "4-5",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-PATT-0006",
      template: "GT-005",
      band: "4-5",
      difficulty: 2,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-PATT-0007",
      template: "GT-005",
      band: "4-5",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-PATT-0008",
      template: "GT-005",
      band: "4-5",
      difficulty: 4,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-PATT-0009",
      template: "GT-005",
      band: "4-5",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-PATT-0010",
      template: "GT-005",
      band: "4-5",
      difficulty: 3,
      theme: "body",
      rounds: 3,
    },
  ],
};
