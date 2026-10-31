import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";
import { numeralItem } from "#src/inventories/index";

export const C1_NREC_09_IDENTITY: SkillIdentity = {
  code: "C1.NREC.09",
  strand_code: "C1.NREC",
  competency_code: "C1",
  name: "Thứ tự số",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["sequence"],
  tier: "basic",
  prerequisites: ["C1.NREC.03"],
  learning_objectives: [
    {
      code: "LO-C1.NREC.09-01",
      behaviour: "Nhận biết và thực hành Thứ tự số ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.NREC.09-02",
      behaviour: "Vận dụng Thứ tự số trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.NREC.09-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Thứ tự số",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_NREC_09_DATASET: SkillDataset = {
  skill_code: "C1.NREC.09",
  concept_label: "Thứ tự số",
  surface: "game",
  items: [
    numeralItem("n0", {
      label: "số 0",
      image: {
        kind: "emoji",
        ref: "🪹",
      },
      category: {
        type: "số đứng đầu",
      },
      contrast_group: "numeral_order",
    }),
    numeralItem("n1", {
      image: {
        kind: "emoji",
        ref: "🐣",
      },
      category: {
        type: "số đứng đầu",
      },
      contrast_group: "numeral_order",
    }),
    numeralItem("n2", {
      image: {
        kind: "emoji",
        ref: "🦆",
      },
      category: {
        type: "số đứng đầu",
      },
      contrast_group: "numeral_order",
    }),
    numeralItem("n3", {
      image: {
        kind: "emoji",
        ref: "🐐",
      },
      category: {
        type: "số đứng sau",
      },
      contrast_group: "numeral_order",
    }),
    numeralItem("n4", {
      image: {
        kind: "emoji",
        ref: "🐑",
      },
      category: {
        type: "số đứng sau",
      },
      contrast_group: "numeral_order",
    }),
    numeralItem("n5", {
      image: {
        kind: "emoji",
        ref: "🐘",
      },
      category: {
        type: "số đứng sau",
      },
      contrast_group: "numeral_order",
    }),
    numeralItem("n6", {
      image: {
        kind: "emoji",
        ref: "🦒",
      },
      category: {
        type: "số đứng sau",
      },
      contrast_group: "numeral_order",
    }),
    numeralItem("n7", {
      image: {
        kind: "emoji",
        ref: "🦓",
      },
      category: {
        type: "số đứng sau",
      },
      contrast_group: "numeral_order",
    }),
    numeralItem("n8", {
      image: {
        kind: "emoji",
        ref: "🦘",
      },
      category: {
        type: "số đứng sau",
      },
      contrast_group: "numeral_order",
    }),
    numeralItem("n9", {
      image: {
        kind: "emoji",
        ref: "🐅",
      },
      category: {
        type: "số đứng sau",
      },
      contrast_group: "numeral_order",
    }),
    numeralItem("n10", {
      image: {
        kind: "emoji",
        ref: "🦁",
      },
      category: {
        type: "số đứng sau",
      },
      contrast_group: "numeral_order",
    }),
    {
      id: "item_pumpkin_01",
      label: "quả bí ngô",
      glyph: "1",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🎃",
      },
      category: {
        type: "rau củ",
        place: "ruộng bí",
      },
    },
    {
      id: "item_lilypad_01",
      label: "lá hoa súng",
      glyph: "1",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🪷",
      },
      category: {
        type: "thực vật thủy sinh",
        place: "hồ nước",
      },
    },
    {
      id: "item_melon_01",
      label: "quả dưa lê",
      glyph: "1",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🍈",
      },
      category: {
        type: "hoa quả",
        place: "nông trại",
      },
    },
    {
      id: "dest_rainbow",
      label: "cầu vồng rực rỡ",
      glyph: "10",
      value: 10,
      image: {
        kind: "emoji",
        ref: "🌈",
      },
      category: {
        type: "đích đến",
        place: "bầu trời",
      },
    },
    {
      id: "dest_star",
      label: "ngôi sao sáng",
      glyph: "10",
      value: 10,
      image: {
        kind: "emoji",
        ref: "⭐",
      },
      category: {
        type: "đích đến",
        place: "vũ trụ",
      },
    },
    {
      id: "dest_flower_garden",
      label: "vườn hoa hướng dương",
      glyph: "10",
      value: 10,
      image: {
        kind: "emoji",
        ref: "🌻",
      },
      category: {
        type: "đích đến",
        place: "khu vườn",
      },
    },
    {
      id: "dest_station",
      label: "nhà ga xe lửa",
      glyph: "10",
      value: 10,
      image: {
        kind: "emoji",
        ref: "🚉",
      },
      category: {
        type: "đích đến",
        place: "thành phố",
      },
    },
    {
      id: "dest_gift_chest",
      label: "hộp quà bất ngờ",
      glyph: "10",
      value: 10,
      image: {
        kind: "emoji",
        ref: "🎁",
      },
      category: {
        type: "đích đến",
        place: "lễ hội",
      },
    },
  ],
  relations: [
    {
      type: "sequence",
      source_id: "n0",
      target_id: "n1",
    },
    {
      type: "sequence",
      source_id: "n1",
      target_id: "n2",
    },
    {
      type: "sequence",
      source_id: "n2",
      target_id: "n3",
    },
    {
      type: "sequence",
      source_id: "n3",
      target_id: "n4",
    },
    {
      type: "sequence",
      source_id: "n4",
      target_id: "n5",
    },
    {
      type: "sequence",
      source_id: "n5",
      target_id: "n6",
    },
    {
      type: "sequence",
      source_id: "n6",
      target_id: "n7",
    },
    {
      type: "sequence",
      source_id: "n7",
      target_id: "n8",
    },
    {
      type: "sequence",
      source_id: "n8",
      target_id: "n9",
    },
    {
      type: "sequence",
      source_id: "n9",
      target_id: "n10",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với thứ tự số",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng thứ tự số",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt thứ tự số với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi thứ tự số",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục thứ tự số và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn đúng {label} nhé!",
    narration_template: "Chúng mình cùng điền số tiếp theo vào dãy số nhé",
  },
  ordering: ["n0", "n1", "n2", "n3", "n4", "n5", "n6", "n7", "n8", "n9", "n10"],
};

export const C1_NREC_09_SEED: SkillSeed = {
  identity: C1_NREC_09_IDENTITY,
  dataset: C1_NREC_09_DATASET,
  levels: [
    {
      template: "GT-000",
      band: "4-5",
      difficulty: 1,
      access_tier: "free",
      theme: "school",
    },
    {
      code: "GL-C1-NREC-CARD-0107",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      access_tier: "free",
      theme: "vehicle",
      rounds: 3,
      montessori_ref: "WB02-D1",
    },
    {
      code: "GL-C1-NREC-CARD-0108",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      access_tier: "login",
      theme: "school",
      rounds: 3,
      montessori_ref: "WB02-D1",
    },
    {
      code: "GL-C1-SEQ-PAT-0109",
      template: "GT-006",
      band: "5-6",
      difficulty: 1,
      access_tier: "free",
      theme: "vehicle",
      rounds: 3,
      montessori_ref: "WB02-D3",
    },
    {
      code: "GL-C1-SEQ-PAT-0110",
      template: "GT-006",
      band: "5-6",
      difficulty: 2,
      access_tier: "login",
      theme: "school",
      rounds: 3,
      montessori_ref: "WB02-D3",
    },
    {
      code: "GL-C1-SEQ-SLOT-0131",
      template: "GT-008",
      band: "3-4",
      difficulty: 2,
      access_tier: "login",
      theme: "vehicle",
      rounds: 3,
      montessori_ref: "WB02-D2",
    },
    {
      code: "GL-C1-SEQ-SLOT-0132",
      template: "GT-008",
      band: "3-4",
      difficulty: 3,
      access_tier: "standard",
      theme: "school",
      rounds: 3,
      montessori_ref: "WB02-D2",
    },
    {
      code: "GL-C1-NREC-SLOT-0101",
      template: "GT-008",
      band: "3-4",
      difficulty: 2,
      access_tier: "login",
      theme: "vehicle",
      rounds: 2,
      montessori_ref: "WB00-D3",
    },
    {
      code: "GL-C1-NREC-SLOT-0102",
      template: "GT-008",
      band: "3-4",
      difficulty: 2,
      access_tier: "login",
      theme: "nature",
      rounds: 2,
      montessori_ref: "WB02-D1",
    },
    {
      code: "GL-C1-NREC-SLOT-0116",
      template: "GT-008",
      band: "4-5",
      difficulty: 3,
      access_tier: "standard",
      theme: "food",
      rounds: 2,
      montessori_ref: "WB02-D1",
    },
    {
      code: "GL-C1-NREC-SLOT-0117",
      template: "GT-008",
      band: "4-5",
      difficulty: 3,
      access_tier: "standard",
      theme: "nature",
      rounds: 2,
      montessori_ref: "WB02-D1",
    },
    {
      code: "GL-C1-NREC-MAZE-0101",
      template: "GT-013",
      band: "4-5",
      difficulty: 3,
      access_tier: "standard",
      theme: "nature",
      rounds: 3,
      montessori_ref: "WB02-D2",
    },
    {
      code: "GL-C1-NREC-MAZE-0102",
      template: "GT-013",
      band: "4-5",
      difficulty: 4,
      access_tier: "premium",
      theme: "space",
      rounds: 3,
      montessori_ref: "WB02-D2",
    },
    {
      code: "GL-C1-NREC-MAZE-0103",
      template: "GT-013",
      band: "5-6",
      difficulty: 4,
      access_tier: "premium",
      theme: "garden",
      rounds: 3,
      montessori_ref: "WB02-D2",
    },
    {
      code: "GL-C1-NREC-MAZE-0104",
      template: "GT-013",
      band: "5-6",
      difficulty: 5,
      access_tier: "premium",
      theme: "festival",
      rounds: 3,
      montessori_ref: "WB02-D2",
    },
    {
      code: "GL-C1-NRC-BSK-0004",
      template: "GT-003",
      band: "4-5",
      difficulty: 1,
      access_tier: "free",
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C1-DOT-TRC-0006",
      template: "GT-024",
      band: "5-6",
      difficulty: 3,
      access_tier: "standard",
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-DOT-TRC-0007",
      template: "GT-024",
      band: "5-6",
      difficulty: 1,
      access_tier: "free",
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-DOT-TRC-0008",
      template: "GT-024",
      band: "5-6",
      difficulty: 2,
      access_tier: "login",
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-DOT-TRC-0009",
      template: "GT-024",
      band: "5-6",
      difficulty: 3,
      access_tier: "standard",
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-NREC-MAZE-0001",
      template: "GT-013",
      band: "4-5",
      difficulty: 1,
      access_tier: "free",
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-NREC-MAZE-0004",
      template: "GT-013",
      band: "4-5",
      difficulty: 1,
      access_tier: "free",
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-NREC-BOND-0001",
      template: "GT-018",
      band: "4-5",
      difficulty: 1,
      access_tier: "free",
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-NREC-BOND-0004",
      template: "GT-018",
      band: "4-5",
      difficulty: 1,
      access_tier: "free",
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-NREC-MTRX-0001",
      template: "GT-023",
      band: "4-5",
      difficulty: 1,
      access_tier: "free",
      theme: "homeland",
      rounds: 3,
    },
  ],
};
