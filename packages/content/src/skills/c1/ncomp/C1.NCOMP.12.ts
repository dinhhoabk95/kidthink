import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";
import { numeralItem } from "#src/inventories/index";

export const C1_NCOMP_12_IDENTITY: SkillIdentity = {
  code: "C1.NCOMP.12",
  strand_code: "C1.NCOMP",
  competency_code: "C1",
  name: "Tách gộp số",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["infer", "solve"],
  tier: "advanced",
  prerequisites: ["C1.NCOMP.11"],
  learning_objectives: [
    {
      code: "LO-C1.NCOMP.12-01",
      behaviour: "Nhận biết và thực hành Number Bond ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.NCOMP.12-02",
      behaviour: "Vận dụng Number Bond trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.NCOMP.12-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Number Bond",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_NCOMP_12_DATASET: SkillDataset = {
  skill_code: "C1.NCOMP.12",
  concept_label: "Tách gộp số",
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
        type: "tách gộp số",
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
        type: "tách gộp số",
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
        type: "tách gộp số",
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
        type: "tách gộp số",
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
        type: "tách gộp số",
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
        type: "tách gộp số",
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
        type: "tách gộp số",
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
        type: "tách gộp số",
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
        type: "tách gộp số",
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
        type: "tách gộp số",
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
        type: "tách gộp số",
        role: "tổng",
      },
    }),
    {
      id: "wb08_purple_key",
      label: "ba chìa khóa tím nhỏ",
      glyph: "🔑🔑🔑",
      value: 3,
      contrast_group: "cipher_key",
      ordering: 12,
      image: { kind: "emoji", ref: "🔑" },
      category: { type: "chìa khóa mật", role: "phần" },
    },
    {
      id: "wb08_gold_key",
      label: "bảy chìa khóa vàng lớn",
      glyph: "🗝️🗝️🗝️🗝️🗝️🗝️🗝️",
      value: 7,
      contrast_group: "cipher_key",
      ordering: 13,
      image: { kind: "emoji", ref: "🗝️" },
      category: { type: "chìa khóa mật", role: "phần" },
    },
    {
      id: "wb08_reasoning_gem",
      label: "Viên Ngọc Suy Luận mười cánh",
      glyph: "💠",
      value: 10,
      contrast_group: "cipher_badge",
      ordering: 14,
      image: { kind: "emoji", ref: "💠" },
      category: { type: "tách gộp số", role: "tổng" },
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
    {
      type: "subset",
      source_id: "wb08_purple_key",
      target_id: "wb08_reasoning_gem",
      metadata: {
        bond_id: "wb08_bond_10_7_3",
        part_a: 7,
        part_b: 3,
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
      description: "Làm quen cơ bản với tách gộp số",
      representation: "discrete-object",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng tách gộp số",
      representation: "discrete-object",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt tách gộp số với phương án nhiễu",
      representation: "ten-frame",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi tách gộp số",
      representation: "ten-frame",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục tách gộp số và tự làm một mình",
      representation: "ten-frame",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn {label} nhé!",
    narration_template: "Chúng mình cùng tìm hiểu về Tách gộp số nhé",
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
    "wb08_purple_key",
    "wb08_gold_key",
    "wb08_reasoning_gem",
  ],
};

export const C1_NCOMP_12_SEED: SkillSeed = {
  identity: C1_NCOMP_12_IDENTITY,
  dataset: C1_NCOMP_12_DATASET,
  levels: [
    {
      code: "GL-C1-QNT-TAP-0005",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-CNT-BSK-0010",
      template: "GT-003",
      band: "5-6",
      difficulty: 1,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-SWT-0001",
      template: "GT-027",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-BOND-0188",
      template: "GT-007",
      band: "4-5",
      difficulty: 3,
      access_tier: "standard",
      theme: "school",
      rounds: 3,
      montessori_ref: "WB08-D1",
    },
    {
      code: "GL-C1-NCOMP-SLOT-0184",
      template: "GT-008",
      band: "4-5",
      difficulty: 3,
      access_tier: "standard",
      theme: "vehicle",
      rounds: 3,
      montessori_ref: "WB08-D1",
    },
  ],
};
