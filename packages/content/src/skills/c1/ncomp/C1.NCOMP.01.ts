import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";
import { numeralItem } from "#src/inventories/index";

export const C1_NCOMP_01_IDENTITY: SkillIdentity = {
  code: "C1.NCOMP.01",
  strand_code: "C1.NCOMP",
  competency_code: "C1",
  name: "Tách số 2",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["solve"],
  tier: "basic",
  prerequisites: ["C1.CNT.01"],
  learning_objectives: [
    {
      code: "LO-C1.NCOMP.01-01",
      behaviour: "Nhận biết và thực hành Tách số 2 ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.NCOMP.01-02",
      behaviour: "Vận dụng Tách số 2 trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.NCOMP.01-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Tách số 2",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_NCOMP_01_DATASET: SkillDataset = {
  skill_code: "C1.NCOMP.01",
  concept_label: "Tách số 2",
  surface: "game",
  items: [
    numeralItem("n0", {
      image: {
        kind: "emoji",
        ref: "0️⃣",
      },
      category: {
        role: "phần",
        parity: "chẵn",
      },
    }),
    numeralItem("n1", {
      image: {
        kind: "emoji",
        ref: "1️⃣",
      },
      category: {
        role: "phần",
        parity: "lẻ",
      },
    }),
    numeralItem("n2", {
      image: {
        kind: "emoji",
        ref: "2️⃣",
      },
      category: {
        role: "tổng",
        parity: "chẵn",
      },
    }),
    numeralItem("n3", {
      image: {
        kind: "emoji",
        ref: "3️⃣",
      },
      category: {
        role: "phần",
        parity: "lẻ",
      },
    }),
  ],
  relations: [
    {
      type: "subset",
      source_id: "n0",
      target_id: "n2",
      metadata: {
        bond_id: "bond_2_0_2",
        part_a: 0,
        part_b: 2,
        whole: 2,
      },
    },
    {
      type: "subset",
      source_id: "n1",
      target_id: "n2",
      metadata: {
        bond_id: "bond_2_1_1",
        part_a: 1,
        part_b: 1,
        whole: 2,
      },
    },
  ],
  axes: {
    role: {
      values: ["phần", "tổng"],
    },
    parity: {
      values: ["chẵn", "lẻ"],
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với tách số 2",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng tách số 2",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt tách số 2 với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi tách số 2",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục tách số 2 và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Thêm mấy nữa thì đủ 2 hả bé?",
    narration_template: "Chúng mình cùng tìm hiểu về Tách số 2 nhé",
  },
  ordering: ["n0", "n1", "n2", "n3"],
};

export const C1_NCOMP_01_SEED: SkillSeed = {
  identity: C1_NCOMP_01_IDENTITY,
  dataset: C1_NCOMP_01_DATASET,
  levels: [
    {
      code: "GL-C1-ORD-SLOT-0007",
      template: "GT-008",
      band: "4-5",
      difficulty: 1,
      theme: "vehicle",
      rounds: 3,
      legacy_v1_ref: "D1-05",
    },
    {
      code: "GL-C1-ORD-SLOT-0008",
      template: "GT-008",
      band: "5-6",
      difficulty: 2,
      theme: "art",
      rounds: 3,
      legacy_v1_ref: "D1-05",
    },
    {
      code: "GL-C1-NCOMP-TAP-0001",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-TAP-0002",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-TAP-0003",
      template: "GT-001",
      band: "3-4",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-TAP-0004",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-TAP-0005",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-TCNT-0001",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-TCNT-0002",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-TCNT-0003",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-TCNT-0004",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-TCNT-0005",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-TCMP-0001",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-TCMP-0002",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-TCMP-0003",
      template: "GT-003",
      band: "3-4",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-TCMP-0004",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-TCMP-0005",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-PAIR-0001",
      template: "GT-004",
      band: "4-5",
      difficulty: 1,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-PAIR-0002",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-PAIR-0003",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-PAIR-0004",
      template: "GT-004",
      band: "4-5",
      difficulty: 1,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-PAIR-0005",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "vehicle",
      rounds: 3,
    },
  ],
};
