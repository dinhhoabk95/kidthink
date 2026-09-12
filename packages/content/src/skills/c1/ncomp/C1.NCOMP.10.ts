import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";
import { numeralItem } from "#src/inventories/index";

export const C1_NCOMP_10_IDENTITY: SkillIdentity = {
  code: "C1.NCOMP.10",
  strand_code: "C1.NCOMP",
  competency_code: "C1",
  name: "Gộp số",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["solve"],
  tier: "basic",
  prerequisites: ["C1.CNT.01"],
  learning_objectives: [
    {
      code: "LO-C1.NCOMP.10-01",
      behaviour: "Nhận biết và thực hành Gộp số ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.NCOMP.10-02",
      behaviour: "Vận dụng Gộp số trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.NCOMP.10-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Gộp số",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_NCOMP_10_DATASET: SkillDataset = {
  skill_code: "C1.NCOMP.10",
  concept_label: "Gộp số",
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
      target_id: "n3",
      metadata: {
        bond_id: "bond_3_0_3",
        part_a: 0,
        part_b: 3,
        whole: 3,
      },
    },
    {
      type: "subset",
      source_id: "n1",
      target_id: "n3",
      metadata: {
        bond_id: "bond_3_1_2",
        part_a: 1,
        part_b: 2,
        whole: 3,
      },
    },
    {
      type: "subset",
      source_id: "n2",
      target_id: "n3",
      metadata: {
        bond_id: "bond_3_2_1",
        part_a: 2,
        part_b: 1,
        whole: 3,
      },
    },
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
      description: "Làm quen cơ bản với gộp số",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng gộp số",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt gộp số với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi gộp số",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục gộp số và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Gộp hai nhóm lại thì được mấy hả bé?",
    narration_template: "Chúng mình cùng tìm hiểu về Gộp số nhé",
  },
  ordering: ["n0", "n1", "n2", "n3", "n4", "n5"],
};

export const C1_NCOMP_10_SEED: SkillSeed = {
  identity: C1_NCOMP_10_IDENTITY,
  dataset: C1_NCOMP_10_DATASET,
  levels: [
    {
      code: "GL-C1-NCOMP-TAP-0046",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-TAP-0047",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-TAP-0048",
      template: "GT-001",
      band: "3-4",
      difficulty: 3,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-TAP-0049",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-TAP-0050",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-TCNT-0021",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-TCNT-0022",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-TCNT-0023",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-TCNT-0024",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-TCNT-0025",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-TCMP-0046",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-TCMP-0047",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-TCMP-0048",
      template: "GT-003",
      band: "3-4",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-TCMP-0049",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-TCMP-0050",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-PAIR-0021",
      template: "GT-004",
      band: "4-5",
      difficulty: 1,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-PAIR-0022",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-PAIR-0023",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-PAIR-0024",
      template: "GT-004",
      band: "4-5",
      difficulty: 1,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-PAIR-0025",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "body",
      rounds: 3,
    },
  ],
};
