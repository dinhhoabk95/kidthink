import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";
import { numeralItem } from "#src/inventories/index";

export const C1_NCOMP_02_IDENTITY: SkillIdentity = {
  code: "C1.NCOMP.02",
  strand_code: "C1.NCOMP",
  competency_code: "C1",
  name: "Tách số 3",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["solve"],
  tier: "basic",
  prerequisites: ["C1.NCOMP.01"],
  learning_objectives: [
    {
      code: "LO-C1.NCOMP.02-01",
      behaviour: "Nhận biết và thực hành Tách số 3 ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.NCOMP.02-02",
      behaviour: "Vận dụng Tách số 3 trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.NCOMP.02-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Tách số 3",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_NCOMP_02_DATASET: SkillDataset = {
  skill_code: "C1.NCOMP.02",
  concept_label: "Tách số 3",
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
        type: "tách số ba",
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
        type: "tách số ba",
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
        type: "tách số ba",
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
        type: "tách số ba",
        role: "tổng",
      },
    }),
    {
      id: "wb07_strawberry_single",
      label: "một quả dâu tây",
      glyph: "🍓",
      value: 1,
      contrast_group: "berry_grove",
      ordering: 5,
      image: { kind: "emoji", ref: "🍓" },
      category: { type: "nhánh quả con", role: "phần" },
    },
    {
      id: "wb07_strawberry_pair",
      label: "hai quả dâu tây",
      glyph: "🍓🍓",
      value: 2,
      contrast_group: "berry_grove",
      ordering: 6,
      image: { kind: "emoji", ref: "🍓" },
      category: { type: "nhánh quả con", role: "phần" },
    },
    {
      id: "wb07_strawberry_trio",
      label: "ba quả dâu tây",
      glyph: "🍓🍓🍓",
      value: 3,
      contrast_group: "berry_grove",
      ordering: 7,
      image: { kind: "emoji", ref: "🍓" },
      category: { type: "giỏ tổng", role: "tổng" },
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
      source_id: "wb07_strawberry_single",
      target_id: "wb07_strawberry_trio",
      metadata: {
        bond_id: "wb07_bond_3_1_2",
        part_a: 1,
        part_b: 2,
        whole: 3,
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
      description: "Làm quen cơ bản với tách số 3",
      representation: "discrete-object",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng tách số 3",
      representation: "discrete-object",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt tách số 3 với phương án nhiễu",
      representation: "ten-frame",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi tách số 3",
      representation: "ten-frame",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục tách số 3 và tự làm một mình",
      representation: "ten-frame",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn {label} nhé!",
    narration_template: "Chúng mình cùng tìm hiểu về Tách số 3 nhé",
  },
  ordering: [
    "n0",
    "n1",
    "n2",
    "n3",
    "wb07_strawberry_single",
    "wb07_strawberry_pair",
    "wb07_strawberry_trio",
  ],
};

export const C1_NCOMP_02_SEED: SkillSeed = {
  identity: C1_NCOMP_02_IDENTITY,
  dataset: C1_NCOMP_02_DATASET,
  levels: [
    {
      code: "GL-C1-ORD-SLOT-0009",
      template: "GT-008",
      band: "5-6",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-TAP-0006",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-TAP-0007",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-NCOMP-BSK-0182",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      access_tier: "free",
      theme: "food",
      rounds: 3,
      montessori_ref: "WB07-D1",
    },
    {
      code: "GL-C1-NCOMP-BOND-0182",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      access_tier: "login",
      theme: "food",
      rounds: 3,
      montessori_ref: "WB07-D2",
    },
  ],
};
