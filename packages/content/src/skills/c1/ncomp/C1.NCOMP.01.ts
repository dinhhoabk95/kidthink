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
      label: "số 0",
      image: {
        kind: "emoji",
        ref: "⚪",
      },
      contrast_group: "quantity",
      category: {
        type: "tách số hai",
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
        type: "tách số hai",
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
        type: "tách số hai",
        role: "tổng",
      },
    }),
    numeralItem("n3", {
      image: {
        kind: "emoji",
        ref: "🍊",
      },
      contrast_group: "quantity",
      category: {
        type: "tách số hai",
        role: "phần",
      },
    }),
    {
      id: "wb07_apple_single",
      label: "một quả táo đỏ",
      glyph: "🍎",
      value: 1,
      contrast_group: "orchard_fruit",
      ordering: 5,
      image: { kind: "emoji", ref: "🍎" },
      category: { type: "nhánh quả con", role: "phần" },
    },
    {
      id: "wb07_apple_pair",
      label: "hai quả táo đỏ",
      glyph: "🍎🍎",
      value: 2,
      contrast_group: "orchard_fruit",
      ordering: 6,
      image: { kind: "emoji", ref: "🍎" },
      category: { type: "giỏ tổng", role: "tổng" },
    },
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
    {
      type: "subset",
      source_id: "wb07_apple_single",
      target_id: "wb07_apple_pair",
      metadata: {
        bond_id: "wb07_bond_2_1_1",
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
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với tách số 2",
      representation: "discrete-object",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng tách số 2",
      representation: "discrete-object",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt tách số 2 với phương án nhiễu",
      representation: "ten-frame",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi tách số 2",
      representation: "ten-frame",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục tách số 2 và tự làm một mình",
      representation: "ten-frame",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn {label} nhé!",
    narration_template: "Chúng mình cùng tìm hiểu về Tách số 2 nhé",
  },
  ordering: ["n0", "n1", "n2", "n3", "wb07_apple_single", "wb07_apple_pair"],
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
    },
    {
      code: "GL-C1-ORD-SLOT-0008",
      template: "GT-008",
      band: "5-6",
      difficulty: 2,
      theme: "art",
      rounds: 3,
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
      code: "GL-C1-NCOMP-BSK-0181",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      access_tier: "free",
      theme: "nature",
      rounds: 3,
      montessori_ref: "WB07-D1",
    },
    {
      code: "GL-C1-NCOMP-BOND-0181",
      template: "GT-007",
      band: "3-4",
      difficulty: 1,
      access_tier: "free",
      theme: "nature",
      rounds: 3,
      montessori_ref: "WB07-D1",
    },
  ],
};
