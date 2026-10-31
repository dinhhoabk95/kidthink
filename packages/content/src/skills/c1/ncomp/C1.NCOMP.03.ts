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
      label: "số 0",
      image: {
        kind: "emoji",
        ref: "⚪",
      },
      contrast_group: "quantity",
      category: {
        type: "tách số bốn",
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
        type: "tách số bốn",
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
        type: "tách số bốn",
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
        type: "tách số bốn",
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
        type: "tách số bốn",
        role: "tổng",
      },
    }),
    {
      id: "wb07_orange_pair",
      label: "hai quả cam vàng",
      glyph: "🍊🍊",
      value: 2,
      contrast_group: "citrus_grove",
      ordering: 6,
      image: { kind: "emoji", ref: "🍊" },
      category: { type: "nhánh quả con", role: "phần" },
    },
    {
      id: "wb07_pear_single",
      label: "một quả lê xanh",
      glyph: "🍐",
      value: 1,
      contrast_group: "citrus_grove",
      ordering: 7,
      image: { kind: "emoji", ref: "🍐" },
      category: { type: "nhánh quả con", role: "phần" },
    },
    {
      id: "wb07_pear_trio",
      label: "ba quả lê xanh",
      glyph: "🍐🍐🍐",
      value: 3,
      contrast_group: "citrus_grove",
      ordering: 8,
      image: { kind: "emoji", ref: "🍐" },
      category: { type: "nhánh quả con", role: "phần" },
    },
    {
      id: "wb07_orange_quad",
      label: "bốn quả cam vàng",
      glyph: "🍊🍊🍊🍊",
      value: 4,
      contrast_group: "citrus_grove",
      ordering: 9,
      image: { kind: "emoji", ref: "🍊" },
      category: { type: "giỏ tổng", role: "tổng" },
    },
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
    {
      type: "subset",
      source_id: "wb07_orange_pair",
      target_id: "wb07_orange_quad",
      metadata: {
        bond_id: "wb07_bond_4_2_2",
        part_a: 2,
        part_b: 2,
        whole: 4,
      },
    },
    {
      type: "subset",
      source_id: "wb07_pear_single",
      target_id: "wb07_orange_quad",
      metadata: {
        bond_id: "wb07_bond_4_1_3",
        part_a: 1,
        part_b: 3,
        whole: 4,
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
      description: "Làm quen cơ bản với tách số 4",
      representation: "discrete-object",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng tách số 4",
      representation: "discrete-object",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt tách số 4 với phương án nhiễu",
      representation: "ten-frame",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi tách số 4",
      representation: "ten-frame",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục tách số 4 và tự làm một mình",
      representation: "ten-frame",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn {label} nhé!",
    narration_template: "Chúng mình cùng tìm hiểu về Tách số 4 nhé",
  },
  ordering: [
    "n0",
    "n1",
    "n2",
    "n3",
    "n4",
    "wb07_orange_pair",
    "wb07_pear_single",
    "wb07_pear_trio",
    "wb07_orange_quad",
  ],
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
      code: "GL-C1-NCOMP-TCNT-0011",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-BSK-0183",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      access_tier: "login",
      theme: "nature",
      rounds: 3,
      montessori_ref: "WB07-D1",
    },
    {
      code: "GL-C1-NCOMP-BOND-0183",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      access_tier: "login",
      theme: "nature",
      rounds: 3,
      montessori_ref: "WB07-D2",
    },
    {
      code: "GL-C1-NCOMP-SLOT-0181",
      template: "GT-008",
      band: "3-4",
      difficulty: 3,
      access_tier: "standard",
      theme: "vehicle",
      rounds: 3,
      montessori_ref: "WB07-D3",
    },
  ],
};
