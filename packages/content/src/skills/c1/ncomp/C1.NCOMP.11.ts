import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";
import { numeralItem } from "#src/inventories/index";

export const C1_NCOMP_11_IDENTITY: SkillIdentity = {
  code: "C1.NCOMP.11",
  strand_code: "C1.NCOMP",
  competency_code: "C1",
  name: "Thành phần số",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["infer"],
  tier: "advanced",
  prerequisites: ["C1.NCOMP.09", "C1.NCOMP.10"],
  learning_objectives: [
    {
      code: "LO-C1.NCOMP.11-01",
      behaviour: "Nhận biết và thực hành Thành phần số ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.NCOMP.11-02",
      behaviour: "Vận dụng Thành phần số trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.NCOMP.11-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Thành phần số",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_NCOMP_11_DATASET: SkillDataset = {
  skill_code: "C1.NCOMP.11",
  concept_label: "Thành phần số",
  surface: "game",
  items: [
    numeralItem("n0", {
      label: "số 0",
      image: {
        kind: "emoji",
        ref: "⚪",
      },
      contrast_group: "quantity",
      category: {
        type: "thành phần số",
        role: "phần",
      },
    }),
    numeralItem("n1", {
      image: {
        kind: "emoji",
        ref: "🍎",
      },
      contrast_group: "quantity",
      category: {
        type: "thành phần số",
        role: "phần",
      },
    }),
    numeralItem("n2", {
      image: {
        kind: "emoji",
        ref: "🍐",
      },
      contrast_group: "quantity",
      category: {
        type: "thành phần số",
        role: "phần",
      },
    }),
    numeralItem("n3", {
      image: {
        kind: "emoji",
        ref: "🍊",
      },
      contrast_group: "quantity",
      category: {
        type: "thành phần số",
        role: "phần",
      },
    }),
    numeralItem("n4", {
      image: {
        kind: "emoji",
        ref: "🍋",
      },
      contrast_group: "quantity",
      category: {
        type: "thành phần số",
        role: "phần",
      },
    }),
    numeralItem("n5", {
      image: {
        kind: "emoji",
        ref: "🍓",
      },
      contrast_group: "quantity",
      category: {
        type: "thành phần số",
        role: "tổng",
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
  axes: {
    role: {
      values: ["phần", "tổng"],
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với thành phần số",
      representation: "discrete-object",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng thành phần số",
      representation: "discrete-object",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt thành phần số với phương án nhiễu",
      representation: "ten-frame",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi thành phần số",
      representation: "ten-frame",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục thành phần số và tự làm một mình",
      representation: "ten-frame",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn {label} nhé!",
    narration_template: "Chúng mình cùng tìm hiểu về Thành phần số nhé",
  },
  ordering: ["n0", "n1", "n2", "n3", "n4", "n5"],
};

export const C1_NCOMP_11_SEED: SkillSeed = {
  identity: C1_NCOMP_11_IDENTITY,
  dataset: C1_NCOMP_11_DATASET,
  levels: [
    {
      code: "GL-C1-BAL-EQN-0001",
      template: "GT-014",
      band: "5-6",
      difficulty: 1,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-BAL-EQN-0002",
      template: "GT-014",
      band: "5-6",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-BAL-EQN-0003",
      template: "GT-014",
      band: "5-6",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-SIZE-0001",
      template: "GT-009",
      band: "4-5",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
  ],
};
