import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";
import { numeralItem } from "#src/inventories/index";

export const C1_NCOMP_04_IDENTITY: SkillIdentity = {
  code: "C1.NCOMP.04",
  strand_code: "C1.NCOMP",
  competency_code: "C1",
  name: "Tách số 5",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["solve"],
  tier: "core",
  prerequisites: ["C1.NCOMP.03"],
  learning_objectives: [
    {
      code: "LO-C1.NCOMP.04-01",
      behaviour: "Nhận biết và thực hành Tách số 5 ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.NCOMP.04-02",
      behaviour: "Vận dụng Tách số 5 trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.NCOMP.04-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Tách số 5",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_NCOMP_04_DATASET: SkillDataset = {
  skill_code: "C1.NCOMP.04",
  concept_label: "Tách số 5",
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
        type: "tách số năm",
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
        type: "tách số năm",
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
        type: "tách số năm",
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
        type: "tách số năm",
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
        type: "tách số năm",
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
        type: "tách số năm",
        role: "tổng",
      },
    }),
    {
      id: "wb07_watermelon_pair",
      label: "hai miếng dưa hấu",
      glyph: "🍉🍉",
      value: 2,
      contrast_group: "orchard_fruit",
      ordering: 7,
      image: { kind: "emoji", ref: "🍉" },
      category: { type: "nhánh quả con", role: "phần" },
    },
    {
      id: "wb07_watermelon_trio",
      label: "ba miếng dưa hấu",
      glyph: "🍉🍉🍉",
      value: 3,
      contrast_group: "orchard_fruit",
      ordering: 8,
      image: { kind: "emoji", ref: "🍉" },
      category: { type: "nhánh quả con", role: "phần" },
    },
    {
      id: "wb07_watermelon_basket_5",
      label: "năm miếng dưa hấu",
      glyph: "🍉🍉🍉🍉🍉",
      value: 5,
      contrast_group: "orchard_fruit",
      ordering: 9,
      image: { kind: "emoji", ref: "🍉" },
      category: { type: "giỏ tổng", role: "tổng" },
    },
    {
      id: "wb08_gold_star",
      label: "ngôi sao dẫn đường vàng",
      glyph: "⭐",
      value: 2,
      contrast_group: "cipher_star",
      ordering: 10,
      image: { kind: "emoji", ref: "⭐" },
      category: { type: "sao dẫn đường", role: "phần" },
    },
    {
      id: "wb08_padlock_brass",
      label: "ổ khóa số mạ đồng",
      glyph: "🔒",
      value: 5,
      contrast_group: "cipher_lock",
      ordering: 11,
      image: { kind: "emoji", ref: "🔒" },
      category: { type: "ổ khóa mục tiêu", role: "tổng" },
    },
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
    {
      type: "subset",
      source_id: "wb07_watermelon_pair",
      target_id: "wb07_watermelon_basket_5",
      metadata: {
        bond_id: "wb07_bond_5_2_3",
        part_a: 2,
        part_b: 3,
        whole: 5,
      },
    },
    {
      type: "subset",
      source_id: "wb08_gold_star",
      target_id: "wb08_padlock_brass",
      metadata: {
        bond_id: "wb08_bond_5_2_3",
        part_a: 2,
        part_b: 3,
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
      description: "Làm quen cơ bản với tách số 5",
      representation: "discrete-object",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng tách số 5",
      representation: "discrete-object",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt tách số 5 với phương án nhiễu",
      representation: "ten-frame",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi tách số 5",
      representation: "ten-frame",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục tách số 5 và tự làm một mình",
      representation: "ten-frame",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn {label} nhé!",
    narration_template: "Chúng mình cùng tìm hiểu về Tách số 5 nhé",
  },
  ordering: [
    "n0",
    "n1",
    "n2",
    "n3",
    "n4",
    "n5",
    "wb07_watermelon_pair",
    "wb07_watermelon_trio",
    "wb07_watermelon_basket_5",
    "wb08_gold_star",
    "wb08_padlock_brass",
  ],
};

export const C1_NCOMP_04_SEED: SkillSeed = {
  identity: C1_NCOMP_04_IDENTITY,
  dataset: C1_NCOMP_04_DATASET,
  levels: [
    {
      code: "GL-C1-NCOMP-BOND-0125",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "home",
      rounds: 3,
      montessori_ref: "WB07-D1",
    },
    {
      code: "GL-C1-NCOMP-BOND-0126",
      template: "GT-007",
      band: "3-4",
      difficulty: 3,
      theme: "school",
      rounds: 3,
      montessori_ref: "WB07-D1",
    },
    {
      code: "GL-C1-NCOMP-TAP-0016",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-BSK-0184",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      access_tier: "login",
      theme: "food",
      rounds: 3,
      montessori_ref: "WB07-D1",
    },
    {
      code: "GL-C1-NCOMP-BOND-0184",
      template: "GT-007",
      band: "3-4",
      difficulty: 3,
      access_tier: "standard",
      theme: "nature",
      rounds: 3,
      montessori_ref: "WB07-D2",
    },
    {
      code: "GL-C1-NCOMP-BOND-0185",
      template: "GT-007",
      band: "3-4",
      difficulty: 3,
      access_tier: "standard",
      theme: "farm",
      rounds: 3,
      montessori_ref: "WB07-D3",
    },
    {
      code: "GL-C1-NCOMP-SLOT-0182",
      template: "GT-008",
      band: "3-4",
      difficulty: 4,
      access_tier: "premium",
      theme: "vehicle",
      rounds: 3,
      montessori_ref: "WB07-D3",
    },
    {
      code: "GL-C1-NCOMP-BOND-0186",
      template: "GT-007",
      band: "4-5",
      difficulty: 2,
      access_tier: "login",
      theme: "school",
      rounds: 3,
      montessori_ref: "WB08-D1",
    },
    {
      code: "GL-C1-NCOMP-PAIR-0181",
      template: "GT-005",
      band: "4-5",
      difficulty: 2,
      access_tier: "login",
      theme: "school",
      rounds: 3,
      montessori_ref: "WB08-D3",
    },
  ],
};
