import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";
import { numeralItem } from "#src/inventories/index";

export const C1_NCOMP_09_IDENTITY: SkillIdentity = {
  code: "C1.NCOMP.09",
  strand_code: "C1.NCOMP",
  competency_code: "C1",
  name: "Tách số 10",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["solve"],
  tier: "advanced",
  prerequisites: ["C1.NCOMP.08"],
  learning_objectives: [
    {
      code: "LO-C1.NCOMP.09-01",
      behaviour: "Nhận biết và thực hành Tách số 10 ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.NCOMP.09-02",
      behaviour: "Vận dụng Tách số 10 trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.NCOMP.09-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Tách số 10",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_NCOMP_09_DATASET: SkillDataset = {
  skill_code: "C1.NCOMP.09",
  concept_label: "Tách số 10",
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
        type: "tách số mười",
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
        type: "tách số mười",
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
        type: "tách số mười",
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
        type: "tách số mười",
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
        type: "tách số mười",
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
        type: "tách số mười",
        role: "phần",
      },
    }),
    numeralItem("n6", {
      image: {
        kind: "emoji",
        ref: "🍇",
      },
      contrast_group: "quantity",
      category: {
        type: "tách số mười",
        role: "phần",
      },
    }),
    numeralItem("n7", {
      image: {
        kind: "emoji",
        ref: "🍉",
      },
      contrast_group: "quantity",
      category: {
        type: "tách số mười",
        role: "phần",
      },
    }),
    numeralItem("n8", {
      image: {
        kind: "emoji",
        ref: "🍒",
      },
      contrast_group: "quantity",
      category: {
        type: "tách số mười",
        role: "phần",
      },
    }),
    numeralItem("n9", {
      image: {
        kind: "emoji",
        ref: "🍑",
      },
      contrast_group: "quantity",
      category: {
        type: "tách số mười",
        role: "phần",
      },
    }),
    numeralItem("n10", {
      image: {
        kind: "emoji",
        ref: "🥭",
      },
      contrast_group: "quantity",
      category: {
        type: "tách số mười",
        role: "tổng",
      },
    }),
    {
      id: "wb13_magnifying_glass",
      label: "kính lúp điều tra",
      value: 10,
      image: {
        kind: "emoji",
        ref: "🔍",
      },
    },
    {
      id: "wb13_case_clipboard",
      label: "kẹp hồ sơ phá án",
      value: 10,
      image: {
        kind: "emoji",
        ref: "📋",
      },
    },
    {
      id: "wb13_golden_pin",
      label: "ghim vàng manh mối",
      value: 10,
      image: {
        kind: "emoji",
        ref: "📌",
      },
    },
    {
      id: "wb13_ten_milestone",
      label: "mốc tròn mười thám tử",
      value: 10,
      image: {
        kind: "emoji",
        ref: "🔟",
      },
    },
    {
      id: "wb13_arithmetic_gem",
      label: "viên ngọc số học",
      value: 10,
      image: {
        kind: "emoji",
        ref: "💎",
      },
    },
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
  axes: {
    role: {
      values: ["phần", "tổng"],
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với tách số 10",
      representation: "discrete-object",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng tách số 10",
      representation: "discrete-object",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt tách số 10 với phương án nhiễu",
      representation: "ten-frame",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi tách số 10",
      representation: "ten-frame",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục tách số 10 và tự làm một mình",
      representation: "ten-frame",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn {label} nhé!",
    narration_template: "Chúng mình cùng tìm hiểu về Tách số 10 nhé",
  },
  ordering: [
    "n0",
    "n1",
    "n2",
    "n3",
    "n4",
    "n5",
    "n6",
    "n7",
    "n8",
    "n9",
    "n10",
    "wb13_magnifying_glass",
    "wb13_case_clipboard",
    "wb13_golden_pin",
    "wb13_ten_milestone",
    "wb13_arithmetic_gem",
  ],
};

export const C1_NCOMP_09_SEED: SkillSeed = {
  identity: C1_NCOMP_09_IDENTITY,
  dataset: C1_NCOMP_09_DATASET,
  levels: [
    {
      code: "GL-C1-NCOMP-BOND-0127",
      template: "GT-007",
      band: "4-5",
      difficulty: 2,
      access_tier: "login",
      theme: "home",
      rounds: 3,
      montessori_ref: "WB08-D1",
    },
    {
      code: "GL-C1-NCOMP-BOND-0128",
      template: "GT-007",
      band: "4-5",
      difficulty: 3,
      access_tier: "standard",
      theme: "school",
      rounds: 3,
      montessori_ref: "WB08-D1",
    },
    {
      code: "GL-C1-NCOMP-BOND-0129",
      template: "GT-007",
      band: "5-6",
      difficulty: 3,
      access_tier: "standard",
      theme: "farm",
      rounds: 3,
      montessori_ref: "WB13-D1",
    },
    {
      code: "GL-C1-NCOMP-BOND-0130",
      template: "GT-007",
      band: "5-6",
      difficulty: 4,
      access_tier: "premium",
      theme: "nature",
      rounds: 3,
      montessori_ref: "WB13-D1",
    },
    {
      code: "GL-C1-NCOMP-PICT-0021",
      template: "GT-031",
      band: "5-6",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-CONT-0201",
      template: "GT-003",
      band: "4-5",
      difficulty: 2,
      access_tier: "login",
      theme: "job",
      rounds: 3,
      montessori_ref: "WB13-D1",
    },
    {
      code: "GL-C1-NCOMP-SLOT-0206",
      template: "GT-008",
      band: "5-6",
      difficulty: 3,
      access_tier: "standard",
      theme: "job",
      rounds: 3,
      montessori_ref: "WB13-D2",
    },
  ],
};
