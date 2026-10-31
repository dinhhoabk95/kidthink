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
      label: "số 0",
      image: {
        kind: "emoji",
        ref: "⚪",
      },
      contrast_group: "quantity",
      category: {
        type: "nhóm gộp số",
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
        type: "nhóm gộp số",
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
        type: "nhóm gộp số",
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
        type: "nhóm gộp số",
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
        type: "nhóm gộp số",
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
        type: "nhóm gộp số",
        role: "tổng",
      },
    }),
    {
      id: "wb08_orange_gear",
      label: "hai bánh răng cơ khí cam",
      glyph: "⚙️⚙️",
      value: 2,
      contrast_group: "cipher_gear",
      ordering: 7,
      image: { kind: "emoji", ref: "⚙️" },
      category: { type: "bánh răng cơ khí", role: "phần" },
    },
    {
      id: "wb08_blue_gear",
      label: "năm bánh răng cơ khí lam",
      glyph: "🥏🥏🥏🥏🥏",
      value: 5,
      contrast_group: "cipher_gear",
      ordering: 8,
      image: { kind: "emoji", ref: "🥏" },
      category: { type: "bánh răng cơ khí", role: "phần" },
    },
    {
      id: "wb08_total_gears",
      label: "bảy bánh răng tổng",
      glyph: "⚙️⚙️⚙️⚙️⚙️⚙️⚙️",
      value: 7,
      contrast_group: "cipher_gear",
      ordering: 9,
      image: { kind: "emoji", ref: "⚙️" },
      category: { type: "nhóm gộp số", role: "tổng" },
    },
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
    {
      type: "subset",
      source_id: "wb08_orange_gear",
      target_id: "wb08_total_gears",
      metadata: {
        bond_id: "wb08_bond_7_2_5",
        part_a: 2,
        part_b: 5,
        whole: 7,
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
      description: "Làm quen cơ bản với gộp số",
      representation: "discrete-object",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng gộp số",
      representation: "discrete-object",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt gộp số với phương án nhiễu",
      representation: "ten-frame",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi gộp số",
      representation: "ten-frame",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục gộp số và tự làm một mình",
      representation: "ten-frame",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn {label} nhé!",
    narration_template: "Chúng mình cùng tìm hiểu về Gộp số nhé",
  },
  ordering: [
    "n0",
    "n1",
    "n2",
    "n3",
    "n4",
    "n5",
    "wb08_orange_gear",
    "wb08_blue_gear",
    "wb08_total_gears",
  ],
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
      theme: "school",
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
      code: "GL-C1-NCOMP-SLOT-0183",
      template: "GT-008",
      band: "4-5",
      difficulty: 1,
      access_tier: "free",
      theme: "art",
      rounds: 3,
      montessori_ref: "WB08-D2",
    },
    {
      code: "GL-C1-NCOMP-BOND-0187",
      template: "GT-007",
      band: "4-5",
      difficulty: 2,
      access_tier: "login",
      theme: "school",
      rounds: 3,
      montessori_ref: "WB08-D3",
    },
  ],
};
